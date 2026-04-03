# Dipesh Tutorials Apple-Grade App — Agent Notes

## Project
Apple Human Interface Guidelines-compliant mobile-first coaching class management app.
Repo: `frcrcfaculty-commits/Dipesh-Tutorials-Apple`
Live: https://zo.pub/hansal/dipesh-apple

## Architecture
- Frontend: React 19 + Vite + react-router-dom (HashRouter)
- Backend: Supabase (PostgreSQL + Auth + Storage + RLS)
- Mobile: Capacitor (Android + iOS) configured
- Animations: Framer Motion (motion, AnimatePresence)
- Charts: Recharts (ResponsiveContainer, PieChart, BarChart, RadarChart)
- Icons: Lucide React
- Haptics: @capacitor/haptics (mobile only)
- Styling: Pure CSS with CSS variables (no Tailwind)

## Design System
- Primary: #0A2351 (Deep Navy)
- Accent: #B6922E (Warm Gold)
- Background: #F2F2F7 (Apple Gray)
- Card: #FFFFFF
- Success: #34C759 (Apple Green)
- Danger: #FF3B30 (Apple Red)
- Font: SF Pro Display fallback chain
- Border radius: 16px (cards), 12px (buttons), 8px (inputs)
- Shadows: Apple-style layered shadows (0 2px 8px rgba(0,0,0,0.08))
- Bottom Tab Nav: Glassmorphism blur, 5 tabs with icons

## Pages (9 screens)
- Login — Animated logo, floating labels, glassmorphic card
- Dashboard — Role-specific (Parent/Student/Admin), animated stat cards, charts
- Attendance — Calendar grid, P/L/A buttons with spring animations
- Students — Card list view, search, filter, add/edit modal
- Billing — Fee cards with animated progress bars, payment modal
- TestResults — Grade cards with animated color fills, subject breakdown
- Analytics — Radar chart, bar charts, grade distribution
- Notifications — Stacked notification cards, swipe-ready, badge count
- Resources — Card grid, type badges, download buttons

## Key Files
- `src/App.jsx` — Auth context, HashRouter, bottom tab nav
- `src/components/BottomNav.jsx` — 5-tab glassmorphic nav
- `src/components/Toast.jsx` — Animated toast notifications
- `src/lib/api.js` — All Supabase query functions (copied from original)
- `src/lib/supabase.js` — Supabase client
- `src/lib/utils.js` — Utility functions
- `src/pages/*.jsx` — All 9 page components

## API Reference (same as original)
- Auth: signIn, signOut, getCurrentUser
- Students: getStudents, getStudentById, addStudent, updateStudent, deleteStudent
- Attendance: getAttendanceByDate, markAttendance, getStudentAttendance
- Tests: getTests, createTest, getTestResults, upsertTestResults
- Fees: getFeeSummary, recordPayment
- Notifications: getNotifications, createNotification, markNotificationRead
- Resources: getResources, uploadResource, uploadFile
- Stats: getDashboardStats, getStudentStats

## Supabase Setup
- Project ref: upkhlhoyzvzblqilyfpu
- URL: https://upkhlhoyzvzblqilyfpu.supabase.co
- Anon key: (use project's anon key from Supabase dashboard)
- Same schema as original project (supabase/schema.sql)

## Building APK
```bash
cd Dipesh-Apple
npx cap sync android
cd android
./gradlew assembleDebug
# APK at: android/app/build/outputs/apk/debug/app-debug.apk
```

## Building iOS
```bash
npx cap sync ios
cd ios
open App.xcworkspace
# Build from Xcode
```

## Known Issues
1. Android APK build requires Java 17+ and Android SDK (not available in this environment)
2. Chunk size >500KB warning (recharts + framer-motion are heavy; use lazy loading to fix)
3. Capacitor haptics/local-notifications need native compilation
