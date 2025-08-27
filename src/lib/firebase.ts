/**
 * @fileoverview Firebase configuration and services for the Field Engineer Portal
 * @author Field Engineer Portal Team
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  connectAuthEmulator, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp,
  serverTimestamp,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { envLog, config } from '@/config/environment';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Connect to emulators in development (with proper guards)
let emulatorConnectionAttempted = false;

if (config.isDevelopment && !config.isProduction && isFirebaseConfigured()) {
  const isEmulatorSetup = localStorage.getItem('firebase-emulator-setup');

  if (!isEmulatorSetup && !emulatorConnectionAttempted) {
    emulatorConnectionAttempted = true;

    try {
      // Check if emulators are already connected
      if (!(auth as any)._delegate?._authDomain?.includes('localhost')) {
        connectAuthEmulator(auth, 'http://localhost:9099');
      }

      if (!(db as any)._delegate?._databaseId?.host?.includes('localhost')) {
        connectFirestoreEmulator(db, 'localhost', 8080);
      }

      if (!(storage as any)._delegate?._host?.includes('localhost')) {
        connectStorageEmulator(storage, 'localhost', 9199);
      }

      localStorage.setItem('firebase-emulator-setup', 'true');
      envLog('log', 'Connected to Firebase emulators safely');
    } catch (error: any) {
      // Don't fail if emulators are already connected or not available
      if (error.message?.includes('already')) {
        envLog('log', 'Firebase emulators already connected');
        localStorage.setItem('firebase-emulator-setup', 'true');
      } else {
        envLog('warn', 'Firebase emulators not available, using production:', error);
      }
    }
  }
}

/**
 * Check if Firebase is properly configured
 * @returns {boolean} Whether Firebase is configured
 */
export function isFirebaseConfigured(): boolean {
  return firebaseConfig.apiKey !== "demo-api-key" && 
         firebaseConfig.projectId !== "demo-project";
}

/**
 * Authentication service
 */
export const authService = {
  /**
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<User>} Firebase user
   */
  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      envLog('log', 'User signed in successfully:', result.user.email);
      return result.user;
    } catch (error: any) {
      envLog('error', 'Sign in error:', error);
      throw new Error(error.message || 'Sign in failed');
    }
  },

  /**
   * Sign in with Google
   * @returns {Promise<User>} Firebase user
   */
  async signInWithGoogle(): Promise<User> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      envLog('log', 'User signed in with Google:', result.user.email);
      return result.user;
    } catch (error: any) {
      envLog('error', 'Google sign in error:', error);
      throw new Error(error.message || 'Google sign in failed');
    }
  },

  /**
   * Create account with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} fullName - User full name
   * @returns {Promise<User>} Firebase user
   */
  async createAccount(email: string, password: string, fullName: string): Promise<User> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile document
      await setDoc(doc(db, 'users', result.user.uid), {
        id: result.user.uid,
        email: result.user.email,
        fullName: fullName,
        role: 'field_engineer', // Default role
        department: null,
        phone: null,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      envLog('log', 'Account created successfully:', result.user.email);
      return result.user;
    } catch (error: any) {
      envLog('error', 'Account creation error:', error);
      throw new Error(error.message || 'Account creation failed');
    }
  },

  /**
   * Sign out current user
   * @returns {Promise<void>}
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      envLog('log', 'User signed out successfully');
    } catch (error: any) {
      envLog('error', 'Sign out error:', error);
      throw new Error(error.message || 'Sign out failed');
    }
  },

  /**
   * Get current user
   * @returns {User|null} Current Firebase user
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  /**
   * Listen to authentication state changes
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }
};

/**
 * Database service for Firestore operations
 */
