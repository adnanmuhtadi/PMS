
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Building, MapPin, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type RoomType = Database['public']['Enums']['room_type'];

interface Property {
  id: string;
  name: string;
  location: string;
  description: string;
  created_at: string;
}

interface Room {
  id: string;
  property_id: string;
  room_number: string;
  room_type: RoomType;
  price: number;
  is_occupied: boolean;
}

const PropertyManagement = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const [propertyForm, setPropertyForm] = useState({
    name: '',
    location: '',
    description: ''
  });

  const [roomForm, setRoomForm] = useState({
    room_number: '',
    room_type: 'single' as RoomType,
    price: ''
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchRooms(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
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

  const fetchRooms = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('property_id', propertyId)
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

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('properties')
        .insert({
          ...propertyForm,
          created_by: user.id
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
    
    try {
      const { error } = await supabase
        .from('rooms')
        .insert({
          room_number: roomForm.room_number,
          room_type: roomForm.room_type,
          property_id: selectedPropertyId,
          price: parseFloat(roomForm.price)
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room created successfully",
      });

      setRoomForm({ room_number: '', room_type: 'single', price: '' });
      setIsRoomDialogOpen(false);
      fetchRooms(selectedPropertyId);
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
          <p className="text-gray-600">Manage your properties and room inventory</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Properties</h3>
          <div className="space-y-4">
            {filteredProperties.map((property) => (
              <Card
                key={property.id}
                className={`cursor-pointer transition-colors ${
                  selectedPropertyId === property.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedPropertyId(property.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      {property.name}
                    </span>
                  </CardTitle>
                  <CardDescription className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {property.location}
                  </CardDescription>
                </CardHeader>
                {property.description && (
                  <CardContent>
                    <p className="text-sm text-gray-600">{property.description}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Rooms {selectedPropertyId && `(${rooms.length})`}
            </h3>
            {selectedPropertyId && (
              <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Room
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Room</DialogTitle>
                    <DialogDescription>Add a room to the selected property</DialogDescription>
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
                        onValueChange={(value: RoomType) => setRoomForm({ ...roomForm, room_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="double">Double</SelectItem>
                          <SelectItem value="family">Family</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="room-price">Price</Label>
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
            )}
          </div>

          {selectedPropertyId ? (
            <div className="space-y-3">
              {rooms.map((room) => (
                <Card key={room.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Room {room.room_number}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="capitalize">
                            {room.room_type}
                          </Badge>
                          <Badge variant={room.is_occupied ? "destructive" : "default"}>
                            {room.is_occupied ? "Occupied" : "Available"}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${room.price}</p>
                        <p className="text-sm text-gray-500">per month</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {rooms.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No rooms found. Add rooms to this property.
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              Select a property to view its rooms
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyManagement;
