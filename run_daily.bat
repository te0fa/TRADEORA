@echo off
cd /d "E:\zaora\TRADEORA"
set PYTHONPATH=E:\zaora\TRADEORA
python main.py
echo Main finished at %date% %time% >> logs\scheduler.log
python track_trades.py
echo Track trades finished at %date% %time% >> logs\scheduler.log
python signal_guardian.py
echo Guardian finished at %date% %time% >> logs\scheduler.log

echo [%TIME%] Running TV Backfill (daily candles)...
python tv_backfill.py --incremental
if errorlevel 1 (
    echo [ERROR] TV Backfill failed - check logs
) else (
    echo [OK] TV Backfill completed
)
echo TV Backfill finished at %date% %time% >> logs\scheduler.log
