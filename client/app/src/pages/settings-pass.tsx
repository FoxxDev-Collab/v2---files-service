/*
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import ProtectedRoute from '../components/ProtectedRoute';
import Image from 'next/image';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  timezone: string;
  profilePictureUrl: string;
  role: string;
}

const Settings: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { user, updateUser } = useAuth();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<UserProfile>('/auth/profile');
      setProfile(response.data);
      setUploadedPictures([response.data.profilePictureUrl]);
      setError('');
    } catch (err) {
      console.error('Failed to fetch profile', err);
      setError('Failed to fetch profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const response = await api.put<UserProfile>('/auth/profile', profile);
      setProfile(response.data);
      updateUser(response.data);
      setSuccessMessage('Profile updated successfully');
    } catch (err) {
      console.error('Failed to update profile', err);
      setError('Failed to update profile');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError("New passwords don't match");
      return;
    }

    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setSuccessMessage('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error('Failed to change password', err);
      setError('Failed to change password. Please try again.');
    }
  };

  const handleDarkModeToggle = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Loading...</p>
        </div>
      </ProtectedRoute>
    );
  }
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('avatar', selectedFile);

    try {
      const response = await api.post('/auth/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreviewUrl(response.data.profilePictureUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleSave = async () => {
    if (!previewUrl) return;

    try {
      await api.put('/auth/save-profile-picture', { profilePictureUrl: previewUrl });
      updateUser({ ...user!, profilePictureUrl: previewUrl });
    } catch (error) {
      console.error('Error saving profile picture:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {successMessage && <p className="text-green-500 mb-4">{successMessage}</p>}
          {profile && (
            <div className="space-y-8">
              // Profile Information Form
              <form onSubmit={handleProfileUpdate} className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Profile Information</h2>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="username">
                    Username
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="username"
                    type="text"
                    value={profile.username}
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
                    Email
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    type="submit"
                  >
                    Update Profile
                  </button>
                </div>
              </form>

               // Password Change Form
              <form onSubmit={handlePasswordChange} className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Change Password</h2>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="currentPassword">
                    Current Password
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="newPassword">
                    New Password
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="confirmNewPassword">
                    Confirm New Password
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="confirmNewPassword"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    type="submit"
                  >
                    Change Password
                  </button>
                </div>
              </form>

               // Profile Picture Section
               <div className="mb-6">
                 <h2 className="text-xl font-semibold mb-2">Profile Picture</h2>
                   <div className="flex items-center space-x-4">
                     {previewUrl && (
                        <Image
                          src={previewUrl}
                          alt="Profile preview"
                          width={100}
                          height={100}
                          className="rounded-full"
                         />
                        )}
                        <Image
                          src={user.profilePictureUrl || '/default-avatar.png'}
                          alt="Profile"
                          width={50}
                          height={50}
                          className="rounded-full"
                          />
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="mb-2"
                          />
                          <div className="space-x-2">
                            <button
                              onClick={handleUpload}
                              className="bg-blue-500 text-white px-4 py-2 rounded"
                              disabled={!selectedFile}
                            >
                              Upload
                            </button>
                            <button
                              onClick={handleSave}
                              className="bg-green-500 text-white px-4 py-2 rounded"
                              disabled={!previewUrl}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

              // Dark Mode Toggle
              <div className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Application Settings</h2>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Dark Mode</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={darkMode}
                      onChange={handleDarkModeToggle}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
};
export default Settings;
function setUploadedPictures(arg0: string[]) {
  throw new Error('Function not implemented.');
}

*/