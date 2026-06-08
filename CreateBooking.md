You are an expert frontend engineer working on an AI-Booking and Resource Management System for small local businesses.

Your task is to add an **Admin Booking Publisher Section** inside the admin dashboard.

Do **not** implement the backend yet.

Use frontend mock data, Zustand, and local mock logic only. Structure the feature so it can later connect to a Flask backend.

## Tech Stack

Use:

- React
- TypeScript
- Tailwind CSS
- Zustand

Do not introduce new major libraries unless necessary.

---

## Feature Goal

Create a section in the admin dashboard where an SME/business owner can:

1. Create a booking offering
2. Add service details
3. Assign specialists
4. Set available dates and time slots
5. Add business rules
6. Preview the booking page
7. Publish the booking page
8. Generate a shareable booking link
9. Copy/share the link with clients
10. Allow clients to access the booking page through the generated link

---

## Suggested Files

```txt
src/pages/AdminDashboard.tsx
src/pages/PublicBookingPage.tsx

src/components/admin/BookingPublisherPanel.tsx
src/components/admin/BookingSetupForm.tsx
src/components/admin/SpecialistAssignment.tsx
src/components/admin/AvailabilityEditor.tsx
src/components/admin/PublishedBookingLink.tsx
src/components/admin/BookingPreviewCard.tsx

src/store/adminBookingStore.ts
src/types/adminBooking.ts
src/data/adminBookingMockData.ts
src/lib/mockPublishedBookingApi.ts
````

Only create reusable components where they improve readability.

---

## Admin Dashboard Section

Add a new section titled:

```txt
Booking Page Publisher
```

This section should explain:

```txt
Create a booking page, publish it, and share the link with clients so they can book appointments.
```

---

## Booking Creation Form

The SME/admin should be able to enter:

* Booking page title
* Business name
* Service name
* Service description
* Service category
* Service duration
* Service price
* Location or online appointment option
* Booking notes/instructions

Example:

```txt
Title: Hair Consultation Booking
Business: Bello Beauty Studio
Service: Hair Consultation
Duration: 45 minutes
Price: £35
Location: In-store
```

---

## Specialist Assignment

Allow admin to select one or more specialists for the booking page.

Each specialist should include:

* Name
* Role/title
* Specialisation
* Years of experience
* Rating
* Availability status

Use mock specialist data for now.

The booking page should only show the selected specialists.

---

## Availability Editor

Allow admin to configure available time slots.

For now, keep this simple.

Admin should be able to:

* Select available days
* Add available time slots
* Mark some slots as unavailable
* Set maximum bookings per slot if needed

Example slots:

```ts
["09:00", "10:00", "11:30", "13:00", "14:30", "16:00"]
```

Unavailable slots should not be bookable by clients.

---

## Publish Booking Page

Add a clear publish button:

```txt
Publish Booking Page
```

When clicked:

1. Validate required fields
2. Generate a mock booking page ID
3. Mark the booking page as published
4. Generate a shareable link

Example generated link:

```txt
/book/hair-consultation-abc123
```

or:

```txt
http://localhost:5173/book/hair-consultation-abc123
```

Use frontend-only mock logic for now.

---

## Published Link Section

After publishing, show a success card:

```txt
Your booking page is live
```

Display:

* Generated booking link
* Copy link button
* Preview page button
* Published status badge

Example:

```txt
Status: Published
Link: http://localhost:5173/book/hair-consultation-abc123
```

The Copy Link button should copy the generated link to the clipboard.

If clipboard access fails, show the link clearly so the admin can copy it manually.

---

## Public Client Booking Page

Create a frontend route/page for the published booking link.

Suggested page:

```txt
src/pages/PublicBookingPage.tsx
```

The page should load the published booking data from the mock store/local mock API.

The client should see:

* Business name
* Booking page title
* Service details
* Duration and price
* Available specialists
* Available dates/time slots
* AI Scheduling Insight section
* Client details form
* Confirm booking button

This should connect visually and functionally with the existing Client Booking Portal.

---

## AI Insight Section

Include an AI Insight panel on the public booking page.

The insight should help the client choose a good appointment time.

Show:

* Conflict risk: Low / Medium / High
* Recommended time slot
* Specialist utilisation status
* Confidence percentage
* Short explanation

Example:

```txt
AI Scheduling Insight

Conflict Risk: Low
Recommended Slot: 10:00
Utilisation: Balanced
Confidence: 88%

This time is recommended because the specialist has fewer bookings around this period.
```

Use simple frontend mock logic only.

Example rules:

* Morning slots have lower conflict risk
* Afternoon slots have medium conflict risk
* Unavailable slots are high risk and disabled
* If a specialist has many unavailable slots, show high utilisation
* Recommend the earliest available morning slot

---

## Zustand Store Requirements

Create or update a Zustand store.

Suggested file:

```txt
src/store/adminBookingStore.ts
```

The store should manage:

```ts
draftBookingPage
publishedBookingPages
selectedSpecialists
availability
isPublished
publishedLink
```

Actions should include:

```ts
updateDraftBookingPage
selectSpecialist
removeSpecialist
updateAvailability
publishBookingPage
copyPublishedLink
resetDraftBookingPage
getPublishedBookingBySlug
```

Use local mock state only for now.

Optional: persist published booking pages to localStorage so refreshing the browser does not remove the generated link.

---

## TypeScript Types

Create clear types.

Suggested file:

```txt
src/types/adminBooking.ts
```

Include:

```ts
BookingPageDraft
PublishedBookingPage
BookingSpecialist
BookingAvailability
BookingTimeSlot
BookingPublishStatus
AIInsight
ClientBookingRequest
```

Avoid using `any`.

---

## UI Requirements

Use Tailwind CSS only.

The admin section should be:

* Clean
* Professional
* Easy to understand
* Suitable for SMEs
* Mobile responsive
* Card-based
* Clear CTA buttons
* Clear published/unpublished status

Use visual states:

* Draft
* Ready to publish
* Published
* Missing required fields

---

## Validation Rules

Admin cannot publish unless:

* Business name is provided
* Booking page title is provided
* Service name is provided
* Service duration is provided
* At least one specialist is selected
* At least one available time slot exists

Show simple validation messages.

---

## Important Behaviour

* Publishing should generate a unique booking link.
* The generated link should open the public client booking page.
* The public page should only show data from that published booking.
* The admin should be able to preview before publishing.
* The admin should be able to copy the published link.
* The client should be able to book from the published page using mock frontend logic.
* Do not implement Flask backend yet.
* Do not create database logic yet.
* Do not create real authentication logic yet.

---

## Output Expected

Implement the frontend feature only with:

* Admin booking publisher section
* Booking setup form
* Specialist assignment
* Availability editor
* Publish button
* Generated booking link
* Copy link functionality
* Public client booking page
* AI insight section
* Zustand store
* TypeScript types
* Mock data/helper functions
* Clear explanation of changed files
* Instructions on how to test the feature

Keep the code simple, readable, and suitable for a dissertation software artefact.