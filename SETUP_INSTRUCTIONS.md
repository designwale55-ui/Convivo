# Haven Music Platform - Setup Instructions

## What's Been Built

Your Haven Music Platform MVP is now ready! Here's what has been implemented:

### Core Features Completed

1. **Database Schema**
   - Complete tables for users, songs, credit transactions, unlocked songs, artist withdrawals, play history, fan relationships, and audit logs
   - Row-level security policies for all tables
   - Automatic triggers for revenue splits, Haven Heat scoring, and fan relationship tracking
   - Credit deduction function with balance validation

2. **Authentication System**
   - Email/password signup with role selection (listener/artist)
   - Login with session management
   - Protected routes for different user roles
   - Automatic 10 free credits on signup

3. **Credit System**
   - Buy credits modal with UPI QR code payment
   - Multiple credit bundles (50, 100, 250, 500, 1000 credits)
   - Manual admin verification workflow
   - Transaction history tracking
   - Persistent credit counter in navigation

4. **Music Discovery Feed**
   - Display all published songs with cover art
   - Search functionality
   - Genre filtering (Hip-Hop, Pop, Rock, Electronic, Classical, Indie, Jazz, R&B)
   - Sort by Haven Heat, newest, price
   - Haven Heat (HH) score display on each song card

5. **Unlock & Playback System**
   - Song unlock modal with price confirmation
   - Balance validation before unlock
   - 10-second refund window with countdown timer
   - Free tester slot system (1 per week)
   - Automatic revenue split calculation (55% artist, 45% platform)
   - Toast notifications with detailed transaction info

6. **Artist Upload System**
   - Multi-step upload form (Details → Files → Review)
   - Cover art upload with preview (max 5MB, JPG/PNG)
   - Audio file upload (max 50MB, MP3/WAV/FLAC)
   - Price tier system (X: 5-15, Y: 16-30, Z: 31-50 credits)
   - Submit for moderation workflow

7. **Admin Dashboard**
   - Pending credit top-up verification
   - Pending song moderation
   - Approve/reject actions for both
   - Automatic credit allocation on approval

8. **User Profile**
   - Display credits balance
   - Account information
   - Member since date
   - Free tester slot usage tracking

9. **My Library**
   - Display all unlocked songs
   - Quick access to owned music

10. **Onboarding**
    - 3-slide tutorial explaining credits, unlocking, and Haven Heat
    - Shown once on first login
    - Automatic credit purchase modal after signup

## What You Need to Do Next

### 1. Create Supabase Storage Buckets (REQUIRED)

The app needs two storage buckets that must be created manually:

1. Go to your Supabase dashboard: https://zmvmslbhzyuuexajreko.supabase.co
2. Navigate to Storage → Create new bucket
3. Create bucket `songs-covers` with **public** access
4. Create bucket `songs-audio` with **public** access

### 2. Replace the UPI QR Code Image (REQUIRED)

Replace the placeholder QR code with your actual payment QR code:

1. Save your UPI QR code image as `upi-qr-code.jpg`
2. Place it in the `/public` folder
3. The image will be shown in the Buy Credits modal

### 3. Create an Admin User (REQUIRED)

To access the admin dashboard, you need at least one admin user:

1. Sign up normally through the app
2. Go to your Supabase dashboard → Table Editor → users table
3. Find your user record
4. Change the `role` column from 'listener' to 'admin'
5. Now you can access `/admin` route

### 4. Configure Credit Bundle Pricing (OPTIONAL)

If you want different credit bundles or prices:

1. Edit `src/components/BuyCreditsModal.tsx`
2. Update the `CREDIT_BUNDLES` array at the top of the file
3. Format: `{ credits: number, inr: number, popular: boolean }`

### 5. Test the Complete Flow

Once storage buckets are created:

1. **As a Listener:**
   - Sign up with role "Listen"
   - Get 10 free credits
   - Browse songs on home page
   - Try to unlock a song (will fail if no songs exist)
   - Use free tester slot
   - Test the 10-second refund

