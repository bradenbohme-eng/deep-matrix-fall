

# Redesign Context Lab for Clarity and Usability

## The Problem

The current Context Lab page is confusing because:
1. No guidance on what to do when you land on it
2. When you run a test, most methods return **empty results** (CMC, RAG, Naive all return `[]`) because the database has very little indexed data — but the UI shows `0%` everywhere with no explanation
3. BCI returns 3 entities with `0` relevance score — but doesn't explain why
4. No system health check to show which data sources actually have data
5. No visual indication of "is this thing even connected and working?"

## What Changes

### 1. Add a System Health Panel at the top
Before running any comparison, show a live health check that queries each data source and displays:
- **BCI Entities**: X indexed (with status badge: green if >0, red if 0)
- **Memory Atoms**: X stored
- **RAG Chunks**: X available  
- **Edge Functions**: context-sync reachable / cmc-engine reachable (ping test)

This immediately tells the user what's populated and what's empty, so they understand *why* results are sparse.

### 2. Add a "Quick Start" guide card
When there are no results yet, show a prominent card explaining:
- "Select a preset scenario on the left, then click Run Comparison"
- "Methods with no data in their backing store will return 0 results — seed data first using the main app"
- Visual arrows pointing to the preset buttons and run button

### 3. Improve empty state handling in result cards
When a method returns 0 results, instead of showing `0ms, 0 entities, 0%` (which looks broken), show a clear message: "No data found — this method's backing store (aimos_memory_atoms) is empty. Index data first."

### 4. Add a "Seed Test Data" button
One-click button that indexes a handful of sample BCI entities from the actual codebase files so the user can immediately see meaningful comparison results. Calls `context-sync` with `index_entity` for 5-10 known entities.

### 5. Better visual feedback during and after runs
- Progress bar showing which methods are currently running
- Color-coded result cards (green border for winner, yellow for runner-up, gray for empty)
- Large, clear winner announcement banner instead of small text

## Files Changed

| File | What |
|------|------|
| `src/pages/ContextLab.tsx` | Add health panel, quick start guide, seed data button, improved empty states, progress indicators |

