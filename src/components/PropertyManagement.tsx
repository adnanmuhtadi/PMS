
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Building, Home, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Property {
  id: string;
  name: string;
  location: string;
  description: string;
  rooms: Room[];
}

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  price: number;
  is_occupied: boolean;
}

const PropertyManagement = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const [propertyForm, setPropertyForm] = useState({
    name: '',
    location: '',
    description: ''
  });

  const [roomForm, setRoomForm] = useState({
    room_number: '',
    room_type: '',
    price: ''
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          rooms (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('properties')
        .insert({
          ...propertyForm,
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Property created successfully",
      });

      setPropertyForm({ name: '', location: '', description: '' });
      setIsPropertyDialogOpen(false);
      fetchProperties();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProperty) return;

    try {
      const { error } = await supabase
        .from('rooms')
        .insert({
          ...roomForm,
          price: parseFloat(roomForm.price),
          property_id: selectedProperty.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room created successfully",
      });

      setRoomForm({ room_number: '', room_type: '', price: '' });
      setIsRoomDialogOpen(false);
      fetchProperties();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Property & Room Management</h2>
          <p className="text-gray-600">Manage properties and their rooms</p>
        </div>
        
        <Dialog open={isPropertyDialogOpen} onOpenChange={setIsPropertyDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Property</DialogTitle>
              <DialogDescription>Create a new property to manage</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProperty} className="space-y-4">
              <div>
                <Label htmlFor="property-name">Property Name</Label>
                <Input
                  id="property-name"
                  value={propertyForm.name}
                  onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="property-location">Location</Label>
                <Input
                  id="property-location"
                  value={propertyForm.location}
                  onChange={(e) => setPropertyForm({ ...propertyForm, location: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="property-description">Description</Label>
                <Textarea
                  id="property-description"
                  value={propertyForm.description}
                  onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">Create Property</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search properties..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="space-y-6">
        {filteredProperties.map((property) => (
          <Card key={property.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  {property.name}
                </span>
                <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      onClick={() => setSelectedProperty(property)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Room
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Room to {selectedProperty?.name}</DialogTitle>
                      <DialogDescription>Create a new room in this property</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateRoom} className="space-y-4">
                      <div>
                        <Label htmlFor="room-number">Room Number</Label>
                        <Input
                          id="room-number"
                          value={roomForm.room_number}
                          onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="room-type">Room Type</Label>
                        <Select
                          value={roomForm.room_type}
                          onValueChange={(value) => setRoomForm({ ...roomForm, room_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select room type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="double">Double</SelectItem>
                            <SelectItem value="family">Family</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="room-price">Monthly Price ($)</Label>
                        <Input
                          id="room-price"
                          type="number"
                          step="0.01"
                          value={roomForm.price}
                          onChange={(e) => setRoomForm({ ...roomForm, price: e.target.value })}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">Create Room</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardTitle>
              <CardDescription>{property.location}</CardDescription>
              {property.description && (
                <p className="text-sm text-gray-600">{property.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Rooms ({property.rooms.length} total)</h4>
                  <div className="text-sm text-gray-600">
                    {property.rooms.filter(room => !room.is_occupied).length} available
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {property.rooms.map((room) => (
                    <div
                      key={room.id}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium flex items-center">
                          <Home className="h-3 w-3 mr-1" />
                          Room {room.room_number}
                        </span>
                        <Badge
                          variant={room.is_occupied ? "destructive" : "default"}
                          className="text-xs"
                        >
                          {room.is_occupied ? "Occupied" : "Available"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <Badge variant="outline" className="capitalize">
                          {room.room_type}
                        </Badge>
                        <span className="font-medium">${room.price}/month</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-600">Create your first property to get started</p>
        </div>
      )}
    </div>
  );
};

export default PropertyManagement;
