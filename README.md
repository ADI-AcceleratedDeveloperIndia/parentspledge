# Road Safety Pledge Microsite - Telangana

A high-scale, mobile-first microsite for collecting Road Safety Pledges from parents in Telangana State. Built to handle record-scale concurrent traffic (up to ~20 lakh users).

## 🎯 Features

- **Mobile-First Design**: Optimized for Android & iOS devices
- **Dual Language Support**: English and Telugu with full content switching
- **Browser-Side Certificate Generation**: 100% client-side certificate creation using HTML Canvas
- **Real-time Analytics**: Comprehensive admin dashboard with district-wise, time-based analytics
- **High Performance**: Designed for massive concurrent access with minimal backend processing
- **Secure**: Input sanitization, rate limiting, and protected admin routes

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB Atlas
- **Hosting**: Vercel (recommended)
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- MongoDB Atlas account (or local MongoDB instance)
- Git

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd parentspledge
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your configuration:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/parentspledge?retryWrites=true&w=majority

# Admin Authentication (use a strong password)
ADMIN_PASSWORD=your-secure-admin-password-here

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. MongoDB Setup

1. Create a MongoDB Atlas cluster (or use local MongoDB)
2. Create a database named `parentspledge`
3. The application will automatically create the following collections:
   - `pledges` - Stores all pledge submissions
   - `visitors` - Stores visitor count

### 5. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Usage

### Public Users

1. Visit the homepage
2. Fill in the pledge form (all fields are mandatory):
   - Child Name
   - Parent Name
   - Institution Name
   - District (select from 33 Telangana districts)
3. Toggle language between English and Telugu
4. Submit the pledge
5. View and download the certificate (generated in browser)

### Admin Dashboard

1. Navigate to `/admin`
2. Enter the admin password (set in `ADMIN_PASSWORD` env variable)
3. View analytics:
   - Total pledges count
   - District-wise breakdown with bar charts
   - Hour-wise and day-wise trends
   - Peak time analysis
4. Export data as CSV (all pledges or district-wise summary)

## 🏗️ Project Structure

```
parentspledge/
├── app/
│   ├── admin/
│   │   └── page.tsx          # Admin dashboard
│   ├── api/
│   │   ├── analytics/        # Analytics API endpoint
│   │   ├── export/           # CSV export endpoint
│   │   ├── pledges/          # Pledge submission endpoint
│   │   └── visitors/         # Visitor count endpoint
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main pledge form page
├── components/
│   ├── AudioGuide.tsx        # Text-to-speech audio guide
│   ├── CertificateGenerator.tsx  # Browser-side certificate generation
│   └── LanguageToggle.tsx    # Language switcher
├── lib/
│   ├── constants.ts          # Telangana districts list
│   ├── mongodb.ts            # MongoDB connection utility
│   ├── translations.ts       # Language translations
│   ├── utils.ts              # Utility functions (rate limiting, sanitization)
│   └── validations.ts        # Zod schemas for validation
├── middleware.ts             # Security headers middleware
└── package.json
```

## 🔒 Security Features

- **Input Sanitization**: All user inputs are sanitized to prevent XSS attacks
- **Rate Limiting**: API endpoints have rate limiting (5 requests per minute per IP)
- **Server-Side Validation**: Zod schemas validate all inputs on the server
- **Protected Admin Routes**: Admin dashboard requires password authentication
- **Security Headers**: Middleware adds security headers to all responses
- **No Sensitive Data Exposure**: Error messages don't expose internal details

## 📊 Analytics Features

The admin dashboard provides:

1. **Total Pledges**: Live counter of all submissions
2. **District-wise Analytics**: 
   - Table with counts and percentages
   - Visual bar charts
3. **Time-based Analytics**:
   - Hour-wise count (last 24 hours)
   - Day-wise trend (last 7 days)
   - Peak time identification
4. **CSV Export**:
   - All pledges with timestamps
   - District-wise summary

## 🎨 Certificate Generation

- **100% Browser-Side**: Uses HTML Canvas API
- **High Quality**: 1920x1080 landscape certificate
- **Mobile Compatible**: Scales down for mobile viewing
- **Downloadable**: Direct browser download as PNG
- **Includes**:
  - User details (child name, parent name, institution, district)
  - Pledge text
  - Placeholder logos and photos
  - Date stamp

## 🌐 Language Support

- **English** (default): Full UI and content in English
- **Telugu**: Full UI and content in Telugu
- **Audio Guide**: Browser Text-to-Speech for English (optional)

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard:
   - `MONGODB_URI`
   - `ADMIN_PASSWORD`
   - `NEXT_PUBLIC_APP_URL` (your Vercel URL)
4. Deploy

### Environment Variables for Production

Make sure to set:
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `ADMIN_PASSWORD`: Strong password for admin access
- `NEXT_PUBLIC_APP_URL`: Your production URL

## 📝 API Endpoints

### Public Endpoints

- `GET /api/visitors/increment` - Increments and returns visitor count
- `POST /api/pledges` - Submit a new pledge

### Protected Endpoints (Require Authorization Header)

- `GET /api/analytics` - Get analytics data
- `GET /api/export?type=all|district` - Export CSV data
- `GET /api/pledges` - Get all pledges (paginated)

**Authorization**: `Authorization: Bearer <ADMIN_PASSWORD>`

## 🧪 Testing

### Mobile Testing

Test on:
- Android Chrome
- iOS Safari
- Desktop browsers (Chrome, Firefox, Safari, Edge)

### High Traffic Simulation

The application is designed to handle high traffic:
- Rate limiting prevents abuse
- MongoDB indexes optimize queries
- Static-first approach minimizes server load
- Certificate generation is 100% client-side

## 📋 Telangana Districts

All 33 districts of Telangana are included in the dropdown:
- Adilabad, Bhadradri Kothagudem, Hyderabad, Jagtial, Jangaon, Jayashankar Bhupalpally, Jogulamba Gadwal, Kamareddy, Karimnagar, Khammam, Komaram Bheem Asifabad, Mahabubabad, Mahabubnagar, Mancherial, Medak, Medchal-Malkajgiri, Mulugu, Nagarkurnool, Nalgonda, Narayanpet, Nirmal, Nizamabad, Peddapalli, Rajanna Sircilla, Rangareddy, Sangareddy, Siddipet, Suryapet, Vikarabad, Wanaparthy, Warangal Urban, Warangal Rural, Yadadri Bhuvanagiri

## 🔧 Customization

### Adding Logos

Replace the placeholder logo components in:
- `app/page.tsx` (header logos)
- `components/CertificateGenerator.tsx` (certificate logos)

### Adding Photos

Replace the placeholder photo components in:
- `app/page.tsx` (leadership photos)
- `components/CertificateGenerator.tsx` (certificate photos)

### Modifying Certificate Design

Edit `components/CertificateGenerator.tsx` to customize:
- Colors
- Layout
- Fonts
- Dimensions

## 📞 Support

For issues or questions, please contact the development team.

## 📄 License

This project is developed for Telangana State Government.

---

**Note**: This is a microsite designed for high-scale public access. All certificate generation happens in the browser to minimize server load and ensure scalability.
