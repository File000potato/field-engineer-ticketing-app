import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { performanceMonitor } from './lib/performance'

// Mark app start for performance tracking
performanceMonitor.mark('app-start');

// Initialize security and performance monitoring
if (typeof window !== 'undefined') {
  // Track initial load performance
  window.addEventListener('load', () => {
    performanceMonitor.mark('app-loaded');
    performanceMonitor.measure('app-load-time', 'app-start', 'app-loaded');
  });
}

// Create and render the app
const root = createRoot(document.getElementById("root")!);

// Mark React render start
performanceMonitor.mark('react-render-start');

root.render(<App />);

// Mark React render complete
setTimeout(() => {
  performanceMonitor.mark('react-render-complete');
  performanceMonitor.measure('react-render-time', 'react-render-start', 'react-render-complete');
}, 0);
