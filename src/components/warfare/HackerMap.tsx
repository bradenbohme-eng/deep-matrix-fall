import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Zap, Eye, Skull, Satellite, Lock } from 'lucide-react';

// Set your Mapbox access token here - users should replace this with their own token
mapboxgl.accessToken = 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjazZqb21zYmowdG9uM29xdGZ4Zm16eDhzIn0.example'; // Replace with actual token

interface ClassifiedNode {
  id: string;
  name: string;
  type: 'military' | 'intelligence' | 'criminal' | 'hacker' | 'government' | 'corporate';
  coordinates: [number, number];
  threatLevel: 1 | 2 | 3 | 4 | 5;
  status: 'active' | 'dormant' | 'compromised' | 'offline';
  classification: 'TOP SECRET' | 'SECRET' | 'CONFIDENTIAL' | 'RESTRICTED';
  description: string;
  lastActivity: string;
}

const CLASSIFIED_NODES: ClassifiedNode[] = [
  {
    id: 'node_001',
    name: 'NORAD Command Center',
    type: 'military',
    coordinates: [-104.8607, 38.8339],
    threatLevel: 5,
    status: 'active',
    classification: 'TOP SECRET',
    description: 'North American Aerospace Defense Command - Critical Infrastructure',
    lastActivity: '2025-01-15T08:45:22Z'
  },
  {
    id: 'node_002',
    name: 'NSA Data Center',
    type: 'intelligence',
    coordinates: [-76.7713, 39.1080],
    threatLevel: 5,
    status: 'active',
    classification: 'TOP SECRET',
    description: 'National Security Agency - SIGINT Operations Center',
    lastActivity: '2025-01-15T09:12:15Z'
  },
  {
    id: 'node_003',
    name: 'Silicon Valley Hub',
    type: 'corporate',
    coordinates: [-122.0839, 37.4220],
    threatLevel: 3,
    status: 'active',
    classification: 'CONFIDENTIAL',
    description: 'Tech Conglomerate Data Nexus - High Value Target',
    lastActivity: '2025-01-15T07:33:44Z'
  },
  {
    id: 'node_004',
    name: 'Dark Web Exchange',
    type: 'criminal',
    coordinates: [2.3522, 48.8566],
    threatLevel: 4,
    status: 'dormant',
    classification: 'SECRET',
    description: 'Encrypted Communication Hub - Illegal Activities Suspected',
    lastActivity: '2025-01-14T23:18:07Z'
  },
  {
    id: 'node_005',
    name: 'Ghost Protocol Node',
    type: 'hacker',
    coordinates: [139.6917, 35.6895],
    threatLevel: 4,
    status: 'compromised',
    classification: 'SECRET',
    description: 'Elite Hacker Collective - Advanced Persistent Threat',
    lastActivity: '2025-01-15T04:27:33Z'
  },
  {
    id: 'node_006',
    name: 'GCHQ Listening Post',
    type: 'intelligence',
    coordinates: [-2.1358, 51.8987],
    threatLevel: 5,
    status: 'active',
    classification: 'TOP SECRET',
    description: 'Government Communications Headquarters - ELINT Operations',
    lastActivity: '2025-01-15T09:45:12Z'
  },
  {
    id: 'node_007',
    name: 'Kremlin Cyber Division',
    type: 'government',
    coordinates: [37.6173, 55.7558],
    threatLevel: 5,
    status: 'active',
    classification: 'TOP SECRET',
    description: 'State-Sponsored Cyber Operations - High Priority Target',
    lastActivity: '2025-01-15T08:22:18Z'
  },
  {
    id: 'node_008',
    name: 'Pentagon Network Core',
    type: 'military',
    coordinates: [-77.0562, 38.8719],
    threatLevel: 5,
    status: 'active',
    classification: 'TOP SECRET',
    description: 'US Department of Defense - MILNET Operations',
    lastActivity: '2025-01-15T09:15:44Z'
  }
];

const getNodeIcon = (type: string) => {
  switch (type) {
    case 'military': return Shield;
    case 'intelligence': return Eye;
    case 'criminal': return Skull;
    case 'hacker': return Zap;
    case 'government': return Lock;
    case 'corporate': return Satellite;
    default: return Shield;
  }
};

const getThreatColor = (level: number) => {
  switch (level) {
    case 1: return 'hsl(var(--primary))';
    case 2: return '#00ff41';
    case 3: return '#ffff00';
    case 4: return '#ff8800';
    case 5: return '#ff0000';
    default: return 'hsl(var(--primary))';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return '#00ff41';
    case 'dormant': return '#ffff00';
    case 'compromised': return '#ff8800';
    case 'offline': return '#ff0000';
    default: return 'hsl(var(--primary))';
  }
};

