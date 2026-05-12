export enum OrphanageStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface Orphanage {
  id: string;
  name: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  contactPhone?: string;
  contactEmail?: string;
  capacity?: number;
  ageGroups?: string;
  description?: string;
  photoUrl?: string;
  status: OrphanageStatus;
  createdAt: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
  submittedByEmail?: string | null;
}

export enum FeedbackType {
  SUGGESTION = 'suggestion',
  BUG = 'bug',
  OTHER = 'other'
}

export interface Feedback {
  id: string;
  userId?: string;
  userEmail?: string;
  type: FeedbackType;
  message: string;
  createdAt: any;
  resolved: boolean;
}

export type CameroonRegion = 
  | 'Adamawa' 
  | 'Central' 
  | 'East' 
  | 'Far North' 
  | 'Littoral' 
  | 'North' 
  | 'North-West' 
  | 'South' 
  | 'South-West' 
  | 'West';

export const CAMEROON_REGIONS: CameroonRegion[] = [
  'Adamawa', 'Central', 'East', 'Far North', 'Littoral', 
  'North', 'North-West', 'South', 'South-West', 'West'
];
