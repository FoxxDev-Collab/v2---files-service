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
  const [uploadedPictures, setUploadedPictures] = useState<string[]>([]);
  const router = useRouter();
  const { user, updateUser } = useAuth();

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAvatarUpload = async () => {
    if (selectedFile && profile) {
      const formData = new FormData();
      formData.append('avatar', selectedFile);
      try {
        const response = await api.post<{ profilePictureUrl: string }>('/auth/upload-avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const newProfilePictureUrl = response.data.profilePictureUrl;
        setUploadedPictures(prev => [...prev, newProfilePictureUrl].slice(-3));
        setSelectedFile(null);
        setSuccessMessage('Avatar uploaded successfully');
      } catch (err) {
        console.error('Failed to upload avatar', err);
        setError('Failed to upload avatar');
      }
    }
  };

  const handleSetProfilePicture = async (pictureUrl: string) => {
    try {
      await api.put('/auth/set-profile-picture', { profilePictureUrl: pictureUrl });
      setProfile(prev => prev ? { ...prev, profilePictureUrl: pictureUrl } : null);
      updateUser({
        ...user!,
        profilePictureUrl: pictureUrl
      });
      setUploadedPictures(prev => [pictureUrl, ...prev.filter(url => url !== pictureUrl)].slice(0, 3));
      setSuccessMessage('Profile picture updated successfully');
    } catch (err) {
      console.error('Failed to set profile picture', err);
      setError('Failed to set profile picture');
    }
  };

  const handleDeletePicture = async (pictureUrl: string) => {
    try {
      await api.delete(`/auth/delete-picture`, { data: { pictureUrl } });
      setUploadedPictures(prev => prev.filter(url => url !== pictureUrl));
      setSuccessMessage('Picture deleted successfully');
    } catch (err) {
      console.error('Failed to delete picture', err);
      setError('Failed to delete picture');
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
              {/* Profile Information Form */}
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

              {/* Password Change Form */}
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

              {/* Profile Picture Section */}
              <div className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Profile Picture</h2>
                <div className="flex flex-wrap">
                  {/* Current Profile Picture */}
                  <div className="w-1/3 pr-4">
                    <h3 className="text-lg font-semibold mb-2">Current Picture</h3>
                    <Image
                      src={user?.profilePictureUrl
                        ? `${process.env.NEXT_PUBLIC_API_URL}${user.profilePictureUrl}`
                        : '/default-avatar.png'  // Provide a path to a default avatar image
                      }
                      alt="Profile"
                      width={200}
                      height={200}
                      className="rounded-full"
                    />
                  </div>
                  {/* Other Pictures */}
                  <div className="w-2/3">
                    <h3 className="text-lg font-semibold mb-2">Other Pictures</h3>
                    <div className="flex flex-wrap">
                      {uploadedPictures.filter(url => url !== profile.profilePictureUrl).map((pictureUrl, index) => (
                        <div key={index} className="relative m-2">
                          <Image
                            src={user?.profilePictureUrl
                              ? `${process.env.NEXT_PUBLIC_API_URL}${user.profilePictureUrl}`
                              : '/default-avatar.png'  // Provide a path to a default avatar image
                            }
                            alt={`Uploaded ${index + 1}`}
                            width={100}
                            height={100}
                            className="rounded-md"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleSetProfilePicture(pictureUrl)}
                              className="bg-blue-500 text-white px-2 py-1 rounded text-sm mr-2"
                            >
                              Set as Profile
                            </button>
                            <button
                              onClick={() => handleDeletePicture(pictureUrl)}
                              className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Upload New Picture */}
                <div className="mt-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="mb-2"
                  />
                  <button
                    onClick={handleAvatarUpload}
                    disabled={!selectedFile}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                  >
                    Upload New Picture
                  </button>
                </div>
              </div>

              {/* Dark Mode Toggle */}
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
