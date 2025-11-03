import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Zap, Eye, Skull, Satellite, Lock, AlertTriangle, Radio, Database, Wifi, Terminal, Search, Activity, Crosshair, ChevronLeft, ChevronRight, Settings, Globe, Map, Layers, ChevronDown, ChevronUp, X } from 'lucide-react';
import NetworkTrafficOverlay from './NetworkTrafficOverlay';
import NetworkStatsPanel from './NetworkStatsPanel';
import HackingOpsPanel from './HackingOpsPanel';
import AlertsPanel from './AlertsPanel';

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

// Comprehensive classified nodes with global coverage
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
    { id: 'us_006', name: 'Area 51 Nevada Test Site', type: 'black_site' as const, coordinates: [37.2431, -115.8086] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'SHADOW' as const, description: 'Groom Lake - Classified Aircraft Testing Facility', lastActivity: '2025-01-14T23:12:44Z', coverName: 'Homey Airport', riskLevel: 'EXTREME' as const },
    { id: 'us_007', name: 'Los Alamos National Lab', type: 'nuclear' as const, coordinates: [35.8881, -106.2978] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'Nuclear Weapons Research and Development', lastActivity: '2025-01-15T06:22:15Z' },
    { id: 'us_008', name: 'Dulce Underground Base', type: 'black_site' as const, coordinates: [36.9396, -106.9983] as [number, number], threatLevel: 6 as const, status: 'ghost' as const, classification: 'SHADOW' as const, description: 'Alleged Deep Underground Military Base - Bioweapons Research', lastActivity: '2025-01-10T03:22:15Z', coverName: 'Geological Survey Station' },
    { id: 'us_009', name: 'Cyber Command Fort Gordon', type: 'cyber_warfare' as const, coordinates: [33.4734, -82.1374] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'US Army Cyber Command - Offensive Cyber Operations', lastActivity: '2025-01-15T10:05:33Z' },
    { id: 'us_010', name: 'Schriever Space Force Base', type: 'space_command' as const, coordinates: [38.8050, -104.5311] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Space Force - Satellite Control Network', lastActivity: '2025-01-15T09:44:12Z' },
    { id: 'us_011', name: 'Pine Gap Australia', type: 'intelligence' as const, coordinates: [-23.7987, 133.7378] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'Joint Defence Facility - ECHELON Ground Station', lastActivity: '2025-01-15T11:22:44Z' },

    // Major International Airports - Air Traffic Control
    { id: 'air_001', name: 'Hartsfield-Jackson Atlanta', type: 'airport' as const, coordinates: [33.6407, -84.4277] as [number, number], threatLevel: 3 as const, status: 'active' as const, classification: 'CONFIDENTIAL' as const, description: 'Busiest Airport Worldwide - Critical Infrastructure', lastActivity: '2025-01-15T12:15:22Z' },
    { id: 'air_002', name: 'Beijing Capital International', type: 'airport' as const, coordinates: [40.0799, 116.6031] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Major Hub - State Security Monitoring', lastActivity: '2025-01-15T10:33:15Z' },
    { id: 'air_003', name: 'London Heathrow', type: 'airport' as const, coordinates: [51.4700, -0.4543] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'European Hub - MI5 Operations Center', lastActivity: '2025-01-15T09:22:11Z' },
    { id: 'air_004', name: 'Dubai International', type: 'airport' as const, coordinates: [25.2532, 55.3657] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Middle East Hub - Intelligence Gateway', lastActivity: '2025-01-15T08:44:33Z' },
    { id: 'air_005', name: 'Tokyo Haneda', type: 'airport' as const, coordinates: [35.5494, 139.7798] as [number, number], threatLevel: 3 as const, status: 'active' as const, classification: 'CONFIDENTIAL' as const, description: 'Major Asian Hub - Intelligence Operations', lastActivity: '2025-01-15T11:15:44Z' },
    { id: 'air_006', name: 'Frankfurt Airport', type: 'airport' as const, coordinates: [50.0379, 8.5622] as [number, number], threatLevel: 3 as const, status: 'active' as const, classification: 'CONFIDENTIAL' as const, description: 'European Operations Hub', lastActivity: '2025-01-15T10:22:33Z' },
    { id: 'air_007', name: 'Singapore Changi', type: 'airport' as const, coordinates: [1.3644, 103.9915] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Southeast Asia Intelligence Hub', lastActivity: '2025-01-15T09:44:22Z' },

    // Criminal Organizations & Cartels - EXPANDED
    { id: 'crim_001', name: 'Sinaloa Cartel HQ', type: 'cartel' as const, coordinates: [25.7943, -108.9734] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Major Drug Trafficking Organization - Armed Resistance', lastActivity: '2025-01-14T22:33:15Z', riskLevel: 'HIGH' as const },
    { id: 'crim_002', name: 'CJNG Jalisco Base', type: 'cartel' as const, coordinates: [20.6597, -103.3496] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Jalisco New Generation Cartel - Extreme Violence', lastActivity: '2025-01-15T03:22:44Z', riskLevel: 'EXTREME' as const },
    { id: 'crim_003', name: 'Yakuza Headquarters Tokyo', type: 'criminal' as const, coordinates: [35.6762, 139.6503] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Organized Crime Syndicate - Financial Operations', lastActivity: '2025-01-15T07:22:44Z' },
    { id: 'crim_004', name: 'Ndrangheta Calabria Base', type: 'criminal' as const, coordinates: [38.2500, 16.2000] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Italian Mafia - European Drug Trade', lastActivity: '2025-01-15T06:15:33Z' },
    { id: 'crim_005', name: 'Russian Bratva Moscow', type: 'criminal' as const, coordinates: [55.7558, 37.6176] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Russian Organized Crime - Cyber Operations', lastActivity: '2025-01-15T08:44:12Z' },
    { id: 'crim_006', name: 'MS-13 El Salvador', type: 'criminal' as const, coordinates: [13.7942, -88.8965] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Mara Salvatrucha - International Gang Network', lastActivity: '2025-01-15T05:33:22Z' },
    { id: 'crim_007', name: 'Triads Hong Kong', type: 'criminal' as const, coordinates: [22.3193, 114.1694] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Chinese Organized Crime - Money Laundering', lastActivity: '2025-01-15T09:33:25Z' },

    // Dark Web & Cyber Criminal Operations - EXPANDED
    { id: 'dark_001', name: 'Silk Road 4.0 Server Farm', type: 'dark_web' as const, coordinates: [52.3676, 4.9041] as [number, number], threatLevel: 5 as const, status: 'dark' as const, classification: 'TOP SECRET' as const, description: 'Major Dark Marketplace - Hosted in Amsterdam', lastActivity: '2025-01-15T04:22:15Z' },
    { id: 'dark_002', name: 'REvil Ransomware HQ', type: 'cyber_mercenary' as const, coordinates: [55.7558, 37.6173] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Ransomware-as-a-Service Operation', lastActivity: '2025-01-15T02:15:44Z' },
    { id: 'dark_003', name: 'Lazarus Group DPRK', type: 'hacker' as const, coordinates: [39.0392, 125.7625] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'State-Sponsored Hacking Group - North Korea', lastActivity: '2025-01-15T01:33:22Z' },
    { id: 'dark_004', name: 'APT1 Shanghai Unit', type: 'cyber_warfare' as const, coordinates: [31.2304, 121.4737] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'PLA Unit 61398 - Advanced Persistent Threat', lastActivity: '2025-01-15T08:15:33Z' },
    { id: 'dark_005', name: 'Conti Ransomware Gang', type: 'cyber_mercenary' as const, coordinates: [55.7558, 37.6173] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Professional Ransomware Organization', lastActivity: '2025-01-15T03:44:22Z' },

    // International Intelligence Networks - EXPANDED
    { id: 'int_001', name: 'GCHQ Cheltenham', type: 'intelligence' as const, coordinates: [51.8987, -2.1358] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'Government Communications Headquarters - ELINT Operations', lastActivity: '2025-01-15T09:45:12Z' },
    { id: 'int_002', name: 'MI6 Vauxhall Cross', type: 'intelligence' as const, coordinates: [51.4872, -0.1247] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Secret Intelligence Service Headquarters', lastActivity: '2025-01-15T08:15:33Z' },
    { id: 'int_003', name: 'Mossad HQ Tel Aviv', type: 'intelligence' as const, coordinates: [32.0853, 34.7818] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'Institute for Intelligence and Special Operations', lastActivity: '2025-01-15T10:22:44Z' },
    { id: 'int_004', name: 'FSB Lubyanka', type: 'intelligence' as const, coordinates: [55.7606, 37.6284] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'Federal Security Service - Russian Intelligence', lastActivity: '2025-01-15T07:55:44Z' },
    { id: 'int_005', name: 'DGSE Paris', type: 'intelligence' as const, coordinates: [48.8566, 2.3522] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Direction Générale de la Sécurité Extérieure - French Intelligence', lastActivity: '2025-01-15T09:11:25Z' },
    { id: 'int_006', name: 'BND Pullach', type: 'intelligence' as const, coordinates: [48.0596, 11.5355] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Bundesnachrichtendienst - German Intelligence', lastActivity: '2025-01-15T08:33:17Z' },
    { id: 'int_007', name: 'Unit 8200 Herzliya', type: 'cyber_warfare' as const, coordinates: [32.1624, 34.8442] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'Israeli Intelligence Corps - SIGINT Unit', lastActivity: '2025-01-15T11:22:15Z' },
    { id: 'int_008', name: 'MSS Beijing HQ', type: 'intelligence' as const, coordinates: [39.9042, 116.4074] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'Ministry of State Security - Chinese Intelligence', lastActivity: '2025-01-15T09:33:44Z' },

    // Black Sites & Shadow Operations - EXPANDED
    { id: 'black_001', name: 'Guantanamo Bay Prison', type: 'prison' as const, coordinates: [19.9027, -75.0951] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Detention Facility - Enhanced Interrogation', lastActivity: '2025-01-15T07:44:33Z' },
    { id: 'black_002', name: 'Salt Pit Afghanistan', type: 'black_site' as const, coordinates: [34.5553, 69.2075] as [number, number], threatLevel: 5 as const, status: 'burned' as const, classification: 'SHADOW' as const, description: 'Former CIA Black Site - Extraordinary Rendition', lastActivity: '2023-08-15T12:00:00Z' },
    { id: 'black_003', name: 'Stare Kiejkuty Poland', type: 'black_site' as const, coordinates: [53.8633, 21.4026] as [number, number], threatLevel: 4 as const, status: 'offline' as const, classification: 'SHADOW' as const, description: 'Former CIA Detention Site - Northern Poland', lastActivity: '2021-12-15T08:22:15Z' },
    { id: 'black_004', name: 'Camp Eagle Bosnia', type: 'black_site' as const, coordinates: [44.2619, 17.9073] as [number, number], threatLevel: 4 as const, status: 'ghost' as const, classification: 'SHADOW' as const, description: 'Alleged CIA Detention Facility - Tuzla Air Base', lastActivity: '2020-05-10T14:33:22Z' },
    { id: 'black_005', name: 'Diego Garcia Black Site', type: 'black_site' as const, coordinates: [-7.3101, 72.4116] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'SHADOW' as const, description: 'Indian Ocean Detention Facility', lastActivity: '2025-01-15T04:22:11Z' },

    // Cyber Warfare & Data Centers - EXPANDED
    { id: 'cyber_001', name: 'Amazon AWS US-East-1', type: 'data_center' as const, coordinates: [38.9517, -77.4481] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'CONFIDENTIAL' as const, description: 'Major Cloud Infrastructure - US Government Contracts', lastActivity: '2025-01-15T12:00:00Z' },
    { id: 'cyber_002', name: 'Google Data Center Iowa', type: 'data_center' as const, coordinates: [41.2619, -95.8608] as [number, number], threatLevel: 3 as const, status: 'active' as const, classification: 'CONFIDENTIAL' as const, description: 'Critical Internet Infrastructure', lastActivity: '2025-01-15T11:45:22Z' },
    { id: 'cyber_003', name: 'Microsoft Azure East US', type: 'data_center' as const, coordinates: [38.7846, -78.1849] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'CONFIDENTIAL' as const, description: 'Cloud Infrastructure - Government Services', lastActivity: '2025-01-15T11:55:44Z' },
    { id: 'cyber_004', name: 'Tencent Data Center Shenzhen', type: 'data_center' as const, coordinates: [22.5431, 114.0579] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Chinese Tech Giant - State Surveillance Integration', lastActivity: '2025-01-15T10:22:15Z' },
    { id: 'cyber_005', name: 'Yandex Data Center Moscow', type: 'data_center' as const, coordinates: [55.7558, 37.6173] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Russian Tech Infrastructure - FSB Access', lastActivity: '2025-01-15T08:44:33Z' },

    // Submarine & Naval Operations - EXPANDED
    { id: 'sub_001', name: 'USS Connecticut SSN-22', type: 'submarine' as const, coordinates: [25.2048, 153.5789] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Seawolf-class Nuclear Attack Submarine - Pacific Patrol', lastActivity: '2025-01-15T06:22:44Z' },
    { id: 'sub_002', name: 'HMS Astute S119', type: 'submarine' as const, coordinates: [55.8642, -4.2518] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Royal Navy Nuclear Attack Submarine', lastActivity: '2025-01-15T08:15:33Z' },
    { id: 'sub_003', name: 'Russian Borei K-549', type: 'submarine' as const, coordinates: [69.0633, 33.4123] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'Strategic Nuclear Ballistic Missile Submarine', lastActivity: '2025-01-15T04:44:22Z' },
    { id: 'sub_004', name: 'Chinese Jin-class SSBN', type: 'submarine' as const, coordinates: [18.2208, 109.5122] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'Type 094 Nuclear Ballistic Missile Submarine', lastActivity: '2025-01-15T07:33:15Z' },

    // Bioweapon & Research Facilities - EXPANDED
    { id: 'bio_001', name: 'Wuhan Institute of Virology', type: 'bioweapon' as const, coordinates: [30.5394, 114.3614] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'High-Security Biological Research - BSL-4 Laboratory', lastActivity: '2025-01-15T09:22:44Z', riskLevel: 'CATASTROPHIC' as const },
    { id: 'bio_002', name: 'USAMRIID Fort Detrick', type: 'bioweapon' as const, coordinates: [39.4355, -77.4528] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'US Army Medical Research - Biological Defense', lastActivity: '2025-01-15T08:44:15Z', riskLevel: 'EXTREME' as const },
    { id: 'bio_003', name: 'Porton Down UK', type: 'bioweapon' as const, coordinates: [51.1325, -1.6356] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'Defence Science & Technology Laboratory', lastActivity: '2025-01-15T10:15:33Z' },
    { id: 'bio_004', name: 'VECTOR Institute Russia', type: 'bioweapon' as const, coordinates: [54.8431, 83.1056] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'State Research Center of Virology and Biotechnology', lastActivity: '2025-01-15T06:44:22Z', riskLevel: 'CATASTROPHIC' as const },

    // Space & Satellite Operations - NEW
    { id: 'space_001', name: 'NRO Chantilly HQ', type: 'space_command' as const, coordinates: [38.9517, -77.4269] as [number, number], threatLevel: 6 as const, status: 'active' as const, classification: 'COSMIC' as const, description: 'National Reconnaissance Office - Spy Satellite Control', lastActivity: '2025-01-15T11:22:44Z' },
    { id: 'space_002', name: 'Baikonur Cosmodrome', type: 'space_command' as const, coordinates: [45.9200, 63.3400] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Russian Space Launch Facility - Military Satellites', lastActivity: '2025-01-15T09:15:22Z' },
    { id: 'space_003', name: 'Jiuquan Satellite Center', type: 'space_command' as const, coordinates: [40.9600, 100.2917] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Chinese Space Program - Military Satellites', lastActivity: '2025-01-15T08:33:44Z' },

    // Quantum Computing Labs - NEW
    { id: 'quantum_001', name: 'IBM Quantum Network', type: 'quantum_lab' as const, coordinates: [41.1220, -73.7176] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Advanced Quantum Computing Research - Cryptography Threat', lastActivity: '2025-01-15T10:44:33Z' },
    { id: 'quantum_002', name: 'Google Quantum AI', type: 'quantum_lab' as const, coordinates: [37.4220, -122.0841] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Quantum Supremacy Research - Encryption Breaking', lastActivity: '2025-01-15T11:15:22Z' },
    { id: 'quantum_003', name: 'Chinese Quantum Lab', type: 'quantum_lab' as const, coordinates: [31.8639, 117.2808] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'University of Science and Technology - Quantum Communications', lastActivity: '2025-01-15T09:22:11Z' },

    // Terror Networks - NEW
    { id: 'terror_001', name: 'ISIS Cyber Command', type: 'terror_cell' as const, coordinates: [36.1906, 43.9930] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Islamic State Digital Operations - Propaganda & Recruitment', lastActivity: '2025-01-15T05:22:44Z' },
    { id: 'terror_002', name: 'Al-Qaeda Tech Wing', type: 'terror_cell' as const, coordinates: [24.7136, 46.6753] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Technical Operations Division - Cyber Jihad', lastActivity: '2025-01-15T04:15:33Z' },
    { id: 'terror_003', name: 'Hezbollah Unit 133', type: 'terror_cell' as const, coordinates: [33.8547, 35.8623] as [number, number], threatLevel: 5 as const, status: 'active' as const, classification: 'TOP SECRET' as const, description: 'Electronic Warfare Unit - Iranian Backed', lastActivity: '2025-01-15T07:44:22Z' },

    // Drug Manufacturing - NEW
    { id: 'drug_001', name: 'Golden Triangle Labs', type: 'drug_lab' as const, coordinates: [20.2500, 100.2000] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Methamphetamine Super Labs - Myanmar Border', lastActivity: '2025-01-15T06:33:15Z' },
    { id: 'drug_002', name: 'Colombian Cocaine Labs', type: 'drug_lab' as const, coordinates: [4.0000, -72.0000] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'FARC Territory Manufacturing - High Purity Production', lastActivity: '2025-01-15T08:22:44Z' },
    { id: 'drug_003', name: 'Afghan Opium Processing', type: 'drug_lab' as const, coordinates: [34.5553, 69.2075] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Taliban Controlled Heroin Production', lastActivity: '2025-01-15T05:15:33Z' },

    // Human Trafficking Networks - NEW
    { id: 'traffic_001', name: 'Eastern European Network', type: 'human_trafficking' as const, coordinates: [50.4501, 30.5234] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Ukraine Based Trafficking Operation - Western Routes', lastActivity: '2025-01-15T04:44:22Z' },
    { id: 'traffic_002', name: 'Southeast Asian Ring', type: 'human_trafficking' as const, coordinates: [13.7563, 100.5018] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Bangkok Hub - Child Trafficking Network', lastActivity: '2025-01-15T07:15:44Z' },
    { id: 'traffic_003', name: 'West African Routes', type: 'human_trafficking' as const, coordinates: [6.5244, -3.3792] as [number, number], threatLevel: 4 as const, status: 'active' as const, classification: 'SECRET' as const, description: 'Ghana Transit Hub - European Destination', lastActivity: '2025-01-15T06:22:33Z' }
  ];

  nodes.push(...coreTargets);

  // Generate thousands of additional nodes globally
  const regions = [
    { name: 'North America', center: [45, -100], radius: 25 },
    { name: 'South America', center: [-15, -60], radius: 20 },
    { name: 'Europe', center: [50, 10], radius: 15 },
    { name: 'Africa', center: [0, 20], radius: 25 },
    { name: 'Asia', center: [30, 100], radius: 30 },
    { name: 'Oceania', center: [-25, 140], radius: 15 },
    { name: 'Middle East', center: [30, 45], radius: 10 },
    { name: 'Central Asia', center: [45, 70], radius: 15 }
  ];

  const nodeTypes = [
    'military', 'intelligence', 'criminal', 'hacker', 'government', 'corporate',
    'satellite', 'research', 'nuclear', 'surveillance', 'airport', 'black_site',
    'cartel', 'cyber_warfare', 'data_center', 'submarine', 'space_command',
    'bioweapon', 'quantum_lab', 'dark_web', 'arms_dealer', 'terror_cell',
    'money_laundering', 'human_trafficking', 'drug_lab', 'cyber_mercenary',
    'crypto_exchange', 'weapon_storage', 'communications', 'radar_site',
    'missile_base', 'drone_base', 'prison', 'embassy', 'consulate', 'border_control'
  ];

  // Generate additional nodes for each region
  regions.forEach((region, regionIndex) => {
    const nodesPerRegion = 150 + Math.floor(Math.random() * 100); // 150-250 nodes per region
    
    for (let i = 0; i < nodesPerRegion; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * region.radius;
      const lat = region.center[0] + (distance * Math.cos(angle));
      const lon = region.center[1] + (distance * Math.sin(angle));
      
      // Ensure coordinates are valid
      const validLat = Math.max(-85, Math.min(85, lat));
      const validLon = ((lon + 180) % 360) - 180;
      
      const type = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
      const threatLevel = Math.floor(Math.random() * 6) + 1;
      const statuses = ['active', 'dormant', 'compromised', 'offline', 'ghost', 'dark'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const classifications = ['TOP SECRET', 'SECRET', 'CONFIDENTIAL', 'RESTRICTED', 'COSMIC', 'SHADOW'];
      const classification = classifications[Math.floor(Math.random() * classifications.length)];
      
      nodes.push({
        id: `gen_${regionIndex}_${i}`,
        name: `${region.name} Node ${i + 1}`,
        type: type as any,
        coordinates: [validLat, validLon],
        threatLevel: threatLevel as any,
        status: status as any,
        classification: classification as any,
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
    case 'hacker': return Terminal;
    case 'government': return Lock;
    case 'corporate': return Database;
    case 'satellite': return Satellite;
    case 'research': return Search;
    case 'nuclear': return AlertTriangle;
    case 'surveillance': return Eye;
    case 'airport': return Activity;
    case 'black_site': return Lock;
    case 'cartel': return Skull;
    case 'cyber_warfare': return Zap;
    case 'data_center': return Database;
    case 'submarine': return Activity;
    case 'space_command': return Satellite;
    case 'bioweapon': return AlertTriangle;
    case 'quantum_lab': return Search;
    case 'dark_web': return Terminal;
    case 'arms_dealer': return Crosshair;
    case 'terror_cell': return Skull;
    case 'money_laundering': return Database;
    case 'human_trafficking': return AlertTriangle;
    case 'drug_lab': return Activity;
    case 'cyber_mercenary': return Terminal;
    case 'crypto_exchange': return Database;
    case 'weapon_storage': return Shield;
    case 'communications': return Radio;
    case 'radar_site': return Satellite;
    case 'missile_base': return Crosshair;
    case 'drone_base': return Activity;
    case 'prison': return Lock;
    case 'embassy': return Shield;
    case 'consulate': return Shield;
    case 'border_control': return Lock;
    default: return Wifi;
  }
};

const getThreatColor = (level: number): string => {
  switch (level) {
    case 1: return '#22c55e'; // Green
    case 2: return '#84cc16'; // Light Green  
    case 3: return '#eab308'; // Yellow
    case 4: return '#f59e0b'; // Orange
    case 5: return '#ef4444'; // Red
    case 6: return '#dc2626'; // Dark Red
    default: return '#6b7280'; // Gray
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active': return '#22c55e';
    case 'dormant': return '#eab308';
    case 'compromised': return '#ef4444';
    case 'offline': return '#6b7280';
    case 'ghost': return '#8b5cf6';
    case 'dark': return '#1f2937';
    case 'burned': return '#dc2626';
    default: return '#6b7280';
  }
};

export const HackerMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedNode, setSelectedNode] = useState<ClassifiedNode | null>(null);
  const [filteredNodes, setFilteredNodes] = useState<ClassifiedNode[]>(CLASSIFIED_NODES.slice(0, 100));
  const [filterType, setFilterType] = useState<string>('all');
  const [threatFilter, setThreatFilter] = useState<number>(0);
  const [showAllNodes, setShowAllNodes] = useState<boolean>(false);
  const [showControlPanel, setShowControlPanel] = useState<boolean>(true);
  const [mapMode, setMapMode] = useState<'2d' | '3d'>('2d');
  const [autoRotate, setAutoRotate] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showOps, setShowOps] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showNodeFilters, setShowNodeFilters] = useState(false);
  const mapboxToken = 'pk.eyJ1IjoiY3JpbmtlZGFydCIsImEiOiJjbWZhbXJkeTgxZDloMmxvZjB1ZjQxczBzIn0.XanOxg-xA88pNFAvy5K5kA';
  const markers = useRef<mapboxgl.Marker[]>([]);

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
    
    // Initialize map with proper settings for both 2D and 3D
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [0, 20],
      zoom: mapMode === '3d' ? 1.5 : 2,
      projection: mapMode === '3d' ? 'globe' : 'mercator',
      pitch: mapMode === '3d' ? 45 : 0,
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

    // Add fog effect for 3D mode
    map.current.on('style.load', () => {
      if (!map.current) return;
      
      if (mapMode === '3d') {
        map.current.setFog({
          'range': [-1, 2],
          'color': '#1a1a1a',
          'horizon-blend': 0.3,
          'high-color': '#333333',
        });

        // Add atmosphere for globe
        map.current.addLayer({
          'id': 'globe-atmosphere',
          'type': 'sky',
          'paint': {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 0.0],
            'sky-atmosphere-sun-intensity': 15
          }
        });
      }
    });

    // Auto-rotation for 3D mode
    let rotationIntervalId: number | null = null;
    
    if (mapMode === '3d' && autoRotate) {
      const rotateMap = () => {
        if (map.current && autoRotate) {
          const center = map.current.getCenter();
          center.lng -= 0.2;
          map.current.easeTo({ center, duration: 1000 });
        }
      };
      rotationIntervalId = window.setInterval(rotateMap, 1000);
    }

    // Add nodes as markers when map loads
    map.current.on('load', () => {
      addNodesToMap();
    });

    // Clean up rotation on unmount
    return () => {
      if (rotationIntervalId) {
        clearInterval(rotationIntervalId);
      }
    };
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
      // Coordinates are stored as [lat, lng], but Mapbox expects [lng, lat]
      const lng = node.coordinates[1];
      const lat = node.coordinates[0];
      
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([lng, lat])
        .addTo(map.current!);

      markerElement.addEventListener('click', () => {
        setSelectedNode(node);
      });

      // Add popup for high-threat nodes
      if (node.threatLevel >= 4) {
        const popup = new mapboxgl.Popup({ offset: 15, closeButton: false })
          .setLngLat([lng, lat])
          .setHTML(`
            <div style="color: white; background: rgba(0,0,0,0.8); padding: 8px; border-radius: 4px; font-size: 10px; font-family: monospace;">
              <strong>${node.name}</strong><br/>
              <span style="color: ${color};">Threat Level: ${node.threatLevel}/6</span><br/>
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

  // Handle map mode changes
  useEffect(() => {
    if (map.current) {
      if (mapMode === '3d') {
        map.current.easeTo({
          pitch: 45,
          bearing: 0,
          zoom: 1.5
        });
        map.current.setProjection('globe');
      } else {
        map.current.easeTo({
          pitch: 0,
          bearing: 0,
          zoom: 2
        });
        map.current.setProjection('mercator');
      }
    }
  }, [mapMode]);

  // Handle auto-rotation
  useEffect(() => {
    let rotationIntervalId: number | null = null;
    
    if (mapMode === '3d' && autoRotate && map.current) {
      const rotateMap = () => {
        if (map.current && autoRotate) {
          const center = map.current.getCenter();
          center.lng -= 0.2;
          map.current.easeTo({ center, duration: 1000 });
        }
      };
      rotationIntervalId = window.setInterval(rotateMap, 1000);
    }

    return () => {
      if (rotationIntervalId) {
        clearInterval(rotationIntervalId);
      }
    };
  }, [autoRotate, mapMode]);

  return (
    <div className="h-full relative">
      {/* Mapbox Container */}
      <div ref={mapContainer} className="w-full h-full" style={{ background: '#1a1a1a' }} />
      
      {/* Network Traffic Overlay - Packet Visualization */}
      <NetworkTrafficOverlay nodes={filteredNodes} />

      {/* Panel Toggle Button */}
      <Button
        onClick={() => setShowControlPanel(!showControlPanel)}
        className="absolute top-4 left-4 z-40 w-10 h-10 p-0"
        variant="outline"
      >
        {showControlPanel ? <ChevronLeft className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
      </Button>

      {/* Stats Panel Toggle */}
      <Button
        onClick={() => setShowStats(!showStats)}
        className="absolute bottom-4 left-4 z-40 w-10 h-10 p-0"
        variant="outline"
        title="Toggle Stats"
      >
        <Activity className="w-4 h-4" />
      </Button>

      {/* Ops Panel Toggle */}
      <Button
        onClick={() => setShowOps(!showOps)}
        className="absolute bottom-16 left-4 z-40 w-10 h-10 p-0"
        variant="outline"
        title="Toggle Operations"
      >
        <Terminal className="w-4 h-4" />
      </Button>

      {/* Alerts Panel Toggle */}
      <Button
        onClick={() => setShowAlerts(!showAlerts)}
        className="absolute bottom-28 left-4 z-40 w-10 h-10 p-0"
        variant="outline"
        title="Toggle Alerts"
      >
        <AlertTriangle className="w-4 h-4" />
      </Button>

      {/* Network Stats Panel - Bottom Right */}
      {showStats && (
        <div className="absolute bottom-4 right-4 w-80 z-30 animate-fade-in">
          <NetworkStatsPanel />
        </div>
      )}

      {/* Hacking Operations Panel - Bottom Right */}
      {showOps && (
        <div className="absolute bottom-4 left-16 w-96 z-30 animate-fade-in max-h-[50vh] overflow-y-auto">
          <Card className="p-4 bg-background/90 backdrop-blur border-primary/30">
            <HackingOpsPanel />
          </Card>
        </div>
      )}

      {/* Alerts Panel - Top Right */}
      {showAlerts && (
        <div className="absolute top-16 right-4 w-80 z-30 animate-fade-in">
          <Card className="p-4 bg-background/90 backdrop-blur border-red-500/30">
            <AlertsPanel />
          </Card>
        </div>
      )}

      {/* Enhanced Control Panel */}
      {showControlPanel && (
        <div className="absolute top-4 left-16 space-y-2 z-30 max-h-[80vh] overflow-y-auto w-80">
          <Card className="p-3 bg-background/90 backdrop-blur border-primary/30">
          <div className="space-y-2">
            <div className="text-xs text-primary font-mono font-bold">GLOBAL SURVEILLANCE NETWORK</div>
            <div className="text-xs text-muted-foreground">
              Tracking {CLASSIFIED_NODES.length.toLocaleString()} classified nodes worldwide
            </div>
            
            {/* Map Mode Controls */}
            <div className="flex gap-2">
              <Button
                onClick={() => setMapMode('2d')}
                variant={mapMode === '2d' ? "default" : "outline"}
                size="sm"
                className="flex-1"
              >
                <Map className="w-4 h-4 mr-1" />
                2D
              </Button>
              <Button
                onClick={() => setMapMode('3d')}
                variant={mapMode === '3d' ? "default" : "outline"}
                size="sm"
                className="flex-1"
              >
                <Globe className="w-4 h-4 mr-1" />
                3D
              </Button>
            </div>

            {/* Auto-rotate for 3D */}
            {mapMode === '3d' && (
              <Button
                onClick={() => setAutoRotate(!autoRotate)}
                variant={autoRotate ? "default" : "outline"}
                size="sm"
                className="w-full"
              >
                <Activity className="w-4 h-4 mr-2" />
                {autoRotate ? 'Stop Rotation' : 'Auto Rotate'}
              </Button>
            )}
            
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

          {/* Node Filters Card */}
          {showNodeFilters && (
            <Card className="p-3 bg-background/90 backdrop-blur border-primary/30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-primary font-mono font-bold">NODE FILTERS</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNodeFilters(false)}
                  className="w-6 h-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Node Type Filter */}
              <div className="grid grid-cols-2 gap-1 text-xs mb-2">
                {['all', 'military', 'intelligence', 'criminal', 'hacker', 'cyber_warfare', 'black_site', 'bioweapon'].map(type => (
                  <Button
                    key={type}
                    onClick={() => handleTypeFilter(type)}
                    variant={filterType === type ? "default" : "outline"}
                    size="sm"
                    className="text-xs p-1 h-auto"
                  >
                    {type.replace('_', ' ').toUpperCase()}
                  </Button>
                ))}
              </div>

              {/* Threat Level Filter */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Min Threat Level:</div>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5, 6].map(level => (
                    <Button
                      key={level}
                      onClick={() => handleThreatFilter(level)}
                      variant={threatFilter === level ? "default" : "outline"}
                      size="sm"
                      className="text-xs p-1 h-6 w-6"
                      style={{ backgroundColor: level === 0 ? undefined : getThreatColor(level) }}
                    >
                      {level === 0 ? 'All' : level}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Network Stats Panel */}
      {showStats && (
        <div className="absolute bottom-4 right-4 w-80 z-30">
          <Card className="p-3 bg-background/90 backdrop-blur border-primary/30">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-primary font-mono font-bold">NETWORK STATS</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStats(false)}
                className="w-6 h-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <NetworkStatsPanel />
          </Card>
        </div>
      )}

      {/* Operations Panel */}
      {showOps && (
        <div className="absolute bottom-4 left-16 w-96 z-30 max-h-[50vh] overflow-y-auto">
          <Card className="p-3 bg-background/90 backdrop-blur border-primary/30">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-primary font-mono font-bold">HACKING OPS</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOps(false)}
                className="w-6 h-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <HackingOpsPanel />
          </Card>
        </div>
      )}

      {/* Alerts Panel */}
      {showAlerts && (
        <div className="absolute top-4 right-4 w-80 z-30">
          <Card className="p-3 bg-background/90 backdrop-blur border-red-500/30">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-destructive font-mono font-bold">THREAT ALERTS</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAlerts(false)}
                className="w-6 h-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <AlertsPanel />
          </Card>
        </div>
      )}

      {/* Node Details Panel */}
      {selectedNode && (
        <Card className="absolute top-4 right-4 w-80 p-4 bg-background/95 backdrop-blur border-primary/30 z-30 max-h-[80vh] overflow-y-auto">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-mono text-sm font-bold text-primary">{selectedNode.name}</h3>
                <Badge 
                  variant="outline" 
                  className="mt-1"
                  style={{ 
                    borderColor: getThreatColor(selectedNode.threatLevel),
                    color: getThreatColor(selectedNode.threatLevel)
                  }}
                >
                  Threat Level {selectedNode.threatLevel}/6
                </Badge>
              </div>
              <Button
                onClick={() => setSelectedNode(null)}
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0"
              >
                ×
              </Button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground">Type:</span> {selectedNode.type.replace('_', ' ').toUpperCase()}
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span> 
                <span style={{ color: getStatusColor(selectedNode.status) }} className="ml-1 font-mono">
                  {selectedNode.status.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Classification:</span> 
                <span className="ml-1 font-mono text-primary font-bold">{selectedNode.classification}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Coordinates:</span> 
                <span className="ml-1 font-mono">{selectedNode.coordinates[0].toFixed(4)}, {selectedNode.coordinates[1].toFixed(4)}</span>
              </div>
              {selectedNode.operationalSince && (
                <div>
                  <span className="text-muted-foreground">Operational Since:</span> 
                  <span className="ml-1 font-mono">{selectedNode.operationalSince}</span>
                </div>
              )}
              {selectedNode.coverName && (
                <div>
                  <span className="text-muted-foreground">Cover Name:</span> 
                  <span className="ml-1 font-mono">{selectedNode.coverName}</span>
                </div>
              )}
              {selectedNode.riskLevel && (
                <div>
                  <span className="text-muted-foreground">Risk Level:</span> 
                  <Badge variant="destructive" className="ml-1">
                    {selectedNode.riskLevel}
                  </Badge>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground">Description:</div>
              <p className="text-xs mt-1">{selectedNode.description}</p>
            </div>

            <div className="pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground">Last Activity:</div>
              <div className="text-xs mt-1 font-mono">{new Date(selectedNode.lastActivity).toLocaleString()}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Add CSS for pulse animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.7;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `
      }} />
    </div>
  );
};