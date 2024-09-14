// src/pages/teams.tsx

import React, { useState, useEffect } from 'react';
import { useAuth, User } from '../contexts/AuthContext';
import api from '../utils/api';
import { useRouter } from 'next/router';

interface Team {
  id: number;
  name: string;
  role: string;
  members?: TeamMember[];
}

interface TeamMember {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface SystemUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newMemberId, setNewMemberId] = useState<number | ''>('');
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchTeams();
    fetchSystemUsers();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await api.get('/auth/teams');
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchSystemUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setSystemUsers(response.data);
    } catch (error) {
      console.error('Error fetching system users:', error);
    }
  };

  const fetchTeamDetails = async (teamId: number) => {
    try {
      const response = await api.get(`/auth/teams/${teamId}`);
      setSelectedTeam(response.data);
    } catch (error) {
      console.error('Error fetching team details:', error);
    }
  };

  const createTeam = async () => {
    try {
      await api.post('/auth/teams', { name: newTeamName });
      setNewTeamName('');
      fetchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const addMember = async () => {
    if (!selectedTeam || newMemberId === '') return;
    try {
      await api.post(`/auth/teams/${selectedTeam.id}/members`, { userId: newMemberId, role: 'member' });
      setNewMemberId('');
      fetchTeamDetails(selectedTeam.id);
    } catch (error) {
      console.error('Error adding team member:', error);
    }
  };

  const removeMember = async (userId: number) => {
    if (!selectedTeam) return;
    try {
      await api.delete(`/auth/teams/${selectedTeam.id}/members/${userId}`);
      fetchTeamDetails(selectedTeam.id);
    } catch (error) {
      console.error('Error removing team member:', error);
    }
  };

  const promoteToManager = async (userId: number) => {
    if (!selectedTeam) return;
    try {
      await api.put(`/auth/teams/${selectedTeam.id}/members/${userId}/role`, { role: 'manager' });
      fetchTeamDetails(selectedTeam.id);
    } catch (error) {
      console.error('Error promoting team member:', error);
    }
  };

  const deleteTeam = async () => {
    if (!selectedTeam) return;
    try {
      await api.delete(`/auth/teams/${selectedTeam.id}`);
      setSelectedTeam(null);
      fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Teams</h2>
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="New team name"
            className="w-full p-2 border rounded mb-2"
          />
          <button
            onClick={createTeam}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Create Team +
          </button>
        </div>
        <ul className="mt-4">
          {teams.map((team) => (
            <li
              key={team.id}
              onClick={() => fetchTeamDetails(team.id)}
              className={`p-2 hover:bg-gray-100 cursor-pointer ${
                selectedTeam?.id === team.id ? 'bg-gray-200' : ''
              }`}
            >
              {team.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {selectedTeam ? (
          <div>
            <h2 className="text-2xl font-semibold mb-4">{selectedTeam.name}</h2>
            <h3 className="text-xl font-semibold mt-6 mb-2">Team Members</h3>
            <ul className="bg-white shadow rounded-lg divide-y">
              {selectedTeam.members?.map((member) => (
                <li key={member.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{member.username}</p>
                    <p className="text-gray-600">{member.email}</p>
                    <p className="text-sm text-gray-500">Role: {member.role}</p>
                  </div>
                  {selectedTeam.role === 'manager' && user && member.id !== user.id && (
                    <div>
                      <button
                        onClick={() => removeMember(member.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded mr-2 hover:bg-red-600"
                      >
                        Remove
                      </button>
                      {member.role !== 'manager' && (
                        <button
                          onClick={() => promoteToManager(member.id)}
                          className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                        >
                          Promote to Manager
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {selectedTeam.role === 'manager' && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-2">Add Member</h3>
                <div className="flex">
                  <select
                    value={newMemberId}
                    onChange={(e) => setNewMemberId(Number(e.target.value))}
                    className="flex-1 p-2 border rounded-l"
                  >
                    <option value="">Select a user</option>
                    {systemUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.username} - {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={addMember}
                    className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
            {selectedTeam.role === 'manager' && (
              <button
                onClick={deleteTeam}
                className="mt-8 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Delete Team
              </button>
            )}
          </div>
        ) : (
          <p>Select a team to view details</p>
        )}
      </div>
    </div>
  );
};

export default TeamsPage;