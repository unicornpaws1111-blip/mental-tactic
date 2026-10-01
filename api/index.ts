import type { IncomingMessage, ServerResponse } from 'http';
import { getRequestListener } from '@hono/node-server';
import app from '../src/api/app';

const listener = getRequestListener(app.fetch);

export default function handler(req: IncomingMessage, res: ServerResponse) {
  const matchedPath = req.headers['x-matched-path'];
  if (typeof matchedPath === 'string' && (matchedPath.startsWith('/api') || matchedPath.startsWith('/uploads'))) {
    req.url = matchedPath;
  } else if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/uploads')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }
  return listener(req, res);
}

export { app };
