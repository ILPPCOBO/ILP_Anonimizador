#!/usr/bin/env python3
"""Regenera Anonimizador-2.0-PORTABLE.html embebiendo el OCR (Tesseract) en base64
dentro de index.html, para que funcione por doble clic sin servidor.

Uso:  python3 build_portable.py
"""
import base64, os

HERE = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(HERE, "index.html"), "r", encoding="utf-8").read()

ASSETS = {
    "__OCR_TESS__":     "ocr/tesseract.min.js",
    "__OCR_WORKER__":   "ocr/worker.min.js",
    "__OCR_COREJS__":   "ocr/tesseract-core-simd-lstm.wasm.js",
    "__OCR_COREWASM__": "ocr/tesseract-core-simd-lstm.wasm",
    "__OCR_LANG__":     "ocr/spa.traineddata.gz",
}

for placeholder, path in ASSETS.items():
    data = base64.b64encode(open(os.path.join(HERE, path), "rb").read()).decode("ascii")
    assert "</script" not in data.lower(), "base64 no debe contener </script"
    assert placeholder in html, f"placeholder {placeholder} no encontrado en index.html"
    html = html.replace(placeholder, data, 1)

out = os.path.join(HERE, "Anonimizador-2.0-PORTABLE.html")
open(out, "w", encoding="utf-8").write(html)
print("OK ->", out, f"({round(os.path.getsize(out)/1048576, 1)} MB)")
