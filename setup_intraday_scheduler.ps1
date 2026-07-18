$TaskName = "Tradeora-Intraday-Collector"
$ScriptPath = "E:\TRADEORA\intraday_collector.py"
$WorkingDirectory = "E:\TRADEORA"
$PythonPath = (Get-Command python).Source

if (-not $PythonPath) {
    Write-Host "Python not found in PATH. Please specify python executable path." -ForegroundColor Red
    exit
}

Write-Host "Setting up Intraday Collector Task..." -ForegroundColor Cyan

# Remove existing task if it exists
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Removed existing task." -ForegroundColor Yellow
}

$Action = New-ScheduledTaskAction -Execute $PythonPath -Argument $ScriptPath -WorkingDirectory $WorkingDirectory

# We want it to run every 15 minutes between 09:55 AM and 02:35 PM on Sun-Thu
# The Python script has an internal check 'is_market_open()' which stops execution
# if it's outside market hours (Sun-Thu 09:55-14:35).
# So we can safely run it every 15 mins indefinitely.
$Trigger = New-ScheduledTaskTrigger -Once -At 00:00 -RepetitionInterval (New-TimeSpan -Minutes 15)

# Restrict to Sunday through Thursday
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

Register-ScheduledTask -Action $Action -Trigger $Trigger -TaskName $TaskName -Description "Collects intraday stock snapshots from TradingView every 15 mins" -Settings $Settings -User "SYSTEM" -RunLevel Highest

Write-Host "Task '$TaskName' registered successfully!" -ForegroundColor Green
Write-Host "Runs every 15 mins from 09:55 AM, Daily." -ForegroundColor Green
