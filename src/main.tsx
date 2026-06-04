import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Graceful console error interceptor for network and unconfigured database errors
try {
  const originalError = console.error;
  console.error = function (...args) {
    const errorStr = args.map(arg => {
      if (arg instanceof Error) {
        return arg.message + '\n' + (arg.stack || '');
      }
      if (typeof arg === 'object' && arg !== null) {
        try { return JSON.stringify(arg); } catch (e) { return String(arg); }
      }
      return String(arg);
    }).join(' ');

    if (
      errorStr.toLowerCase().includes('failed to fetch') ||
      errorStr.toLowerCase().includes('load failed') ||
      errorStr.toLowerCase().includes('networkerror') ||
      errorStr.toLowerCase().includes('net::err_')
    ) {
      console.warn('[Gracefully Handled Network Notice]:', ...args);
      return;
    }
    originalError.apply(console, args);
  };
} catch (e) {
  // fallback
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
