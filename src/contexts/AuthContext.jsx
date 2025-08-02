import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '../lib/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const setupRecaptcha = () => {
    if (!recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          // Response expired
          setAuthError('reCAPTCHA expired. Please try again.');
        }
      });
      setRecaptchaVerifier(verifier);
      return verifier;
    }
    return recaptchaVerifier;
  };

  const sendVerificationCode = async (phoneNumber, fullName = '') => {
    setAuthError(null);
    try {
      const verifier = setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(confirmation);
      return confirmation;
    } catch (error) {
      console.error('Send verification code error:', error);
      setAuthError(getErrorMessage(error.code));
      throw error;
    }
  };

  const verifyCode = async (code, fullName = '') => {
    setAuthError(null);
    try {
      if (!confirmationResult) {
        throw new Error('No confirmation result available');
      }
      
      const result = await confirmationResult.confirm(code);
      const user = result.user;
      
      // Update profile with full name if provided
      if (fullName && user) {
        await updateProfile(user, { displayName: fullName });
      }
      
      return user;
    } catch (error) {
      console.error('Verify code error:', error);
      setAuthError(getErrorMessage(error.code));
      throw error;
    }
  };

  const signin = async (phoneNumber) => {
    return await sendVerificationCode(phoneNumber);
  };

  const signup = async (phoneNumber, fullName) => {
    return await sendVerificationCode(phoneNumber, fullName);
  };

  const logout = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
      setConfirmationResult(null);
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        setRecaptchaVerifier(null);
      }
    } catch (error) {
      setAuthError(getErrorMessage(error.code));
      throw error;
    }
  };

  const resetPassword = async (phoneNumber) => {
    // For phone auth, we'll send a new verification code
    return await sendVerificationCode(phoneNumber);
  };

  const resendVerification = async (phoneNumber) => {
    return await sendVerificationCode(phoneNumber);
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/invalid-phone-number':
        return 'Invalid phone number format.';
      case 'auth/missing-phone-number':
        return 'Phone number is required.';
      case 'auth/quota-exceeded':
        return 'SMS quota exceeded. Please try again later.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/operation-not-allowed':
        return 'Phone authentication is not enabled.';
      case 'auth/invalid-verification-code':
        return 'Invalid verification code.';
      case 'auth/invalid-verification-id':
        return 'Invalid verification ID.';
      case 'auth/code-expired':
        return 'Verification code has expired.';
      case 'auth/too-many-requests':
        return 'Too many requests. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  const value = {
    currentUser,
    signup,
    signin,
    logout,
    resetPassword,
    resendVerification,
    sendVerificationCode,
    verifyCode,
    confirmationResult,
    authError,
    setAuthError,
    setupRecaptcha
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};