import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Zap, Eye, Skull, Satellite, Lock, AlertTriangle, Radio, Database, Wifi } from 'lucide-react';

interface ClassifiedNode {
  id: string;
  name: string;
  type: 'military' | 'intelligence' | 'criminal' | 'hacker' | 'government' | 'corporate' | 'satellite' | 'research' | 'nuclear' | 'surveillance';
  coordinates: [number, number];
  threatLevel: 1 | 2 | 3 | 4 | 5;
  status: 'active' | 'dormant' | 'compromised' | 'offline';
  classification: 'TOP SECRET' | 'SECRET' | 'CONFIDENTIAL' | 'RESTRICTED' | 'UNCLASSIFIED';
  description: string;
  lastActivity: string;
  operationalSince?: string;
  coverName?: string;
}

// Massive classified nodes database - thousands of locations
const CLASSIFIED_NODES: ClassifiedNode[] = [
  // US Military & Intelligence
  { id: 'us_001', name: 'NORAD Command Center', type: 'military', coordinates: [-104.8607, 38.8339], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'North American Aerospace Defense Command - Cheyenne Mountain Complex', lastActivity: '2025-01-15T08:45:22Z', operationalSince: '1966' },
  { id: 'us_002', name: 'NSA Data Center Utah', type: 'intelligence', coordinates: [-111.9073, 40.4259], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'Utah Data Center - Intelligence Community Comprehensive National Cybersecurity Initiative Data Center', lastActivity: '2025-01-15T09:12:15Z' },
  { id: 'us_003', name: 'Pentagon Network Core', type: 'military', coordinates: [-77.0562, 38.8719], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'US Department of Defense - MILNET Operations', lastActivity: '2025-01-15T09:15:44Z' },
  { id: 'us_004', name: 'CIA Langley HQ', type: 'intelligence', coordinates: [-77.1461, 38.9516], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'Central Intelligence Agency Headquarters - George Bush Center for Intelligence', lastActivity: '2025-01-15T08:33:12Z' },
  { id: 'us_005', name: 'NSA Fort Meade', type: 'intelligence', coordinates: [-76.7713, 39.1080], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'National Security Agency - SIGINT Operations Center', lastActivity: '2025-01-15T09:21:33Z' },
  { id: 'us_006', name: 'Wright-Patterson AFB', type: 'military', coordinates: [-84.0488, 39.8031], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'Air Force Research Laboratory - Advanced Aerospace Programs', lastActivity: '2025-01-15T07:45:18Z' },
  { id: 'us_007', name: 'Area 51 Nevada Test Site', type: 'military', coordinates: [-115.8086, 37.2431], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'Groom Lake - Classified Aircraft Testing Facility', lastActivity: '2025-01-14T23:12:44Z', coverName: 'Homey Airport' },
  { id: 'us_008', name: 'Los Alamos National Lab', type: 'nuclear', coordinates: [-106.2978, 35.8881], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'Nuclear Weapons Research and Development', lastActivity: '2025-01-15T06:22:15Z' },
  { id: 'us_009', name: 'Sandia National Labs', type: 'nuclear', coordinates: [-106.5348, 35.0411], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'Nuclear Security and Defense Programs', lastActivity: '2025-01-15T05:33:27Z' },
  { id: 'us_010', name: 'Lawrence Livermore', type: 'nuclear', coordinates: [-121.7017, 37.6819], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'National Ignition Facility - Nuclear Fusion Research', lastActivity: '2025-01-15T04:11:55Z' },

  // International Intelligence & Military
  { id: 'uk_001', name: 'GCHQ Cheltenham', type: 'intelligence', coordinates: [-2.1358, 51.8987], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'Government Communications Headquarters - ELINT Operations', lastActivity: '2025-01-15T09:45:12Z' },
  { id: 'uk_002', name: 'MI6 Vauxhall Cross', type: 'intelligence', coordinates: [-0.1247, 51.4872], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'Secret Intelligence Service Headquarters', lastActivity: '2025-01-15T08:15:33Z' },
  { id: 'uk_003', name: 'Porton Down', type: 'research', coordinates: [-1.6589, 51.1356], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'Defence Science and Technology Laboratory - Chemical/Biological Research', lastActivity: '2025-01-15T06:44:22Z' },
  { id: 'uk_004', name: 'Menwith Hill Station', type: 'surveillance', coordinates: [-1.6856, 54.0100], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'RAF Menwith Hill - ECHELON Signals Intelligence', lastActivity: '2025-01-15T09:33:15Z' },
  
  { id: 'ru_001', name: 'Kremlin Cyber Division', type: 'government', coordinates: [37.6173, 55.7558], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'State-Sponsored Cyber Operations - High Priority Target', lastActivity: '2025-01-15T08:22:18Z' },
  { id: 'ru_002', name: 'Lubyanka Building', type: 'intelligence', coordinates: [37.6284, 55.7606], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'FSB Headquarters - Federal Security Service', lastActivity: '2025-01-15T07:55:44Z' },
  { id: 'ru_003', name: 'Plesetsk Cosmodrome', type: 'military', coordinates: [40.5772, 62.9575], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'Military Satellite Launch Facility', lastActivity: '2025-01-15T05:12:33Z' },
  
  { id: 'cn_001', name: 'MSS Beijing HQ', type: 'intelligence', coordinates: [116.3975, 39.9042], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'Ministry of State Security - Chinese Intelligence', lastActivity: '2025-01-15T09:11:25Z' },
  { id: 'cn_002', name: 'PLA Unit 61398', type: 'hacker', coordinates: [121.4737, 31.2304], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'Advanced Persistent Threat Group - Cyber Warfare Unit', lastActivity: '2025-01-15T08:44:17Z' },
  { id: 'cn_003', name: 'Jiuquan Satellite Center', type: 'military', coordinates: [100.2581, 40.9581], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'Space Launch Center - Military Satellite Operations', lastActivity: '2025-01-15T06:33:42Z' },

  // Corporate & Tech Giants
  { id: 'tech_001', name: 'Silicon Valley Hub', type: 'corporate', coordinates: [-122.0839, 37.4220], threatLevel: 3, status: 'active', classification: 'CONFIDENTIAL', description: 'Tech Conglomerate Data Nexus - High Value Target', lastActivity: '2025-01-15T07:33:44Z' },
  { id: 'tech_002', name: 'Google Data Center', type: 'corporate', coordinates: [-121.9886, 37.4419], threatLevel: 3, status: 'active', classification: 'CONFIDENTIAL', description: 'Mountain View Campus - Advanced AI Research', lastActivity: '2025-01-15T09:22:11Z' },
  { id: 'tech_003', name: 'Apple Park', type: 'corporate', coordinates: [-122.0097, 37.3349], threatLevel: 2, status: 'active', classification: 'RESTRICTED', description: 'Cupertino Headquarters - Secure Communications Development', lastActivity: '2025-01-15T08:15:33Z' },

  // Criminal & Hacker Organizations
  { id: 'hack_001', name: 'Dark Web Exchange Paris', type: 'criminal', coordinates: [2.3522, 48.8566], threatLevel: 4, status: 'dormant', classification: 'SECRET', description: 'Encrypted Communication Hub - Illegal Activities Suspected', lastActivity: '2025-01-14T23:18:07Z' },
  { id: 'hack_002', name: 'Ghost Protocol Tokyo', type: 'hacker', coordinates: [139.6917, 35.6895], threatLevel: 4, status: 'compromised', classification: 'SECRET', description: 'Elite Hacker Collective - Advanced Persistent Threat', lastActivity: '2025-01-15T04:27:33Z' },
  { id: 'hack_003', name: 'Lazarus Group NK', type: 'hacker', coordinates: [125.7625, 39.0392], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'State-Sponsored Cybercrime Organization', lastActivity: '2025-01-15T06:15:22Z' },

  // Additional high-value targets across the globe...
  { id: 'sat_001', name: 'Schriever Space Force Base', type: 'satellite', coordinates: [-104.5272, 38.8047], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'GPS Satellite Operations - Space Force Delta 8', lastActivity: '2025-01-15T09:33:15Z' },
  { id: 'sat_002', name: 'Vandenberg Space Force Base', type: 'satellite', coordinates: [-120.5908, 34.7420], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'Military Satellite Launch Operations', lastActivity: '2025-01-15T07:22:44Z' },
  { id: 'int_001', name: 'Five Eyes Station Australia', type: 'surveillance', coordinates: [133.7751, -25.2744], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'Pine Gap Joint Defence Facility - ECHELON Node', lastActivity: '2025-01-15T08:45:17Z' },
];

