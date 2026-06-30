@echo off
REM Lanzador del Anonimizador para Windows - servidor LOCAL (solo este equipo)
cd /d "%~dp0"
set PORT=8000

REM intentar con python, luego con py
where python >nul 2>nul
if %errorlevel%==0 (
  echo ============================================================
  echo   Anonimizador en  http://localhost:%PORT%
  echo   Solo accesible desde este equipo. Cierra esta ventana para parar.
  echo ============================================================
  start "" http://localhost:%PORT%
  python -m http.server %PORT% --bind 127.0.0.1
  goto :eof
)
where py >nul 2>nul
if %errorlevel%==0 (
  echo Anonimizador en http://localhost:%PORT%  (cierra esta ventana para parar)
  start "" http://localhost:%PORT%
  py -3 -m http.server %PORT% --bind 127.0.0.1
  goto :eof
)

echo Python no encontrado. Abriendo el archivo directamente en el navegador...
start "" "index.html"
