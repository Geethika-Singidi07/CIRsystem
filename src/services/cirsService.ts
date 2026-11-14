import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  AdminRecord,
  Complaint,
  ComplaintCategory,
  ComplaintImage,
  ComplaintStatus,
  FIELD_LIMITS,
  UserProfile,
} from '../types/cirs';
import { generateComplaintReferenceId, generateFirestoreDocId } from '../utils/referenceId';
import { CompressedImageResult } from '../utils/imageCompressor';

export interface CreateComplaintInput {
  citizenId: string;
  citizenName: string;
  citizenEmail: string;
  title: string;
  category: ComplaintCategory;
  description: string;
  location: string;
  communityName: string;
  imageUrl?: string;
  compressedImage?: CompressedImageResult | null;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createOrSyncUserProfile(params: {
  uid: string;
  fullName: string;
  email: string;
  communityName: string;
}): Promise<UserProfile> {
  const path = `users/${params.uid}`;
  const fullName = params.fullName.trim().slice(0, FIELD_LIMITS.fullName.max);
  const safeName = fullName.length >= FIELD_LIMITS.fullName.min ? fullName : 'Civic Member';
  const communityName = params.communityName.trim().slice(0, FIELD_LIMITS.communityName.max);
  const safeCommunity =
    communityName.length >= FIELD_LIMITS.communityName.min ? communityName : 'General Ward';

  try {
    const ref = doc(db, 'users', params.uid);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      return existing.data() as UserProfile;
    }

    await setDoc(ref, {
      uid: params.uid,
      fullName: safeName,
      email: params.email.trim().slice(0, FIELD_LIMITS.email.max),
      communityName: safeCommunity,
      role: 'citizen',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const created = await getDoc(ref);
    return created.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateUserProfile(
  uid: string,
  updates: { fullName: string; communityName: string }
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      fullName: updates.fullName.trim().slice(0, FIELD_LIMITS.fullName.max),
      communityName: updates.communityName.trim().slice(0, FIELD_LIMITS.communityName.max),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function checkAdminRecord(uid: string): Promise<AdminRecord | null> {
  const path = `admins/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    if (!snap.exists()) return null;
    return snap.data() as AdminRecord;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeAdmins(
  onData: (admins: AdminRecord[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = 'admins';
  const q = query(collection(db, 'admins'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const records = snapshot.docs.map((d) => d.data() as AdminRecord);
      onData(records);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function grantAdminAccess(params: {
  uid: string;
  email: string;
  fullName: string;
  department: string;
  grantedBy: string;
}): Promise<void> {
  const cleanUid = params.uid.trim();
  const path = `admins/${cleanUid}`;
  const ref = doc(db, 'admins', cleanUid);
  const cleanEmail = params.email.trim().slice(0, FIELD_LIMITS.email.max);
  const cleanName = params.fullName.trim().slice(0, FIELD_LIMITS.fullName.max);
  const cleanDept = params.department.trim().slice(0, 80);

  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await updateDoc(ref, {
        email: cleanEmail,
        fullName: cleanName,
        department: cleanDept,
      });
    } else {
      await setDoc(ref, {
        uid: cleanUid,
        email: cleanEmail,
        fullName: cleanName,
        department: cleanDept,
        grantedBy: params.grantedBy,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function revokeAdminAccess(uid: string): Promise<void> {
  const path = `admins/${uid}`;
  try {
    await deleteDoc(doc(db, 'admins', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createComplaint(
  input: CreateComplaintInput
): Promise<{ id: string; referenceId: string }> {
  const complaintId = generateFirestoreDocId();
  const referenceId = generateComplaintReferenceId();
  const path = `complaints/${complaintId}`;

  const hasCompressedImage = Boolean(input.compressedImage?.dataUrl);
  const cleanImageUrl = (input.imageUrl || '').trim().slice(0, FIELD_LIMITS.imageUrl.max);

  const trimmedCitizenName = input.citizenName.trim().slice(0, FIELD_LIMITS.fullName.max);
  const safeCitizenName =
    trimmedCitizenName.length >= FIELD_LIMITS.fullName.min ? trimmedCitizenName : 'Civic Resident';

  try {
    const batch = writeBatch(db);
    const complaintRef = doc(db, 'complaints', complaintId);

    batch.set(complaintRef, {
      referenceId,
      citizenId: input.citizenId,
      citizenName: safeCitizenName,
      citizenEmail: input.citizenEmail.trim().slice(0, FIELD_LIMITS.email.max),
      title: input.title.trim().slice(0, FIELD_LIMITS.title.max),
      category: input.category,
      description: input.description.trim().slice(0, FIELD_LIMITS.description.max),
      location: input.location.trim().slice(0, FIELD_LIMITS.location.max),
      communityName: input.communityName.trim().slice(0, FIELD_LIMITS.communityName.max),
      status: 'Pending',
      adminRemarks: '',
      assignedDepartment: '',
      hasImage: hasCompressedImage,
      imageUrl: cleanImageUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (hasCompressedImage && input.compressedImage) {
      const imageRef = doc(db, 'complaintImages', complaintId);
      batch.set(imageRef, {
        complaintId,
        citizenId: input.citizenId,
        dataUrl: input.compressedImage.dataUrl,
        fileName: input.compressedImage.fileName,
        sizeBytes: input.compressedImage.sizeBytes,
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return { id: complaintId, referenceId };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeCitizenComplaints(
  citizenId: string,
  onData: (complaints: Complaint[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = 'complaints';
  const q = query(collection(db, 'complaints'), where('citizenId', '==', citizenId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Complaint, 'id'>),
        }))
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() ?? 0;
          const bTime = b.createdAt?.toMillis?.() ?? 0;
          return bTime - aTime;
        });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeAllComplaints(
  onData: (complaints: Complaint[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = 'complaints';
  const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Complaint, 'id'>),
      }));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function getComplaintById(complaintId: string): Promise<Complaint | null> {
  const path = `complaints/${complaintId}`;
  try {
    const snap = await getDoc(doc(db, 'complaints', complaintId));
    if (!snap.exists()) return null;
    return {
      id: snap.id,
      ...(snap.data() as Omit<Complaint, 'id'>),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function getComplaintImage(complaintId: string): Promise<ComplaintImage | null> {
  const path = `complaintImages/${complaintId}`;
  try {
    const snap = await getDoc(doc(db, 'complaintImages', complaintId));
    if (!snap.exists()) return null;
    return snap.data() as ComplaintImage;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function updateComplaintAdminStatus(params: {
  complaintId: string;
  status: ComplaintStatus;
  adminRemarks: string;
  assignedDepartment: string;
}): Promise<void> {
  const path = `complaints/${params.complaintId}`;
  try {
    await updateDoc(doc(db, 'complaints', params.complaintId), {
      status: params.status,
      adminRemarks: params.adminRemarks.trim().slice(0, FIELD_LIMITS.adminRemarks.max),
      assignedDepartment: params.assignedDepartment.trim().slice(0, FIELD_LIMITS.assignedDepartment.max),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchAllCitizensForAdmin(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => d.data() as UserProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
