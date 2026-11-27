@echo off
setlocal
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Prima installazione richiesta. Vedi README.md.
  echo   py -3.13 -m venv .venv
  echo   .venv\Scripts\python -m pip install -r requirements.txt
  pause
  exit /b 1
)
.venv\Scripts\python.exe -c "import flask, PIL, numpy, qrcode, waitress" >nul 2>&1
if errorlevel 1 (
  echo Dipendenze mancanti. Esegui:
  echo   .venv\Scripts\python -m pip install -r requirements.txt
  pause
  exit /b 1
)
.venv\Scripts\python.exe -m app.server
if errorlevel 1 pause
endlocal
