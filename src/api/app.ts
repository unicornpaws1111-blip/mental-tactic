import { Hono } from 'hono';
import { cors } from 'hono/cors';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
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
} from '../../server/db';
import { verifyGoogleTokenEdge } from '../../server/firebaseEdge';

const app = new Hono();

// ----------------------------------------------------
// CORS & PREFLIGHT
// ----------------------------------------------------
app.use('*', cors({
  origin: (origin) => origin || '*',
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-admin-token', 'Accept', 'Origin'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  credentials: true,
}));

// Helper functions for Authentication
function getAuthToken(c: any): string | null {
  const authHeader = c.req.header('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const customHeader = c.req.header('x-admin-token');
  if (typeof customHeader === 'string') {
    return customHeader.trim();
  }
  return null;
}

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

function getAuthenticatedUser(c: any): User | null {
  const token = getAuthToken(c);
  if (!token) return null;
  const session = db.getSession(token);
  if (!session) return null;
  return db.getUserById(session.userId) || null;
}

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

// ----------------------------------------------------
// HEALTH & ROOT ENDPOINTS
// ----------------------------------------------------
app.get('/api', (c) => {
  return c.json({
    status: 'ok',
    service: 'Mental Tactic API',
    version: '1.0.0',
    runtime: 'Cloudflare / Universal Edge',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'Mental Tactic API',
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------
app.get('/api/auth/status', (c) => {
  const users = db.getUsers();
  const hasAdmin = users.length > 0;
  const user = getAuthenticatedUser(c);

  if (user) {
    return c.json({
      hasAdmin,
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: isUserAdmin(user) ? 'admin' : 'member',
        avatar: user.avatar || '',
      },
    });
  }

  return c.json({
    hasAdmin,
    isAuthenticated: false,
    user: null,
  });
});

app.get('/api/auth/config', (c) => {
  const googleClientId = (
    process.env.GOOGLE_CLIENT_ID ||
    process.env.VITE_GOOGLE_CLIENT_ID ||
    ''
  ).trim();
  const firebaseProjectId = (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    'mental-tactic'
  ).trim();

  return c.json({
    googleClientId,
    hasGoogleAuth: Boolean(googleClientId),
    firebaseConfigured: Boolean(firebaseProjectId),
    firebaseProjectId,
  });
});

app.post('/api/auth/setup', async (c) => {
  const users = db.getUsers();
  if (users.length > 0) {
    return c.json({ error: 'Master administrator account is already configured.' }, 400);
  }

  const { email, password, username } = await c.req.json();
  if (!email || !password || password.length < 8) {
    return c.json({ error: 'Valid email and password (minimum 8 characters) are required.' }, 400);
  }

  const { hash, salt } = hashPassword(password);
  const now = new Date().toISOString();
  const admin: User = {
    id: 'admin-master',
    email: email.trim().toLowerCase(),
    username: (username || 'Administrator').trim(),
    passwordHash: hash,
    salt,
    role: 'admin',
    createdAt: now,
    updatedAt: now,
  };

  db.createUser(admin);
  const session = db.createSession(admin.id);

  return c.json({
    message: 'Master administrator account created successfully.',
    token: session.token,
    user: {
      id: admin.id,
      email: admin.email,
      username: admin.username,
      role: 'admin',
    },
  }, 201);
});

app.post('/api/auth/register', async (c) => {
  const { email, password, username } = await c.req.json();
  if (!email || !password || password.length < 6) {
    return c.json({ error: 'Valid email and password (minimum 6 characters) are required.' }, 400);
  }

  const normalized = email.trim().toLowerCase();
  const existing = db.getUserByEmail(normalized);
  if (existing) {
    return c.json({ error: 'An account with this email address already exists.' }, 400);
  }

  const { hash, salt } = hashPassword(password);
  const now = new Date().toISOString();
  const newUser: User = {
    id: crypto.randomUUID(),
    email: normalized,
    username: (username || normalized.split('@')[0]).trim(),
    passwordHash: hash,
    salt,
    role: 'member',
    createdAt: now,
    updatedAt: now,
  };

  db.createUser(newUser);
  const session = db.createSession(newUser.id);

  return c.json({
    message: 'Account registered successfully.',
    token: session.token,
    user: {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
    },
  }, 201);
});

app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json();
  if (!email || !password) {
    return c.json({ error: 'Email and password are required.' }, 400);
  }

  const user = db.getUserByEmail(email);
  if (!user || !user.passwordHash || !user.salt) {
    return c.json({ error: 'Invalid email or password.' }, 401);
  }

  const valid = verifyPassword(password, user.passwordHash, user.salt);
  if (!valid) {
    return c.json({ error: 'Invalid email or password.' }, 401);
  }

  const session = db.createSession(user.id);
  return c.json({
    message: 'Authentication successful.',
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

app.post('/api/auth/google', async (c) => {
  const { credential } = await c.req.json();
  if (!credential || typeof credential !== 'string') {
    return c.json({ error: 'Invalid Google credential token provided.' }, 400);
  }

  const decoded = await verifyGoogleTokenEdge(credential);
  if (!decoded || !decoded.uid) {
    return c.json({ error: 'Google authentication token verification failed.' }, 401);
  }

  const googleId = decoded.uid;
  const email = decoded.email || `${googleId}@google.com`;
  const name = decoded.name || email.split('@')[0];
  const picture = decoded.picture || '';

  let user = db.getUserByGoogleId(googleId) || db.getUserByEmail(email);
  const now = new Date().toISOString();

  if (user) {
    db.updateUser(user.id, {
      googleId: user.googleId || googleId,
      avatar: picture || user.avatar,
      updatedAt: now,
    });
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
  return c.json({
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
});

app.get('/api/auth/me', (c) => {
  const user = getAuthenticatedUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized: Session invalid or expired' }, 401);
  }

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: isUserAdmin(user) ? 'admin' : 'member',
      avatar: user.avatar || '',
    },
  });
});

app.post('/api/auth/logout', (c) => {
  const token = getAuthToken(c);
  if (token) {
    db.deleteSession(token);
  }
  return c.json({ message: 'Logged out successfully.' });
});

app.post('/api/auth/change-password', async (c) => {
  const user = getAuthenticatedUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const { currentPassword, newPassword } = await c.req.json();
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return c.json({ error: 'New password must be at least 8 characters long.' }, 400);
  }

  if (user.passwordHash && user.salt) {
    const valid = verifyPassword(currentPassword, user.passwordHash, user.salt);
    if (!valid) {
      return c.json({ error: 'Current password is incorrect.' }, 400);
    }
  }

  const { hash, salt } = hashPassword(newPassword);
  db.updateUserPassword(user.id, hash, salt);
  return c.json({ message: 'Password updated successfully.' });
});

// ----------------------------------------------------
// DASHBOARD & ADMIN
// ----------------------------------------------------
const handleStats = (c: any) => {
  const user = getAuthenticatedUser(c);
  if (!user || !isUserAdmin(user)) {
    return c.json({ error: 'Unauthorized: Administrator privileges required' }, 401);
  }

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

  return c.json({
    totalArticles,
    publishedArticles,
    draftArticles,
    categories: totalCategories,
    totalMedia,
    totalProducts,
    recentArticles,
  });
};

app.get('/api/dashboard/stats', handleStats);
app.get('/api/admin/stats', handleStats);

app.get('/api/admin/users', (c) => {
  const user = getAuthenticatedUser(c);
  if (!user || !isUserAdmin(user)) return c.json({ error: 'Unauthorized' }, 401);

  const users = db.getUsers().map(u => ({
    id: u.id,
    email: u.email,
    username: u.username,
    role: isUserAdmin(u) ? 'admin' : 'member',
    avatar: u.avatar,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));
  return c.json({ users });
});

app.post('/api/admin/users', async (c) => {
  const user = getAuthenticatedUser(c);
  if (!user || !isUserAdmin(user)) return c.json({ error: 'Unauthorized' }, 401);

  const { email, username, password, role } = await c.req.json();
  if (!email || !password || password.length < 6) {
    return c.json({ error: 'Valid email and password (minimum 6 chars) are required.' }, 400);
  }

  const normalized = email.trim().toLowerCase();
  if (db.getUserByEmail(normalized)) {
    return c.json({ error: 'A user with this email already exists.' }, 400);
  }

  const { hash, salt } = hashPassword(password);
  const now = new Date().toISOString();
  const created = db.createUser({
    id: crypto.randomUUID(),
    email: normalized,
    username: (username || normalized.split('@')[0]).trim(),
    passwordHash: hash,
    salt,
    role: role === 'admin' ? 'admin' : 'member',
    createdAt: now,
    updatedAt: now,
  });

  return c.json({ message: 'User created successfully.', user: created }, 201);
});

app.put('/api/admin/users/:id', async (c) => {
  const user = getAuthenticatedUser(c);
  if (!user || !isUserAdmin(user)) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const updates = await c.req.json();
  const updated = db.updateUser(id, updates);
  if (!updated) return c.json({ error: 'User not found.' }, 404);

  return c.json({ message: 'User updated successfully.', user: updated });
});

app.delete('/api/admin/users/:id', (c) => {
  const user = getAuthenticatedUser(c);
  if (!user || !isUserAdmin(user)) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  if (id === 'admin-master' || id === user.id) {
    return c.json({ error: 'Cannot delete the master administrator account or your own account.' }, 400);
  }

  const current = db.get();
  current.users = current.users.filter(u => u.id !== id);
  db.save(current);
  return c.json({ message: 'User deleted successfully.' });
});

// ----------------------------------------------------
// PUBLIC DATA COMBINED
// ----------------------------------------------------
app.get('/api/public/data', (c) => {
  const user = getAuthenticatedUser(c);
  const isAdmin = isUserAdmin(user);

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

  return c.json({
    homepage,
    articles,
    products,
    donations,
    settings,
  });
});

// ----------------------------------------------------
// ARTICLES
// ----------------------------------------------------
app.get('/api/articles', (c) => {
  const user = getAuthenticatedUser(c);
  const isAdmin = isUserAdmin(user);

  let articles = db.getArticles();
  const search = c.req.query('search');
  const category = c.req.query('category');
  const status = c.req.query('status');
  const adminParam = c.req.query('admin');

  if (!isAdmin && adminParam !== '1') {
    articles = articles.filter(a => a.status === 'Published');
  }

  if (category) {
    articles = articles.filter(a => a.categoryId === category || (a.category && a.category.toLowerCase() === category.toLowerCase()));
  }

  if (status && status !== 'all') {
    articles = articles.filter(a => a.status.toLowerCase() === status.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    articles = articles.filter(a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.content.toLowerCase().includes(q));
  }

  return c.json({ articles });
});

app.get('/api/articles/:slugOrId', (c) => {
  const slugOrId = decodeURIComponent(c.req.param('slugOrId'));
  const user = getAuthenticatedUser(c);
  const isAdmin = isUserAdmin(user);

  let article = db.getArticleBySlug(slugOrId) || db.getArticleById(slugOrId);
  if (!article) {
    return c.json({ error: 'Article not found.' }, 404);
  }

  if (article.status !== 'Published' && !isAdmin) {
    return c.json({ error: 'Article not found.' }, 404);
  }

  return c.json({ article });
});

app.post('/api/articles', async (c) => {
  const user = getAuthenticatedUser(c);
  if (!user || !isUserAdmin(user)) return c.json({ error: 'Unauthorized' }, 401);

  const { title, description, content, featuredImage, category, categoryId, status, seoTitle, seoDescription } = await c.req.json();
  if (!title || !content) {
    return c.json({ error: 'Article title and content are required.' }, 400);
  }

  const now = new Date().toISOString();
  let baseSlug = slugify(title);
  if (!baseSlug) baseSlug = `article-${Date.now()}`;
  let slug = baseSlug;
  let counter = 1;
  while (db.getArticleBySlug(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const newArticle: Article = {
    id: crypto.randomUUID(),
    title: title.trim(),
    slug,
    description: (description || '').trim(),
    content: content.trim(),
    featuredImage: featuredImage || '',
    category: category || '',
    categoryId: categoryId || '',
    author: user.username || 'Tactical Mind',
    status: status === 'Draft' ? 'Draft' : 'Published',
    publishedAt: status === 'Published' ? now : undefined,
    createdAt: now,
    updatedAt: now,
    seoTitle: (seoTitle || title).trim(),
    seoDescription: (seoDescription || description || '').trim(),
  };

  db.saveArticle(newArticle);
  return c.json({ message: 'Article created successfully.', article: newArticle }, 201);
});

app.put('/api/articles/:id', async (c) => {
  const user = getAuthenticatedUser(c);
  if (!user || !isUserAdmin(user)) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const existing = db.getArticleById(id);
  if (!existing) return c.json({ error: 'Article not found.' }, 404);

  const { title, description, content, featuredImage, category, categoryId, status, seoTitle, seoDescription, slug } = await c.req.json();
  const now = new Date().toISOString();

  let finalSlug = existing.slug;
  if (slug && slug.trim() && slug.trim().toLowerCase() !== existing.slug.toLowerCase()) {
    finalSlug = slugify(slug);
    const slugClash = db.getArticleBySlug(finalSlug);
    if (slugClash && slugClash.id !== id) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }
  }

  const updated: Article = {
    ...existing,
    title: title !== undefined ? title.trim() : existing.title,
    slug: finalSlug,
    description: description !== undefined ? description.trim() : existing.description,
    content: content !== undefined ? content.trim() : existing.content,
    featuredImage: featuredImage !== undefined ? featuredImage : existing.featuredImage,
    category: category !== undefined ? category : existing.category,
    categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
    status: status !== undefined ? (status === 'Draft' ? 'Draft' : 'Published') : existing.status,
    publishedAt: status === 'Published' && !existing.publishedAt ? now : existing.publishedAt,
    updatedAt: now,
    seoTitle: seoTitle !== undefined ? seoTitle.trim() : existing.seoTitle,
    seoDescription: seoDescription !== undefined ? seoDescription.trim() : existing.seoDescription,
  };

  db.saveArticle(updated);
  return c.json({ message: 'Article updated successfully.', article: updated });
});

app.patch('/api/articles/:id/status', (c) => {
  const user = getAuthenticatedUser(c);
  if (!user || !isUserAdmin(user)) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const existing = db.getArticleById(id);
  if (!existing) return c.json({ error: 'Article not found.' }, 404);

  const now = new Date().toISOString();
  existing.status = existing.status === 'Published' ? 'Draft' : 'Published';
  if (existing.status === 'Published' && !existing.publishedAt) {
    existing.publishedAt = now;
  }
  existing.updatedAt = now;

  db.saveArticle(existing);
  return c.json({ message: `Article status changed to ${existing.status}.`, article: existing });
});

app.delete('/api/articles/:id', (c) => {
  const user = getAuthenticatedUser(c);
  if (!user || !isUserAdmin(user)) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  db.deleteArticle(id);
  return c.json({ message: 'Article deleted successfully.' });
});

// ----------------------------------------------------
// CATEGORIES
// ----------------------------------------------------
app.get('/api/categories', (c) => {
  const categories = db.getCategories();
  return c.json({ categories });
});

app.post('/api/categories', async (c) => {
  const user = getAuthenticatedUser(c);
  if (!user || !isUserAdmin(user)) return c.json({ error: 'Unauthorized' }, 401);

  const { name, description, image } = await c.req.json();
  if (!name || typeof name !== 'string' || !name.trim()) {
    return c.json({ error: 'Category name is required.' }, 400);
  }

  let baseSlug = slugify(name);
  if (!baseSlug) baseSlug = `category-${Date.now()}`;
  let slug = baseSlug;
  let counter = 1;
  while (db.getCategoryBySlug(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const category: Category = {
    id: crypto.randomUUID(),
    name: name.trim(),
    slug,
    description: (description || '').trim(),
    image: image || '',
    createdAt: new Date().toISOString(),
  };

  db.saveCategory(category);
  return c.json({ message: 'Category created successfully.', category }, 201);
});

app.put('/api/categories/:id', async (c) => {
  const user = getAuthenticatedUser(c);
  if (!user || !isUserAdmin(user)) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const existing = db.getCategoryById(id);
  if (!existing) return c.json({ error: 'Category not found.' }, 404);

  const { name, description, image } = await c.req.json();
  const updated: Category = {
    ...existing,
    name: name !== undefined ? name.trim() : existing.name,
    description: description !== undefined ? description.trim() : existing.description,
    image: image !== undefined ? image : existing.image,
  };

  db.saveCategory(updated);
  return c.json({ message: 'Category updated successfully.', category: updated });
});

app.delete('/api/categories/:id', (c) => {
  const user = getAuthenticatedUser(c);
  if (!user || !isUserAdmin(user)) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const existing = db.getCategoryById(id);
  if (!existing) return c.json({ error: 'Category not found.' }, 404);

  const articles = db.getArticles();
  const usingArticles = articles.filter(a => a.categoryId === id);
  if (usingArticles.length > 0) {
    return c.json({
      error: `Unable to delete this category because it is currently being used by ${usingArticles.length} article(s). Please reassign or remove those articles first.`,
    }, 400);
  }

  db.deleteCategory(id);
  return c.json({ message: 'Category deleted successfully.' });
});

// ----------------------------------------------------
// PRODUCTS
// ----------------------------------------------------
app.get('/api/products', (c) => {
  const user = getAuthenticatedUser(c);
  const isAdmin = isUserAdmin(user);

  let products = db.getProducts();
  if (!isAdmin) {
    products = products.filter(p => p.status === 'Published');
  }

  return c.json({ products });
});

app.get('/api/products/:id', (c) => {
  const id = c.req.param('id');
  const product = db.getProductById(id);
  if (!product) return c.json({ error: 'Product not found.' }, 404);
  return c.json({ product });
});

app.post('/api/products', async (c) => {
  const user = getAuthenticatedUser(c);
  if (!user || !isUserAdmin(user)) return c.json({ error: 'Unauthorized' }, 401);

  const { name, description, price, currency, image, url, status } = await c.req.json();
  if (!name || typeof name !== 'string' || !name.trim()) {
    return c.json({ error: 'Product name is required.' }, 400);
  }

  const now = new Date().toISOString();
  const product: Product = {
    id: crypto.randomUUID(),
    name: name.trim(),
    description: (description || '').trim(),
    price: Number(price) >= 0 ? Number(price) : 0,
    currency: currency ? currency.trim().toUpperCase() : 'USD',
    image: image || '',
    url: url || '',
    status: status === 'Published' ? 'Published' : 'Draft',
    createdAt: now,
    updatedAt: now,
  };

  db.saveProduct(product);
  return c.json({ message: 'Product created successfully.', product }, 201);
});

app.put('/api/products/:id', async (c) => {
  const user = getAuthenticatedUser(c);
  if (!user || !isUserAdmin(user)) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const existing = db.getProductById(id);
  if (!existing) return c.json({ error: 'Product not found.' }, 404);

  const { name, description, price, currency, image, url, status } = await c.req.json();
  const updated: Product = {
    ...existing,
    name: name !== undefined ? name.trim() : existing.name,
    description: description !== undefined ? description.trim() : existing.description,
    price: price !== undefined ? Number(price) : existing.price,
    currency: currency !== undefined ? currency.trim().toUpperCase() : existing.currency,
    image: image !== undefined ? image : existing.image,
    url: url !== undefined ? url : existing.url,
    status: status !== undefined ? (status === 'Published' ? 'Published' : 'Draft') : existing.status,
    updatedAt: new Date().toISOString(),
  };

  db.saveProduct(updated);
  return c.json({ message: 'Product updated successfully.', product: updated });
});

app.delete('/api/products/:id', (c) => {
  const user = getAuthenticatedUser(c);
  if (!user || !isUserAdmin(user)) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  db.deleteProduct(id);
  return c.json({ message: 'Product deleted successfully.' });
});

// ----------------------------------------------------
// MEDIA API
// ----------------------------------------------------
app.get('/api/media', (c) => {
  const user = getAuthenticatedUser(c);
  if (!user || !isUserAdmin(user)) return c.json({ error: 'Unauthorized' }, 401);

  let media = db.getMedia();
  const search = c.req.query('search');
  if (search) {
    const q = search.toLowerCase();
    media = media.filter(m => m.originalName.toLowerCase().includes(q) || m.filename.toLowerCase().includes(q));
  }

  return c.json({ media });
});

app.post('/api/media/upload', async (c) => {
  const user = getAuthenticatedUser(c);
  if (!user || !isUserAdmin(user)) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const contentType = c.req.header('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const body = await c.req.parseBody();
      const file = body['file'];

      if (!file || !(file instanceof File)) {
        return c.json({ error: 'No image file was provided for upload.' }, 400);
      }

      const ext = path.extname(file.name).toLowerCase() || '.jpg';
      const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;

      // Save locally if fs is writable, otherwise use Data URL
      let url = `/uploads/${filename}`;
      try {
        if (typeof fs.writeFileSync === 'function') {
          const buffer = Buffer.from(await file.arrayBuffer());
          fs.writeFileSync(path.resolve(UPLOADS_DIR, filename), buffer);
        }
      } catch {
        // Fallback for purely stateless workers: store as data url
        const buffer = Buffer.from(await file.arrayBuffer());
        url = `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`;
      }

      const item: MediaItem = {
        id: crypto.randomUUID(),
        filename,
        originalName: file.name,
        mimeType: file.type || 'image/jpeg',
        size: file.size,
        url,
        createdAt: new Date().toISOString(),
      };

      db.saveMedia(item);
      return c.json({ message: 'Image uploaded successfully.', media: item }, 201);
    }

    // Direct JSON URL or Data URL upload
    const json = await c.req.json();
    if (json.url) {
      const item: MediaItem = {
        id: crypto.randomUUID(),
        filename: path.basename(json.url),
        originalName: json.originalName || 'External Image',
        mimeType: 'image/jpeg',
        size: 0,
        url: json.url,
        createdAt: new Date().toISOString(),
      };
      db.saveMedia(item);
      return c.json({ message: 'Image registered successfully.', media: item }, 201);
    }

    return c.json({ error: 'Invalid upload payload.' }, 400);
  } catch (err: any) {
    return c.json({ error: err.message || 'Image upload failed.' }, 500);
  }
});

app.delete('/api/media/:id', (c) => {
  const user = getAuthenticatedUser(c);
  if (!user || !isUserAdmin(user)) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  db.deleteMedia(id);
  return c.json({ message: 'Media item deleted successfully.' });
});

// ----------------------------------------------------
// SETTINGS (HOMEPAGE, DONATIONS, WEBSITE)
// ----------------------------------------------------
const handleGetHomepage = (c: any) => c.json({ homepage: db.getHomepageSettings() });
const handlePutHomepage = async (c: any) => {
  const user = getAuthenticatedUser(c);
  if (!user || !isUserAdmin(user)) return c.json({ error: 'Unauthorized' }, 401);
  const current = db.getHomepageSettings();
  const body = await c.req.json();
  const updated = { ...current, ...body };
  db.saveHomepageSettings(updated);
  return c.json({ message: 'Homepage settings updated successfully.', homepage: updated });
};

app.get('/api/homepage', handleGetHomepage);
app.get('/api/settings/homepage', handleGetHomepage);
app.put('/api/homepage', handlePutHomepage);
app.put('/api/settings/homepage', handlePutHomepage);

const handleGetDonations = (c: any) => c.json({ donations: db.getDonationSettings() });
const handlePutDonations = async (c: any) => {
  const user = getAuthenticatedUser(c);
  if (!user || !isUserAdmin(user)) return c.json({ error: 'Unauthorized' }, 401);
  const current = db.getDonationSettings();
  const body = await c.req.json();
  const updated = { ...current, ...body };
  db.saveDonationSettings(updated);
  return c.json({ message: 'Donation settings updated successfully.', donations: updated });
};

app.get('/api/donations', handleGetDonations);
app.get('/api/settings/donations', handleGetDonations);
app.put('/api/donations', handlePutDonations);
app.put('/api/settings/donations', handlePutDonations);

const handleGetWebsite = (c: any) => c.json({ settings: db.getWebsiteSettings() });
const handlePutWebsite = async (c: any) => {
  const user = getAuthenticatedUser(c);
  if (!user || !isUserAdmin(user)) return c.json({ error: 'Unauthorized' }, 401);
  const current = db.getWebsiteSettings();
  const body = await c.req.json();
  const updated = { ...current, ...body };
  db.saveWebsiteSettings(updated);
  return c.json({ message: 'Website settings updated successfully.', settings: updated });
};

app.get('/api/settings', handleGetWebsite);
app.get('/api/settings/website', handleGetWebsite);
app.put('/api/settings', handlePutWebsite);
app.put('/api/settings/website', handlePutWebsite);

// ----------------------------------------------------
// STATIC /UPLOADS SERVING
// ----------------------------------------------------
app.get('/uploads/:filename', (c) => {
  const filename = c.req.param('filename');
  try {
    if (typeof fs.existsSync === 'function') {
      const filePath = path.resolve(UPLOADS_DIR, filename);
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filename).toLowerCase();
        let mime = 'image/jpeg';
        if (ext === '.png') mime = 'image/png';
        else if (ext === '.webp') mime = 'image/webp';
        const fileData = fs.readFileSync(filePath);
        return new Response(fileData, {
          headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=86400' },
        });
      }
    }
  } catch {
    // ignore
  }
  return c.notFound();
});

// Fallback 404 for unmatched /api routes
app.all('/api/*', (c) => {
  return c.json({ error: 'API endpoint not found' }, 404);
});

export default app;
