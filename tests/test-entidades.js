"use strict";
const fs=require("fs");
const HTML=require("path").join(__dirname,"..","index.html");
const MOD=null;

// extraer engineSrc del index.html
const html=fs.readFileSync(HTML,"utf8");
const a=html.indexOf('<script type="text/plain" id="engineSrc">');
const start=html.indexOf(">",a)+1;
const end=html.indexOf("</script>",start);
const engineSrc=html.slice(start,end);
const mod="";

const RET="\nreturn {deaccent:deaccent,DET:DET,resolve:resolve,detectCompanies:detectCompanies,sigTokensOf:sigTokensOf,coreKey:coreKey,isPublicBody:isPublicBody,analyzeEntities:analyzeEntities,applyEntities:applyEntities,anonymize:anonymize};";
const hasMod=engineSrc.includes("CAPA DE ENTIDADES CORPORATIVAS");
const E=(new Function(engineSrc+(hasMod?"":("\n"+mod))+RET))();

let pass=0, fail=0; const fails=[];
function ok(name,cond,extra){ if(cond){pass++; /*console.log("  ✓",name);*/} else {fail++; fails.push(name+(extra?"  -> "+extra:""));} }
function setOf(arr){const s={has:x=>arr.indexOf(x)>=0}; return s;}

// ---------- 1) sufijos ----------
(function(){
  const t="Tecnología Alfa, S.L. firma con Beta Retail S.A., Gamma Trade Ltd., Delta GmbH, Epsilon Labs LLC y Zeta Inc.";
  const c=E.detectCompanies(t).map(x=>x.text);
  const has=re=>c.some(x=>re.test(x));
  ok("1.sufijo S.L.", has(/Alfa.*S\.?L/i), JSON.stringify(c));
  ok("1.sufijo S.A.", has(/Beta Retail\s+S\.?A/i));
  ok("1.sufijo Ltd", has(/Gamma.*Ltd/i));
  ok("1.sufijo GmbH", has(/Delta\s+GmbH/i));
  ok("1.sufijo LLC", has(/Epsilon.*LLC/i));
  ok("1.sufijo Inc", has(/Zeta\s+Inc/i));
})();

// ---------- 2) sin sufijo, parte del contrato ----------
(function(){
  const t="Beta Retail, como cliente, y Alfa, en calidad de proveedor, acuerdan lo siguiente.";
  const c=E.detectCompanies(t);
  const beta=c.find(x=>/Beta Retail/.test(x.text));
  const alfa=c.find(x=>/^Alfa$/.test(x.text.trim()));
  ok("2.detecta Beta Retail sin sufijo", !!beta, JSON.stringify(c.map(x=>x.text)));
  ok("2.rol cliente en Beta", beta&&beta.role==="CLIENTE", beta&&beta.role);
  ok("2.detecta Alfa sin sufijo", !!alfa);
  ok("2.rol proveedor en Alfa", alfa&&alfa.role==="PROVEEDOR", alfa&&alfa.role);
})();

// ---------- 3) variantes agrupadas ----------
(function(){
  const t="Tecnología Alfa, S.L. (en adelante «Grupo Alfa» o Alfa Technologies), con web www.alfa.com, presta servicios.";
  const r=E.analyzeEntities(t,{mode:"estricto",labelStyle:"neutra"});
  const alfa=r.entities.filter(e=>e.coreKey==="alfa");
  ok("3.una sola entidad alfa", alfa.length===1, "entities="+JSON.stringify(r.entities.map(e=>e.coreKey)));
  ok("3.variantes incluyen Grupo Alfa", alfa[0]&&alfa[0].variants.concat(alfa[0].canonical).some(v=>/Grupo Alfa/.test(v)));
  ok("3.variantes incluyen Alfa Technologies", alfa[0]&&alfa[0].variants.concat(alfa[0].canonical).some(v=>/Alfa Technologies/.test(v)));
})();

// ---------- 4) misma etiqueta en varios docs ----------
(function(){
  const reg={};
  const d1=E.analyzeEntities("Tecnología Alfa, S.L. y Beta Retail, S.A. firman.",{mode:"estricto",labelStyle:"neutra",docId:"d1"},reg);
  const d2=E.analyzeEntities("Contrato posterior con Grupo Alfa.",{mode:"estricto",labelStyle:"neutra",docId:"d2"},reg);
  const la1=(d1.entities.find(e=>e.coreKey==="alfa")||{}).label;
  const la2=(d2.entities.find(e=>e.coreKey==="alfa")||{}).label;
  ok("4.misma etiqueta alfa entre docs", la1&&la1===la2, la1+" vs "+la2);
})();

