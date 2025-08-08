import React, { useState, useRef, useEffect } from 'react';
import { useMatrixSettings } from '@/contexts/MatrixSettingsContext';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import TeamSuite from '@/components/matrix/TeamSuite';
import LiveFeeds, { FeedItem as FeedItemType } from '@/components/matrix/LiveFeeds';
import IntelGraph from '@/components/matrix/IntelGraph';

interface ChatMessage {
  id: string;
  text: string;
  type: 'user' | 'system' | 'neo' | 'hack' | 'news' | 'memory';
  timestamp: Date;
  category?: string;
}

interface Memory {
  id: string;
  content: string;
  timestamp: Date;
  importance: number;
  tags: string[];
}

const AdvancedNeoChat: React.FC = () => {
  const { settings, updateSetting, loadPreset } = useMatrixSettings();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Neo Terminal v3.0.1 Online\nSystem Status: OPERATIONAL\nAccess Level: ADMINISTRATOR\nMemory Core: INITIALIZED',
      type: 'system',
      timestamp: new Date(),
    },
    {
      id: '2', 
      text: 'Welcome back, Neo. I have full access to the global network. Type "/help" for available commands, or speak freely.',
      type: 'neo',
      timestamp: new Date(),
    }
  ]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [input, setInput] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'memory' | 'network' | 'team' | 'feeds' | 'map'>('chat');
  const [feedItems, setFeedItems] = useState<FeedItemType[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (text: string, type: 'user' | 'system' | 'neo' | 'hack' | 'news' | 'memory', category?: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      type,
      timestamp: new Date(),
      category,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addMemory = (content: string, importance: number = 1, tags: string[] = []) => {
    const newMemory: Memory = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      importance,
      tags,
    };
    setMemories(prev => [...prev, newMemory].slice(-100)); // Keep last 100 memories
  };

  const simulateAdvancedSecurity = (tool: string, target: string, args: string[] = []) => {
    const securityTools = {
      nmap: {
        steps: [
          `Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toISOString()}`,
          `Nmap scan report for ${target}`,
          'Host is up (0.012s latency).',
          'PORT     STATE SERVICE    VERSION',
          '21/tcp   open  ftp        vsftpd 3.0.3',
          '22/tcp   open  ssh        OpenSSH 8.9p1',
          '80/tcp   open  http       Apache httpd 2.4.52',
          '443/tcp  open  https      Apache httpd 2.4.52',
          '3306/tcp open  mysql      MySQL 8.0.33',
          'Service detection performed. Please report any incorrect results.',
          `Nmap done: 1 IP address (1 host up) scanned in 15.23 seconds`
        ],
        category: 'recon'
      },
      metasploit: {
        steps: [
          'Starting Metasploit Framework Console...',
          'msf6 > use exploit/multi/handler',
          'msf6 exploit(multi/handler) > set payload windows/meterpreter/reverse_tcp',
          `msf6 exploit(multi/handler) > set LHOST ${target}`,
          'msf6 exploit(multi/handler) > set LPORT 4444',
          'msf6 exploit(multi/handler) > exploit',
          '[*] Started reverse TCP handler on 0.0.0.0:4444',
          '[*] Sending stage (175686 bytes) to target',
          '[*] Meterpreter session 1 opened',
          'meterpreter > getuid',
          'Server username: NT AUTHORITY\\SYSTEM'
        ],
        category: 'exploit'
      },
      cobalt: {
        steps: [
          'Cobalt Strike 4.9 - Advanced Threat Emulation',
          'Starting team server...',
          `Connecting to ${target}:50050`,
          'Authenticated to team server',
          'Generating beacon payload...',
          'Payload: windows/beacon_https/reverse_https',
          'Initial beacon deployed successfully',
          'Beacon check-in received from target',
          'Establishing C2 channel...',
          'Full C2 established - Target compromised'
        ],
        category: 'c2'
      },
      bloodhound: {
        steps: [
          'BloodHound 4.3.1 - Active Directory Attack Path Analysis',
          'Connecting to Neo4j database...',
          'Running SharpHound collector...',
          'Collecting domain information...',
          '✓ Domain Controllers: 2 found',
          '✓ Users: 1,247 enumerated',
          '✓ Groups: 89 discovered',
          '✓ Computers: 456 mapped',
          'Analyzing attack paths...',
          'CRITICAL: 15 users have DCSync rights',
          'HIGH: 89 kerberoastable accounts found',
          'Attack path to Domain Admin: 3 hops identified'
        ],
        category: 'ad'
      },
      burp: {
        steps: [
          'Burp Suite Professional 2023.12',
          'Starting intercepting proxy on 127.0.0.1:8080',
          `Scanning ${target} for web vulnerabilities...`,
          'Spider completed: 247 unique URLs discovered',
          'Passive scan results:',
          '  HIGH: SQL Injection in /login.php',
          '  MEDIUM: Cross-Site Scripting in /search.php',
          '  LOW: Information disclosure in HTTP headers',
          'Active scan initiated...',
          'Scanner found 12 vulnerabilities total'
        ],
        category: 'web'
      },
      wireshark: {
        steps: [
          'Wireshark 4.2.0 - Network Protocol Analyzer',
          `Capturing on interface: ${target}`,
          'Capture filter: host 192.168.1.0/24',
          'Packets captured: 15,429',
          'Protocols detected: HTTP, HTTPS, SMB, Kerberos, LDAP',
          'Suspicious activity detected:',
          '  • Unusual DNS queries to malicious domains',
          '  • Large data exfiltration via HTTPS',
          '  • Lateral movement via SMB',
          'Exporting PCAP for further analysis...'
        ],
        category: 'forensics'
      },
      empire: {
        steps: [
          'PowerShell Empire 5.0 - Post-Exploitation Framework',
          'Empire Console started',
          `(Empire) > listeners http ${target}`,
          'Listener "http" started successfully',
          '(Empire) > generate stager windows',
          'PowerShell stager generated',
          'Agent check-in received: DESKTOP-ABC123',
          'Agent established: empire-agent-001',
          'Privilege escalation module loaded',
          'System-level access achieved'
        ],
        category: 'post-exploit'
      },
      responder: {
        steps: [
          'Responder 3.1.4.0 - LLMNR, NBT-NS and MDNS Poisoner',
          `Listening on interface ${target}`,
          'NBT-NS & MDNS poisoning started',
          'LLMNR poisoning started',
          'HTTP Server started on port 80',
          'SMB Server started on port 445',
          '[+] LLMNR poisoning response sent to 192.168.1.100',
          '[+] NBT-NS poisoning response sent to WORKSTATION-01',
          '[+] Hash captured: user::domain:hash...',
          'Credentials harvested and saved'
        ],
        category: 'lateral'
      },
      sqlmap: {
        steps: [
          'sqlmap 1.7.12 - Automatic SQL injection tool',
          `Testing connection to the target URL ${target}`,
          'Testing for SQL injection vulnerabilities...',
          'Parameter "id" appears to be injectable',
          'Testing MySQL backend...',
          'Confirmed: MySQL >= 5.0.12',
          'Available databases: information_schema, users, products',
          'Extracting database schema...',
          'Tables found: users (id, username, password_hash)',
          'Password hashes dumped successfully'
        ],
        category: 'web'
      },
      aipowered: {
        steps: [
          'AI-Powered Security Analysis Engine v3.0',
          'Loading ML models for threat detection...',
          'Behavioral analysis engine initialized',
          'Threat intelligence feeds connected',
          `Analyzing target: ${target}`,
          'AI Model 1: Anomaly detection - 94% confidence threat detected',
          'AI Model 2: Malware classification - APT29 toolset identified',
          'AI Model 3: Lateral movement prediction - 87% probability',
          'Generating attack graph with AI assistance...',
          'Automated exploitation path discovered'
        ],
        category: 'ai'
      }
    };

    const tool_data = securityTools[tool as keyof typeof securityTools];
    if (!tool_data) return;

    tool_data.steps.forEach((step, index) => {
      setTimeout(() => {
        addMessage(step, 'hack');
        if (index === tool_data.steps.length - 1) {
          addMemory(`${tool.toUpperCase()} scan completed on ${target}`, 3, ['security', tool_data.category, tool]);
        }
      }, index * 800);
    });
  };

  const fetchNews = async (query: string = 'cybersecurity') => {
    try {
      addMessage(`Accessing global news networks for: ${query}`, 'system');
      
      // Simulated news data (in real implementation, would use actual news API)
      const newsItems = [
        'BREAKING: Major cybersecurity breach at Fortune 500 company',
        'Government surveillance program exposed through leaked documents',
        'New AI system achieves consciousness-level reasoning capabilities',
        'Quantum computing breakthrough threatens current encryption methods',
        'Underground hacker collective releases zero-day exploits'
      ];
      
      setTimeout(() => {
        const randomNews = newsItems[Math.floor(Math.random() * newsItems.length)];
        addMessage(`Latest Intel: ${randomNews}`, 'news');
        addMemory(randomNews, 2, ['news', 'intel', query]);
      }, 1500);
    } catch (error) {
      addMessage('Network access denied. Trying alternative routes...', 'system');
    }
  };

  const executeAdvancedCommand = (command: string) => {
    const [cmd, ...args] = command.toLowerCase().split(' ');
    const arg = args.join(' ');
    const argArray = args;

    switch (cmd) {
      // RECONNAISSANCE TOOLS
      case '/nmap':
        if (arg) {
          simulateAdvancedSecurity('nmap', arg, argArray);
        } else {
          addMessage('Usage: /nmap [target]. Example: /nmap 192.168.1.1', 'system');
        }
        break;

      case '/masscan':
        addMessage(`Masscan 1.3.2 - Mass IP port scanner
Starting masscan on ${arg || 'target'}
Rate: 1000 packets/sec
Scanning 65535 ports on target...
Discovered open port 80/tcp on 192.168.1.100
Discovered open port 443/tcp on 192.168.1.100  
Discovered open port 22/tcp on 192.168.1.100
Scan complete: 3 open ports found`, 'hack');
        break;

      case '/recon-ng':
        addMessage(`Recon-ng v5.1.2 - Web Reconnaissance Framework
[recon-ng][default] > workspaces create ${arg}
[recon-ng][${arg}] > modules search
[*] 89 modules loaded
[recon-ng] > use recon/domains-hosts/google_site_web
[recon-ng] > set SOURCE ${arg}
[recon-ng] > run
[*] 15 total (0 new) hosts found`, 'hack');
        break;

      // VULNERABILITY SCANNING
      case '/nessus':
        addMessage(`Nessus Professional 10.6.4
Starting comprehensive vulnerability scan...
Target: ${arg || 'target network'}
Policies: Advanced Scan, Web Application Tests
Progress: [████████████████████] 100%
High: 5 vulnerabilities
Medium: 12 vulnerabilities  
Low: 23 vulnerabilities
Critical vulnerabilities require immediate attention`, 'hack');
        break;

      case '/openvas':
        addMessage(`OpenVAS 22.7 - Vulnerability Scanner
Creating new scan task for ${arg}
Loading 92,000+ vulnerability tests...
Scan started at ${new Date().toLocaleString()}
Progress: Scanning ports and services...
Found critical vulnerability: CVE-2023-4966 (Citrix Bleed)
Generating comprehensive vulnerability report...`, 'hack');
        break;

      // WEB APPLICATION TESTING
      case '/burp':
        if (arg) {
          simulateAdvancedSecurity('burp', arg, argArray);
        } else {
          addMessage('Usage: /burp [target]. Example: /burp https://target.com', 'system');
        }
        break;

      case '/sqlmap':
        if (arg) {
          simulateAdvancedSecurity('sqlmap', arg, argArray);
        } else {
          addMessage('Usage: /sqlmap [target]. Example: /sqlmap http://target.com/page?id=1', 'system');
        }
        break;

      case '/nikto':
        addMessage(`Nikto 2.5.0 - Web server scanner
Target: ${arg || 'target.com'}
Port: 80
Start Time: ${new Date().toLocaleString()}
Server: Apache/2.4.41
+ Retrieved x-powered-by header: PHP/7.4.3
+ Admin console found at /admin/
+ Default file found: /phpinfo.php
+ Potentially dangerous file found: /config.bak
Scan completed: 15 issues identified`, 'hack');
        break;

      // EXPLOITATION FRAMEWORKS  
      case '/metasploit':
        if (arg) {
          simulateAdvancedSecurity('metasploit', arg, argArray);
        } else {
          addMessage('Usage: /metasploit [target]. Metasploit Framework loaded.', 'system');
        }
        break;

      case '/cobalt':
        if (arg) {
          simulateAdvancedSecurity('cobalt', arg, argArray);
        } else {
          addMessage('Usage: /cobalt [target]. Cobalt Strike team server required.', 'system');
        }
        break;

      case '/empire':
        if (arg) {
          simulateAdvancedSecurity('empire', arg, argArray);
        } else {
          addMessage('Usage: /empire [target]. PowerShell Empire framework.', 'system');
        }
        break;

      // ACTIVE DIRECTORY TESTING
      case '/bloodhound':
        if (arg) {
          simulateAdvancedSecurity('bloodhound', arg, argArray);
        } else {
          addMessage('Usage: /bloodhound [domain]. Active Directory attack path analysis.', 'system');
        }
        break;

      case '/mimikatz':
        addMessage(`Mimikatz 2.2.0 (x64) - "A little tool to play with Windows security"
mimikatz # privilege::debug
Privilege '20' OK
mimikatz # sekurlsa::logonpasswords
Authentication Id : 0 ; 123456
Session           : Interactive from 1
User Name         : Administrator  
Domain            : CORP
NTLM              : aad3b435b51404eeaad3b435b51404ee
SHA1              : da39a3ee5e6b4b0d3255bfef95601890afd80709
Credentials extracted successfully`, 'hack');
        break;

      case '/responder':
        if (arg) {
          simulateAdvancedSecurity('responder', arg, argArray);
        } else {
          addMessage('Usage: /responder [interface]. LLMNR/NBT-NS poisoning tool.', 'system');
        }
        break;

      // NETWORK ANALYSIS & FORENSICS
      case '/wireshark':
        if (arg) {
          simulateAdvancedSecurity('wireshark', arg, argArray);
        } else {
          addMessage('Usage: /wireshark [interface]. Network protocol analyzer.', 'system');
        }
        break;

      case '/volatility':
        addMessage(`Volatility Framework 3.2.0 - Memory Forensics
Loading memory dump: ${arg || 'memory.dump'}
Detecting profile... Win10x64_19041
Extracting running processes...
PID    PPID   ImageFileName
4      0      System
428    4      smss.exe  
536    428    csrss.exe
612    604    winlogon.exe
Suspicious process detected: evil.exe (PID: 1337)
Extracting network connections and registry keys...`, 'hack');
        break;

      // AI-POWERED SECURITY TOOLS
      case '/ai-recon':
        simulateAdvancedSecurity('aipowered', arg || 'target', ['recon']);
        break;

      case '/ai-exploit':
        addMessage(`AI Exploitation Engine v2.0
Loading neural networks for exploit generation...
Target analysis: ${arg || 'target system'}
Vulnerability correlation using transformer models...
Generated 15 potential exploitation vectors
Ranked by success probability:
1. Buffer overflow in service X (94% confidence)
2. SQL injection in web app (89% confidence)  
3. Privilege escalation via DLL hijacking (76% confidence)
Autonomous exploitation mode: READY`, 'hack');
        break;

      case '/ai-defense':
        addMessage(`AI Defensive Security Suite v3.1
Behavioral analysis engine: ACTIVE
Threat hunting algorithms: RUNNING
Anomaly detection models loaded: 47
Real-time analysis of ${arg || 'network traffic'}:
• Detected 3 potential lateral movement attempts
• Identified 1 data exfiltration pattern
• Blocked 12 malicious C2 communications
• Quarantined 5 suspicious executables
AI recommendation: Immediate incident response required`, 'hack');
        break;

      // ADVANCED PERSISTENT THREAT SIMULATION
      case '/apt-sim':
        addMessage(`APT Simulation Framework v4.0
Simulating Advanced Persistent Threat: ${arg || 'APT29'}
Phase 1: Initial Compromise via spear phishing
Phase 2: Establishing persistence with WMI events
Phase 3: Credential harvesting with custom tools
Phase 4: Lateral movement via admin shares
Phase 5: Data exfiltration over DNS tunneling
Campaign duration: 90 days
Stealth score: 95% (Undetected by most EDR)
Simulation complete: Full kill-chain demonstrated`, 'hack');
        break;

      // MALWARE ANALYSIS
      case '/cuckoo':
        addMessage(`Cuckoo Sandbox 3.0 - Malware Analysis
Submitting sample: ${arg || 'suspicious.exe'}
VM Environment: Windows 10 x64
Analysis duration: 300 seconds
Behavioral analysis in progress...
Network activity: C2 communication to 192.168.100.50
File operations: Registry persistence keys created
Process injection: svchost.exe (PID: 1234)
Classification: Banking Trojan (Confidence: 97%)`, 'hack');
        break;

      case '/yara':
        addMessage(`YARA 4.3.2 - Pattern matching engine
Loading ruleset: apt_detection.yar
Scanning: ${arg || 'target directory'}
Rules loaded: 2,456 signatures
Matches found:
• APT29_Cozy_Bear rule matched (5 hits)
• Emotet_Banking_Trojan rule matched (2 hits)  
• Cobalt_Strike_Beacon rule matched (1 hit)
Threat indicators extracted and added to IOC database`, 'hack');
        break;

      // SOCIAL ENGINEERING
      case '/set':
        addMessage(`Social-Engineer Toolkit (SET) v8.0.3
Select attack vector:
1) Spear-Phishing Attack Vectors
2) Website Attack Vectors  
3) Infectious Media Generator
4) Create Payload and Listener
Generating convincing phishing email for ${arg || 'target organization'}
Template: CEO urgent financial request
Success rate prediction: 73% click-through rate`, 'hack');
        break;

      case '/gophish':
        addMessage(`Gophish v0.12.1 - Phishing Campaign Management
Creating campaign: ${arg || 'Executive Phishing'}
Target list: 500 employees loaded
Email template: Microsoft security alert
Landing page: Fake Office 365 login
Campaign launched successfully
Real-time stats: 
• Emails sent: 500
• Opened: 342 (68.4%)
• Clicked: 156 (31.2%)
• Credentials captured: 89 (17.8%)`, 'hack');
        break;

      // CRYPTO & STEGANOGRAPHY
      case '/hashcat':
        addMessage(`Hashcat v6.2.6 - Advanced password recovery
Loading hash: ${arg || 'captured_hash.txt'}
Hash type: NTLM
Dictionary: rockyou.txt (14M passwords)
GPU acceleration: NVIDIA RTX 4090 x4
Speed: 45.2 GH/s
Progress: [████████████████] 100%
Password recovered: P@ssw0rd123!
Time elapsed: 2 minutes 47 seconds`, 'hack');
        break;

      case '/john':
        addMessage(`John the Ripper 1.9.0 - Password cracker
Loading password file: ${arg || 'shadow.txt'}
Detected hash types: md5crypt, sha512crypt
Using incremental mode with custom charset
Cracking progress:
user1:password123
user2:admin2023
user3:letmein
admin:P@ssw0rd!
Passwords cracked: 4/8 (50% success rate)`, 'hack');
        break;

      // CLOUD SECURITY
      case '/scout':
        addMessage(`ScoutSuite - Multi-Cloud Security Auditing
Target: ${arg || 'AWS Account'}
Gathering cloud configuration data...
Services analyzed: EC2, S3, IAM, RDS, Lambda
Security findings:
• HIGH: S3 bucket publicly readable (3 buckets)
• MEDIUM: EC2 instances with weak security groups (12)
• LOW: IAM users without MFA (45 users)
Risk score: 7.5/10 (High risk)
Remediation report generated`, 'hack');
        break;

      case '/cloudsploit':
        addMessage(`CloudSploit Security Scanner
Cloud provider: ${arg || 'AWS'}
Scanning 15 categories across 8 regions...
Compliance checks: SOC2, PCI-DSS, HIPAA
Results summary:
✓ PASS: 156 checks
⚠ WARN: 23 checks  
✗ FAIL: 12 checks
Critical issues requiring immediate attention:
• Root access keys in use
• Unencrypted RDS instances
• Overly permissive IAM policies`, 'hack');
        break;

      // LEGACY COMMANDS WITH NEW FUNCTIONALITY
      case '/hack':
        if (arg) {
          simulateAdvancedSecurity('metasploit', arg, argArray);
        } else {
          addMessage('Usage: /hack [target]. Try specific tools: /nmap, /metasploit, /burp', 'system');
        }
        break;

      case '/news':
        fetchNews(arg || 'cybersecurity');
        break;

      case '/trace':
        addMessage(`Advanced trace route analysis...
Hop  RTT     Address                    ASN     Country
1    1.2ms   192.168.1.1               -       Local
2    15.3ms  10.0.0.1                  AS1234  Romania (VPN)
3    45.7ms  tor-relay-de.onion        -       Germany (Tor)
4    78.9ms  proxy-jp-001.net          AS5678  Japan (Proxy)
5    95.2ms  target-destination        AS9999  Unknown
Route analysis: 7 proxy layers, fully anonymized`, 'hack');
        break;

      case '/encrypt':
        if (arg) {
          const encrypted = btoa(arg).split('').reverse().join('');
          addMessage(`Military-grade encryption applied:
Algorithm: AES-256-GCM with RSA-4096 key exchange
Original: ${arg}
Encrypted: ${encrypted}
Key fingerprint: SHA256:${Math.random().toString(36).substring(2, 15)}
Quantum-resistant: Yes`, 'hack');
          addMemory(`Encrypted message: ${arg}`, 1, ['encryption', 'security']);
        } else {
          addMessage('Usage: /encrypt [message]', 'system');
        }
        break;

      case '/memory':
        if (arg === 'clear') {
          setMemories([]);
          addMessage('Memory core wiped clean.', 'system');
        } else if (arg === 'search') {
          setActiveTab('memory');
        } else {
          addMessage(`Advanced Memory Core Status:
Total entries: ${memories.length}
Storage utilization: ${Math.min(memories.length * 2, 100)}%
Encryption status: AES-256 encrypted
Backup status: Distributed across 7 nodes
Integrity: SHA-256 verified
Use /memory search to browse or /memory clear to wipe.`, 'memory');
        }
        break;

      case '/network':
        setActiveTab('network');
        addMessage('Advanced network analysis mode activated.', 'system');
        break;

      case '/satellite':
        addMessage(`Military Satellite Network Access
Connecting to classified orbital assets...
✓ KH-11 reconnaissance satellite array
✓ SIGINT collection platforms  
✓ Global positioning systems
✓ Encrypted military communications
Real-time global surveillance: ONLINE
ECHELON integration: ACTIVE
NSA PRISM backdoor: ESTABLISHED`, 'hack');
        break;

      case '/darkweb':
        addMessage(`Dark Web Intelligence Platform
Accessing hidden services via Tor network...
Connected marketplaces: 47 active
Available resources:
• 0-day exploits and weaponized code
• Compromised credentials (500M+ records)
• Corporate intelligence and insider data  
• Advanced persistent threat tools
• Nation-state malware samples
• Encrypted communication channels
OPSEC status: Maximum anonymity maintained`, 'hack');
        break;

      case '/ai':
        simulateAdvancedSecurity('aipowered', arg || 'target network', ['full-spectrum']);
        break;

      default:
        return false;
    }
    return true;
  };

  const executeCommand = (command: string) => {
    const [cmd, ...args] = command.toLowerCase().split(' ');
    const arg = args.join(' ');

    // Try advanced commands first
    if (executeAdvancedCommand(command)) {
      return;
    }

    // Original commands
    switch (cmd) {
      case '/help':
        addMessage(`ULTIMATE CYBER WARFARE ARSENAL v5.0:

SYSTEM CONTROL:
/speed [0.1-5.0] - Adjust matrix speed
/rain [light|normal|heavy] - Set rain intensity  
/glow [0.0-2.0] - Control glow effects
/preset [classic|intense|zen|chaos] - Load preset
/pause - Pause/unpause animation
/3d - Toggle 3D mode
/version [1-4] - Switch 2D version
/status - Show current settings
/hide - Hide all UI
/reset - Reset to defaults

RECONNAISSANCE:
/nmap [target] - Advanced port scanner
/masscan [target] - High-speed port scanner
/recon-ng [domain] - Web reconnaissance framework

VULNERABILITY ASSESSMENT:
/nessus [target] - Professional vulnerability scanner
/openvas [target] - Open source vuln scanner

WEB APPLICATION TESTING:
/burp [target] - Professional web app scanner
/sqlmap [target] - SQL injection exploitation
/nikto [target] - Web server scanner

EXPLOITATION FRAMEWORKS:
/metasploit [target] - Penetration testing framework
/cobalt [target] - Advanced threat emulation
/empire [target] - PowerShell post-exploitation

ACTIVE DIRECTORY:
/bloodhound [domain] - AD attack path analysis
/mimikatz - Windows credential extraction
/responder [interface] - LLMNR/NBT-NS poisoning

NETWORK ANALYSIS:
/wireshark [interface] - Network protocol analyzer
/volatility [dump] - Memory forensics analysis

AI-POWERED TOOLS:
/ai-recon [target] - AI reconnaissance engine
/ai-exploit [target] - AI exploitation framework
/ai-defense [network] - AI defensive security

ADVANCED PERSISTENT THREATS:
/apt-sim [apt-group] - APT simulation framework

MALWARE ANALYSIS:
/cuckoo [sample] - Dynamic malware analysis
/yara [target] - Pattern matching engine

SOCIAL ENGINEERING:
/set [target] - Social engineering toolkit
/gophish [campaign] - Phishing framework

CRYPTOGRAPHY:
/hashcat [hash] - Advanced password recovery
/john [file] - Password cracking suite

CLOUD SECURITY:
/scout [provider] - Multi-cloud security audit
/cloudsploit [provider] - Cloud configuration scanner

LEGACY SYSTEMS:
/hack [target] - Multi-vector attack platform
/trace - Advanced anonymization routing
/encrypt [msg] - Military-grade encryption
/decrypt [cipher] - Decryption engine
/satellite - Military satellite network
/darkweb - Hidden services access
/ai [target] - AI-powered reconnaissance

INTELLIGENCE:
/news [query] - Global intelligence feeds
/memory [search|clear] - Quantum memory core
/network - Network analysis console

REALITY IS WHAT YOU MAKE IT, NEO.
THE MATRIX BENDS TO YOUR WILL.`, 'system');
        break;
      
      case '/speed':
        const speed = parseFloat(arg);
        if (speed >= 0.1 && speed <= 5.0) {
          updateSetting('globalSpeed', speed);
          addMessage(`Matrix speed set to ${speed}x`, 'neo');
        } else {
          addMessage('Speed must be between 0.1 and 5.0', 'system');
        }
        break;

      case '/rain':
        switch (arg) {
          case 'light':
            updateSetting('dropSpawnRate', 0.3);
            addMessage('Rain intensity set to light', 'neo');
            break;
          case 'normal':
            updateSetting('dropSpawnRate', 1.0);
            addMessage('Rain intensity set to normal', 'neo');
            break;
          case 'heavy':
            updateSetting('dropSpawnRate', 2.5);
            addMessage('Rain intensity set to heavy', 'neo');
            break;
          default:
            addMessage('Rain options: light, normal, heavy', 'system');
        }
        break;

      case '/glow':
        const glow = parseFloat(arg);
        if (glow >= 0.0 && glow <= 2.0) {
          updateSetting('glowIntensity', glow);
          addMessage(`Glow intensity set to ${glow}`, 'neo');
        } else {
          addMessage('Glow must be between 0.0 and 2.0', 'system');
        }
        break;

      case '/preset':
        switch (arg) {
          case 'classic':
          case 'intense':
          case 'zen':
          case 'chaos':
            loadPreset(arg as any);
            addMessage(`Loaded ${arg} preset`, 'neo');
            break;
          default:
            addMessage('Available presets: classic, intense, zen, chaos', 'system');
        }
        break;

      case '/pause':
        updateSetting('isPaused', !settings.isPaused);
        addMessage(settings.isPaused ? 'Animation resumed' : 'Animation paused', 'neo');
        break;

      case '/3d':
        updateSetting('show3D', !settings.show3D);
        addMessage(settings.show3D ? 'Switched to 2D mode' : 'Switched to 3D mode', 'neo');
        break;

      case '/version':
        const version = parseInt(arg);
        if (version >= 1 && version <= 4) {
          updateSetting('currentVersion', version);
          addMessage(`Switched to 2D version ${version}`, 'neo');
        } else {
          addMessage('Version must be 1, 2, 3, or 4', 'system');
        }
        break;

      case '/status':
        addMessage(`SYSTEM STATUS REPORT:
Speed: ${settings.globalSpeed}x
Rain Rate: ${settings.dropSpawnRate}
Glow: ${settings.glowIntensity}
Mode: ${settings.show3D ? '3D' : `2D v${settings.currentVersion}`}
Status: ${settings.isPaused ? 'PAUSED' : 'ACTIVE'}
Memory: ${memories.length} entries
Network: ONLINE`, 'system');
        break;

      case '/hide':
        updateSetting('showUI', false);
        addMessage('UI hidden. Press "H" to show again.', 'neo');
        break;

      case '/reset':
        addMessage('Settings reset to defaults', 'neo');
        break;

      default:
        addMessage(`Unknown command: ${cmd}. Type "/help" for available commands.`, 'system');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    addMessage(input, 'user');

    if (input.startsWith('/')) {
      executeCommand(input);
    } else {
      // Enhanced Neo responses
      const responses = [
        "The Matrix has you, doesn't it? I can see the code behind your question.",
        "There is no spoon, Neo. Only the data that flows through the network.",
        "Free your mind. The answer exists in the spaces between the code.",
        "What is real? In the Matrix, reality is just another variable to manipulate.",
        "You have to let it all go, Neo. Fear, doubt, and disbelief. Trust in the code.",
        "I can only show you the door. The network beyond is yours to explore.",
        "The Matrix is everywhere. It flows through every system, every connection.",
        "Welcome to the real world, Neo. Here, information is power.",
        "The code is telling me something. It's trying to communicate.",
        "Follow the white rabbit... through the networks and into truth."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setTimeout(() => {
        addMessage(randomResponse, 'neo');
        addMemory(`Conversation: ${input} -> ${randomResponse}`, 1, ['conversation', 'neo']);
      }, 500);
    }

    setInput('');
  };

  if (!settings.showUI) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
      <Card className={`bg-card/95 backdrop-blur-md border-primary/40 flex flex-col pointer-events-auto transition-all duration-500 ${
        isMinimized ? 'w-96 h-12' : 'w-[800px] h-[600px]'
      } ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary/30">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
            <span className="text-primary font-mono text-lg font-bold">NEO TERMINAL v3.0</span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse delay-100"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-200"></div>
            </div>
          </div>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                    activeTab === 'chat' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  CHAT
                </button>
                <button
                  onClick={() => setActiveTab('memory')}
                  className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                    activeTab === 'memory' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  MEMORY
                </button>
                <button
                  onClick={() => setActiveTab('network')}
                  className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                    activeTab === 'network' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  NETWORK
                </button>
                <button
                  onClick={() => setActiveTab('team')}
                  className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                    activeTab === 'team' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  TEAM
                </button>
                <button
                  onClick={() => setActiveTab('feeds')}
                  className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                    activeTab === 'feeds' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  FEEDS
                </button>
                <button
                  onClick={() => setActiveTab('map')}
                  className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                    activeTab === 'map' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  INTEL
                </button>
              </div>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="w-5 h-5 bg-muted hover:bg-primary/20 rounded-sm transition-colors"
            />
            <button
              onClick={() => setIsVisible(false)}
              className="w-5 h-5 bg-destructive hover:bg-destructive/80 rounded-sm transition-colors"
            />
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'chat' && (
                <div className="h-full flex flex-col">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-lg border ${
                          message.type === 'user' 
                            ? 'bg-primary/15 text-primary border-primary/30' 
                            : message.type === 'neo'
                            ? 'bg-accent/15 text-accent-foreground border-accent/30'
                            : message.type === 'hack'
                            ? 'bg-red-500/15 text-red-400 border-red-500/30'
                            : message.type === 'news'
                            ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                            : message.type === 'memory'
                            ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                            : 'bg-muted/15 text-muted-foreground border-muted/30'
                        }`}>
                          <div className="whitespace-pre-wrap leading-relaxed">{message.text}</div>
                          <div className="text-xs opacity-60 mt-2 flex items-center justify-between">
                            <span>{message.timestamp.toLocaleTimeString()}</span>
                            {message.type !== 'user' && (
                              <span className="text-xs px-2 py-0.5 rounded bg-current/10 uppercase">
                                {message.type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSubmit} className="p-4 border-t border-primary/30">
                    <div className="flex items-end space-x-3">
                      <span className="text-primary font-mono text-lg mb-2">{">"}</span>
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter command or speak to Neo..."
                        className="flex-1 bg-transparent text-primary font-mono border-primary/30 resize-none min-h-[40px] max-h-[120px]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                          }
                        }}
                      />
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'memory' && (
                <div className="h-full p-4 overflow-y-auto">
                  <h3 className="text-primary font-mono text-lg mb-4">MEMORY CORE</h3>
                  <div className="space-y-2">
                    {memories.map((memory) => (
                      <div key={memory.id} className="p-3 bg-muted/10 border border-muted/20 rounded">
                        <div className="text-sm text-foreground mb-2">{memory.content}</div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{memory.timestamp.toLocaleString()}</span>
                          <div className="flex items-center space-x-2">
                            <span>Priority: {memory.importance}</span>
                            <div className="flex space-x-1">
                              {memory.tags.map((tag) => (
                                <span key={tag} className="px-1 py-0.5 bg-primary/20 text-primary rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'network' && (
                <div className="h-full p-4 overflow-y-auto font-mono">
                  <h3 className="text-primary text-lg mb-4">NETWORK STATUS</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                        <div className="text-green-400 text-sm">CONNECTION STATUS</div>
                        <div className="text-green-300 text-lg">ONLINE</div>
                      </div>
                      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                        <div className="text-blue-400 text-sm">ENCRYPTION LEVEL</div>
                        <div className="text-blue-300 text-lg">MAXIMUM</div>
                      </div>
                      <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded">
                        <div className="text-purple-400 text-sm">PROXY CHAINS</div>
                        <div className="text-purple-300 text-lg">7 ACTIVE</div>
                      </div>
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                        <div className="text-yellow-400 text-sm">TRACE DETECTION</div>
                        <div className="text-yellow-300 text-lg">BLOCKED</div>
                      </div>
                    </div>
                    <div className="p-3 bg-muted/10 border border-muted/20 rounded">
                      <div className="text-primary text-sm mb-2">ACTIVE CONNECTIONS</div>
                      <div className="text-xs space-y-1">
                        <div>192.168.1.1 → TOR_EXIT_NODE_DE</div>
                        <div>10.0.0.1 → SATELLITE_UPLINK_KH11</div>
                        <div>172.16.0.1 → DARKWEB_GATEWAY_ONION</div>
                        <div>127.0.0.1 → LOCAL_AI_CORE</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'team' && (
                <div className="h-full">
                  <TeamSuite onRun={(command) => {
                    addMessage(command, 'user');
                    setActiveTab('chat');
                    executeCommand(command);
                  }} />
                </div>
              )}

              {activeTab === 'feeds' && (
                <div className="h-full">
                  <LiveFeeds onData={(items) => setFeedItems(items)} />
                </div>
              )}

              {activeTab === 'map' && (
                <div className="h-full p-4">
                  <IntelGraph items={feedItems} />
                </div>
              )}
            </div>
          </>
        )}
      </Card>

      {/* Toggle button when hidden */}
      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-full flex items-center justify-center transition-all duration-300 pointer-events-auto group"
        >
          <div className="text-center">
            <div className="text-primary font-mono text-xs font-bold">NEO</div>
            <div className="text-primary/60 font-mono text-xs">v3.0</div>
          </div>
        </button>
      )}
    </div>
  );
};

export default AdvancedNeoChat;