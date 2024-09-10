import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

const DashboardButton: React.FC = () => {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/dashboard');
  };

  return (
    <button onClick={handleLogout} className="bg-blue-500 text-white px-4 py-2 rounded">
      Dashboard
    </button>
  );
};

export default DashboardButton;