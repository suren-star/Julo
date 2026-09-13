import { useState } from 'react';
import { backendApi } from '../lib/api-client.js';

const TEST_LOGINS = Object.freeze([
  ['owner1', 'Սեփականատեր'],
  ['admin1', 'Ադմինիստրատոր'],
  ['member1', 'Անդամ'],
  ['viewer1', 'Դիտորդ'],
  ['guest1', 'Հյուր'],
]);

const initialForm = () => ({
  identifier: '',
  password: '',
  username: '',
  email: '',
  displayName: '',
  workspaceName: 'Julo Workspace',
});

export default function AuthPage({ onAuthenticated, initialError = '' }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') {
        await backendApi.login({ identifier: form.identifier, password: form.password });
      } else {
        await backendApi.register({
          username: form.username,
          email: form.email,
          displayName: form.displayName,
          workspaceName: form.workspaceName,
          password: form.password,
        });
      }
      await onAuthenticated();
    } catch (requestError) {
      setError(requestError.message || 'Մուտքը չհաջողվեց։');
    } finally {
      setBusy(false);
    }
  };

  const showTests = import.meta.env.VITE_JULO_SHOW_TEST_USERS === 'true';

  return <main className="auth-page">
    <section className="auth-card">
      <div className="auth-brand">
        <div className="brand-mark">J</div>
        <div><strong>Julo</strong><span>աշխատանքային տարածք</span></div>
      </div>

      <div className="auth-tabs">
        <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => changeMode('login')}>Մուտք</button>
        <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => changeMode('register')}>Գրանցում</button>
      </div>

      <form className="auth-form" onSubmit={submit}>
        {mode === 'login' ? <>
          <label>
            Օգտանուն կամ էլ․ փոստ
            <input autoComplete="username" value={form.identifier} onChange={update('identifier')} required />
          </label>
          <label>
            Գաղտնաբառ
            <input type="password" autoComplete="current-password" value={form.password} onChange={update('password')} required />
          </label>
        </> : <>
          <label>Օգտանուն<input autoComplete="username" value={form.username} onChange={update('username')} required /></label>
          <label>Էլ․ փոստ<input type="email" autoComplete="email" value={form.email} onChange={update('email')} required /></label>
          <label>Անուն<input autoComplete="name" value={form.displayName} onChange={update('displayName')} required /></label>
          <label>Աշխատանքային տարածք<input value={form.workspaceName} onChange={update('workspaceName')} required /></label>
          <label>
            Գաղտնաբառ <small>առնվազն 12 UTF-8 byte</small>
            <input type="password" autoComplete="new-password" value={form.password} onChange={update('password')} required />
          </label>
        </>}

        {error && <div className="auth-error">{error}</div>}
        <button className="primary auth-submit" disabled={busy}>
          {busy ? 'Սպասեք…' : mode === 'login' ? 'Մուտք գործել' : 'Ստեղծել հաշիվ'}
        </button>
      </form>

      {showTests && <details className="test-logins">
        <summary>Թեստային մուտքեր</summary>
        {TEST_LOGINS.map(([username, role]) => <button
          type="button"
          key={username}
          onClick={() => {
            setMode('login');
            setError('');
            setForm((current) => ({ ...current, identifier: username, password: '12345' }));
          }}
        >
          <b>{role}</b><span>{username} / 12345</span>
        </button>)}
      </details>}
    </section>
  </main>;
}
