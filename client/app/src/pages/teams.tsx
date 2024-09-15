import React, { useState, useEffect } from 'react';
import { useAuth, User } from '../contexts/AuthContext';
import api from '../utils/api';
import { useRouter } from 'next/router';

interface Team {
  id: number;
  name: string;
  description: string;
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

// Reusable success message component
const SuccessMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
    <strong className="font-bold">Success:</strong>
    <span className="block sm:inline"> {message}</span>
  </div>
);

const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newMemberId, setNewMemberId] = useState<number | ''>('');
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [teamDescription, setTeamDescription] = useState('');
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchTeams();
    fetchSystemUsers();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await api.get('/auth/teams');
      console.log('Fetched teams:', response.data);
      setTeams(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('Failed to fetch teams. Please try again.');
    }
  };

  const fetchSystemUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setSystemUsers(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching system users:', error);
      setError('Failed to fetch system users. Please try again.');
    }
  };

  const fetchTeamDetails = async (teamId: number) => {
    try {
      const response = await api.get(`/auth/teams/${teamId}`);
      console.log('Fetched team details:', response.data);
      setSelectedTeam(response.data);
      setTeamDescription(response.data.description || '');
      setError(null);
    } catch (error: any) {
      console.error('Error fetching team details:', error);
      if (error.response && error.response.status === 403) {
        setError("You don't have permission to view this team's details.");
      } else {
        setError('Failed to fetch team details. Please try again.');
      }
      setSelectedTeam(null);
    }
  };

  const updateTeamDescription = async () => {
    if (!selectedTeam) return;
    
    if (teamDescription.length > 500) {
      setDescriptionError('Description must be 500 characters or less');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await api.put(`/auth/teams/${selectedTeam.id}`, { 
        name: selectedTeam.name,
        description: teamDescription 
      });
      setSelectedTeam({ ...selectedTeam, description: teamDescription });
      setError(null);
      setDescriptionError(null);
      setSuccessMessage('Team description updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error updating team description:', error);
      setError('Failed to update team description. Please try again.');
    } finally {
      setIsUpdating(false);
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

  const isTeamManager = (team: Team | null): boolean => {
    if (!team || !user) return false;
    const currentUserMember = team.members?.find(member => member.id === user.id);
    return currentUserMember?.role === 'manager';
  };

  console.log('Current user:', user);
  console.log('Selected team:', selectedTeam);
  
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
        {successMessage && <SuccessMessage message={successMessage} />}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
        {selectedTeam ? (
          <div>
            <h2 className="text-2xl font-semibold mb-4">{selectedTeam.name}</h2>
            <p>Your role in this team: {selectedTeam.members?.find(member => member.id === user?.id)?.role || 'Unknown'}</p>
          
            {/* Team Members and Description */}
            <div className="flex flex-wrap -mx-2 mb-8">
              {/* Team Members */}
              <div className="w-full md:w-1/2 px-2 mb-4">
                <h3 className="text-xl font-semibold mb-2">Team Members</h3>
                <ul className="bg-white shadow rounded-lg divide-y">
                  {selectedTeam.members?.map((member) => (
                    <li key={member.id} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{member.username}</p>
                        <p className="text-gray-600">{member.email}</p>
                        <p className="text-sm text-gray-500">Role: {member.role}</p>
                      </div>
                      {isTeamManager(selectedTeam) && user && member.id !== user.id && (
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
              </div>
              
              {/* Team Description */}
              <div className="w-full md:w-1/2 px-2 mb-4">
                <h3 className="text-xl font-semibold mb-2">Team Description</h3>
                <div className="bg-white shadow rounded-lg p-4">
                  {isTeamManager(selectedTeam) ? (
                    <>
                      <textarea
                        value={teamDescription}
                        onChange={(e) => {
                          setTeamDescription(e.target.value);
                          setDescriptionError(e.target.value.length > 500 ? 'Description must be 500 characters or less' : null);
                        }}
                        className="w-full p-2 border rounded mb-2"
                        rows={5}
                        maxLength={500}
                        placeholder="Enter team description (max 500 characters)..."
                      />
                      {descriptionError && <p className="text-red-500 text-sm">{descriptionError}</p>}
                      <p className="text-sm text-gray-500 mb-2">{teamDescription.length}/500 characters</p>
                      <button
                        onClick={updateTeamDescription}
                        className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-all duration-300 ease-in-out ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!!descriptionError || isUpdating}
                      >
                        {isUpdating ? 'Updating...' : 'Update Description'}
                      </button>
                    </>
                  ) : (
                    <p>{selectedTeam.description || 'No description available.'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Team Folders Placeholder */}
            <div className="bg-white shadow rounded-lg p-4 mb-8">
              <h3 className="text-xl font-semibold mb-2">Team Folders</h3>
              <p className="text-gray-600">Placeholder for team document sharing. Coming soon!</p>
            </div>

            {/* Team Rooms Placeholder */}
            <div className="bg-white shadow rounded-lg p-4 mb-8">
              <h3 className="text-xl font-semibold mb-2">Team Rooms</h3>
              <p className="text-gray-600">Placeholder for team chat rooms. Coming soon!</p>
            </div>

            {/* Team Projects Placeholder */}
            <div className="bg-white shadow rounded-lg p-4 mb-8">
              <h3 className="text-xl font-semibold mb-2">Team Projects</h3>
              <p className="text-gray-600">Placeholder for team projects and tasks. Coming soon!</p>
            </div>
            
            {isTeamManager(selectedTeam) && (
              <div className="mt-8">
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
            
            {isTeamManager(selectedTeam) && (
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