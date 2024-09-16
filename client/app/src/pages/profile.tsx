import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  timezone: string;
  teams?: Team[];
}

interface Team {
  id: number;
  name: string;
  role: string;
}

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Adak',
  'Pacific/Honolulu',
];

const Profile: React.FC = () => {
  const { updateUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<User>('/auth/profile');
      const userData = response.data;
      
      // Fetch user's teams
      const teamsResponse = await api.get('/auth/teams');
      userData.teams = teamsResponse.data;

      setUser(userData);
      updateUser(userData);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to fetch user profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUser(prev => prev ? { ...prev, [name]: value || '' } : null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) return;

    const updatedUser = Object.fromEntries(
      Object.entries(user).map(([key, value]) => [key, value === null ? '' : value])
    ) as User;

    try {
      const response = await api.put<User>('/auth/profile', updatedUser);
      setUser(response.data);
      updateUser(response.data);
      setSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword) {
      setError('New password is required');
      return;
    }

    try {
      await api.put('/auth/change-password', { newPassword });
      setSuccess('Password changed successfully');
      setNewPassword('');
    } catch (err) {
      console.error('Error changing password:', err);
      setError('Failed to change password. Please try again.');
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>No user data available</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      
      <div className="flex flex-wrap -mx-2">
        {/* Left Column: Current Information */}
        <div className="w-full md:w-1/2 px-2 mb-4">
          <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <h2 className="text-xl font-semibold mb-2">Current Information</h2>
            <p><strong>Username:</strong> {user.username || 'N/A'}</p>
            <p><strong>Name:</strong> {`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'}</p>
            <p><strong>Email:</strong> {user.email || 'N/A'}</p>
            <p><strong>Timezone:</strong> {user.timezone || 'N/A'}</p>
          </div>
        </div>

        {/* Right Column: Teams Information */}
        <div className="w-full md:w-1/2 px-2 mb-4">
          <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <h2 className="text-xl font-semibold mb-2">Team Membership</h2>
            {user.teams && user.teams.length > 0 ? (
              <ul>
                {user.teams.map(team => (
                  <li key={team.id} className="mb-2">
                    <strong>{team.name}</strong> - {team.role}
                  </li>
                ))}
              </ul>
            ) : (
              <p>You are not a member of any teams.</p>
            )}
          </div>
        </div>
      </div>

      {/* Update User Information Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-xl font-semibold mb-2">Update Information</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
            Username
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="username"
            type="text"
            name="username"
            value={user.username}
            onChange={handleInputChange}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="first_name">
            First Name
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="first_name"
            type="text"
            name="first_name"
            value={user.first_name || ''}
            onChange={handleInputChange}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="last_name">
            Last Name
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="last_name"
            type="text"
            name="last_name"
            value={user.last_name || ''}
            onChange={handleInputChange}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="email"
            type="email"
            name="email"
            value={user.email || ''}
            onChange={handleInputChange}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="timezone">
            Timezone
          </label>
          <select
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="timezone"
            name="timezone"
            value={user.timezone}
            onChange={handleInputChange}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="submit"
        >
          Update Profile
        </button>
      </form>
    {/* Change Password Form */}
      <form onSubmit={handlePasswordChange} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-xl font-semibold mb-2">Change Password</h2>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="new_password">
            New Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="new_password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="submit"
        >
          Change Password
        </button>
      </form>
    </div>
  );
};

export default Profile;