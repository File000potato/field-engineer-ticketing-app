/**
 * @fileoverview Environment configuration for the Field Engineer Portal application
 * @author Field Engineer Portal Team
 */

/**
 * Environment configuration interface
 * @interface EnvironmentConfig
 */
interface EnvironmentConfig {
  /** Whether the app is running in production mode */
  isProduction: boolean;
  
  /** Whether the app is running in development mode */
  isDevelopment: boolean;
  
  /** Whether to enable debug features */
  enableDebug: boolean;
  
  /** Firebase configuration */
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    isConfigured: boolean;
  };
  
  /** Application configuration */
  app: {
    name: string;
    version: string;
    baseUrl: string;
  };
  
  /** Feature flags */
  features: {
    enableMockFallback: boolean;
    enableOfflineMode: boolean;
    enablePushNotifications: boolean;
    enableAuditLogging: boolean;
  };
}

/**
 * Gets the current environment configuration
 * @returns {EnvironmentConfig} Environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const isProduction = import.meta.env.PROD;
  const isDevelopment = import.meta.env.DEV;
  
  // Firebase configuration
  const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const firebaseAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const firebaseProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const firebaseStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  const firebaseMessagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const firebaseAppId = import.meta.env.VITE_FIREBASE_APP_ID;

  const isFirebaseConfigured = Boolean(
    firebaseApiKey &&
    firebaseProjectId &&
    firebaseApiKey !== 'demo-api-key' &&
    firebaseProjectId !== 'demo-project'
  );

  return {
    isProduction,
    isDevelopment,
    enableDebug: isDevelopment,
    
    firebase: {
      apiKey: firebaseApiKey || '',
      authDomain: firebaseAuthDomain || '',
      projectId: firebaseProjectId || '',
      storageBucket: firebaseStorageBucket || '',
      messagingSenderId: firebaseMessagingSenderId || '',
      appId: firebaseAppId || '',
      isConfigured: isFirebaseConfigured
    },
    
    app: {
      name: 'Field Engineer Portal',
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      baseUrl: import.meta.env.VITE_APP_BASE_URL || window.location.origin
    },
    
    features: {
      // In production, disable mock fallback since Firebase is fast and reliable
      enableMockFallback: false,
      enableOfflineMode: true,
      enablePushNotifications: isProduction && isFirebaseConfigured,
      enableAuditLogging: isFirebaseConfigured,
      enableRealTimeUpdates: isFirebaseConfigured
    }
  };
}

/**
 * Validates the environment configuration
 * @returns {Object} Validation result with any errors
 */
export function validateEnvironmentConfig(): { isValid: boolean; errors: string[] } {
  const config = getEnvironmentConfig();
  const errors: string[] = [];

  // Check if running in production without proper Firebase configuration
  if (config.isProduction && !config.firebase.isConfigured) {
    errors.push('Production mode requires valid Firebase configuration (VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID)');
  }

  // Validate Firebase project ID format
  if (config.firebase.projectId && config.firebase.projectId.includes(' ')) {
    errors.push('Invalid Firebase project ID format (no spaces allowed)');
  }

  // Check for placeholder values
  if (config.firebase.apiKey === 'demo-api-key' || config.firebase.projectId === 'demo-project') {
    errors.push('Please replace placeholder Firebase credentials with actual values');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Logs environment configuration (excluding sensitive data)
 */
export function logEnvironmentConfig(): void {
  const config = getEnvironmentConfig();
  const validation = validateEnvironmentConfig();
  
  console.log('🔧 Environment Configuration:', {
    mode: config.isProduction ? 'production' : 'development',
    app: config.app,
    features: config.features,
    firebase: {
      configured: config.firebase.isConfigured,
      projectId: config.firebase.projectId || 'not set'
    },
    validation: validation.isValid ? '✅ Valid' : `❌ Invalid: ${validation.errors.join(', ')}`
  });
  
  if (!validation.isValid) {
    console.warn('⚠️ Environment configuration issues:', validation.errors);
    
    if (config.isProduction) {
      console.error('🚨 Production deployment with invalid configuration!');
    }
  }
}

// Export the singleton configuration
export const config = getEnvironmentConfig();

// Log configuration on module load (only in development)
if (config.isDevelopment) {
  logEnvironmentConfig();
}

/**
 * Environment-aware console logging
 * @param {string} level - Log level (log, warn, error)
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments
 */
export function envLog(level: 'log' | 'warn' | 'error', message: string, ...args: any[]): void {
  if (config.enableDebug || level === 'error') {
    console[level](`[${config.app.name}]`, message, ...args);
  }
}

/**
 * Checks if a feature is enabled
 * @param {keyof EnvironmentConfig['features']} feature - Feature name
 * @returns {boolean} Whether the feature is enabled
 */
export function isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
  return config.features[feature];
}