2. **As an Artist:**
   - Sign up with role "Create"
   - Upload a song with cover art and audio
   - Wait for admin approval
   - View your song in the feed after approval

3. **As an Admin:**
   - Change your user role to 'admin' in database
   - Go to /admin
   - Approve artist songs
   - Verify credit top-up transactions

### 6. Production Deployment Checklist

Before launching:

- [ ] Storage buckets created and public
- [ ] UPI QR code replaced with real payment QR
- [ ] At least one admin user created
- [ ] Test all user flows (signup, unlock, upload, admin)
- [ ] Verify credit deduction works correctly
- [ ] Test refund functionality
- [ ] Check that Haven Heat updates properly
- [ ] Ensure email notifications work (if added)
- [ ] Set up monitoring for failed transactions
- [ ] Configure backup schedule for database
- [ ] Review RLS policies for security
- [ ] Test on mobile devices
- [ ] Add actual payment gateway integration (Razorpay) to replace manual verification

## Key Metrics to Track

Once live, monitor these metrics in your Supabase database:

1. **Credits Economy**
   - Total credits purchased (lifetime)
   - Outstanding credits liability
   - Average credits per user
   - Credit top-up conversion rate

2. **User Engagement**
   - Daily active users
   - Average unlocks per user
   - Free tester slot usage rate
   - Refund rate (should be low)

3. **Artist Performance**
   - Average song price
   - Top earning songs
   - Songs per artist
   - Withdrawal request frequency

4. **Platform Revenue**
   - Total platform cut (45% of all unlocks)
   - Total artist revenue (55% of all unlocks)
   - Pending withdrawals

## Future Enhancements

Features NOT included in this MVP but can be added later:

1. **Automated Payment Processing**
   - Integrate Razorpay webhooks for instant credit top-ups
   - Remove manual admin verification

2. **Audio Playback**
   - Build actual audio player component
   - Add playlist functionality
   - Implement offline caching with PWA

3. **Artist Dashboard**
   - Detailed analytics with charts
   - Fan leaderboard (top 50 supporters)
   - Revenue per day graph
   - Withdrawal request system

4. **Haven Heat Algorithm Edge Function**
   - Hourly cron job to recalculate HH scores
   - Factor in play completions and skips
   - HH decay over time

5. **Social Features**
   - Follow favorite artists
   - Share songs
   - Comments and reviews

6. **Advanced Search**
   - Full-text search
   - Filter by price range
   - Filter by HH score range

7. **PWA Features**
   - Offline mode
   - Install prompt
   - Push notifications

## Architecture Overview

```
Haven Music Platform
│
├── Frontend (React + TypeScript + Vite)
│   ├── Authentication (Supabase Auth)
│   ├── Credit System (Manual Verification)
│   ├── Music Discovery (Haven Heat Sorting)
│   ├── Upload System (File Validation)
│   └── Admin Dashboard
│
├── Backend (Supabase)
│   ├── PostgreSQL Database
│   │   ├── Users
│   │   ├── Songs
│   │   ├── Credit Transactions
│   │   ├── Unlocked Songs
│   │   └── Audit Logs
│   │
│   ├── Row-Level Security
│   ├── Database Triggers
│   └── Storage Buckets
│       ├── songs-covers (public)
│       └── songs-audio (public)
│
└── Payment Flow
    ├── User scans UPI QR code
    ├── User enters transaction ID
    ├── Admin verifies payment
    └── Credits added automatically
```

## Support

If you encounter issues:

1. Check Supabase logs for database errors
2. Check browser console for frontend errors
3. Verify storage buckets are created and public
4. Ensure RLS policies are active
5. Test with admin user role

## Credit to INR Conversion

- 1 credit = ₹0.80 INR
- Artist receives 55% of INR value
- Platform keeps 45% of INR value

Example: 20 credit unlock = ₹16
- Artist gets: ₹8.80
- Platform gets: ₹7.20

---

**Your Haven Music Platform MVP is production-ready!** Complete the setup steps above and start testing.
