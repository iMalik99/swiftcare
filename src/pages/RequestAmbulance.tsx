import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ambulance, MapPin, Phone, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const requestSchema = z.object({
  requesterName: z.string().trim().max(100, 'Name must be less than 100 characters').optional(),
  requesterPhone: z.string().trim().min(10, 'Phone number must be at least 10 digits').max(20, 'Phone number too long'),
  emergencyType: z.string().min(1, 'Please select an emergency type'),
  description: z.string().trim().max(500, 'Description must be less than 500 characters').optional(),
  locationAddress: z.string().trim().max(255, 'Address too long').optional(),
  locationLat: z.number().min(-90).max(90),
  locationLng: z.number().min(-180).max(180),
});

const emergencyTypes = [
  'Medical Emergency',
  'Accident/Trauma',
  'Cardiac Emergency',
  'Respiratory Distress',
  'Pregnancy/Childbirth',
  'Burns',
  'Poisoning',
  'Other'
];

export default function RequestAmbulance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [formData, setFormData] = useState({
    requesterName: '',
    requesterPhone: '',
    emergencyType: '',
    description: '',
    locationAddress: '',
    locationLat: 9.0579, // Default: Abuja center
    locationLng: 7.4951,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getLocation = () => {
    setGettingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            locationLat: position.coords.latitude,
            locationLng: position.coords.longitude,
          }));
          toast.success('Location captured successfully');
          setGettingLocation(false);
        },
        (error) => {
          toast.error('Could not get location. Please enter address manually.');
          setGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      toast.error('Geolocation not supported by your browser');
      setGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const validation = requestSchema.safeParse({
      ...formData,
      requesterName: formData.requesterName || undefined,
      description: formData.description || undefined,
      locationAddress: formData.locationAddress || undefined,
    });
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }
    
    setLoading(true);
    
    const { data, error } = await supabase
      .from('emergency_requests')
      .insert({
        requester_name: formData.requesterName || null,
        requester_phone: formData.requesterPhone,
        emergency_type: formData.emergencyType,
        description: formData.description || null,
        location_address: formData.locationAddress || null,
        location_lat: formData.locationLat,
        location_lng: formData.locationLng,
      })
      .select('tracking_code')
      .single();
    
    if (error) {
      toast.error('Failed to submit request. Please try again.');
      setLoading(false);
      return;
    }
    
    toast.success('Emergency request submitted!');
    navigate(`/track/${data.tracking_code}`);
  };

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
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto p-4 emergency-gradient rounded-2xl w-fit mb-4">
              <Phone className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="font-display text-2xl">Request Ambulance</CardTitle>
            <CardDescription>
              Provide your details for emergency dispatch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Location */}
              <div className="space-y-2">
                <Label>Your Location *</Label>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={getLocation}
                    disabled={gettingLocation}
                  >
                    {gettingLocation ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4 mr-2" />
                    )}
                    Use My Location
                  </Button>
                </div>
                <Input
                  placeholder="Or enter address manually"
                  value={formData.locationAddress}
                  onChange={e => setFormData(prev => ({ ...prev, locationAddress: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Coordinates: {formData.locationLat.toFixed(4)}, {formData.locationLng.toFixed(4)}
                </p>
              </div>

              {/* Emergency Type */}
              <div className="space-y-2">
                <Label>Emergency Type *</Label>
                <Select 
                  value={formData.emergencyType}
                  onValueChange={value => setFormData(prev => ({ ...prev, emergencyType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select emergency type" />
                  </SelectTrigger>
                  <SelectContent>
                    {emergencyTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.emergencyType && <p className="text-sm text-destructive">{errors.emergencyType}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input
                  type="tel"
                  placeholder="Your phone number"
                  value={formData.requesterPhone}
                  onChange={e => setFormData(prev => ({ ...prev, requesterPhone: e.target.value }))}
                />
                {errors.requesterPhone && <p className="text-sm text-destructive">{errors.requesterPhone}</p>}
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label>Your Name (Optional)</Label>
                <Input
                  placeholder="Your name"
                  value={formData.requesterName}
                  onChange={e => setFormData(prev => ({ ...prev, requesterName: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Additional Details (Optional)</Label>
                <Textarea
                  placeholder="Describe the emergency situation..."
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full emergency-gradient shadow-emergency text-lg py-6"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Ambulance className="h-5 w-5 mr-2" />
                )}
                Submit Emergency Request
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}