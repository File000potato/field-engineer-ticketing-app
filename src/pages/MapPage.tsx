import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets } from '@/hooks/useTickets';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  Clock,
  Wrench,
  CheckCircle,
  Filter,
  Target,
  Compass
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

export default function MapPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tickets } = useTickets();
  const { isAdmin } = useUserRole(user);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Filter tickets based on user role
  const userTickets = isAdmin ? tickets : tickets.filter(ticket => 
    ticket.reportedBy === user?.email || ticket.assignedTo === user?.email
  );

  // Filter tickets by status
  const filteredTickets = userTickets.filter(ticket => 
    statusFilter === 'all' || ticket.status === statusFilter
  );

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
          });
          setLocationError(null);
        },
        (error) => {
          setLocationError('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
    }
  }, []);

  // Mock function to parse location coordinates
  const parseLocation = (location: string): LocationData | null => {
    // Try to extract coordinates from location string
    const coordMatch = location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (coordMatch) {
      return {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2]),
        address: location
      };
    }
    
    // Mock coordinates for named locations (in a real app, you'd geocode these)
    const mockLocations: { [key: string]: LocationData } = {
      'Building A': { lat: 40.7128, lng: -74.0060, address: 'Building A - Main Facility' },
      'Power Plant': { lat: 40.7589, lng: -73.9851, address: 'Power Plant - Central Station' },
      'Facility B': { lat: 40.7505, lng: -73.9934, address: 'Facility B - Secondary Location' },
    };
    
    for (const [key, coord] of Object.entries(mockLocations)) {
      if (location.toLowerCase().includes(key.toLowerCase())) {
        return coord;
      }
    }
    
    return null;
  };

  const getTicketLocation = (ticket: any) => parseLocation(ticket.location);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-500 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-500 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-500 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-500 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-500 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return Clock;
      case 'in_progress': return Wrench;
      case 'resolved': case 'verified': case 'closed': return CheckCircle;
      default: return Clock;
    }
  };

  const openInMaps = (location: LocationData) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
    window.open(url, '_blank');
  };

  // Sort tickets by distance from user if location is available
  const sortedTickets = userLocation 
    ? filteredTickets
        .map(ticket => ({
          ...ticket,
          locationData: getTicketLocation(ticket),
          distance: (() => {
            const loc = getTicketLocation(ticket);
            return loc ? calculateDistance(userLocation.lat, userLocation.lng, loc.lat, loc.lng) : null;
          })()
        }))
        .sort((a, b) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        })
    : filteredTickets.map(ticket => ({ ...ticket, locationData: getTicketLocation(ticket), distance: null }));

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="w-6 h-6" />
          Field Map
        </h1>
        <p className="text-muted-foreground">
          Navigate to ticket locations and track field work
        </p>
      </div>

      {/* Current Location Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5" />
            Your Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          {locationError ? (
            <div className="text-center py-4">
              <Compass className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{locationError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                Retry Location
              </Button>
            </div>
          ) : userLocation ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Current Position</p>
              <p className="text-xs text-muted-foreground">{userLocation.address}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => openInMaps(userLocation)}
                className="w-full"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Open in Maps
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm">Getting your location...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List with Location */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Nearby Tickets</h2>
          <span className="text-sm text-muted-foreground">
            {sortedTickets.length} tickets
          </span>
        </div>

        {sortedTickets.length === 0 ? (
          <Card className="p-8 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No tickets found</h3>
            <p className="text-muted-foreground mb-4">
              No tickets match your current filters
            </p>
            <Button onClick={() => navigate('/create')}>
              Create New Ticket
            </Button>
          </Card>
        ) : (
          sortedTickets.map((ticket) => {
            const StatusIcon = getStatusIcon(ticket.status);
            const hasLocation = ticket.locationData !== null;
            
            return (
              <Card 
                key={ticket.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md border-l-4",
                  getPriorityColor(ticket.priority),
                  selectedTicket === ticket.id && "ring-2 ring-primary"
                )}
                onClick={() => setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-medium text-sm leading-tight flex-1">
                        {ticket.title}
                      </h3>
                      <div className="flex gap-1">
                        <Badge variant="secondary" className="text-xs">
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{ticket.location}</span>
                      </div>
                      {ticket.distance !== null && (
                        <span className="flex-shrink-0">
                          {ticket.distance < 1 
                            ? `${Math.round(ticket.distance * 1000)}m` 
                            : `${ticket.distance.toFixed(1)}km`\n                          }\n                        </span>\n                      )}\n                    </div>\n\n                    {selectedTicket === ticket.id && (\n                      <div className=\"space-y-2 pt-2 border-t\">\n                        <div className=\"grid grid-cols-2 gap-2\">\n                          <Button \n                            size=\"sm\" \n                            onClick={(e) => {\n                              e.stopPropagation();\n                              navigate(`/tickets/${ticket.id}`);\n                            }}\n                          >\n                            View Details\n                          </Button>\n                          {hasLocation ? (\n                            <Button \n                              variant=\"outline\" \n                              size=\"sm\"\n                              onClick={(e) => {\n                                e.stopPropagation();\n                                openInMaps(ticket.locationData!);\n                              }}\n                            >\n                              <Navigation className=\"w-3 h-3 mr-1\" />\n                              Navigate\n                            </Button>\n                          ) : (\n                            <Button \n                              variant=\"outline\" \n                              size=\"sm\"\n                              disabled\n                              className=\"text-muted-foreground\"\n                            >\n                              No GPS Data\n                            </Button>\n                          )}\n                        </div>\n                        {hasLocation && ticket.locationData && (\n                          <p className=\"text-xs text-muted-foreground\">\n                            📍 {ticket.locationData.lat.toFixed(6)}, {ticket.locationData.lng.toFixed(6)}\n                          </p>\n                        )}\n                      </div>\n                    )}\n                  </div>\n                </CardContent>\n              </Card>\n            );\n          })\n        )}\n      </div>\n\n      {/* Map Integration Note */}\n      <Card className=\"bg-muted/50\">\n        <CardContent className=\"pt-6\">\n          <div className=\"text-center space-y-2\">\n            <MapPin className=\"w-8 h-8 mx-auto text-muted-foreground\" />\n            <p className=\"text-sm text-muted-foreground\">\n              Interactive map view coming soon! For now, use the navigation buttons to open locations in your maps app.\n            </p>\n          </div>\n        </CardContent>\n      </Card>\n    </div>\n  );\n};"}