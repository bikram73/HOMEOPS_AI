import express, { Request, Response } from 'express';
import path from 'path';
import { createExpressApp } from './server/app';

async function startServer() {
  const app = createExpressApp();
  const PORT = 3000;

  // --- Vite Dev Middleware or Production Static Serving ---
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HomeOps AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
