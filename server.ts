import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import dotenv from 'dotenv';
import { initializeApp as initAdminApp, getApps as getAdminApps, cert as adminCert } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import {
  db,
  UPLOADS_DIR,
  hashPassword,
  verifyPassword,
  User,
  Article,
  Category,
  Product,
  MediaItem,
} from './server/db';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// ----------------------------------------------------
// CORS & PREFLIGHT HANDLING
// ----------------------------------------------------
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;

  if (origin && origin !== 'null') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, x-admin-token, Accept, Origin'
  );
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

// Express middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve uploaded media
app.use('/uploads', express.static(UPLOADS_DIR, {
  maxAge: '1d',
  immutable: false,
}));

// Health check for Cloud Run and external monitoring
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Mental Tactic API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Setup Multer for secure file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowed.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only JPG, JPEG, PNG, and WEBP images are supported.'));
    }
  },
});

// Authentication extraction helper
function getAuthToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const customHeader = req.headers['x-admin-token'];
  if (typeof customHeader === 'string') {
    return customHeader.trim();
  }
  return null;
}

// Authentication middleware for protected endpoints
function isUserAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  const configuredAdminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (configuredAdminEmail && user.email.toLowerCase() === configuredAdminEmail) {
    return true;
  }
  const adminAllowlist = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  if (adminAllowlist.length > 0 && adminAllowlist.includes(user.email.toLowerCase())) {
    return true;
  }
  return user.id === 'admin-master' || user.role === 'admin';
}

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = getAuthToken(req);
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Authentication required' });
    return;
  }

  const session = db.getSession(token);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized: Session invalid or expired' });
    return;
  }

  const user = db.getUserById(session.userId);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized: User account not found' });
    return;
  }

  if (!isUserAdmin(user)) {
    res.status(403).json({ error: 'Forbidden: Administrator privileges required' });
    return;
  }

  (req as any).user = user;
  (req as any).session = session;
  next();
}

// Optional Auth middleware (does not reject, but populates user if valid)
function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = getAuthToken(req);
  if (token) {
    const session = db.getSession(token);
    if (session) {
      const user = db.getUserById(session.userId);
      if (user) {
        (req as any).user = user;
        (req as any).session = session;
      }
    }
  }
  next();
}

// ----------------------------------------------------
// AUTH API
// ----------------------------------------------------

// Check initial status: whether an admin exists and if caller is authenticated
app.get('/api/auth/status', (req: Request, res: Response) => {
  const users = db.getUsers();
  const hasAdmin = users.length > 0;
  const token = getAuthToken(req);
  let isAuthenticated = false;
  let currentUser = null;

  if (token) {
    const session = db.getSession(token);
    if (session) {
      const user = db.getUserById(session.userId);
      if (user) {
        isAuthenticated = true;
        currentUser = {
          id: user.id,
          email: user.email,
          username: user.username,
          role: isUserAdmin(user) ? 'admin' : 'member',
          avatar: user.avatar || '',
        };
      }
    }
  }

  res.json({
    hasAdmin,
    isAuthenticated,
    user: currentUser,
  });
});

// Firebase Admin SDK Initialization
function initFirebaseAdmin() {
  const existingApps = getAdminApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  const projectId = (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    'mental-tactic'
  ).trim();
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim();
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').trim();
  const serviceAccount = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();

  try {
    if (serviceAccount) {
      const parsed = JSON.parse(serviceAccount);
      return initAdminApp({
        credential: adminCert(parsed),
        projectId: parsed.project_id || projectId || undefined,
      });
    }

    if (clientEmail && privateKey) {
      return initAdminApp({
        credential: adminCert({
          projectId: projectId || undefined,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        projectId: projectId || undefined,
      });
    }

    if (projectId) {
      return initAdminApp({
        projectId,
      });
    }
  } catch (err) {
    console.error('Firebase Admin initialization error:', err);
  }

  return null;
}

// Public auth configuration (Google Client ID & Firebase Web config)
app.get('/api/auth/config', (_req: Request, res: Response) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '',
    firebase: {
      apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyA55tYoT1YQUtei2jq6sY7vFgysPTf4xyU',
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || 'mental-tactic.firebaseapp.com',
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'mental-tactic',
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || 'mental-tactic.firebasestorage.app',
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '971212569399',
      appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '1:971212569399:web:6a50653c70474b4418f8b2',
      measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || '',
    },
  });
});

