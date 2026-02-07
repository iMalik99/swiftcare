import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, Plus, Loader2 } from 'lucide-react';
import AmbulanceMap, { calculateDistance } from '@/components/AmbulanceMap';

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

interface EmergencyRequest {
  id: string;
  tracking_code: string;
  requester_name: string | null;
  requester_phone: string;
  emergency_type: string;
  status: string;
  location_lat: number;
  location_lng: number;
  assigned_ambulance_id: string | null;
}

interface AmbulancesTabProps {
  ambulances: AmbulanceData[];
  drivers: DriverProfile[];
  activeRequests: EmergencyRequest[];
  allPendingRequests: EmergencyRequest[];
  statusColors: Record<string, string>;
  newPlateNumber: string;
  setNewPlateNumber: (value: string) => void;
  creatingAmbulance: boolean;
  onCreateAmbulance: () => void;
  onAssignDriver: (ambulanceId: string, driverId: string) => void;
}

export default function AmbulancesTab({
  ambulances,
  drivers,
  activeRequests,
  allPendingRequests,
  statusColors,
  newPlateNumber,
  setNewPlateNumber,
  creatingAmbulance,
  onCreateAmbulance,
  onAssignDriver,
}: AmbulancesTabProps) {
  // Combine active and pending requests for the map
  const allVisibleRequests = [...activeRequests, ...allPendingRequests];
  
  // Prepare map locations
  const mapLocations = [
    ...ambulances.map(amb => ({
      lat: amb.current_lat || 9.0579,
      lng: amb.current_lng || 7.4951,
      label: `${amb.plate_number} (${amb.status})`,
      type: 'ambulance' as const,
      status: amb.status,
    })),
    ...allVisibleRequests.map(req => ({
      lat: req.location_lat,
      lng: req.location_lng,
      label: `${req.tracking_code} - ${req.emergency_type} (${req.status})`,
      type: 'requester' as const,
    })),
  ];

  const getDriverName = (driverId: string | null) => {
    if (!driverId) return null;
    const driver = drivers.find(d => d.user_id === driverId);
    return driver?.full_name || null;
  };

  const getAssignedRequest = (ambulanceId: string) => {
    return activeRequests.find(r => r.assigned_ambulance_id === ambulanceId);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Fleet Overview</h3>
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
              <Button onClick={onCreateAmbulance} disabled={creatingAmbulance} className="w-full">
                {creatingAmbulance && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Ambulance
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Map View */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Live Fleet Map</CardTitle>
          <CardDescription>
            <span className="inline-flex items-center gap-2 mr-4">
              <span className="w-3 h-3 rounded-full bg-primary"></span> Available Ambulance
            </span>
            <span className="inline-flex items-center gap-2 mr-4">
              <span className="w-3 h-3 rounded-full bg-warning"></span> Busy Ambulance
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-destructive"></span> Emergency Request
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <AmbulanceMap locations={mapLocations} zoom={11} />
          </div>
        </CardContent>
      </Card>

      {/* Ambulance Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {ambulances.map(ambulance => {
          const driverName = getDriverName(ambulance.driver_id);
          const assignedRequest = getAssignedRequest(ambulance.id);
          const distance = assignedRequest && ambulance.current_lat && ambulance.current_lng
            ? calculateDistance(
                ambulance.current_lat,
                ambulance.current_lng,
                assignedRequest.location_lat,
                assignedRequest.location_lng
              ).toFixed(1)
            : null;

          return (
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

                {driverName && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Driver: <span className="font-medium text-foreground">{driverName}</span>
                  </p>
                )}

                {assignedRequest && (
                  <div className="p-2 bg-muted rounded-lg mb-3">
                    <p className="text-xs font-medium text-muted-foreground">Active Assignment</p>
                    <p className="text-sm font-mono">{assignedRequest.tracking_code}</p>
                    {distance && (
                      <p className="text-xs text-primary font-medium mt-1">
                        {distance} km to requester
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs">Assigned Driver</Label>
                  <Select 
                    value={ambulance.driver_id || 'none'} 
                    onValueChange={(value) => onAssignDriver(ambulance.id, value === 'none' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No driver assigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No driver</SelectItem>
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
          );
        })}
      </div>
    </div>
  );
}
