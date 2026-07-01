#!/bin/bash
# Publicar Anonimizador 2.0 con un doble clic:
#   1) regenera la version cifrada (deploy/)
#   2) publica en Vercel (produccion)
#   3) sube los cambios a GitHub
# La contrasena se pide al momento (NO se guarda en ningun archivo).

export PATH="$HOME/.local/node/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
PROJ="$HOME/anonimizador"

echo "==================================================="
echo "   Publicar Anonimizador 2.0"
echo "==================================================="
cd "$PROJ" 2>/dev/null || { echo "ERROR: no encuentro $PROJ"; read -n1 -s -p "Pulsa una tecla..."; exit 1; }

# Contrasena (oculta al teclear)
read -s -p "Contrasena del anonimizador: " PW; echo
if [ -z "$PW" ]; then echo "Cancelado (sin contrasena)."; read -n1 -s -p "Pulsa una tecla..."; exit 1; fi

echo
echo "[1/3] Regenerando version cifrada (deploy/)..."
python3 build_protegido.py "$PW" || { echo "ERROR al cifrar. Revisa la contrasena/python."; read -n1 -s -p "Pulsa una tecla..."; exit 1; }

echo
echo "[2/3] Publicando en Vercel (produccion)..."
npx -y vercel deploy --prod --yes || { echo "ERROR al publicar en Vercel."; read -n1 -s -p "Pulsa una tecla..."; exit 1; }

echo
echo "[3/3] Subiendo a GitHub..."
git add -A
if git commit -m "Actualizacion $(date '+%Y-%m-%d %H:%M')" ; then
  git push origin main || echo "AVISO: no se pudo subir a GitHub (revisa credenciales)."
else
  echo "(No habia cambios nuevos que subir a GitHub.)"
fi

echo
echo "==================================================="
echo "   LISTO. Web: https://anonimizador-ilp.vercel.app"
echo "==================================================="
read -n1 -s -p "Pulsa una tecla para cerrar..."
echo
