# Car Rental System - Startup Guide

## Quick Start

To run the complete car rental system, you need to start both the backend API service and the frontend web application.

### Prerequisites

- Node.js 18+ installed
- pnpm package manager installed
- PostgreSQL database (for production)

### 1. Install Dependencies

```bash
# Install root dependencies
pnpm install

# Install API dependencies
cd apps/api
pnpm install

# Install web dependencies
cd ../web
pnpm install
```

### 2. Environment Setup

Create `.env.local` in the `apps/web` directory:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# Cloudinary Configuration (optional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

Create `.env` in the `apps/api` directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/car_rental

# JWT
JWT_SECRET=your_jwt_secret_key

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 3. Start the Services

#### Option A: Start Both Services (Recommended)

From the root directory:

```bash
# Terminal 1: Start the API service
cd apps/api
pnpm run dev

# Terminal 2: Start the web application
cd apps/web
pnpm run dev
```

#### Option B: Use Turbo (Development)

```bash
# Start all services in development mode
pnpm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api/docs (if Swagger is configured)

## Troubleshooting

### ECONNREFUSED Errors

If you see `ECONNREFUSED` errors in the browser console:

1. **Check if backend is running**: Ensure the API service is started on port 5000
2. **Verify API URL**: Check that `NEXT_PUBLIC_API_BASE_URL` points to the correct backend URL
3. **Check port availability**: Ensure port 5000 is not used by another service

### Common Issues

#### Backend Service Won't Start

```bash
# Check if port 5000 is available
lsof -i :5000

# If port is busy, kill the process
kill -9 $(lsof -t -i:5000)
```

#### Database Connection Issues

```bash
# Check PostgreSQL status
sudo service postgresql status

# Start PostgreSQL if needed
sudo service postgresql start
```

#### Missing Dependencies

```bash
# Clear node_modules and reinstall
rm -rf node_modules apps/*/node_modules
pnpm install
```

## Development Workflow

### 1. Backend Development

```bash
cd apps/api

# Development mode with hot reload
pnpm run dev

# Production build
pnpm run build
pnpm run start:prod
```

### 2. Frontend Development

```bash
cd apps/web

# Development mode
pnpm run dev

# Type checking
pnpm run check-types

# Linting
pnpm run lint
```

## Architecture

### Services

- **API Service** (`apps/api`): NestJS backend with TypeORM
- **Web Application** (`apps/web`): Next.js frontend with Tailwind CSS

### Key Features

- **Authentication**: JWT-based admin authentication
- **Vehicle Management**: CRUD operations for vehicles
- **Booking System**: Customer booking and management
- **Payment Processing**: Stripe integration for payments
- **Image Upload**: Cloudinary integration for vehicle images
- **Error Handling**: Comprehensive error boundaries and fallbacks

## Production Deployment

### Backend API

```bash
cd apps/api
pnpm run build
pnpm run start:prod
```

### Frontend Web

```bash
cd apps/web
pnpm run build
pnpm run start
```

### Environment Variables

Ensure all environment variables are properly configured for production:

- Database connection strings
- JWT secrets
- API base URLs
- Third-party service keys (Stripe, Cloudinary)

## Error Handling

The application includes comprehensive error handling:

- **Offline Mode**: Graceful fallbacks when backend is unavailable
- **Error Boundaries**: React error boundaries for UI failures
- **API Proxies**: Error handling in API proxy routes
- **User-Friendly Messages**: Sanitized error messages for users

## Support

If you encounter issues:

1. Check the browser console for specific error messages
2. Verify all services are running on the correct ports
3. Ensure environment variables are properly configured
4. Check the API logs for backend-specific issues

## Development Commands

```bash
# Root level commands
pnpm run dev          # Start all services
pnpm run build        # Build all packages
pnpm run lint         # Lint all packages
pnpm run check-types  # Type check all packages

# API specific
cd apps/api
pnpm run dev          # Start API in development
pnpm run test         # Run tests
pnpm run lint         # Lint API code

# Web specific
cd apps/web
pnpm run dev          # Start web in development
pnpm run build        # Build web application
pnpm run start        # Start production web server
```
