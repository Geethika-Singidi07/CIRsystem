import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { AdminRecord, BOOTSTRAPPED_ADMIN_EMAIL, UserProfile } from '../types/cirs';
import {
  checkAdminRecord,
  createOrSyncUserProfile,
  getUserProfile,
} from '../services/cirsService';

const PENDING_PROFILE_KEY = 'cirs_pending_profile';

interface PendingProfileData {
  fullName: string;
  communityName: string;
}

interface AuthContextValue {
  user: User | null;
  emailVerified: boolean;
  userProfile: UserProfile | null;
  adminRecord: AdminRecord | null;
  isAdmin: boolean;
  isBootstrappedAdmin: boolean;
  loading: boolean;
  authReady: boolean;
  registerCitizen: (params: {
    fullName: string;
    email: string;
    password: string;
    communityName: string;
  }) => Promise<{ needsVerification: boolean }>;
  loginWithEmail: (email: string, password: string) => Promise<User>;
  loginWithGoogle: (defaultCommunity?: string) => Promise<User>;
  loginAdminWithEmail: (email: string, password: string) => Promise<User>;
  loginAdminWithGoogle: () => Promise<User>;
  resendVerification: () => Promise<void>;
  refreshVerificationStatus: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function mapFirebaseAuthError(error: unknown): {
  message: string;
  isEmailPasswordDisabled?: boolean;
} {
  const code = (error as { code?: string })?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return {
        message: 'An account with this email address already exists. Please sign in instead.',
      };
    case 'auth/invalid-email':
      return { message: 'Please enter a valid email address.' };
    case 'auth/weak-password':
      return { message: 'Password must be at least 6 characters long.' };
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return { message: 'Invalid email or password. Please verify your credentials.' };
    case 'auth/too-many-requests':
      return {
        message: 'Too many attempts detected. Please wait a few moments before trying again.',
      };
    case 'auth/popup-closed-by-user':
      return { message: 'Sign-in popup was closed before completion.' };
    case 'auth/operation-not-allowed':
      return {
        message:
          'Email/Password sign-in is not yet enabled in Firebase Console for this project. Enable it under Authentication > Sign-in method, or use Continue with Google below.',
        isEmailPasswordDisabled: true,
      };
    default:
      return {
        message:
          error instanceof Error
            ? error.message
            : 'Authentication could not be completed. Please try again.',
      };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [adminRecord, setAdminRecord] = useState<AdminRecord | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBootstrappedAdmin, setIsBootstrappedAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const hydrateUserState = useCallback(async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setUserProfile(null);
      setAdminRecord(null);
      setIsAdmin(false);
      setIsBootstrappedAdmin(false);
      return;
    }

    if (!firebaseUser.emailVerified) {
      setUserProfile(null);
      setAdminRecord(null);
      setIsAdmin(false);
      setIsBootstrappedAdmin(false);
      return;
    }

    const bootstrapped =
      firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
    setIsBootstrappedAdmin(bootstrapped);

    try {
      const adminDoc = await checkAdminRecord(firebaseUser.uid);
      setAdminRecord(adminDoc);
      setIsAdmin(bootstrapped || Boolean(adminDoc));
    } catch {
      setAdminRecord(null);
      setIsAdmin(bootstrapped);
    }

    try {
      let profile = await getUserProfile(firebaseUser.uid);
      if (!profile) {
        let pending: PendingProfileData | null = null;
        try {
          const raw = sessionStorage.getItem(PENDING_PROFILE_KEY);
          if (raw) {
            pending = JSON.parse(raw) as PendingProfileData;
            sessionStorage.removeItem(PENDING_PROFILE_KEY);
          }
        } catch {
          pending = null;
        }

        profile = await createOrSyncUserProfile({
          uid: firebaseUser.uid,
          fullName: pending?.fullName || firebaseUser.displayName || 'Civic Resident',
          email: firebaseUser.email || '',
          communityName: pending?.communityName || 'Central District',
        });
      }
      setUserProfile(profile);
    } catch (err) {
      console.error('Failed to hydrate citizen profile:', err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);
      setEmailVerified(Boolean(firebaseUser?.emailVerified));
      await hydrateUserState(firebaseUser);
      setAuthReady(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hydrateUserState]);

  const registerCitizen = useCallback(
    async (params: {
      fullName: string;
      email: string;
      password: string;
      communityName: string;
    }) => {
      sessionStorage.setItem(
        PENDING_PROFILE_KEY,
        JSON.stringify({
          fullName: params.fullName.trim(),
          communityName: params.communityName.trim(),
        })
      );

      const credential = await createUserWithEmailAndPassword(
        auth,
        params.email.trim(),
        params.password
      );

      await updateProfile(credential.user, {
        displayName: params.fullName.trim(),
      });

      if (!credential.user.emailVerified) {
        setUser(credential.user);
        setEmailVerified(false);
        await sendEmailVerification(credential.user);
        return { needsVerification: true };
      }

      setUser(credential.user);
      setEmailVerified(true);
      await hydrateUserState(credential.user);
      return { needsVerification: false };
    },
    [hydrateUserState]
  );

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      setUser(credential.user);
      setEmailVerified(Boolean(credential.user.emailVerified));
      await hydrateUserState(credential.user);
      return credential.user;
    },
    [hydrateUserState]
  );

  const loginWithGoogle = useCallback(
    async (defaultCommunity?: string) => {
      if (defaultCommunity?.trim()) {
        sessionStorage.setItem(
          PENDING_PROFILE_KEY,
          JSON.stringify({
            fullName: '',
            communityName: defaultCommunity.trim(),
          })
        );
      }
      const credential = await signInWithPopup(auth, googleProvider);
      setUser(credential.user);
      setEmailVerified(Boolean(credential.user.emailVerified));
      await hydrateUserState(credential.user);
      return credential.user;
    },
    [hydrateUserState]
  );

  const verifyAdminEligibility = useCallback(async (firebaseUser: User) => {
    if (!firebaseUser.emailVerified) {
      await signOut(auth);
      throw new Error(
        'Administrator account email is not verified. Please verify your email address before accessing the Admin Portal.'
      );
    }

    const bootstrapped =
      firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
    if (bootstrapped) {
      return true;
    }

    const adminDoc = await checkAdminRecord(firebaseUser.uid);
    if (!adminDoc) {
      await signOut(auth);
      throw new Error(
        'Access denied: This account does not have administrator privileges in CIRS.'
      );
    }

    return true;
  }, []);

  const loginAdminWithEmail = useCallback(
    async (email: string, password: string) => {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await verifyAdminEligibility(credential.user);
      setUser(credential.user);
      setEmailVerified(Boolean(credential.user.emailVerified));
      await hydrateUserState(credential.user);
      return credential.user;
    },
    [hydrateUserState, verifyAdminEligibility]
  );

  const loginAdminWithGoogle = useCallback(async () => {
    const credential = await signInWithPopup(auth, googleProvider);
    await verifyAdminEligibility(credential.user);
    setUser(credential.user);
    setEmailVerified(Boolean(credential.user.emailVerified));
    await hydrateUserState(credential.user);
    return credential.user;
  }, [hydrateUserState, verifyAdminEligibility]);

  const resendVerification = useCallback(async () => {
    if (!auth.currentUser) {
      throw new Error('No active session found.');
    }
    await sendEmailVerification(auth.currentUser);
  }, []);

  const refreshVerificationStatus = useCallback(async () => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const refreshed = auth.currentUser;
    setUser(refreshed);
    setEmailVerified(Boolean(refreshed.emailVerified));
    if (refreshed.emailVerified) {
      await refreshed.getIdToken(true);
      await hydrateUserState(refreshed);
      return true;
    }
    return false;
  }, [hydrateUserState]);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) return;
    await hydrateUserState(auth.currentUser);
  }, [hydrateUserState]);

  const logout = useCallback(async () => {
    sessionStorage.removeItem(PENDING_PROFILE_KEY);
    await signOut(auth);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        emailVerified,
        userProfile,
        adminRecord,
        isAdmin,
        isBootstrappedAdmin,
        loading,
        authReady,
        registerCitizen,
        loginWithEmail,
        loginWithGoogle,
        loginAdminWithEmail,
        loginAdminWithGoogle,
        resendVerification,
        refreshVerificationStatus,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
