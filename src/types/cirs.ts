import { Timestamp } from 'firebase/firestore';

export const COMPLAINT_CATEGORIES = [
  'Road & Potholes',
  'Streetlights & Power',
  'Water & Drainage',
  'Waste & Sanitation',
  'Parks & Trees',
  'Public Safety',
  'Noise & Nuisance',
  'Other',
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export const COMPLAINT_STATUSES = ['Pending', 'In Progress', 'Resolved'] as const;

export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const MUNICIPAL_DEPARTMENTS = [
  'Public Works & Roads',
  'Electrical & Street Lighting',
  'Water & Stormwater Engineering',
  'Solid Waste & Sanitation',
  'Parks, Forestry & Grounds',
  'Municipal Safety & Code Enforcement',
  'Community Services Desk',
] as const;

export const FIELD_LIMITS = {
  fullName: { min: 2, max: 80 },
  email: { min: 5, max: 120 },
  communityName: { min: 2, max: 100 },
  title: { min: 5, max: 120 },
  description: { min: 15, max: 2000 },
  location: { min: 3, max: 180 },
  adminRemarks: { min: 0, max: 1000 },
  assignedDepartment: { min: 0, max: 100 },
  imageUrl: { min: 0, max: 500 },
  imageMaxBytes: 262144,
  imageMaxDataUrlLength: 350000,
} as const;

export const BOOTSTRAPPED_ADMIN_EMAIL = 'singidigeethikavirimahitha@gmail.com';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  communityName: string;
  role: 'citizen';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AdminRecord {
  uid: string;
  email: string;
  fullName: string;
  department: string;
  grantedBy: string;
  createdAt: Timestamp;
}

export interface Complaint {
  id: string;
  referenceId: string;
  citizenId: string;
  citizenName: string;
  citizenEmail: string;
  title: string;
  category: ComplaintCategory;
  description: string;
  location: string;
  communityName: string;
  status: ComplaintStatus;
  adminRemarks: string;
  assignedDepartment: string;
  hasImage: boolean;
  imageUrl: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ComplaintImage {
  complaintId: string;
  citizenId: string;
  dataUrl: string;
  fileName: string;
  sizeBytes: number;
  createdAt: Timestamp;
}
