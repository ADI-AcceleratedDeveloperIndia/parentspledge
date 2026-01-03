# Vercel Environment Variables Setup

## ✅ Required Environment Variable

Add this **ONE** environment variable in your Vercel project:

### MongoDB Connection String

**Key:** `MONGODB_URI`

**Value:**
```
mongodb+srv://aideveloperindia_db_user:9SCZZBD7w5I503Gc@parentspledge.b0xqchl.mongodb.net/parentspledge?retryWrites=true&w=majority&appName=parentspledge
```

---

## 📋 Step-by-Step Instructions for Vercel:

1. **Go to Vercel Dashboard**
   - Navigate to your project: `https://vercel.com/dashboard`
   - Select your `parentspledge` project

2. **Open Settings**
   - Click on **Settings** tab
   - Click on **Environment Variables** in the left sidebar

3. **Add Environment Variable**
   - Click **Add New**
   - **Key:** `MONGODB_URI`
   - **Value:** Paste the connection string above
   - **Environment:** Select **All** (Production, Preview, Development)
   - Click **Save**

4. **Redeploy**
   - Go to **Deployments** tab
   - Click the **⋯** (three dots) on the latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger automatic deployment

---

## ✅ Features Already Configured:

### 🔓 Admin Authentication (Disabled)
- **Status:** ✅ Already disabled
- **Behavior:** Any password will work (even empty password)
- **Access:** Go to `/admin` and enter any password

### 📊 Visitor Count
- **Status:** ✅ Ready to work
- **Behavior:** Will automatically start counting once MongoDB is connected
- **Display:** Shows in footer on main page
- **Storage:** Stored in MongoDB `visitors` collection

### 💾 Database Collections
- **Auto-created:** Collections are created automatically on first use
- **Collections:**
  - `pledges` - Stores all pledge submissions
  - `visitors` - Stores visitor count

---

## 🧪 Testing After Deployment:

1. **Main Site**
   - Visit: `https://your-project.vercel.app`
   - Check visitor count in footer (should show a number)

2. **Admin Dashboard**
   - Visit: `https://your-project.vercel.app/admin`
   - Enter **any password** (or leave empty)
   - Should login successfully

3. **Submit a Pledge**
   - Fill out the form
   - Submit and download certificate
   - Check admin dashboard for analytics

---

## 🔍 Troubleshooting:

### Visitor Count Shows 0 or "..."
- **Cause:** MongoDB not connected
- **Solution:** Verify `MONGODB_URI` is set correctly in Vercel
- **Check:** Look at Vercel function logs for MongoDB connection errors

### Admin Dashboard Shows "Invalid Password"
- **Cause:** Should not happen (dummy auth enabled)
- **Solution:** Make sure you're entering any password (even empty works)

### Pledges Not Saving
- **Cause:** MongoDB connection issue
- **Solution:** Check Vercel logs and verify `MONGODB_URI` is correct
- **Note:** Certificate generation works even if MongoDB fails (graceful degradation)

---

## 📝 MongoDB Connection String Details:

- **Username:** `aideveloperindia_db_user`
- **Password:** `9SCZZBD7w5I503Gc`
- **Cluster:** `parentspledge.b0xqchl.mongodb.net`
- **Database:** `parentspledge`
- **Collections:** Auto-created (`pledges`, `visitors`)

---

## 🚀 Quick Copy-Paste for Vercel:

**Key:**
```
MONGODB_URI
```

**Value:**
```
mongodb+srv://aideveloperindia_db_user:9SCZZBD7w5I503Gc@parentspledge.b0xqchl.mongodb.net/parentspledge?retryWrites=true&w=majority&appName=parentspledge
```

**Environment:** Select **All** (Production, Preview, Development)

---

## ✅ Verification Checklist:

After adding the environment variable and redeploying:

- [ ] Environment variable `MONGODB_URI` is set in Vercel
- [ ] Application redeployed successfully
- [ ] Visitor count shows a number (not "..." or 0)
- [ ] Admin dashboard accepts any password
- [ ] Pledge submission works
- [ ] Certificate downloads successfully
- [ ] Admin analytics show data

---

**Note:** The application is designed to work gracefully even if MongoDB is temporarily unavailable. Certificate generation will always work, and analytics will show empty data until MongoDB is connected.
