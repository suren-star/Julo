import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import AuthGateway from './auth/AuthGateway.jsx';
import './styles.css';
import './management.css';
import './design-system.css';
import './mobile.css';
import './auth/auth.css';

const backendEnabled = import.meta.env.VITE_JULO_BACKEND_ENABLED === 'true';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {backendEnabled ? <AuthGateway><App /></AuthGateway> : <App />}
  </React.StrictMode>,
);
