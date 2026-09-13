import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import AuthGateway from './auth/AuthGateway.jsx';
import './styles.css';
import './management.css';
import './design-system.css';
import './mobile.css';
import './auth/auth.css';
import './auth/tasks.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthGateway>
      {({ workspace, user }) => <App workspace={workspace} user={user} />}
    </AuthGateway>
  </React.StrictMode>,
);
