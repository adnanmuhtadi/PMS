import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Wrench, Calendar, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type MaintenanceStatus = Database['public']['Enums']['maintenance_status'];

interface MaintenanceLog {
  id: string;
  title: string;
  description: string;
  status: MaintenanceStatus;
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
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  const [maintenanceForm, setMaintenanceForm] = useState({
    title: '',
    description: '',
    room_id: '',
    assigned_vendor: ''
  });

  useEffect(() => {
    fetchMaintenanceLogs();
    fetchRooms();
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

  const fetchRooms = async () => {
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
      setRooms(data || []);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const selectedRoom = rooms.find(room => room.id === maintenanceForm.room_id);
      if (!selectedRoom) throw new Error('Room not found');

      const { error } = await supabase
        .from('maintenance_logs')
        .insert({
          ...maintenanceForm,
          property_id: selectedRoom.properties.id,
          reported_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Maintenance issue logged successfully",
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

  const updateMaintenanceStatus = async (id: string, status: MaintenanceStatus) => {
    try {
      const { error } = await supabase
        .from('maintenance_logs')
        .update({ status })
        .eq('id', id);

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

  const getStatusColor = (status: MaintenanceStatus) => {
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
          <p className="text-gray-600">Track and manage maintenance issues</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Log Issue
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Maintenance Issue</DialogTitle>
              <DialogDescription>Report a new maintenance issue for a room</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateMaintenanceLog} className="space-y-4">
              <div>
                <Label htmlFor="issue-title">Issue Title</Label>
                <Input
                  id="issue-title"
                  value={maintenanceForm.title}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="issue-description">Description</Label>
                <Textarea
                  id="issue-description"
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="issue-room">Room</Label>
                <Select
                  value={maintenanceForm.room_id}
                  onValueChange={(value) => setMaintenanceForm({ ...maintenanceForm, room_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        Room {room.room_number} - {room.properties.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assigned-vendor">Assigned Vendor (Optional)</Label>
                <Input
                  id="assigned-vendor"
                  value={maintenanceForm.assigned_vendor}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, assigned_vendor: e.target.value })}
                  placeholder="Vendor name or company"
                />
              </div>
              <Button type="submit" className="w-full">Log Issue</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search issues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredLogs.map((log) => (
          <Card key={log.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Wrench className="h-4 w-4 mr-2" />
                  {log.title}
                </span>
                <Select
                  value={log.status}
                  onValueChange={(value) => updateMaintenanceStatus(log.id, value as MaintenanceStatus)}
                >
                  <SelectTrigger className="w-32">
                    <Badge variant={getStatusColor(log.status)} className="capitalize">
                      {log.status.replace('_', ' ')}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </CardTitle>
              <CardDescription className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                Room {log.rooms.room_number} - {log.rooms.properties.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-700">{log.description}</p>
              
              {log.assigned_vendor && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Assigned to:</span>
                  <span className="text-sm font-medium">{log.assigned_vendor}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(log.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-12">
          <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No maintenance issues found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? "Try adjusting your search or filter criteria"
              : "Log your first maintenance issue to get started"
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default MaintenanceManagement;
