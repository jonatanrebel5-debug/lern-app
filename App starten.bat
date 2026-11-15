@echo off
title Lern-App (dieses Fenster offen lassen)
cd /d "%~dp0"
echo.
echo  Lern-App wird gestartet...
echo  Der Browser oeffnet sich gleich automatisch.
echo  Zum Beenden einfach dieses Fenster schliessen.
echo.
start "" cmd /c "timeout /t 6 /nobreak >nul & start http://localhost:3000"
call npm run dev
pause
