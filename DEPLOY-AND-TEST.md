# Deploy and test (PowerShell)

Project root: C:\Users\aksha\Attendance System\Attendance-System

## 0. Back up, then copy the changed files over your project
Changed backend files: routes\attendanceRoutes.js, server.js, prisma\schema.prisma,
prisma\sql\2026-10-attendance-columns.sql (new)
Changed frontend files: src\util\api.ts, src\util\auth.ts (new), src\components\PhotoAttendance.tsx (new),
src\app\employee-login\page.tsx (new), src\app\attendance\check-in\page.tsx,
src\app\attendance\check-out\page.tsx, src\app\my-attendance\page.tsx
Your .env files are NOT in this package and must stay as they are.

## 1. Database (additive, no data is deleted) - run ONCE against the production DB
    cd "C:\Users\aksha\Attendance System\Attendance-System\backend"
    npx prisma db execute --file prisma\sql\2026-10-attendance-columns.sql --schema prisma\schema.prisma
    npx prisma generate
(DATABASE_URL must be set in backend\.env pointing at the DB you want to change.)

## 2. Render env vars required (names only)
DATABASE_URL, EMPLOYEE_JWT_SECRET, ADMIN_JWT_SECRET, CLOUDINARY_CLOUD_NAME,
CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
Optional: ATTENDANCE_TZ_OFFSET_MINUTES (default 330 = IST)

## 3. Run locally
    cd backend;  npm install;  npm run dev
    cd ..\frontend;  npm install;  npm run build;  npm run dev

## 4. Deploy
    cd "C:\Users\aksha\Attendance System\Attendance-System"
    git status
    git add backend frontend
    git commit -m "Photo-only attendance with employee login"
    git push
Render and Vercel redeploy from Git. Check Render logs show no startup errors, then open
https://attendance-backend-2nky.onrender.com/api/health

## 5. Test checklist
1. Sign in at /employee-login with a real employee ID and password.
2. /attendance/check-in -> Start Camera -> Capture -> Submit: expect "Check-In recorded successfully."
3. Submit check-in again: expect "You are already checked in. Please check out first."
4. /attendance/check-out -> capture -> submit: expect "Check-Out recorded successfully."
5. Check-out again: expect "No active check-in found. Please check in first."
6. /my-attendance shows the record with times, hours and photo links.
7. Sign out, open /my-attendance: expect a sign-in prompt, not data.
8. Deny camera permission: expect the permission-denied message with how to re-enable it.
9. Turn off Wi-Fi and submit: expect "Cannot reach the server..."
10. Phone: camera needs HTTPS (the Vercel URL is HTTPS, so it works).

## API smoke tests (PowerShell; do not paste real passwords into shared logs)
    $b = "https://attendance-backend-2nky.onrender.com"
    $r = Invoke-RestMethod "$b/api/employees/login" -Method Post -ContentType "application/json" -Body (@{employeeId="EMP001";password=(Read-Host "Password")} | ConvertTo-Json)
    $h = @{Authorization="Bearer $($r.token)"}
    Invoke-RestMethod "$b/api/attendance/my" -Headers $h
    # No token must be rejected (401):
    try { Invoke-RestMethod "$b/api/attendance/my" } catch { $_.Exception.Response.StatusCode.value__ }
    # Check-in without a photo must be rejected (400):
    try { Invoke-RestMethod "$b/api/attendance" -Method Post -Headers $h } catch { $_.Exception.Response.StatusCode.value__ }
