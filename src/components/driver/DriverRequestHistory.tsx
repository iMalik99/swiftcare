import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Phone, User, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CompletedRequest {
  id: string;
  tracking_code: string;
  requester_name: string | null;
  requester_phone: string;
  emergency_type: string;
  description: string | null;
  location_address: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
}

interface DriverRequestHistoryProps {
  userId: string;
}

export default function DriverRequestHistory({ userId }: DriverRequestHistoryProps) {
  const [history, setHistory] = useState<CompletedRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('emergency_requests')
        .select('*')
        .eq('assigned_driver_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(50);

      setHistory((data as CompletedRequest[]) || []);
      setLoading(false);
    };

    fetchHistory();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No completed trips yet</p>
          <p className="text-sm text-muted-foreground mt-1">Your completed assignments will appear here</p>
        </CardContent>
      </Card>
    );
  }

  const getDuration = (created: string, completed: string | null) => {
    if (!completed) return null;
    const mins = Math.round((new Date(completed).getTime() - new Date(created).getTime()) / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m`;
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{history.length} completed trip{history.length !== 1 ? 's' : ''}</p>
      {history.map(req => (
        <Card key={req.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardDescription>{req.tracking_code}</CardDescription>
                <CardTitle className="text-base">{req.emergency_type}</CardTitle>
              </div>
              <Badge className="bg-green-100 text-green-800">Completed</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{new Date(req.created_at).toLocaleDateString()} at {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {req.completed_at && (
                <span className="text-muted-foreground">
                  • Duration: {getDuration(req.created_at, req.completed_at)}
                </span>
              )}
            </div>
            {req.requester_name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{req.requester_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{req.requester_phone}</span>
            </div>
            {req.location_address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{req.location_address}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
