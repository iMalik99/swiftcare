import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ambulance, LogOut, Users, Activity, Truck, Plus, AlertCircle, Loader2, MapPin, Clock, Phone, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmergencyRequest {
  id: string;
  tracking_code: string;
  requester_name: string | null;
  requester_phone: string;
  emergency_type: string;
  status: string;
  created_at: string;
  assigned_ambulance_id: string | null;
}

interface AmbulanceData {
  id: string;
  plate_number: string;
  status: string;
  driver_id: string | null;
}

interface DriverProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  assigned: 'bg-blue-100 text-blue-800',
  en_route: 'bg-orange-100 text-orange-800',
  arrived: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  available: 'bg-green-100 text-green-800',
  busy: 'bg-amber-100 text-amber-800',
  offline: 'bg-gray-100 text-gray-800',
};

export default function AdminDashboard() {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [ambulances, setAmbulances] = useState<AmbulanceData[]>([]);
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New driver form
  const [newDriverEmail, setNewDriverEmail] = useState('');
  const [newDriverPassword, setNewDriverPassword] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [creatingDriver, setCreatingDriver] = useState(false);
  
  // New ambulance form
  const [newPlateNumber, setNewPlateNumber] = useState('');
  const [creatingAmbulance, setCreatingAmbulance] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || role !== 'admin')) {
      navigate('/login');
    }
  }, [user, role, authLoading, navigate]);

  const fetchData = async () => {
    // Fetch all requests
    const { data: reqData } = await supabase
      .from('emergency_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    setRequests((reqData as EmergencyRequest[]) || []);

    // Fetch all ambulances
    const { data: ambData } = await supabase
      .from('ambulances')
      .select('*')
      .order('plate_number');
    
    setAmbulances((ambData as AmbulanceData[]) || []);

    // Fetch all driver profiles
    const { data: driverData } = await supabase
      .from('profiles')
      .select('*');
    
    setDrivers((driverData as DriverProfile[]) || []);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel('admin-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_requests' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ambulances' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const assignAmbulance = async (requestId: string, ambulanceId: string) => {
    const ambulance = ambulances.find(a => a.id === ambulanceId);
    if (!ambulance?.driver_id) {
      toast.error('Ambulance has no assigned driver');
      return;
    }

    const { error } = await supabase
      .from('emergency_requests')
      .update({ 
        assigned_ambulance_id: ambulanceId,
        assigned_driver_id: ambulance.driver_id,
        status: 'assigned'
      })
      .eq('id', requestId);
    
    if (error) {
      toast.error('Failed to assign ambulance');
    } else {
      await supabase
        .from('ambulances')
        .update({ status: 'busy' })
        .eq('id', ambulanceId);
      
      toast.success('Ambulance assigned');
      fetchData();
    }
  };

  const createAmbulance = async () => {
    if (!newPlateNumber.trim()) {
      toast.error('Please enter plate number');
      return;
    }
    
    setCreatingAmbulance(true);
    const { error } = await supabase
      .from('ambulances')
      .insert({ plate_number: newPlateNumber.toUpperCase() });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Ambulance added');
      setNewPlateNumber('');
      fetchData();
    }
    setCreatingAmbulance(false);
  };

  const assignDriverToAmbulance = async (ambulanceId: string, driverId: string) => {
    const { error } = await supabase
      .from('ambulances')
      .update({ driver_id: driverId || null })
      .eq('id', ambulanceId);
    
    if (error) {
      toast.error('Failed to assign driver');
    } else {
      toast.success('Driver assigned');
      fetchData();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const activeRequests = requests.filter(r => ['assigned', 'en_route', 'arrived'].includes(r.status));
  const availableAmbulances = ambulances.filter(a => a.status === 'available');

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 emergency-gradient rounded-lg">
              <Ambulance className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display font-bold block">SwiftCare</span>
              <span className="text-xs text-muted-foreground">Admin Dashboard</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingRequests.length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{activeRequests.length}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold">{availableAmbulances.length}</p>
                </div>
                <Truck className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Drivers</p>
                  <p className="text-2xl font-bold">{drivers.length}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requests" className="space-y-4">
          <TabsList>
            <TabsTrigger value="requests">Emergency Requests</TabsTrigger>
            <TabsTrigger value="ambulances">Ambulances</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            {requests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No emergency requests yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {requests.map(request => (
                  <Card key={request.id}>
                    <CardContent className="py-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{request.tracking_code}</span>
                            <Badge className={statusColors[request.status]}>
                              {request.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="font-semibold">{request.emergency_type}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {request.requester_phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(request.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        
                        {request.status === 'pending' && (
                          <Select onValueChange={(value) => assignAmbulance(request.id, value)}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Assign ambulance" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableAmbulances.map(amb => (
                                <SelectItem key={amb.id} value={amb.id}>
                                  {amb.plate_number}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ambulances" className="space-y-4">
            <div className="flex justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Ambulance
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Ambulance</DialogTitle>
                    <DialogDescription>Enter the ambulance plate number</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Plate Number</Label>
                      <Input
                        placeholder="ABC-123-XY"
                        value={newPlateNumber}
                        onChange={e => setNewPlateNumber(e.target.value)}
                        className="uppercase"
                      />
                    </div>
                    <Button onClick={createAmbulance} disabled={creatingAmbulance} className="w-full">
                      {creatingAmbulance && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Add Ambulance
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {ambulances.map(ambulance => (
                <Card key={ambulance.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-mono text-lg font-semibold">{ambulance.plate_number}</p>
                        <Badge className={statusColors[ambulance.status] || 'bg-gray-100'}>
                          {ambulance.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <Truck className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Assigned Driver</Label>
                      <Select 
                        value={ambulance.driver_id || ''} 
                        onValueChange={(value) => assignDriverToAmbulance(ambulance.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="No driver assigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No driver</SelectItem>
                          {drivers.map(driver => (
                            <SelectItem key={driver.user_id} value={driver.user_id}>
                              {driver.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="drivers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Driver Management</CardTitle>
                <CardDescription>
                  To add a new driver, create their account in the Lovable Cloud backend, 
                  then add their role and profile.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {drivers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No drivers registered yet</p>
                ) : (
                  <div className="space-y-3">
                    {drivers.map(driver => (
                      <div key={driver.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-full">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{driver.full_name}</p>
                            {driver.phone && <p className="text-sm text-muted-foreground">{driver.phone}</p>}
                          </div>
                        </div>
                        <Badge variant="outline">Driver</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}