// Semantic ID Strategy — Prefixed UUIDs for debugging and trace readability
// Reference: AIOS Master Index §70.6

const PREFIXES = {
  session: 'ses',
  task: 'tsk',
  memory: 'mem',
  mission: 'mis',
  artifact: 'art',
  event: 'evt',
  confidence: 'cnf',
  evaluation: 'evl',
  plan: 'pln',
  claim: 'clm',
  proposal: 'prp',
  canon: 'can',
  contradiction: 'ctr',
  agent: 'agt',
  action: 'act',
  spine: 'spn',
  step: 'stp',
  workorder: 'wo',
} as const;

export type IdPrefix = keyof typeof PREFIXES;

export function makeId(prefix: IdPrefix): string {
  const uuid = crypto.randomUUID?.() ??
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  return `${PREFIXES[prefix]}_${uuid}`;
}

export function parseIdPrefix(id: string): IdPrefix | null {
  const prefix = id.split('_')[0];
  const entry = Object.entries(PREFIXES).find(([, v]) => v === prefix);
  return entry ? (entry[0] as IdPrefix) : null;
}

export function isValidSemanticId(id: string): boolean {
  const parts = id.split('_');
  if (parts.length < 2) return false;
  return Object.values(PREFIXES).includes(parts[0] as any);
}
