import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Phone, Clock } from 'lucide-react';

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

interface RequestsTabProps {
  requests: EmergencyRequest[];
  availableAmbulances: AmbulanceData[];
  statusColors: Record<string, string>;
  onAssignAmbulance: (requestId: string, ambulanceId: string) => void;
}

export default function RequestsTab({ requests, availableAmbulances, statusColors, onAssignAmbulance }: RequestsTabProps) {
  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No emergency requests yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
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
                <Select onValueChange={(value) => onAssignAmbulance(request.id, value)}>
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
  );
}
