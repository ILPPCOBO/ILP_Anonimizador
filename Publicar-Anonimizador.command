#!/bin/bash
# Publicar Anonimizador 2.0 con un doble clic:
#   1) regenera la version cifrada (deploy/)
#   2) publica en Vercel (produccion)
#   3) sube los cambios a GitHub
# La contrasena se pide al momento (NO se guarda en ningun archivo).

export PATH="$HOME/.local/node/bin:$PATH"
PROJ="$HOME/anonimizador"

echo "==================================================="
echo "   Publicar Anonimizador 2.0"
echo "==================================================="
cd "$PROJ" 2>/dev/null || { echo "ERROR: no encuentro $PROJ"; read -n1 -s -p "Pulsa una tecla..."; exit 1; }

# Elegir un python3 que tenga el modulo 'cryptography' (necesario para cifrar)
PYBIN=""
for cand in /opt/anaconda3/bin/python3 "$(command -v python3)" /Library/Frameworks/Python.framework/Versions/3.13/bin/python3 /usr/local/bin/python3; do
  [ -n "$cand" ] || continue
  if "$cand" -c "import cryptography" 2>/dev/null; then PYBIN="$cand"; break; fi
done
if [ -z "$PYBIN" ]; then
  echo "ERROR: no encuentro un python3 con 'cryptography'. Instalalo con:  pip3 install cryptography"
  read -n1 -s -p "Pulsa una tecla..."; exit 1
fi

# Contrasena (oculta al teclear)
read -s -p "Contrasena del anonimizador: " PW; echo
if [ -z "$PW" ]; then echo "Cancelado (sin contrasena)."; read -n1 -s -p "Pulsa una tecla..."; exit 1; fi

echo
echo "[1/3] Regenerando version cifrada (deploy/)..."
"$PYBIN" build_protegido.py "$PW" || { echo "ERROR al cifrar. Revisa la contrasena/python."; read -n1 -s -p "Pulsa una tecla..."; exit 1; }

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
