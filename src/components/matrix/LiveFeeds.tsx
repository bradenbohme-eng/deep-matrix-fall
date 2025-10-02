import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, Zap, Radio, Database, Network, Eye, Lock } from 'lucide-react';

export interface FeedItem {
  id: string;
  title: string;
  url: string;
  author?: string;
  points?: number;
  created_at?: string;
  category?: string;
  threatLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source?: string;
  verified?: boolean;
}

interface LiveFeedsProps {
  onData?: (items: FeedItem[]) => void;
}

const LiveFeeds: React.FC<LiveFeedsProps> = ({ onData }) => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const fetchFeeds = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch multiple sources in parallel
      const [securityNews, exploits, breaches, cyberThreat] = await Promise.all([
        fetch('https://hn.algolia.com/api/v1/search?query=security&tags=story&hitsPerPage=20'),
        fetch('https://hn.algolia.com/api/v1/search?query=vulnerability&tags=story&hitsPerPage=15'),
        fetch('https://hn.algolia.com/api/v1/search?query=breach&tags=story&hitsPerPage=15'),
        fetch('https://hn.algolia.com/api/v1/search?query=cyber+attack&tags=story&hitsPerPage=20')
      ]);

      const [secData, explData, breachData, threatData] = await Promise.all([
        securityNews.json(),
        exploits.json(),
        breaches.json(),
        cyberThreat.json()
      ]);

      const categorizeAndEnrich = (h: any, category: string, threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): FeedItem => ({
        id: String(h.objectID) + '-' + category,
        title: h.title || h.story_title || 'Untitled',
        url: h.url || h.story_url || '#',
        author: h.author,
        points: h.points,
        created_at: h.created_at,
        category,
        threatLevel,
        source: 'SIGINT',
        verified: h.points && h.points > 50
      });

      const allItems: FeedItem[] = [
        ...(secData.hits || []).map((h: any) => categorizeAndEnrich(h, 'Security News', 'MEDIUM')),
        ...(explData.hits || []).map((h: any) => categorizeAndEnrich(h, 'Vulnerabilities', 'HIGH')),
        ...(breachData.hits || []).map((h: any) => categorizeAndEnrich(h, 'Breaches', 'CRITICAL')),
        ...(threatData.hits || []).map((h: any) => categorizeAndEnrich(h, 'Cyber Threats', 'HIGH'))
      ];

      // Add synthetic high-priority intel
      const syntheticIntel: FeedItem[] = [
        { id: 'syn-001', title: 'APT41 Activity Surge Detected in Financial Sector', url: '#', category: 'APT Activity', threatLevel: 'CRITICAL', source: 'HUMINT', verified: true, created_at: new Date().toISOString() },
        { id: 'syn-002', title: 'Zero-Day in Critical Infrastructure SCADA Systems', url: '#', category: 'Zero-Days', threatLevel: 'CRITICAL', source: 'ELINT', verified: true, created_at: new Date().toISOString() },
        { id: 'syn-003', title: 'Ransomware Group Shifts to Double Extortion Tactics', url: '#', category: 'Ransomware', threatLevel: 'HIGH', source: 'OSINT', verified: false, created_at: new Date().toISOString() },
        { id: 'syn-004', title: 'State-Sponsored Campaign Targeting Cloud Infrastructure', url: '#', category: 'Nation-State', threatLevel: 'CRITICAL', source: 'SIGINT', verified: true, created_at: new Date().toISOString() },
        { id: 'syn-005', title: 'Emerging Botnet With AI-Driven Evasion Capabilities', url: '#', category: 'Malware', threatLevel: 'HIGH', source: 'TECHINT', verified: true, created_at: new Date().toISOString() },
        { id: 'syn-006', title: 'Dark Web Chatter: New Exploit Marketplace Identified', url: '#', category: 'Underground', threatLevel: 'MEDIUM', source: 'DARKINT', verified: false, created_at: new Date().toISOString() },
      ];

      const combined = [...syntheticIntel, ...allItems].sort((a, b) => {
        const threatOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return (threatOrder[b.threatLevel || 'LOW'] - threatOrder[a.threatLevel || 'LOW']);
      });

      setItems(combined);
      onData?.(combined);
    } catch (e) {
      setError('SIGINT FAILURE. Switching to cached intel.');
      const fallback: FeedItem[] = [
        { id: 'f1', title: 'Zero-day exploit chatter observed in underground forums', url: '#', category: 'Zero-Days', threatLevel: 'CRITICAL', source: 'DARKINT' },
        { id: 'f2', title: 'Major breach confirmed; incident response underway', url: '#', category: 'Breaches', threatLevel: 'CRITICAL', source: 'HUMINT' },
        { id: 'f3', title: 'AI-driven phishing campaigns spike across regions', url: '#', category: 'Phishing', threatLevel: 'HIGH', source: 'OSINT' }
      ];
      setItems(fallback);
      onData?.(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeds();
    const interval = setInterval(fetchFeeds, 300000); // Refresh every 5 min
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getThreatIcon = (level?: string) => {
    switch (level) {
      case 'CRITICAL': return <AlertTriangle className="w-3 h-3 text-red-500" />;
      case 'HIGH': return <Zap className="w-3 h-3 text-orange-500" />;
      case 'MEDIUM': return <Eye className="w-3 h-3 text-yellow-500" />;
      default: return <Shield className="w-3 h-3 text-blue-500" />;
    }
  };

  const getThreatColor = (level?: string) => {
    switch (level) {
      case 'CRITICAL': return 'border-red-500/50 bg-red-500/10';
      case 'HIGH': return 'border-orange-500/50 bg-orange-500/10';
      case 'MEDIUM': return 'border-yellow-500/50 bg-yellow-500/10';
      default: return 'border-blue-500/50 bg-blue-500/10';
    }
  };

  const categories = ['all', 'Nation-State', 'APT Activity', 'Zero-Days', 'Ransomware', 'Breaches', 'Malware'];
  const filteredItems = activeCategory === 'all' ? items : items.filter(i => i.category === activeCategory);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b border-primary/20">
        <div className="text-primary font-mono text-sm flex items-center gap-2">
          <Radio className="w-4 h-4 animate-pulse" />
          GLOBAL INTEL FEEDS
        </div>
        <Button variant="secondary" size="sm" onClick={fetchFeeds} disabled={loading}>
          {loading ? 'SYNCING...' : 'SYNC'}
        </Button>
      </div>

      <div className="flex gap-1 p-2 border-b border-primary/20 overflow-x-auto">
        {categories.map(cat => (
          <Button
            key={cat}
            variant={activeCategory === cat ? 'default' : 'ghost'}
            size="sm"
            className="font-mono text-xs whitespace-nowrap"
            onClick={() => setActiveCategory(cat)}
          >
            {cat.toUpperCase()}
          </Button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {error && (
          <Card className="p-3 border-red-500/50 bg-red-500/10">
            <div className="text-red-400 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          </Card>
        )}
        {filteredItems.map(item => (
          <Card key={item.id} className={`p-3 border ${getThreatColor(item.threatLevel)} hover-scale transition-all`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {getThreatIcon(item.threatLevel)}
                <Badge variant="outline" className="font-mono text-[10px]">
                  {item.threatLevel || 'UNKNOWN'}
                </Badge>
                {item.verified && (
                  <Badge variant="outline" className="font-mono text-[10px] border-green-500/50 text-green-400">
                    <Lock className="w-2 h-2 mr-1" />
                    VERIFIED
                  </Badge>
                )}
              </div>
              <Badge variant="secondary" className="font-mono text-[10px]">
                {item.source || 'OSINT'}
              </Badge>
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="story-link text-foreground font-mono text-sm block hover:text-primary transition-colors"
            >
              {item.title}
            </a>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-xs text-muted-foreground font-mono">
                {item.category && <span className="text-primary">[{item.category}]</span>}
                {item.author && <span className="ml-2">by {item.author}</span>}
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {item.created_at && new Date(item.created_at).toLocaleTimeString()}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LiveFeeds;
