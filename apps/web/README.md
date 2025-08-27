# Dev8.dev Web Authentication System

A modern authentication system built with Next.js 15, NextAuth.js, Prisma, and PostgreSQL.

## Features

- 🔐 **Multiple Authentication Methods**
  - Email/Password authentication with bcrypt hashing
  - Google OAuth integration
  - GitHub OAuth integration
  - Session-based authentication

- 🛡️ **Security Features**
  - Protected routes with middleware
  - Session management
  - Input validation with Zod
  - CSRF protection

- 🗄️ **Database**
  - PostgreSQL database with Prisma ORM
  - Type-safe database operations
  - Automatic migrations

## Setup Instructions

### 1. Database Setup

First, set up a PostgreSQL database. You can use a local installation or a cloud service like Supabase.

```bash
# Create a PostgreSQL database named 'dev8_web'
createdb dev8_web
```

### 2. Environment Variables

Copy the environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```env
# NextAuth Configuration
AUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/dev8_web?schema=public"

# Google OAuth (Get from Google Cloud Console)
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# GitHub OAuth (Get from GitHub Developer Settings)
AUTH_GITHUB_ID="your-github-client-id"
AUTH_GITHUB_SECRET="your-github-client-secret"
```

### 3. OAuth Setup

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google` (for production)

#### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - Application name: `Dev8.dev`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

### 4. Install Dependencies

```bash
pnpm install
```

### 5. Database Migration

Generate and run the database migration:

```bash
# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev --name init

# Optional: Open Prisma Studio to view your database
pnpm prisma studio
```

### 6. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: NextAuth.js v4
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Password Hashing**: bcryptjs
- **TypeScript**: Full type safety
