@echo off
REM ============================================================
REM  Buenos Mexican Cuisine — Supabase Deploy Script
REM  Run this script AFTER you have your:
REM    1. Supabase Access Token (from dashboard.supabase.com/account/tokens)
REM    2. Resend API Key (from resend.com)
REM ============================================================

echo.
echo ========================================================
echo   Buenos Mexican Cuisine — Supabase Deploy
echo ========================================================
echo.

REM ---- EDIT THESE TWO VALUES ----
set SUPABASE_ACCESS_TOKEN=sb_publishable_bWTs6QxY6USRl6605EBDLQ_41Zan2i-
set RESEND_API_KEY=YOUR_RESEND_API_KEY_HERE
REM --------------------------------

echo [1/3] Linking to Supabase project...
set SUPABASE_ACCESS_TOKEN=%SUPABASE_ACCESS_TOKEN%
npx supabase@latest link --project-ref tgekluwdzimtzigugvvw

echo.
echo [2/3] Setting Resend API key as secret...
npx supabase@latest secrets set RESEND_API_KEY=%RESEND_API_KEY%

echo.
echo [3/3] Deploying edge function...
npx supabase@latest functions deploy send-booking-email --no-verify-jwt

echo.
echo ========================================================
echo   DONE! Edge function is live.
echo   Function URL:
echo   https://tgekluwdzimtzigugvvw.supabase.co/functions/v1/send-booking-email
echo ========================================================
echo.
echo   NEXT STEP: Set up the Database Webhook in Supabase Dashboard
echo   Go to: Database > Webhooks > Create new hook
echo   Name: on_new_booking
echo   Table: bookings
echo   Events: INSERT
echo   Type: Supabase Edge Functions
echo   Function: send-booking-email
echo.
pause
