# VPS Deployment Guide

This guide walks you through deploying Biogram on your VPS using Docker.

## Prerequisites

- VPS with Ubuntu/Debian (or similar Linux distribution)
- SSH access to your VPS
- Domain name (optional, but recommended)
- MongoDB Atlas account (or your MongoDB connection string)

## Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip
# or
ssh username@your-vps-ip
```

## Step 2: Install Docker and Docker Compose

### Install Docker

```bash
# Update package index
sudo apt update

# Install prerequisites
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation
docker --version
docker compose version
```

### Add your user to docker group (optional, to avoid sudo)

```bash
sudo usermod -aG docker $USER
# Log out and log back in for changes to take effect
```

## Step 3: Upload Your Project

### Option A: Using Git (Recommended)

```bash
# Install Git if not already installed
sudo apt install -y git

# Clone your repository
git clone <your-repo-url> biogram
cd biogram
```

### Option B: Using SCP (from your local machine)

```bash
# From your local machine
scp -r /path/to/Biogram root@your-vps-ip:/root/
```

### Option C: Using rsync (from your local machine)

```bash
# From your local machine
rsync -avz --exclude 'node_modules' --exclude '.git' /path/to/Biogram root@your-vps-ip:/root/
```

## Step 4: Set Up Environment Variables

```bash
cd biogram

# Create .env file
nano .env
```

Add the following configuration (adjust values as needed):

```env
# Backend Configuration
NODE_ENV=production
BACKEND_PORT=5000

# JWT Configuration
JWT_SECRET_KEY=your-very-secure-secret-key-change-this-in-production
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90

# MongoDB Atlas Configuration
DATABASE=mongodb+srv://username:password@cluster.mongodb.net/biogram
PASSWORD=your-mongodb-password

# Imgur Configuration (optional)
IMGUR_CLIENT_ID=your-imgur-client-id
IMGUR_CLIENT_SECRET=your-imgur-client-secret

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@biogram.com
EMAIL_FROM_NAME=Biogram

# Frontend Configuration
FRONTEND_PORT=80
VITE_API_URL=http://your-vps-ip:5000
# Or if using domain:
# VITE_API_URL=http://api.yourdomain.com
```

Save and exit (Ctrl+X, then Y, then Enter)

## Step 5: Configure MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (if you haven't already)
3. Get your connection string
4. **Important**: Add your VPS IP address to Network Access whitelist:
   - Go to Network Access
   - Click "Add IP Address"
   - Add your VPS IP (or use `0.0.0.0/0` for testing - not recommended for production)
5. Update the `DATABASE` variable in `.env` with your connection string

## Step 6: Configure Firewall

```bash
# Install UFW if not installed
sudo apt install -y ufw

# Allow SSH (important - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow backend port (if accessing directly)
sudo ufw allow 5000/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 7: Build and Run Docker Containers

```bash
cd biogram

# Build and start containers
docker compose up -d --build

# Check if containers are running
docker compose ps

# View logs
docker compose logs -f
```

## Step 8: Verify Deployment

### Check Backend

```bash
# Test backend API
curl http://localhost:5000/api/health
# or
curl http://your-vps-ip:5000/api/health
```

### Check Frontend

Open in browser:
- `http://your-vps-ip` (or your domain if configured)

## Step 9: Set Up Domain (Optional but Recommended)

### Install Nginx as Reverse Proxy

```bash
sudo apt install -y nginx

# Create nginx configuration
sudo nano /etc/nginx/sites-available/biogram
```

Add this configuration:

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API (optional - if you want a subdomain)
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/biogram /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Set Up SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
```

## Step 10: Update Frontend API URL

If using a domain, update `.env`:

```env
VITE_API_URL=http://api.yourdomain.com
# or if using same domain:
VITE_API_URL=http://yourdomain.com
```

Then rebuild frontend:

```bash
docker compose up -d --build frontend
```

## Useful Commands

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend
docker compose restart frontend
```

### Stop Services

```bash
docker compose down
```

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose up -d --build
```

### Clean Up

```bash
# Remove stopped containers
docker compose down

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune
```

## Troubleshooting

### Containers won't start

```bash
# Check logs
docker compose logs

# Check container status
docker compose ps

# Check Docker daemon
sudo systemctl status docker
```

### Backend can't connect to MongoDB

- Verify MongoDB Atlas connection string in `.env`
- Check that VPS IP is whitelisted in MongoDB Atlas
- Test connection: `docker compose exec backend node -e "console.log(process.env.DATABASE)"`

### Frontend can't connect to backend

- Verify `VITE_API_URL` in `.env` matches your backend URL
- Check firewall rules
- Check backend logs: `docker compose logs backend`

### Port already in use

```bash
# Find what's using the port
sudo lsof -i :80
sudo lsof -i :5000

# Kill the process or change ports in docker-compose.yml
```

## Security Checklist

- [ ] Changed default JWT_SECRET_KEY
- [ ] Set strong MongoDB password
- [ ] Configured firewall (UFW)
- [ ] Set up SSL/HTTPS
- [ ] Limited MongoDB Atlas IP whitelist (not 0.0.0.0/0)
- [ ] Regular backups of MongoDB data
- [ ] Updated system packages: `sudo apt update && sudo apt upgrade`
- [ ] Set up log rotation
- [ ] Configured automatic security updates

## Monitoring (Optional)

### Set up log rotation

```bash
sudo nano /etc/logrotate.d/docker-containers
```

Add:

```
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
```

## Backup Strategy

### MongoDB Backup

Since you're using MongoDB Atlas, backups are handled by Atlas. However, you can also:

1. Use MongoDB Atlas automated backups (recommended)
2. Export data manually: `mongodump --uri="your-connection-string"`

### Application Backup

```bash
# Backup .env file
cp .env .env.backup

# Backup docker-compose.yml
cp docker-compose.yml docker-compose.yml.backup
```

## Next Steps

- Set up monitoring (e.g., PM2, or Docker health checks)
- Configure automatic updates
- Set up CI/CD pipeline
- Configure CDN for static assets
- Set up email notifications for errors

