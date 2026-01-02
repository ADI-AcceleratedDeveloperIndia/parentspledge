# MongoDB Setup Instructions

## Credentials

**Username:** aideveloperindia_db_user  
**Password:** 9SCZZBD7w5I503Gc  
**Connection String:** mongodb+srv://aideveloperindia_db_user:9SCZZBD7w5I503Gc@parentspledge.b0xqchl.mongodb.net/parentspledge?retryWrites=true&w=majority&appName=parentspledge

## Setup Steps

1. Create a `.env.local` file in the root directory with the following content:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://aideveloperindia_db_user:9SCZZBD7w5I503Gc@parentspledge.b0xqchl.mongodb.net/parentspledge?retryWrites=true&w=majority&appName=parentspledge

# Admin Authentication (dummy - accepts any password)
ADMIN_PASSWORD=dummy

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

2. The `.env.local` file is already in `.gitignore` so it won't be committed to git.

3. Restart your development server after creating/updating `.env.local`:
   ```bash
   npm run dev
   ```

## Git Repository

**Repository URL:** https://github.com/ADI-AcceleratedDeveloperIndia/parentspledge.git

The git remote has been configured. You can push your code with:
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

## Notes

- The MongoDB connection string includes the database name `parentspledge`
- The application will automatically create collections (`pledges` and `visitors`) when needed
- Admin dashboard accepts any password for development purposes

