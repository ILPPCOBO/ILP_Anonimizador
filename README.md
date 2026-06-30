# ILP Anonimizador 2.0

Herramienta de **anonimización de datos personales** (DNI, NIE, CIF, IBAN, teléfono, email,
dirección, código postal, matrícula, IP, nombres de persona, firmas manuscritas…) en **textos y PDFs**.

> **100 % en el navegador, sin backend.** Los documentos se procesan en local y **nunca salen del equipo**.
> Sin servidor remoto, sin telemetría. Funciona sin conexión.

## Características

- Detección determinista (regex + diccionarios + **contexto**): DNI/NIE/CIF (con dígito de control),
  IBAN, cuenta, Nº Seg. Social, teléfono (varios formatos), email (normal y **ofuscado**), dirección,
  código postal con contexto, matrícula (actual y antigua), IP, empresa (S.L./S.A.) y **nombres de persona**.
- 3 modos: **Redactar** (cajas negras), **Etiquetar** (`[PERSONA_1]`), **Seudónimo** (datos falsos coherentes).
- **Un documento** o **lote** (varios a la vez), con pool de Web Workers, descarga **ZIP** o individual,
  informe **CSV**, selección/eliminación de documentos, cancelar/reanudar.
- **PDF, los dos tipos:** con texto (directo) y **escaneado** (OCR en español, offline).
- **Redacción sobre imagen** (conserva el diseño original, sin texto oculto) y tapado de **firmas/manuscrito**.

## Archivos

| Archivo | Descripción |
|---|---|
| `index.html` | La herramienta (versión carpeta; carga el OCR desde `ocr/`). |
| `ocr/` | Motor OCR (Tesseract.js) + modelo español. 100 % offline. |
| `Anonimizador-2.0-PORTABLE.html` | Versión "todo en uno" con el OCR **embebido** (un solo archivo). |
| `abrir-anonimizador.command` / `.bat` / `.sh` | Lanzadores: arrancan un servidor local (Mac/Windows/Linux). |
| `LEEME.txt` | Guía de uso y solución de problemas. |
| `build_portable.py` | Regenera `Anonimizador-2.0-PORTABLE.html` desde `index.html` + `ocr/`. |
| `deploy/` | Versión **protegida con contraseña** (contenido cifrado) lista para desplegar. Es lo que sirve el auto-deploy. |
| `build_protegido.py` | Regenera `deploy/` cifrando `index.html` con una contraseña (`python3 build_protegido.py "clave"`). |

## Uso

- **Textos y PDFs con texto** → abre `index.html` o el PORTABLE por **doble clic**.
- **PDFs escaneados (OCR)** → ábrelo **servido** (HTTPS o `http://localhost`): con un lanzador, con el
  PORTABLE, o desplegado. Los navegadores **bloquean el OCR en `file://`** (doble clic) por seguridad.

## Despliegue privado

Sube la carpeta (`index.html` + `ocr/`) a un hosting estático con **HTTPS** (p. ej. Cloudflare
Pages/Workers). Sobre HTTPS el OCR funciona sin instalar nada. Restringe el acceso con **Cloudflare
Access** o una **contraseña**. Como no hay backend, **ningún documento se sube** aunque esté desplegado.

## Privacidad

Sin backend, sin telemetría. Todo el procesamiento ocurre en el navegador del usuario.
Lo único opcional que toca internet es el botón "Activar NER" (descarga un modelo; aun así el documento no se sube).
