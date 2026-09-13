import http from 'node:http';
import { AuthError } from '../auth/auth-service.js';
import { getRoleDefaults } from '../domain/authorization.js';
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

function applyCors(req, res, allowedOrigins) {
  const origin = String(req.headers.origin ?? '');
  if (!origin || !allowedOrigins.includes(origin)) return false;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return true;
}

function enforceBrowserMutationPolicy(req, allowedOrigins) {
  const fetchSite = String(req.headers['sec-fetch-site'] ?? '').toLowerCase();
  const origin = String(req.headers.origin ?? '');
  if (origin) {
    if (!allowedOrigins.includes(origin)) throw new AuthError(403, 'origin_not_allowed', 'Origin is not allowed.');
    return;
  }
  if (fetchSite === 'cross-site') throw new AuthError(403, 'cross_site_request_blocked', 'Cross-site mutation is not allowed.');
}

export function createHttpServer({ authService, workspaceService, taskCommandService, projectNotesService, repository, secureCookies = true, crossSiteCookies = false, allowedOrigins = [], authRateLimiter = createFixedWindowRateLimiter({ limit: 12, windowMs: 60_000 }) }) {
  if (!authService) throw new TypeError('authService is required');
  const server = http.createServer(async (req, res) => {
    try {
      const corsAllowed = applyCors(req, res, allowedOrigins);
      if (req.method === 'OPTIONS') {
        if (req.headers.origin && !corsAllowed) return json(res, 403, { error: { code: 'origin_not_allowed', message: 'Origin is not allowed.' } });
        res.writeHead(204, { 'Cache-Control': 'no-store' });
        return res.end();
      }

      const url = new URL(req.url ?? '/', 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/health') {
        const db = repository?.ping ? await repository.ping() : true;
        return json(res, db ? 200 : 503, { ok: Boolean(db) });
      }
      if (req.method === 'GET' && url.pathname === '/api/roles/defaults') return json(res, 200, { roles: getRoleDefaults() });

      const cookies = parseCookies(req.headers.cookie);
      const token = cookies.get(SESSION_COOKIE_NAME);
      const sameSite = crossSiteCookies ? 'None' : 'Lax';

      if (req.method === 'POST' && ['/api/auth/register','/api/auth/login'].includes(url.pathname)) {
        enforceBrowserMutationPolicy(req, allowedOrigins);
        const rate = authRateLimiter.consume(`${requestIp(req)}:${url.pathname}`);
        if (!rate.allowed) return json(res, 429, { error: { code: 'rate_limited', message: 'Too many authentication attempts.' } }, { 'Retry-After': String(Math.ceil((rate.resetAt - Date.now()) / 1000)) });
        const input = await readJson(req);
        const result = url.pathname.endsWith('/register') ? await authService.register(input) : await authService.login(input);
        return json(res, url.pathname.endsWith('/register') ? 201 : 200, { user: result.user, workspace: result.workspace }, {
          'Set-Cookie': serializeSessionCookie(result.session.token, { maxAgeSeconds: result.session.maxAgeSeconds, secure: secureCookies, sameSite }),
        });
      }

      if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
        enforceBrowserMutationPolicy(req, allowedOrigins); await authService.logout(token);
        return json(res, 200, { ok: true }, { 'Set-Cookie': serializeExpiredSessionCookie({ secure: secureCookies, sameSite }) });
      }

      if (req.method === 'GET' && url.pathname === '/api/auth/session') {
        const session = await authService.getSession(token);
        if (!session) return json(res, 401, { error: { code: 'not_authenticated', message: 'Authentication required.' } });
        return json(res, 200, session);
      }

      if (url.pathname === '/api/workspaces' || url.pathname.startsWith('/api/workspaces/')) {
        if (!workspaceService) return json(res, 503, { error: { code: 'workspace_api_unavailable', message: 'Workspace API unavailable.' } });
        const session = await authService.getSession(token);
        if (!session) return json(res, 401, { error: { code: 'not_authenticated', message: 'Authentication required.' } });
        const userId = session.user.id;

        if (req.method === 'GET' && url.pathname === '/api/workspaces') return json(res, 200, { workspaces: await workspaceService.listWorkspaces(userId) });

        const assigneeCandidates = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/task-assignees$/);
        if (req.method === 'GET' && assigneeCandidates) {
          const workspaceId = decodeURIComponent(assigneeCandidates[1]);
          const projectId = url.searchParams.get('projectId');
          return json(res, 200, { assignees: await workspaceService.listTaskAssigneeCandidates(userId, workspaceId, projectId) });
        }

        const taskMutation = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/tasks\/([^/]+)(?:\/timer\/(start|pause|stop))?$/);
        if (taskMutation) {
          if (!taskCommandService) return json(res, 503, { error: { code: 'task_commands_unavailable', message: 'Task commands unavailable.' } });
          const workspaceId=decodeURIComponent(taskMutation[1]), taskId=decodeURIComponent(taskMutation[2]), timerCommand=taskMutation[3];
          if (req.method === 'PATCH' && !timerCommand) { enforceBrowserMutationPolicy(req,allowedOrigins); return json(res,200,{task:await taskCommandService.updateTask(userId,workspaceId,taskId,await readJson(req))}); }
          if (req.method === 'POST' && timerCommand) { enforceBrowserMutationPolicy(req,allowedOrigins); return json(res,200,{timer:await taskCommandService.timerCommand(userId,workspaceId,taskId,timerCommand)}); }
        }

        if (projectNotesService) {
          const projectMember = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/projects\/([^/]+)\/members\/([^/]+)$/);
          if (projectMember) {
            const [workspaceId,projectId,targetUserId]=projectMember.slice(1).map(decodeURIComponent);
            if (req.method==='PUT') { enforceBrowserMutationPolicy(req,allowedOrigins); return json(res,200,{membership:await projectNotesService.setProjectMember(userId,workspaceId,projectId,targetUserId,await readJson(req))}); }
            if (req.method==='DELETE') { enforceBrowserMutationPolicy(req,allowedOrigins); return json(res,200,{ok:await projectNotesService.removeProjectMember(userId,workspaceId,projectId,targetUserId)}); }
          }
          const projectRoute = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/projects\/([^/]+)(?:\/(members))?$/);
          if (projectRoute) {
            const workspaceId=decodeURIComponent(projectRoute[1]), projectId=decodeURIComponent(projectRoute[2]), sub=projectRoute[3];
            if (req.method==='GET' && sub==='members') return json(res,200,{members:await projectNotesService.listProjectMembers(userId,workspaceId,projectId)});
            if (req.method==='PATCH' && !sub) { enforceBrowserMutationPolicy(req,allowedOrigins); return json(res,200,{project:await projectNotesService.renameProject(userId,workspaceId,projectId,await readJson(req))}); }
            if (req.method==='DELETE' && !sub) { enforceBrowserMutationPolicy(req,allowedOrigins); await projectNotesService.deleteProject(userId,workspaceId,projectId); return json(res,200,{ok:true}); }
          }
          const noteRoute=url.pathname.match(/^\/api\/workspaces\/([^/]+)\/notes\/([^/]+)(?:\/(convert))?$/);
          if (noteRoute) {
            const workspaceId=decodeURIComponent(noteRoute[1]), noteId=decodeURIComponent(noteRoute[2]), sub=noteRoute[3];
            if (req.method==='PATCH' && !sub) { enforceBrowserMutationPolicy(req,allowedOrigins); return json(res,200,{note:await projectNotesService.updateNote(userId,workspaceId,noteId,await readJson(req))}); }
            if (req.method==='DELETE' && !sub) { enforceBrowserMutationPolicy(req,allowedOrigins); await projectNotesService.deleteNote(userId,workspaceId,noteId); return json(res,200,{ok:true}); }
            if (req.method==='POST' && sub==='convert') { enforceBrowserMutationPolicy(req,allowedOrigins); return json(res,201,await projectNotesService.convertNote(userId,workspaceId,noteId,await readJson(req))); }
          }
          const collectionRoute=url.pathname.match(/^\/api\/workspaces\/([^/]+)\/(members|projects|notes)$/);
          if (collectionRoute) {
            const workspaceId=decodeURIComponent(collectionRoute[1]), resource=collectionRoute[2];
            if (req.method==='GET' && resource==='members') return json(res,200,{members:await projectNotesService.listWorkspaceMembers(userId,workspaceId)});
            if (req.method==='POST' && resource==='projects') { enforceBrowserMutationPolicy(req,allowedOrigins); return json(res,201,{project:await projectNotesService.createProject(userId,workspaceId,await readJson(req))}); }
            if (req.method==='GET' && resource==='notes') return json(res,200,{notes:await projectNotesService.listNotes(userId,workspaceId)});
            if (req.method==='POST' && resource==='notes') { enforceBrowserMutationPolicy(req,allowedOrigins); return json(res,201,{note:await projectNotesService.createNote(userId,workspaceId,await readJson(req))}); }
          }
        }

        const match = url.pathname.match(/^\/api\/workspaces\/([^/]+)(?:\/(projects|tasks))?$/);
        if (match) {
          const workspaceId=decodeURIComponent(match[1]), resource=match[2];
          if (req.method==='GET' && !resource) return json(res,200,{workspace:await workspaceService.getWorkspace(userId,workspaceId)});
          if (req.method==='GET' && resource==='projects') return json(res,200,{projects:await workspaceService.listProjects(userId,workspaceId)});
          if (req.method==='GET' && resource==='tasks') return json(res,200,{tasks:await workspaceService.listTasks(userId,workspaceId)});
          if (req.method==='POST' && resource==='tasks') { enforceBrowserMutationPolicy(req,allowedOrigins); return json(res,201,{task:await workspaceService.createTask(userId,workspaceId,await readJson(req))}); }
        }
      }

      return json(res, 404, { error: { code: 'not_found', message: 'Route not found.' } });
    } catch (error) {
      if (error instanceof AuthError || (Number.isInteger(error?.status) && typeof error?.code === 'string')) return json(res,error.status,{error:{code:error.code,message:error.message}});
      console.error('Unhandled HTTP error', error); return json(res,500,{error:{code:'internal_error',message:'Internal server error.'}});
    }
  });
  return server;
}
