# CIRS Security Specification

## 1. Data Invariants
1. **Identity Isolation**: Citizens can only create `/users/{userId}` with `uid == request.auth.uid` and `role == "citizen"`. Self-escalation to admin is strictly forbidden.
2. **PII Protection**: `/users/{userId}` contains `email` and is readable (`get`) only by `isOwner(userId)` or `isAdmin()`. Blanket `list` on `/users` is denied for citizens.
3. **Complaint Ownership**: Citizens can only create `/complaints/{complaintId}` where `citizenId == request.auth.uid`, `status == "Pending"`, `adminRemarks == ""`, and `assignedDepartment == ""`.
4. **Citizen Read Isolation**: Citizens can `get` and `list` only complaints where `resource.data.citizenId == request.auth.uid`.
5. **Admin-Only Resolution & Remarks**: Only verified administrators (`isAdmin()`) may update `/complaints/{complaintId}` status (`Pending` -> `In Progress` -> `Resolved`), `adminRemarks`, and `assignedDepartment`.
6. **Atomic Image Attachment**: `/complaintImages/{complaintId}` can only be created atomically alongside `/complaints/{complaintId}` (`existsAfter` + `getAfter` relational sync) by the owning citizen.
7. **Temporal Integrity**: `createdAt` and `updatedAt` must match `request.time`; `createdAt` and `citizenId` are immutable on updates.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Self-Admin Profile Escalation**: Citizen creates `/users/{uid}` with `role: "admin"`. -> `PERMISSION_DENIED`
2. **Shadow Field Injection on User**: Citizen creates `/users/{uid}` with extra field `isVerified: true`. -> `PERMISSION_DENIED`
3. **Cross-User PII Read**: Citizen A calls `get` on `/users/{citizenB}`. -> `PERMISSION_DENIED`
4. **Blanket User List Scraping**: Citizen A calls `list` on `/users`. -> `PERMISSION_DENIED`
5. **Unverified Email Write**: Authenticated user with `email_verified == false` attempts to create a complaint. -> `PERMISSION_DENIED`
6. **Admin Email Spoof**: User with `email: "singidigeethikavirimahitha@gmail.com"` and `email_verified: false` attempts admin read/write. -> `PERMISSION_DENIED`
7. **Complaint Identity Spoofing**: Citizen A creates a complaint with `citizenId: "citizenB"`. -> `PERMISSION_DENIED`
8. **Pre-Resolved Complaint Creation**: Citizen creates a complaint with `status: "Resolved"` or non-empty `adminRemarks`. -> `PERMISSION_DENIED`
9. **Citizen Status Tampering**: Citizen attempts to update their own complaint's `status` to `"Resolved"` or add `adminRemarks`. -> `PERMISSION_DENIED`
10. **Cross-Citizen Complaint List Scraping**: Citizen A lists `/complaints` without filtering to `citizenId == citizenA`. -> `PERMISSION_DENIED`
11. **Oversized/Poisoned Document ID**: User attempts to write `/complaints/{150_char_invalid_id}` with spaces or `$`. -> `PERMISSION_DENIED`
12. **Orphaned / Oversized Image Upload**: Citizen creates `/complaintImages/{id}` without parent complaint or with `sizeBytes > 262144`. -> `PERMISSION_DENIED`
