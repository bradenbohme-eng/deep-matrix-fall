-- Create surveillance cameras table
CREATE TABLE IF NOT EXISTS public.surveillance_cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  camera_type TEXT NOT NULL CHECK (camera_type IN ('traffic', 'security', 'facial_recognition', 'license_plate', 'crowd_monitoring', 'perimeter', 'drone')),
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance', 'compromised')),
  coordinates JSONB NOT NULL,
  feed_url TEXT,
  coverage_area JSONB,
  resolution TEXT DEFAULT '1080p',
  capabilities JSONB DEFAULT '[]'::jsonb,
  threat_level INTEGER DEFAULT 1 CHECK (threat_level BETWEEN 1 AND 6),
  last_ping TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create surveillance events table
CREATE TABLE IF NOT EXISTS public.surveillance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID REFERENCES public.surveillance_cameras(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('motion_detected', 'face_detected', 'license_plate_scan', 'weapon_detected', 'suspicious_behavior', 'crowd_density', 'vehicle_tracking', 'intrusion_alert', 'anomaly_detected')),
  confidence DECIMAL(5,4) CHECK (confidence BETWEEN 0 AND 1),
  description TEXT,
  detected_objects JSONB DEFAULT '[]'::jsonb,
  coordinates JSONB,
  image_url TEXT,
  video_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  processed BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create traffic monitoring table
