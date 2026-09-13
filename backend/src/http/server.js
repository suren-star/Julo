import http from 'node:http';
import { AuthError } from '../auth/auth-service.js';
import { SESSION_COOKIE_NAME, serializeExpiredSessionCookie, serializeSessionCookie } from '../security/session-token.js';
import { createFixedWindowRateLimiter } from './rate-limit.js';

const MAX_JSON_BYTES = 64 * 1024;

function json(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    ...extraHeaders,
  });
  res.end(body);
}

async function readJson(req) {
  const contentType = String(req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') throw new AuthError(415, 'unsupported_media_type', 'Content-Type must be application/json.');
  const declared = Number(req.headers['content-length'] ?? 0);
  if (Number.isFinite(declared) && declared > MAX_JSON_BYTES) throw new AuthError(413, 'payload_too_large', 'Request body is too large.');
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_JSON_BYTES) throw new AuthError(413, 'payload_too_large', 'Request body is too large.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); }
  catch { throw new AuthError(400, 'invalid_json', 'Request body is not valid JSON.'); }
}

function parseCookies(header) {
  const cookies = new Map();
  for (const pair of String(header ?? '').split(';')) {
    const index = pair.indexOf('=');
    if (index < 1) continue;
    cookies.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
  }
  return cookies;
}

function requestIp(req) { return req.socket?.remoteAddress || 'unknown'; }

function enforceBrowserMutationPolicy(req, allowedOrigins) {
  const fetchSite = String(req.headers['sec-fetch-site'] ?? '').toLowerCase();
  if (fetchSite === 'cross-site') throw new AuthError(403, 'cross_site_request_blocked', 'Cross-site mutation is not allowed.');
  const origin = req.headers.origin;
  if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
    throw new AuthError(403, 'origin_not_allowed', 'Origin is not allowed.');
  }
}

export function createHttpServer({ authService, repository, secureCookies = true, allowedOrigins = [], authRateLimiter = createFixedWindowRateLimiter({ limit: 12, windowMs: 60_000 }) }) {
  if (!authService) throw new TypeError('authService is required');
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/health') {
        const db = repository?.ping ? await repository.ping() : true;
        return json(res, db ? 200 : 503, { ok: Boolean(db) });
      }

      const cookies = parseCookies(req.headers.cookie);
      const token = cookies.get(SESSION_COOKIE_NAME);

      if (req.method === 'POST' && ['/api/auth/register','/api/auth/login'].includes(url.pathname)) {
        enforceBrowserMutationPolicy(req, allowedOrigins);
        const rate = authRateLimiter.consume(`${requestIp(req)}:${url.pathname}`);
        if (!rate.allowed) return json(res, 429, { error: { code: 'rate_limited', message: 'Too many authentication attempts.' } }, { 'Retry-After': String(Math.ceil((rate.resetAt - Date.now()) / 1000)) });
        const input = await readJson(req);
        const result = url.pathname.endsWith('/register') ? await authService.register(input) : await authService.login(input);
        return json(res, url.pathname.endsWith('/register') ? 201 : 200, { user: result.user, workspace: result.workspace }, {
          'Set-Cookie': serializeSessionCookie(result.session.token, { maxAgeSeconds: result.session.maxAgeSeconds, secure: secureCookies }),
        });
      }

      if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
        enforceBrowserMutationPolicy(req, allowedOrigins);
        await authService.logout(token);
        return json(res, 200, { ok: true }, { 'Set-Cookie': serializeExpiredSessionCookie({ secure: secureCookies }) });
      }

      if (req.method === 'GET' && url.pathname === '/api/auth/session') {
        const session = await authService.getSession(token);
        if (!session) return json(res, 401, { error: { code: 'not_authenticated', message: 'Authentication required.' } });
        return json(res, 200, session);
      }

      return json(res, 404, { error: { code: 'not_found', message: 'Route not found.' } });
    } catch (error) {
      if (error instanceof AuthError) return json(res, error.status, { error: { code: error.code, message: error.message } });
      console.error('Unhandled HTTP error', error);
      return json(res, 500, { error: { code: 'internal_error', message: 'Internal server error.' } });
    }
  });
  return server;
}
