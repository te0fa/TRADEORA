@echo off
cd /d "E:\TRADEORA"
set PYTHONPATH=E:\TRADEORA
python main.py
echo Import finished at %date% %time% >> logs\scheduler.log
