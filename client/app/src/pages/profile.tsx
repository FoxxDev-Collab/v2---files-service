import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

// US Timezones
const US_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Adak',
  'Pacific/Honolulu',
];

// Helper function to generate user initials
const getUserInitials = (firstName?: string, lastName?: string) => {
  const firstInitial = firstName ? firstName.charAt(0) : '';
  const lastInitial = lastName ? lastName.charAt(0) : '';
  return `${firstInitial}${lastInitial}`.toUpperCase() || '';
};

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [localUser, setLocalUser] = useState(user);
  const [userInitials, setUserInitials] = useState('');

  useEffect(() => {
    if (user) {
      setLocalUser(user);
      setUserInitials(getUserInitials(user.firstName, user.lastName));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    const updatedProfile = Object.fromEntries(formData.entries());

    try {
      const response = await api.put('/auth/profile', updatedProfile);
      updateUser(response.data);
      setLocalUser(response.data);
      setUserInitials(getUserInitials(response.data.firstName, response.data.lastName));
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    }
  };

  if (!localUser) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl font-bold">
            {userInitials}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{localUser.username}</h2>
            <p className="text-gray-600">{`${localUser.firstName} ${localUser.lastName}`}</p>
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="username" className="block mb-2">Username</label>
          <input type="text" id="username" name="username" defaultValue={localUser.username} className="w-full p-2 border rounded" />
        </div>
        <div className="mb-4">
          <label htmlFor="firstName" className="block mb-2">First Name</label>
          <input type="text" id="firstName" name="firstName" defaultValue={localUser.firstName} className="w-full p-2 border rounded" />
        </div>
        <div className="mb-4">
          <label htmlFor="lastName" className="block mb-2">Last Name</label>
          <input type="text" id="lastName" name="lastName" defaultValue={localUser.lastName} className="w-full p-2 border rounded" />
        </div>
        <div className="mb-4">
          <label htmlFor="timezone" className="block mb-2">Timezone</label>
          <select id="timezone" name="timezone" defaultValue={localUser.timezone} className="w-full p-2 border rounded">
            {US_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="newPassword" className="block mb-2">New Password (leave blank to keep current)</label>
          <input type="password" id="newPassword" name="newPassword" className="w-full p-2 border rounded" />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Update Profile</button>
      </form>
    </div>
  );
};

export default Profile;