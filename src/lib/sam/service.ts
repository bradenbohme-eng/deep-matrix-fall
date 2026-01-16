// S.A.M. AI Service - Deep AI Integration for System Analysis
// Uses Lovable AI Gateway for advanced code understanding

import { supabase } from '@/integrations/supabase/client';
import {
  SAMAnalysisResult, SAMSystemMap, SAMComponent, SAMRelationship,
  SAMSuggestion, SAMIngestionJob, SAMStructure, SAMBehavior,
  SAMInterface, SAMConstraints, SAMEvidence
} from './types';
import SAMEngine from './engine';

export interface SAMAIAnalysisRequest {
  files: Array<{ path: string; content: string }>;
  analysisType: 'full' | 'structure' | 'behavior' | 'quick';
  includeAI: boolean;
  onProgress?: (job: SAMIngestionJob) => void;
}

export interface SAMAIEnhancement {
  componentDescriptions: Record<string, string>;
  relationshipInsights: Record<string, string>;
  architectureNarrative: string;
  suggestions: SAMSuggestion[];
  securityAnalysis: {
    vulnerabilities: string[];
    recommendations: string[];
  };
  performanceAnalysis: {
    bottlenecks: string[];
    optimizations: string[];
  };
}

// Stream SSE response from edge function
async function streamAIResponse(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  onDelta: (delta: string) => void
): Promise<string> {
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/neo-chat`;
  
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ messages, mode: 'sam' }),
  });

  if (!resp.ok || !resp.body) {
    throw new Error('Failed to get AI response');
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';
  let textBuffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') break;

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          onDelta(content);
        }
      } catch {
        textBuffer = line + '\n' + textBuffer;
        break;
      }
    }
  }

  return fullResponse;
}

// Generate AI-enhanced component descriptions
async function enhanceComponentDescriptions(
  components: SAMComponent[],
  onProgress?: (progress: string) => void
): Promise<Record<string, string>> {
  const descriptions: Record<string, string> = {};
  
  // Batch components for efficiency
  const componentSummary = components.slice(0, 30).map(c => 
    `- ${c.name} (${c.type}) at ${c.location}: exports [${c.exports.join(', ')}]`
  ).join('\n');

  try {
    const response = await streamAIResponse([
      {
        role: 'system',
        content: `You are S.A.M., the System Anatomy Mapping AI. Analyze code components and provide concise, technical descriptions. Output JSON only.`
      },
      {
        role: 'user',
        content: `Analyze these components and provide a JSON object mapping component names to their purpose descriptions (1-2 sentences each):

${componentSummary}

Respond with ONLY valid JSON like: {"ComponentName": "Description...", ...}`
      }
    ], (delta) => onProgress?.(`Analyzing components... ${delta.slice(0, 50)}`));

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      Object.assign(descriptions, parsed);
    }
  } catch (error) {
    console.error('AI component analysis failed:', error);
  }

  return descriptions;
}

// Generate architecture narrative
async function generateArchitectureNarrative(
  systemMap: SAMSystemMap,
  onProgress?: (progress: string) => void
): Promise<string> {
  const componentTypes = new Map<string, number>();
  for (const comp of systemMap.structure.components) {
    componentTypes.set(comp.type, (componentTypes.get(comp.type) || 0) + 1);
  }

  const typesSummary = Array.from(componentTypes.entries())
    .map(([type, count]) => `${count} ${type}s`)
    .join(', ');

  try {
    const response = await streamAIResponse([
      {
        role: 'system',
        content: `You are S.A.M., the System Anatomy Mapping AI. Write clear, technical architecture narratives.`
      },
      {
        role: 'user',
        content: `Write a 2-3 paragraph architecture overview for a system with:
- ${systemMap.sourceFiles.length} source files
- ${systemMap.structure.components.length} components (${typesSummary})
- ${systemMap.structure.relationships.length} relationships
- Key dependencies: ${systemMap.constraints.dependencies.slice(0, 10).map(d => d.name).join(', ')}

Focus on overall architecture patterns, key components, and how they interact.`
      }
    ], (delta) => onProgress?.(`Generating narrative... ${delta.slice(0, 50)}`));

    return response;
  } catch (error) {
    console.error('AI narrative generation failed:', error);
    return `This system contains ${systemMap.sourceFiles.length} source files with ${systemMap.structure.components.length} components organized in a modular architecture.`;
  }
}

// Security analysis
async function analyzeSecurityRisks(
  systemMap: SAMSystemMap,
  onProgress?: (progress: string) => void
): Promise<{ vulnerabilities: string[]; recommendations: string[] }> {
  const externalDeps = systemMap.constraints.dependencies.filter(d => d.type === 'required');
  const apiCalls = systemMap.interfaces.integrationPoints.filter(p => p.type === 'api');

  try {
    const response = await streamAIResponse([
      {
        role: 'system',
        content: `You are S.A.M., the System Anatomy Mapping AI. Analyze code for security concerns. Output JSON only.`
      },
      {
        role: 'user',
        content: `Analyze security risks for a system with:
- External dependencies: ${externalDeps.map(d => d.name).join(', ')}
- API integrations: ${apiCalls.length}
- ${systemMap.constraints.failureModes.length} documented failure modes

Output JSON: {"vulnerabilities": ["..."], "recommendations": ["..."]}`
      }
    ], (delta) => onProgress?.(`Security analysis... ${delta.slice(0, 50)}`));

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Security analysis failed:', error);
  }

  return { vulnerabilities: [], recommendations: [] };
}

// Performance analysis
async function analyzePerformance(
  systemMap: SAMSystemMap,
  onProgress?: (progress: string) => void
): Promise<{ bottlenecks: string[]; optimizations: string[] }> {
  const asyncOps = systemMap.behavior.operations.filter(o => o.async);
  const complexComponents = systemMap.structure.components.filter(c => c.complexity > 5);

  try {
    const response = await streamAIResponse([
      {
        role: 'system',
        content: `You are S.A.M., the System Anatomy Mapping AI. Analyze code for performance issues. Output JSON only.`
      },
      {
        role: 'user',
        content: `Analyze performance for a system with:
- ${asyncOps.length} async operations
- ${complexComponents.length} high-complexity components
- Total lines: ${systemMap.sourceFiles.reduce((a, f) => a + f.lines, 0)}

Output JSON: {"bottlenecks": ["..."], "optimizations": ["..."]}`
      }
    ], (delta) => onProgress?.(`Performance analysis... ${delta.slice(0, 50)}`));

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Performance analysis failed:', error);
  }

  return { bottlenecks: [], optimizations: [] };
}

// Main SAM AI Service
export class SAMAIService {
  private engine: SAMEngine;

  constructor() {
    this.engine = new SAMEngine();
  }

  async analyze(request: SAMAIAnalysisRequest): Promise<SAMAnalysisResult & { aiEnhancement?: SAMAIEnhancement }> {
    // Run base engine analysis
    const baseResult = await this.engine.ingest(request.files);

    if (!baseResult.success || !baseResult.systemMap || !request.includeAI) {
      return baseResult;
    }

    // Enhance with AI
    const progressCallback = (msg: string) => {
      if (request.onProgress) {
        request.onProgress({
          id: 'ai-enhance',
          status: 'analyzing',
          progress: 85,
          currentPhase: msg,
          startTime: new Date(),
          sourceFiles: [],
        });
      }
    };

    try {
      const [
        componentDescriptions,
        architectureNarrative,
        securityAnalysis,
        performanceAnalysis
      ] = await Promise.all([
        enhanceComponentDescriptions(baseResult.systemMap.structure.components, progressCallback),
        generateArchitectureNarrative(baseResult.systemMap, progressCallback),
        analyzeSecurityRisks(baseResult.systemMap, progressCallback),
        analyzePerformance(baseResult.systemMap, progressCallback),
      ]);

      const aiEnhancement: SAMAIEnhancement = {
        componentDescriptions,
        relationshipInsights: {},
        architectureNarrative,
        suggestions: [
          ...baseResult.suggestions,
          ...securityAnalysis.recommendations.map(r => ({
            type: 'security' as const,
            title: 'Security Recommendation',
            description: r,
            impact: 'high' as const,
            effort: 'medium' as const,
          })),
          ...performanceAnalysis.optimizations.map(o => ({
            type: 'optimization' as const,
            title: 'Performance Optimization',
            description: o,
            impact: 'medium' as const,
            effort: 'medium' as const,
          })),
        ],
        securityAnalysis,
        performanceAnalysis,
      };

      return {
        ...baseResult,
        aiEnhancement,
      };
    } catch (error) {
      console.error('AI enhancement failed:', error);
      return baseResult;
    }
  }

  // Quick analysis without full AI enhancement
  async quickAnalyze(files: Array<{ path: string; content: string }>): Promise<SAMAnalysisResult> {
    const engine = new SAMEngine({}, { enableAI: false, deepAnalysis: false });
    return engine.ingest(files);
  }

  // Generate system map document
  async generateSystemMapDocument(systemMap: SAMSystemMap): Promise<string> {
    const lines: string[] = [
      `# MASTER ${systemMap.name.toUpperCase()} SYSTEM MAP`,
      '',
      `**[TAG:SAM] [TAG:MASTER]**`,
      '',
      `**Version:** ${systemMap.version}`,
      `**Status:** ${systemMap.status}`,
      `**Generated:** ${systemMap.createdAt.toISOString()}`,
      '',
      '---',
      '',
      '## 1. SYSTEM OVERVIEW',
      '',
      `**[TAG:OVERVIEW]**`,
      '',
      `This system contains ${systemMap.sourceFiles.length} source files with ${systemMap.structure.components.length} components.`,
      '',
      '### Key Statistics',
      '',
      `- **Files:** ${systemMap.sourceFiles.length}`,
      `- **Components:** ${systemMap.structure.components.length}`,
      `- **Relationships:** ${systemMap.structure.relationships.length}`,
      `- **Total Lines:** ${systemMap.sourceFiles.reduce((a, f) => a + f.lines, 0)}`,
      '',
      `**[END:TAG:OVERVIEW]**`,
      '',
      '---',
      '',
      '## 2. STATIC STRUCTURE MAP',
      '',
      `**[TAG:STRUCTURE]**`,
      '',
      '### Core Components',
      '',
      '| Component | Type | Purpose | Location |',
      '|-----------|------|---------|----------|',
    ];

    // Add component table
    for (const comp of systemMap.structure.components.slice(0, 50)) {
      lines.push(`| ${comp.name} | ${comp.type} | ${comp.purpose.substring(0, 40)} | ${comp.location} |`);
    }

    lines.push(
      '',
      '### Component Relationships',
      '',
      '```mermaid',
      'graph TD',
    );

    // Add relationship graph (limited)
    const addedRels = new Set<string>();
    for (const rel of systemMap.structure.relationships.slice(0, 20)) {
      const key = `${rel.source}-${rel.target}`;
      if (!addedRels.has(key)) {
        addedRels.add(key);
        const srcName = rel.source.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'A';
        const tgtName = rel.target.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'B';
        lines.push(`  ${srcName} -->|${rel.type}| ${tgtName}`);
      }
    }

    lines.push(
      '```',
      '',
      `**[END:TAG:STRUCTURE]**`,
      '',
      '---',
      '',
      '## 3. DYNAMIC BEHAVIOR MAP',
      '',
      `**[TAG:BEHAVIOR]**`,
      '',
      '### Operations',
      '',
      '| Operation | Type | Trigger |',
      '|-----------|------|---------|',
    );

    for (const op of systemMap.behavior.operations.slice(0, 20)) {
      lines.push(`| ${op.name} | ${op.async ? 'async' : 'sync'} | ${op.trigger} |`);
    }

    lines.push(
      '',
      `**[END:TAG:BEHAVIOR]**`,
      '',
      '---',
      '',
      '## 4. INTERFACE & INTEGRATION MAP',
      '',
      `**[TAG:INTEGRATION]**`,
      '',
      '### Public API',
      '',
    );

    for (const api of systemMap.interfaces.publicAPI.slice(0, 20)) {
      lines.push(`- \`${api.signature}\` - ${api.description}`);
    }

    lines.push(
      '',
      `**[END:TAG:INTEGRATION]**`,
      '',
      '---',
      '',
      '## 5. CONSTRAINTS & LIMITATIONS',
      '',
      `**[TAG:PERFORMANCE] [TAG:DEPENDENCY]**`,
      '',
      '### Dependencies',
      '',
      '| Dependency | Version | Type |',
      '|------------|---------|------|',
    );

    for (const dep of systemMap.constraints.dependencies.slice(0, 20)) {
      lines.push(`| ${dep.name} | ${dep.version} | ${dep.type} |`);
    }

    lines.push(
      '',
      `**[END:TAG:PERFORMANCE] [END:TAG:DEPENDENCY]**`,
      '',
      '---',
      '',
      '## 6. EVIDENCE & VALIDATION',
      '',
      `**[TAG:SUMMARY]**`,
      '',
      '### Quality Metrics',
      '',
    );

    if (systemMap.qualityMetrics) {
      lines.push(
        `- **Perfection Score:** ${systemMap.qualityMetrics.perfectionScore.toFixed(1)}/100`,
        `- **Completeness:** ${systemMap.qualityMetrics.completeness.score.toFixed(1)}%`,
        `- **Consistency:** ${systemMap.qualityMetrics.consistency.score.toFixed(1)}%`,
        `- **Evidence:** ${systemMap.qualityMetrics.evidence.score.toFixed(1)}%`,
      );
    }

    lines.push(
      '',
      `**[END:TAG:SUMMARY]**`,
      '',
      '---',
      '',
      `*Generated by S.A.M. v${systemMap.version}*`
    );

    return lines.join('\n');
  }
}

export const samAIService = new SAMAIService();
export default samAIService;
