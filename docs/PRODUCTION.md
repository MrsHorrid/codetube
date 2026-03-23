# CodeTube Production Deployment Guide

This guide will walk you through deploying CodeTube to production in under 10 minutes.

## Table of Contents
- [Quick Deploy Options](#quick-deploy-options)
- [Prerequisites](#prerequisites)
- [Option 1: Deploy to Railway (Easiest)](#option-1-deploy-to-railway-easiest)
- [Option 2: Deploy to Render](#option-2-deploy-to-render)
- [Option 3: Deploy to Vercel + Railway](#option-3-deploy-to-vercel--railway)
- [Option 4: Self-Hosted (Docker)](#option-4-self-hosted-docker)
- [Post-Deployment Setup](#post-deployment-setup)
- [Troubleshooting](#troubleshooting)

---

## Quick Deploy Options

| Platform | Difficulty | Cost | Best For |
|----------|------------|------|----------|
| **Railway** | ⭐ Easiest | Free tier available | Full-stack deployment |
| **Render** | ⭐ Easy | Free tier available | Full-stack deployment |
| **Vercel + Railway** | ⭐⭐ Medium | Free tier available | Separate frontend/backend |
| **Self-hosted** | ⭐⭐⭐ Advanced | Server costs | Full control |

---

## Prerequisites

Before starting, you'll need:

1. **Git** installed locally
2. **A GitHub account** (to fork/clone the repo)
3. **An account on your chosen platform** (Railway, Render, etc.)
4. **(Optional)** A custom domain name

---

## Option 1: Deploy to Railway (Easiest)

Railway provides the simplest full-stack deployment with automatic PostgreSQL and Redis provisioning.

### Step 1: Fork the Repository

1. Go to https://github.com/yourusername/codetube
2. Click the **Fork** button (top right)
3. Wait for the fork to complete

### Step 2: Deploy with One Click

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

Or manually:

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your forked `codetube` repository
4. Railway will automatically detect the `docker-compose.yml`

### Step 3: Configure Environment Variables

1. In your Railway project, go to **Variables**
2. Add the following required variables:

```bash
NODE_ENV=production
JWT_SECRET=your_random_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

To generate secrets:
```bash
openssl rand -base64 32
```

3. Railway automatically provisions:
   - `DATABASE_URL` (PostgreSQL)
   - `REDIS_URL` (Redis)

### Step 4: Deploy

1. Click **Deploy** in the Railway dashboard
2. Wait for the deployment to complete (~2-3 minutes)
3. Your app will be available at a `*.railway.app` domain

### Step 5: Custom Domain (Optional)

1. In Railway, go to your service settings
2. Click **Custom Domain**
3. Add your domain and follow DNS instructions

---

## Option 2: Deploy to Render

Render offers a generous free tier with automatic HTTPS.

### Step 1: Create Render Account

1. Go to [Render](https://render.com) and sign up
2. Connect your GitHub account

### Step 2: Deploy with Blueprint

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/yourusername/codetube)

Or manually:

1. Go to Render Dashboard → **Blueprints**
2. Click **New Blueprint Instance**
3. Connect your GitHub repository
4. Render will read `render.yaml` and create all services

### Step 3: Configure Secrets

1. In Render Dashboard, go to **Environment**
2. Add the following:

```bash
JWT_SECRET=your_random_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

### Step 4: Deploy

1. Click **Apply** to start the deployment
2. Wait for all services to be ready (~5 minutes)
3. Access your app at the provided `*.onrender.com` URL

---

## Option 3: Deploy to Vercel + Railway

This separates the frontend (Vercel) and backend (Railway) for optimal performance.

### Deploy Backend to Railway

Follow [Option 1](#option-1-deploy-to-railway-easiest) but only for the backend:

1. In Railway, set the root directory to `/backend`
2. Deploy the backend service
3. Note the backend URL (e.g., `https://codetube-api.railway.app`)

### Deploy Frontend to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/codetube&root-directory=frontend)

Or manually:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New Project**
3. Import your GitHub repository
4. Set **Root Directory** to `frontend`
5. Add environment variable:
   ```bash
   VITE_API_URL=https://your-railway-backend-url
   ```
6. Click **Deploy**

---

## Option 4: Self-Hosted (Docker)

For complete control, deploy on your own VPS or server.

### Step 1: Provision a Server

Recommended providers:
- **DigitalOcean** - $6/month droplet
- **Hetzner** - €4.51/month CX11
- **AWS/GCP/Azure** - Various options

Minimum specs:
- 1 vCPU
- 2 GB RAM
- 20 GB SSD
- Ubuntu 22.04 LTS

### Step 2: Server Setup

SSH into your server and run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 3: Clone and Configure

```bash
# Create app directory
sudo mkdir -p /opt/codetube
sudo chown $USER:$USER /opt/codetube
cd /opt/codetube

# Clone repository
git clone https://github.com/yourusername/codetube.git .

# Create environment file
cp .env.production.example .env

# Edit with your secrets
nano .env
```

Fill in your `.env`:
```bash
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
DATABASE_URL=postgresql://codetube:secure_password@postgres:5432/codetube?schema=public
POSTGRES_PASSWORD=secure_password
REDIS_URL=redis://redis:6379
```

### Step 4: Deploy

```bash
# Run the deployment script
sudo ./scripts/deploy-production.sh
```

Or manually:
```bash
# Build and start
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Check status
docker-compose ps
```

### Step 5: Setup SSL (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
```

### Step 6: Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Post-Deployment Setup

### 1. Create Admin User

```bash
# SSH into your server (self-hosted) or use platform console
docker-compose exec backend node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
  const password = await bcrypt.hash('your-admin-password', 10);
  const user = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@yourdomain.com',
      passwordHash: password,
      isAdmin: true,
      isCreator: true,
    }
  });
  console.log('Admin user created:', user.id);
}
createAdmin();
"
```

### 2. Verify Deployment

Check these URLs:
- **Frontend**: `https://your-domain.com`
- **Backend Health**: `https://your-domain.com/health`
- **API Docs**: `https://your-domain.com/api`

### 3. Configure DNS (Custom Domain)

Add these DNS records:
```
Type    Name    Value                TTL
A       @       YOUR_SERVER_IP       3600
CNAME   www     yourdomain.com       3600
```

### 4. Setup Monitoring (Optional)

Add to your deployment for monitoring:
```yaml
# Add to docker-compose.yml
  prometheus:
    image: prom/prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
```

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Check container status
docker-compose ps
```

### Database connection issues

```bash
# Verify database is running
docker-compose exec postgres pg_isready -U codetube

# Check database logs
docker-compose logs postgres
```

### Migration failures

```bash
# Reset database (WARNING: destroys data)
docker-compose down -v
docker-compose up -d
docker-compose exec backend npx prisma migrate dev
```

### Out of memory

```bash
# Check memory usage
docker stats

# Add swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## Next Steps

- [ ] Set up automated backups
- [ ] Configure monitoring (Grafana/Prometheus)
- [ ] Setup log aggregation
- [ ] Configure CDN for assets
- [ ] Enable rate limiting
- [ ] Review security headers
- [ ] Set up CI/CD pipelines

---

## Support

Having issues?

1. Check [GitHub Issues](https://github.com/yourusername/codetube/issues)
2. Join our [Discord community](https://discord.gg/codetube)
3. Email: support@codetube.dev

---

**Congratulations!** Your CodeTube instance is now live! 🎉
