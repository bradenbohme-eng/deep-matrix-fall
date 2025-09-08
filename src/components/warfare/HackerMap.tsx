import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Zap, Eye, Skull, Satellite, Lock, AlertTriangle, Radio, Database, Wifi, Terminal, Search, Activity, Crosshair, ChevronLeft, ChevronRight, Settings } from 'lucide-react';

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

// Thousands of classified nodes with comprehensive global coverage
const generateClassifiedNodes = (): ClassifiedNode[] => {
  const nodes: ClassifiedNode[] = [];
  
  // Core high-value targets (existing critical infrastructure)
  const coreTargets = [
    // US Military & Intelligence
    { id: 'us_001', name: 'NORAD Command Center', type: 'military' as const, coordinates: [38.8339, -104.8607] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'North American Aerospace Defense Command - Cheyenne Mountain Complex', lastActivity: '2025-01-15T08:45:22Z', operationalSince: '1966' },
    { id: 'us_002', name: 'NSA Data Center Utah', type: 'intelligence' as const, coordinates: [40.4259, -111.9073] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Utah Data Center - Intelligence Community Comprehensive National Cybersecurity Initiative Data Center', lastActivity: '2025-01-15T09:12:15Z' },
    { id: 'us_003', name: 'Pentagon Network Core', type: 'military' as const, coordinates: [38.8719, -77.0562] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'US Department of Defense - MILNET Operations', lastActivity: '2025-01-15T09:15:44Z' },
    { id: 'us_004', name: 'CIA Langley HQ', type: 'intelligence' as const, coordinates: [38.9516, -77.1461] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Central Intelligence Agency Headquarters - George Bush Center for Intelligence', lastActivity: '2025-01-15T08:33:12Z' },
    { id: 'us_005', name: 'NSA Fort Meade', type: 'intelligence' as const, coordinates: [39.1080, -76.7713] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'National Security Agency - SIGINT Operations Center', lastActivity: '2025-01-15T09:21:33Z' },
    { id: 'us_006', name: 'Wright-Patterson AFB', type: 'military' as const, coordinates: [39.8031, -84.0488] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Air Force Research Laboratory - Advanced Aerospace Programs', lastActivity: '2025-01-15T07:45:18Z' },
    { id: 'us_007', name: 'Area 51 Nevada Test Site', type: 'military' as const, coordinates: [37.2431, -115.8086] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Groom Lake - Classified Aircraft Testing Facility', lastActivity: '2025-01-14T23:12:44Z', coverName: 'Homey Airport' },
    { id: 'us_008', name: 'Los Alamos National Lab', type: 'nuclear' as const, coordinates: [35.8881, -106.2978] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Nuclear Weapons Research and Development', lastActivity: '2025-01-15T06:22:15Z' },

    // International targets
    { id: 'uk_001', name: 'GCHQ Cheltenham', type: 'intelligence' as const, coordinates: [51.8987, -2.1358] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Government Communications Headquarters - ELINT Operations', lastActivity: '2025-01-15T09:45:12Z' },
    { id: 'uk_002', name: 'MI6 Vauxhall Cross', type: 'intelligence' as const, coordinates: [51.4872, -0.1247] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Secret Intelligence Service Headquarters', lastActivity: '2025-01-15T08:15:33Z' },
    { id: 'uk_003', name: 'Menwith Hill Station', type: 'surveillance' as const, coordinates: [54.0100, -1.6856] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'RAF Menwith Hill - ECHELON Signals Intelligence', lastActivity: '2025-01-15T09:33:15Z' },
    
    { id: 'ru_001', name: 'Kremlin Cyber Division', type: 'government' as const, coordinates: [55.7558, 37.6173] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'State-Sponsored Cyber Operations - High Priority Target', lastActivity: '2025-01-15T08:22:18Z' },
    { id: 'ru_002', name: 'Lubyanka Building', type: 'intelligence' as const, coordinates: [55.7606, 37.6284] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'FSB Headquarters - Federal Security Service', lastActivity: '2025-01-15T07:55:44Z' },
    
    { id: 'cn_001', name: 'MSS Beijing HQ', type: 'intelligence' as const, coordinates: [39.9042, 116.3975] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Ministry of State Security - Chinese Intelligence', lastActivity: '2025-01-15T09:11:25Z' },
    { id: 'cn_002', name: 'PLA Unit 61398', type: 'hacker' as const, coordinates: [31.2304, 121.4737] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Advanced Persistent Threat Group - Cyber Warfare Unit', lastActivity: '2025-01-15T08:44:17Z' },
  ];

  nodes.push(...coreTargets);

  // Generate thousands of additional nodes globally
  const regions = [
    { name: 'North America', bounds: [[25, -180], [75, -50]], density: 800 },
    { name: 'Europe', bounds: [[35, -15], [70, 45]], density: 600 },
    { name: 'Asia', bounds: [[10, 60], [55, 180]], density: 1200 },
    { name: 'South America', bounds: [[-60, -85], [15, -35]], density: 400 },
    { name: 'Africa', bounds: [[-35, -20], [40, 50]], density: 300 },
    { name: 'Oceania', bounds: [[-50, 110], [0, 180]], density: 150 },
  ];

  const nodeTypes: Array<ClassifiedNode['type']> = [
    'military', 'intelligence', 'criminal', 'hacker', 'government', 
    'corporate', 'satellite', 'research', 'nuclear', 'surveillance'
  ];

  const statuses: Array<ClassifiedNode['status']> = ['active', 'dormant', 'compromised', 'offline'];
  const classifications: Array<ClassifiedNode['classification']> = ['TOP SECRET', 'SECRET', 'CONFIDENTIAL', 'RESTRICTED', 'UNCLASSIFIED'];

  let nodeId = 1000;

  regions.forEach(region => {
    const [[minLat, minLon], [maxLat, maxLon]] = region.bounds;
    
    for (let i = 0; i < region.density; i++) {
      const lat = minLat + Math.random() * (maxLat - minLat);
      const lon = minLon + Math.random() * (maxLon - minLon);
      const type = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const classification = classifications[Math.floor(Math.random() * classifications.length)];
      const threatLevel = Math.ceil(Math.random() * 5) as 1 | 2 | 3 | 4 | 5;
      
      const prefixes = {
        military: ['Fort', 'Base', 'Station', 'Camp', 'AFB'],
        intelligence: ['Facility', 'Center', 'Station', 'Hub', 'Complex'],
        criminal: ['Cell', 'Network', 'Group', 'Syndicate', 'Cartel'],
        hacker: ['Node', 'Collective', 'Team', 'Unit', 'Group'],
        government: ['Ministry', 'Department', 'Bureau', 'Agency', 'Office'],
        corporate: ['Datacenter', 'Campus', 'HQ', 'Research', 'Labs'],
        satellite: ['Uplink', 'Station', 'Ground', 'Facility', 'Array'],
        research: ['Laboratory', 'Institute', 'Center', 'Facility', 'Complex'],
        nuclear: ['Plant', 'Facility', 'Complex', 'Reactor', 'Storage'],
        surveillance: ['Station', 'Array', 'Center', 'Post', 'Facility']
      };
      
      const prefix = prefixes[type][Math.floor(Math.random() * prefixes[type].length)];
      const codename = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      nodes.push({
        id: `${type}_${nodeId++}`,
        name: `${prefix} ${codename}`,
        type,
        coordinates: [lat, lon],
        threatLevel,
        status,
        classification,
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} facility - ${region.name} operations`,
        lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        operationalSince: `${Math.floor(Math.random() * 50) + 1970}`,
        coverName: Math.random() > 0.7 ? `Cover: ${Math.random().toString(36).substring(2, 10)}` : undefined
      });
    }
  });

  return nodes;
};

const CLASSIFIED_NODES = generateClassifiedNodes();

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

// Projection functions for converting lat/lon to SVG coordinates
const projectToSVG = (lat: number, lon: number, width: number = 1000, height: number = 500) => {
  // Simple equirectangular projection
  const x = ((lon + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
};

// Enhanced penetration testing tools
interface PenTestTool {
  name: string;
  command: string;
  description: string;
  category: 'reconnaissance' | 'scanning' | 'exploitation' | 'post-exploitation' | 'wireless';
  dangerous: boolean;
}

const PENTEST_TOOLS: PenTestTool[] = [
  // Reconnaissance
  { name: 'Nmap Network Scanner', command: 'nmap -sS -A -O target', description: 'Advanced network discovery and security auditing', category: 'reconnaissance', dangerous: false },
  { name: 'Masscan Port Scanner', command: 'masscan -p1-65535 --rate=1000 target', description: 'High-speed Internet port scanner', category: 'reconnaissance', dangerous: false },
  { name: 'Shodan Search', command: 'shodan search "Server: Apache"', description: 'Search engine for Internet-connected devices', category: 'reconnaissance', dangerous: false },
  { name: 'TheHarvester', command: 'theharvester -d domain.com -b google', description: 'Gather emails, subdomains, hosts, employee names', category: 'reconnaissance', dangerous: false },
  
  // Scanning & Enumeration
  { name: 'Nikto Web Scanner', command: 'nikto -h http://target', description: 'Web server scanner for vulnerabilities', category: 'scanning', dangerous: false },
  { name: 'SQLMap SQL Injection', command: 'sqlmap -u "http://target/page?id=1" --dbs', description: 'Automated SQL injection and database takeover tool', category: 'scanning', dangerous: true },
  { name: 'Burp Suite Scanner', command: 'burpsuite --scanner-mode', description: 'Web application security testing platform', category: 'scanning', dangerous: false },
  
  // Exploitation
  { name: 'Metasploit Framework', command: 'msfconsole -r exploit.rc', description: 'Penetration testing framework for exploitation', category: 'exploitation', dangerous: true },
  { name: 'Social Engineer Toolkit', command: 'setoolkit', description: 'Advanced social engineering attacks', category: 'exploitation', dangerous: true },
  
  // Post Exploitation
  { name: 'Mimikatz Credential Dump', command: 'mimikatz "sekurlsa::logonpasswords"', description: 'Extract plaintext passwords, hash, PIN code and kerberos tickets', category: 'post-exploitation', dangerous: true },
  { name: 'Empire PowerShell', command: 'powershell-empire', description: 'PowerShell post-exploitation agent', category: 'post-exploitation', dangerous: true },
  
  // Wireless
  { name: 'Aircrack-ng WPA Crack', command: 'aircrack-ng -a2 -b target_bssid -w wordlist.txt capture.cap', description: 'WiFi network security auditing', category: 'wireless', dangerous: true },
  { name: 'Kismet Wireless Sniffer', command: 'kismet -c wlan0', description: 'Wireless network detector and sniffer', category: 'wireless', dangerous: false },
];

export const HackerMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedNode, setSelectedNode] = useState<ClassifiedNode | null>(null);
  const [scanMode, setScanMode] = useState<boolean>(false);
  const [filteredNodes, setFilteredNodes] = useState<ClassifiedNode[]>(CLASSIFIED_NODES.slice(0, 100));
  const [filterType, setFilterType] = useState<string>('all');
  const [threatFilter, setThreatFilter] = useState<number>(0);
  const [showAllNodes, setShowAllNodes] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<PenTestTool | null>(null);
  const [scanResults, setScanResults] = useState<string[]>([]);
  const [showControlPanel, setShowControlPanel] = useState<boolean>(true);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState<boolean>(true);
  const [metasploitableVMs, setMetasploitableVMs] = useState([
    { id: 'vm1', ip: '192.168.1.100', status: 'online', services: ['SSH', 'HTTP', 'FTP', 'Telnet'] },
    { id: 'vm2', ip: '192.168.1.101', status: 'online', services: ['HTTP', 'MySQL', 'Samba'] },
    { id: 'vm3', ip: '192.168.1.102', status: 'online', services: ['VNC', 'PostgreSQL', 'IRC'] },
  ]);

  const executePenTest = (tool: PenTestTool) => {
    if (!activeTool) {
      setActiveTool(tool);
      setScanResults([]);
      
      // Simulate tool execution with realistic output
      const simulateExecution = () => {
        const results: string[] = [];
        
        switch (tool.name) {
          case 'Nmap Network Scanner':
            results.push('[+] Starting Nmap scan...');
            results.push('[+] Discovered 5 hosts up on network');
            results.push('[+] PORT     STATE    SERVICE     VERSION');
            results.push('[+] 22/tcp   open     ssh         OpenSSH 7.4');
            results.push('[+] 80/tcp   open     http        Apache 2.4.6');
            results.push('[+] 443/tcp  open     https       Apache 2.4.6');
            results.push('[+] 3306/tcp open     mysql       MySQL 5.7.34');
            results.push('[!] Potential vulnerabilities detected');
            break;
            
          case 'SQLMap SQL Injection':
            results.push('[+] Testing SQL injection on target...');
            results.push('[+] Testing GET parameter "id"');
            results.push('[!] Parameter "id" is vulnerable to SQL injection');
            results.push('[+] Database: MySQL 5.7.34');
            results.push('[+] Available databases: [3]');
            results.push('[+] information_schema, mysql, webapp_db');
            results.push('[CRITICAL] Full database access achieved');
            break;
            
          case 'Metasploit Framework':
            results.push('[+] Loading Metasploit Framework...');
            results.push('[+] Searching for exploits...');
            results.push('[+] Found 15 matching exploits');
            results.push('[+] exploit/linux/http/apache_mod_cgi_bash_env_exec');
            results.push('[+] Setting target to 192.168.1.100...');
            results.push('[+] Exploit completed successfully');
            results.push('[+] Meterpreter session 1 opened');
            break;
            
          default:
            results.push(`[+] Executing ${tool.name}...`);
            results.push('[+] Tool execution completed');
            results.push('[+] Results saved to /tmp/scan_results');
        }
        
        // Add results progressively
        let index = 0;
        const addResult = () => {
          if (index < results.length) {
            setScanResults(prev => [...prev, results[index]]);
            index++;
            setTimeout(addResult, 500 + Math.random() * 1000);
          } else {
            setTimeout(() => setActiveTool(null), 2000);
          }
        };
        addResult();
      };
      
      setTimeout(simulateExecution, 1000);
    }
  };

  const filterNodes = (type: string, threat: number, showAll: boolean) => {
    let nodes = showAll ? CLASSIFIED_NODES : CLASSIFIED_NODES.slice(0, 100);
    
    if (type !== 'all') {
      nodes = nodes.filter(node => node.type === type);
    }
    
    if (threat > 0) {
      nodes = nodes.filter(node => node.threatLevel >= threat);
    }
    
    setFilteredNodes(nodes);
  };

  const handleTypeFilter = (type: string) => {
    setFilterType(type);
    filterNodes(type, threatFilter, showAllNodes);
  };

  const handleThreatFilter = (level: number) => {
    setThreatFilter(level);
    filterNodes(filterType, level, showAllNodes);
  };

  const handleShowAllNodes = () => {
    const newShowAll = !showAllNodes;
    setShowAllNodes(newShowAll);
    filterNodes(filterType, threatFilter, newShowAll);
  };

  const initializeMap = (token: string) => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = token;
    
    // Initialize map with dark OpenStreetMap style
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: [
              'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm'
          }
        ]
      },
      center: [0, 20],
      zoom: 2,
      pitch: 0,
      bearing: 0
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add nodes as markers when map loads
    map.current.on('load', () => {
      addNodesToMap();
    });

    // Disable scroll zoom for better UX
    map.current.scrollZoom.disable();
  };

  const addNodesToMap = () => {
    if (!map.current) return;

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.hacker-node-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add filtered nodes as markers
    filteredNodes.forEach((node) => {
      const color = getThreatColor(node.threatLevel);
      
      // Create custom marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'hacker-node-marker';
      markerElement.style.cssText = `
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: ${color};
        border: 2px solid white;
        box-shadow: 0 0 10px ${color};
        cursor: pointer;
        position: relative;
      `;

      // Add pulsing animation for active nodes
      if (node.status === 'active') {
        markerElement.style.animation = 'pulse 2s infinite';
      }

      // Create marker and add click event
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([node.coordinates[1], node.coordinates[0]])
        .addTo(map.current!);

      markerElement.addEventListener('click', () => {
        setSelectedNode(node);
      });

      // Add popup for high-threat nodes
      if (node.threatLevel >= 4) {
        const popup = new mapboxgl.Popup({ offset: 15, closeButton: false })
          .setLngLat([node.coordinates[1], node.coordinates[0]])
          .setHTML(`
            <div style="color: white; background: rgba(0,0,0,0.8); padding: 8px; border-radius: 4px; font-size: 10px; font-family: monospace;">
              <strong>${node.name}</strong><br/>
              <span style="color: ${color};">Threat Level: ${node.threatLevel}/5</span><br/>
              <span style="color: ${getStatusColor(node.status)};">${node.status.toUpperCase()}</span>
            </div>
          `);

        markerElement.addEventListener('mouseenter', () => popup.addTo(map.current!));
        markerElement.addEventListener('mouseleave', () => popup.remove());
      }
    });
  };

  useEffect(() => {
    if (mapboxToken && !map.current) {
      initializeMap(mapboxToken);
    }
  }, [mapboxToken]);

  useEffect(() => {
    if (map.current) {
      addNodesToMap();
    }
  }, [filteredNodes]);

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      setShowTokenInput(false);
      initializeMap(mapboxToken);
    }
  };

  return (
    <div className="h-full relative">
      {/* Mapbox Token Input Modal */}
      {showTokenInput && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md mx-4">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-bold text-primary">Mapbox Access Required</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Enter your Mapbox public token to load the real world map with classified node locations.
                </p>
                <p className="text-xs text-yellow-400 mt-2">
                  Get your free token at: <strong>mapbox.com → Account → Tokens</strong>
                </p>
              </div>
              
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="pk.eyJ1IjoieW91ci11c2VybmFtZSI..."
                  value={mapboxToken}
                  onChange={(e) => setMapboxToken(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-primary/30 rounded text-sm"
                />
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleTokenSubmit}
                    className="flex-1"
                    disabled={!mapboxToken.trim()}
                  >
                    Load Map
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowTokenInput(false)}
                  >
                    Skip (Demo Mode)
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Mapbox Container */}
      <div ref={mapContainer} className="w-full h-full" style={{ background: '#1a1a1a' }} />
      
      {/* Panel Toggle Button */}
      <Button
        onClick={() => setShowControlPanel(!showControlPanel)}
        className="absolute top-4 left-4 z-40 w-10 h-10 p-0"
        variant="outline"
      >
        {showControlPanel ? <ChevronLeft className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
      </Button>

      {/* Enhanced Control Panel */}
      {showControlPanel && (
        <div className="absolute top-4 left-16 space-y-2 z-30 max-h-[80vh] overflow-y-auto w-80">
        <Card className="p-3 bg-background/90 backdrop-blur border-primary/30">
          <div className="space-y-2">
            <div className="text-xs text-primary font-mono font-bold">GLOBAL SURVEILLANCE NETWORK</div>
            <div className="text-xs text-muted-foreground">
              Tracking {CLASSIFIED_NODES.length.toLocaleString()} classified nodes worldwide
            </div>
            
            <Button 
              onClick={handleShowAllNodes}
              variant={showAllNodes ? "default" : "outline"}
              size="sm"
              className="w-full"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showAllNodes ? `Showing All (${filteredNodes.length})` : 'Show All Nodes'}
            </Button>
          </div>
        </Card>

        {/* Filter Controls */}
        <Card className="p-3 bg-background/90 backdrop-blur border-primary/30">
          <div className="space-y-2">
            <div className="text-xs text-primary font-mono">FILTER CONTROLS</div>
            <div className="grid grid-cols-2 gap-1">
              {['all', 'military', 'intelligence', 'nuclear', 'hacker', 'criminal'].map(type => (
                <Button
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => handleTypeFilter(type)}
                >
                  {type.toUpperCase()}
                </Button>
              ))}
            </div>
            
            <div className="text-xs text-primary font-mono mt-2">THREAT LEVEL</div>
            <div className="flex gap-1">
              {[0, 3, 4, 5].map(level => (
                <Button
                  key={level}
                  variant={threatFilter === level ? "default" : "outline"}
                  size="sm"
                  className="text-xs flex-1"
                  onClick={() => handleThreatFilter(level)}
                >
                  {level === 0 ? 'ALL' : `${level}+`}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Penetration Testing Tools */}
        <Card className="p-3 bg-background/90 backdrop-blur border-primary/30">
          <div className="space-y-2">
            <div className="text-xs text-primary font-mono flex items-center">
              <Terminal className="w-3 h-3 mr-1" />
              PENTEST ARSENAL
            </div>
            <div className="text-xs text-yellow-400 font-mono">
              ⚠️ METASPLOITABLE VMS ACTIVE
            </div>
            
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {PENTEST_TOOLS.slice(0, 6).map((tool, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className={`w-full text-xs justify-start h-8 ${tool.dangerous ? 'border-red-500/30 text-red-400' : 'border-green-500/30 text-green-400'}`}
                  onClick={() => executePenTest(tool)}
                  disabled={!!activeTool}
                >
                  <Terminal className="w-3 h-3 mr-1" />
                  {tool.name}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Tool Execution Output */}
        {(activeTool || scanResults.length > 0) && (
          <Card className="p-3 bg-background/90 backdrop-blur border-primary/30">
            <div className="space-y-2">
              <div className="text-xs text-primary font-mono">
                {activeTool ? `EXECUTING: ${activeTool.name}` : 'LAST SCAN RESULTS'}
              </div>
              <div className="bg-black/80 p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                {scanResults.map((result, idx) => (
                  <div 
                    key={idx} 
                    className={`${
                      result.includes('[!]') ? 'text-yellow-400' :
                      result.includes('[CRITICAL]') ? 'text-red-400' :
                      result.includes('[+]') ? 'text-green-400' :
                      'text-gray-300'
                    }`}
                  >
                    {result}
                  </div>
                ))}
                {activeTool && (
                  <div className="text-green-400 animate-pulse">
                    {'> '}█
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Metasploitable VMs Status */}
        <Card className="p-3 bg-background/90 backdrop-blur border-primary/30">
          <div className="space-y-2">
            <div className="text-xs text-primary font-mono">SAFE TESTING ENVIRONMENT</div>
            {metasploitableVMs.map(vm => (
              <div key={vm.id} className="flex items-center justify-between text-xs">
                <span className="font-mono">{vm.ip}</span>
                <Badge variant="outline" className="text-green-400 border-green-500">
                  {vm.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
        </div>
      )}

      {/* Node Details Popup */}
      {selectedNode && (
        <div className="absolute top-4 right-4 z-40 max-w-sm">
          <Card className="p-4 bg-background/90 backdrop-blur border-primary/30">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-bold text-primary">{selectedNode.name}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedNode(null)}
                  className="w-6 h-6 p-0"
                >
                  ×
                </Button>
              </div>
              
              <Badge 
                variant="destructive" 
                className={`text-xs ${
                  selectedNode.classification === 'TOP SECRET' ? 'bg-red-900/50 border-red-500' :
                  selectedNode.classification === 'SECRET' ? 'bg-orange-900/50 border-orange-500' :
                  selectedNode.classification === 'CONFIDENTIAL' ? 'bg-yellow-900/50 border-yellow-500' :
                  'bg-gray-900/50 border-gray-500'
                }`}
              >
                {selectedNode.classification}
              </Badge>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="text-primary capitalize">{selectedNode.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Threat Level:</span>
                  <span style={{ color: getThreatColor(selectedNode.threatLevel) }}>
                    {selectedNode.threatLevel}/5
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span style={{ color: getStatusColor(selectedNode.status) }}>
                    {selectedNode.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Coordinates:</span>
                  <span className="font-mono text-primary">
                    {selectedNode.coordinates[0].toFixed(4)}, {selectedNode.coordinates[1].toFixed(4)}
                  </span>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">{selectedNode.description}</p>
              
              <div className="text-xs text-muted-foreground mt-2">
                Last Activity: {new Date(selectedNode.lastActivity).toLocaleString()}
              </div>
              
              {selectedNode.operationalSince && (
                <div className="text-xs text-muted-foreground">
                  Operational Since: {selectedNode.operationalSince}
                </div>
              )}
              
              {selectedNode.coverName && (
                <div className="text-xs text-yellow-400 mt-1">
                  {selectedNode.coverName}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default HackerMap;