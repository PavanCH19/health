# Business-logic fixes

## Security / access
1. **Anyone could register as ADMIN** (`role` came straight from the request). ADMIN self-registration is now rejected; `role` is required.
2. **Roles were never enforced** on donor/hospital endpoints. Added `@PreAuthorize`: profile/donation/donor-dashboard/nearby-requests = DONOR; hospital, blood-request, donor-search/matching, hospital-dashboard = HOSPITAL; `/donors/all` = HOSPITAL or ADMIN.
3. **Hospital verification was never checked.** Only admin-verified hospitals can create requests, search donors or match donors.
4. **Any hospital could pull/notify donors for another hospital's request.** Ownership is now checked.
5. Admin can no longer block ADMIN accounts.

## Blood requests
6. Client could create a request already `FULFILLED`/anything; new requests are always `OPEN`. `@Valid` was missing on create, so DTO validation never ran; `requestedById` is no longer required from the client.
7. `requiredBefore` must be in the future; lat/lon ranges validated.
8. **No status state machine** (a CANCELLED/FULFILLED request could be reopened). Now: OPEN<->MATCHING, any -> FULFILLED/CANCELLED, final states locked.
9. `MATCHING` was never used. Matching donors now moves OPEN -> MATCHING; nearby-requests shows OPEN and MATCHING.
10. Expired requests were shown forever; they are now excluded.
11. **Request `id` was missing from `GET /requestBlood/my`** so clients couldn't update status or find donors. Added; list sorted newest first.
12. Deactivating/blocking a hospital now cancels its active requests.
13. Not-found/forbidden errors were bare `RuntimeException` (HTTP 500); now 404/403/409 via `ResourceNotFoundException` / new `BusinessRuleException`.

## Donor matching
14. **Only the identical blood group matched.** Now uses real compatibility (O- to all, AB+ from all, ...) — see `DonationRules`.
15. **Donation cooldown was never applied.** Matching excludes donors within 90 days of their last donation; dashboard shows eligibility (was `null`).
16. **Deactivated/blocked donors still appeared** in searches and counts. Queries join `users.active`; deactivate/block also sets `available=false`.
17. Matching wrote `notifiedAt` with status `PENDING` and never notified anyone. Matches are now `NOTIFIED` and the donor gets a notification (`NotificationService.createNotification` was never called anywhere).
18. Radius search hard-coded `available=true`, so `available=false` filter returned nothing; the no-radius search ignored availability/active. Both consistent now.
19. Donors see only requests their blood group can serve (previously all).
20. Radius validated (>0, <=500 km).

## Donations
21. **`lastDonationDate` was never updated** -> cooldown/"Last donated" never worked. Now updated on each donation.
22. Added: no future dates, 90-day gap between donations, units 1–2, date required (was a DB error).
23. Donation for a request now checks the request is active and blood group compatible, marks the donor's match `COMPLETED`, and auto-sets the request `FULFILLED` once donated units >= `unitsRequired`; requester is notified.

## Profiles
24. **PATCH silently ignored `name` and `birthDate`** (DTO/entity name mismatch under strict ModelMapper). Patch is now explicit.
25. Profile creation had no effective validation (`@Valid` on a DTO with no constraints). Required fields, age 18–65, coordinates checked; phone uniqueness re-checked on update.
26. Donors had **no way to set availability**; `available` added to the update DTO/response. Blood group locked after a donation exists.
27. Hospital profile never set the PostGIS `location` (so `Hospital location not found` on every donor search). Lat/lon now required and synced to `location`. License uniqueness pre-checked; changing name/license resets verification.

## Dashboards
28. Hospital `activeRequests` counted every request ever made; now OPEN/MATCHING only.
29. `availableDonorsNearby` was `count(*)` of all profiles; now available, active, eligible donors within 25 km.
30. Donor dashboard `donationEligibility` and `nearbyRequests` were never populated; now filled.

## Misc
31. `/donors/all` crashed on donors without blood group or names with double spaces; fixed. Admin pending-hospital list hides deactivated hospitals. Removed debug `System.out.println`.

## Not changed (please review)
- `application.properties` contains the DB password and `JwtUtil` a hard-coded JWT secret: move to env vars, and rotate since they're in git.
- No admin seeding exists now that ADMIN can't self-register: insert one admin row manually.
- Donors still can't accept/reject a match (`MatchStatus.ACCEPTED/REJECTED` are unused).
- `GET /requestBlood/nearby` (with `bloodReqId`) has side effects (creates matches, sends notifications). A `POST` would be more correct.
- Emails are not case-normalized.
