#!/bin/bash
# Lanzador del Anonimizador 2.0 — servidor LOCAL (solo este equipo, 127.0.0.1)
# Doble clic para abrir con OCR. Cierra la ventana o pulsa Ctrl+C para parar.
cd "$(dirname "$0")" || exit 1
PORT=8000
while command -v lsof >/dev/null 2>&1 && lsof -i ":$PORT" >/dev/null 2>&1; do PORT=$((PORT+1)); done
URL="http://localhost:$PORT"
echo "────────────────────────────────────────────"
echo "  Anonimizador 2.0 en:  $URL"
echo "  Solo accesible desde este equipo. Cierra esta ventana para parar."
echo "────────────────────────────────────────────"
( sleep 1; open "$URL" ) &
if command -v python3 >/dev/null 2>&1; then exec python3 -m http.server "$PORT" --bind 127.0.0.1
elif command -v ruby >/dev/null 2>&1; then exec ruby -run -e httpd . -p "$PORT" -b 127.0.0.1
elif command -v python >/dev/null 2>&1; then exec python -m SimpleHTTPServer "$PORT"
else echo "No hay Python ni Ruby instalados. Abriendo el archivo directamente (sin OCR)…"; open "index.html"; fi
