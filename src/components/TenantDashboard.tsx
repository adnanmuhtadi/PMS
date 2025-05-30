
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Home, Wrench, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';

interface TenantInfo {
  id: string;
  full_name: string;
  date_of_birth: string;
  tenant_type: string;
  move_in_date: string;
  room_id: string;
  rooms: {
    room_number: string;
    room_type: string;
    price: number;
    properties: {
      name: string;
      location: string;
    };
  };
}

interface MaintenanceLog {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

const TenantDashboard = () => {
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTenantInfo();
      fetchMaintenanceLogs();
    }
  }, [user]);

  const fetchTenantInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          rooms (
            room_number,
            room_type,
            price,
            properties (name, location)
          )
        `)
        .eq('profile_id', user?.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setTenantInfo(data);
    } catch (error: any) {
      console.error('Error fetching tenant info:', error);
    }
  };

  const fetchMaintenanceLogs = async () => {
    try {
      if (!tenantInfo?.room_id) return;
      
      const { data, error } = await supabase
        .from('maintenance_logs')
        .select('*')
        .eq('room_id', tenantInfo.room_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaintenanceLogs(data || []);
    } catch (error: any) {
      console.error('Error fetching maintenance logs:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'in_progress':
        return 'default';
      case 'resolved':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenant Dashboard</h1>
          <p className="text-gray-600">View your tenancy information and maintenance requests</p>
        </div>

        {tenantInfo ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Full Name:</span>
                    <span className="text-sm font-medium">{tenantInfo.full_name}</span>
                  </div>
                  {tenantInfo.tenant_type && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="text-sm font-medium">{tenantInfo.tenant_type}</span>
                    </div>
                  )}
                  {tenantInfo.move_in_date && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Move-in Date:</span>
                      <span className="text-sm font-medium">
                        {new Date(tenantInfo.move_in_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Home className="h-5 w-5 mr-2" />
                    Room Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Property:</span>
                    <span className="text-sm font-medium">{tenantInfo.rooms.properties.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Location:</span>
                    <span className="text-sm font-medium">{tenantInfo.rooms.properties.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Room Number:</span>
                    <span className="text-sm font-medium">{tenantInfo.rooms.room_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Room Type:</span>
                    <Badge variant="outline" className="capitalize">
                      {tenantInfo.rooms.room_type}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Monthly Rent:</span>
                    <span className="text-sm font-medium">${tenantInfo.rooms.price}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wrench className="h-5 w-5 mr-2" />
                  Maintenance Requests
                </CardTitle>
                <CardDescription>
                  Track the status of maintenance issues in your room
                </CardDescription>
              </CardHeader>
              <CardContent>
                {maintenanceLogs.length > 0 ? (
                  <div className="space-y-4">
                    {maintenanceLogs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{log.title}</h4>
                          <Badge variant={getStatusColor(log.status)} className="capitalize">
                            {log.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{log.description}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(log.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No maintenance requests found
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tenancy Found</h3>
              <p className="text-gray-600">
                You are not currently assigned to any room. Please contact your property manager.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default TenantDashboard;
