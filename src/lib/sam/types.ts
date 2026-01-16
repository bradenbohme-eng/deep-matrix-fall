// S.A.M. - System Anatomy Mapping Types
// The most advanced codebase architectural mapping system

export interface SAMConfig {
  version: string;
  build: {
    monolithOutput: string;
    manifestOutput: string;
    indexOutput: string;
    deterministic: boolean;
  };
  phases: SAMPhase[];
  tags: {
    registryFile: string;
    strictMode: boolean;
  };
  index: {
    generate: boolean;
    includeDependencies: boolean;
    includeTags: boolean;
  };
}

export interface SAMPhase {
  name: string;
  id: string;
  order: number;
  files: string[];
}

export interface SAMTag {
  name: string;
  description: string;
  required: boolean;
  scope: 'document' | 'section';
  pairsWith?: string[];
  mustPair?: boolean;
}

export interface SAMTagRegistry {
  version: string;
  tags: SAMTag[];
  validation: {
    strictMode: boolean;
    requirePairs: boolean;
    nestAllowed: boolean;
  };
}

// The Five Dimensions (Universal Schema)
export interface SAMStructure {
  components: SAMComponent[];
  relationships: SAMRelationship[];
  hierarchy: SAMHierarchyNode[];
  ownership: SAMOwnership[];
}

export interface SAMBehavior {
  lifecycle: SAMLifecyclePhase[];
  flows: SAMFlow[];
  operations: SAMOperation[];
  stateTransitions: SAMStateTransition[];
  timing: SAMTiming[];
}

export interface SAMInterface {
  publicAPI: SAMAPIMethod[];
  contracts: SAMContract[];
  entryPoints: SAMEntryPoint[];
  integrationPoints: SAMIntegrationPoint[];
  errorHandling: SAMErrorHandler[];
}

export interface SAMConstraints {
  performanceLimits: SAMPerformanceLimit[];
  invariants: SAMInvariant[];
  assumptions: SAMAssumption[];
  dependencies: SAMDependency[];
  failureModes: SAMFailureMode[];
}

export interface SAMEvidence {
  testCoverage: SAMTestCoverage;
  performanceMetrics: SAMPerformanceMetric[];
  validationResults: SAMValidationResult[];
  examples: SAMExample[];
  monitoring: SAMMonitoring;
}

// Component Types
export interface SAMComponent {
  id: string;
  name: string;
  type: 'class' | 'module' | 'function' | 'component' | 'service' | 'hook' | 'utility' | 'type' | 'interface';
  purpose: string;
  location: string;
  size: number; // lines of code
  complexity: number; // cyclomatic complexity
  dependencies: string[];
  exports: string[];
  imports: string[];
  tags: string[];
}

export interface SAMRelationship {
  id: string;
  source: string;
  target: string;
  type: 'imports' | 'exports' | 'extends' | 'implements' | 'uses' | 'owns' | 'depends_on' | 'calls' | 'creates';
  strength: number; // 0-1
  description?: string;
}

export interface SAMHierarchyNode {
  id: string;
  name: string;
  level: number;
  parent?: string;
  children: string[];
  type: 'system' | 'subsystem' | 'module' | 'component' | 'function';
}

export interface SAMOwnership {
  owner: string;
  owned: string;
  type: 'composition' | 'aggregation' | 'reference';
}

// Behavior Types
export interface SAMLifecyclePhase {
  name: string;
  order: number;
  description: string;
  operations: string[];
}

export interface SAMFlow {
  id: string;
  name: string;
  type: 'data' | 'control' | 'event';
  steps: SAMFlowStep[];
  triggers: string[];
}

export interface SAMFlowStep {
  id: string;
  name: string;
  type: 'process' | 'decision' | 'io' | 'start' | 'end';
  input?: string;
  output?: string;
  next?: string[];
}

export interface SAMOperation {
  id: string;
  name: string;
  trigger: string;
  sequence: string[];
  output: string;
  async: boolean;
}

export interface SAMStateTransition {
  from: string;
  to: string;
  event: string;
  condition?: string;
}

export interface SAMTiming {
  operation: string;
  type: 'sync' | 'async' | 'scheduled' | 'triggered';
  frequency?: string;
  timeout?: number;
}

// Interface Types
export interface SAMAPIMethod {
  name: string;
  signature: string;
  description: string;
  parameters: SAMParameter[];
  returnType: string;
  async: boolean;
  visibility: 'public' | 'private' | 'protected';
}

export interface SAMParameter {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description?: string;
}

export interface SAMContract {
  method: string;
  inputType: string;
  outputType: string;
  errors: string[];
  preconditions?: string[];
  postconditions?: string[];
}

export interface SAMEntryPoint {
  name: string;
  type: 'initialization' | 'configuration' | 'usage';
  signature: string;
  description: string;
}

export interface SAMIntegrationPoint {
  externalSystem: string;
  type: 'api' | 'event' | 'file' | 'database' | 'message';
  dataFlow: string;
  frequency: string;
  protocol?: string;
}

