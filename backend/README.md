# CodeTube Backend

Interactive Coding Tutorial Platform Backend API

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: SQLite (Prisma ORM)
  - Production: PostgreSQL ready
- **WebSocket**: Real-time playback sync
- **Authentication**: JWT
- **Testing**: Jest + Supertest

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### Development

```bash
# Start development server
npm run dev

# Server runs on http://localhost:3000
# WebSocket on ws://localhost:3000/ws
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Tutorials

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tutorials` | List all tutorials |
| POST | `/api/tutorials` | Create tutorial |
| GET | `/api/tutorials/:id` | Get tutorial by ID |
| PATCH | `/api/tutorials/:id` | Update tutorial |
| POST | `/api/tutorials/:id/publish` | Publish tutorial |

### Recordings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/recordings` | Create recording |
| GET | `/api/recordings/:id` | Get recording metadata |
| GET | `/api/recordings/:id/stream` | Stream recording data |
| POST | `/api/recordings/:id/confirm` | Confirm upload |
| GET | `/api/recordings/:id/checkpoints` | List checkpoints |
| POST | `/api/recordings/:id/checkpoints` | Create checkpoint |

### Progress

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/tutorials/:id/progress` | Update progress |
| POST | `/api/tutorials/:id/progress/complete` | Mark complete |
| GET | `/api/me/progress` | Get all user progress |

### Forks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tutorials/:id/forks` | Create fork |
| GET | `/api/me/forks` | Get user forks |
| GET | `/api/forks/:id` | Get fork by ID |
| PATCH | `/api/forks/:id` | Update fork |
| DELETE | `/api/forks/:id` | Delete fork |
| GET | `/api/forks/share/:token` | Get fork by share token |

## WebSocket Events

### Client → Server

```json
// Authentication
{ "type": "auth", "token": "jwt_token" }

// Join session
{ "type": "session.join", "tutorialId": "uuid", "recordingId": "uuid" }

// Leave session
{ "type": "session.leave" }

// Sync playback
{ "type": "playback.sync", "timestampMs": 15000, "eventIndex": 100, "action": "playing" }
```

### Server → Client

```json
// Auth success
{ "type": "auth_ok", "payload": { "userId": "uuid", "sessionId": "sess_xxx" } }

// Session joined
{ "type": "session.joined", "payload": { "tutorialId": "uuid", "activeViewers": 5 } }

// Viewer count update
{ "type": "session.viewers", "payload": { "tutorialId": "uuid", "count": 5 } }

// Playback synced
{ "type": "playback.synced", "payload": { "timestampMs": 15000 } }

// Error
{ "type": "error", "payload": { "code": "ERROR_CODE", "message": "..." } }
```

## Database Schema

### Models

- **User**: Users, creators, and admins
- **Tutorial**: Tutorial metadata and stats
- **Recording**: Recording metadata and storage info
- **Checkpoint**: Saved editor states
- **ViewerProgress**: User progress tracking
- **ViewerFork**: User forked code states
- **Comment**: Comments and reviews
- **Subscription**: Creator subscriptions

## Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV="development"
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npx prisma migrate dev` | Run database migrations |
| `npx prisma studio` | Open Prisma Studio |

## Project Structure

```
src/
├── __tests__/          # Test files
├── middleware/         # Express middleware
│   ├── auth.ts        # JWT authentication
│   └── validation.ts  # Request validation
├── models/            # Database models
│   └── prisma.ts      # Prisma client
├── routes/            # API routes
│   ├── auth.ts
│   ├── tutorials.ts
│   ├── recordings.ts
│   ├── progress.ts
│   └── forks.ts
├── services/          # Business logic
│   ├── authService.ts
│   ├── tutorialService.ts
│   ├── recordingService.ts
│   ├── progressService.ts
│   └── forkService.ts
├── types/             # TypeScript types
├── utils/             # Utilities
│   └── config.ts      # Configuration
├── websocket/         # WebSocket server
│   └── server.ts
├── app.ts             # Express app
└── index.ts           # Entry point
```

## Production Deployment

1. Switch to PostgreSQL:
   ```env
   DATABASE_URL="postgresql://user:pass@localhost:5432/codetube"
   ```

2. Update Prisma schema datasource provider to `postgresql`

3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

4. Build and start:
   ```bash
   npm run build
   npm start
   ```

## License

MIT
