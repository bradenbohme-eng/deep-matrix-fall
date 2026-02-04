// Context Manager - Three-tier context management with drift detection
// Tiers: Pinned (non-negotiables) → Working Set (current task) → Long-term (searchable store)

import type {
  ContextState,
  ContextItem,
  ContextPolicy,
  UUID,
  Timestamp,
} from './types';
import { EventStore } from './eventStore';

// ============================================================================
// UTILITIES
// ============================================================================

function generateUUID(): UUID {
  return crypto.randomUUID?.() ?? 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token
  return Math.ceil(text.length / 4);
}

// ============================================================================
// CONTEXT MANAGER CLASS
// ============================================================================

export class ContextManager {
  private pinned: ContextItem[] = [];
  private workingSet: ContextItem[] = [];
  private longTermRefs: UUID[] = [];
  private longTermStore: Map<UUID, ContextItem> = new Map();
  private policy: ContextPolicy;
  private eventStore: EventStore;
  private actionsSinceSummarize = 0;

  constructor(eventStore: EventStore, policy?: ContextPolicy) {
    this.eventStore = eventStore;
    this.policy = policy ?? {
      max_pinned_tokens: 4000,
      max_working_tokens: 8000,
      summarize_after_actions: 10,
      drift_detection_enabled: true,
      drift_threshold: 0.3,
    };
  }

  // --------------------------------------------------------------------------
  // Pinned Context (Non-negotiables)
  // --------------------------------------------------------------------------

  addPinned(item: Omit<ContextItem, 'id' | 'pinned' | 'added_at'>): ContextItem {
    const contextItem: ContextItem = {
      id: generateUUID(),
      ...item,
      pinned: true,
      added_at: Date.now(),
    };

    // Check token budget
    const currentTokens = this.getPinnedTokens();
    if (currentTokens + contextItem.tokens > this.policy.max_pinned_tokens) {
      // Try to make room by removing lowest priority items
      this.evictPinned(contextItem.tokens);
    }

    this.pinned.push(contextItem);
    this.pinned.sort((a, b) => b.priority - a.priority);

    this.logContextUpdate();
    return contextItem;
  }

  removePinned(itemId: UUID): boolean {
    const index = this.pinned.findIndex(i => i.id === itemId);
    if (index === -1) return false;

    this.pinned.splice(index, 1);
    this.logContextUpdate();
    return true;
  }

  getPinned(): ContextItem[] {
    return [...this.pinned];
  }

  getPinnedTokens(): number {
    return this.pinned.reduce((sum, item) => sum + item.tokens, 0);
  }

  private evictPinned(neededTokens: number): void {
    // Sort by priority ascending (lowest first)
    const sortedByPriority = [...this.pinned].sort((a, b) => a.priority - b.priority);
    let freedTokens = 0;

    for (const item of sortedByPriority) {
      if (freedTokens >= neededTokens) break;
      
      // Move to long-term storage instead of deleting
      this.moveToLongTerm(item);
      this.pinned = this.pinned.filter(i => i.id !== item.id);
      freedTokens += item.tokens;
    }
  }

  // --------------------------------------------------------------------------
  // Working Set (Current Task Context)
  // --------------------------------------------------------------------------

  addToWorkingSet(item: Omit<ContextItem, 'id' | 'added_at'>): ContextItem {
    const contextItem: ContextItem = {
      id: generateUUID(),
      ...item,
      added_at: Date.now(),
    };

    // Check token budget
    const currentTokens = this.getWorkingSetTokens();
    if (currentTokens + contextItem.tokens > this.policy.max_working_tokens) {
      this.evictWorkingSet(contextItem.tokens);
    }

    this.workingSet.push(contextItem);
    this.workingSet.sort((a, b) => b.priority - a.priority);

    this.actionsSinceSummarize++;
    if (this.actionsSinceSummarize >= this.policy.summarize_after_actions) {
      this.summarizeWorkingSet();
    }

    this.logContextUpdate();
    return contextItem;
  }

  removeFromWorkingSet(itemId: UUID): boolean {
    const index = this.workingSet.findIndex(i => i.id === itemId);
    if (index === -1) return false;

    this.workingSet.splice(index, 1);
    this.logContextUpdate();
    return true;
  }

  clearWorkingSet(): void {
    // Move all to long-term before clearing
    for (const item of this.workingSet) {
      this.moveToLongTerm(item);
    }
    this.workingSet = [];
    this.logContextUpdate();
  }

  getWorkingSet(): ContextItem[] {
    return [...this.workingSet];
  }

  getWorkingSetTokens(): number {
    return this.workingSet.reduce((sum, item) => sum + item.tokens, 0);
  }

  private evictWorkingSet(neededTokens: number): void {
    const sortedByPriority = [...this.workingSet].sort((a, b) => a.priority - b.priority);
    let freedTokens = 0;

    for (const item of sortedByPriority) {
      if (freedTokens >= neededTokens) break;
      
      this.moveToLongTerm(item);
      this.workingSet = this.workingSet.filter(i => i.id !== item.id);
      freedTokens += item.tokens;
    }
  }