export const HackerMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedNode, setSelectedNode] = useState<ClassifiedNode | null>(null);
  const [scanMode, setScanMode] = useState<boolean>(false);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map with dark hacker theme
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'globe',
      zoom: 2,
      center: [0, 20],
      pitch: 45,
      bearing: 0
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Disable scroll zoom for smoother experience
    map.current.scrollZoom.disable();

    // Add atmosphere and fog effects
    map.current.on('style.load', () => {
      if (map.current) {
        map.current.setFog({
          color: 'rgb(0, 20, 0)',
          'high-color': 'rgb(0, 50, 0)',
          'horizon-blend': 0.02,
          'space-color': 'rgb(0, 0, 0)',
          'star-intensity': 0.6
        });

        // Add classified nodes as markers
        CLASSIFIED_NODES.forEach((node) => {
          const Icon = getNodeIcon(node.type);
          
          // Create custom marker element
          const el = document.createElement('div');
          el.className = 'hacker-node-marker';
          el.style.cssText = `
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: radial-gradient(circle, ${getThreatColor(node.threatLevel)}, transparent);
            border: 2px solid ${getThreatColor(node.threatLevel)};
            box-shadow: 0 0 20px ${getThreatColor(node.threatLevel)}80;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: pulse 2s infinite;
          `;

          // Add pulsing animation
          const style = document.createElement('style');
          style.textContent = `
            @keyframes pulse {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.2); opacity: 0.7; }
              100% { transform: scale(1); opacity: 1; }
            }
          `;
          document.head.appendChild(style);

          // Create marker and add to map
          const marker = new mapboxgl.Marker(el)
            .setLngLat(node.coordinates)
            .addTo(map.current!);

          // Add click handler
          el.addEventListener('click', () => {
            setSelectedNode(node);
          });

          markers.current.push(marker);
        });

        // Add grid overlay for hacker aesthetic
        addGridOverlay();
      }
    });

    // Auto-rotation for dramatic effect
    const secondsPerRevolution = 300;
    let userInteracting = false;

    function spinGlobe() {
      if (!map.current || userInteracting) return;
      
      const center = map.current.getCenter();
      center.lng -= 360 / secondsPerRevolution;
      map.current.easeTo({ center, duration: 1000, easing: (n) => n });
    }

    // Event listeners for interaction
    map.current.on('mousedown', () => { userInteracting = true; });
    map.current.on('dragstart', () => { userInteracting = true; });
    map.current.on('mouseup', () => { userInteracting = false; spinGlobe(); });
    map.current.on('touchend', () => { userInteracting = false; spinGlobe(); });
    map.current.on('moveend', spinGlobe);

    // Start spinning
    spinGlobe();

    // Cleanup
    return () => {
      markers.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, []);

  const addGridOverlay = () => {
    if (!map.current) return;

    // Add grid source and layer for cyber aesthetic
    map.current.addSource('grid', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    // Generate grid lines
    const gridLines = [];
    for (let lat = -80; lat <= 80; lat += 20) {
      gridLines.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [[-180, lat], [180, lat]]
        }
      });
    }
    for (let lng = -180; lng <= 180; lng += 20) {
      gridLines.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [[lng, -80], [lng, 80]]
        }
      });
    }

    const gridSource = map.current.getSource('grid') as mapboxgl.GeoJSONSource;
    if (gridSource) {
      gridSource.setData({
        type: 'FeatureCollection',
        features: gridLines
      });
    }

    map.current.addLayer({
      id: 'grid-lines',
      type: 'line',
      source: 'grid',
      paint: {
        'line-color': '#00ff4130',
        'line-width': 0.5
      }
    });
  };

  const startScan = () => {
    setScanMode(true);
    // Simulate scanning animation
    setTimeout(() => setScanMode(false), 3000);
  };

  return (
    <div className="h-full relative">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden" />
      
      {/* Scan Overlay */}
      {scanMode && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse" />
          <div className="absolute top-1/2 left-0 w-full h-1 bg-primary/60 animate-ping" />
          <div className="absolute top-4 left-4 text-primary font-mono text-sm animate-pulse">
            SCANNING FOR CLASSIFIED NODES...
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="absolute top-4 left-4 space-y-2">
        <Button 
          onClick={startScan}
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur border-primary/30"
          disabled={scanMode}
        >
          <Eye className="w-4 h-4 mr-2" />
          {scanMode ? 'SCANNING...' : 'SCAN NODES'}
        </Button>
      </div>

      {/* Node Info Panel */}
      {selectedNode && (
        <Card className="absolute top-4 right-4 w-80 bg-background/90 backdrop-blur border-primary/30">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-mono text-primary">{selectedNode.name}</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedNode(null)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between">
                <span>Type:</span>
                <Badge variant="outline" className="text-xs">
                  {selectedNode.type.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span>Threat Level:</span>
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ color: getThreatColor(selectedNode.threatLevel) }}
                >
                  LEVEL {selectedNode.threatLevel}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ color: getStatusColor(selectedNode.status) }}
                >
                  {selectedNode.status.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span>Classification:</span>
                <Badge variant="destructive" className="text-xs">
                  {selectedNode.classification}
                </Badge>
              </div>
              
              <div className="mt-3 pt-2 border-t border-primary/20">
                <p className="text-xs text-muted-foreground">
                  {selectedNode.description}
                </p>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Last Activity: {new Date(selectedNode.lastActivity).toLocaleString()}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Status Bar */}
      <div className="absolute bottom-4 left-4 right-4 bg-background/80 backdrop-blur border border-primary/30 rounded p-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="text-primary">
            CLASSIFIED NODE TRACKER - {CLASSIFIED_NODES.length} NODES DETECTED
          </div>
          <div className="text-muted-foreground">
            COORDINATES: {map.current?.getCenter().lng.toFixed(4)}, {map.current?.getCenter().lat.toFixed(4)}
          </div>
        </div>
      </div>
    </div>
  );
};