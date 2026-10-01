import http from 'http';
import path from 'path';
import fs from 'fs';
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { getRequestListener } from '@hono/node-server';
import honoApp from './src/api/app';

dotenv.config();

const app = express();
const honoListener = getRequestListener(honoApp.fetch);

// Mount universal API & uploads handler
app.use((req: any, res: any, next: any) => {
  if (req.url && (req.url.startsWith('/api') || req.url.startsWith('/uploads'))) {
    return honoListener(req, res);
  }
  next();
});

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

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

export default app;
