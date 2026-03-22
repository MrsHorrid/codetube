# Architecture Overview

This document provides a high-level overview of CodeTube's architecture. For the complete technical architecture, see [ARCHITECTURE.md](../ARCHITECTURE.md) in the repository root.

---

## System Overview

CodeTube is a full-stack application consisting of:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Creator    │  │   Viewer    │  │   Admin Dashboard   │  │
│  │  Interface  │  │  Interface  │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        API LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   REST API  │  │  WebSocket  │  │   Auth Middleware   │  │
│  │   (Express) │  │   Server    │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Recording  │  │   Playback  │  │   User/Auth         │  │
│  │   Service   │  │   Service   │  │   Service           │  │
│  ├─────────────┤  ├─────────────┤  ├─────────────────────┤  │
│  │  Upload     │  │   State     │  │   Analytics         │  │
│  │   Service   │  │   Service   │  │   Service           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  PostgreSQL │  │    Redis    │  │   Object Storage    │  │
│  │  (Primary)  │  │   (Cache)   │  │   (S3/MinIO)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Recording System

The recording system captures coding sessions as a stream of events rather than video:

| Component | Technology | Purpose |
|-----------|------------|---------|
| Event Capture | JavaScript/TypeScript | Capture keystrokes, cursor movements, selections |
| Compression | Custom Algorithm | Reduce recording size by 90% vs video |
| Storage | S3/MinIO | Store raw recordings |
| Processing | Node.js Worker | Index, validate, and prepare recordings |

**Recording Format:**
```typescript
interface RecordingEvent {
  timestamp: number;      // Milliseconds since start
  type: 'keystroke' | 'cursor' | 'selection' | 'insert' | 'delete';
  data: {
    position?: { line: number; column: number };
    text?: string;
    range?: { start: number; end: number };
  };
}
```

### 2. Playback Engine

The playback engine reconstructs the coding session in real-time:

| Component | Technology | Purpose |
|-----------|------------|---------|
| Editor | Monaco Editor | VS Code-like editing experience |
| Renderer | Custom React | Apply events to editor state |
| Sync | WebSocket | Real-time collaboration features |
| State | Zustand | Client-side state management |

### 3. Fork System

The fork system allows users to create their own versions of tutorials:

- **Fork Creation**: Snapshot of current editor state at any point
- **Branch Management**: Multiple forks per tutorial
- **Diff Engine**: Compare forks with original
- **Metadata Storage**: PostgreSQL tracks fork relationships

### 4. User Management

| Feature | Implementation |
|---------|---------------|
| Authentication | JWT tokens with refresh rotation |
| Authorization | Role-based access control (RBAC) |
| Profiles | PostgreSQL with user stats |
| Progress | Redis for fast access, PostgreSQL for persistence |

---

## Data Flow

### Recording Flow

```
Creator Browser → Event Capture → Compression → API → S3 + PostgreSQL
                                        ↓
                                   Processing Queue
                                        ↓
                                   Indexed Storage
```

### Playback Flow

```
Viewer Browser → Request Tutorial → API → PostgreSQL (metadata)
                                           ↓
                                        S3 (recording)
                                           ↓
Viewer Browser ← Stream Recording ← API
       ↓
Monaco Editor (render events)
```

### Fork Flow

```
Viewer Browser → Pause → Modify Code → Click Fork
                                           ↓
                              Create Snapshot (PostgreSQL)
                                           ↓
                              Generate Fork URL
                                           ↓
                              Redirect to Editor
```

---

## Technology Stack

### Frontend

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React | 18+ |
| Language | TypeScript | 5.0+ |
| Build Tool | Vite | 6.0+ |
| Styling | Tailwind CSS | 4.0+ |
| Editor | Monaco Editor | Latest |
| State | Zustand | 5.0+ |
| Routing | React Router | 6.0+ |
| Icons | Lucide React | Latest |

### Backend

| Category | Technology | Version |
|----------|------------|---------|
| Runtime | Node.js | 20+ |
| Framework | Express | 5.0+ |
| Language | TypeScript | 5.0+ |
| ORM | Prisma | 5.0+ |
| Validation | Zod | 4.0+ |
| Auth | JWT | 9.0+ |
| WebSocket | ws | 8.0+ |

