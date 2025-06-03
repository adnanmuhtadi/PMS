
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Wrench, Search, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface MaintenanceLog {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  assigned_vendor: string;
  created_at: string;
  rooms: {
    room_number: string;
    properties: {
      name: string;
    };
  };
}

interface Room {
  id: string;
  room_number: string;
  property_id: string;
  properties: {
    id: string;
    name: string;
  };
}

const MaintenanceManagement = () => {
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();
  const { user } = useAuth();

  const [maintenanceForm, setMaintenanceForm] = useState({
    title: '',
    description: '',
    room_id: '',
    assigned_vendor: ''
  });

  useEffect(() => {
    fetchMaintenanceLogs();
    fetchAvailableRooms();
  }, []);

  const fetchMaintenanceLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_logs')
        .select(`
          *,
          rooms (
            room_number,
            properties (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaintenanceLogs(data || []);
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
          property_id,
          properties (id, name)
        `)
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

  const handleCreateMaintenanceLog = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Find the selected room to get the property_id
      const selectedRoom = availableRooms.find(room => room.id === maintenanceForm.room_id);
      if (!selectedRoom) {
        throw new Error('Please select a valid room');
      }

      const { error } = await supabase
        .from('maintenance_logs')
        .insert({
          title: maintenanceForm.title,
          description: maintenanceForm.description,
          room_id: maintenanceForm.room_id,
          property_id: selectedRoom.property_id,
          assigned_vendor: maintenanceForm.assigned_vendor,
          reported_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Maintenance request created successfully",
      });

      setMaintenanceForm({
        title: '',
        description: '',
        room_id: '',
        assigned_vendor: ''
      });
      setIsDialogOpen(false);
      fetchMaintenanceLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (logId: string, newStatus: 'open' | 'in_progress' | 'resolved') => {
    try {
      const { error } = await supabase
        .from('maintenance_logs')
        .update({ status: newStatus })
        .eq('id', logId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Status updated successfully",
      });

      fetchMaintenanceLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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

  const filteredLogs = maintenanceLogs.filter(log => {
    const matchesSearch = log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.rooms.room_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Maintenance Management</h2>
          <p className="text-gray-600">Track and manage maintenance requests</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Maintenance Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Maintenance Request</DialogTitle>
              <DialogDescription>Report a new maintenance issue</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateMaintenanceLog} className="space-y-4">
              <div>
                <Label htmlFor="maintenance-title">Title</Label>
                <Input
                  id="maintenance-title"
                  value={maintenanceForm.title}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="maintenance-description">Description</Label>
                <Textarea
                  id="maintenance-description"
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="maintenance-room">Room</Label>
                <Select
                  value={maintenanceForm.room_id}
                  onValueChange={(value) => setMaintenanceForm({ ...maintenanceForm, room_id: value })}
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
                <Label htmlFor="maintenance-vendor">Assigned Vendor (Optional)</Label>
                <Input
                  id="maintenance-vendor"
                  value={maintenanceForm.assigned_vendor}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, assigned_vendor: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">Create Request</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search maintenance requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="max-w-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredLogs.map((log) => (
          <Card key={log.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Wrench className="h-4 w-4 mr-2" />
                  {log.title}
                </span>
                <div className="flex items-center gap-2">
                  <Select
                    value={log.status}
                    onValueChange={(value: 'open' | 'in_progress' | 'resolved') => handleUpdateStatus(log.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge variant={getStatusColor(log.status)} className="capitalize">
                    {log.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>
                Room {log.rooms.room_number} - {log.rooms.properties.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{log.description}</p>
              
              {log.assigned_vendor && (
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-3 w-3 mr-1" />
                  Assigned to: {log.assigned_vendor}
                </div>
              )}
              
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                Reported: {new Date(log.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-12">
          <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No maintenance requests found</h3>
          <p className="text-gray-600">Create your first maintenance request to get started</p>
        </div>
      )}
    </div>
  );
};

export default MaintenanceManagement;
