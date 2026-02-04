# Digital Signage Platform

A production-ready digital signage management system built with Next.js, Express.js, and Supabase.

## Features

- 🔐 Secure admin authentication with Supabase Auth
- 📺 Screen management with real-time status monitoring
- 🎬 Media upload and management with Supabase Storage
- 📋 Playlist creation with drag-and-drop interface
- 🎯 Screen-playlist assignment system
- 🌐 Web-based player for digital signage displays
- 📊 Dashboard with system analytics
- 🎨 Enterprise-grade UI with Tailwind CSS and ShadCN UI

## Tech Stack

### Frontend
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **ShadCN UI** components
- **Supabase** for authentication and data

### Backend
- **Express.js** with TypeScript
- **Supabase** for database and storage
- **JWT** for authentication
- **Jest** for testing

### Infrastructure
- **Supabase** (Database, Auth, Storage)
- **Vercel** (Frontend deployment)
- **Render/Railway** (Backend deployment)

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd digital-signage-platform
   npm run install:all
   ```

2. **Set up environment variables:**
   ```bash
   # Copy environment templates
   cp .env.example .env
   cp frontend/.env.local.example frontend/.env.local
   cp backend/.env.example backend/.env
   
   # Edit the files with your Supabase credentials
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

   This will start:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

### Environment Variables

Create a Supabase project and get your credentials:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `JWT_SECRET`: A secure random string for JWT signing

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start only frontend
npm run dev:backend      # Start only backend

# Building
npm run build            # Build both applications
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only

# Production
npm run start            # Start both applications
npm run start:frontend   # Start frontend only
npm run start:backend    # Start backend only
```

### Project Structure

```
digital-signage-platform/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── lib/            # Utilities and configurations
│   │   └── types/          # TypeScript type definitions
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript types
│   │   └── server.ts       # Main server file
│   └── package.json
└── package.json            # Root package.json
```

## Deployment

### Frontend (Vercel)
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Render/Railway)
1. Connect your repository to Render or Railway
2. Set environment variables in the platform
3. Deploy the backend folder

### Database Setup
1. Create tables using the SQL schema in the design document
2. Set up Row Level Security (RLS) policies
3. Configure Supabase Storage buckets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.