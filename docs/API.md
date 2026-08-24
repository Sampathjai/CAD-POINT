<!-- docs/API.md - Detailed API reference with examples -->

# CAD Point CRM — API Reference

Base URL (example): `https://api.example.com/api` or local `http://localhost:5001/api`

Authentication
- All protected endpoints require an `Authorization` header: `Authorization: Bearer <JWT>`.
- The JWT is issued by `POST /auth/login` and should be stored client-side (localStorage) for web clients.

-------------------------------------------------------------------------------
**Auth**

- POST /api/auth/login
	- Auth: public
	- Body (application/json):

```json
{ "email": "admin@cadpoint.com", "password": "Admin@123" }
```

	- Success response (200):

```json
{
	"success": true,
	"data": {
		"token": "<jwt-token>",
		"user": { "id": "uuid", "name": "CAD Point Admin", "email": "admin@cadpoint.com", "role": "SUPER_ADMIN" }
	}
}
```

- GET /api/auth/me
	- Auth: Bearer token
	- Success response (200):

```json
{ "success": true, "data": { "id": "uuid", "name": "...", "email": "...", "role": "COUNSELLOR", "isActive": true } }
```

-------------------------------------------------------------------------------
**Users**

- GET /api/users
	- Auth: `SUPER_ADMIN` only
	- Returns list of users

- POST /api/users
	- Auth: `SUPER_ADMIN` only
	- Body:

```json
{ "name": "John Doe", "email": "john@example.com", "phone": "9876543210", "password": "Secret123", "role": "COUNSELLOR", "isActive": true }
```

	- Success response:

```json
{ "success": true, "data": { "id": "uuid", "name": "John Doe", "email": "john@example.com" } }
```

-------------------------------------------------------------------------------
**Leads**

- GET /api/leads
	- Auth: any authenticated user
	- Query params supported: `?status=NEW&assignedCounsellorId=...` (implementation-specific)

- POST /api/leads
	- Auth: authenticated (role with leads.create allowed)
	- Body (example):

```json
{
	"firstName": "Rahul",
	"lastName": "Sharma",
	"phone": "9876543210",
	"email": "rahul@example.com",
	"interestedCourse": "AUTOCAD",
	"sourceId": "<enquiry-source-uuid>"
}
```

	- Success response:
```json
{ "success": true, "data": { "id": "uuid", "leadNumber": "L-0001", "firstName": "Rahul", "status": "NEW" } }
```

- GET /api/leads/:id
	- Auth: authenticated
	- Returns lead details including follow-ups and status history (if present)

-------------------------------------------------------------------------------
**Follow-ups**

- GET /api/followups
	- Auth: authenticated
	- Returns scheduled follow-ups for the current user or all depending on role

- POST /api/followups
	- Auth: authenticated
	- Body example:

```json
{ "leadId": "<lead-uuid>", "scheduledAt": "2026-08-30T10:00:00Z", "type": "CALL", "notes": "Call to discuss demo" }
```

	- Success response:

```json
{ "success": true, "data": { "id": "uuid", "leadId": "...", "scheduledAt": "2026-08-30T10:00:00.000Z", "status": "PENDING" } }
```

- PATCH /api/followups/:id/complete
	- Auth: authenticated
	- Marks follow-up `status` as `COMPLETED` and sets `completedAt`.

-------------------------------------------------------------------------------
**Search**

- GET /api/search?q=term
	- Auth: authenticated
	- Searches `leads`, `students`, and `courses` (case-insensitive, limited results)
	- Response example:

```json
{
	"success": true,
	"data": {
		"leads": [{ "id": "...", "firstName": "Rahul", "phone": "..." }],
		"students": [],
		"courses": [{ "id": "...", "courseCode": "AUTOCAD", "name": "AutoCAD" }]
	}
}
```

-------------------------------------------------------------------------------
**Notifications**

- GET /api/notifications
	- Auth: authenticated
	- Admins (`SUPER_ADMIN`, `ADMIN`) see all notifications; other roles see notifications where `userId` equals their id

- POST /api/notifications
	- Auth: `SUPER_ADMIN` or `ADMIN`
	- Body example (validated with Zod):

```json
{ "type": "SYSTEM", "title": "Server maintenance", "message": "Planned maintenance at 2AM", "userId": null }
```

	- Success response:

```json
{ "success": true, "data": { "id": "uuid", "type": "SYSTEM", "title": "Server maintenance", "isRead": false } }
```

- PATCH /api/notifications/:id/read
	- Auth: authenticated
	- Marks notification `isRead` true for allowed users

-------------------------------------------------------------------------------
**Courses**

- POST /api/courses
	- Auth: `SUPER_ADMIN` or `ADMIN`
	- Body (Zod validated):

```json
{ "courseCode": "AUTOCAD", "name": "AutoCAD", "description": "2D drafting course", "standardFee": 30000 }
```

	- Success response: created `course` object

-------------------------------------------------------------------------------
**Batches**

- POST /api/batches
	- Auth: `SUPER_ADMIN` or `ADMIN`
	- Body (Zod validated):

```json
{ "batchCode": "BATCH-101", "name": "Morning Batch", "courseId": "<course-uuid>", "startDate": "2026-09-01T09:00:00Z", "capacity": 25 }
```

-------------------------------------------------------------------------------
**Students**

- POST /api/students
	- Auth: `SUPER_ADMIN`, `ADMIN`, `COUNSELLOR`
	- Body (Zod validated):

```json
{ "studentCode": "STU-1001", "firstName": "Anita", "phone": "9876543210", "email": "anita@example.com" }
```

-------------------------------------------------------------------------------
**Admissions**

- POST /api/admissions
	- Auth: `SUPER_ADMIN`, `ADMIN`, `COUNSELLOR`
	- Body (Zod validated):

```json
{ "admissionNumber": "ADM-0001", "studentId": "<student-uuid>", "courseId": "<course-uuid>", "batchId": "<batch-uuid>", "finalFee": 30000 }
```


-------------------------------------------------------------------------------
**Payments**

- POST /api/payments
	- Auth: `SUPER_ADMIN`, `ADMIN`, `ACCOUNTS`
	- Body (Zod validated):

```json
{ "admissionId": "<admission-uuid>", "receiptNumber": "RCPT-001", "amount": 30000, "paymentMethod": "CASH" }
```

	- Success response: created `payment` object

-------------------------------------------------------------------------------
Errors
- All error responses are returned with a non-2xx status and JSON payload `{ success: false, message: "..." }`.

-------------------------------------------------------------------------------
Notes & next steps
- Input validation: most POST endpoints use Zod to validate requests; refer to `server/src/routes/*` for exact schemas.
- Pagination: list endpoints are basic; if you need paging, I can add `?page=`/`?limit=` parameters.
- Example client usage: wire `VITE_API_URL` to point to the API base and include the `Authorization` header after login.

If you want, I can generate a Postman collection or OpenAPI (Swagger) spec from these routes next.