CREATE TABLE IF NOT EXISTS public.traffic_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,
  coordinates JSONB NOT NULL,
  vehicle_count INTEGER DEFAULT 0,
  speed_avg DECIMAL(5,2),
  congestion_level TEXT CHECK (congestion_level IN ('clear', 'light', 'moderate', 'heavy', 'gridlock')),
  incident_detected BOOLEAN DEFAULT false,
  incident_type TEXT,
  flow_rate DECIMAL(8,2),
  density DECIMAL(8,2),
  occupancy DECIMAL(5,4),
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create surveillance analytics table
CREATE TABLE IF NOT EXISTS public.surveillance_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL CHECK (metric_type IN ('camera_uptime', 'event_count', 'threat_detection', 'false_positive_rate', 'processing_time', 'storage_usage')),
  metric_value DECIMAL(12,4) NOT NULL,
  camera_id UUID REFERENCES public.surveillance_cameras(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.surveillance_cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveillance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveillance_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for surveillance_cameras
CREATE POLICY "Public read access for surveillance_cameras"
  ON public.surveillance_cameras FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert surveillance_cameras"
  ON public.surveillance_cameras FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update surveillance_cameras"
  ON public.surveillance_cameras FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for surveillance_events
CREATE POLICY "Public read access for surveillance_events"
  ON public.surveillance_events FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert surveillance_events"
  ON public.surveillance_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update surveillance_events"
  ON public.surveillance_events FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for traffic_monitoring
CREATE POLICY "Public read access for traffic_monitoring"
  ON public.traffic_monitoring FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert traffic_monitoring"
  ON public.traffic_monitoring FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for surveillance_analytics
CREATE POLICY "Public read access for surveillance_analytics"
  ON public.surveillance_analytics FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert surveillance_analytics"
  ON public.surveillance_analytics FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_surveillance_cameras_status ON public.surveillance_cameras(status);
CREATE INDEX idx_surveillance_cameras_type ON public.surveillance_cameras(camera_type);
CREATE INDEX idx_surveillance_cameras_coordinates ON public.surveillance_cameras USING gin(coordinates);
CREATE INDEX idx_surveillance_events_camera_id ON public.surveillance_events(camera_id);
CREATE INDEX idx_surveillance_events_type ON public.surveillance_events(event_type);
CREATE INDEX idx_surveillance_events_timestamp ON public.surveillance_events(timestamp DESC);
CREATE INDEX idx_traffic_monitoring_location ON public.traffic_monitoring(location);
CREATE INDEX idx_traffic_monitoring_timestamp ON public.traffic_monitoring(timestamp DESC);
CREATE INDEX idx_surveillance_analytics_type ON public.surveillance_analytics(metric_type);
CREATE INDEX idx_surveillance_analytics_camera ON public.surveillance_analytics(camera_id);

-- Create trigger for updated_at
CREATE TRIGGER update_surveillance_cameras_updated_at
  BEFORE UPDATE ON public.surveillance_cameras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.surveillance_cameras;
ALTER PUBLICATION supabase_realtime ADD TABLE public.surveillance_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.traffic_monitoring;

-- Insert sample surveillance cameras
INSERT INTO public.surveillance_cameras (name, location, camera_type, status, coordinates, capabilities, threat_level, resolution) VALUES
('Pentagon Main Gate', 'Arlington, VA', 'security', 'online', '{"lat": 38.8719, "lng": -77.0562}'::jsonb, '["facial_recognition", "license_plate", "weapon_detection"]'::jsonb, 6, '4K'),
('NSA Parking Lot Alpha', 'Fort Meade, MD', 'security', 'online', '{"lat": 39.1080, "lng": -76.7713}'::jsonb, '["facial_recognition", "vehicle_tracking"]'::jsonb, 6, '4K'),
('Times Square Intersection', 'New York, NY', 'traffic', 'online', '{"lat": 40.7580, "lng": -73.9855}'::jsonb, '["crowd_monitoring", "facial_recognition"]'::jsonb, 4, '4K'),
('LAX Terminal 4', 'Los Angeles, CA', 'security', 'online', '{"lat": 33.9425, "lng": -118.4081}'::jsonb, '["facial_recognition", "weapon_detection", "behavior_analysis"]'::jsonb, 5, '4K'),
('Moscow Red Square', 'Moscow, Russia', 'security', 'online', '{"lat": 55.7539, "lng": 37.6208}'::jsonb, '["facial_recognition", "crowd_monitoring"]'::jsonb, 5, '4K'),
('Beijing Tiananmen', 'Beijing, China', 'security', 'online', '{"lat": 39.9042, "lng": 116.4074}'::jsonb, '["facial_recognition", "behavior_analysis"]'::jsonb, 5, '4K'),
('London Bridge', 'London, UK', 'traffic', 'online', '{"lat": 51.5055, "lng": -0.0754}'::jsonb, '["vehicle_tracking", "license_plate"]'::jsonb, 4, '1080p'),
('Dubai Marina', 'Dubai, UAE', 'security', 'online', '{"lat": 25.0772, "lng": 55.1388}'::jsonb, '["facial_recognition", "crowd_monitoring"]'::jsonb, 4, '4K'),
('Tel Aviv Port', 'Tel Aviv, Israel', 'perimeter', 'online', '{"lat": 32.0853, "lng": 34.7818}'::jsonb, '["intrusion_detection", "thermal"]'::jsonb, 5, '4K'),
('Border Patrol TX-01', 'El Paso, TX', 'perimeter', 'online', '{"lat": 31.7619, "lng": -106.4850}'::jsonb, '["thermal", "motion_detection"]'::jsonb, 4, '1080p');

-- Insert sample surveillance events
INSERT INTO public.surveillance_events (camera_id, event_type, confidence, description, priority) 
SELECT id, 'motion_detected', 0.95, 'High confidence motion detected in restricted zone', 4
FROM public.surveillance_cameras WHERE name = 'Pentagon Main Gate' LIMIT 1;

INSERT INTO public.surveillance_events (camera_id, event_type, confidence, description, priority)
SELECT id, 'face_detected', 0.88, 'Face match: Person of Interest ID #4782', 5
FROM public.surveillance_cameras WHERE name = 'NSA Parking Lot Alpha' LIMIT 1;

-- Insert sample traffic monitoring data
INSERT INTO public.traffic_monitoring (location, coordinates, vehicle_count, speed_avg, congestion_level, flow_rate) VALUES
('I-95 North Exit 22', '{"lat": 38.8719, "lng": -77.0562}'::jsonb, 342, 45.5, 'moderate', 2850.00),
('Times Square', '{"lat": 40.7580, "lng": -73.9855}'::jsonb, 1250, 15.2, 'heavy', 950.00),
('Hollywood Blvd', '{"lat": 34.1016, "lng": -118.3267}'::jsonb, 890, 28.3, 'light', 3200.00);