// Member self-registration for public website
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  if (!email || !password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ error: 'A valid email and password (minimum 6 characters) are required.' });
    return;
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    res.status(409).json({ error: 'An account with this email address already exists. Please log in.' });
    return;
  }

  const { hash, salt } = hashPassword(password);
  const now = new Date().toISOString();
  const newUser = db.createUser({
    id: crypto.randomUUID(),
    email: email.trim().toLowerCase(),
    username: (username || email.split('@')[0] || 'Member').trim(),
    passwordHash: hash,
    salt,
    role: 'member',
    createdAt: now,
    updatedAt: now,
  });

  const session = db.createSession(newUser.id);
  res.json({
    message: 'Account created successfully.',
    token: session.token,
    user: {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
    },
  });
});

// Firebase Google Authentication & Token Verification via Firebase Admin SDK
app.post('/api/auth/google', async (req: Request, res: Response) => {
  const { credential } = req.body;
  if (!credential || typeof credential !== 'string') {
    res.status(400).json({ error: 'Invalid Google credential token provided.' });
    return;
  }

  const firebaseApp = initFirebaseAdmin();
  if (!firebaseApp) {
    res.status(503).json({
      error: 'Firebase Admin SDK is not configured on the server. Please set FIREBASE_PROJECT_ID (or VITE_FIREBASE_PROJECT_ID) in environment variables.',
    });
    return;
  }

  try {
    // Cryptographically verify the Firebase ID token using Firebase Admin SDK
    const auth = getAdminAuth(firebaseApp);
    const decodedToken = await auth.verifyIdToken(credential);
    const googleId = decodedToken.uid;
    const email = decodedToken.email ? decodedToken.email.toLowerCase() : null;
    const name = decodedToken.name || (email ? email.split('@')[0] : 'Tactical Member');
    const picture = decodedToken.picture || '';

    if (!googleId || !email) {
      res.status(400).json({ error: 'Incomplete user profile received from Firebase Google authentication.' });
      return;
    }

    let user = db.getUserByGoogleId(googleId) || db.getUserByEmail(email);
    const now = new Date().toISOString();

    if (user) {
      db.updateUser(user.id, {
        googleId: user.googleId || googleId,
        avatar: picture || user.avatar,
        updatedAt: now,
      });
      // Re-fetch updated user
      user = db.getUserById(user.id) || user;
    } else {
      user = db.createUser({
        id: crypto.randomUUID(),
        email,
        username: name,
        googleId,
        avatar: picture,
        role: 'member',
        createdAt: now,
        updatedAt: now,
      });
    }

    const session = db.createSession(user.id);
    res.json({
      message: 'Google sign-in successful.',
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        role: isUserAdmin(user) ? 'admin' : 'member',
      },
    });
  } catch (err: any) {
    console.error('Failed to verify Firebase Google ID token:', err);
    res.status(401).json({
      error: 'Failed to verify Firebase Google token: ' + (err?.message || 'Invalid or expired token'),
    });
  }
});

// First-time setup: only allowed if no admin exists
app.post('/api/auth/setup', (req: Request, res: Response) => {
  const users = db.getUsers();
  if (users.length > 0) {
    res.status(403).json({ error: 'Administrator account already exists. Setup is locked.' });
    return;
  }

  const { email, username, password } = req.body;
  if (!email || !password || typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'A valid email and password (minimum 8 characters) are required.' });
    return;
  }

  const { hash, salt } = hashPassword(password);
  const now = new Date().toISOString();
  const newUser = db.createUser({
    id: crypto.randomUUID(),
    email: email.trim().toLowerCase(),
    username: (username || email.split('@')[0] || 'admin').trim(),
    passwordHash: hash,
    salt,
    createdAt: now,
    updatedAt: now,
  });

  const session = db.createSession(newUser.id);

  res.json({
    message: 'Master administrator account created successfully.',
    token: session.token,
    user: {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
    },
  });
});

// Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Invalid login credentials. Please provide both email and password.' });
    return;
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: 'Invalid login credentials.' });
    return;
  }

  if (!user.passwordHash || !user.salt) {
    res.status(401).json({ error: 'This account was registered using Google. Please sign in with Google.' });
    return;
  }

  const valid = verifyPassword(password, user.passwordHash, user.salt);
  if (!valid) {
    res.status(401).json({ error: 'Invalid login credentials.' });
    return;
  }

  const session = db.createSession(user.id);
  res.json({
    message: 'Login successful.',
    token: session.token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: isUserAdmin(user) ? 'admin' : 'member',
      avatar: user.avatar || '',
    },
  });
});

// Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = getAuthToken(req);
  if (token) {
    db.deleteSession(token);
  }
  res.json({ message: 'Logged out successfully.' });
});

// Change Password
app.post('/api/auth/change-password', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    return;
  }

  const valid = verifyPassword(currentPassword, user.passwordHash, user.salt);
  if (!valid) {
    res.status(400).json({ error: 'Current password is incorrect.' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);
  db.updateUserPassword(user.id, hash, salt);

  res.json({ message: 'Password updated successfully.' });
});

// ----------------------------------------------------
// DASHBOARD STATS API
// ----------------------------------------------------
app.get('/api/dashboard/stats', requireAuth, (_req: Request, res: Response) => {
  const articles = db.getArticles();
  const categories = db.getCategories();
  const media = db.getMedia();
  const products = db.getProducts();

  const totalArticles = articles.length;
  const publishedArticles = articles.filter(a => a.status === 'Published').length;
  const draftArticles = articles.filter(a => a.status === 'Draft').length;
  const totalCategories = categories.length;
  const totalMedia = media.length;
  const totalProducts = products.length;

  const recentArticles = [...articles]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  res.json({
    totalArticles,
    publishedArticles,
    draftArticles,
    categories: totalCategories,
    totalMedia,
    totalProducts,
    recentArticles,
  });
});

// ----------------------------------------------------
// ARTICLES API
// ----------------------------------------------------

// Helper to slugify
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// List articles
app.get('/api/articles', optionalAuth, (req: Request, res: Response) => {
  const isAdmin = !!(req as any).user;
  const { search, category, status, sort } = req.query;
  let articles = db.getArticles();

  // If public visitor (not authenticated admin), strictly return only Published articles
  if (!isAdmin) {
    articles = articles.filter(a => a.status === 'Published');
  } else if (status && (status === 'Draft' || status === 'Published')) {
    articles = articles.filter(a => a.status === status);
  }

  if (category && typeof category === 'string' && category.trim()) {
    articles = articles.filter(a => a.categoryId === category);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase();
    articles = articles.filter(
      a =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q)
    );
  }

  // Sort
  if (sort === 'oldest') {
    articles.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else {
    // Default newest
    articles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json({ articles });
});

// Get single article by slug or ID
app.get('/api/articles/:slugOrId', optionalAuth, (req: Request, res: Response) => {
  const isAdmin = !!(req as any).user;
  const param = req.params.slugOrId;

  let article = db.getArticleBySlug(param);
  if (!article) {
    article = db.getArticleById(param);
  }

  if (!article) {
    res.status(404).json({ error: 'Article not found.' });
    return;
  }

  // If public visitor and article is Draft, hide it!
  if (!isAdmin && article.status !== 'Published') {
    res.status(404).json({ error: 'Article not found.' });
    return;
  }

  res.json({ article });
});

// Create article
app.post('/api/articles', requireAuth, (req: Request, res: Response) => {
  const {
    title,
    slug: customSlug,
    description,
    content,
    featuredImage,
    categoryId,
    category,
    author,
    status,
    publishedAt,
    seoTitle,
    seoDescription,
  } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'Article title is required.' });
    return;
  }

  const rawSlug = customSlug && customSlug.trim() ? customSlug.trim() : slugify(title);
  const finalSlug = slugify(rawSlug);

  if (!finalSlug) {
    res.status(400).json({ error: 'A valid slug could not be generated. Please specify a slug.' });
    return;
  }

  // Check unique slug
  const existing = db.getArticleBySlug(finalSlug);
  if (existing) {
    res.status(400).json({ error: `An article with slug "${finalSlug}" already exists. Slugs must be unique.` });
    return;
  }

  const now = new Date().toISOString();
  const rawStatus = (status || 'Draft').toString().trim();
  const articleStatus: 'Draft' | 'Published' = rawStatus.toLowerCase() === 'published' ? 'Published' : 'Draft';
  const articlePublishedAt = articleStatus === 'Published' ? (publishedAt || now) : undefined;

  let resolvedCategoryName = '';
  let resolvedCategoryId = categoryId || undefined;
  if (categoryId) {
    const foundCat = db.getCategoryById(categoryId) || db.getCategoryBySlug(categoryId);
    if (foundCat) {
      resolvedCategoryName = foundCat.name;
      resolvedCategoryId = foundCat.id;
    } else {
      resolvedCategoryName = categoryId;
    }
  } else if (category && typeof category === 'string') {
    resolvedCategoryName = category.trim();
    const foundCat = db.getCategoryById(category) || db.getCategoryBySlug(category);
    if (foundCat) {
      resolvedCategoryId = foundCat.id;
      resolvedCategoryName = foundCat.name;
    }
  }

  const newArticle: Article = {
    id: crypto.randomUUID(),
    title: title.trim(),
    slug: finalSlug,
    description: (description || '').trim(),
    content: content || '',
    featuredImage: featuredImage || '',
    categoryId: resolvedCategoryId,
    category: resolvedCategoryName,
    author: (author || 'Mental Tactic').trim(),
    status: articleStatus,
    publishedAt: articlePublishedAt,
    createdAt: now,
    updatedAt: now,
    seoTitle: (seoTitle || title).trim(),
    seoDescription: (seoDescription || description || '').trim(),
  };

  db.saveArticle(newArticle);
  res.status(201).json({ message: 'Article created successfully.', article: newArticle });
});

