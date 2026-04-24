@echo off
:: Daily license expiry notification script
:: Schedule this with Windows Task Scheduler to run every morning (e.g. 8:00 AM)

set BASE_URL=http://localhost:3000/phniams
set CRON_SECRET=948c591928660e554fd9ed1a59f01122d3de12bbbf9bf51de91a5af8fd0a9c72

curl -s -X POST "%BASE_URL%/api/notifications/license-expiry" ^
  -H "x-cron-secret: %CRON_SECRET%" ^
  -H "Content-Type: application/json" ^
  >> "%~dp0notify-license-expiry.log" 2>&1

echo [%date% %time%] Notification check completed >> "%~dp0notify-license-expiry.log"