### Database & Cache

| Category | Technology | Purpose |
|----------|------------|---------|
| Primary DB | PostgreSQL 15+ | User data, tutorials, forks |
| Cache | Redis 7+ | Sessions, real-time state |
| Storage | S3/MinIO | Recording files |

---

## Scalability Considerations

### Horizontal Scaling

- **Stateless API**: Backend can scale horizontally with load balancer
- **Database**: Read replicas for query-heavy operations
- **Cache**: Redis Cluster for distributed caching
- **Storage**: CDN for recording delivery

### Performance Optimizations

1. **Lazy Loading**: Recordings loaded on-demand
2. **Pagination**: API responses paginated
3. **Caching**: Redis for hot data
4. **Compression**: Gzip for API responses
5. **CDN**: Edge caching for static assets

---

## Security Architecture

| Layer | Measures |
|-------|----------|
| Transport | HTTPS/TLS 1.3 |
| Authentication | JWT with secure httpOnly cookies |
| Authorization | RBAC with middleware checks |
| Input | Zod validation on all inputs |
| Database | Parameterized queries (Prisma) |
| CORS | Whitelist-based |
| Headers | Helmet.js for security headers |

---

## API Architecture

RESTful API design with these principles:

- **Resource-based URLs**: `/api/tutorials`, `/api/users`
- **HTTP Methods**: GET, POST, PUT, DELETE, PATCH
- **Status Codes**: Proper HTTP status codes
- **Error Format**: Consistent error response format
- **Pagination**: Cursor-based for large collections
- **Versioning**: URL-based versioning (`/api/v1/`)

---

## WebSocket Architecture

Used for real-time features:

- **Live Collaboration**: Multiple users editing simultaneously
- **Presence**: User online/offline status
- **Notifications**: Real-time updates
- **Recording Sync**: Live recording sessions

Protocol:
```typescript
interface WebSocketMessage {
  type: 'join' | 'leave' | 'edit' | 'cursor' | 'sync';
  roomId: string;
  payload: unknown;
  timestamp: number;
}
```

---

## Deployment Architecture

### Development

```
Local Machine
├── Frontend (Vite dev server: 5173)
├── Backend (Node.js: 3001)
├── PostgreSQL (Docker: 5432)
└── Redis (Docker: 6379)
```

### Production (Vercel + Railway)

```
┌─────────────────┐     ┌──────────────────────────┐
│   Vercel Edge   │────▶│    Railway Platform      │
│   (Frontend)    │     │  ┌────────────────────┐  │
└─────────────────┘     │  │  Node.js Backend   │  │
                        │  └────────────────────┘  │
                        │  ┌────────────────────┐  │
                        │  │   PostgreSQL       │  │
                        │  └────────────────────┘  │
                        │  ┌────────────────────┐  │
                        │  │   Redis            │  │
                        │  └────────────────────┘  │
                        └──────────────────────────┘
```

---

## Monitoring & Observability

Recommended tools for production:

| Category | Tool | Purpose |
|----------|------|---------|
| Logs | Railway Logs / CloudWatch | Application logs |
| Metrics | Datadog / Grafana | Performance metrics |
| Errors | Sentry | Error tracking |
| Uptime | UptimeRobot / Pingdom | Availability monitoring |

---

## Future Architecture Plans

### Short Term (v0.2.0)
- [ ] AI Voice Service Integration
- [ ] Search Service (Elasticsearch)
- [ ] Background Job Queue (BullMQ)

### Medium Term (v0.3.0)
- [ ] Microservices Split
- [ ] Event Sourcing for Recordings
- [ ] Multi-region Deployment

### Long Term (v1.0.0)
- [ ] Edge Computing (Cloudflare Workers)
- [ ] WebRTC for P2P Collaboration
- [ ] Custom Video Codec for Recordings

---

## References

- [ARCHITECTURE.md](../ARCHITECTURE.md) - Complete technical specification
- [API.md](API.md) - API documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment instructions
