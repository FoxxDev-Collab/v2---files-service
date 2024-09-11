// src/pages/dashboard.tsx

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('Dashboard user:', user);
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <ProtectedRoute>
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="border-4 border-dashed border-gray-200 rounded-lg h-96">
                <div className="flex flex-col items-center justify-center h-full">
                  <h2 className="text-2xl font-semibold mb-4">Welcome to Your Dashboard</h2>
                  <p className="mb-4">Here you can access all New Cloud services.</p>
                  <Link href="/settings" className="text-indigo-600 hover:text-indigo-500">
                    View/Update Your Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
    </ProtectedRoute>
  );
}