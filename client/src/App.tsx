import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { SurahList } from './pages/SurahList';
import { Todos } from './pages/Todos';
import { Stats } from './pages/Stats';
import { Reminders } from './pages/Reminders';
import { Profile } from './pages/Profile';
import { AdminUsers } from './pages/AdminUsers';
import type { Surah, RepetitionPlan, Stats as StatsType, Todo, AdminUserDetail, UserSession } from './types';

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  
  // Shared states
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [stats, setStats] = useState<StatsType | null>(null);
  const [repetitionPlans, setRepetitionPlans] = useState<RepetitionPlan[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [activities, setActivities] = useState<Record<string, number>>({});
  const [adminUsers, setAdminUsers] = useState<AdminUserDetail[]>([]);
  const [lastStudied, setLastStudied] = useState<{ name: string; time: string } | null>(null);
  const [adminMode, setAdminMode] = useState<boolean>(false);

  const fetchData = async (user?: UserSession) => {
    const activeUser = user || currentUser;
    if (!activeUser) return;

    try {
      const headers = { 'Authorization': `Bearer ${activeUser.token}` };
      
      const surahsRes = await fetch('/api/surahs', { headers });
      const statsRes = await fetch('/api/stats', { headers });
      const todosRes = await fetch('/api/todos', { headers });
      const activitiesRes = await fetch('/api/activities', { headers });
      const plansRes = await fetch('/api/repetition/plans', { headers });

      if (surahsRes.ok) setSurahs(await surahsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (todosRes.ok) setTodos(await todosRes.json());
      if (activitiesRes.ok) setActivities(await activitiesRes.json());
      if (plansRes.ok) setRepetitionPlans(await plansRes.json());

      if (activeUser.role === 'admin') {
        const usersRes = await fetch('/api/admin/users', { headers });
        if (usersRes.ok) {
          setAdminUsers(await usersRes.json());
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchActivities = async (user?: UserSession) => {
    const activeUser = user || currentUser;
    if (!activeUser) return;
    try {
      const headers = { 'Authorization': `Bearer ${activeUser.token}` };
      const res = await fetch('/api/activities', { headers });
      if (res.ok) {
        setActivities(await res.json());
      }
    } catch (e) {
      console.error('Error fetching activities:', e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData(currentUser);
      const savedLastStudied = localStorage.getItem(`lastStudied_${currentUser.id}`);
      if (savedLastStudied) {
        setLastStudied(JSON.parse(savedLastStudied));
      } else {
        setLastStudied(null);
      }
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: UserSession) => {
    fetchData(user);
    const savedLastStudied = localStorage.getItem(`lastStudied_${user.id}`);
    if (savedLastStudied) {
      setLastStudied(JSON.parse(savedLastStudied));
    } else {
      setLastStudied(null);
    }
  };

  const contextValues = {
    currentUser,
    surahs,
    setSurahs,
    stats,
    setStats,
    fetchData,
    repetitionPlans,
    setRepetitionPlans,
    todos,
    setTodos,
    activities,
    setActivities,
    lastStudied,
    setLastStudied,
    fetchActivities,
    adminUsers,
    setAdminUsers,
    adminMode
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={!currentUser ? <Login onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" replace />} 
        />

        {/* Private Routes with Layout */}
        <Route 
          path="/" 
          element={currentUser ? (
            <Layout 
              stats={stats} 
              lastStudied={lastStudied} 
              adminMode={adminMode} 
              setAdminMode={setAdminMode} 
              contextValues={contextValues} 
            />
          ) : (
            <Navigate to="/login" replace />
          )}
        >
          <Route index element={<SurahList />} />
          <Route path="todos" element={<Todos />} />
          <Route path="stats" element={<Stats />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="profile" element={<Profile />} />
          <Route path="admin/users" element={<AdminUsers />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
