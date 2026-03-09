// Schema Versioning — Track contract evolution
// Reference: AIOS Master Index §70.7

export const SchemaVersions = {
  SessionState: '0.1.0',
  TaskEnvelope: '0.1.0',
  MemoryItem: '0.1.0',
  MissionObject: '0.1.0',
  ToolAction: '0.1.0',
  ConfidenceRecord: '0.1.0',
  EvaluationResult: '0.1.0',
  MemoryWriteProposal: '0.1.0',
  CanonEntry: '0.1.0',
  ContradictionRecord: '0.1.0',
  RuntimeSpineTrace: '0.1.0',
} as const;

export type SchemaName = keyof typeof SchemaVersions;

export function getVersion(schema: SchemaName): string {
  return SchemaVersions[schema];
}

export function isCompatible(required: string, actual: string): boolean {
  const [reqMajor] = required.split('.').map(Number);
  const [actMajor] = actual.split('.').map(Number);
  return reqMajor === actMajor;
}
