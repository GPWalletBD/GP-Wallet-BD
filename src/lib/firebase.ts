import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  sendPasswordResetEmail, 
  sendEmailVerification,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';

// Firebase configuration from environment or fallback placeholders
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY'
);

let app: any = null;
let auth: any = null;
let googleProvider: any = null;

try {
  if (isFirebaseConfigured) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  }
} catch (error) {
  console.warn('Firebase initialization warning:', error);
}

export { app, auth, googleProvider };

export interface GoogleAuthResult {
  email: string;
  displayName: string;
  uid: string;
  emailVerified: boolean;
}

/**
 * Trigger Google Sign In popup
 */
export async function loginWithGoogle(): Promise<GoogleAuthResult> {
  if (!isFirebaseConfigured || !auth || !googleProvider) {
    throw new Error('FIREBASE_CONFIG_MISSING');
  }

  const credential = await signInWithPopup(auth, googleProvider);
  const fbUser = credential.user;

  if (!fbUser.email) {
    throw new Error('গুগল অ্যাকাউন্ট থেকে কোনো ইমেইল ঠিকানা পাওয়া যায়নি।');
  }

  return {
    email: fbUser.email,
    displayName: fbUser.displayName || fbUser.email.split('@')[0],
    uid: fbUser.uid,
    emailVerified: fbUser.emailVerified
  };
}

/**
 * Send Password Reset Email via Firebase Auth
 */
export async function sendPasswordReset(email: string): Promise<void> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('FIREBASE_CONFIG_MISSING');
  }

  await sendPasswordResetEmail(auth, email);
}

/**
 * Send Email Verification link to currently signed in Firebase user
 */
export async function verifyCurrentEmail(): Promise<void> {
  if (!isFirebaseConfigured || !auth || !auth.currentUser) {
    throw new Error('FIREBASE_CONFIG_MISSING');
  }

  await sendEmailVerification(auth.currentUser);
}

/**
 * Sign out from Firebase
 */
export async function firebaseSignOut(): Promise<void> {
  if (auth) {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
  }
}
