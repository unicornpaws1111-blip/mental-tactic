import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

// Ensure data and uploads directory exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash?: string;
  salt?: string;
  role?: 'admin' | 'member';
  googleId?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  featuredImage?: string;
  category?: string;
  categoryId?: string;
  author: string;
  status: 'Draft' | 'Published';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  createdAt: string;
}

export interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image?: string;
  url?: string;
  status: 'Draft' | 'Published';
  createdAt: string;
  updatedAt: string;
}

export interface HomepageSettings {
  headline: string;
  tagline: string;
  introText: string;
  heroImage: string;
  ctaText: string;
  ctaUrl: string;
  articlesTitle: string;
  storeTitle: string;
  donationsTitle: string;
}

export interface DonationSettings {
  title: string;
  description: string;
  buttonText: string;
  donationUrl: string;
  paymentMethods: string;
  active: boolean;
}

export interface WebsiteSettings {
  websiteName: string;
  websiteDescription: string;
  logo: string;
  favicon: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  contactEmail: string;
  socialLinks: {
    x?: string;
    instagram?: string;
    youtube?: string;
    discord?: string;
    telegram?: string;
  };
}

export interface DatabaseSchema {
  users: User[];
  sessions: Session[];
  articles: Article[];
  categories: Category[];
  media: MediaItem[];
  products: Product[];
  homepageSettings: HomepageSettings;
  donationSettings: DonationSettings;
  websiteSettings: WebsiteSettings;
}

const defaultDatabase: DatabaseSchema = {
  users: [],
  sessions: [],
  articles: [],
  categories: [],
  media: [],
  products: [],
  homepageSettings: {
    headline: '',
    tagline: '',
    introText: '',
    heroImage: '',
    ctaText: '',
    ctaUrl: '',
    articlesTitle: '',
    storeTitle: '',
    donationsTitle: '',
  },
  donationSettings: {
    title: '',
    description: '',
    buttonText: '',
    donationUrl: '',
    paymentMethods: '',
    active: false,
  },
  websiteSettings: {
    websiteName: 'Mental Tactic',
    websiteDescription: 'Master the psychological advantage. Strategic insights, mental resilience, and tactical cognition.',
    logo: '',
    favicon: '',
    defaultSeoTitle: 'Mental Tactic | Strategic Mindset & Tactical Cognition',
    defaultSeoDescription: 'Master the psychological advantage. Strategic insights, mental resilience, and tactical cognition.',
    contactEmail: '',
    socialLinks: {
      x: '',
      instagram: '',
      youtube: '',
      discord: '',
      telegram: '',
    },
  },
};

// In-memory cache synced with disk
let cachedDb: DatabaseSchema | null = null;

function loadDatabase(): DatabaseSchema {
  if (cachedDb) return cachedDb;

  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      // Merge with defaults to ensure all keys exist
      const loaded: DatabaseSchema = {
        ...defaultDatabase,
        ...parsed,
        homepageSettings: {
          ...defaultDatabase.homepageSettings,
          ...(parsed.homepageSettings || {}),
        },
        donationSettings: {
          ...defaultDatabase.donationSettings,
          ...(parsed.donationSettings || {}),
        },
        websiteSettings: {
          ...defaultDatabase.websiteSettings,
          ...(parsed.websiteSettings || {}),
          socialLinks: {
            ...defaultDatabase.websiteSettings.socialLinks,
            ...(parsed.websiteSettings?.socialLinks || {}),
          },
        },
      };

      // Seed default master admin if users is empty
      if (!loaded.users || loaded.users.length === 0) {
        const { hash, salt } = hashPassword('admin12345');
        const now = new Date().toISOString();
        const defaultAdmin: User = {
          id: 'admin-master',
          email: 'admin@mentaltactic.com',
          username: 'Administrator',
          passwordHash: hash,
          salt,
          createdAt: now,
          updatedAt: now,
        };
        loaded.users = [defaultAdmin];
        saveDatabase(loaded);
      }
      cachedDb = loaded;
      return cachedDb;
    }
  } catch (err) {
    console.error('Error loading db.json, creating fallback:', err);
  }

  const fallback: DatabaseSchema = JSON.parse(JSON.stringify(defaultDatabase));
  const { hash, salt } = hashPassword('admin12345');
  const now = new Date().toISOString();
  fallback.users = [{
    id: 'admin-master',
    email: 'admin@mentaltactic.com',
    username: 'Administrator',
    passwordHash: hash,
    salt,
    createdAt: now,
    updatedAt: now,
  }];
  saveDatabase(fallback);
  cachedDb = fallback;
  return cachedDb;
}

function saveDatabase(db: DatabaseSchema): void {
  cachedDb = db;
  const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_FILE);
  } catch (err) {
    console.error('Failed to write database atomically:', err);
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch {
      // ignore
    }
  }
}

