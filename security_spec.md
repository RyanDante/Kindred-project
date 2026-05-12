# Security Specification for Kindred

## Data Invariants
1. An orphanage listing must be approved by an admin to be publicly visible in lists/maps.
2. Only authenticated admins can approve or modify orphanage status.
3. Users can submit new orphanages, but they start as 'pending'.
4. Location coordinates must be numbers within reasonable bounds (Cameroon is approx Lat [1.5, 13], Lng [8, 16]).

## The Dirty Dozen Payloads
1. **Status Spoofing**: Submit an orphanage with `status: 'approved'`.
2. **Identity Spoofing**: Update an orphanage where `submittedByEmail` is different from the requester's email.
3. **Admin Escalation**: Create a document in `/admins/` to make oneself an admin.
4. **Denial of Wallet**: Submit an orphanage with a 1MB string in the `description` field.
5. **Orphaned Record**: Update an orphanage but omit required fields like `name` or `region`.
6. **Path Poisoning**: Create an orphanage with a 1KB string as its document ID.
7. **Bypass Verification**: Perform writes without `email_verified == true`.
8. **Shadow Update**: Add an `isVerified: true` hidden field to an existing orphanage.
9. **Relational Break**: Delete an orphanage as a regular user.
10. **Query Scrape**: List all orphanages including those in 'pending' status without admin rights.
11. **Malicious ID**: Use an ID like `../../../etc/passwd` to attempt traversal (guards required on IDs).
12. **Immutable Break**: Change the `createdAt` timestamp of a listing.

## Test Runner (Draft)
The tests will verify that all the above attempts return `PERMISSION_DENIED`.
