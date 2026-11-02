
import { initializeApp, getApps, getApp } from 'firebase/app';

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCn7_IWrP-BxuEsiraIbD4Shuy9BqHyvqI',
  authDomain: 'gp-wallet-bd-d69de.firebaseapp.com',
  projectId: 'gp-wallet-bd-d69de',
  storageBucket: 'gp-wallet-bd-d69de.firebasestorage.app',
  messagingSenderId: '190057258492',
  appId: '1:190057258492:web:be1dd4683f78ba803c6679',
  measurementId: 'G-0L9BD30HKB',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export { app };

export interface GoogleAuthResult {
  email: string;
  displayName: string;
  uid: string;
  emailVerified: boolean;
}

function formatUser(user: FirebaseUser): GoogleAuthResult {
  if (!user.email) {
    throw new Error('আপনার অ্যাকাউন্টে ইমেইল ঠিকানা পাওয়া যায়নি।');
  }

  return {
    email: user.email,
    displayName: user.displayName || user.email.split('@')[0],
    uid: user.uid,
    emailVerified: user.emailVerified,
  };
}

// Sign up with email and password
export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<GoogleAuthResult> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  if (displayName.trim()) {
    await updateProfile(credential.user, {
      displayName: displayName.trim(),
    });
  }

  await sendEmailVerification(credential.user);

  return formatUser(credential.user);
}

// Sign in with email and password
export async function loginWithEmail(
  email: string,
  password: string
): Promise<GoogleAuthResult> {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  return formatUser(credential.user);
}

// Sign in with Google
export async function loginWithGoogle(): Promise<GoogleAuthResult> {
  const credential = await signInWithPopup(auth, googleProvider);
  return formatUser(credential.user);
}

// Send password reset email
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

// Send verification email to the signed-in user
export async function verifyCurrentEmail(): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('প্রথমে লগইন করুন।');
  }

  await sendEmailVerification(auth.currentUser);
}

// Sign out
export async function firebaseSignOut(): Promise<void> {
  await signOut(auth);
}