export interface SAMErrorHandler {
  errorType: string;
  cause: string;
  impact: string;
  recovery: string;
}

// Constraint Types
export interface SAMPerformanceLimit {
  metric: string;
  limit: string;
  measurement: string;
  notes?: string;
}

export interface SAMInvariant {
  id: string;
  description: string;
  enforced: boolean;
  verification: string;
}

export interface SAMAssumption {
  id: string;
  description: string;
  category: 'precondition' | 'environment' | 'external';
  validated: boolean;
}

export interface SAMDependency {
  name: string;
  version: string;
  type: 'required' | 'optional' | 'peer' | 'dev';
  purpose: string;
}

export interface SAMFailureMode {
  type: string;
  cause: string;
  impact: string;
  recovery: string;
  probability?: 'low' | 'medium' | 'high';
}

// Evidence Types
export interface SAMTestCoverage {
  totalTests: number;
  unitTests: number;
  integrationTests: number;
  e2eTests: number;
  coveragePercent: number;
  byComponent: Record<string, { tests: number; coverage: number }>;
}

export interface SAMPerformanceMetric {
  metric: string;
  target: string;
  actual: string;
  status: 'pass' | 'fail' | 'warning';
}

export interface SAMValidationResult {
  type: string;
  status: 'pass' | 'fail' | 'warning';
  details?: string;
  timestamp: Date;
}

export interface SAMExample {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
}

export interface SAMMonitoring {
  logging: { level: string; format: string };
  metrics: { type: string; exported: boolean };
  traces: { enabled: boolean; provider?: string };
  alerts: { type: string; threshold?: string }[];
}

// Section & Document Types
export interface SAMSection {
  id: string; // SHA1 hash
  sourceFile: string;
  sourceHash: string; // SHA256
  title: string;
  tags: string[];
  content: string;
  startLine: number;
  endLine: number;
  lastUpdated: Date;
  
  // Five Dimensions (when analyzed)
  structure?: SAMStructure;
  behavior?: SAMBehavior;
  interfaces?: SAMInterface;
  constraints?: SAMConstraints;
  evidence?: SAMEvidence;
}

export interface SAMSourceFile {
  path: string;
  name: string;
  hash: string;
  content: string;
  language: string;
  size: number;
  lines: number;
  sections: SAMSection[];
  lastModified: Date;
}

// Three Artifacts
export interface SAMMonolith {
  version: string;
  buildTimestamp: Date;
  builderVersion: string;
  sourceFiles: number;
  totalLines: number;
  content: string;
  tableOfContents: SAMTOCEntry[];
}

export interface SAMTOCEntry {
  title: string;
  anchor: string;
  level: number;
  sourceFile: string;
}

export interface SAMManifest {
  version: string;
  buildTimestamp: Date;
  configSource: string;
  configHash: string;
  sections: SAMManifestSection[];
  integrityRoot: string; // Merkle root
  buildMetadata: {
    builderVersion: string;
    buildCommand: string;
    deterministic: boolean;
    orderingSource: string;
  };
  qualityMetrics: SAMQualityMetrics;
}

export interface SAMManifestSection {
  sectionId: string;
  sourceFile: string;
  sourceHash: string;
  monolithAnchor: string;
  monolithStartLine: number;
  monolithEndLine: number;
  compiledHash: string;
  tags: string[];
  lastUpdated: Date;
}

export interface SAMIndex {
  version: string;
  buildTimestamp: Date;
  sections: Record<string, SAMIndexSection>;
  tags: Record<string, string[]>;
  dependencies: SAMIndexDependency[];
  metadata: {
    totalSections: number;
    totalTags: number;
    totalDependencies: number;
    totalComponents: number;
    totalRelationships: number;
  };
}

export interface SAMIndexSection {
  sectionId: string;
  sourceFile: string;
  anchor: string;
  title: string;
  tags: string[];
  monolithStartLine: number;
  monolithEndLine: number;
  hash: string;
}

export interface SAMIndexDependency {
  from: string;
  to: string;
  type: string;
  strength: number;
}

// Quality Metrics
export interface SAMQualityMetrics {
  perfectionScore: number;
  completeness: SAMCompletenessScore;
  consistency: SAMConsistencyScore;
  evidence: SAMEvidenceScore;
  readability: SAMReadabilityScore;
  maintenance: SAMMaintenanceScore;
}

export interface SAMCompletenessScore {
  score: number;
  structureMap: number;
  behaviorMap: number;
  integrationPoints: number;
  constraints: number;
  evidence: number;
}

export interface SAMConsistencyScore {
  score: number;
  tagCompliance: number;
  formatCompliance: number;
  schemaCompliance: number;
}

export interface SAMEvidenceScore {
  score: number;
  testCoverage: number;
  performanceMetrics: number;
  validationResults: number;
}

export interface SAMReadabilityScore {
  score: number;
  fleschReadingEase: number;
  averageSentenceLength: number;
  technicalTerms: number;
}

export interface SAMMaintenanceScore {
  score: number;
  lastUpdated: Date;
  daysSinceUpdate: number;
  updateFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'stale';
}