// Update article
app.put('/api/articles/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = db.getArticleById(id);
  if (!existing) {
    res.status(404).json({ error: 'Article not found.' });
    return;
  }

  const {
    title,
    slug: customSlug,
    description,
    content,
    featuredImage,
    categoryId,
    category,
    author,
    status,
    publishedAt,
    seoTitle,
    seoDescription,
  } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'Article title is required.' });
    return;
  }

  const rawSlug = customSlug && customSlug.trim() ? customSlug.trim() : slugify(title);
  const finalSlug = slugify(rawSlug);

  if (!finalSlug) {
    res.status(400).json({ error: 'A valid slug could not be generated. Please specify a slug.' });
    return;
  }

  // Check unique slug against other articles
  const slugHolder = db.getArticleBySlug(finalSlug);
  if (slugHolder && slugHolder.id !== id) {
    res.status(400).json({ error: `An article with slug "${finalSlug}" already exists. Slugs must be unique.` });
    return;
  }

  const now = new Date().toISOString();
  const rawStatus = (status !== undefined ? status : existing.status).toString().trim();
  const newStatus: 'Draft' | 'Published' = rawStatus.toLowerCase() === 'published' ? 'Published' : 'Draft';
  let newPublishedAt = existing.publishedAt;
  if (newStatus === 'Published' && !existing.publishedAt) {
    newPublishedAt = publishedAt || now;
  } else if (publishedAt) {
    newPublishedAt = publishedAt;
  }

  let resolvedCategoryName = existing.category || '';
  let resolvedCategoryId = categoryId !== undefined ? categoryId : existing.categoryId;
  if (categoryId !== undefined) {
    if (categoryId) {
      const foundCat = db.getCategoryById(categoryId) || db.getCategoryBySlug(categoryId);
      if (foundCat) {
        resolvedCategoryName = foundCat.name;
        resolvedCategoryId = foundCat.id;
      } else {
        resolvedCategoryName = categoryId;
      }
    } else {
      resolvedCategoryName = '';
      resolvedCategoryId = undefined;
    }
  } else if (category !== undefined) {
    resolvedCategoryName = category;
  }

  const updatedArticle: Article = {
    ...existing,
    title: title.trim(),
    slug: finalSlug,
    description: (description || '').trim(),
    content: content || '',
    featuredImage: featuredImage !== undefined ? featuredImage : existing.featuredImage,
    categoryId: resolvedCategoryId,
    category: resolvedCategoryName,
    author: (author || existing.author || 'Mental Tactic').trim(),
    status: newStatus,
    publishedAt: newPublishedAt,
    updatedAt: now,
    seoTitle: (seoTitle || title).trim(),
    seoDescription: (seoDescription || description || '').trim(),
  };

  db.saveArticle(updatedArticle);
  res.json({ message: 'Article updated successfully.', article: updatedArticle });
});

