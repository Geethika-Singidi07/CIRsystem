# CIRS — Community Issue Reporting System

A full-stack civic-tech web application built with **React**, **TypeScript**, **Tailwind CSS**, **Firebase Authentication**, and **Cloud Firestore**.

## Core Capabilities

### Citizen Portal
- **Multi-Account Email/Password & Google Authentication**: Independent citizen registration and sign-in with duplicate email protection and persistent sessions.
- **Email Verification Enforcement**: Ensures only verified accounts can submit or modify records under Firestore security rules.
- **Structured Complaint Submission**: Submit issues with title, category, detailed description, street location, community/ward name, and optional photo.
- **Unique Reference Tracking**: Generates a unique `CIRS-YYYY-XXXXXX` reference ID per submission.
- **Personal Issue Tracking**: Citizens can query and view only their own complaints, real-time statuses (`Pending` → `In Progress` → `Resolved`), assigned department, and official admin remarks.

### Municipal Admin Portal
- **Role-Based Access Control (RBAC)**: Separate `/admin/login` entry point verified against `/admins/{uid}` in Firestore and the bootstrapped project owner account.
- **Live Operations Dashboard**: Summary metrics for Total, Pending, In Progress, and Resolved reports.
- **Search & Multi-Filter Queue**: Search by reference ID, title, citizen name/email, location, or filter by status, category, and community.
- **Resolution & Feedback Drawer**: Inspect attached photos, assign municipal departments, update status, and post official citizen-visible remarks.
- **Staff Authorization Management**: Existing administrators can grant or revoke admin access for other verified accounts without code changes.

## Free-Tier Architecture (Zero Required Billing)
- **Optional Image Uploads Without Paid Storage**: Firebase Cloud Storage buckets on newer projects can require the Blaze (pay-as-you-go) plan. To keep CIRS 100% free on the Firebase Spark tier, uploaded images are resized and compressed client-side using the HTML5 Canvas API to under 250 KB and stored in a dedicated `complaintImages/{complaintId}` Firestore collection (atomically committed in the same `writeBatch` as the complaint). External image URLs are also supported.

## Firebase Console Setup Notes

### 1. Enable Email/Password Authentication
1. Open the [Firebase Console](https://console.firebase.google.com/) and select your project.
2. Navigate to **Build → Authentication → Sign-in method**.
3. Click **Add new provider → Email/Password**, toggle **Enable**, and save.
4. *(Google Sign-In is already supported out of the box.)*

### 2. Adding Additional Administrators
1. Sign in with the primary administrator account at `/admin/login`.
2. Open **Admin Access** (`/admin/staff`) in the sidebar.
3. Select a registered verified user (or paste their Firebase UID) and assign a municipal department.

## Local Development & Deployment

```bash
npm install
npm run dev
```

### Production Build
```bash
npm run lint
npm run build
```

Deploy the generated `dist/` directory to **Firebase Hosting**, **Vercel**, **Netlify**, or any static/Node host. Ensure your deployed domain is added under **Firebase Console → Authentication → Settings → Authorized domains**.
