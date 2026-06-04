export type AnomalySeverity = "critical" | "high" | "medium" | "low";
export type AnomalyStatus = "active" | "investigating" | "resolved" | "dismissed";

export interface AnomalyEvent {
  id: string;
  timestamp: string;
  camera: string;
  location: string;
  type: string;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  confidence: number;
  description: string;
  duration?: string;
  frames: number;
  // 🚨 Acoplamento de Metadados de Missão Crítica:
  incident_details?: {
    vehicles_involved: string[];
    max_vehicles_simultaneous: number;
    collision_detected: boolean;
  };
  victim_estimation?: {
    detected_count: number;
    confidence_level: string;
    notes: string;
  };
  cascading_risks?: {
    structural_damage: string;
    environmental_hazards: {
      fuel_leak_detected: boolean;
      fire_smoke_index: string;
    };
    electrical_hazards: {
      downed_power_lines: boolean;
      electrocution_risk_zone_meters: number;
      grid_status_estimated: string;
    };
  };
  automated_response_protocol?: {
    required_agencies: string[];
    priority_level: string;
    isolation_area_required_meters: number;
  };
}

export interface MetricCard {
  label: string;
  value: string | number;
  delta: string;
  trend: "up" | "down" | "neutral";
  icon: string;
}

export interface TimelineEntry {
  time: string;
  event: string;
  camera: string;
  severity: AnomalySeverity;
  resolved: boolean;
}

export interface TrafficData {
  time: string;
  vehicles: number;
  anomalies: number;
  pedestrians: number;
}