# Deployment Guide

This guide will walk you through deploying CodeTube to production using Vercel (frontend) and Railway (backend).

## Table of Contents

- [Quick Deploy](#quick-deploy)
- [Prerequisites](#prerequisites)
- [Backend Deployment (Railway)](#backend-deployment-railway)
- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Domain Configuration](#domain-configuration)
- [Troubleshooting](#troubleshooting)

---

## Quick Deploy

### One-Click Deployments

**Backend (Railway):**
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/yourusername/codetube)

**Frontend (Vercel):**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/codetube)

---

## Prerequisites

Before you begin, ensure you have:

- [ ] A [GitHub](https://github.com) account
- [ ] A [Vercel](https://vercel.com) account
- [ ] A [Railway](https://railway.app) account
- [ ] [Node.js](https://nodejs.org) 20+ installed locally (for testing)

---

## Backend Deployment (Railway)

### Step 1: Create a New Project

1. Log in to [Railway](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your forked CodeTube repository

### Step 2: Add PostgreSQL Database

1. Click "New" → "Database" → "Add PostgreSQL"
2. Railway will automatically provision a PostgreSQL instance
3. Note the connection details (will be auto-injected as env vars)

### Step 3: Add Redis

1. Click "New" → "Database" → "Add Redis"
2. Railway will provision a Redis instance
3. Connection details will be auto-injected

### Step 4: Configure Environment Variables

In your Railway project settings, add these environment variables:

```env
# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis
REDIS_URL=${{Redis.REDIS_URL}}

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=24h

# CORS
FRONTEND_URL=https://your-frontend-url.vercel.app

# Server
PORT=3001
NODE_ENV=production

# Storage (Optional - for file uploads)
# AWS_S3_BUCKET=your-bucket
# AWS_ACCESS_KEY_ID=your-key
# AWS_SECRET_ACCESS_KEY=your-secret
# AWS_REGION=us-east-1
```

### Step 5: Configure Build Settings

1. Go to your service settings
2. Set **Root Directory**: `backend`
3. Set **Build Command**: `npm install && npm run build`
4. Set **Start Command**: `npm start`

### Step 6: Deploy

1. Railway will automatically deploy when you push to the main branch
2. Your backend URL will be: `https://your-project.railway.app`
3. Test the health endpoint: `https://your-project.railway.app/health`

---

## Frontend Deployment (Vercel)

### Step 1: Import Project

1. Log in to [Vercel](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository

### Step 2: Configure Project

1. **Framework Preset**: Vite
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `dist` (default)

### Step 3: Environment Variables

Add these environment variables:

```env
VITE_API_URL=https://your-backend.railway.app/api
VITE_WS_URL=wss://your-backend.railway.app
```

### Step 4: Deploy

1. Click "Deploy"
2. Vercel will build and deploy your frontend
3. Your frontend URL will be: `https://your-project.vercel.app`

---

## Database Setup

### Initial Migration

After deploying the backend, run the initial migration:

**Option 1: Railway CLI**
```bash
npm install -g @railway/cli
railway login
railway link
railway run npm run db:migrate
```

**Option 2: Railway Dashboard**
1. Go to your Railway project
2. Click on your backend service
3. Go to the "Shell" tab
4. Run: `npm run db:migrate`

### (Optional) Seed Database

```bash
railway run npm run db:seed
```

---

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/codetube

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# CORS
FRONTEND_URL=http://localhost:5173

# Server
PORT=3001
NODE_ENV=development

# AWS S3 (Optional - for production file storage)
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
```

---

## Domain Configuration

### Custom Domain on Vercel

1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

### Custom Domain on Railway

1. Go to your Railway project settings
2. Click "Settings" → "Domains"
3. Click "Generate Domain" or add your custom domain
4. Update your DNS records as instructed

### Update CORS

Don't forget to update the `FRONTEND_URL` environment variable on Railway with your new custom domain!

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Problem**: `ECONNREFUSED` or timeout errors

**Solution**:
- Verify `DATABASE_URL` is correctly set
- Ensure Railway PostgreSQL is provisioned and running
- Check that the database accepts connections from your backend

#### 2. CORS Errors

**Problem**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution**:
- Update `FRONTEND_URL` in Railway to match your Vercel URL exactly
- Include `https://` prefix
- No trailing slash

#### 3. Build Failures

**Problem**: Frontend or backend fails to build

**Solution**:
- Check that all dependencies are in `package.json`
- Verify Node.js version (20+)
- Check build logs for specific errors

#### 4. WebSocket Connection Issues

**Problem**: Real-time features not working

**Solution**:
- Use `wss://` (not `ws://`) for production WebSocket URL
- Ensure Railway allows WebSocket connections
- Check browser console for specific errors

#### 5. JWT Errors

**Problem**: Authentication not working

**Solution**:
- Verify `JWT_SECRET` is set and at least 32 characters
- Ensure `JWT_EXPIRES_IN` is valid (e.g., `24h`, `7d`)
- Check that backend and frontend times are synchronized

### Getting Help

- 💬 [Discord Community](https://discord.gg/codetube)
- 🐛 [GitHub Issues](https://github.com/yourusername/codetube/issues)
- 📧 Email: support@codetube.dev

---

## Production Checklist

Before going live:

- [ ] Change default JWT_SECRET to a secure random string
- [ ] Enable HTTPS (Vercel/Railway do this automatically)
- [ ] Set up monitoring (Railway provides basic logs)
- [ ] Configure backups for PostgreSQL (Railway does this automatically)
- [ ] Test all features on staging environment
- [ ] Update documentation with production URLs
- [ ] Set up error tracking (Sentry, etc.)

---

## Alternative Deployment Options

### Docker Deployment

See our [Docker deployment guide](#) for self-hosting with Docker Compose.

### AWS Deployment

For AWS deployment using ECS/EKS, please refer to our [AWS deployment guide](#).

---

Happy deploying! 🚀
