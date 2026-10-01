export interface User {
  id: string;
  email: string;
  username: string;
  role?: 'admin' | 'member';
  avatar?: string;
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

export interface DashboardStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  categories: number;
  totalMedia: number;
  totalProducts: number;
  recentArticles: Article[];
}

export interface AuthStatus {
  hasAdmin: boolean;
  isAuthenticated: boolean;
  user: User | null;
}
