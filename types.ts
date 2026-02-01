
export interface MandiPrice {
  commodity: string;
  market: string;
  price: string;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

export interface GroundingSource {
  web?: {
    uri: string;
    title: string;
  };
}

export interface TranscriptionItem {
  speaker: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface UserProfile {
  name: string;
  role: string;
  isGuest: boolean;
  avatar?: string;
}
