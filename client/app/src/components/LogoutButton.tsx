// client/src/components/LogoutButton.tsx

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

const LogoutButton: React.FC = () => {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">
      Logout
    </button>
  );
};

export default LogoutButton;