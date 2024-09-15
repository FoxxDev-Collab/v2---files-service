// src/components/Header.tsx

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-10">
      <nav className="container mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="text-xl font-semibold text-gray-700">
            <Link href="/dashboard">New Cloud</Link>
          </div>
          {user && (
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-800 hover:text-blue-500">
                Dashboard
              </Link>
              <Link href="/teams" className="text-gray-800 hover:text-blue-500">
                Teams
              </Link>
              <Link href="/profile" className="text-gray-800 hover:text-blue-500">
                Profile
              </Link>
              <Link href="/settings" className="text-gray-800 hover:text-blue-500">
                Settings
              </Link>
              {user.role === 'site_admin' && (
                <Link href="/admin/users" className="text-gray-800 hover:text-blue-500">
                  Manage Users
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;