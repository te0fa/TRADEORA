# PowerShell Script to register Tradeora Daily EOD Update Task in Windows Task Scheduler
# Run this script in an Administrator PowerShell window.

$Action = New-ScheduledTaskAction -Execute "E:\TRADEORA\run_daily.bat"
$Trigger = New-ScheduledTaskTrigger -Daily -At 5:00PM
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName "Tradeora_Daily_EGX_Update" -Action $Action -Trigger $Trigger -Settings $Settings -Description "Runs Tradeora daily EGX price update at 5:00 PM local time." -Force

Write-Host "Task Scheduler task 'Tradeora_Daily_EGX_Update' successfully registered to run daily at 5:00 PM." -ForegroundColor Green
