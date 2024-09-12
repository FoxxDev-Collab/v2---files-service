import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="username" className="block mb-2">Username</label>
          <input type="text" id="username" name="username" defaultValue={user.username} className="w-full p-2 border rounded" />
        </div>
        <div className="mb-4">
          <label htmlFor="firstName" className="block mb-2">First Name</label>
          <input type="text" id="firstName" name="firstName" defaultValue={user.firstName} className="w-full p-2 border rounded" />
        </div>
        <div className="mb-4">
          <label htmlFor="lastName" className="block mb-2">Last Name</label>
          <input type="text" id="lastName" name="lastName" defaultValue={user.lastName} className="w-full p-2 border rounded" />
        </div>
        <div className="mb-4">
          <label htmlFor="timezone" className="block mb-2">Timezone</label>
          <input type="text" id="timezone" name="timezone" defaultValue={user.timezone} className="w-full p-2 border rounded" />
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