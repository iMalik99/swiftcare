import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Location {
  lat: number;
  lng: number;
  label?: string;
  type: 'ambulance' | 'requester' | 'driver';
  status?: string;
}

interface AmbulanceMapProps {
  locations: Location[];
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  showRoute?: boolean;
  driverLocation?: { lat: number; lng: number };
  requesterLocation?: { lat: number; lng: number };
}

// Calculate distance between two points in km (Haversine formula)
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function createIcon(type: 'ambulance' | 'requester' | 'driver', status?: string): L.DivIcon {
  if (type === 'requester') {
    return L.divIcon({
      html: `<div style="background-color: hsl(0, 84%, 60%); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); animation: pulse 1.5s infinite;">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
        </svg>
      </div>`,
      className: 'requester-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }
  
  if (type === 'driver') {
    return L.divIcon({
      html: `<div style="background-color: hsl(173, 80%, 30%); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid hsl(173, 80%, 50%); box-shadow: 0 2px 12px rgba(0,0,0,0.4);">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 10H6"></path>
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path>
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path>
          <circle cx="17" cy="18" r="2"></circle>
          <circle cx="7" cy="18" r="2"></circle>
        </svg>
      </div>`,
      className: 'driver-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }

  // Ambulance icon - color based on status
  const isBusy = status === 'busy' || status === 'en_route' || status === 'arrived';
  const bgColor = isBusy ? 'hsl(38, 92%, 50%)' : 'hsl(173, 80%, 40%)';
  
  return L.divIcon({
    html: `<div style="background-color: ${bgColor}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 10H6"></path>
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path>
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path>
        <circle cx="17" cy="18" r="2"></circle>
        <circle cx="7" cy="18" r="2"></circle>
      </svg>
    </div>`,
    className: isBusy ? 'ambulance-marker-busy' : 'ambulance-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export default function AmbulanceMap({
  locations,
  centerLat = 9.0579,
  centerLng = 7.4951,
  zoom = 12,
  showRoute = false,
  driverLocation,
  requesterLocation,
}: AmbulanceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Layer[]>([]);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current).setView([centerLat, centerLng], zoom);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers and routes
    markersRef.current.forEach(layer => {
      map.removeLayer(layer);
    });
    markersRef.current = [];

    // Add location markers
    locations.forEach((loc) => {
      const icon = createIcon(loc.type, loc.status);
      const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(map);
      if (loc.label) {
        marker.bindPopup(loc.label);
      }
      markersRef.current.push(marker);
    });

    // Draw route line if enabled
    if (showRoute && driverLocation && requesterLocation) {
      const routeLine = L.polyline(
        [
          [driverLocation.lat, driverLocation.lng],
          [requesterLocation.lat, requesterLocation.lng],
        ],
        {
          color: 'hsl(173, 80%, 40%)',
          weight: 4,
          opacity: 0.8,
          dashArray: '10, 10',
        }
      ).addTo(map);
      markersRef.current.push(routeLine);

      // Fit bounds to show both points with padding
      const bounds = L.latLngBounds(
        [driverLocation.lat, driverLocation.lng],
        [requesterLocation.lat, requesterLocation.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, showRoute, driverLocation, requesterLocation]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full min-h-[300px] rounded-lg overflow-hidden"
      style={{ zIndex: 0 }}
    />
  );
}
