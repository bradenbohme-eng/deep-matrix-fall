import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Activity, MapPin, AlertCircle, RefreshCw, Globe, Eye, Zap, Shield, AlertTriangle, Car, Video, TrendingUp, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SurveillanceCamera {
  id: string;
  name: string;
  location: string;
  camera_type: string;
  status: string;
  coordinates: { lat: number; lng: number };
  capabilities: string[];
  threat_level: number;
  resolution: string;
  last_ping: string;
}

interface SurveillanceEvent {
  id: string;
  camera_id: string;
  event_type: string;
  confidence: number;
  description: string;
  detected_objects: any[];
  priority: number;
  timestamp: string;
  processed: boolean;
}

interface TrafficData {
  id: string;
  location: string;
  vehicle_count: number;
  speed_avg: number;
  congestion_level: string;
  flow_rate: number;
  timestamp: string;
}

const SurveillancePanel = () => {
  const [cameras, setCameras] = useState<SurveillanceCamera[]>([]);
  const [events, setEvents] = useState<SurveillanceEvent[]>([]);
  const [traffic, setTraffic] = useState<TrafficData[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<SurveillanceCamera | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCameras: 0,
    onlineCameras: 0,
    activeEvents: 0,
    highPriorityEvents: 0,
  });

  useEffect(() => {
    loadSurveillanceData();
    setupRealtimeSubscriptions();
    
    // Simulate event generation every 10 seconds
    const interval = setInterval(() => {
      generateSimulatedEvents();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadSurveillanceData = async () => {
    try {
      setIsLoading(true);

      // Load cameras
      const { data: camerasData, error: camerasError } = await supabase
        .from('surveillance_cameras' as any)
        .select('*')
        .order('threat_level', { ascending: false });

      if (camerasError) throw camerasError;
      setCameras((camerasData as any) || []);

      // Load recent events
      const { data: eventsData, error: eventsError } = await supabase
        .from('surveillance_events' as any)
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (eventsError) throw eventsError;
      setEvents((eventsData as any) || []);

      // Load traffic data
      const { data: trafficData, error: trafficError } = await supabase
        .from('traffic_monitoring' as any)
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);

      if (trafficError) throw trafficError;
      setTraffic((trafficData as any) || []);

      updateStats((camerasData as any) || [], (eventsData as any) || []);
    } catch (error) {
      console.error('Error loading surveillance data:', error);
      toast({
        title: "Error",
        description: "Failed to load surveillance data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to camera updates
    const cameraChannel = supabase
      .channel('surveillance-cameras-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'surveillance_cameras',
        },
        (payload) => {
          console.log('Camera update:', payload);
          loadSurveillanceData();
        }
      )
      .subscribe();

    // Subscribe to new events
    const eventsChannel = supabase
      .channel('surveillance-events-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'surveillance_events',
        },
        (payload) => {
          console.log('New surveillance event:', payload);
          const newEvent = payload.new as SurveillanceEvent;
          setEvents((prev) => [newEvent, ...prev].slice(0, 50));
          
          if (newEvent.priority >= 4) {
            toast({
              title: "High Priority Alert",
              description: newEvent.description,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to traffic updates
    const trafficChannel = supabase
      .channel('traffic-monitoring-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'traffic_monitoring',
        },
        (payload) => {
          console.log('Traffic update:', payload);
          const newTraffic = payload.new as TrafficData;
          setTraffic((prev) => [newTraffic, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(cameraChannel);
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(trafficChannel);
    };
  };

  const generateSimulatedEvents = async () => {
    try {
      const response = await supabase.functions.invoke('surveillance-processor', {
        body: { action: 'generate_events' },
      });

      if (response.error) throw response.error;
      console.log('Generated events:', response.data);
    } catch (error) {
      console.error('Error generating events:', error);
    }
  };

  const updateStats = (camerasData: SurveillanceCamera[], eventsData: SurveillanceEvent[]) => {
    setStats({
      totalCameras: camerasData.length,
      onlineCameras: camerasData.filter(c => c.status === 'online').length,
      activeEvents: eventsData.filter(e => !e.processed).length,
      highPriorityEvents: eventsData.filter(e => e.priority >= 4).length,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'offline': return 'text-gray-400';
      case 'maintenance': return 'text-yellow-400';
      case 'compromised': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'clear': return 'text-green-400';
      case 'light': return 'text-lime-400';
      case 'moderate': return 'text-yellow-400';
      case 'heavy': return 'text-orange-400';
      case 'gridlock': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return 'text-red-400';
    if (priority >= 4) return 'text-orange-400';
    if (priority >= 3) return 'text-yellow-400';
    return 'text-blue-400';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-primary animate-pulse">Loading Surveillance Grid...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-black/40 border-primary/20 p-3">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Cameras</div>
              <div className="text-lg font-bold text-primary">
                {stats.onlineCameras}/{stats.totalCameras}
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-black/40 border-primary/20 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <div>
              <div className="text-xs text-muted-foreground">Priority Alerts</div>
              <div className="text-lg font-bold text-orange-400">{stats.highPriorityEvents}</div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-black/40 border-primary/20 p-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-xs text-muted-foreground">Active Events</div>
              <div className="text-lg font-bold text-blue-400">{stats.activeEvents}</div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-black/40 border-primary/20 p-3">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-xs text-muted-foreground">Traffic Points</div>
              <div className="text-lg font-bold text-cyan-400">{traffic.length}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Camera Grid */}
      <Card className="bg-black/40 border-primary/20 p-3 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <Video className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-primary">Live Camera Feeds</h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {cameras.map((camera) => (
              <div
                key={camera.id}
                className={`p-2 border rounded cursor-pointer transition-colors ${
                  selectedCamera?.id === camera.id
                    ? 'bg-primary/20 border-primary'
                    : 'bg-black/20 border-primary/10 hover:border-primary/30'
                }`}
                onClick={() => setSelectedCamera(camera)}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-primary">{camera.name}</div>
                    <div className="text-xs text-muted-foreground">{camera.location}</div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(camera.status)}>
                    {camera.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{camera.resolution}</span>
                  <span>•</span>
                  <span className="text-orange-400">Threat {camera.threat_level}</span>
                </div>
                {camera.capabilities && camera.capabilities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {camera.capabilities.slice(0, 2).map((cap, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Recent Events */}
      <Card className="bg-black/40 border-primary/20 p-3 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-primary">Recent Events</h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {events.slice(0, 10).map((event) => (
              <div
                key={event.id}
                className="p-2 bg-black/20 border border-primary/10 rounded"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="text-xs font-semibold text-primary">
                    {event.event_type.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <Badge variant="outline" className={getPriorityColor(event.priority)}>
                    P{event.priority}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mb-1">{event.description}</div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-blue-400">
                    Confidence: {(event.confidence * 100).toFixed(0)}%
                  </span>
                  {event.detected_objects && event.detected_objects.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-cyan-400">
                        {event.detected_objects.length} objects
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Traffic Monitoring */}
      <Card className="bg-black/40 border-primary/20 p-3">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-primary">Traffic Monitoring</h3>
        </div>
        <ScrollArea className="h-32">
          <div className="space-y-2">
            {traffic.slice(0, 5).map((data) => (
              <div key={data.id} className="p-2 bg-black/20 border border-primary/10 rounded">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-semibold text-primary">{data.location}</div>
                  <Badge variant="outline" className={getCongestionColor(data.congestion_level)}>
                    {data.congestion_level}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>
                    <Users className="w-3 h-3 inline mr-1" />
                    {data.vehicle_count}
                  </div>
                  <div>
                    <Activity className="w-3 h-3 inline mr-1" />
                    {data.speed_avg?.toFixed(1)} mph
                  </div>
                  <div>
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    {data.flow_rate?.toFixed(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};

export default SurveillancePanel;
