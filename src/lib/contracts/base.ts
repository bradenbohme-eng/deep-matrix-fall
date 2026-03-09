// Contracts Package — Canonical Object Definitions
// Reference: AIOS Master Index §70

export interface BaseMeta {
  id: string;
  schemaVersion: string;
  createdAt: string; // ISO 8601
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  scope: ScopeRef;
  tags?: string[];
}

export interface ScopeRef {
  userId?: string;
  workspaceId?: string;
  projectId?: string;
  missionId?: string;
  sessionId?: string;
  privacyClass: PrivacyClass;
}

export type PrivacyClass = 'public' | 'private' | 'sensitive' | 'restricted';
