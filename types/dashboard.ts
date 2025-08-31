// Dashboard API Response Types
export interface DashboardStat {
  label: string;
  value: string;
  icon?: React.ComponentType<any>;
  color?: string;
}

export interface DashboardStatsResponse {
  stats: DashboardStat[];
}

// Generation Types
export interface Generation {
  id: string;
  prompt: string;
  imageUrl: string;
  dimensions?: {
    width: number;
    height: number;
    aspectRatio: string;
    name: string;
  };
  persona?: {
    name: string;
  };
  style?: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  creditsUsed: number;
}

export interface RecentGenerationsResponse {
  generations: Generation[];
  total: number;
}

// Persona Types
export interface Persona {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPersonasResponse {
  personas: Persona[];
}

// Style Types
export interface StyleImage {
  id: string;
  imageUrl: string;
  order: number;
}

export interface Style {
  id: string;
  name: string;
  description?: string;
  images: StyleImage[];
  extractedMetadata?: any;
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserStylesResponse {
  styles: Style[];
}
