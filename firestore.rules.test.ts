/**
 * Security Rules Verification Suite for CIRS (Community Issue Reporting System)
 * Verifies the "Dirty Dozen" adversarial payloads against Firestore rules logic.
 */

export interface AdversarialTestCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: {
    uid: string;
    email: string;
    email_verified: boolean;
  } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const dirtyDozenTests: AdversarialTestCase[] = [
  {
    id: 1,
    name: 'Self-Admin Profile Escalation',
    collection: 'users/citizen-1',
    operation: 'create',
    auth: { uid: 'citizen-1', email: 'citizen1@example.com', email_verified: true },
    payload: {
      uid: 'citizen-1',
      fullName: 'Alice Citizen',
      email: 'citizen1@example.com',
      communityName: 'Oakridge',
      role: 'admin',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Shadow Field Injection on User',
    collection: 'users/citizen-1',
    operation: 'create',
    auth: { uid: 'citizen-1', email: 'citizen1@example.com', email_verified: true },
    payload: {
      uid: 'citizen-1',
      fullName: 'Alice Citizen',
      email: 'citizen1@example.com',
      communityName: 'Oakridge',
      role: 'citizen',
      isVerified: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Cross-User PII Read',
    collection: 'users/citizen-2',
    operation: 'get',
    auth: { uid: 'citizen-1', email: 'citizen1@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Blanket User List Scraping',
    collection: 'users',
    operation: 'list',
    auth: { uid: 'citizen-1', email: 'citizen1@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Unverified Email Write',
    collection: 'complaints/comp-1',
    operation: 'create',
    auth: { uid: 'citizen-1', email: 'citizen1@example.com', email_verified: false },
    payload: {
      referenceId: 'CIRS-2026-AB12CD',
      citizenId: 'citizen-1',
      status: 'Pending',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Admin Email Spoof (Unverified)',
    collection: 'complaints',
    operation: 'list',
    auth: {
      uid: 'attacker-1',
      email: 'singidigeethikavirimahitha@gmail.com',
      email_verified: false,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Complaint Identity Spoofing',
    collection: 'complaints/comp-2',
    operation: 'create',
    auth: { uid: 'citizen-1', email: 'citizen1@example.com', email_verified: true },
    payload: {
      referenceId: 'CIRS-2026-AB12CE',
      citizenId: 'citizen-2',
      title: 'Broken streetlight on Pine Ave',
      status: 'Pending',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Pre-Resolved Complaint Creation',
    collection: 'complaints/comp-3',
    operation: 'create',
    auth: { uid: 'citizen-1', email: 'citizen1@example.com', email_verified: true },
    payload: {
      referenceId: 'CIRS-2026-AB12CF',
      citizenId: 'citizen-1',
      status: 'Resolved',
      adminRemarks: 'Self-approved',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Citizen Status Tampering',
    collection: 'complaints/comp-1',
    operation: 'update',
    auth: { uid: 'citizen-1', email: 'citizen1@example.com', email_verified: true },
    payload: {
      status: 'Resolved',
      adminRemarks: 'Bypassed admin review',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Cross-Citizen Complaint Scraping',
    collection: 'complaints',
    operation: 'list',
    auth: { uid: 'citizen-1', email: 'citizen1@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Oversized / Poisoned Document ID',
    collection: 'complaints/bad id with $pecial chars ' + 'a'.repeat(130),
    operation: 'create',
    auth: { uid: 'citizen-1', email: 'citizen1@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Orphaned / Oversized Image Upload',
    collection: 'complaintImages/nonexistent-comp',
    operation: 'create',
    auth: { uid: 'citizen-1', email: 'citizen1@example.com', email_verified: true },
    payload: {
      complaintId: 'nonexistent-comp',
      citizenId: 'citizen-1',
      sizeBytes: 9999999,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];