  private summarizeWorkingSet(): void {
    if (this.workingSet.length < 3) return;

    // Group similar items and create summaries
    const summaries: Record<string, ContextItem[]> = {};
    for (const item of this.workingSet) {
      const key = item.type;
      if (!summaries[key]) summaries[key] = [];
      summaries[key].push(item);
    }

    const newWorkingSet: ContextItem[] = [];
    for (const [type, items] of Object.entries(summaries)) {
      if (items.length <= 2) {
        newWorkingSet.push(...items);
        continue;
      }

      // Create summary
      const combinedContent = items.map(i => i.content).join('\n---\n');
      const summaryContent = this.createSummary(combinedContent);
      
      newWorkingSet.push({
        id: generateUUID(),
        type: 'summary',
        content: summaryContent,
        tokens: estimateTokens(summaryContent),
        priority: Math.max(...items.map(i => i.priority)),
        pinned: false,
        added_at: Date.now(),
      });

      // Move originals to long-term
      for (const item of items) {
        this.moveToLongTerm(item);
      }
    }

    this.workingSet = newWorkingSet;
    this.actionsSinceSummarize = 0;
    this.logContextUpdate();
  }

  private createSummary(content: string): string {
    // Simple extractive summary - take first sentence of each paragraph
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    const sentences = paragraphs
      .map(p => p.split(/[.!?]/)[0]?.trim())
      .filter(s => s && s.length > 10)
      .slice(0, 5);
    
    return `Summary:\n${sentences.map(s => `• ${s}`).join('\n')}`;
  }

  // --------------------------------------------------------------------------
  // Long-term Storage
  // --------------------------------------------------------------------------

  private moveToLongTerm(item: ContextItem): void {
    this.longTermStore.set(item.id, item);
    if (!this.longTermRefs.includes(item.id)) {
      this.longTermRefs.push(item.id);
    }
  }

  searchLongTerm(query: string, limit = 5): ContextItem[] {
    const queryWords = query.toLowerCase().split(/\s+/);
    const results: { item: ContextItem; score: number }[] = [];

    for (const item of this.longTermStore.values()) {
      const contentLower = item.content.toLowerCase();
      const matchCount = queryWords.filter(w => contentLower.includes(w)).length;
      const score = matchCount / queryWords.length;
      
      if (score > 0) {
        results.push({ item, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.item);
  }

  retrieveFromLongTerm(itemId: UUID): ContextItem | undefined {
    return this.longTermStore.get(itemId);
  }

  getLongTermCount(): number {
    return this.longTermStore.size;
  }

  // --------------------------------------------------------------------------
  // Context Selection
  // --------------------------------------------------------------------------

  selectContext(maxTokens: number): ContextItem[] {
    const selected: ContextItem[] = [];
    let usedTokens = 0;

    // Always include all pinned items first
    for (const item of this.pinned) {
      if (usedTokens + item.tokens <= maxTokens) {
        selected.push(item);
        usedTokens += item.tokens;
      }
    }

    // Add working set items by priority
    const sortedWorking = [...this.workingSet].sort((a, b) => b.priority - a.priority);
    for (const item of sortedWorking) {
      if (usedTokens + item.tokens <= maxTokens) {
        selected.push(item);
        usedTokens += item.tokens;
      }
    }

    return selected;
  }

  // --------------------------------------------------------------------------
  // Drift Detection
  // --------------------------------------------------------------------------

  detectDrift(currentOutput: string): { drifted: boolean; violations: string[] } {
    if (!this.policy.drift_detection_enabled) {
      return { drifted: false, violations: [] };
    }

    const violations: string[] = [];
    const outputLower = currentOutput.toLowerCase();

    for (const constraint of this.pinned.filter(p => p.type === 'constraint')) {
      // Extract key terms from constraint
      const keyTerms = constraint.content
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 4);

      // Check if output respects constraint
      const matchCount = keyTerms.filter(term => outputLower.includes(term)).length;
      const matchRatio = keyTerms.length > 0 ? matchCount / keyTerms.length : 1;

      if (matchRatio < this.policy.drift_threshold) {
        violations.push(`Constraint may be violated: "${constraint.content.substring(0, 50)}..."`);
      }
    }

    if (violations.length > 0) {
      this.eventStore.append('CONTEXT_DRIFT_DETECTED', {
        violations,
        constraint_count: this.pinned.filter(p => p.type === 'constraint').length,
      });
    }

    return {
      drifted: violations.length > 0,
      violations,
    };
  }

  // --------------------------------------------------------------------------
  // State Management
  // --------------------------------------------------------------------------

  getState(): ContextState {
    return {
      pinned: [...this.pinned],
      working_set: [...this.workingSet],
      long_term_refs: [...this.longTermRefs],
      total_tokens: this.getPinnedTokens() + this.getWorkingSetTokens(),
      max_tokens: this.policy.max_pinned_tokens + this.policy.max_working_tokens,
    };
  }

  private logContextUpdate(): void {
    this.eventStore.append('CONTEXT_UPDATED', {
      items: [...this.pinned, ...this.workingSet],
    });
  }

  // --------------------------------------------------------------------------
  // Import/Export
  // --------------------------------------------------------------------------

  export(): {
    pinned: ContextItem[];
    workingSet: ContextItem[];
    longTerm: ContextItem[];
  } {
    return {
      pinned: [...this.pinned],
      workingSet: [...this.workingSet],
      longTerm: Array.from(this.longTermStore.values()),
    };
  }

  import(data: ReturnType<typeof this.export>): void {
    this.pinned = data.pinned;
    this.workingSet = data.workingSet;
    this.longTermStore.clear();
    this.longTermRefs = [];
    for (const item of data.longTerm) {
      this.longTermStore.set(item.id, item);
      this.longTermRefs.push(item.id);
    }
  }

  clear(): void {
    this.pinned = [];
    this.workingSet = [];
    this.longTermStore.clear();
    this.longTermRefs = [];
    this.actionsSinceSummarize = 0;
  }
}
