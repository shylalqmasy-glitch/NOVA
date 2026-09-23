import { Router } from 'express';
import crypto from 'crypto';
import { config, getMissingCredentials } from '../config.js';
import { discordService } from '../services/discord.service.js';
import { db } from '../db/index.js';

export const authRouter = Router();

// Helper to determine accurate redirect URI
export function getRedirectUri(req: any): string {
  // If APP_URL is provided in environment, use it as primary authority
  if (config.appUrl && config.appUrl.startsWith('http')) {
    const clean = config.appUrl.replace(/\/+$/, '');
    return `${clean}/auth/callback`;
  }
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
  return `${protocol}://${host}/auth/callback`;
}

// 1. Auth URL
authRouter.get('/api/auth/url', (req, res) => {
  try {
    const redirectUri = getRedirectUri(req);
    const state = crypto.randomBytes(16).toString('hex');
    const url = discordService.getOAuthUrl(redirectUri, state);
    res.json({ url, redirectUri });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Auth Callback (Handles both trailing slash variations)
const callbackHandler = async (req: any, res: any) => {
  const { code, error, error_description } = req.query;

  if (error) {
    return res.status(400).send(`
      <html>
        <body style="background:#090a0f;color:#ef4444;font-family:sans-serif;padding:2rem;">
          <h2>Discord Authorization Denied</h2>
          <p>${error_description || error}</p>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `);
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).send(`
      <html>
        <body style="background:#090a0f;color:#ef4444;font-family:sans-serif;padding:2rem;">
          <h2>Missing authorization code</h2>
          <script>
            setTimeout(() => window.close(), 2500);
          </script>
        </body>
      </html>
    `);
  }

  try {
    const redirectUri = getRedirectUri(req);
    const tokens = await discordService.exchangeCode(code, redirectUri);
    const discordUser = await discordService.getCurrentUser(tokens.access_token);

    // Persist user in database
    const userRecord = {
      id: discordUser.id,
      username: discordUser.username,
      globalName: discordUser.global_name,
      discriminator: discordUser.discriminator,
      avatar: discordUser.avatar,
      email: discordUser.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      updatedAt: new Date().toISOString(),
    };
    db.upsertUser(userRecord);

    // Create session
    const sessionId = crypto.randomBytes(32).toString('hex');
    db.createSession(sessionId, discordUser.id, 72);

    // Set secure cookie for cross-origin iframe context (SameSite=none; Secure=true)
    res.cookie('nova_session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 72 * 60 * 60 * 1000, // 3 days
    });

    // Send postMessage to opener window and close popup
    return res.send(`
      <!doctype html>
      <html>
        <head>
          <title>NOVA - Authorized</title>
          <style>
            body {
              background: #090a0f;
              color: #f1f5f9;
              font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
            }
            .spinner {
              width: 32px;
              height: 32px;
              border: 3px solid rgba(124, 58, 237, 0.2);
              border-top-color: #8b5cf6;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
              margin-bottom: 1rem;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <p>Connecting NOVA to your Discord account...</p>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', userId: '${discordUser.id}' }, '*');
                setTimeout(() => window.close(), 600);
              } else {
                window.location.href = '/';
              }
            } catch (e) {
              window.close();
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('[OAuth Callback Error]:', err);
    return res.status(500).send(`
      <html>
        <body style="background:#090a0f;color:#ef4444;font-family:sans-serif;padding:2rem;">
          <h2>Authentication Failed</h2>
          <p>${err.message}</p>
          <p><a href="/" style="color:#a78bfa;">Return to NOVA</a></p>
        </body>
      </html>
    `);
  }
};

authRouter.get(['/auth/callback', '/auth/callback/'], callbackHandler);

// 3. Current User Session Check
authRouter.get('/api/auth/me', (req, res) => {
  const sessionId = req.cookies?.nova_session || req.headers.authorization?.replace('Bearer ', '');
  if (!sessionId) {
    return res.status(401).json({ authenticated: false, user: null });
  }

  const session = db.getSession(sessionId);
  if (!session) {
    return res.status(401).json({ authenticated: false, user: null });
  }

  const user = db.getUser(session.userId);
  if (!user) {
    return res.status(401).json({ authenticated: false, user: null });
  }

  res.json({
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      globalName: user.globalName,
      discriminator: user.discriminator,
      avatar: user.avatar,
      email: user.email,
    },
  });
});

// 4. Logout
authRouter.post('/api/auth/logout', (req, res) => {
  const sessionId = req.cookies?.nova_session;
  if (sessionId) {
    db.deleteSession(sessionId);
  }
  res.clearCookie('nova_session', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });
  res.json({ success: true });
});

// 5. System Status (Configuration Check)
authRouter.get('/api/auth/status', (req, res) => {
  const redirectUri = getRedirectUri(req);
  const creds = getMissingCredentials();

  res.json({
    appUrl: config.appUrl,
    redirectUri,
    credentials: creds,
    isReady: creds.hasClientId && creds.hasClientSecret && creds.hasBotToken && creds.hasGeminiKey,
    discordClientId: creds.hasClientId ? config.discord.clientId : undefined,
  });
});