// Toggle publish status
app.patch('/api/articles/:id/status', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const article = db.getArticleById(id);
  if (!article) {
    res.status(404).json({ error: 'Article not found.' });
    return;
  }

  const now = new Date().toISOString();
  const nextStatus = article.status === 'Published' ? 'Draft' : 'Published';
  article.status = nextStatus;
  if (nextStatus === 'Published' && !article.publishedAt) {
    article.publishedAt = now;
  }
  article.updatedAt = now;

  db.saveArticle(article);
  res.json({
    message: nextStatus === 'Published' ? 'Article published successfully.' : 'Article unpublished and saved as draft.',
    article,
  });
});

// Delete article
app.delete('/api/articles/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const success = db.deleteArticle(id);
  if (!success) {
    res.status(404).json({ error: 'Article not found.' });
    return;
  }
  res.json({ message: 'Article deleted successfully.' });
});

// ----------------------------------------------------
// CATEGORIES API
// ----------------------------------------------------

app.get('/api/categories', (_req: Request, res: Response) => {
  const categories = db.getCategories();
  res.json({ categories });
});

app.post('/api/categories', requireAuth, (req: Request, res: Response) => {
  const { name, slug: customSlug, description, image } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Category name is required.' });
    return;
  }

  const finalSlug = slugify(customSlug || name);
  if (!finalSlug) {
    res.status(400).json({ error: 'A valid category slug is required.' });
    return;
  }

  const existing = db.getCategoryBySlug(finalSlug);
  if (existing) {
    res.status(400).json({ error: `A category with slug "${finalSlug}" already exists.` });
    return;
  }

  const category: Category = {
    id: crypto.randomUUID(),
    name: name.trim(),
    slug: finalSlug,
    description: (description || '').trim(),
    image: image || '',
    createdAt: new Date().toISOString(),
  };

  db.saveCategory(category);
  res.status(201).json({ message: 'Category created successfully.', category });
});

app.put('/api/categories/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = db.getCategoryById(id);
  if (!existing) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }

  const { name, slug: customSlug, description, image } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Category name is required.' });
    return;
  }

  const finalSlug = slugify(customSlug || name);
  const slugHolder = db.getCategoryBySlug(finalSlug);
  if (slugHolder && slugHolder.id !== id) {
    res.status(400).json({ error: `A category with slug "${finalSlug}" already exists.` });
    return;
  }

  const updated: Category = {
    ...existing,
    name: name.trim(),
    slug: finalSlug,
    description: (description || '').trim(),
    image: image !== undefined ? image : existing.image,
  };

  db.saveCategory(updated);
  res.json({ message: 'Category updated successfully.', category: updated });
});

app.delete('/api/categories/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = db.getCategoryById(id);
  if (!existing) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }

  // Safe category deletion check: check if any article uses this category
  const articles = db.getArticles();
  const usingArticles = articles.filter(a => a.categoryId === id);
  if (usingArticles.length > 0) {
    res.status(400).json({
      error: `Unable to delete this category because it is currently being used by ${usingArticles.length} article(s). Please reassign or remove those articles first.`,
    });
    return;
  }

  db.deleteCategory(id);
  res.json({ message: 'Category deleted successfully.' });
});

// ----------------------------------------------------
// MEDIA API
// ----------------------------------------------------

app.get('/api/media', requireAuth, (req: Request, res: Response) => {
  let media = db.getMedia();
  const { search } = req.query;

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase();
    media = media.filter(m => m.originalName.toLowerCase().includes(q) || m.filename.toLowerCase().includes(q));
  }

  res.json({ media });
});

app.post('/api/media/upload', requireAuth, (req: Request, res: Response) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message || 'Image upload failed.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No image file was provided for upload.' });
      return;
    }

    const item: MediaItem = {
      id: crypto.randomUUID(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
      createdAt: new Date().toISOString(),
    };

    db.saveMedia(item);
    res.status(201).json({ message: 'Image uploaded successfully.', media: item });
  });
});