// System Map (Complete Document)
export interface SAMSystemMap {
  id: string;
  name: string;
  version: string;
  status: 'draft' | 'review' | 'production';
  createdAt: Date;
  updatedAt: Date;
  
  // Core metadata
  sourceFiles: SAMSourceFile[];
  sections: SAMSection[];
  
  // Five Dimensions (aggregated)
  structure: SAMStructure;
  behavior: SAMBehavior;
  interfaces: SAMInterface;
  constraints: SAMConstraints;
  evidence: SAMEvidence;
  
  // Artifacts
  monolith?: SAMMonolith;
  manifest?: SAMManifest;
  index?: SAMIndex;
  
  // Quality
  qualityMetrics?: SAMQualityMetrics;
}

// Analysis Results
export interface SAMAnalysisResult {
  success: boolean;
  timestamp: Date;
  duration: number; // ms
  
  // Analysis outputs
  systemMap?: SAMSystemMap;
  errors: SAMAnalysisError[];
  warnings: SAMAnalysisWarning[];
  suggestions: SAMSuggestion[];
  
  // Stats
  stats: {
    filesAnalyzed: number;
    componentsFound: number;
    relationshipsFound: number;
    tagsExtracted: number;
    linesProcessed: number;
  };
}

export interface SAMAnalysisError {
  code: string;
  message: string;
  file?: string;
  line?: number;
  severity: 'error' | 'critical';
}

export interface SAMAnalysisWarning {
  code: string;
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

export interface SAMSuggestion {
  type: 'improvement' | 'optimization' | 'security' | 'documentation';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  file?: string;
}

// Ingestion Pipeline Types
export interface SAMIngestionJob {
  id: string;
  status: 'pending' | 'analyzing' | 'mapping' | 'tagging' | 'indexing' | 'compiling' | 'complete' | 'error';
  progress: number;
  currentPhase: string;
  startTime: Date;
  endTime?: Date;
  sourceFiles: string[];
  result?: SAMAnalysisResult;
  error?: string;
}

export interface SAMIngestionConfig {
  includePatterns: string[];
  excludePatterns: string[];
  maxFileSize: number;
  maxFiles: number;
  enableAI: boolean;
  deepAnalysis: boolean;
  generateMonolith: boolean;
  generateEvidence: boolean;
}

// Default configurations
export const DEFAULT_SAM_CONFIG: SAMConfig = {
  version: '3.0.0',
  build: {
    monolithOutput: 'SAM_MASTER_MONOLITH.md',
    manifestOutput: 'SAM_MANIFEST.json',
    indexOutput: 'SAM_INDEX.json',
    deterministic: true,
  },
  phases: [],
  tags: {
    registryFile: 'sam_tags_registry.yaml',
    strictMode: true,
  },
  index: {
    generate: true,
    includeDependencies: true,
    includeTags: true,
  },
};

export const DEFAULT_TAG_REGISTRY: SAMTagRegistry = {
  version: '3.0.0',
  tags: [
    { name: 'TAG:SAM', description: 'System Anatomy Mapping marker', required: true, scope: 'document' },
    { name: 'TAG:OVERVIEW', description: 'System overview section', required: true, scope: 'section', pairsWith: ['END:TAG:OVERVIEW'] },
    { name: 'TAG:STRUCTURE', description: 'Static structure section', required: true, scope: 'section', pairsWith: ['END:TAG:STRUCTURE'] },
    { name: 'TAG:BEHAVIOR', description: 'Dynamic behavior section', required: true, scope: 'section', pairsWith: ['END:TAG:BEHAVIOR'] },
    { name: 'TAG:INTEGRATION', description: 'Interface & integration section', required: true, scope: 'section', pairsWith: ['END:TAG:INTEGRATION'] },
    { name: 'TAG:PERFORMANCE', description: 'Performance constraints', required: true, scope: 'section', pairsWith: ['END:TAG:PERFORMANCE'] },
    { name: 'TAG:DEPENDENCY', description: 'Dependencies and assumptions', required: true, scope: 'section', pairsWith: ['END:TAG:DEPENDENCY'] },
    { name: 'TAG:SUMMARY', description: 'Evidence & validation section', required: true, scope: 'section', pairsWith: ['END:TAG:SUMMARY'] },
    { name: 'TAG:RELATIONSHIP', description: 'Relationship matrix section', required: false, scope: 'section', pairsWith: ['END:TAG:RELATIONSHIP'] },
  ],
  validation: {
    strictMode: true,
    requirePairs: true,
    nestAllowed: false,
  },
};

export const DEFAULT_INGESTION_CONFIG: SAMIngestionConfig = {
  includePatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.json', '**/*.md'],
  excludePatterns: ['node_modules/**', 'dist/**', '.git/**', '*.test.*', '*.spec.*'],
  maxFileSize: 1024 * 1024, // 1MB
  maxFiles: 1000,
  enableAI: true,
  deepAnalysis: true,
  generateMonolith: true,
  generateEvidence: true,
};
