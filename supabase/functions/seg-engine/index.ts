import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ═══════════════════════════════════════════════════════════
// SEG ENGINE — Symbolic Evidence Graph
// Handles: extract entities, build relationships, query graph
// ═══════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const body = await req.json();

    switch (body.action) {
      case "extract":
        return await handleExtract(supabase, lovableKey, body);
      case "neighbors":
        return await handleNeighbors(supabase, body);
      case "stats":
        return await handleStats(supabase);
      default:
        return json({ error: "Unknown action", actions: ["extract", "neighbors", "stats"] }, 400);
    }
  } catch (e) {
    console.error("[SEG] Error:", e);
    return json({ error: e.message }, 500);
  }
});

// ── EXTRACT: Pull entities and relationships from text via AI ──
async function handleExtract(supabase: any, lovableKey: string | undefined, body: any) {
  const { content, sourceAtomId } = body;
  if (!content || !lovableKey) return json({ error: "content and LOVABLE_API_KEY required" }, 400);

  // Use AI to extract entities and relationships
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `Extract entities and relationships from the following text about an AI system.
Entity types: system, protocol, concept, component, metric, document.
Relationship types: DEPENDS_ON, PART_OF, SUPPORTS, USES, SIMILAR_TO, SPECIALIZES.
Be concise. Max 10 entities, max 15 relationships.`,
        },
        { role: "user", content: content.slice(0, 4000) },
      ],
      tools: [{
        type: "function",
        function: {
          name: "extract_knowledge",
          description: "Extract entities and relationships from text",
          parameters: {
            type: "object",
            properties: {
              entities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    type: { type: "string", enum: ["system", "protocol", "concept", "component", "metric", "document"] },
                    description: { type: "string" },
                  },
                  required: ["name", "type"],
                },
              },
              relationships: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    source: { type: "string" },
                    target: { type: "string" },
                    type: { type: "string", enum: ["DEPENDS_ON", "PART_OF", "SUPPORTS", "USES", "SIMILAR_TO", "SPECIALIZES"] },
                  },
                  required: ["source", "target", "type"],
                },
              },
            },
            required: ["entities", "relationships"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "extract_knowledge" } },
    }),
  });

  if (!resp.ok) {
    return json({ error: "AI extraction failed", status: resp.status }, 500);
  }

  const data = await resp.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return json({ error: "No extraction result" }, 500);

  const extracted = JSON.parse(toolCall.function.arguments);
  const entityMap = new Map<string, string>(); // name → id
  let entitiesCreated = 0;
  let relationshipsCreated = 0;

  // Upsert entities
  for (const entity of extracted.entities || []) {
    const { data: existing } = await supabase
      .from("aimos_entities")
      .select("id")
      .eq("name", entity.name.toLowerCase())
      .eq("entity_type", entity.type)
      .single();

    if (existing) {
      entityMap.set(entity.name.toLowerCase(), existing.id);
      // Link source atom
      if (sourceAtomId) {
        await supabase.from("aimos_entities").update({
          source_atom_ids: supabase.sql`array_append(source_atom_ids, ${sourceAtomId})`,
        }).eq("id", existing.id);
      }
    } else {
      const { data: newEntity } = await supabase
        .from("aimos_entities")
        .insert({
          name: entity.name.toLowerCase(),
          entity_type: entity.type,
          description: entity.description || null,
          source_atom_ids: sourceAtomId ? [sourceAtomId] : [],
          confidence: 0.7,
        })
        .select("id")
        .single();

      if (newEntity) {
        entityMap.set(entity.name.toLowerCase(), newEntity.id);
        entitiesCreated++;
      }
    }
  }

  // Create relationships
  for (const rel of extracted.relationships || []) {
    const sourceId = entityMap.get(rel.source.toLowerCase());
    const targetId = entityMap.get(rel.target.toLowerCase());
    if (sourceId && targetId && sourceId !== targetId) {
      await supabase.from("aimos_entity_relationships").insert({
        source_entity_id: sourceId,
        target_entity_id: targetId,
        relationship_type: rel.type,
        strength: 0.7,
        evidence_atom_ids: sourceAtomId ? [sourceAtomId] : [],
      });
      relationshipsCreated++;
    }
  }

  return json({
    success: true,
    entitiesCreated,
    relationshipsCreated,
    totalEntities: extracted.entities?.length || 0,
    totalRelationships: extracted.relationships?.length || 0,
  });
}

// ── NEIGHBORS: Get entity neighborhood ──
async function handleNeighbors(supabase: any, body: any) {
  const { entityId, depth = 1 } = body;
  if (!entityId) return json({ error: "entityId required" }, 400);

  const { data: entity } = await supabase
    .from("aimos_entities")
    .select("*")
    .eq("id", entityId)
    .single();

  if (!entity) return json({ error: "Entity not found" }, 404);

  const { data: outgoing } = await supabase
    .from("aimos_entity_relationships")
    .select("*, target:aimos_entities!aimos_entity_relationships_target_entity_id_fkey(*)")
    .eq("source_entity_id", entityId);

  const { data: incoming } = await supabase
    .from("aimos_entity_relationships")
    .select("*, source:aimos_entities!aimos_entity_relationships_source_entity_id_fkey(*)")
    .eq("target_entity_id", entityId);

  return json({
    success: true,
    entity,
    outgoing: outgoing || [],
    incoming: incoming || [],
  });
}

// ── STATS: Graph statistics ──
async function handleStats(supabase: any) {
  const { count: entityCount } = await supabase.from("aimos_entities").select("*", { count: "exact", head: true });
  const { count: relCount } = await supabase.from("aimos_entity_relationships").select("*", { count: "exact", head: true });

  return json({
    success: true,
    entities: entityCount || 0,
    relationships: relCount || 0,
  });
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
