import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Phone } from 'lucide-react';

interface DriverProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
}

interface DriversTabProps {
  drivers: DriverProfile[];
}

export default function DriversTab({ drivers }: DriversTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver Management</CardTitle>
        <CardDescription>
          View and manage ambulance drivers. To add a new driver, create their account in the backend.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {drivers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No drivers registered yet</p>
        ) : (
          <div className="space-y-3">
            {drivers.map(driver => (
              <div key={driver.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{driver.full_name}</p>
                    {driver.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {driver.phone}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  Driver
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
