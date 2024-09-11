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
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();

  useEffect(() => {
    fetchProfile();
    // Load dark mode preference from localStorage
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
      // Only update the user context with the fields that are in the User type
      updateUser({
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        role: response.data.role,
        profilePictureUrl: response.data.profilePictureUrl,
        timezone: ''
      });
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // In Settings.tsx

const handleAvatarUpload = async () => {
  if (selectedFile && profile) {
    const formData = new FormData();
    formData.append('avatar', selectedFile);
    try {
      const response = await api.post<{ profilePictureUrl: string }>('/auth/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newProfilePictureUrl = response.data.profilePictureUrl;
      setProfile({ ...profile, profilePictureUrl: newProfilePictureUrl });
      updateUser({
        profilePictureUrl: newProfilePictureUrl,
        id: '',
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        timezone: '',
        role: ''
      });
      setSuccessMessage('Avatar uploaded successfully');
      setSelectedFile(null);
    } catch (err) {
      console.error('Failed to upload avatar', err);
      setError('Failed to upload avatar');
    }
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {successMessage && <p className="text-green-500 mb-4">{successMessage}</p>}
          {profile && (
            <div className="space-y-8">
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
                {/* Add similar input fields for email, firstName, lastName, and timezone */}
                <div className="flex items-center justify-between">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    type="submit"
                  >
                    Update Profile
                  </button>
                </div>
              </form>

              <form onSubmit={handlePasswordChange} className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Change Password</h2>
                {/* Add input fields for currentPassword, newPassword, and confirmNewPassword */}
                <div className="flex items-center justify-between">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    type="submit"
                  >
                    Change Password
                  </button>
                </div>
              </form>

              <div className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4">
  <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Profile Picture</h2>
  <div className="mb-4">
    <Image
      src={profile.profilePictureUrl || '/default-avatar.png'}
      alt="Profile"
      width={40}
      height={40}
      className="rounded-full cursor-pointer"
    />
  </div>
  <div className="mb-4">
    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="avatar">
      Select new profile picture
    </label>
    <input
      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
      id="avatar"
      type="file"
      accept="image/*"
      onChange={handleFileSelect}
    />
  </div>
  {selectedFile && (
    <div className="mb-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">Selected file: {selectedFile.name}</p>
    </div>
  )}
  <button
    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
    onClick={handleAvatarUpload}
    disabled={!selectedFile}
  >
    Upload and Save Profile Picture
  </button>
</div>

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
  );
};

export default Settings;