app.delete('/api/media/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { force } = req.query;
  const item = db.getMediaById(id);
  if (!item) {
    res.status(404).json({ error: 'Media file not found.' });
    return;
  }

  // Check usage across articles, products, homepage
  const articles = db.getArticles();
  const products = db.getProducts();
  const homepage = db.getHomepageSettings();

  const usedIn: string[] = [];

  articles.forEach(a => {
    if (a.featuredImage === item.url || (a.content && a.content.includes(item.url))) {
      usedIn.push(`Article: "${a.title}"`);
    }
  });

  products.forEach(p => {
    if (p.image === item.url) {
      usedIn.push(`Product: "${p.name}"`);
    }
  });

  if (homepage.heroImage === item.url) {
    usedIn.push('Homepage Hero Image');
  }

  if (usedIn.length > 0 && force !== 'true') {
    res.status(409).json({
      error: 'IN_USE',
      message: `This image is actively being used in: ${usedIn.slice(0, 3).join(', ')}${usedIn.length > 3 ? '...' : ''}. Deleting it will cause broken image links.`,
      usedIn,
    });
    return;
  }

  db.deleteMedia(id);
  res.json({ message: 'Media item deleted successfully.' });
});

// ----------------------------------------------------
// STORE PRODUCTS API
// ----------------------------------------------------

app.get('/api/products', optionalAuth, (req: Request, res: Response) => {
  const isAdmin = !!(req as any).user;
  let products = db.getProducts();

  if (!isAdmin) {
    products = products.filter(p => p.status === 'Published');
  }

  res.json({ products });
});

app.post('/api/products', requireAuth, (req: Request, res: Response) => {
  const { name, description, price, currency, image, url, status } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Product name is required.' });
    return;
  }

  const now = new Date().toISOString();
  const product: Product = {
    id: crypto.randomUUID(),
    name: name.trim(),
    description: (description || '').trim(),
    price: Number(price) || 0,
    currency: (currency || 'USD').trim().toUpperCase(),
    image: image || '',
    url: url || '',
    status: status === 'Published' ? 'Published' : 'Draft',
    createdAt: now,
    updatedAt: now,
  };

  db.saveProduct(product);
  res.status(201).json({ message: 'Product created successfully.', product });
});

app.put('/api/products/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = db.getProductById(id);
  if (!existing) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const { name, description, price, currency, image, url, status } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Product name is required.' });
    return;
  }

  const now = new Date().toISOString();
  const updated: Product = {
    ...existing,
    name: name.trim(),
    description: (description || '').trim(),
    price: Number(price) >= 0 ? Number(price) : existing.price,
    currency: currency ? currency.trim().toUpperCase() : existing.currency,
    image: image !== undefined ? image : existing.image,
    url: url !== undefined ? url : existing.url,
    status: status === 'Published' ? 'Published' : 'Draft',
    updatedAt: now,
  };

  db.saveProduct(updated);
  res.json({ message: 'Product updated successfully.', product: updated });
});

app.delete('/api/products/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  db.deleteProduct(id);
  res.json({ message: 'Product deleted successfully.' });
});

// ----------------------------------------------------
// HOMEPAGE SETTINGS API
// ----------------------------------------------------

app.get('/api/homepage', (_req: Request, res: Response) => {
  const homepage = db.getHomepageSettings();
  res.json({ homepage });
});

app.put('/api/homepage', requireAuth, (req: Request, res: Response) => {
  const current = db.getHomepageSettings();
  const updated = {
    headline: req.body.headline !== undefined ? req.body.headline : current.headline,
    tagline: req.body.tagline !== undefined ? req.body.tagline : current.tagline,
    introText: req.body.introText !== undefined ? req.body.introText : current.introText,
    heroImage: req.body.heroImage !== undefined ? req.body.heroImage : current.heroImage,
    ctaText: req.body.ctaText !== undefined ? req.body.ctaText : current.ctaText,
    ctaUrl: req.body.ctaUrl !== undefined ? req.body.ctaUrl : current.ctaUrl,
    articlesTitle: req.body.articlesTitle !== undefined ? req.body.articlesTitle : current.articlesTitle,
    storeTitle: req.body.storeTitle !== undefined ? req.body.storeTitle : current.storeTitle,
    donationsTitle: req.body.donationsTitle !== undefined ? req.body.donationsTitle : current.donationsTitle,
  };

  db.saveHomepageSettings(updated);
  res.json({ message: 'Homepage settings updated successfully.', homepage: updated });
});

