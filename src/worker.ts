import app from './api/app';

export interface Env {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
  FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  ADMIN_EMAIL?: string;
  ADMIN_EMAILS?: string;
  [key: string]: any;
}

export default {
  async fetch(request: Request, env: Env, ctx?: any): Promise<Response> {
    const url = new URL(request.url);

    // Handle all backend API and media upload requests
    if (url.pathname.startsWith('/api') || url.pathname.startsWith('/uploads')) {
      return app.fetch(request, env, ctx);
    }

    // Serve static frontend assets (HTML, JS, CSS, images) with SPA routing
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return app.fetch(request, env, ctx);
  },
};
