/**
 * @fileoverview Main entry point for the Field Engineer Portal application
 * @author Field Engineer Portal Team
 */

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { performanceMonitor } from './lib/performance'
import { config, validateEnvironmentConfig, envLog } from './config/environment'

// Validate environment configuration on startup
const validation = validateEnvironmentConfig();
if (!validation.isValid) {
  envLog('error', 'Environment configuration validation failed:', validation.errors);

  if (config.isProduction) {
    // In production, show a user-friendly error message
    document.body.innerHTML = `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        font-family: system-ui, -apple-system, sans-serif;
        background: #f8f9fa;
        color: #333;
        text-align: center;
        padding: 20px;
      ">
        <div>
          <h1 style="color: #dc3545; margin-bottom: 20px;">Configuration Error</h1>
          <p style="margin-bottom: 10px;">The application is not properly configured.</p>
          <p style="color: #6c757d; font-size: 14px;">Please contact your system administrator.</p>
        </div>
      </div>
    `;
    throw new Error('Application configuration validation failed in production');
  }
}

// Mark app start for performance tracking
performanceMonitor.mark('app-start');

// Initialize security and performance monitoring
if (typeof window !== 'undefined') {
  // Track initial load performance
  window.addEventListener('load', () => {
    performanceMonitor.mark('app-loaded');
    performanceMonitor.measure('app-load-time', 'app-start', 'app-loaded');
  });

  // Set global error handler for unhandled errors
  window.addEventListener('error', (event) => {
    envLog('error', 'Unhandled error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });

  // Set global handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    envLog('error', 'Unhandled promise rejection:', event.reason);
    event.preventDefault(); // Prevent default browser handling
  });
}

// Log startup information
envLog('log', `Starting ${config.app.name} v${config.app.version} in ${config.isProduction ? 'production' : 'development'} mode`);

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