// ----------------------------------------------------
// DONATIONS API
// ----------------------------------------------------

app.get('/api/donations', (_req: Request, res: Response) => {
  const donations = db.getDonationSettings();
  res.json({ donations });
});

app.put('/api/donations', requireAuth, (req: Request, res: Response) => {
  const current = db.getDonationSettings();
  const updated = {
    title: req.body.title !== undefined ? req.body.title : current.title,
    description: req.body.description !== undefined ? req.body.description : current.description,
    buttonText: req.body.buttonText !== undefined ? req.body.buttonText : current.buttonText,
    donationUrl: req.body.donationUrl !== undefined ? req.body.donationUrl : current.donationUrl,
    paymentMethods: req.body.paymentMethods !== undefined ? req.body.paymentMethods : current.paymentMethods,
    active: req.body.active !== undefined ? Boolean(req.body.active) : current.active,
  };

  db.saveDonationSettings(updated);
  res.json({ message: 'Donation settings updated successfully.', donations: updated });
});

// ----------------------------------------------------
// WEBSITE SETTINGS API
// ----------------------------------------------------

app.get('/api/settings', (_req: Request, res: Response) => {
  const settings = db.getWebsiteSettings();
  res.json({ settings });
});

app.put('/api/settings', requireAuth, (req: Request, res: Response) => {
  const current = db.getWebsiteSettings();
  const updated = {
    websiteName: req.body.websiteName !== undefined ? req.body.websiteName : current.websiteName,
    websiteDescription: req.body.websiteDescription !== undefined ? req.body.websiteDescription : current.websiteDescription,
    logo: req.body.logo !== undefined ? req.body.logo : current.logo,
    favicon: req.body.favicon !== undefined ? req.body.favicon : current.favicon,
    defaultSeoTitle: req.body.defaultSeoTitle !== undefined ? req.body.defaultSeoTitle : current.defaultSeoTitle,
    defaultSeoDescription: req.body.defaultSeoDescription !== undefined ? req.body.defaultSeoDescription : current.defaultSeoDescription,
    contactEmail: req.body.contactEmail !== undefined ? req.body.contactEmail : current.contactEmail,
    socialLinks: {
      ...current.socialLinks,
      ...(req.body.socialLinks || {}),
    },
  };

  db.saveWebsiteSettings(updated);
  res.json({ message: 'Website settings updated successfully.', settings: updated });
});

// ----------------------------------------------------
// PUBLIC DATA COMBINED ENDPOINT
// ----------------------------------------------------

app.get('/api/public/data', optionalAuth, (req: Request, res: Response) => {
  const isAdmin = !!(req as any).user;
  let articles = db.getArticles();
  if (!isAdmin) {
    articles = articles.filter(a => a.status === 'Published');
  }
  let products = db.getProducts();
  if (!isAdmin) {
    products = products.filter(p => p.status === 'Published');
  }
  const homepage = db.getHomepageSettings();
  const donations = db.getDonationSettings();
  const settings = db.getWebsiteSettings();

  res.json({
    homepage,
    articles,
    products,
    donations,
    settings,
  });
});

// ----------------------------------------------------
// FRONTEND SERVING (DEV vs PROD)
// ----------------------------------------------------

async function startServer() {
  const httpServer = http.createServer(app);
  const isHttps = process.env.APP_URL?.startsWith('https') ?? false;

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        ws: {
          server: httpServer,
          clientPort: isHttps ? 443 : PORT,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    const indexHtml = path.resolve(distPath, 'index.html');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    app.get('*', (_req: Request, res: Response) => {
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(200).json({ status: 'ok', service: 'Mental Tactic API' });
      }
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Mental Tactic server running on http://0.0.0.0:${PORT} [${isProduction ? 'production' : 'development'}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
