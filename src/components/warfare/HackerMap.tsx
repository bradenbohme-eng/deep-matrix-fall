import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Zap, Eye, Skull, Satellite, Lock, AlertTriangle, Radio, Database, Wifi } from 'lucide-react';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
  { id: 'us_011', name: 'Offutt Air Force Base', type: 'military', coordinates: [-95.9144, 41.1181], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'Strategic Air Command - Looking Glass Operations', lastActivity: '2025-01-15T08:44:12Z' },
  { id: 'us_012', name: 'DARPA Headquarters', type: 'research', coordinates: [-77.0297, 38.8895], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'Defense Advanced Research Projects Agency - Emerging Technologies', lastActivity: '2025-01-15T07:22:18Z' },

  // International Intelligence & Military
  { id: 'uk_001', name: 'GCHQ Cheltenham', type: 'intelligence', coordinates: [-2.1358, 51.8987], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'Government Communications Headquarters - ELINT Operations', lastActivity: '2025-01-15T09:45:12Z' },
  { id: 'uk_002', name: 'MI6 Vauxhall Cross', type: 'intelligence', coordinates: [-0.1247, 51.4872], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'Secret Intelligence Service Headquarters', lastActivity: '2025-01-15T08:15:33Z' },
  { id: 'uk_003', name: 'Porton Down', type: 'research', coordinates: [-1.6589, 51.1356], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'Defence Science and Technology Laboratory - Chemical/Biological Research', lastActivity: '2025-01-15T06:44:22Z' },
  { id: 'uk_004', name: 'Menwith Hill Station', type: 'surveillance', coordinates: [-1.6856, 54.0100], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'RAF Menwith Hill - ECHELON Signals Intelligence', lastActivity: '2025-01-15T09:33:15Z' },
  
  { id: 'ru_001', name: 'Kremlin Cyber Division', type: 'government', coordinates: [37.6173, 55.7558], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'State-Sponsored Cyber Operations - High Priority Target', lastActivity: '2025-01-15T08:22:18Z' },
  { id: 'ru_002', name: 'Lubyanka Building', type: 'intelligence', coordinates: [37.6284, 55.7606], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'FSB Headquarters - Federal Security Service', lastActivity: '2025-01-15T07:55:44Z' },
  { id: 'ru_003', name: 'Plesetsk Cosmodrome', type: 'military', coordinates: [40.5772, 62.9575], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'Military Satellite Launch Facility', lastActivity: '2025-01-15T05:12:33Z' },
  { id: 'ru_004', name: 'Semipalatinsk Test Site', type: 'nuclear', coordinates: [78.0661, 49.9486], threatLevel: 3, status: 'dormant', classification: 'CONFIDENTIAL', description: 'Former Nuclear Test Site - Surveillance Required', lastActivity: '2025-01-12T14:22:11Z' },
  
  { id: 'cn_001', name: 'MSS Beijing HQ', type: 'intelligence', coordinates: [116.3975, 39.9042], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'Ministry of State Security - Chinese Intelligence', lastActivity: '2025-01-15T09:11:25Z' },
  { id: 'cn_002', name: 'PLA Unit 61398', type: 'hacker', coordinates: [121.4737, 31.2304], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'Advanced Persistent Threat Group - Cyber Warfare Unit', lastActivity: '2025-01-15T08:44:17Z' },
  { id: 'cn_003', name: 'Jiuquan Satellite Center', type: 'military', coordinates: [100.2581, 40.9581], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'Space Launch Center - Military Satellite Operations', lastActivity: '2025-01-15T06:33:42Z' },
  { id: 'cn_004', name: 'Lop Nur Test Site', type: 'nuclear', coordinates: [90.2072, 41.7442], threatLevel: 4, status: 'dormant', classification: 'SECRET', description: 'Nuclear Weapons Test Site - Monitoring Station', lastActivity: '2025-01-13T11:15:33Z' },

  { id: 'il_001', name: 'Mossad Headquarters', type: 'intelligence', coordinates: [34.8516, 32.0853], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'Institute for Intelligence and Special Operations', lastActivity: '2025-01-15T08:22:55Z' },
  { id: 'il_002', name: 'Unit 8200 Base', type: 'intelligence', coordinates: [35.0461, 31.8969], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'IDF Intelligence Corps - SIGINT Unit', lastActivity: '2025-01-15T09:14:22Z' },
  { id: 'il_003', name: 'Dimona Nuclear Reactor', type: 'nuclear', coordinates: [35.1442, 31.0036], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'Shimon Peres Negev Nuclear Research Center', lastActivity: '2025-01-15T07:33:18Z' },

  // Corporate & Tech Giants
  { id: 'tech_001', name: 'Silicon Valley Hub', type: 'corporate', coordinates: [-122.0839, 37.4220], threatLevel: 3, status: 'active', classification: 'CONFIDENTIAL', description: 'Tech Conglomerate Data Nexus - High Value Target', lastActivity: '2025-01-15T07:33:44Z' },
  { id: 'tech_002', name: 'Google Data Center', type: 'corporate', coordinates: [-121.9886, 37.4419], threatLevel: 3, status: 'active', classification: 'CONFIDENTIAL', description: 'Mountain View Campus - Advanced AI Research', lastActivity: '2025-01-15T09:22:11Z' },
  { id: 'tech_003', name: 'Apple Park', type: 'corporate', coordinates: [-122.0097, 37.3349], threatLevel: 2, status: 'active', classification: 'RESTRICTED', description: 'Cupertino Headquarters - Secure Communications Development', lastActivity: '2025-01-15T08:15:33Z' },
  { id: 'tech_004', name: 'Microsoft Redmond', type: 'corporate', coordinates: [-122.1378, 47.6397], threatLevel: 3, status: 'active', classification: 'CONFIDENTIAL', description: 'Cloud Infrastructure Operations - Government Contracts', lastActivity: '2025-01-15T07:44:25Z' },
  { id: 'tech_005', name: 'Amazon AWS East', type: 'corporate', coordinates: [-77.4875, 39.0458], threatLevel: 3, status: 'active', classification: 'CONFIDENTIAL', description: 'Northern Virginia Data Centers - CIA Cloud Contract', lastActivity: '2025-01-15T09:55:12Z' },
  { id: 'tech_006', name: 'Meta Menlo Park', type: 'corporate', coordinates: [-122.1817, 37.4848], threatLevel: 2, status: 'active', classification: 'RESTRICTED', description: 'Social Media Intelligence Gathering', lastActivity: '2025-01-15T08:33:47Z' },

  // Criminal & Hacker Organizations
  { id: 'hack_001', name: 'Dark Web Exchange Paris', type: 'criminal', coordinates: [2.3522, 48.8566], threatLevel: 4, status: 'dormant', classification: 'SECRET', description: 'Encrypted Communication Hub - Illegal Activities Suspected', lastActivity: '2025-01-14T23:18:07Z' },
  { id: 'hack_002', name: 'Ghost Protocol Tokyo', type: 'hacker', coordinates: [139.6917, 35.6895], threatLevel: 4, status: 'compromised', classification: 'SECRET', description: 'Elite Hacker Collective - Advanced Persistent Threat', lastActivity: '2025-01-15T04:27:33Z' },
  { id: 'hack_003', name: 'Lazarus Group NK', type: 'hacker', coordinates: [125.7625, 39.0392], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'State-Sponsored Cybercrime Organization', lastActivity: '2025-01-15T06:15:22Z' },
  { id: 'hack_004', name: 'Carbanak Operations', type: 'criminal', coordinates: [30.5234, 50.4501], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'Financial Crime Syndicate - Banking Malware', lastActivity: '2025-01-15T02:44:18Z' },
  { id: 'hack_005', name: 'Conti Ransomware Base', type: 'criminal', coordinates: [37.6173, 55.7558], threatLevel: 4, status: 'offline', classification: 'SECRET', description: 'Ransomware-as-a-Service Operation', lastActivity: '2025-01-10T15:22:33Z' },

  // Satellite & Communication Networks
  { id: 'sat_001', name: 'Schriever Space Force Base', type: 'satellite', coordinates: [-104.5272, 38.8047], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'GPS Satellite Operations - Space Force Delta 8', lastActivity: '2025-01-15T09:33:15Z' },
  { id: 'sat_002', name: 'Vandenberg Space Force Base', type: 'satellite', coordinates: [-120.5908, 34.7420], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'Military Satellite Launch Operations', lastActivity: '2025-01-15T07:22:44Z' },
  { id: 'sat_003', name: 'Kourou Space Center', type: 'satellite', coordinates: [-52.6681, 5.2361], threatLevel: 3, status: 'active', classification: 'CONFIDENTIAL', description: 'European Space Agency - Ariane Launch Complex', lastActivity: '2025-01-15T05:11:33Z' },
  { id: 'sat_004', name: 'Baikonur Cosmodrome', type: 'satellite', coordinates: [63.3050, 45.9650], threatLevel: 3, status: 'active', classification: 'CONFIDENTIAL', description: 'Russian Space Launch Facility', lastActivity: '2025-01-15T04:55:22Z' },

  // Additional Global Intelligence Assets
  { id: 'int_001', name: 'Five Eyes Station Australia', type: 'surveillance', coordinates: [133.7751, -25.2744], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'Pine Gap Joint Defence Facility - ECHELON Node', lastActivity: '2025-01-15T08:45:17Z' },
  { id: 'int_002', name: 'DGSE Paris HQ', type: 'intelligence', coordinates: [2.4014, 48.8566], threatLevel: 3, status: 'active', classification: 'CONFIDENTIAL', description: 'Direction Générale de la Sécurité Extérieure', lastActivity: '2025-01-15T07:22:33Z' },
  { id: 'int_003', name: 'BND Pullach', type: 'intelligence', coordinates: [11.5228, 48.0597], threatLevel: 3, status: 'active', classification: 'CONFIDENTIAL', description: 'Bundesnachrichtendienst - German Intelligence', lastActivity: '2025-01-15T06:44:55Z' },
  { id: 'int_004', name: 'CSIS Ottawa', type: 'intelligence', coordinates: [-75.6919, 45.4215], threatLevel: 2, status: 'active', classification: 'RESTRICTED', description: 'Canadian Security Intelligence Service', lastActivity: '2025-01-15T08:11:22Z' },

  // Underground Facilities
  { id: 'ug_001', name: 'Mount Weather Emergency Operations Center', type: 'government', coordinates: [-77.8892, 39.0581], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'FEMA Continuity of Government Facility', lastActivity: '2025-01-15T09:15:44Z' },
  { id: 'ug_002', name: 'Raven Rock Mountain Complex', type: 'military', coordinates: [-77.2461, 39.7342], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'Pentagon Alternate Command Center - Site R', lastActivity: '2025-01-15T08:33:22Z' },
  { id: 'ug_003', name: 'STRATCOM Bunker', type: 'military', coordinates: [-95.9144, 41.1181], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'Strategic Command Underground Operations', lastActivity: '2025-01-15T07:55:18Z' },

  // Research & Development Facilities
  { id: 'rd_001', name: 'CERN Large Hadron Collider', type: 'research', coordinates: [6.0522, 46.2333], threatLevel: 2, status: 'active', classification: 'UNCLASSIFIED', description: 'European Organization for Nuclear Research', lastActivity: '2025-01-15T09:22:15Z' },
  { id: 'rd_002', name: 'Fermilab', type: 'research', coordinates: [-88.2434, 41.8314], threatLevel: 2, status: 'active', classification: 'RESTRICTED', description: 'High Energy Physics Research - Particle Accelerator', lastActivity: '2025-01-15T06:33:44Z' },
  { id: 'rd_003', name: 'SLAC National Accelerator', type: 'research', coordinates: [-122.2058, 37.4169], threatLevel: 2, status: 'active', classification: 'RESTRICTED', description: 'Stanford Linear Accelerator Center', lastActivity: '2025-01-15T05:22:11Z' },

  // Additional Military Bases Worldwide
  { id: 'mil_001', name: 'Ramstein Air Base', type: 'military', coordinates: [7.6003, 49.4369], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'US Air Forces Europe Headquarters', lastActivity: '2025-01-15T08:44:33Z' },
  { id: 'mil_002', name: 'Diego Garcia', type: 'military', coordinates: [72.4511, -7.3064], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'Naval Support Facility - Indian Ocean Strategic Base', lastActivity: '2025-01-15T07:15:22Z' },
  { id: 'mil_003', name: 'Guantanamo Bay', type: 'military', coordinates: [-75.1500, 19.9000], threatLevel: 3, status: 'active', classification: 'CONFIDENTIAL', description: 'Naval Base Guantanamo Bay - Detention Operations', lastActivity: '2025-01-15T06:22:44Z' },
  { id: 'mil_004', name: 'Thule Air Base', type: 'military', coordinates: [-68.7031, 76.5311], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'Ballistic Missile Early Warning System', lastActivity: '2025-01-15T05:33:18Z' },

  // Communication & Surveillance Networks
  { id: 'com_001', name: 'Sugar Grove Station', type: 'surveillance', coordinates: [-79.2847, 38.5181], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'Naval Security Group - SIGINT Collection', lastActivity: '2025-01-15T09:11:55Z' },
  { id: 'com_002', name: 'Buckley Space Force Base', type: 'surveillance', coordinates: [-104.7561, 39.7019], threatLevel: 3, status: 'active', classification: 'CONFIDENTIAL', description: 'Space-Based Missile Warning System', lastActivity: '2025-01-15T08:22:33Z' },
  { id: 'com_003', name: 'Bad Aibling Station', type: 'surveillance', coordinates: [12.0103, 47.8642], threatLevel: 3, status: 'dormant', classification: 'CONFIDENTIAL', description: 'Former NSA Listening Post - Germany', lastActivity: '2025-01-10T14:33:22Z' },

  // Cyber Operations Centers
  { id: 'cyb_001', name: 'US Cyber Command', type: 'military', coordinates: [-76.7713, 39.1080], threatLevel: 5, status: 'active', classification: 'TOP SECRET', description: 'Unified Combatant Command for Cyberspace Operations', lastActivity: '2025-01-15T09:44:17Z' },
  { id: 'cyb_002', name: 'NCSC Cheltenham', type: 'intelligence', coordinates: [-2.1358, 51.8987], threatLevel: 4, status: 'active', classification: 'SECRET', description: 'National Cyber Security Centre - UK', lastActivity: '2025-01-15T08:15:44Z' },
  { id: 'cyb_003', name: 'BSI Cyber Center', type: 'government', coordinates: [7.1003, 50.7753], threatLevel: 3, status: 'active', classification: 'CONFIDENTIAL', description: 'Bundesamt für Sicherheit in der Informationstechnik', lastActivity: '2025-01-15T07:33:25Z' },

];

