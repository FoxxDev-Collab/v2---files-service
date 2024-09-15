// src/pages/dashboard.tsx

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import api from '../utils/api';

interface Team {
  id: number;
  name: string;
  role: string;
}

interface ServiceCard {
  title: string;
  link: string;
  content: React.ReactNode;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    console.log('Dashboard user:', user);
    fetchUserTeams();
  }, [user]);

  const fetchUserTeams = async () => {
    try {
      const response = await api.get('/auth/teams');
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching user teams:', error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const serviceCards: ServiceCard[] = [
    {
      title: "Your Teams",
      link: "/teams",
      content: (
        teams.length > 0 ? (
          <ul>
            {teams.map(team => (
              <li key={team.id} className="mb-2">
                <span className="font-medium">{team.name}</span> - {team.role}
              </li>
            ))}
          </ul>
        ) : (
          <p>You are not a member of any teams.</p>
        )
      )
    },
    { title: "Files", link: "/files", content: <p className="text-gray-500">Coming soon...</p> },
    { title: "Groupware", link: "/groupware", content: <p className="text-gray-500">Coming soon...</p> },
    { title: "Talk", link: "/talk", content: <p className="text-gray-500">Coming soon...</p> },
    { title: "Office", link: "/office", content: <p className="text-gray-500">Coming soon...</p> },
    { title: "Knowledge Hub", link: "/knowledge-hub", content: <p className="text-gray-500">Coming soon...</p> },
  ];

  return (
    <ProtectedRoute>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Welcome to Your Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {serviceCards.map((card, index) => (
            <Link href={card.link} key={index}>
              <div className="bg-white shadow rounded-lg p-6 cursor-pointer transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg">
                <h2 className="text-xl font-semibold mb-4">{card.title}</h2>
                {card.content}
              </div>
            </Link>
          ))}
        </div>

        {/* Profile Link */}
        <div className="mt-8 text-center">
          <Link href="/profile" className="text-indigo-600 hover:text-indigo-500">
            View/Update Your Profile
          </Link>
        </div>
      </main>
    </ProtectedRoute>
  );
}