// ---------- 4b) lote: doc posterior detecta mención DESNUDA por el registro ----------
(function(){
  const reg={};
  E.analyzeEntities("Tecnología Alfa, S.L., como proveedor, y Beta Retail, S.A., como cliente.",{mode:"contractual",labelStyle:"auto",docId:"d1"},reg);
  const d2=E.analyzeEntities("En el anexo, Grupo Alfa y Beta Retail confirman lo pactado.",{mode:"contractual",labelStyle:"auto",docId:"d2"},reg);
  const beta=d2.entities.find(e=>/beta/.test(e.coreKey));
  const alfa=d2.entities.find(e=>e.coreKey==="alfa");
  ok("4b.doc2 detecta Beta Retail desnuda (por registro global)", !!beta, JSON.stringify(d2.entities.map(e=>e.coreKey)));
  ok("4b.doc2 Beta conserva etiqueta CLIENTE", beta&&/^\[CLIENTE_\d+\]$/.test(beta.label), beta&&beta.label);
  ok("4b.doc2 Alfa conserva etiqueta PROVEEDOR", alfa&&/^\[PROVEEDOR_\d+\]$/.test(alfa.label), alfa&&alfa.label);
})();

// ---------- 5) etiquetas por rol ----------
(function(){
  const t="Tecnología Alfa, S.L., como proveedor, y Beta Retail, S.A., como cliente, acuerdan.";
  const r=E.analyzeEntities(t,{mode:"contractual",labelStyle:"auto"});
  const alfa=r.entities.find(e=>e.coreKey==="alfa");
  const beta=r.entities.find(e=>/beta/.test(e.coreKey));
  ok("5.Alfa como PROVEEDOR", alfa&&/^\[PROVEEDOR_\d+\]$/.test(alfa.label), alfa&&alfa.label);
  ok("5.Beta como CLIENTE", beta&&/^\[CLIENTE_\d+\]$/.test(beta.label), beta&&beta.label);
})();

// ---------- 6) CIF ligado ----------
(function(){
  const t="Tecnología Alfa, S.L., con CIF B12345678, domiciliada en Madrid.";
  const r=E.analyzeEntities(t,{mode:"estricto",labelStyle:"neutra"});
  const alfa=r.entities.find(e=>e.coreKey==="alfa");
  const cif=alfa&&alfa.connected.find(c=>c.type==="CIF");
  ok("6.CIF ligado a la empresa", !!cif, alfa&&JSON.stringify(alfa.connected));
  ok("6.label CIF_EMPRESA", cif&&/^\[CIF_EMPRESA_\d+\]$/.test(cif.label), cif&&cif.label);
})();

// ---------- 7) email + dominio corporativos ----------
(function(){
  const t="Tecnología Alfa, S.L. — contacto info@alfa.com y web www.alfa.com.";
  const r=E.analyzeEntities(t,{mode:"estricto",labelStyle:"neutra"});
  const alfa=r.entities.find(e=>e.coreKey==="alfa");
  const em=alfa&&alfa.connected.find(c=>c.type==="EMAIL");
  const dm=alfa&&alfa.connected.find(c=>c.type==="DOMINIO");
  ok("7.email corporativo ligado", em&&/^\[EMAIL_EMPRESA_\d+\]$/.test(em.label), alfa&&JSON.stringify(alfa.connected));
  ok("7.dominio ligado", dm&&/^\[DOMINIO_EMPRESA_\d+\]$/.test(dm.label));
})();

// ---------- 8) no genéricos ----------
(function(){
  const t="La empresa y el proveedor firman un contrato de servicio con otro grupo.";
  const r=E.analyzeEntities(t,{mode:"estricto",labelStyle:"neutra"});
  ok("8.sin entidades genéricas", r.entities.length===0, "entities="+JSON.stringify(r.entities.map(e=>e.canonical)));
})();

// ---------- 9) organismos públicos ----------
(function(){
  const t="El Colegio de Abogados de Madrid, S.L. asesora a Tecnología Alfa, S.L.";
  const r1=E.analyzeEntities(t,{mode:"contractual",labelStyle:"neutra"});
  const r2=E.analyzeEntities(t,{mode:"estricto",labelStyle:"neutra",includeInstitutions:true});
  ok("9.isPublicBody detecta AEPD", E.isPublicBody("Agencia Española de Protección de Datos"));
  ok("9.isPublicBody detecta Registro Mercantil", E.isPublicBody("Registro Mercantil de Madrid"));
  ok("9.no anonimiza organismo por defecto", !r1.entities.some(e=>/colegio/.test(e.coreKey)), JSON.stringify(r1.entities.map(e=>e.coreKey)));
  ok("9.sí incluye Alfa siempre", r1.entities.some(e=>e.coreKey==="alfa"));
  ok("9.con includeInstitutions sí lo incluye", r2.entities.some(e=>/colegio|abogados/.test(e.coreKey)), JSON.stringify(r2.entities.map(e=>e.coreKey)));
})();

