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
  type: 'military' | 'intelligence' | 'criminal' | 'hacker' | 'government' | 'corporate' | 'satellite' | 'research' | 'nuclear' | 'surveillance' | 
        'airport' | 'black_site' | 'cartel' | 'cyber_warfare' | 'data_center' | 'submarine' | 'space_command' | 'bioweapon' | 'quantum_lab' | 
        'dark_web' | 'arms_dealer' | 'terror_cell' | 'money_laundering' | 'human_trafficking' | 'drug_lab' | 'cyber_mercenary' | 'crypto_exchange' |
        'weapon_storage' | 'communications' | 'radar_site' | 'missile_base' | 'drone_base' | 'prison' | 'embassy' | 'consulate' | 'border_control';
  coordinates: [number, number];
  threatLevel: 1 | 2 | 3 | 4 | 5 | 6;
  status: 'active' | 'dormant' | 'compromised' | 'offline' | 'ghost' | 'dark' | 'burned';
  classification: 'TOP SECRET' | 'SECRET' | 'CONFIDENTIAL' | 'RESTRICTED' | 'UNCLASSIFIED' | 'COSMIC' | 'SHADOW' | 'BURN NOTICE';
  description: string;
  lastActivity: string;
  operationalSince?: string;
  coverName?: string;
  aliases?: string[];
  knownAssociates?: string[];
  operationalBudget?: string;
  riskLevel?: 'MINIMAL' | 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME' | 'CATASTROPHIC';
}

