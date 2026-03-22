# API Documentation

Complete API reference for CodeTube.

**Base URL:** `https://api.codetube.app/api`

**Authentication:** JWT Bearer Token in `Authorization` header

---

## Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Tutorials](#tutorials)
- [Recordings](#recordings)
- [Forks](#forks)
- [Progress](#progress)
- [WebSocket](#websocket)
- [Error Handling](#error-handling)

---

## Authentication

### Register

```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "username": "johndoe",
  "displayName": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "displayName": "John Doe",
      "createdAt": "2024-03-22T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Login

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "displayName": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Refresh Token

```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Logout

```http
POST /auth/logout
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Users

### Get Current User

```http
GET /me
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe",
    "avatar": "https://...",
    "bio": "Full-stack developer...",
    "createdAt": "2024-03-22T10:00:00Z",
    "stats": {
      "tutorialsCreated": 5,
      "tutorialsViewed": 42,
      "totalWatchTime": 3600
    }
  }
}
```

### Update Profile

```http
PUT /me
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "displayName": "John Doe",
  "bio": "Updated bio...",
  "avatar": "https://..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "displayName": "John Doe",
    "bio": "Updated bio...",
    "updatedAt": "2024-03-22T11:00:00Z"
  }
}
```

### Get User Profile

```http
GET /users/:username
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "johndoe",
    "displayName": "John Doe",
    "bio": "Full-stack developer...",
    "avatar": "https://...",
    "createdAt": "2024-03-22T10:00:00Z",
    "tutorials": [
      {
        "id": "uuid",
        "title": "React Hooks Tutorial",
        "thumbnail": "https://...",
        "viewCount": 1234,
        "createdAt": "2024-03-20T10:00:00Z"
      }
    ]
  }
}
```

---

## Tutorials

### List Tutorials

```http
GET /tutorials?page=1&limit=20&sort=recent&language=javascript
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |
| `sort` | string | `recent`, `popular`, `trending` |
| `language` | string | Filter by programming language |
| `difficulty` | string | `beginner`, `intermediate`, `advanced` |
| `search` | string | Search query |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tutorials": [
      {
        "id": "uuid",
        "title": "React Hooks Deep Dive",
        "description": "Learn useState, useEffect, and custom hooks...",
        "thumbnail": "https://...",
        "language": "javascript",
        "difficulty": "intermediate",
        "duration": 1800,
        "author": {
          "id": "uuid",
          "username": "johndoe",
          "displayName": "John Doe",
          "avatar": "https://..."
        },
        "stats": {
          "viewCount": 5420,
          "forkCount": 123,
          "likeCount": 890
        },
        "createdAt": "2024-03-20T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "totalPages": 8
    }
  }
}
```

### Get Tutorial

```http
GET /tutorials/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "React Hooks Deep Dive",
    "description": "Learn useState, useEffect, and custom hooks...",
    "thumbnail": "https://...",
    "language": "javascript",
    "difficulty": "intermediate",
    "duration": 1800,
    "recordingId": "uuid",
    "author": {
      "id": "uuid",
      "username": "johndoe",
      "displayName": "John Doe",
      "avatar": "https://..."
    },
    "stats": {
      "viewCount": 5420,
      "forkCount": 123,
      "likeCount": 890
    },
    "tags": ["react", "hooks", "javascript"],
    "createdAt": "2024-03-20T10:00:00Z",
    "updatedAt": "2024-03-21T10:00:00Z"
  }
}
```

### Create Tutorial

```http
POST /tutorials
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "React Hooks Deep Dive",
  "description": "Learn useState, useEffect, and custom hooks...",
  "language": "javascript",
  "difficulty": "intermediate",
  "tags": ["react", "hooks"],
  "recordingId": "uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "React Hooks Deep Dive",
    "slug": "react-hooks-deep-dive",
    "createdAt": "2024-03-22T10:00:00Z"
  }
}
```

### Update Tutorial

```http
PUT /tutorials/:id
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description...",
  "tags": ["react", "hooks", "updated"]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Updated Title",
    "updatedAt": "2024-03-22T11:00:00Z"
  }
}
```

### Delete Tutorial

```http
DELETE /tutorials/:id
Authorization: Bearer {token}
```

**Response (204):** No content

---

## Recordings

### Get Recording

```http
GET /recordings/:id
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "duration": 1800,
    "eventCount": 4520,
    "fileSize": 245760,
    "events": [
      {
        "timestamp": 0,
        "type": "insert",
        "data": {
          "position": { "line": 1, "column": 1 },
          "text": "import React from 'react';"
        }
      }
    ],
    "createdAt": "2024-03-20T10:00:00Z"
  }
}
```

### Stream Recording

```http
GET /recordings/:id/stream
```

Streams recording events as a readable stream for efficient playback.

**Response:** `application/octet-stream`

### Upload Recording

```http
POST /recordings
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body:**
- `recording`: File (compressed recording data)
- `duration`: Number (recording duration in seconds)
- `language`: String (programming language)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "duration": 1800,
    "fileSize": 245760,
    "createdAt": "2024-03-22T10:00:00Z"
  }
}
```

---

## Forks

### List My Forks

```http
GET /me/forks?page=1&limit=20
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "forks": [
      {
        "id": "uuid",
        "tutorial": {
          "id": "uuid",
          "title": "React Hooks Deep Dive",
          "author": {
            "username": "johndoe",
            "displayName": "John Doe"
          }
        },
        "snapshotAt": 900,
        "code": "import React...",
        "createdAt": "2024-03-22T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5
    }
  }
}
```

### Create Fork

```http
POST /tutorials/:id/forks
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "snapshotAt": 900,
  "code": "import React from 'react';\n\nfunction App() {...}"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tutorialId": "uuid",
    "forkUrl": "/tutorials/uuid/forks/uuid",
    "createdAt": "2024-03-22T10:00:00Z"
  }
}
```

### Get Fork

```http
GET /forks/:id
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tutorial": {
      "id": "uuid",
      "title": "React Hooks Deep Dive"
    },
    "snapshotAt": 900,
    "code": "import React...",
    "createdAt": "2024-03-22T10:00:00Z",
    "updatedAt": "2024-03-22T11:00:00Z"
  }
}
```

### Update Fork

```http
PUT /forks/:id
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "code": "import React from 'react';\n\n// Updated code..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "updatedAt": "2024-03-22T11:00:00Z"
  }
}
```

### Delete Fork

```http
DELETE /forks/:id
Authorization: Bearer {token}
```

**Response (204):** No content

---

## Progress

### Get Progress

```http
GET /me/progress
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "progress": [
      {
        "tutorialId": "uuid",
        "tutorialTitle": "React Hooks Deep Dive",
        "completed": false,
        "lastPosition": 450,
        "watchTime": 450,
        "percentComplete": 25,
        "lastViewedAt": "2024-03-22T10:00:00Z"
      }
    ]
  }
}
```

### Update Progress

```http
PUT /tutorials/:id/progress
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "lastPosition": 900,
  "watchTime": 900,
  "completed": false
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tutorialId": "uuid",
    "completed": false,
    "lastPosition": 900,
    "percentComplete": 50
  }
}
```

### Mark as Complete

```http
POST /tutorials/:id/complete
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tutorialId": "uuid",
    "completed": true,
    "completedAt": "2024-03-22T10:00:00Z"
  }
}
```

---

## WebSocket

Connect to WebSocket for real-time features:

```javascript
const ws = new WebSocket('wss://api.codetube.app/ws?token={jwt}');
```

### Message Types

#### Join Room
```json
{
  "type": "join",
  "roomId": "tutorial-uuid"
}
```

#### Cursor Position
```json
{
  "type": "cursor",
  "roomId": "tutorial-uuid",
  "payload": {
    "line": 10,
    "column": 15
  }
}
```

#### Code Edit
```json
{
  "type": "edit",
  "roomId": "tutorial-uuid",
  "payload": {
    "operation": "insert",
    "position": { "line": 5, "column": 10 },
    "text": "const x = 1;"
  }
}
```

#### Leave Room
```json
{
  "type": "leave",
  "roomId": "tutorial-uuid"
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional details
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": "Invalid email format",
      "password": "Password must be at least 8 characters"
    }
  }
}
```

---

## Rate Limiting

API requests are rate-limited:

| Endpoint Type | Limit |
|---------------|-------|
| Authentication | 10 requests / minute |
| API (authenticated) | 1000 requests / hour |
| API (unauthenticated) | 100 requests / hour |

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1647960000
```

---

## Pagination

List endpoints support cursor-based pagination:

**Query Parameters:**
- `page`: Page number (1-indexed)
- `limit`: Items per page (default: 20, max: 100)

**Response includes:**
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

**Last Updated:** March 22, 2024
