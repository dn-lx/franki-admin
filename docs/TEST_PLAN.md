# Franki Admin Test Plan

## 1. Authentication and authorization
- Launch while signed out: login screen appears.
- Wrong password: error appears and no admin data is shown.
- Correct `info@frankiflow.de` login: combined dashboard appears.
- Restart app: session remains available.
- Sign out: all admin views disappear immediately.
- Test a Supabase user not present in either admin allowlist: login must be rejected after authentication.

## 2. FrankiFlow
### Quotes
- Create a request on the public website/calculator and verify it appears in the app.
- Change status through New → Contacted → Quoted → Won/Lost.
- Save an internal note and verify it remains after reload.
- Test mail/phone actions.

### Clients and employees
- Create/edit/deactivate a test client.
- Create/edit/deactivate a test employee.
- Confirm hourly-rate decimals are stored correctly.

### Jobs and checklist
- Create a scheduled job with client and employee.
- Open job and mark it in progress/completed.
- Add checklist items.
- Mark item completed, then inspector checked.
- Verify a refresh preserves all statuses.

### Payments and calculator
- Verify existing payment rows and checkout URLs display.
- Change one calculator setting, confirm on the public calculator, then restore it.
- Test VAT, discount and Grundreinigung fields specifically.

### Website
- Edit a harmless DE/EN text and verify the site reflects it.
- Upload a gallery image and remove it.
- Add/edit/publish/unpublish a test testimonial.

## 3. FrankiHolz
### Booking
- Create a test pending booking for currently available dates.
- Verify total calculation and reference.
- Open the booking from the app.
- Approve it and verify Stripe Checkout URL is created.
- Confirm booked dates become unavailable.
- Share/open the payment URL.
- For an unpaid test booking, cancel and verify the hold/calendar is released.
- Do not test a paid cancellation without a refund plan; backend intentionally rejects it.

### Calendar
- Switch between all three rooms.
- Browse previous/next months.
- Verify booking dates are marked as booked.
- Block and unblock a free date.
- Add a nightly price override and verify displayed rate changes.
- Remove the override.
- Verify a real booking date cannot be manually released.

### Rooms/media
- Edit room description/base price/capacity and save.
- Toggle a test room inactive, confirm website behavior, then restore it.
- Upload and delete a room image.

### Dynamic pricing
- Record current values before changing.
- Test each rule individually and restore values after verification.
- Verify public rate estimate changes consistently.

### iCal/Airbnb
- Add a valid iCal export URL to the matching room.
- Sync the feed.
- Verify `last_status=ok` and external blocked dates appear in the calendar.
- Test an invalid URL and verify the error is visible without breaking other feeds.

## 4. Device testing
- iPhone small screen and current large screen.
- Android small/large screen.
- Light mode and automatic appearance.
- Slow/unstable network.
- Kill/relaunch while signed in.
- Background/foreground session refresh.
- Image library permission denied, then allowed.
- Telephone/mail/share actions on a physical device.

## 5. Release gate
- `npx expo-doctor`
- `npx tsc --noEmit`
- Development build on both platforms.
- No private secrets in source or build environment exposed to client.
- Supabase Security Advisor reviewed.
- Production icon/splash and store screenshots provided.
- Privacy policy/support URL ready for the store listings.
