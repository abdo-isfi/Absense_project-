# Production Deployment Guide

## Overview
This guide provides comprehensive instructions for deploying the OFPPT Absence Management backend to production.

## Pre-Deployment Checklist

### Security
- [ ] Change `JWT_SECRET` to a strong, random string (min 32 characters)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `CORS_ORIGIN` to your frontend domain
- [ ] Review and adjust rate limits in `rateLimiter.js`
- [ ] Enable HTTPS (use reverse proxy like nginx)
- [ ] Set up MongoDB authentication
- [ ] Review file upload size limits
- [ ] Disable Swagger docs in production (optional)

### Database
- [ ] Set up production MongoDB (MongoDB Atlas recommended)
- [ ] Configure database backups
- [ ] Set up database monitoring
- [ ] Create database indexes for performance
- [ ] Test database connection

### Environment
- [ ] Create production `.env` file
- [ ] Never commit `.env` to version control
- [ ] Use environment variable management (e.g., AWS Secrets Manager)
- [ ] Set `LOG_LEVEL=warn` or `LOG_LEVEL=error`

### Performance
- [ ] Enable gzip compression
- [ ] Set up CDN for static files
- [ ] Configure connection pooling
- [ ] Implement caching strategy (Redis recommended)

## Environment Variables

### Required Production Variables
```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRE=7d
CORS_ORIGIN=https://yourdomain.com

# File Uploads
UPLOAD_DIR=/var/www/uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=xlsx,xls,csv,pdf,jpg,jpeg,png

# Logging
LOG_LEVEL=warn
```

## Deployment Options

### Option 1: Traditional VPS (Ubuntu/Debian)

#### 1. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB (or use MongoDB Atlas)
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Deploy Application
```bash
# Clone repository
git clone https://github.com/yourusername/ofppt-backend.git
cd ofppt-backend/backend

# Install dependencies
npm install --production

# Create .env file
nano .env
# Add production environment variables

# Start with PM2
pm2 start server.js --name ofppt-api
pm2 save
pm2 startup
```

#### 3. Configure Nginx Reverse Proxy
```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/ofppt-api
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/ofppt-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. Set Up SSL with Let's Encrypt
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is configured automatically
```

### Option 2: Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/ofppt_absences
    env_file:
      - .env
    depends_on:
      - mongo
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=your_password
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

volumes:
  mongo-data:
```

#### Deploy with Docker
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop
docker-compose down
```

### Option 3: Cloud Platforms

#### Heroku
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create ofppt-api

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key
heroku config:set CORS_ORIGIN=https://yourfrontend.com

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

#### AWS Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init

# Create environment
eb create ofppt-api-prod

# Deploy
eb deploy

# Set environment variables
eb setenv NODE_ENV=production JWT_SECRET=your-secret-key
```

#### DigitalOcean App Platform
1. Connect GitHub repository
2. Configure build settings
3. Add environment variables
4. Deploy

## Monitoring & Logging

### PM2 Monitoring
```bash
# View status
pm2 status

# View logs
pm2 logs ofppt-api

# Monitor resources
pm2 monit

# Restart
pm2 restart ofppt-api

# Stop
pm2 stop ofppt-api
```

### Log Management
Logs are stored in `/logs` directory:
- `combined-YYYY-MM-DD.log` - All logs (14 days retention)
- `error-YYYY-MM-DD.log` - Error logs (30 days retention)
- `exceptions-YYYY-MM-DD.log` - Uncaught exceptions
- `rejections-YYYY-MM-DD.log` - Unhandled promise rejections

### External Monitoring Services
- **Sentry**: Error tracking
- **New Relic**: Application performance monitoring
- **Datadog**: Infrastructure monitoring
- **LogDNA**: Log aggregation

## Database Management

### MongoDB Atlas (Recommended)
1. Create cluster at mongodb.com/cloud/atlas
2. Configure network access (whitelist IPs)
3. Create database user
4. Get connection string
5. Update `MONGODB_URI` in `.env`

### Backup Strategy
```bash
# Manual backup
mongodump --uri="mongodb://localhost:27017/ofppt_absences" --out=/backup/$(date +%Y%m%d)

# Automated daily backup (crontab)
0 2 * * * mongodump --uri="mongodb://localhost:27017/ofppt_absences" --out=/backup/$(date +\%Y\%m\%d)
```

## Performance Optimization

### Enable Compression
```javascript
// Add to app.js
import compression from 'compression';
app.use(compression());
```

### Database Indexes
```javascript
// Add to models
schema.index({ email: 1 });
schema.index({ cef: 1 });
schema.index({ date: 1, groupId: 1 });
```

### Caching with Redis
```javascript
// Install redis
npm install redis

// config/redis.js
import { createClient } from 'redis';
const client = createClient({ url: process.env.REDIS_URL });
await client.connect();
export default client;
```

## Security Best Practices

### 1. Environment Variables
- Never commit `.env` files
- Use secrets management service
- Rotate secrets regularly

### 2. Database Security
- Enable MongoDB authentication
- Use strong passwords
- Limit network access
- Enable encryption at rest

### 3. API Security
- Rate limiting enabled ✓
- Helmet headers enabled ✓
- Input sanitization enabled ✓
- CORS configured ✓
- JWT authentication ✓

### 4. File Upload Security
- File type validation ✓
- File size limits ✓
- Virus scanning (recommended)
- Separate storage domain

### 5. Regular Updates
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

## Health Checks

### Endpoint
```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-19T20:00:00.000Z",
  "uptime": 12345
}
```

### Monitoring Script
```bash
#!/bin/bash
# health-check.sh
response=$(curl -s http://localhost:5000/health)
if echo "$response" | grep -q "ok"; then
    echo "API is healthy"
else
    echo "API is down!"
    pm2 restart ofppt-api
fi
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process
lsof -i :5000

# Kill process
kill -9 <PID>
```

#### MongoDB Connection Failed
- Check MongoDB is running: `sudo systemctl status mongod`
- Verify connection string
- Check network access rules
- Verify credentials

#### High Memory Usage
```bash
# Check memory
pm2 monit

# Restart with memory limit
pm2 start server.js --max-memory-restart 500M
```

#### Logs Not Writing
- Check directory permissions
- Verify `LOG_LEVEL` setting
- Check disk space: `df -h`

## Rollback Strategy

### With PM2
```bash
# Save current version
pm2 save

# If deployment fails, restore
pm2 resurrect
```

### With Git
```bash
# Revert to previous commit
git revert HEAD
git push

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force
```

## Performance Benchmarks

### Expected Performance
- **Response Time**: < 100ms (average)
- **Throughput**: 1000+ req/s
- **Memory Usage**: < 500MB
- **CPU Usage**: < 50%

### Load Testing
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test
ab -n 1000 -c 10 http://localhost:5000/api/test
```

## Support & Maintenance

### Regular Tasks
- [ ] Weekly: Review logs for errors
- [ ] Weekly: Check disk space
- [ ] Monthly: Update dependencies
- [ ] Monthly: Review security advisories
- [ ] Quarterly: Database optimization
- [ ] Quarterly: Performance audit

### Backup Checklist
- [ ] Database backups (daily)
- [ ] File uploads backup (weekly)
- [ ] Environment configuration backup
- [ ] SSL certificates backup

## Conclusion

Your OFPPT backend is now production-ready with:
- ✅ Security hardening
- ✅ Structured logging
- ✅ Error handling
- ✅ API documentation
- ✅ Performance optimization
- ✅ Monitoring capabilities

For support, refer to:
- README.md - Setup instructions
- SECURITY.md - Security features
- API Documentation - http://localhost:5000/api-docs
