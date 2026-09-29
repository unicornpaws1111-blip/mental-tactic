import React, { useEffect } from 'react';
import { RouterProvider, useRouter } from './context/RouterContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminArticles } from './pages/admin/AdminArticles';
import { AdminArticleEditor } from './pages/admin/AdminArticleEditor';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminMedia } from './pages/admin/AdminMedia';
import { AdminStore } from './pages/admin/AdminStore';
import { AdminDonations } from './pages/admin/AdminDonations';
import { AdminHomepage } from './pages/admin/AdminHomepage';
import { AdminSettings } from './pages/admin/AdminSettings';

// Public Pages
import { PublicHome } from './pages/public/PublicHome';
import { PublicArticles } from './pages/public/PublicArticles';
import { PublicArticleDetail } from './pages/public/PublicArticleDetail';
import { PublicStore } from './pages/public/PublicStore';
import { PublicDonations } from './pages/public/PublicDonations';

function AppContent() {
  const { path, replace } = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Dynamic meta tags & SEO protection for admin routes
  useEffect(() => {
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (path.startsWith('/admin')) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, nofollow');
      document.title = 'Mental Tactic | CMS Administration';
    } else {
      if (robotsMeta) {
        robotsMeta.setAttribute('content', 'index, follow');
      }
    }
  }, [path]);

  // Route Dispatcher
  // ----------------------------------------------------
  // ADMIN ROUTES
  // ----------------------------------------------------
  if (path === '/admin') {
    if (isLoading) return null;
    if (isAuthenticated) {
      replace('/admin/dashboard');
      return null;
    } else {
      replace('/admin/login');
      return null;
    }
  }

  if (path === '/admin/login') {
    return <AdminLogin />;
  }

  if (path === '/admin/dashboard') {
    return <AdminDashboard />;
  }

  if (path === '/admin/articles') {
    return <AdminArticles />;
  }

  if (path === '/admin/articles/new') {
    return <AdminArticleEditor />;
  }

  // Matches /admin/articles/:id/edit
  const articleEditMatch = path.match(/^\/admin\/articles\/([^/]+)\/edit$/);
  if (articleEditMatch) {
    const articleId = articleEditMatch[1];
    return <AdminArticleEditor articleId={articleId} />;
  }

  if (path === '/admin/categories') {
    return <AdminCategories />;
  }

  if (path === '/admin/media') {
    return <AdminMedia />;
  }

  if (path === '/admin/store') {
    return <AdminStore />;
  }

  if (path === '/admin/donations') {
    return <AdminDonations />;
  }

  if (path === '/admin/homepage') {
    return <AdminHomepage />;
  }

  if (path === '/admin/settings') {
    return <AdminSettings />;
  }

  // Any other /admin/* route fallback
  if (path.startsWith('/admin/')) {
    if (isAuthenticated) {
      replace('/admin/dashboard');
    } else {
      replace('/admin/login');
    }
    return null;
  }

  // ----------------------------------------------------
  // PUBLIC ROUTES (No Admin UI elements)
  // ----------------------------------------------------
  if (path === '/' || path === '') {
    return <PublicHome />;
  }

  if (path === '/articles') {
    return <PublicArticles />;
  }

  // Matches /articles/:slug
  const publicArticleMatch = path.match(/^\/articles\/([^/]+)$/);
  if (publicArticleMatch) {
    const slug = publicArticleMatch[1];
    return <PublicArticleDetail slug={slug} />;
  }

  if (path === '/store') {
    return <PublicStore />;
  }

  if (path === '/donations') {
    return <PublicDonations />;
  }

  // Fallback to Home for unmatched public paths
  return <PublicHome />;
}

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </RouterProvider>
    </ThemeProvider>
  );
}
