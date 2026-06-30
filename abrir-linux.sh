#!/bin/bash
# Lanzador del Anonimizador para Linux - servidor LOCAL (solo este equipo)
cd "$(dirname "$0")" || exit 1
PORT=8000

if command -v python3 >/dev/null 2>&1; then
  while command -v lsof >/dev/null 2>&1 && lsof -i ":$PORT" >/dev/null 2>&1; do PORT=$((PORT+1)); done
  URL="http://localhost:$PORT"
  echo "============================================================"
  echo "  Anonimizador en  $URL"
  echo "  Solo accesible desde este equipo. Ctrl+C para parar."
  echo "============================================================"
  ( sleep 1; (xdg-open "$URL" || sensible-browser "$URL") >/dev/null 2>&1 ) &
  exec python3 -m http.server "$PORT" --bind 127.0.0.1
else
  echo "Python3 no encontrado. Abriendo el archivo directamente..."
  xdg-open "index.html" >/dev/null 2>&1 || echo "Abre index.html en tu navegador."
fi
