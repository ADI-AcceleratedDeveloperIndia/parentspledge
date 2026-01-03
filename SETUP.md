# Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)

## Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create `.env.local` file**
   ```bash
   cp .env.local.example .env.local
   ```

3. **Configure environment variables**
   Edit `.env.local` and add:
   - `MONGODB_URI`: Your MongoDB connection string
   - `ADMIN_PASSWORD`: Strong password for admin dashboard
   - `NEXT_PUBLIC_APP_URL`: Your app URL (http://localhost:3000 for dev)

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Public site: http://localhost:3000
   - Admin dashboard: http://localhost:3000/admin

## MongoDB Setup

1. Create a MongoDB Atlas cluster
2. Get your connection string
3. Replace `<username>` and `<password>` in the connection string
4. The database `parentspledge` will be created automatically

## Deployment to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Notes

- Certificate generation is 100% browser-side (no server processing)
- All form fields are mandatory
- Admin dashboard requires password authentication
- Visitor count increments automatically on page load