export const dbService = {
  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @returns {Promise<any>} User profile data
   */
  async getUserProfile(userId: string): Promise<any> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        envLog('warn', 'User profile not found:', userId);
        return null;
      }
    } catch (error) {
      envLog('error', 'Error getting user profile:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateUserProfile(userId: string, updates: any): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      envLog('log', 'User profile updated:', userId);
    } catch (error) {
      envLog('error', 'Error updating user profile:', error);
      throw error;
    }
  },

  /**
   * Get tickets with real-time updates
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @param {Function} callback - Callback for real-time updates
   * @returns {Function} Unsubscribe function
   */
  getTicketsRealtime(userId: string, userRole: string, callback: (tickets: any[]) => void): () => void {
    try {
      let q;
      
      if (userRole === 'admin' || userRole === 'supervisor') {
        // Admins and supervisors see all tickets
        q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
      } else {
        // Field engineers see only their tickets
        q = query(
          collection(db, 'tickets'),
          where('createdBy', '==', userId),
          orderBy('createdAt', 'desc')
        );
      }

      return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
        const tickets = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamps to JavaScript dates
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          resolvedAt: doc.data().resolvedAt?.toDate(),
          dueDate: doc.data().dueDate?.toDate()
        }));
        callback(tickets);
      }, (error) => {
        envLog('error', 'Error in tickets real-time listener:', error);
      });
    } catch (error) {
      envLog('error', 'Error setting up tickets listener:', error);
      return () => {}; // Return empty unsubscribe function
    }
  },

  /**
   * Create a new ticket
   * @param {Object} ticketData - Ticket data
   * @returns {Promise<string>} New ticket ID
   */
  async createTicket(ticketData: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'tickets'), {
        ...ticketData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'open'
      });
      
      envLog('log', 'Ticket created:', docRef.id);
      return docRef.id;
    } catch (error) {
      envLog('error', 'Error creating ticket:', error);
      throw error;
    }
  },

  /**
   * Update a ticket
   * @param {string} ticketId - Ticket ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateTicket(ticketId: string, updates: any): Promise<void> {
    try {
      const docRef = doc(db, 'tickets', ticketId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      envLog('log', 'Ticket updated:', ticketId);
    } catch (error) {
      envLog('error', 'Error updating ticket:', error);
      throw error;
    }
  },

  /**
   * Delete a ticket
   * @param {string} ticketId - Ticket ID
   * @returns {Promise<void>}
   */
  async deleteTicket(ticketId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'tickets', ticketId));
      envLog('log', 'Ticket deleted:', ticketId);
    } catch (error) {
      envLog('error', 'Error deleting ticket:', error);
      throw error;
    }
  },

  /**
   * Get users by role
   * @param {string} role - User role filter
   * @returns {Promise<any[]>} Array of users
   */
  async getUsersByRole(role?: string): Promise<any[]> {
    try {
      let q;
      if (role) {
        q = query(collection(db, 'users'), where('role', '==', role), where('isActive', '==', true));
      } else {
        q = query(collection(db, 'users'), where('isActive', '==', true));
      }

      return new Promise((resolve, reject) => {
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          unsubscribe(); // Unsubscribe after getting data once
          resolve(users);
        }, reject);
      });
    } catch (error) {
      envLog('error', 'Error getting users by role:', error);
      throw error;
    }
  },

  /**
   * Create a notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<string>} New notification ID
   */
  async createNotification(notificationData: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notificationData,
        createdAt: serverTimestamp(),
        isRead: false
      });
      
      envLog('log', 'Notification created:', docRef.id);
      return docRef.id;
    } catch (error) {
      envLog('error', 'Error creating notification:', error);
      throw error;
    }
  },

  /**
   * Get notifications for a user with real-time updates
   * @param {string} userId - User ID
   * @param {Function} callback - Callback for real-time updates
   * @returns {Function} Unsubscribe function
   */
  getNotificationsRealtime(userId: string, callback: (notifications: any[]) => void): () => void {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));
        callback(notifications);
      }, (error) => {
        envLog('error', 'Error in notifications listener:', error);
      });
    } catch (error) {
      envLog('error', 'Error setting up notifications listener:', error);
      return () => {};
    }
  }
};

envLog('log', 'Firebase services initialized');

export default app;
