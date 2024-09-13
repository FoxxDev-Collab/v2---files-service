import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', firstName: '', lastName: '', timezone: 'America/Boise', role: 'user' });
  const [error, setError] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role === 'site_admin') {
      fetchUsers();
    } else {
      router.push('/dashboard');
    }
  }, [user, router]);

  const fetchUsers = async () => {
    try {
      const response = await api.get<User[]>('/auth/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
      setError('Failed to fetch users. Please try again.');
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await api.put(`/auth/users/${userId}/role`, { role: newRole });
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Failed to update user role', error);
      setError('Failed to update user role. Please try again.');
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', newUser);
      setNewUser({ username: '', email: '', password: '', firstName: '', lastName: '', timezone: 'America/Boise', role: 'user' });
      fetchUsers(); // Refresh the user list
    } catch (error: any) {
      console.error('Failed to create user', error);
      setError(error.response?.data?.message || 'Failed to create user. Please try again.');
    }
  };

  const deleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/auth/users/${userId}`);
        fetchUsers(); // Refresh the user list
      } catch (error) {
        console.error('Failed to delete user', error);
        setError('Failed to delete user. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-x3 sm:mx-auto">
        <div className="relative px-2 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <h1 className="text-2xl font-semibold mb-6">User Management</h1>
          
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
          
          {/* Create User Form */}
          <form onSubmit={createUser} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Create New User</h2>
            <input
              type="text"
              placeholder="Username"
              value={newUser.username}
              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
              className="mb-2 p-2 w-full border rounded"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              className="mb-2 p-2 w-full border rounded"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              className="mb-2 p-2 w-full border rounded"
              required
            />
            <input
              type="text"
              placeholder="First Name"
              value={newUser.firstName}
              onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
              className="mb-2 p-2 w-full border rounded"
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              value={newUser.lastName}
              onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
              className="mb-2 p-2 w-full border rounded"
              required
            />
            <select
              value={newUser.timezone}
              onChange={(e) => setNewUser({...newUser, timezone: e.target.value})}
              className="mb-2 p-2 w-full border rounded"
            >
              <option value="America/Boise">America/Boise</option>
              <option value="America/New_York">America/New_York</option>
              <option value="America/Chicago">America/Chicago</option>
              <option value="America/Denver">America/Denver</option>
              <option value="America/Los_Angeles">America/Los_Angeles</option>
            </select>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              className="mb-2 p-2 w-full border rounded"
            >
              <option value="user">User</option>
              <option value="application_admin">Application Admin</option>
              <option value="site_admin">Site Admin</option>
            </select>
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Create User</button>
          </form>

          {/* User List */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="user">User</option>
                      <option value="application_admin">Application Admin</option>
                      <option value="site_admin">Site Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => deleteUser(user.id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}