// Thousands of classified nodes with comprehensive global coverage
const generateClassifiedNodes = (): ClassifiedNode[] => {
  const nodes: ClassifiedNode[] = [];
  
  // Core high-value targets - MASSIVELY EXPANDED
  const coreTargets = [
    // US Military & Intelligence - Extended
    { id: 'us_001', name: 'NORAD Command Center', type: 'military' as const, coordinates: [38.8339, -104.8607] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'North American Aerospace Defense Command - Cheyenne Mountain Complex', lastActivity: '2025-01-15T08:45:22Z', operationalSince: '1966', riskLevel: 'CATASTROPHIC' as const },
    { id: 'us_002', name: 'NSA Data Center Utah', type: 'data_center' as const, coordinates: [40.4259, -111.9073] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'Utah Data Center - Intelligence Community Comprehensive National Cybersecurity Initiative Data Center', lastActivity: '2025-01-15T09:12:15Z' },
    { id: 'us_003', name: 'Pentagon Network Core', type: 'military' as const, coordinates: [38.8719, -77.0562] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'US Department of Defense - MILNET Operations', lastActivity: '2025-01-15T09:15:44Z' },
    { id: 'us_004', name: 'CIA Langley HQ', type: 'intelligence' as const, coordinates: [38.9516, -77.1461] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'Central Intelligence Agency Headquarters - George Bush Center for Intelligence', lastActivity: '2025-01-15T08:33:12Z' },
    { id: 'us_005', name: 'NSA Fort Meade', type: 'cyber_warfare' as const, coordinates: [39.1080, -76.7713] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'National Security Agency - SIGINT Operations Center', lastActivity: '2025-01-15T09:21:33Z' },
    { id: 'us_006', name: 'Wright-Patterson AFB', type: 'military' as const, coordinates: [39.8031, -84.0488] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Air Force Research Laboratory - Advanced Aerospace Programs', lastActivity: '2025-01-15T07:45:18Z' },
    { id: 'us_007', name: 'Area 51 Nevada Test Site', type: 'black_site' as const, coordinates: [37.2431, -115.8086] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'SHADOW' as const, description: 'Groom Lake - Classified Aircraft Testing Facility', lastActivity: '2025-01-14T23:12:44Z', coverName: 'Homey Airport', riskLevel: 'EXTREME' as const },
    { id: 'us_008', name: 'Los Alamos National Lab', type: 'nuclear' as const, coordinates: [35.8881, -106.2978] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'Nuclear Weapons Research and Development', lastActivity: '2025-01-15T06:22:15Z' },
    { id: 'us_009', name: 'Dulce Underground Base', type: 'black_site' as const, coordinates: [36.9396, -106.9983] as [number, number], threatLevel: 6 as const, status: 'ghost' as const, classification: 'SHADOW' as const, description: 'Alleged Deep Underground Military Base - Bioweapons Research', lastActivity: '2025-01-10T03:22:15Z', coverName: 'Geological Survey Station' },
    { id: 'us_010', name: 'Cyber Command Fort Gordon', type: 'cyber_warfare' as const, coordinates: [33.4734, -82.1374] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'US Army Cyber Command - Offensive Cyber Operations', lastActivity: '2025-01-15T10:05:33Z' },
    { id: 'us_011', name: 'Schriever Space Force Base', type: 'space_command' as const, coordinates: [38.8050, -104.5311] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Space Force - Satellite Control Network', lastActivity: '2025-01-15T09:44:12Z' },
    { id: 'us_012', name: 'Pine Gap Australia', type: 'intelligence' as const, coordinates: [-23.7987, 133.7378] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'Joint Defence Facility - ECHELON Ground Station', lastActivity: '2025-01-15T11:22:44Z' },

    // Major International Airports - Air Traffic Control
    { id: 'air_001', name: 'Hartsfield-Jackson Atlanta', type: 'airport' as const, coordinates: [33.6407, -84.4277] as [number, number], threatLevel: 3 as const, status: 'active' as const, classification: 'CONFIDENTIAL' as const, description: 'Busiest Airport Worldwide - Critical Infrastructure', lastActivity: '2025-01-15T12:15:22Z' },
    { id: 'air_002', name: 'Beijing Capital International', type: 'airport' as const, coordinates: [40.0799, 116.6031] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Major Hub - State Security Monitoring', lastActivity: '2025-01-15T10:33:15Z' },
    { id: 'air_003', name: 'London Heathrow', type: 'airport' as const, coordinates: [51.4700, -0.4543] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'European Hub - MI5 Operations Center', lastActivity: '2025-01-15T09:22:11Z' },
    { id: 'air_004', name: 'Dubai International', type: 'airport' as const, coordinates: [25.2532, 55.3657] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Middle East Hub - Intelligence Gateway', lastActivity: '2025-01-15T08:44:33Z' },
    { id: 'air_005', name: 'Los Angeles International', type: 'airport' as const, coordinates: [33.9425, -118.4081] as [number, number], threatLevel: 3 as const, status: 'active' as const, classification: 'CONFIDENTIAL' as const, description: 'West Coast Hub - DHS Operations', lastActivity: '2025-01-15T11:15:44Z' },

    // Criminal Organizations & Cartels
    { id: 'crim_001', name: 'Sinaloa Cartel HQ', type: 'cartel' as const, coordinates: [25.7943, -108.9734] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Major Drug Trafficking Organization - Armed Resistance', lastActivity: '2025-01-14T22:33:15Z', riskLevel: 'HIGH' as const },
    { id: 'crim_002', name: 'Yakuza Headquarters Tokyo', type: 'criminal' as const, coordinates: [35.6762, 139.6503] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Organized Crime Syndicate - Financial Operations', lastActivity: '2025-01-15T07:22:44Z' },
    { id: 'crim_003', name: 'Ndrangheta Calabria Base', type: 'criminal' as const, coordinates: [38.2500, 16.2000] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Italian Mafia - European Drug Trade', lastActivity: '2025-01-15T06:15:33Z' },
    { id: 'crim_004', name: 'Russian Bratva Moscow', type: 'criminal' as const, coordinates: [55.7558, 37.6176] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Russian Organized Crime - Cyber Operations', lastActivity: '2025-01-15T08:44:12Z' },
    { id: 'crim_005', name: 'Triads Hong Kong', type: 'criminal' as const, coordinates: [22.3193, 114.1694] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Chinese Organized Crime - Money Laundering', lastActivity: '2025-01-15T09:33:25Z' },

    // Dark Web & Cyber Criminal Operations  
    { id: 'dark_001', name: 'Silk Road 4.0 Server Farm', type: 'dark_web' as const, coordinates: [52.3676, 4.9041] as [number, number], threatLevel: 5 as const, status: 'dark' as const, classification: 'TOP SECRET' as const, description: 'Major Dark Marketplace - Hosted in Amsterdam', lastActivity: '2025-01-15T04:22:15Z' },
    { id: 'dark_002', name: 'REvil Ransomware HQ', type: 'cyber_mercenary' as const, coordinates: [55.7558, 37.6173] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Ransomware-as-a-Service Operation', lastActivity: '2025-01-15T02:15:44Z' },
    { id: 'dark_003', name: 'Lazarus Group DPRK', type: 'hacker' as const, coordinates: [39.0392, 125.7625] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'State-Sponsored Hacking Group - North Korea', lastActivity: '2025-01-15T01:33:22Z' },

    // International Intelligence Networks
    { id: 'int_001', name: 'GCHQ Cheltenham', type: 'intelligence' as const, coordinates: [51.8987, -2.1358] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'Government Communications Headquarters - ELINT Operations', lastActivity: '2025-01-15T09:45:12Z' },
    { id: 'int_002', name: 'MI6 Vauxhall Cross', type: 'intelligence' as const, coordinates: [51.4872, -0.1247] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Secret Intelligence Service Headquarters', lastActivity: '2025-01-15T08:15:33Z' },
    { id: 'int_003', name: 'Mossad HQ Tel Aviv', type: 'intelligence' as const, coordinates: [32.0853, 34.7818] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'Institute for Intelligence and Special Operations', lastActivity: '2025-01-15T10:22:44Z' },
    { id: 'int_004', name: 'FSB Lubyanka', type: 'intelligence' as const, coordinates: [55.7606, 37.6284] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'Federal Security Service - Russian Intelligence', lastActivity: '2025-01-15T07:55:44Z' },
    { id: 'int_005', name: 'DGSE Paris', type: 'intelligence' as const, coordinates: [48.8566, 2.3522] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Direction Générale de la Sécurité Extérieure - French Intelligence', lastActivity: '2025-01-15T09:11:25Z' },
    { id: 'int_006', name: 'BND Pullach', type: 'intelligence' as const, coordinates: [48.0596, 11.5355] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Bundesnachrichtendienst - German Intelligence', lastActivity: '2025-01-15T08:33:17Z' },

    // Black Sites & Shadow Operations
    { id: 'black_001', name: 'Guantanamo Bay Prison', type: 'prison' as const, coordinates: [19.9027, -75.0951] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Detention Facility - Enhanced Interrogation', lastActivity: '2025-01-15T07:44:33Z' },
    { id: 'black_002', name: 'Salt Pit Afghanistan', type: 'black_site' as const, coordinates: [34.5553, 69.2075] as [number, number], threatLevel: 5 as const, status: 'burned' as const, classification: 'SHADOW' as const, description: 'Former CIA Black Site - Extraordinary Rendition', lastActivity: '2023-08-15T12:00:00Z' },
    { id: 'black_003', name: 'Stare Kiejkuty Poland', type: 'black_site' as const, coordinates: [53.8633, 21.4026] as [number, number], threatLevel: 4 as const, status: 'offline' as const, classification: 'SHADOW' as const, description: 'Former CIA Detention Site - Northern Poland', lastActivity: '2021-12-15T08:22:15Z' },
    { id: 'black_004', name: 'Camp Eagle Bosnia', type: 'black_site' as const, coordinates: [44.2619, 17.9073] as [number, number], threatLevel: 4 as const, status: 'ghost' as const, classification: 'SHADOW' as const, description: 'Alleged CIA Detention Facility - Tuzla Air Base', lastActivity: '2020-05-10T14:33:22Z' },

    // Cyber Warfare & Data Centers
    { id: 'cyber_001', name: 'Amazon AWS US-East-1', type: 'data_center' as const, coordinates: [38.9517, -77.4481] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'CONFIDENTIAL' as const, description: 'Major Cloud Infrastructure - US Government Contracts', lastActivity: '2025-01-15T12:00:00Z' },
    { id: 'cyber_002', name: 'Google Data Center Iowa', type: 'data_center' as const, coordinates: [41.2619, -95.8608] as [number, number], threatLevel: 3 as const, status: 'active' as const, classification: 'CONFIDENTIAL' as const, description: 'Critical Internet Infrastructure', lastActivity: '2025-01-15T11:45:22Z' },
    { id: 'cyber_003', name: 'Microsoft Azure East US', type: 'data_center' as const, coordinates: [38.7846, -78.1849] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'CONFIDENTIAL' as const, description: 'Cloud Infrastructure - Government Services', lastActivity: '2025-01-15T11:55:44Z' },
    { id: 'cyber_004', name: 'Tencent Data Center Shenzhen', type: 'data_center' as const, coordinates: [22.5431, 114.0579] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Chinese Tech Giant - State Surveillance Integration', lastActivity: '2025-01-15T10:22:15Z' },

    // Submarine & Naval Operations
    { id: 'sub_001', name: 'USS Connecticut SSN-22', type: 'submarine' as const, coordinates: [25.2048, 153.5789] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Seawolf-class Nuclear Attack Submarine - Pacific Patrol', lastActivity: '2025-01-15T06:22:44Z' },
    { id: 'sub_002', name: 'HMS Astute S119', type: 'submarine' as const, coordinates: [55.8642, -4.2518] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Royal Navy Nuclear Attack Submarine', lastActivity: '2025-01-15T08:15:33Z' },
    { id: 'sub_003', name: 'Russian Borei K-549', type: 'submarine' as const, coordinates: [69.0633, 33.4123] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'Strategic Nuclear Ballistic Missile Submarine', lastActivity: '2025-01-15T04:44:22Z' },

    // Weapon Storage & Arms Dealers
    { id: 'arms_001', name: 'Anniston Army Depot', type: 'weapon_storage' as const, coordinates: [33.6587, -85.8316] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Chemical Weapons Storage & Disposal', lastActivity: '2025-01-15T09:33:15Z' },
    { id: 'arms_002', name: 'Viktor Bout Network', type: 'arms_dealer' as const, coordinates: [55.7558, 37.6173] as [number, number], threatLevel: 4 as const, status: 'compromised' as const, classification: 'SECRET' as const, description: 'International Arms Trafficking - Merchant of Death Network', lastActivity: '2025-01-10T15:22:44Z' },
    { id: 'arms_003', name: 'Khashoggi Arms Pipeline', type: 'arms_dealer' as const, coordinates: [24.7136, 46.6753] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Middle East Weapons Distribution Network', lastActivity: '2025-01-15T06:44:33Z' },

    // Cryptocurrency & Money Laundering
    { id: 'crypto_001', name: 'Binance Malta HQ', type: 'crypto_exchange' as const, coordinates: [35.9375, 14.3754] as [number, number], threatLevel: 3 as const, status: 'active' as const, classification: 'CONFIDENTIAL' as const, description: 'Major Cryptocurrency Exchange - AML Concerns', lastActivity: '2025-01-15T11:22:15Z' },
    { id: 'crypto_002', name: 'Tornado Cash Servers', type: 'money_laundering' as const, coordinates: [52.3676, 4.9041] as [number, number], threatLevel: 4 as const, status: 'compromised' as const, classification: 'SECRET' as const, description: 'Cryptocurrency Mixing Service - Sanctioned', lastActivity: '2025-01-12T08:15:22Z' },
    { id: 'crypto_003', name: 'Hydra Marketplace', type: 'dark_web' as const, coordinates: [55.7558, 37.6173] as [number, number], threatLevel: 5 as const, status: 'offline' as const, classification: 'TOP SECRET' as const, description: 'Russian Dark Web Marketplace - Takedown', lastActivity: '2022-04-05T12:00:00Z' },

    // Bioweapon & Research Facilities
    { id: 'bio_001', name: 'Wuhan Institute of Virology', type: 'bioweapon' as const, coordinates: [30.5394, 114.3614] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'High-Security Biological Research - BSL-4 Laboratory', lastActivity: '2025-01-15T09:22:44Z', riskLevel: 'CATASTROPHIC' as const },
    { id: 'bio_002', name: 'USAMRIID Fort Detrick', type: 'bioweapon' as const, coordinates: [39.4355, -77.4528] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'US Army Medical Research - Biological Defense', lastActivity: '2025-01-15T08:44:15Z', riskLevel: 'EXTREME' as const },
    { id: 'bio_003', name: 'Porton Down UK', type: 'bioweapon' as const, coordinates: [51.1325, -1.6356] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'Defence Science & Technology Laboratory', lastActivity: '2025-01-15T10:15:33Z' },
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
    'military', 'intelligence', 'criminal', 'hacker', 'government', 'corporate', 'satellite', 'research', 'nuclear', 'surveillance',
    'airport', 'black_site', 'cartel', 'cyber_warfare', 'data_center', 'submarine', 'space_command', 'bioweapon', 'quantum_lab',
    'dark_web', 'arms_dealer', 'terror_cell', 'money_laundering', 'human_trafficking', 'drug_lab', 'cyber_mercenary', 'crypto_exchange',
    'weapon_storage', 'communications', 'radar_site', 'missile_base', 'drone_base', 'prison', 'embassy', 'consulate', 'border_control'
  ];

  const statuses: Array<ClassifiedNode['status']> = ['active', 'dormant', 'compromised', 'offline', 'ghost', 'dark', 'burned'];
  const classifications: Array<ClassifiedNode['classification']> = ['TOP SECRET', 'SECRET', 'CONFIDENTIAL', 'RESTRICTED', 'UNCLASSIFIED', 'COSMIC', 'SHADOW', 'BURN NOTICE'];

  let nodeId = 1000;

  regions.forEach(region => {
    const [[minLat, minLon], [maxLat, maxLon]] = region.bounds;
    
    for (let i = 0; i < region.density; i++) {
      const lat = minLat + Math.random() * (maxLat - minLat);
      const lon = minLon + Math.random() * (maxLon - minLon);
      const type = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const classification = classifications[Math.floor(Math.random() * classifications.length)];
      const threatLevel = Math.ceil(Math.random() * 6) as 1 | 2 | 3 | 4 | 5 | 6;
      
      const prefixes = {
        military: ['Fort', 'Base', 'Station', 'Camp', 'AFB', 'Barracks', 'Arsenal', 'Command'],
        intelligence: ['Facility', 'Center', 'Station', 'Hub', 'Complex', 'Outpost', 'Safe House'],
        criminal: ['Cell', 'Network', 'Group', 'Syndicate', 'Cartel', 'Gang', 'Crew', 'Family'],
        hacker: ['Node', 'Collective', 'Team', 'Unit', 'Group', 'Cell', 'Cluster', 'Network'],
        government: ['Ministry', 'Department', 'Bureau', 'Agency', 'Office', 'Division', 'Authority'],
        corporate: ['Datacenter', 'Campus', 'HQ', 'Research', 'Labs', 'Office', 'Complex', 'Tower'],
        satellite: ['Uplink', 'Station', 'Ground', 'Facility', 'Array', 'Dish', 'Antenna', 'Terminal'],
        research: ['Laboratory', 'Institute', 'Center', 'Facility', 'Complex', 'Campus', 'Unit', 'Division'],
        nuclear: ['Plant', 'Facility', 'Complex', 'Reactor', 'Storage', 'Bunker', 'Vault', 'Site'],
        surveillance: ['Station', 'Array', 'Center', 'Post', 'Facility', 'Tower', 'Outpost', 'Watch'],
        airport: ['Airport', 'Airfield', 'Terminal', 'Hub', 'Base', 'Strip', 'Port', 'Field'],
        black_site: ['Site', 'Facility', 'Complex', 'Location', 'Station', 'Camp', 'Detention', 'Bunker'],
        cartel: ['Cartel', 'Syndicate', 'Organization', 'Network', 'Operations', 'Territory', 'Compound'],
        cyber_warfare: ['Command', 'Center', 'Unit', 'Division', 'Operations', 'Facility', 'Hub', 'Network'],
        data_center: ['Datacenter', 'Server Farm', 'Cloud Hub', 'Computing Center', 'Data Facility'],
        submarine: ['USS', 'HMS', 'Sub', 'Vessel', 'Boat', 'Platform', 'Unit', 'Fleet'],
        space_command: ['Space Base', 'Control', 'Command', 'Station', 'Facility', 'Operations'],
        bioweapon: ['Lab', 'Institute', 'Facility', 'Research', 'Center', 'Complex', 'Unit'],
        quantum_lab: ['Quantum Lab', 'Q-Center', 'Facility', 'Research', 'Complex', 'Institute'],
        dark_web: ['Server', 'Node', 'Hub', 'Network', 'Farm', 'Cluster', 'Operations'],
        arms_dealer: ['Network', 'Operations', 'Supply Chain', 'Distribution', 'Warehouse'],
        terror_cell: ['Cell', 'Network', 'Group', 'Operations', 'Safe House', 'Camp'],
        money_laundering: ['Operations', 'Network', 'Shell Company', 'Front', 'Exchange'],
        human_trafficking: ['Network', 'Operations', 'Route', 'Safe House', 'Transit Point'],
        drug_lab: ['Lab', 'Facility', 'Operations', 'Processing', 'Manufacturing', 'Warehouse'],
        cyber_mercenary: ['Group', 'Collective', 'Operations', 'Network', 'Unit', 'Team'],
        crypto_exchange: ['Exchange', 'Platform', 'Hub', 'Center', 'Operations', 'Facility'],
        weapon_storage: ['Depot', 'Arsenal', 'Storage', 'Warehouse', 'Facility', 'Cache'],
        communications: ['Tower', 'Station', 'Hub', 'Center', 'Relay', 'Array', 'Network'],
        radar_site: ['Radar', 'Station', 'Array', 'Facility', 'Installation', 'Site'],
        missile_base: ['Base', 'Facility', 'Launch Site', 'Installation', 'Complex', 'Station'],
        drone_base: ['Base', 'Operations', 'Control', 'Launch Site', 'Facility', 'Hub'],
        prison: ['Prison', 'Facility', 'Detention', 'Correctional', 'Penitentiary', 'Camp'],
        embassy: ['Embassy', 'Consulate', 'Mission', 'Diplomatic Post', 'Cultural Center'],
        consulate: ['Consulate', 'Office', 'Mission', 'Diplomatic Post', 'Center'],
        border_control: ['Border Station', 'Checkpoint', 'Control Point', 'Crossing', 'Facility']
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
    case 'airport': return Activity;
    case 'black_site': return Eye;
    case 'cartel': return Skull;
    case 'cyber_warfare': return Terminal;
    case 'data_center': return Database;
    case 'submarine': return Activity;
    case 'space_command': return Satellite;
    case 'bioweapon': return AlertTriangle;
    case 'quantum_lab': return Zap;
    case 'dark_web': return Terminal;
    case 'arms_dealer': return Crosshair;
    case 'terror_cell': return Skull;
    case 'money_laundering': return Search;
    case 'human_trafficking': return AlertTriangle;
    case 'drug_lab': return AlertTriangle;
    case 'cyber_mercenary': return Zap;
    case 'crypto_exchange': return Database;
    case 'weapon_storage': return Shield;
    case 'communications': return Radio;
    case 'radar_site': return Activity;
    case 'missile_base': return Crosshair;
    case 'drone_base': return Activity;
    case 'prison': return Lock;
    case 'embassy': return Lock;
    case 'consulate': return Lock;
    case 'border_control': return Shield;
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
    case 6: return 'hsl(300, 100%, 50%)'; // Magenta - Critical/Cosmic
    default: return 'hsl(120, 100%, 50%)';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'hsl(120, 100%, 50%)';
    case 'dormant': return 'hsl(60, 100%, 50%)';
    case 'compromised': return 'hsl(30, 100%, 50%)';
    case 'offline': return 'hsl(0, 100%, 50%)';
    case 'ghost': return 'hsl(270, 100%, 50%)';
    case 'dark': return 'hsl(0, 0%, 20%)';
    case 'burned': return 'hsl(15, 100%, 40%)';
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
  const [mapboxToken, setMapboxToken] = useState<string>('pk.eyJ1IjoiY3JpbmtEZGFydCIsImEiOiJjbWZhbXJkeTgxZDloMmxvZjB1ZjQxczBzIn0.XanOxg-xA88pNFAvy5K5kA');
  const [showTokenInput, setShowTokenInput] = useState<boolean>(false);
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
    
    // Initialize map with Mapbox dark style
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [0, 20],
      zoom: 2,
      projection: 'globe' as any,
      pitch: 0,
      bearing: 0,
      antialias: true,
      renderWorldCopies: false
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
        showCompass: true,
        showZoom: true
      }),
      'top-right'
    );

    // Enable all map interactions
    map.current.dragPan.enable();
    map.current.scrollZoom.enable();
    map.current.boxZoom.enable();
    map.current.dragRotate.enable();
    map.current.keyboard.enable();
    map.current.doubleClickZoom.enable();
    map.current.touchZoomRotate.enable();

    // Add fog effect when style loads
    map.current.on('style.load', () => {
      if (!map.current) return;
      
      map.current.setFog({
        'range': [-1, 2],
        'color': '#1a1a1a',
        'horizon-blend': 0.3,
        'high-color': '#333333',
      });
    });

    // Add nodes as markers when map loads
    map.current.on('load', () => {
      addNodesToMap();
    });
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
    // Auto-initialize map with provided token
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
    // Not needed since token is hardcoded
    setShowTokenInput(false);
  };

  return (
    <div className="h-full relative">
      {/* Map loads automatically with hardcoded token */}

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