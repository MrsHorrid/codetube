# CodeTube Deployment Architecture

## Overview

This document describes the deployment architecture and options for CodeTube.

## Deployment Options

### 1. Railway (Recommended for Beginners)

**Pros:**
- Automatic PostgreSQL and Redis provisioning
- Easy environment variable management
- Automatic HTTPS
- Generous free tier

**Cons:**
- Limited control over infrastructure

### 2. Render

**Pros:**
- Blueprint-based deployment
- Free tier available
- Automatic HTTPS

**Cons:**
- Slower cold starts on free tier

### 3. Vercel + Railway (Best Performance)

**Pros:**
- Frontend on global CDN (Vercel)
- Backend close to database (Railway)
- Best of both worlds

**Cons:**
- More complex setup
- Two platforms to manage

### 4. Self-Hosted (Maximum Control)

**Pros:**
- Full control
- No platform limitations
- Can be cheaper at scale

**Cons:**
- Requires server management
- Manual security updates

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Clients                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │  Chrome  │  │ Firefox  │  │  Mobile  │                  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                  │
└───────┼─────────────┼─────────────┼─────────────────────────┘
        │             │             │
        └─────────────┴─────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer / CDN                       │
│              (CloudFlare / AWS CloudFront)                   │
└─────────────────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│   Frontend   │        │   Backend    │
│   (Vercel)   │◀──────▶│   API        │
│              │  WebSocket │  (Railway)   │
└──────────────┘        └──────┬───────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
        ┌──────────────┐              ┌──────────────┐
        │  PostgreSQL  │              │    Redis     │
        │   (Railway)  │              │   (Railway)  │
        └──────────────┘              └──────────────┘
```

## Environment Variables

See `.env.production.example` for all available environment variables.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://host:6379` |
| `JWT_SECRET` | Secret for JWT signing | Use `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Use `openssl rand -base64 32` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend port | `3000` |
| `NODE_ENV` | Environment mode | `production` |
| `JWT_EXPIRES_IN` | JWT expiration | `1h` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d` |

## CI/CD Pipeline

The repository includes GitHub Actions workflows:

1. **CI** (`.github/workflows/ci.yml`)
   - Runs on every PR
   - Tests backend and frontend
   - Builds Docker images

2. **Deploy** (`.github/workflows/deploy.yml`)
   - Runs on merge to main
   - Deploys to staging/production
   - Supports Railway, Render, and VPS deployment

## Monitoring

### Health Check Endpoints

- `GET /health` - Backend health status
- Returns: `{"status":"ok","timestamp":"..."}`

### Logs

View logs with Docker:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Metrics

To add Prometheus metrics:

1. Install prom-client in backend
2. Add metrics endpoint
3. Configure Prometheus scraping

## Backup Strategy

### Automated Backups

For production, set up automated backups:

```bash
# Add to crontab (daily at 2 AM)
0 2 * * * /opt/codetube/scripts/backup.sh
```

### Backup Script

```bash
#!/bin/bash
BACKUP_DIR="/backups/codetube/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Database backup
docker exec codetube-postgres pg_dump -U codetube codetube | gzip > "$BACKUP_DIR/db.sql.gz"

# Uploads backup
tar -czf "$BACKUP_DIR/uploads.tar.gz" /opt/codetube/uploads

# Sync to S3 (optional)
aws s3 sync "$BACKUP_DIR" s3://your-backup-bucket/codetube/
```

## Security Checklist

- [ ] Change default passwords
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable database encryption at rest
- [ ] Use secrets management (not env files in production)
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Access logging

## Scaling

### Horizontal Scaling

To scale horizontally:

1. Use a managed database (RDS, Cloud SQL)
2. Use a managed Redis (ElastiCache, Redis Cloud)
3. Deploy multiple backend instances behind a load balancer
4. Use CDN for static assets

### Vertical Scaling

Increase resources:
```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

## Troubleshooting

### Common Issues

1. **Database connection refused**
   - Check `DATABASE_URL` format
   - Verify PostgreSQL is running
   - Check network connectivity

2. **JWT errors**
   - Verify `JWT_SECRET` is set
   - Check secret length (minimum 32 chars)

3. **CORS errors**
   - Update CORS origin in backend
   - Check `VITE_API_URL` in frontend

4. **Out of memory**
   - Add swap space
   - Increase Docker memory limit
   - Optimize Node.js memory: `--max-old-space-size=4096`

## Support

For deployment help:
- GitHub Issues: https://github.com/yourusername/codetube/issues
- Discord: https://discord.gg/codetube
- Email: support@codetube.dev
