export interface ActionPersonItem {
  id: number;
  name: string;
  type: 'student' | 'teacher';
  layerName: string;
  x: number;
  y: number;
}

export interface ActionConfig {
  id: string;
  label: string;
  icon: string;
}
