import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface FeedItem {
  id: string;
  title: string;
  url: string;
  author?: string;
  points?: number;
  created_at?: string;
}

interface LiveFeedsProps {
  onData?: (items: FeedItem[]) => void;
}

const LiveFeeds: React.FC<LiveFeedsProps> = ({ onData }) => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeeds = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://hn.algolia.com/api/v1/search?query=security&tags=story&hitsPerPage=30');
      const data = await res.json();
      const mapped: FeedItem[] = (data.hits || []).map((h: any) => ({
        id: String(h.objectID),
        title: h.title || h.story_title || 'Untitled',
        url: h.url || h.story_url || '#',
        author: h.author,
        points: h.points,
        created_at: h.created_at
      }));
      setItems(mapped);
      onData?.(mapped);
    } catch (e) {
      setError('Failed to load feeds. Showing sample intel.');
      const fallback: FeedItem[] = [
        { id: 's1', title: 'Zero-day exploit chatter observed in underground forums', url: '#'},
        { id: 's2', title: 'Major breach confirmed; incident response underway', url: '#'},
        { id: 's3', title: 'AI-driven phishing campaigns spike across regions', url: '#'}
      ];
      setItems(fallback);
      onData?.(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b border-primary/20">
        <div className="text-primary font-mono text-sm">GLOBAL INTEL FEEDS</div>
        <Button variant="secondary" size="sm" onClick={fetchFeeds} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {error && <div className="text-destructive text-xs font-mono">{error}</div>}
        {items.map(item => (
          <Card key={item.id} className="p-3 bg-card/60 border-primary/20 hover-scale">
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="story-link text-foreground font-mono text-sm"
            >
              {item.title}
            </a>
            <div className="mt-1 text-xs text-muted-foreground font-mono">
              {item.author ? `by ${item.author}` : 'source unknown'}
              {item.points ? ` • ${item.points} pts` : ''}
              {item.created_at ? ` • ${new Date(item.created_at).toLocaleString()}` : ''}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LiveFeeds;
