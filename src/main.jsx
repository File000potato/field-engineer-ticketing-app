import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

/**
 * Main entry point for the React application
 * Creates the root React element and renders the App component
 */
createRoot(document.getElementById("root")).render(<App />);