// Password hashing utilities using Node crypto
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
  } catch {
    return false;
  }
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export const db = {
  get: () => loadDatabase(),
  save: (data: DatabaseSchema) => saveDatabase(data),
  
  // User helpers
  getUsers: () => loadDatabase().users,
  getUserById: (id: string) => loadDatabase().users.find(u => u.id === id),
  getUserByEmail: (email: string) => {
    const normalized = email.trim().toLowerCase();
    return loadDatabase().users.find(u => u.email.toLowerCase() === normalized || u.username.toLowerCase() === normalized);
  },
  getUserByGoogleId: (googleId: string) => {
    return loadDatabase().users.find(u => u.googleId === googleId);
  },
  createUser: (user: User) => {
    const current = loadDatabase();
    current.users.push(user);
    saveDatabase(current);
    return user;
  },
  updateUser: (id: string, updates: Partial<User>) => {
    const current = loadDatabase();
    const user = current.users.find(u => u.id === id);
    if (user) {
      Object.assign(user, updates, { updatedAt: new Date().toISOString() });
      saveDatabase(current);
      return user;
    }
    return null;
  },
  updateUserPassword: (id: string, hash: string, salt: string) => {
    const current = loadDatabase();
    const user = current.users.find(u => u.id === id);
    if (user) {
      user.passwordHash = hash;
      user.salt = salt;
      user.updatedAt = new Date().toISOString();
      saveDatabase(current);
      return true;
    }
    return false;
  },

  // Session helpers
  createSession: (userId: string): Session => {
    const current = loadDatabase();
    // 7 days expiration
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const session: Session = {
      token: generateToken(),
      userId,
      createdAt: new Date().toISOString(),
      expiresAt,
    };
    current.sessions.push(session);
    // Cleanup expired sessions
    const now = new Date().toISOString();
    current.sessions = current.sessions.filter(s => s.expiresAt > now);
    saveDatabase(current);
    return session;
  },
  getSession: (token: string): Session | undefined => {
    const current = loadDatabase();
    const now = new Date().toISOString();
    return current.sessions.find(s => s.token === token && s.expiresAt > now);
  },
  deleteSession: (token: string) => {
    const current = loadDatabase();
    current.sessions = current.sessions.filter(s => s.token !== token);
    saveDatabase(current);
  },

  // Article helpers
  getArticles: () => loadDatabase().articles,
  getArticleById: (id: string) => loadDatabase().articles.find(a => a.id === id),
  getArticleBySlug: (slug: string) => loadDatabase().articles.find(a => a.slug.toLowerCase() === slug.toLowerCase()),
  saveArticle: (article: Article) => {
    const current = loadDatabase();
    const index = current.articles.findIndex(a => a.id === article.id);
    if (index >= 0) {
      current.articles[index] = article;
    } else {
      current.articles.unshift(article);
    }
    saveDatabase(current);
    return article;
  },
  deleteArticle: (id: string) => {
    const current = loadDatabase();
    const initialLen = current.articles.length;
    current.articles = current.articles.filter(a => a.id !== id);
    saveDatabase(current);
    return current.articles.length < initialLen;
  },

  // Categories
  getCategories: () => loadDatabase().categories,
  getCategoryById: (id: string) => loadDatabase().categories.find(c => c.id === id),
  getCategoryBySlug: (slug: string) => loadDatabase().categories.find(c => c.slug.toLowerCase() === slug.toLowerCase()),
  saveCategory: (category: Category) => {
    const current = loadDatabase();
    const index = current.categories.findIndex(c => c.id === category.id);
    if (index >= 0) {
      current.categories[index] = category;
    } else {
      current.categories.push(category);
    }
    saveDatabase(current);
    return category;
  },
  deleteCategory: (id: string) => {
    const current = loadDatabase();
    current.categories = current.categories.filter(c => c.id !== id);
    saveDatabase(current);
  },

  // Media
  getMedia: () => loadDatabase().media,
  getMediaById: (id: string) => loadDatabase().media.find(m => m.id === id),
  saveMedia: (item: MediaItem) => {
    const current = loadDatabase();
    current.media.unshift(item);
    saveDatabase(current);
    return item;
  },
  deleteMedia: (id: string) => {
    const current = loadDatabase();
    const item = current.media.find(m => m.id === id);
    if (item) {
      current.media = current.media.filter(m => m.id !== id);
      saveDatabase(current);
      // Delete physical file
      try {
        const filePath = path.resolve(UPLOADS_DIR, item.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.error('Failed to delete physical media file:', e);
      }
      return true;
    }
    return false;
  },

  // Store Products
  getProducts: () => loadDatabase().products,
  getProductById: (id: string) => loadDatabase().products.find(p => p.id === id),
  saveProduct: (product: Product) => {
    const current = loadDatabase();
    const index = current.products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      current.products[index] = product;
    } else {
      current.products.unshift(product);
    }
    saveDatabase(current);
    return product;
  },
  deleteProduct: (id: string) => {
    const current = loadDatabase();
    current.products = current.products.filter(p => p.id !== id);
    saveDatabase(current);
  },

  // Settings
  getHomepageSettings: () => loadDatabase().homepageSettings,
  saveHomepageSettings: (settings: HomepageSettings) => {
    const current = loadDatabase();
    current.homepageSettings = settings;
    saveDatabase(current);
    return settings;
  },

  getDonationSettings: () => loadDatabase().donationSettings,
  saveDonationSettings: (settings: DonationSettings) => {
    const current = loadDatabase();
    current.donationSettings = settings;
    saveDatabase(current);
    return settings;
  },

  getWebsiteSettings: () => loadDatabase().websiteSettings,
  saveWebsiteSettings: (settings: WebsiteSettings) => {
    const current = loadDatabase();
    current.websiteSettings = settings;
    saveDatabase(current);
    return settings;
  },
};

export { DATA_DIR, UPLOADS_DIR };