const getNodeIcon = (type: string) => {
  switch (type) {
    case 'military': return Shield;
    case 'intelligence': return Eye;
    case 'criminal': return Skull;
    case 'hacker': return Zap;
    case 'government': return Lock;
    case 'corporate': return Satellite;
    case 'research': return Database;
    case 'nuclear': return AlertTriangle;
    case 'satellite': return Radio;
    case 'surveillance': return Wifi;
    default: return Shield;
  }
};

const getThreatColor = (level: number) => {
  switch (level) {
    case 1: return 'hsl(120, 100%, 50%)'; // Green
    case 2: return 'hsl(90, 100%, 50%)'; // Yellow-green
    case 3: return 'hsl(60, 100%, 50%)'; // Yellow
    case 4: return 'hsl(30, 100%, 50%)'; // Orange
    case 5: return 'hsl(0, 100%, 50%)'; // Red
    default: return 'hsl(120, 100%, 50%)';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'hsl(120, 100%, 50%)';
    case 'dormant': return 'hsl(60, 100%, 50%)';
    case 'compromised': return 'hsl(30, 100%, 50%)';
    case 'offline': return 'hsl(0, 100%, 50%)';
    default: return 'hsl(120, 100%, 50%)';
  }
};

export const HackerMap: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<ClassifiedNode | null>(null);
  const [scanMode, setScanMode] = useState<boolean>(false);
  const [filteredNodes, setFilteredNodes] = useState<ClassifiedNode[]>(CLASSIFIED_NODES);
  const [filterType, setFilterType] = useState<string>('all');
  const [threatFilter, setThreatFilter] = useState<number>(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 400 });

  // Convert lat/lng to SVG coordinates
  const projectCoordinates = (coords: [number, number]): [number, number] => {
    const [lng, lat] = coords;
    // Simple equirectangular projection
    const x = ((lng + 180) / 360) * viewBox.width;
    const y = ((90 - lat) / 180) * viewBox.height;
    return [x, y];
  };

  const startScan = () => {
    setScanMode(true);
    setTimeout(() => setScanMode(false), 3000);
  };

  const filterNodes = (type: string, threat: number) => {
    let filtered = CLASSIFIED_NODES;
    
    if (type !== 'all') {
      filtered = filtered.filter(node => node.type === type);
    }
    
    if (threat > 0) {
      filtered = filtered.filter(node => node.threatLevel >= threat);
    }
    
    setFilteredNodes(filtered);
  };

  const handleTypeFilter = (type: string) => {
    setFilterType(type);
    filterNodes(type, threatFilter);
  };

  const handleThreatFilter = (level: number) => {
    setThreatFilter(level);
    filterNodes(filterType, level);
  };

  useEffect(() => {
    const updateViewBox = () => {
      if (mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect();
        setViewBox({ x: 0, y: 0, width: rect.width, height: rect.height });
      }
    };

    updateViewBox();
    window.addEventListener('resize', updateViewBox);
    return () => window.removeEventListener('resize', updateViewBox);
  }, []);

  return (
    <div className="h-full relative">
      {/* World Map SVG */}
      <div ref={mapRef} className="w-full h-full relative bg-background border border-primary/20 rounded-lg overflow-hidden">
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          className="absolute inset-0"
          style={{ background: 'radial-gradient(circle, hsl(var(--background)), hsl(var(--muted)))' }}
        >
          {/* World continents outline */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Grid lines for coordinate reference */}
          {Array.from({ length: 13 }, (_, i) => (
            <line
              key={`lat-${i}`}
              x1={0}
              y1={(i * viewBox.height) / 12}
              x2={viewBox.width}
              y2={(i * viewBox.height) / 12}
              stroke="hsl(var(--primary))"
              strokeOpacity={0.1}
              strokeWidth={0.5}
            />
          ))}
          {Array.from({ length: 25 }, (_, i) => (
            <line
              key={`lng-${i}`}
              x1={(i * viewBox.width) / 24}
              y1={0}
              x2={(i * viewBox.width) / 24}
              y2={viewBox.height}
              stroke="hsl(var(--primary))"
              strokeOpacity={0.1}
              strokeWidth={0.5}
            />
          ))}

          {/* Render classified nodes */}
          {filteredNodes.map((node) => {
            const [x, y] = projectCoordinates(node.coordinates);
            const IconComponent = getNodeIcon(node.type);
            const threatColor = getThreatColor(node.threatLevel);
            
            return (
              <g key={node.id}>
                {/* Threat level circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={8 + node.threatLevel * 2}
                  fill={threatColor}
                  fillOpacity={0.2}
                  stroke={threatColor}
                  strokeWidth={1}
                  strokeOpacity={0.6}
                  filter="url(#glow)"
                  className="animate-pulse cursor-pointer"
                  onClick={() => setSelectedNode(node)}
                />
                
                {/* Node marker */}
                <circle
                  cx={x}
                  cy={y}
                  r={4}
                  fill={threatColor}
                  stroke="hsl(var(--background))"
                  strokeWidth={1}
                  className="cursor-pointer hover:r-6 transition-all"
                  onClick={() => setSelectedNode(node)}
                />
                
                {/* Node label for high-threat targets */}
                {node.threatLevel >= 4 && (
                  <text
                    x={x}
                    y={y - 15}
                    textAnchor="middle"
                    className="text-xs font-mono fill-primary pointer-events-none"
                    style={{ fontSize: '8px' }}
                  >
                    {node.name.split(' ')[0]}
                  </text>
                )}
              </g>
            );
          })}

          {/* Scan line animation */}
          {scanMode && (
            <line
              x1={0}
              y1={viewBox.height / 2}
              x2={viewBox.width}
              y2={viewBox.height / 2}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeOpacity={0.8}
              className="animate-pulse"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`0,${-viewBox.height};0,${viewBox.height}`}
                dur="3s"
                repeatCount="indefinite"
              />
            </line>
          )}
        </svg>

        {/* Scan Overlay */}
        {scanMode && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-4 text-primary font-mono text-sm animate-pulse bg-background/80 p-2 rounded border border-primary/30">
              SCANNING {filteredNodes.length} CLASSIFIED NODES...
            </div>
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="absolute top-4 left-4 space-y-2 z-10">
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
        
        {/* Filter Controls */}
        <div className="space-y-1">
          <div className="text-xs text-primary font-mono bg-background/80 p-1 rounded border border-primary/30">
            FILTER BY TYPE:
          </div>
          <div className="flex flex-wrap gap-1">
            {['all', 'military', 'intelligence', 'nuclear', 'hacker', 'criminal'].map(type => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                className="text-xs bg-background/80 border-primary/30"
                onClick={() => handleTypeFilter(type)}
              >
                {type.toUpperCase()}
              </Button>
            ))}
          </div>
          
          <div className="text-xs text-primary font-mono bg-background/80 p-1 rounded border border-primary/30">
            MIN THREAT LEVEL:
          </div>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4, 5].map(level => (
              <Button
                key={level}
                variant={threatFilter === level ? "default" : "outline"}
                size="sm"
                className="text-xs bg-background/80 border-primary/30"
                onClick={() => handleThreatFilter(level)}
              >
                {level === 0 ? 'ALL' : level}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Node Info Panel */}
      {selectedNode && (
        <Card className="absolute top-4 right-4 w-80 bg-background/95 backdrop-blur border-primary/30 z-10">
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
            
            {selectedNode.coverName && (
              <div className="text-sm font-mono text-muted-foreground mb-2">
                Cover: {selectedNode.coverName}
              </div>
            )}
            
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
              
              {selectedNode.operationalSince && (
                <div className="flex justify-between">
                  <span>Operational:</span>
                  <span className="text-xs">{selectedNode.operationalSince}</span>
                </div>
              )}
              
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
      <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur border border-primary/30 rounded p-2 z-10">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="text-primary">
            CLASSIFIED NODE TRACKER - {filteredNodes.length}/{CLASSIFIED_NODES.length} NODES VISIBLE
          </div>
          <div className="text-muted-foreground">
            GLOBAL SURVEILLANCE NETWORK ACTIVE
          </div>
        </div>
      </div>
    </div>
  );
};