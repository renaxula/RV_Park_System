import { createRoot } from 'react-dom/client'
import './index.css'
import React from 'react';
import AppRouter from './components/router/AppRouter';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);