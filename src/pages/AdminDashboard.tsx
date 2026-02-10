import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminHeader from '@/components/admin/AdminHeader';
import StatsCards from '@/components/admin/StatsCards';
import RequestsTab from '@/components/admin/RequestsTab';
import AmbulancesTab from '@/components/admin/AmbulancesTab';
import DriversTab from '@/components/admin/DriversTab';

interface EmergencyRequest {
  id: string;
  tracking_code: string;
  requester_name: string | null;
  requester_phone: string;
  emergency_type: string;
  status: string;
  created_at: string;
  location_lat: number;
  location_lng: number;
  assigned_ambulance_id: string | null;
}

interface AmbulanceData {
  id: string;
  plate_number: string;
  status: string;
  driver_id: string | null;
  current_lat: number | null;
  current_lng: number | null;
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
  offline: 'bg-red-100 text-red-800',
};

export default function AdminDashboard() {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [ambulances, setAmbulances] = useState<AmbulanceData[]>([]);
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
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

    // Fetch only driver profiles (by joining with user_roles to filter drivers only)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'driver');
    
    const driverUserIds = roleData?.map(r => r.user_id) || [];
    
    if (driverUserIds.length > 0) {
      const { data: driverData } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', driverUserIds);
      
      setDrivers((driverData as DriverProfile[]) || []);
    } else {
      setDrivers([]);
    }
    
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
      <AdminHeader onSignOut={signOut} />

      <main className="container mx-auto px-4 py-6">
        <StatsCards
          pendingCount={pendingRequests.length}
          activeCount={activeRequests.length}
          availableCount={availableAmbulances.length}
          driversCount={drivers.length}
        />

        <Tabs defaultValue="requests" className="space-y-4">
          <TabsList>
            <TabsTrigger value="requests">Emergency Requests</TabsTrigger>
            <TabsTrigger value="ambulances">Ambulances</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            <RequestsTab
              requests={requests}
              availableAmbulances={availableAmbulances}
              statusColors={statusColors}
              onAssignAmbulance={assignAmbulance}
            />
          </TabsContent>

          <TabsContent value="ambulances" className="space-y-4">
            <AmbulancesTab
              ambulances={ambulances}
              drivers={drivers}
              activeRequests={activeRequests}
              allPendingRequests={pendingRequests}
              statusColors={statusColors}
              newPlateNumber={newPlateNumber}
              setNewPlateNumber={setNewPlateNumber}
              creatingAmbulance={creatingAmbulance}
              onCreateAmbulance={createAmbulance}
              onAssignDriver={assignDriverToAmbulance}
            />
          </TabsContent>

          <TabsContent value="drivers" className="space-y-4">
            <DriversTab drivers={drivers} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
