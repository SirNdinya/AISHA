import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// === GLOBAL ERROR TRAP (debug only) ===
window.onerror = (msg, src, line, col, err) => {
  console.error('[GLOBAL onerror]', msg, '|', src, line, col, err);
};
window.addEventListener('unhandledrejection', (e) => {
  console.error('[GLOBAL unhandledrejection]', e.reason);
});
const originalConsoleError = console.error.bind(console);
console.error = (...args: any[]) => {
  originalConsoleError('[CAUGHT console.error]', ...args);
};
// ======================================

console.log("DEBUG: main.tsx restoring full App...");
const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
