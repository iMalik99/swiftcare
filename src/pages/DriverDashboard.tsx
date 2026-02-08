import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ambulance, LogOut, MapPin, Phone, Clock, User, AlertCircle, Loader2, Navigation } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AmbulanceMap, { calculateDistance } from '@/components/AmbulanceMap';

interface EmergencyRequest {
  id: string;
  tracking_code: string;
  requester_name: string | null;
  requester_phone: string;
  emergency_type: string;
  description: string | null;
  location_address: string | null;
  location_lat: number;
  location_lng: number;
  status: string;
  created_at: string;
}

interface AmbulanceData {
  id: string;
  plate_number: string;
  status: string;
  current_lat: number | null;
  current_lng: number | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  assigned: 'bg-blue-100 text-blue-800',
  en_route: 'bg-orange-100 text-orange-800',
  arrived: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-green-100 text-green-800',
};

export default function DriverDashboard() {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [ambulance, setAmbulance] = useState<AmbulanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || role !== 'driver')) {
      navigate('/login');
    }
  }, [user, role, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;
    
    // Fetch driver's ambulance
    const { data: ambData } = await supabase
      .from('ambulances')
      .select('*')
      .eq('driver_id', user.id)
      .single();
    
    if (ambData) {
      setAmbulance(ambData);
    }

    // Fetch assigned requests
    const { data: reqData } = await supabase
      .from('emergency_requests')
      .select('*')
      .eq('assigned_driver_id', user.id)
      .in('status', ['assigned', 'en_route', 'arrived'])
      .order('created_at', { ascending: false });
    
    setRequests((reqData as EmergencyRequest[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel('driver-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_requests',
          filter: `assigned_driver_id=eq.${user?.id}`,
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    const request = requests.find(r => r.id === requestId);
    
    const { error } = await supabase
      .from('emergency_requests')
      .update({ 
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', requestId);
    
    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Status updated');
      
      // Update ambulance status and location based on request status
      if (ambulance) {
        let ambStatus = 'busy';
        if (newStatus === 'completed') ambStatus = 'available';
        else if (newStatus === 'en_route') ambStatus = 'en_route';
        else if (newStatus === 'arrived') ambStatus = 'arrived';
        
        const updateData: Record<string, unknown> = { status: ambStatus };
        
        // When arrived, move ambulance location to the requester's location
        if (newStatus === 'arrived' && request) {
          updateData.current_lat = request.location_lat;
          updateData.current_lng = request.location_lng;
        }
        
        await supabase
          .from('ambulances')
          .update(updateData)
          .eq('id', ambulance.id);
      }
      
      fetchData();
    }
  };

  const openMaps = (destLat: number, destLng: number) => {
    // Do NOT pass origin — Google Maps will use the device's real GPS location
    // as the starting point, which is far more accurate than our stored DB coordinates
    // (which can become identical to destination after "arrived" status sync).
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
    
    // Use anchor element to avoid ERR_BLOCKED_BY_RESPONSE in iframe contexts
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Estimate ETA: assume average speed of 40 km/h in city traffic
  // Note: This is a rough estimate and does NOT account for real-time traffic conditions
  const estimateETA = (distanceKm: number): number => {
    return Math.max(1, Math.round((distanceKm / 40) * 60));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeRequest = requests[0]; // Primary active request
  const driverLocation = ambulance && ambulance.current_lat && ambulance.current_lng 
    ? { lat: ambulance.current_lat, lng: ambulance.current_lng } 
    : null;
  const requesterLocation = activeRequest ? { lat: activeRequest.location_lat, lng: activeRequest.location_lng } : null;
  
  const distanceToRequester = driverLocation && requesterLocation
    ? calculateDistance(driverLocation.lat, driverLocation.lng, requesterLocation.lat, requesterLocation.lng)
    : null;

  const mapLocations = [
    ...(driverLocation ? [{ lat: driverLocation.lat, lng: driverLocation.lng, label: 'Your Location', type: 'driver' as const }] : []),
    ...(requesterLocation ? [{ lat: requesterLocation.lat, lng: requesterLocation.lng, label: 'Requester', type: 'requester' as const }] : []),
  ];

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
              <span className="text-xs text-muted-foreground">Driver Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {ambulance && (
              <Badge variant="outline" className="font-mono">
                {ambulance.plate_number}
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Ambulance Status */}
        {ambulance && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Your Ambulance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-lg font-semibold">{ambulance.plate_number}</p>
                  <p className="text-sm text-muted-foreground capitalize">Status: {ambulance.status.replace('_', ' ')}</p>
                </div>
                <Badge className={statusColors[ambulance.status] || 'bg-gray-100'}>
                  {ambulance.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map View for Active Assignment */}
        {activeRequest && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Navigation</CardTitle>
              <CardDescription>
                    {distanceToRequester !== null && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <span className="text-primary font-semibold">
                            {distanceToRequester.toFixed(1)} km away
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-primary font-semibold">
                            ~{estimateETA(distanceToRequester)} min ETA
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Estimate only — does not account for traffic
                        </span>
                      </div>
                    )}
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => openMaps(activeRequest.location_lat, activeRequest.location_lng)}
                  className="emergency-gradient"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Get Directions
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] rounded-lg overflow-hidden">
                <AmbulanceMap 
                  locations={mapLocations}
                  showRoute={true}
                  driverLocation={driverLocation || undefined}
                  requesterLocation={requesterLocation || undefined}
                  zoom={13}
                />
              </div>
              <div className="mt-3 flex gap-4 text-sm">
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(173, 80%, 30%)' }}></span> Your location
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-destructive"></span> Requester
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Requests */}
        <h2 className="font-display font-semibold text-lg mb-4">Active Assignments</h2>
        
        {requests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No active assignments</p>
              <p className="text-sm text-muted-foreground mt-1">New emergencies will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map(request => {
              const distance = driverLocation 
                ? calculateDistance(driverLocation.lat, driverLocation.lng, request.location_lat, request.location_lng)
                : null;

              return (
                <Card key={request.id} className="shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardDescription>{request.tracking_code}</CardDescription>
                        <CardTitle className="text-lg">{request.emergency_type}</CardTitle>
                        {distance !== null && (
                          <p className="text-sm text-primary font-semibold mt-1">
                            {distance.toFixed(1)} km away • ~{estimateETA(distance)} min ETA
                          </p>
                        )}
                      </div>
                      <Badge className={statusColors[request.status]}>
                        {request.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${request.requester_phone}`} className="text-primary hover:underline font-medium">
                          {request.requester_phone}
                        </a>
                      </div>
                      {request.requester_name && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{request.requester_name}</span>
                        </div>
                      )}
                      {request.location_address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{request.location_address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(request.created_at).toLocaleString()}</span>
                      </div>
                      {request.description && (
                        <p className="text-muted-foreground mt-2 p-2 bg-muted rounded">
                          {request.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openMaps(request.location_lat, request.location_lng)}
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        Navigate
                      </Button>
                      
                      <Select 
                        value={request.status}
                        onValueChange={(value) => updateRequestStatus(request.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en_route">En Route</SelectItem>
                          <SelectItem value="arrived">Arrived</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