const getNodeIcon = (type: string, threatLevel: number) => {
  const iconColor = getThreatColor(threatLevel);
  const IconComponent = (() => {
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
  })();

  return L.divIcon({
    html: `
      <div class="hacker-node-marker" style="
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: radial-gradient(circle, ${iconColor}, transparent);
        border: 2px solid ${iconColor};
        box-shadow: 0 0 15px ${iconColor}80;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse-${threatLevel} 2s infinite;
      ">
        <div style="color: ${iconColor}; font-size: 10px;">●</div>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const getThreatColor = (level: number) => {
  switch (level) {
    case 1: return '#00ff41';
    case 2: return '#7fff00';
    case 3: return '#ffff00';
    case 4: return '#ff8800';
    case 5: return '#ff0000';
    default: return '#00ff41';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return '#00ff41';
    case 'dormant': return '#ffff00';
    case 'compromised': return '#ff8800';
    case 'offline': return '#ff0000';
    default: return '#00ff41';
  }
};

export const HackerMap: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<ClassifiedNode | null>(null);
  const [scanMode, setScanMode] = useState<boolean>(false);
  const [filteredNodes, setFilteredNodes] = useState<ClassifiedNode[]>(CLASSIFIED_NODES);
  const [filterType, setFilterType] = useState<string>('all');
  const [threatFilter, setThreatFilter] = useState<number>(0);

  // Add CSS animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse-1 {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes pulse-2 {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.15); opacity: 0.7; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes pulse-3 {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.6; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes pulse-4 {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.25); opacity: 0.5; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes pulse-5 {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.3); opacity: 0.4; }
        100% { transform: scale(1); opacity: 1; }
      }
      .leaflet-container {
        background: #0a0a0a;
        filter: contrast(1.2) brightness(0.8) hue-rotate(90deg);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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

  return (
    <div className="h-full relative">
      {/* Map Container */}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        worldCopyJump={true}
        maxBounds={[[-90, -180], [90, 180]]}
      >
        {/* Dark tile layer for hacker aesthetic */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />
        
        {/* Render classified nodes */}
        {filteredNodes.map((node) => (
          <Marker
            key={node.id}
            position={node.coordinates}
            icon={getNodeIcon(node.type, node.threatLevel)}
            eventHandlers={{
              click: () => setSelectedNode(node),
            }}
          >
            <Popup className="hacker-popup">
              <div className="bg-background/95 p-2 border border-primary/30 rounded text-xs font-mono">
                <div className="text-primary font-bold mb-1">{node.name}</div>
                <div className="text-muted-foreground">{node.type.toUpperCase()}</div>
                <Badge 
                  variant="outline" 
                  className="text-xs mt-1"
                  style={{ color: getThreatColor(node.threatLevel) }}
                >
                  THREAT LEVEL {node.threatLevel}
                </Badge>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Threat level circles for high-value targets */}
        {filteredNodes
          .filter(node => node.threatLevel >= 4)
          .map((node) => (
            <Circle
              key={`circle-${node.id}`}
              center={node.coordinates}
              radius={50000 * node.threatLevel}
              pathOptions={{
                color: getThreatColor(node.threatLevel),
                weight: 1,
                opacity: 0.3,
                fillOpacity: 0.1,
              }}
            />
          ))}
      </MapContainer>
      
      {/* Scan Overlay */}
      {scanMode && (
        <div className="absolute inset-0 pointer-events-none z-[1000]">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse" />
          <div className="absolute top-1/2 left-0 w-full h-1 bg-primary/60 animate-ping" />
          <div className="absolute top-4 left-4 text-primary font-mono text-sm animate-pulse bg-background/80 p-2 rounded border border-primary/30">
            SCANNING {filteredNodes.length} CLASSIFIED NODES...
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="absolute top-4 left-4 space-y-2 z-[1000]">
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
        <Card className="absolute top-4 right-4 w-80 bg-background/95 backdrop-blur border-primary/30 z-[1000]">
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
      <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur border border-primary/30 rounded p-2 z-[1000]">
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