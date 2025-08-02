import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();

  // If user is not signed in, this will be handled by App.jsx
  if (!currentUser) {
    return null;
  }

  // For phone auth, users are automatically verified when they complete SMS verification
  // No additional verification step needed
  return children;
}