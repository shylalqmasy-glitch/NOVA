import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config, getMissingCredentials } from './server/config.js';
import { authRouter } from './server/routes/auth.routes.js';
import { botRouter } from './server/routes/bot.routes.js';
import { guildsRouter } from './server/routes/guilds.routes.js';
import { aiRouter } from './server/routes/ai.routes.js';
import { featuresRouter } from './server/routes/features.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';
  const port = config.port;

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Log incoming requests in dev
  if (!isProduction) {
    app.use((req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
        console.log(`[HTTP] ${req.method} ${req.path}`);
      }
      next();
    });
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      time: new Date().toISOString(),
      credentials: getMissingCredentials(),
      nodeEnv: process.env.NODE_ENV || 'development',
    });
  });

  // Mount API & Auth routes
  app.use(authRouter);
  app.use(botRouter);
  app.use(guildsRouter);
  app.use(aiRouter);
  app.use(featuresRouter);

  // Global Error Handler for API routes
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[API Error]:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      code: err.code,
    });
  });

  // Vite Integration
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn('[Server] dist directory not found, fallback to basic response');
      app.get('*', (req, res) => {
        res.send('NOVA Server is running. Please build frontend with npm run build.');
      });
    }
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 NOVA Server running on http://0.0.0.0:${port}`);
    console.log(`🌍 APP_URL: ${config.appUrl}`);
    const creds = getMissingCredentials();
    console.log(`🔑 Credentials status: ClientID: ${creds.hasClientId}, Secret: ${creds.hasClientSecret}, BotToken: ${creds.hasBotToken}, GeminiKey: ${creds.hasGeminiKey}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot failure:', err);
  process.exit(1);
});
