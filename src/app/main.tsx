import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './global.css';
import './scale.css';
import '../components';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
