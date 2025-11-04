import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SurveillanceEvent {
  camera_id: string;
  event_type: string;
  confidence: number;
  description: string;
  detected_objects?: any[];
  coordinates?: any;
  priority?: number;
}

interface TrafficUpdate {
  location: string;
  coordinates: any;
  vehicle_count: number;
  speed_avg: number;
  congestion_level: string;
  flow_rate: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, data } = await req.json();

    console.log('Surveillance processor called:', action);

    switch (action) {
      case 'process_event': {
        const event: SurveillanceEvent = data;
        
        // Simulate CV processing
        const processedEvent = {
          ...event,
          confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
          detected_objects: event.detected_objects || generateDetectedObjects(event.event_type),
          processed: true,
          metadata: {
            processor: 'ai-cv-engine',
            processing_time: Math.random() * 500 + 100,
            model_version: 'v2.3.4',
          },
        };

        const { data: inserted, error } = await supabase
          .from('surveillance_events' as any)
          .insert(processedEvent)
          .select()
          .single();

        if (error) throw error;

        console.log('Event processed:', inserted);
        return new Response(
          JSON.stringify({ success: true, event: inserted }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_traffic': {
        const traffic: TrafficUpdate = data;
        
        // Simulate traffic analysis
        const trafficData = {
          ...traffic,
          congestion_level: calculateCongestion(traffic.vehicle_count, traffic.speed_avg),
          density: traffic.vehicle_count / (traffic.flow_rate || 1),
          occupancy: Math.min(traffic.vehicle_count / 1000, 1),
          metadata: {
            processor: 'traffic-analysis-ai',
            timestamp: new Date().toISOString(),
          },
        };

        const { data: inserted, error } = await supabase
          .from('traffic_monitoring' as any)
          .insert(trafficData)
          .select()
          .single();

        if (error) throw error;

        console.log('Traffic updated:', inserted);
        return new Response(
          JSON.stringify({ success: true, traffic: inserted }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'generate_events': {
        // Simulate real-time event generation for demo
        const cameras = await supabase
          .from('surveillance_cameras' as any)
          .select('*')
          .eq('status', 'online')
          .limit(5);

        if (cameras.error) throw cameras.error;

        const events = [];
        for (const camera of cameras.data || []) {
          if (Math.random() > 0.7) { // 30% chance of event
            const eventType = selectRandomEventType();
            const event = {
              camera_id: camera.id,
              event_type: eventType,
              confidence: Math.random() * 0.3 + 0.7,
              description: generateEventDescription(eventType, camera.name),
              detected_objects: generateDetectedObjects(eventType),
              priority: calculatePriority(eventType),
              metadata: {
                camera_location: camera.location,
                camera_type: camera.camera_type,
              },
            };

            const { data: inserted, error } = await supabase
              .from('surveillance_events' as any)
              .insert(event)
              .select()
              .single();

            if (!error && inserted) {
              events.push(inserted);
            }
          }
        }

        console.log('Generated events:', events.length);
        return new Response(
          JSON.stringify({ success: true, events }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_camera_status': {
        const { camera_id, status } = data;
        
        const { data: updated, error } = await supabase
          .from('surveillance_cameras' as any)
          .update({ status, last_ping: new Date().toISOString() })
          .eq('id', camera_id)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, camera: updated }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Surveillance processor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generateDetectedObjects(eventType: string): any[] {
  const objectTypes: Record<string, string[]> = {
    motion_detected: ['person', 'vehicle'],
    face_detected: ['face'],
    license_plate_scan: ['vehicle', 'license_plate'],
    weapon_detected: ['weapon', 'person'],
    suspicious_behavior: ['person', 'suspicious_object'],
    crowd_density: ['crowd', 'person'],
    vehicle_tracking: ['vehicle'],
    intrusion_alert: ['person', 'unauthorized_entry'],
    anomaly_detected: ['anomaly', 'unknown_object'],
  };

  const types = objectTypes[eventType] || ['object'];
  return types.map(type => ({
    type,
    confidence: Math.random() * 0.3 + 0.7,
    bounding_box: {
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      width: Math.random() * 200 + 50,
      height: Math.random() * 200 + 50,
    },
  }));
}

function calculateCongestion(vehicleCount: number, speedAvg: number): string {
  if (speedAvg > 50) return 'clear';
  if (speedAvg > 35) return 'light';
  if (speedAvg > 20) return 'moderate';
  if (speedAvg > 10) return 'heavy';
  return 'gridlock';
}

function selectRandomEventType(): string {
  const types = [
    'motion_detected',
    'face_detected',
    'license_plate_scan',
    'weapon_detected',
    'suspicious_behavior',
    'crowd_density',
    'vehicle_tracking',
    'intrusion_alert',
    'anomaly_detected',
  ];
  return types[Math.floor(Math.random() * types.length)];
}

function generateEventDescription(eventType: string, cameraName: string): string {
  const descriptions: Record<string, string> = {
    motion_detected: `Motion detected at ${cameraName}`,
    face_detected: `Face recognition match at ${cameraName}`,
    license_plate_scan: `License plate scanned at ${cameraName}`,
    weapon_detected: `ALERT: Weapon detected at ${cameraName}`,
    suspicious_behavior: `Suspicious behavior detected at ${cameraName}`,
    crowd_density: `High crowd density at ${cameraName}`,
    vehicle_tracking: `Vehicle tracked through ${cameraName}`,
    intrusion_alert: `ALERT: Intrusion detected at ${cameraName}`,
    anomaly_detected: `Anomaly detected at ${cameraName}`,
  };
  return descriptions[eventType] || `Event at ${cameraName}`;
}

function calculatePriority(eventType: string): number {
  const priorities: Record<string, number> = {
    weapon_detected: 5,
    intrusion_alert: 5,
    suspicious_behavior: 4,
    face_detected: 3,
    motion_detected: 2,
    license_plate_scan: 2,
    crowd_density: 3,
    vehicle_tracking: 2,
    anomaly_detected: 4,
  };
  return priorities[eventType] || 3;
}
