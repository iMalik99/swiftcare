import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ambulance, ArrowLeft, Search, Clock, MapPin, User, Phone, CheckCircle, Truck, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmergencyRequest {
  id: string;
  tracking_code: string;
  requester_name: string | null;
  requester_phone: string;
  emergency_type: string;
  description: string | null;
  location_address: string | null;
  status: string;
  created_at: string;
  assigned_ambulance_id: string | null;
}

interface AmbulanceInfo {
  plate_number: string;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: 'Searching for Ambulance', icon: <Clock className="h-5 w-5" />, color: 'bg-amber-100 text-amber-800' },
  assigned: { label: 'Ambulance Assigned', icon: <Truck className="h-5 w-5" />, color: 'bg-blue-100 text-blue-800' },
  en_route: { label: 'Ambulance En Route', icon: <Truck className="h-5 w-5" />, color: 'bg-orange-100 text-orange-800' },
  arrived: { label: 'Ambulance Arrived', icon: <MapPin className="h-5 w-5" />, color: 'bg-emerald-100 text-emerald-800' },
  completed: { label: 'Completed', icon: <CheckCircle className="h-5 w-5" />, color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', icon: <AlertCircle className="h-5 w-5" />, color: 'bg-red-100 text-red-800' },
};

export default function TrackRequest() {
  const { trackingCode } = useParams();
  const [searchCode, setSearchCode] = useState(trackingCode || '');
  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [ambulanceInfo, setAmbulanceInfo] = useState<AmbulanceInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchAmbulanceInfo = async (ambulanceId: string) => {
    const { data: ambData } = await supabase
      .from('ambulances')
      .select('plate_number')
      .eq('id', ambulanceId)
      .single();
    if (ambData) {
      setAmbulanceInfo(ambData as AmbulanceInfo);
    }
  };

  const fetchRequest = async (code: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('emergency_requests')
      .select('*')
      .eq('tracking_code', code.toUpperCase())
      .single();
    
    if (error || !data) {
      toast.error('Request not found. Please check your tracking code.');
      setRequest(null);
      setAmbulanceInfo(null);
    } else {
      const reqData = data as EmergencyRequest;
      setRequest(reqData);
      
      // Fetch ambulance plate number if assigned
      if (reqData.assigned_ambulance_id) {
        await fetchAmbulanceInfo(reqData.assigned_ambulance_id);
      } else {
        setAmbulanceInfo(null);
      }
    }
    setSearched(true);
    setLoading(false);
  };

  useEffect(() => {
    if (trackingCode) {
      fetchRequest(trackingCode);
    }
  }, [trackingCode]);

  // Realtime subscription - re-fetch full data on any update
  useEffect(() => {
    if (!request) return;

    const channel = supabase
      .channel(`request-track-${request.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'emergency_requests',
          filter: `id=eq.${request.id}`,
        },
        async (payload) => {
          const updated = payload.new as EmergencyRequest;
          setRequest(updated);
          
          // Always fetch ambulance info when there's an assignment
          if (updated.assigned_ambulance_id) {
            await fetchAmbulanceInfo(updated.assigned_ambulance_id);
          }
          
          toast.info('Status updated!');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [request?.id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCode.trim()) {
      fetchRequest(searchCode.trim());
    }
  };

  const status = request ? statusConfig[request.status] : null;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-2 emergency-gradient rounded-lg">
              <Ambulance className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">SwiftCare</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        {/* Search Card */}
        <Card className="shadow-lg mb-6">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-xl">Track Your Request</CardTitle>
            <CardDescription>Enter your tracking code to see the status</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="e.g., SC-A1B2C3D4"
                value={searchCode}
                onChange={e => setSearchCode(e.target.value)}
                className="uppercase"
              />
              <Button type="submit" disabled={loading}>
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result Card */}
        {searched && request && (
          <Card className="shadow-lg animate-slide-up">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription>Tracking Code</CardDescription>
                  <CardTitle className="font-display text-lg">{request.tracking_code}</CardTitle>
                </div>
                {status && (
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${status.color}`}>
                    {status.icon}
                    <span className="font-medium text-sm">{status.label}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Progress */}
              <div className="relative">
                <div className="flex justify-between mb-2">
                  {['pending', 'assigned', 'en_route', 'arrived', 'completed'].map((step, i) => {
                    const isActive = ['pending', 'assigned', 'en_route', 'arrived', 'completed'].indexOf(request.status) >= i;
                    return (
                      <div 
                        key={step} 
                        className={`w-3 h-3 rounded-full ${isActive ? 'bg-primary' : 'bg-border'}`}
                      />
                    );
                  })}
                </div>
                <div className="h-1 bg-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ 
                      width: `${(['pending', 'assigned', 'en_route', 'arrived', 'completed'].indexOf(request.status) + 1) * 20}%` 
                    }}
                  />
                </div>
              </div>

              {/* Assigned Ambulance - prominent display */}
              {ambulanceInfo && (
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 emergency-gradient rounded-lg">
                      <Truck className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Assigned Ambulance</p>
                      <p className="text-lg font-mono font-bold text-primary">{ambulanceInfo.plate_number}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{request.emergency_type}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{request.requester_phone}</span>
                </div>
                {request.requester_name && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{request.requester_name}</span>
                  </div>
                )}
                {request.location_address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{request.location_address}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Requested: {new Date(request.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {request.status === 'pending' && (
                <div className="p-4 bg-amber-50 rounded-lg text-center">
                  <p className="text-sm text-amber-800">
                    We're finding the nearest available ambulance. Please stay calm and keep your phone nearby.
                  </p>
                </div>
              )}

              {['en_route', 'assigned'].includes(request.status) && (
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-sm text-blue-800">
                    An ambulance is on its way. Stay at your location and watch for the ambulance.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {searched && !request && (
          <Card className="shadow-lg">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No request found with this tracking code.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
