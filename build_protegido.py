#!/usr/bin/env python3
"""Genera la carpeta `deploy/` = versión protegida con contraseña, lista para desplegar.

El contenido de index.html se CIFRA (AES-256-GCM, clave derivada con PBKDF2-SHA256).
Quien no tenga la contraseña no ve nada (ni el código fuente). La contraseña NO se
guarda en el repositorio: solo viaja el texto cifrado.

Uso:  python3 build_protegido.py "LA_CONTRASEÑA"
"""
import sys, os, base64, shutil
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

if len(sys.argv) < 2:
    sys.exit('Uso: python3 build_protegido.py "tu contraseña"')
PASSWORD = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))

plaintext = open(os.path.join(HERE, "index.html"), "rb").read()
salt = os.urandom(16)
iv = os.urandom(12)
key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=200000).derive(PASSWORD.encode())
ct = AESGCM(key).encrypt(iv, plaintext, None)

TPL = '''<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Anonimizador 2.0</title>
<style>body{margin:0;background:#0b0f17;color:#e8edf5;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh}
.box{background:#141c2c;border:1px solid #2a3650;border-radius:16px;padding:28px;width:330px;text-align:center}
h1{font-size:20px;margin:0 0 4px}.sub{color:#96a3b8;font-size:13px;margin-bottom:18px}
input{width:100%;box-sizing:border-box;padding:11px;border-radius:10px;border:1px solid #2a3650;background:#0e1422;color:#e8edf5;font-size:15px;margin-bottom:10px}
button{width:100%;padding:11px;border-radius:10px;border:0;background:#34d399;color:#06281d;font-weight:600;font-size:15px;cursor:pointer}
.err{color:#f87171;font-size:13px;height:16px;margin-top:8px}</style></head>
<body><div class="box"><h1>&#128737;&#65039; Anonimizador 2.0</h1><div class="sub">Introduce la contrase&#241;a para entrar</div>
<input id="p" type="password" placeholder="Contrase&#241;a" autofocus>
<button id="b">Entrar</button><div class="err" id="e"></div></div>
<script>
var SALT="__SALT__",IV="__IV__",CT="__CT__";
function b64(s){var b=atob(s),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;}
async function go(){var pw=document.getElementById("p").value,e=document.getElementById("e");e.textContent="Comprobando...";
try{var km=await crypto.subtle.importKey("raw",new TextEncoder().encode(pw),"PBKDF2",false,["deriveKey"]);
var key=await crypto.subtle.deriveKey({name:"PBKDF2",salt:b64(SALT),iterations:200000,hash:"SHA-256"},km,{name:"AES-GCM",length:256},false,["decrypt"]);
var plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:b64(IV)},key,b64(CT));
var html=new TextDecoder().decode(plain);document.open();document.write(html);document.close();
}catch(err){e.textContent="Contrase\\u00f1a incorrecta";}}
document.getElementById("b").onclick=go;document.getElementById("p").addEventListener("keydown",function(ev){if(ev.key==="Enter")go();});
</script></body></html>'''

loader = (TPL.replace("__SALT__", base64.b64encode(salt).decode())
             .replace("__IV__", base64.b64encode(iv).decode())
             .replace("__CT__", base64.b64encode(ct).decode()))

deploy = os.path.join(HERE, "deploy")
shutil.rmtree(deploy, ignore_errors=True)
os.makedirs(deploy)
open(os.path.join(deploy, "index.html"), "w", encoding="utf-8").write(loader)
shutil.copytree(os.path.join(HERE, "ocr"), os.path.join(deploy, "ocr"))
print("OK -> deploy/  (index.html cifrado + ocr/)  ·  contraseña usada:", PASSWORD)
