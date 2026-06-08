You are an expert frontend engineer working on an AI-Booking and Resource Management System for small local businesses.

Your task is to create a **Client Booking Portal** where customers can book appointments and choose a specialist.

Do **not** implement the backend yet.

For now, use frontend mock data and mock API functions only. Structure the code so it can later connect to a Flask backend, but do not create Flask files, routes, or backend services in this task.


## Feature Goal

Build a client-facing booking portal that allows a customer to:

1. View available services
2. Choose a service
3. Choose a specialist/staff member
4. Select an available date and time slot
5. Enter basic booking details
6. View AI-powered booking insights before confirming
7. Submit the booking locally using mock logic
8. See confirmation after successful booking

## Frontend Structure

Suggested files:

```txt
src/pages/ClientBookingPortal.tsx
src/components/booking/ServiceCard.tsx
src/components/booking/SpecialistCard.tsx
src/components/booking/TimeSlotPicker.tsx
src/components/booking/ClientDetailsForm.tsx
src/components/booking/AIInsightCard.tsx
src/components/booking/BookingConfirmation.tsx
src/store/bookingStore.ts
src/types/booking.ts
src/lib/mockBookingApi.ts
src/data/bookingMockData.ts
````

Only create reusable components where they make the page easier to read.

## Page Sections

### 1. Header Section

Display:

* Business name
* Welcome message
* Short text: “Book an appointment with one of our specialists.”

### 2. Service Selection

Show services as selectable cards.

Each service should include:

* Service name
* Short description
* Duration
* Price
* Category

Example services:

* Hair Consultation
* Skin Treatment
* Business Consultation
* Personal Training Session
* Dental Check-up

### 3. Specialist Selection

After selecting a service, show specialists who can provide that service.

Each specialist card should include:

* Specialist name
* Role/title
* Placeholder initials/avatar
* Years of experience
* Rating
* Availability status
* Specialisation

The client must be able to select one specialist.

### 4. Date and Time Slot Selection

Allow the client to choose:

* Date
* Available time slot

Show time slots as buttons/cards.

Example time slots:

```ts
["09:00", "10:00", "11:30", "13:00", "14:30", "16:00"]
```

Unavailable slots should be visually disabled.

### 5. Client Details Form

Create a form with:

* Full name
* Email address
* Phone number
* Optional note/reason for visit

Validate required fields before submission.

### 6. AI Insight Section

Add a visible **AI Scheduling Insight** panel before the final booking button.

For now, generate AI insight using mock frontend logic.

The AI insight should update when the user changes:

* selected service
* selected specialist
* selected date
* selected time

The insight should include:

* Conflict risk: Low / Medium / High
* Recommended time slot
* Specialist utilisation status
* Short AI explanation
* Confidence percentage

Example insight:

```txt
Conflict risk: Low
Recommended slot: 10:00
Utilisation: Balanced
Confidence: 87%
Explanation: This time slot has low demand and does not overlap with existing bookings.
```

Use simple rule-based mock logic:

* If selected time is unavailable, conflict risk is High.
* If selected time is after 14:00, conflict risk is Medium.
* If selected time is before 12:00, conflict risk is Low.
* Recommend the earliest available morning slot where possible.
* If specialist has many unavailable slots, show “High utilisation.”
* Otherwise show “Balanced utilisation.”

### 7. Booking Confirmation

After successful local submission:

* Show success message
* Display appointment summary
* Include service, specialist, date, time, and client name
* Add a “Book Another Appointment” button

## Zustand Store Requirements

Create a Zustand store to manage booking state.

Suggested file:

```txt
src/store/bookingStore.ts
```

Store should manage:

* selectedService
* selectedSpecialist
* selectedDate
* selectedTime
* clientDetails
* aiInsight
* bookingStatus

Include actions:

* setService
* setSpecialist
* setDate
* setTime
* updateClientDetails
* setAIInsight
* submitMockBooking
* resetBooking

## TypeScript Types

Create clear TypeScript types.

Suggested file:

```txt
src/types/booking.ts
```

Include types for:

```ts
Service
Specialist
TimeSlot
ClientDetails
AIInsight
BookingStatus
BookingRequest
BookingConfirmation
```

Avoid using `any`.

## Mock Data

Create mock frontend data.

Suggested file:

```txt
src/data/bookingMockData.ts
```

Include:

* services
* specialists
* time slots
* unavailable slots
* existing mock bookings

## Mock API Helper

Create mock API/helper functions.

Suggested file:

```txt
src/lib/mockBookingApi.ts
```

Include functions such as:

```ts
getServices()
getSpecialistsByService(serviceId)
getAvailability(specialistId, date)
generateAIInsight(payload)
submitMockBooking(payload)
```

These should simulate backend behaviour but remain frontend-only.

Do not create Flask backend files yet.

## UI Design Requirements

Use Tailwind CSS only.

The portal should be:

* Professional
* Clean
* Mobile-responsive
* Easy for customers to use
* Suitable for small local businesses

Use:

* Card-based layout
* Rounded corners
* Soft shadows
* Clear section headings
* Highlighted selected cards
* Disabled unavailable slots
* Clear primary booking button
* Friendly success state

## Important Behaviour

* User cannot choose specialist before selecting a service.
* User cannot choose time before selecting specialist and date.
* User cannot submit without required client details.
* User cannot submit unavailable time slots.
* AI insight appears only after service, specialist, date, and time are selected.
* Booking confirmation appears only after successful mock submission.
* Reset selected specialist and time when service changes.
* Reset selected time when specialist or date changes.

## Output Expected

Implement the frontend feature only with:

* React TypeScript page
* Booking components
* Zustand booking store
* TypeScript types
* Mock data
* Mock API/helper functions
* AI insight mock logic
* Clear explanation of changed files
* Instructions on how to run and test the feature

Do not implement backend yet.
Do not create Flask routes yet.
Do not create database logic yet.

Keep the code clean, simple, readable, and suitable for a dissertation software artefact.
