
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Tenant {
  id: string;
  full_name: string;
  date_of_birth: string;
  tenant_type: string;
  identification_number: string;
  room_id: string;
  move_in_date: string;
  move_out_date: string;
  is_active: boolean;
  rooms?: {
    room_number: string;
    properties: {
      name: string;
    };
  };
}

interface Room {
  id: string;
  room_number: string;
  is_occupied: boolean;
  properties: {
    name: string;
  };
}

const TenantManagement = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const [tenantForm, setTenantForm] = useState({
    full_name: '',
    date_of_birth: '',
    tenant_type: '',
    identification_number: '',
    room_id: '',
    move_in_date: ''
  });

  useEffect(() => {
    fetchTenants();
    fetchAvailableRooms();
  }, []);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          rooms (
            room_number,
            properties (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchAvailableRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          id,
          room_number,
          is_occupied,
          properties (name)
        `)
        .eq('is_occupied', false)
        .order('room_number');

      if (error) throw error;
      setAvailableRooms(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Insert tenant
      const { error: tenantError } = await supabase
        .from('tenants')
        .insert(tenantForm);

      if (tenantError) throw tenantError;

      // Update room occupancy status
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ is_occupied: true })
        .eq('id', tenantForm.room_id);

      if (roomError) throw roomError;

      toast({
        title: "Success",
        description: "Tenant created successfully",
      });

      setTenantForm({
        full_name: '',
        date_of_birth: '',
        tenant_type: '',
        identification_number: '',
        room_id: '',
        move_in_date: ''
      });
      setIsDialogOpen(false);
      fetchTenants();
      fetchAvailableRooms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tenant.rooms?.room_number || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Tenant Management</h2>
          <p className="text-gray-600">Manage tenant profiles and room assignments</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Tenant</DialogTitle>
              <DialogDescription>Create a new tenant profile and assign to a room</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <Label htmlFor="tenant-name">Full Name</Label>
                <Input
                  id="tenant-name"
                  value={tenantForm.full_name}
                  onChange={(e) => setTenantForm({ ...tenantForm, full_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tenant-dob">Date of Birth</Label>
                <Input
                  id="tenant-dob"
                  type="date"
                  value={tenantForm.date_of_birth}
                  onChange={(e) => setTenantForm({ ...tenantForm, date_of_birth: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tenant-type">Tenant Type</Label>
                <Input
                  id="tenant-type"
                  value={tenantForm.tenant_type}
                  onChange={(e) => setTenantForm({ ...tenantForm, tenant_type: e.target.value })}
                  placeholder="e.g., Student, Professional"
                />
              </div>
              <div>
                <Label htmlFor="tenant-id">Identification Number</Label>
                <Input
                  id="tenant-id"
                  value={tenantForm.identification_number}
                  onChange={(e) => setTenantForm({ ...tenantForm, identification_number: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tenant-room">Assign Room</Label>
                <Select
                  value={tenantForm.room_id}
                  onValueChange={(value) => setTenantForm({ ...tenantForm, room_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        Room {room.room_number} - {room.properties.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="move-in-date">Move-in Date</Label>
                <Input
                  id="move-in-date"
                  type="date"
                  value={tenantForm.move_in_date}
                  onChange={(e) => setTenantForm({ ...tenantForm, move_in_date: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">Create Tenant</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search tenants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTenants.map((tenant) => (
          <Card key={tenant.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  {tenant.full_name}
                </span>
                <Badge variant={tenant.is_active ? "default" : "secondary"}>
                  {tenant.is_active ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
              {tenant.rooms && (
                <CardDescription>
                  Room {tenant.rooms.room_number} - {tenant.rooms.properties.name}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {tenant.tenant_type && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Type:</span>
                  <span className="text-sm">{tenant.tenant_type}</span>
                </div>
              )}
              {tenant.move_in_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Move-in:
                  </span>
                  <span className="text-sm">
                    {new Date(tenant.move_in_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {tenant.identification_number && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">ID:</span>
                  <span className="text-sm font-mono">{tenant.identification_number}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTenants.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants found</h3>
          <p className="text-gray-600">Add your first tenant to get started</p>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;
