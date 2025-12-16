# Hip-Notes API

A comprehensive note-making REST API built to showcase the capabilities of the [hipthrusts](https://github.com/yourusername/hipthrusts) library. This project demonstrates all major hipthrusts features including dual validation strategies (Mongoose and Zod), reusable mixins, authorization patterns, and proper error handling.

## Features

- ✅ Full CRUD operations for notes
- ✅ Dual validation implementations (Mongoose & Zod)
- ✅ Reusable mixins for DRY code
- ✅ Authorization with ownership checks
- ✅ Pagination, search, and sorting
- ✅ Response sanitization
- ✅ Type-safe throughout with TypeScript
- ✅ Production-ready error handling

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/notes` | Create a new note |
| `GET` | `/notes` | List notes with pagination |
| `GET` | `/notes/:id` | Get a specific note by ID |
| `PATCH` | `/notes/:id` | Update a note |
| `DELETE` | `/notes/:id` | Delete a note |
| `GET` | `/health` | Health check |

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB running locally or accessible
- pnpm (or npm)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables (optional)
cp .env.example .env

# Edit .env and configure MongoDB connection if needed
# For WSL users: Use Windows host IP
```

### Running the Server

```bash
# Start with Zod validation (default)
pnpm start

# Or with Mongoose validation
VALIDATION_STRATEGY=mongoose pnpm start
```

The server will start on `http://localhost:3000`

## Usage Examples

### Create a Note

```bash
curl -X POST http://localhost:3000/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Note",
    "content": "This is the content of my note",
    "secret": "This is a secret message"
  }'
```

**Response (201 Created):**
```json
{
  "_id": "65a1234...",
  "title": "My First Note",
  "content": "This is the content of my note",
  "ownerId": "65a1234...",
  "secret": "This is a secret message",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### List Notes

```bash
# Basic list
curl http://localhost:3000/notes

# With pagination
curl "http://localhost:3000/notes?page=1&limit=10"

# With search
curl "http://localhost:3000/notes?search=first"

# With sorting
curl "http://localhost:3000/notes?sort=-createdAt"

# Combined
curl "http://localhost:3000/notes?page=1&limit=5&search=note&sort=-updatedAt"
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "65a1234...",
      "title": "My First Note",
      "content": "This is the content",
      "ownerId": "65a1234...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

Note: The `secret` field is hidden in list views.

### Get Note by ID

```bash
curl http://localhost:3000/notes/65a123450001234500012345
```

**Response (200 OK):**
```json
{
  "_id": "65a1234...",
  "title": "My First Note",
  "content": "This is the content of my note",
  "ownerId": "65a1234...",
  "secret": "This is a secret message",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Update a Note

```bash
curl -X PATCH http://localhost:3000/notes/65a123450001234500012345 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title"
  }'
```

**Response (200 OK):** Returns the updated note

### Delete a Note

```bash
curl -X DELETE http://localhost:3000/notes/65a123450001234500012345
```

**Response (204 No Content):** Empty response

## Error Responses

The API uses standard HTTP status codes:

- `400 Bad Request` - Invalid input (bad ObjectId, validation failure)
- `403 Forbidden` - Not authenticated or not authorized (not owner)
- `404 Not Found` - Note not found
- `500 Internal Server Error` - Server error

Example error response:
```json
{
  "success": false,
  "error": "Invalid ObjectId format"
}
```

## Validation Strategies

This project demonstrates two validation approaches:

### Zod Validation (Default)

- Uses Zod schemas for runtime validation
- Type-safe with TypeScript inference
- Located in `src/handlers/usingZod/`

### Mongoose Validation

- Uses Mongoose schema validation
- Leverages MongoDB's native validation
- Located in `src/handlers/usingMongoose/`

Switch between strategies using the `VALIDATION_STRATEGY` environment variable.

## Project Structure

```
src/
├── models/
│   └── note.ts                    # Mongoose model and schema
├── handlers/
│   ├── mixins/                    # Reusable patterns
│   │   ├── auth.ts               # Authentication mixins
│   │   ├── ownership.ts          # Ownership verification
│   │   ├── pagination.ts         # Pagination logic
│   │   └── sanitization.ts       # Response masking
│   ├── usingZod/                 # Zod-based handlers
│   │   ├── createNote.ts
│   │   ├── getNoteById.ts
│   │   ├── listNotes.ts
│   │   ├── updateNote.ts
│   │   └── deleteNote.ts
│   └── usingMongoose/            # Mongoose-based handlers
│       ├── createNote.ts
│       ├── getNoteById.ts
│       ├── listNotes.ts
│       ├── updateNote.ts
│       └── deleteNote.ts
├── routes/
│   └── notes.ts                  # Route definitions
└── server.ts                     # Express app setup
```

## Hipthrusts Features Showcased

### Lifecycle Stages

All handlers demonstrate the complete hipthrusts lifecycle:

- `initPreContext` - Extract user context
- `sanitizeParams` - Validate URL parameters
- `sanitizeQueryParams` - Validate query strings
- `sanitizeBody` - Validate request body
- `preAuthorize` - Early authorization checks
- `attachData` - Fetch required data
- `finalAuthorize` - Ownership-based authorization
- `doWork` - Execute business logic
- `respond` - Format response
- `sanitizeResponse` - Validate and mask response

### Reusable Mixins

The project uses HTPipe composition for DRY code:

```typescript
import { ExtractUserId, RequireAuthenticated } from "../mixins/auth";
import { RequireOwnership } from "../mixins/ownership";

export const GetNoteHandler = defineExpressHandler({
  ...ExtractUserId,
  ...RequireAuthenticated,
  ...RequireOwnership("note"),
  // ... rest of handler
});
```

### Helper Functions

Demonstrates hipthrusts utility functions:

- `findByIdRequired()` - Fetch by ID or throw 404
- `SanitizeBodyWithZod()` / `SanitizeBodyWithMongoose()` - Body validation
- `SanitizeParamsWithZod()` / `SanitizeParamsWithMongoose()` - Param validation
- `AttachData()` - Data fetching helper

### Authorization Patterns

Shows two-tier authorization:

1. **preAuthorize**: Fast, synchronous checks (e.g., role-based)
2. **finalAuthorize**: After data fetch (e.g., ownership verification)

### Response Sanitization

Demonstrates conditional field masking:

- Owners see all fields including `secret`
- List views hide `secret` fields
- Type-safe response validation

## Authentication

Currently uses mock authentication middleware that simulates a logged-in user with ID `65a123450001234500012345`.

In production, replace with JWT, session-based auth, or OAuth.

## Development

```bash
# Run in development mode with auto-reload
pnpm dev

# Build TypeScript
pnpm build

# Type check
pnpm type-check
```

## Testing

Test the API with different validation strategies:

```bash
# Test with Zod
VALIDATION_STRATEGY=zod pnpm start

# Test with Mongoose
VALIDATION_STRATEGY=mongoose pnpm start
```

Both should produce identical results, showcasing hipthrusts' flexibility.

## WSL Users

If running in WSL with MongoDB on Windows:

1. Get Windows host IP:
   ```bash
   cat /etc/resolv.conf | grep nameserver
   ```

2. Set MongoDB URI:
   ```bash
   export MONGO_URI="mongodb://<windows-ip>:27017/hipnotes"
   ```

3. Ensure MongoDB binds to `0.0.0.0` (not just `127.0.0.1`)

## License

MIT

## Contributing

This is a showcase project for the hipthrusts library. Feel free to use it as a reference for your own projects!