// ---------- 10) fusionar variantes ----------
(function(){
  const t="Alfa, S.L. colabora con Omega, S.L. en el proyecto.";
  const base=E.analyzeEntities(t,{mode:"estricto",labelStyle:"neutra"});
  ok("10.pre-merge son 2 entidades", base.entities.length===2, JSON.stringify(base.entities.map(e=>e.coreKey)));
  const merged=E.analyzeEntities(t,{mode:"estricto",labelStyle:"neutra",mergeMap:{"omega":"alfa"}});
  ok("10.post-merge 1 entidad", merged.entities.length===1, JSON.stringify(merged.entities.map(e=>e.coreKey)));
  const labels=merged.entities[0];
  ok("10.fusion cubre ambas menciones", labels&&labels.mentions.length===2);
})();

// ---------- 11) excluir entidad ----------
(function(){
  const t="Alfa, S.L. y Beta, S.L. firman.";
  const r=E.analyzeEntities(t,{mode:"estricto",labelStyle:"neutra",excludeKeys:setOf(["beta"])});
  const out=E.applyEntities(t,r.regions).outText;
  ok("11.excluida no está en entidades", !r.entities.some(e=>e.coreKey==="beta"), JSON.stringify(r.entities.map(e=>e.coreKey)));
  ok("11.Beta queda intacta en el texto", /Beta, S\.L\./.test(out), out);
  ok("11.Alfa sí anonimizada", !/Alfa, S\.L\./.test(out)&&/\[EMPRESA_\d+\]/.test(out), out);
})();

// ---------- 12) exporta doc anonimizado ----------
(function(){
  const t="Tecnología Alfa, S.L., con CIF B12345678, y web www.alfa.com.";
  const r=E.analyzeEntities(t,{mode:"estricto",labelStyle:"neutra"});
  const out=E.applyEntities(t,r.regions).outText;
  ok("12.output tiene etiquetas", /\[EMPRESA_\d+\]/.test(out), out);
  ok("12.output sin nombre original", !/Tecnología Alfa/.test(out), out);
})();

// ---------- 13) mapping privado separado ----------
(function(){
  const t="Tecnología Alfa, S.L. presta servicios a Beta Retail, S.A.";
  const r=E.analyzeEntities(t,{mode:"estricto",labelStyle:"neutra"});
  const m=r.mapping[0];
  ok("13.mapping no vacío", r.mapping.length>=2);
  ok("13.mapping tiene campos", m&&m.original_name&&m.anonymized_label&&m.entity_type&&m.confidence_level, JSON.stringify(m));
})();

// ---------- 14) versión externa sin mapping ----------
(function(){
  const t="Tecnología Alfa, S.L. con CIF B12345678.";
  const r=E.analyzeEntities(t,{mode:"estricto",labelStyle:"neutra"});
  const externo=E.applyEntities(t,r.regions).outText;
  ok("14.externo no filtra nombre", !/Tecnología Alfa/.test(externo));
  ok("14.externo no filtra CIF", !/B12345678/.test(externo), externo);
  ok("14.mapping es estructura aparte", Array.isArray(r.mapping)&&!/B12345678/.test(externo));
})();

// ---------- extra: no rompe personas/DNI ----------
(function(){
  const t="D. Juan Pérez García, con DNI 12345678Z, trabaja en Tecnología Alfa, S.L.";
  const spans=[]; E.DET.PERSONA(t,spans); E.DET.DNI(t,spans);
  ok("X.persona sigue detectándose", spans.some(s=>s.type==="PERSONA"), JSON.stringify(spans));
  ok("X.DNI sigue detectándose", spans.some(s=>s.type==="DNI"));
})();

// ---------- 15) las EMPRESAS respetan el modo (seudónimo / redactar / eliminar) ----------
(function(){
  const t="Tecnología Alfa, S.L. colabora con Grupo Alfa en el proyecto.";
  const r=E.analyzeEntities(t,{mode:"contractual",labelStyle:"auto"});
  const ps=E.anonymize(t,r.regions,"pseudo").outText;
  const rd=E.anonymize(t,r.regions,"redact").outText;
  const dl=E.anonymize(t,r.regions,"delete").outText;
  ok("15.pseudo: nombre falso de empresa (no etiqueta ni original)", !/\[EMPRESA|\[PROVEEDOR/.test(ps)&&!/Tecnología Alfa/.test(ps)&&/S\.L\./.test(ps), ps);
  const fakes=ps.match(/[^\s,]+ [^\s,]+ S\.L\./g)||[]; const uniq=[...new Set(fakes)];
  ok("15.pseudo consistente (misma empresa=mismo falso)", fakes.length>=2&&uniq.length===1, JSON.stringify(fakes));
  ok("15.redact: cajas negras, sin etiqueta/original", /█/.test(rd)&&!/\[EMPRESA/.test(rd)&&!/Tecnología Alfa/.test(rd), rd);
  ok("15.delete: empresa eliminada del texto", !/Alfa/.test(dl), dl);
})();

console.log("\n=== RESULTADO: "+pass+" PASS / "+fail+" FAIL ===");
if(fails.length){console.log("FALLOS:");fails.forEach(f=>console.log("  ✗ "+f));process.exit(1);}
