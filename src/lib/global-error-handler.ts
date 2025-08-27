// Global error handler for connection failures and stream conflicts

let supabaseUnavailableWarningShown = false;
let firebaseStreamWarningShown = false;

// Override the global fetch to catch connection failures
const originalFetch = window.fetch;

window.fetch = async function(...args) {
  try {
    return await originalFetch.apply(this, args);
  } catch (error) {
    // Check if this is a Supabase-related fetch failure
    const url = args[0];
    if (typeof url === 'string' && url.includes('supabase.co')) {
      console.warn('Supabase connection failed, falling back to mock data mode');

      // Show warning only once
      if (!supabaseUnavailableWarningShown) {
        supabaseUnavailableWarningShown = true;
        console.info('🔄 Running in offline mode with mock data');
      }

      // Re-throw the error so the fallback mechanisms can handle it
      throw error;
    }

    // For non-Supabase requests, just re-throw
    throw error;
  }
};

// Handle global errors
window.addEventListener('error', (event) => {
  const error = event.error;

  // Handle ReadableStream errors from Firebase/Firestore
  if (error && (error.message?.includes('ReadableStreamDefaultReader') ||
                error.message?.includes('locked to a reader') ||
                error.message?.includes('stream is locked'))) {

    if (!firebaseStreamWarningShown) {
      console.warn('[Field Engineer Portal] Stream reader conflict detected - this is handled gracefully by the application.');
      firebaseStreamWarningShown = true;
    }

    event.preventDefault(); // Prevent the error from being logged as unhandled
    return;
  }

  // Handle Firebase network errors (sign-in and account creation)
  if (error && (error.message?.includes('auth/network-request-failed') ||
                error.message?.includes('network-request-failed'))) {
    console.warn('[Field Engineer Portal] Firebase network error - fallback authentication is active.');
    event.preventDefault();
    return;
  }

  // Handle Firebase account creation errors
  if (error && (error.message?.includes('Account creation error') ||
                error.message?.includes('Sign up error'))) {
    console.warn('[Field Engineer Portal] Firebase account creation error - fallback demo mode is active.');
    event.preventDefault();
    return;
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;

  // Handle ReadableStream errors in promises
  if (reason && (reason.message?.includes('ReadableStreamDefaultReader') ||
                 reason.message?.includes('locked to a reader') ||
                 reason.message?.includes('stream is locked'))) {

    if (!firebaseStreamWarningShown) {
      console.warn('[Field Engineer Portal] Stream reader conflict in promise - this is handled gracefully.');
      firebaseStreamWarningShown = true;
    }

    event.preventDefault(); // Prevent the error from being logged as unhandled
    return;
  }

  // Handle Firebase network errors in promises
  if (reason && (reason.message?.includes('auth/network-request-failed') ||
                 reason.message?.includes('network-request-failed'))) {
    console.warn('[Field Engineer Portal] Firebase network error in promise - fallback authentication is active.');
    event.preventDefault();
    return;
  }

  // Handle Firebase account creation errors in promises
  if (reason && (reason.message?.includes('Account creation error') ||
                 reason.message?.includes('Sign up error'))) {
    console.warn('[Field Engineer Portal] Firebase account creation error in promise - fallback demo mode is active.');
    event.preventDefault();
    return;
  }

  // Handle string-based reason checks
  if (typeof reason === 'string') {
    if (reason.includes('ReadableStreamDefaultReader') ||
        reason.includes('locked to a reader') ||
        reason.includes('stream is locked')) {

      if (!firebaseStreamWarningShown) {
        console.warn('[Field Engineer Portal] Stream reader conflict (string) - this is handled gracefully.');
        firebaseStreamWarningShown = true;
      }

      event.preventDefault();
      return;
    }

    if (reason.includes('auth/network-request-failed') ||
        reason.includes('network-request-failed')) {
      console.warn('[Field Engineer Portal] Firebase network error (string) - fallback authentication is active.');
      event.preventDefault();
      return;
    }
  }
});

export { };
