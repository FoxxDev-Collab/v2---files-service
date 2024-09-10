// src/pages/profile.tsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

interface UserProfile {
  username: string;
  email: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await api.get<UserProfile>('/auth/profile');
        setProfile(response.data);
        setError('');
      } catch (err) {
        console.error('Failed to fetch profile', err);
        setError('Failed to fetch profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const response = await api.put<UserProfile>('/auth/profile', profile);
      setProfile(response.data);
      alert('Profile updated successfully');
    } catch (err) {
      console.error('Failed to update profile', err);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      alert("New passwords don't match");
      return;
    }

    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      alert('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error('Failed to change password', err);
      alert('Failed to change password. Please try again.');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <p className="text-2xl font-semibold">Loading...</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <p className="text-2xl font-semibold text-red-500">{error}</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Logout
            </button>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {profile && (
                <div className="space-y-8">
                  <form onSubmit={handleProfileUpdate} className="space-y-8 divide-y divide-gray-200">
                    <div className="space-y-8 divide-y divide-gray-200 sm:space-y-5">
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                          Update your profile information here.
                        </p>
                        <div className="mt-6 sm:mt-5 space-y-6 sm:space-y-5">
                          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                              Username
                            </label>
                            <div className="mt-1 sm:mt-0 sm:col-span-2">
                              <input
                                type="text"
                                name="username"
                                id="username"
                                value={profile.username}
                                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                className="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                              Email address
                            </label>
                            <div className="mt-1 sm:mt-0 sm:col-span-2">
                              <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                className="block max-w-lg w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-5">
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Update Profile
                        </button>
                      </div>
                    </div>
                  </form>

                  <form onSubmit={handlePasswordChange} className="space-y-8 divide-y divide-gray-200">
                    <div className="space-y-8 divide-y divide-gray-200 sm:space-y-5">
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Change Password</h3>
                        <div className="mt-6 sm:mt-5 space-y-6 sm:space-y-5">
                          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                              Current Password
                            </label>
                            <div className="mt-1 sm:mt-0 sm:col-span-2">
                              <input
                                type="password"
                                name="currentPassword"
                                id="currentPassword"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                              New Password
                            </label>
                            <div className="mt-1 sm:mt-0 sm:col-span-2">
                              <input
                                type="password"
                                name="newPassword"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                              Confirm New Password
                            </label>
                            <div className="mt-1 sm:mt-0 sm:col-span-2">
                              <input
                                type="password"
                                name="confirmNewPassword"
                                id="confirmNewPassword"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                required
                                className="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-5">
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Change Password
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}