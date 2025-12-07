# Docker Setup Guide

This guide explains how to build and run the Biogram application using Docker.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

1. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file** with your configuration (especially JWT_SECRET_KEY and database passwords)

3. **Build and start all services:**
   ```bash
   docker-compose up -d --build
   ```

4. **Access the application:**
   - Frontend: http://localhost
   - Backend API: http://localhost:5000

## Services

The docker-compose setup includes:

- **backend**: Node.js/Express backend API
- **frontend**: React frontend served by nginx

**Note**: MongoDB is not included. You need to use MongoDB Atlas (cloud) or provide your own MongoDB instance. Set the `DATABASE` environment variable with your MongoDB connection string.

## Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Rebuild specific service
```bash
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

### Stop and remove volumes (⚠️ This will delete database data)
```bash
docker-compose down -v
```

## Environment Variables

Key environment variables (set in `.env` file):

- `JWT_SECRET_KEY`: Secret key for JWT tokens (change in production!)
- `DATABASE`: MongoDB Atlas connection string (required, e.g., `mongodb+srv://user:pass@cluster.mongodb.net/dbname`)
- `PASSWORD`: MongoDB password (used if connection string contains `<PASSWORD>` placeholder)
- `VITE_API_URL`: Backend API URL for frontend
- `BACKEND_PORT`: Backend port (default: 5000)
- `FRONTEND_PORT`: Frontend port (default: 80)

## Development vs Production

### Development
For development, you may want to:
- Use volume mounts for hot-reloading
- Run services individually
- Use different ports

### Production
For production:
- Ensure all environment variables are set securely
- Use strong passwords and secrets
- Consider using Docker secrets for sensitive data
- Set up proper SSL/TLS certificates
- Configure firewall rules

## Troubleshooting

### Port already in use
If ports 80, 5000, or 27017 are already in use, change them in `.env`:
```env
BACKEND_PORT=5001
FRONTEND_PORT=8080
```

### MongoDB connection issues
Since MongoDB is not included in Docker, ensure:
- Your MongoDB Atlas connection string is correctly set in `.env` as `DATABASE`
- The connection string format: `mongodb+srv://username:password@cluster.mongodb.net/dbname`
- Your IP is whitelisted in MongoDB Atlas (or use 0.0.0.0/0 for testing)
- Network connectivity from Docker container to MongoDB Atlas

### Frontend can't connect to backend
Check that `VITE_API_URL` in `.env` matches your backend URL. For Docker, use:
```env
VITE_API_URL=http://localhost:5000
```

### Rebuild after dependency changes
If you add new npm packages, rebuild the images:
```bash
docker-compose up -d --build
```

## MongoDB Setup

This setup uses MongoDB Atlas (cloud). To configure:

1. Create a MongoDB Atlas account and cluster
2. Get your connection string from Atlas dashboard
3. Set `DATABASE` in your `.env` file:
   ```env
   DATABASE=mongodb+srv://username:password@cluster.mongodb.net/biogram
   ```
4. If your connection string uses `<PASSWORD>` placeholder, also set `PASSWORD`:
   ```env
   PASSWORD=your-mongodb-password
   ```
5. Whitelist your server IP in MongoDB Atlas Network Access (or use 0.0.0.0/0 for testing)

## Network

All services communicate through the `biogram-network` bridge network. The backend connects to MongoDB using the service name `mongodb`.

