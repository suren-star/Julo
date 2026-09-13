import { useEffect, useState } from 'react';
import { backendApi } from '../lib/api-client.js';
import AuthPage from './AuthPage.jsx';
import NotesDrawer from './NotesDrawer.jsx';
import ProjectTeamDrawer from './ProjectTeamDrawer.jsx';

const emptyGatewayState = Object.freeze({
  loading: true,
  session: null,
  workspace: null,
  error: '',
});

export default function AuthGateway({ children }) {
  const [state, setState] = useState(emptyGatewayState);
  const [drawer, setDrawer] = useState('');

  const refresh = async () => {
    try {
      const session = await backendApi.session();
      const workspaceResult = await backendApi.workspaces();
      setState({
        loading: false,
        session,
        workspace: workspaceResult.workspaces?.[0] || null,
        error: '',
      });
    } catch (requestError) {
      setState({
        loading: false,
        session: null,
        workspace: null,
        error: requestError.status === 401 ? '' : (requestError.message || 'Backend կապը հասանելի չէ։'),
      });
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  if (state.loading) {
    return <main className="auth-page"><div className="auth-card">Julo-ը բեռնվում է…</div></main>;
  }

  if (!state.session) {
    return <AuthPage onAuthenticated={refresh} initialError={state.error} />;
  }

  if (!state.workspace) {
    return <main className="auth-page"><div className="auth-card">Այս օգտատիրոջ համար հասանելի աշխատանքային տարածք չկա։</div></main>;
  }

  const canManageProjectTeam = ['owner', 'admin', 'member'].includes(state.workspace.role);
  const toggleDrawer = (name) => setDrawer((current) => current === name ? '' : name);

  const logout = async () => {
    await backendApi.logout();
    setDrawer('');
    await refresh();
  };

  const application = typeof children === 'function'
    ? children({ workspace: state.workspace, user: state.session.user })
    : children;

  return <div className="backend-gateway">
    {application}

    <div className="backend-toolbar">
      <span>{state.session.user.displayName} · {state.workspace.role}</span>
      <button type="button" onClick={() => toggleDrawer('notes')}>◷ Հիշեցումներ</button>
      {canManageProjectTeam && <button type="button" onClick={() => toggleDrawer('team')}>♙ Նախագծի թիմ</button>}
      <button type="button" onClick={logout}>Ելք</button>
    </div>

    <NotesDrawer
      workspace={state.workspace}
      open={drawer === 'notes'}
      onClose={() => setDrawer('')}
    />
    {canManageProjectTeam && <ProjectTeamDrawer
      workspace={state.workspace}
      open={drawer === 'team'}
      onClose={() => setDrawer('')}
    />}
  </div>;
}
