import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    // TODO: Check if user is authenticated
    // If not, redirect to login page
    // For now, we'll assume the user is authenticated
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96">
              <div className="flex flex-col items-center justify-center h-full">
                <h2 className="text-2xl font-semibold mb-4">Welcome to Your Dashboard</h2>
                <p className="mb-4">Here you can access all New Cloud services.</p>
                <Link href="/profile" className="text-indigo-600 hover:text-indigo-500">
                  View Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}