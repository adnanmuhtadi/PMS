
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import AdminDashboard from '@/components/AdminDashboard';
import TenantDashboard from '@/components/TenantDashboard';
import PublicAuthorityDashboard from '@/components/PublicAuthorityDashboard';

const Dashboard = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {userRole === 'admin' && <AdminDashboard />}
      {userRole === 'tenant' && <TenantDashboard />}
      {userRole === 'public_authority' && <PublicAuthorityDashboard />}
    </div>
  );
};

export default Dashboard;
