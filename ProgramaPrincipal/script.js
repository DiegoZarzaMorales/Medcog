/* ProgramaPrincipal/script.js — Código completo y optimizado
   - Cuentas locales (localStorage) con hashing PBKDF2
   - Guardado de historiales por cuenta
   - Recomendaciones con comprobación de alergias (bloquea agregar)
   - Export PDF receta (html2canvas + jsPDF) usando colores MEDCOG y logo ../Imagenes/medcog_logo.png
   - Botón "Analizador (Estudiante)" abre ../Analizador/analyzer.html en nueva pestaña
*/

const MEDCOG_BLUE = '#1F5C9A';
const MEDCOG_IVO = '#F8F5ED';
const DISCLAIMER_RED = '#b00000';

const medicineDatabase = [
  { id:'paracetamol', chemical:'p-acetaminofenol', commercial:['Paracetamol','Acetaminofen'], use:'Analgésico y antipirético', indications:'Dolor leve a moderado, fiebre', dose_adult:{per_dose_min_mg:500,per_dose_max_mg:1000,freq_hours:[4,6],max_daily_mg:4000}, mg_per_kg:{min:10,max:15}, contraindications:['insuficiencia hepática','alergia a paracetamol'] },
  { id:'aspirina', chemical:'ácido acetilsalicílico', commercial:['Aspirina'], use:'AINE', indications:'Dolor, inflamación', dose_adult:{per_dose_min_mg:500,per_dose_max_mg:1000,freq_hours:[4,6],max_daily_mg:4000}, mg_per_kg:null, contraindications:['no usar en menores de 16 años','alergia a aines'] },
  { id:'ibuprofeno', chemical:'ácido isobutilfenil', commercial:['Ibuprofeno'], use:'AINE', indications:'Dolor, inflamación', dose_adult:{per_dose_min_mg:200,per_dose_max_mg:400,freq_hours:[4,6],max_daily_mg:2400}, mg_per_kg:{min:5,max:10}, contraindications:['ulcera peptica','alergia a aines'] },
  { id:'omeprazol', chemical:'omeprazol', commercial:['Omeprazol'], use:'IBP', indications:'Úlceras, reflujo', dose_adult:{per_dose_min_mg:20,per_dose_max_mg:40,freq_hours:[24],max_daily_mg:40}, mg_per_kg:null, contraindications:[] },
  { id:'amoxicilina', chemical:'amoxicilina', commercial:['Amoxicilina'], use:'Antibiótico', indications:'Infecciones bacterianas', dose_adult:{per_dose_min_mg:500,per_dose_max_mg:875,freq_hours:[8],max_daily_mg:3000}, mg_per_kg:{min:20,max:40}, contraindications:['alergia a penicilinas'] },
  { id:'cetirizina', chemical:'cetirizina', commercial:['Cetirizina'], use:'Antihistamínico H1', indications:'Alergias, rinitis', dose_adult:{per_dose_min_mg:10,per_dose_max_mg:10,freq_hours:[24],max_daily_mg:10}, mg_per_kg:null, contraindications:[] }
];

function normalize(text=''){ return (text||'').toString().trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function escapeHtml(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const ACCOUNTS_KEY = 'med_translator_accounts_v1';
async function deriveBits(password, saltBase){
  const enc = new TextEncoder();
  const keyMat = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return await crypto.subtle.deriveBits({name:'PBKDF2', salt:enc.encode(saltBase), iterations:200000, hash:'SHA-256'}, keyMat, 256);
}
function bufToBase64(buf){ return btoa(String.fromCharCode.apply(null,new Uint8Array(buf))); }
async function hashPassword(password, salt){ const bits = await deriveBits(password, salt); return bufToBase64(bits); }
function loadAccounts(){ try{ return JSON.parse(localStorage.getItem(ACCOUNTS_KEY))||[] }catch(e){return[]} }
function saveAccounts(a){ localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(a)); }
function findAccount(u){ return loadAccounts().find(x=>x.username===u); }
async function createAccount(u,p){ if(!u||!p) throw new Error('Usuario y contraseña requeridos.'); if(findAccount(u)) throw new Error('Cuenta ya existe.'); const salt = Math.random().toString(36).slice(2)+Date.now().toString(36); const pwdHash = await hashPassword(p,salt); const acct={username:u,salt,pwdHash,histories:[]}; const a=loadAccounts(); a.unshift(acct); saveAccounts(a); return acct; }
async function verifyAccount(u,p){ const acct=findAccount(u); if(!acct) throw new Error('Cuenta no encontrada.'); const attempted = await hashPassword(p,acct.salt); if(attempted!==acct.pwdHash) throw new Error('Contraseña incorrecta.'); return acct; }
function getAccountHistories(u){ const acct=findAccount(u); return acct?acct.histories||[]:[]; }
function saveAccountHistories(u,h){ const a=loadAccounts(); const i=a.findIndex(x=>x.username===u); if(i===-1) return false; a[i].histories=h; saveAccounts(a); return true; }
function addHistoryForUser(u,entry){ const h=getAccountHistories(u); h.unshift(entry); saveAccountHistories(u,h); }

function getSessionSelectedMeds(){ try{ const raw = sessionStorage.getItem('med_translator_selected_meds'); if(!raw) return []; return JSON.parse(raw);}catch(e){ return []; } }
function addSessionSelectedMed(medId){ const arr = getSessionSelectedMeds(); if(!arr.includes(medId)) arr.push(medId); sessionStorage.setItem('med_translator_selected_meds', JSON.stringify(arr)); }
function clearSessionSelectedMeds(){ sessionStorage.removeItem('med_translator_selected_meds'); }

function patientHasAllergyForMed(patientAllergies, med){
  if(!Array.isArray(patientAllergies)) return false;
  const normalizedAll = patientAllergies.map(a => normalize(a));
  if(normalizedAll.includes('none') && normalizedAll.length === 1) return false;
  const medCandidates = [ med.id, med.chemical, ...(med.commercial||[]) ].map(normalize);
  const medContra = (med.contraindications||[]).map(normalize);
  for(const a of normalizedAll){
    if(!a) continue;
    if(medCandidates.some(c => c.includes(a))) return true;
    if(medContra.some(ci => ci.includes(a))) return true;
    if(a.length >= 3 && medCandidates.some(c => c.includes(a))) return true;
  }
  return false;
}

document.addEventListener('DOMContentLoaded', () => {
  // DOM refs
  const steps = Array.from(document.querySelectorAll('.step'));
  const authMsg = document.getElementById('authMsg');
  const authUsername = document.getElementById('auth_username');
  const authPassword = document.getElementById('auth_password');
  const btnRegister = document.getElementById('btnRegister');
  const btnLogin = document.getElementById('btnLogin');
  const startBtn = document.getElementById('toResults');
  const prevTo1 = document.getElementById('prevTo1');
  const prevTo2 = document.getElementById('prevTo2');
  const p_name = document.getElementById('p_name');
  const p_age = document.getElementById('p_age');
  const p_sex = document.getElementById('p_sex');
  const p_height = document.getElementById('p_height');
  const p_weight = document.getElementById('p_weight');
  const p_condition = document.getElementById('p_condition');
  const resultsDiv = document.getElementById('results');
  const savePatientBtn = document.getElementById('savePatient');
  const exportPdfBtn = document.getElementById('exportHistoryPdf');
  const historyPanel = document.getElementById('historyPanel');
  const analyzerBtn = document.getElementById('analizadorBtn');

  function currentUser(){ return sessionStorage.getItem('med_translator_current_user') || null; }
  function setCurrentUser(u){ if(u) sessionStorage.setItem('med_translator_current_user', u); else sessionStorage.removeItem('med_translator_current_user'); updateSessionInfo(); }

  function updateSessionInfo(){
    const u=currentUser();
    const el = document.getElementById('sessionInfo');
    if(el) el.textContent = u ? `Conectado: ${u}` : 'Sin sesión — crea o inicia sesión en el paso 1';
    toggleAppControls(!!u,false);
    renderHistoryForCurrentUser();
  }

  function toggleAppControls(isLoggedIn, patientActive){
    const canUse = !!isLoggedIn;
    document.getElementById('toResults').disabled = !canUse;
    document.getElementById('savePatient').disabled = !canUse;
    document.getElementById('exportHistoryPdf').disabled = !canUse;
  }

  function showStep(n){
    steps.forEach(s=>s.classList.toggle('active', Number(s.dataset.step)===n));
    document.getElementById('page-1').hidden = n!==1;
    document.getElementById('page-2').hidden = n!==2;
    document.getElementById('page-3').hidden = n!==3;
    setTimeout(()=> {
      if(n===1) authUsername.focus();
      if(n===2) p_name.focus();
      if(n===3) resultsDiv.focus();
    }, 120);
  }

  // Auth
  btnRegister?.addEventListener('click', async () => {
    authMsg.textContent = '';
    const u = authUsername.value.trim(); const p = authPassword.value;
    if(!u||!p){ authMsg.textContent='Usuario y contraseña requeridos.'; return; }
    try{ await createAccount(u,p); setCurrentUser(u); authMsg.textContent='Cuenta creada e iniciada.'; authUsername.value=''; authPassword.value=''; showStep(2); }catch(e){ authMsg.textContent = e.message || String(e); }
  });
  btnLogin?.addEventListener('click', async () => {
    authMsg.textContent = '';
    const u = authUsername.value.trim(); const p = authPassword.value;
    if(!u||!p){ authMsg.textContent='Usuario y contraseña requeridos.'; return; }
    try{ await verifyAccount(u,p); setCurrentUser(u); authMsg.textContent='Sesión iniciada.'; authUsername.value=''; authPassword.value=''; showStep(2); }catch(e){ authMsg.textContent = e.message || String(e); }
  });

  prevTo1?.addEventListener('click', ()=> showStep(1));
  prevTo2?.addEventListener('click', ()=> showStep(2));

  startBtn?.addEventListener('click', () => {
    const user=currentUser(); if(!user){ alert('Debes iniciar sesión primero.'); showStep(1); return; }
    const patient = readPatientFromForm(); const errors = validatePatient(patient);
    if(errors.length){ alert('Corrige: ' + errors.join(' - ')); return; }
    sessionStorage.setItem('med_translator_current_patient', JSON.stringify(patient));
    clearSessionSelectedMeds();
    showRecommendationsForPatient(patient); showStep(3);
  });

  function readPatientFromForm(){
    const name = p_name.value.trim(); const age = Number(p_age.value); const sex = p_sex.value;
    const height = Number(p_height.value); const weight = Number(p_weight.value);
    const condition = p_condition.value;
    const otherAllergies = Array.from(document.querySelectorAll('input[name="allergy"]:checked')).map(x=>x.value);
    return { name, age, sex, height, weight, condition, allergies: otherAllergies };
  }
  function validatePatient(p){
    const errors=[];
    if(!(p.age>0 && p.age<120)) errors.push('Edad válida');
    if(!(p.weight>0 && p.weight<300)) errors.push('Peso válido');
    if(!(p.height>0 && p.height<300)) errors.push('Estatura válida');
    if(!p.condition) errors.push('Seleccione condición');
    return errors;
  }

  // Recommendations
  function showRecommendationsForPatient(patient){
    const cond = normalize(patient.condition||'');
    const mapping = { 'cold':['paracetamol'], 'sore-throat':['paracetamol','azitromicina'], 'uti':['amoxicilina'], 'hypertension':['losartan'], 'diabetes':['metformina'], 'allergy':['cetirizina'], 'pain':['ibuprofeno','paracetamol'] };
    const ids = mapping[cond] || [];
    const meds = medicineDatabase.filter(m => ids.includes(m.id));
    if(!meds.length){ resultsDiv.innerHTML = `<p class="muted">No hay recomendaciones automáticas para esta condición.</p>`; return; }
    const patientAll = (patient.allergies||[]).map(a=>normalize(a));
    const html = meds.map(m=>{
      const conflict = patientHasAllergyForMed(patientAll, m);
      const dose = calculateDose(m, patient);
      const dosisText = dose?.per_dose_mg ?? (m.dose_adult ? `${m.dose_adult.per_dose_min_mg} - ${m.dose_adult.per_dose_max_mg} mg` : 'Según indicación');
      const freqText = dose?.frecuencia ?? (m.dose_adult ? (m.dose_adult.freq_hours.join('-') + ' h') : 'Según indicación');
      return `<div class="med-card">
        <h3>${escapeHtml(m.commercial[0])} <small class="muted">(${escapeHtml(m.chemical)})</small></h3>
        <div>${escapeHtml(m.use)} • ${escapeHtml(m.indications)}</div>
        <div><strong>Dosis aproximada:</strong> ${escapeHtml(dosisText)} • ${escapeHtml(freqText)}</div>
        ${conflict ? `<div class="disclaimer" style="background:#fff2f2;border-color:#ffb8b8;color:${DISCLAIMER_RED};">ADVERTENCIA: alergia relacionada. NO administre sin consultar al médico.</div>` : `<div style="height:12px"></div>`}
        <div style="margin-top:8px;display:flex;gap:8px;">
          <button class="large listenBtn" data-text="${encodeURIComponent(m.commercial[0] + '. ' + m.use + '. Dosis: ' + dosisText)}">🔊 Escuchar</button>
          <button class="large addBtn" data-id="${m.id}" ${conflict ? 'disabled' : ''}>Agregar a selección</button>
        </div>
      </div>`;
    }).join('');
    resultsDiv.innerHTML = html;
    Array.from(resultsDiv.querySelectorAll('.listenBtn')).forEach(b => b.addEventListener('click', ()=> speakText(decodeURIComponent(b.dataset.text))));
    Array.from(resultsDiv.querySelectorAll('.addBtn')).forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.id; const patient = JSON.parse(sessionStorage.getItem('med_translator_current_patient')||'{}');
      if(patientHasAllergyForMed((patient.allergies||[]).map(a=>normalize(a)), medicineDatabase.find(x=>x.id===id))){ alert('No se puede agregar: alergia detectada.'); return; }
      addSessionSelectedMed(id);
      const user = currentUser(); if(user){ addHistoryForUser(user,{patient,recommended:id,timestamp:Date.now()}); renderHistoryForCurrentUser(); }
      alert('Medicamento agregado a la selección.');
    }));
  }

  function speakText(text){ try{ const s=new SpeechSynthesisUtterance(text); s.rate=0.95; window.speechSynthesis.cancel(); window.speechSynthesis.speak(s);}catch(e){/* ignore */} }

  function calculateDose(med, patient){
    if(!med) return null;
    if(med.mg_per_kg && patient.weight){
      const min = Math.round(med.mg_per_kg.min * patient.weight), max = Math.round(med.mg_per_kg.max * patient.weight);
      const adult_min = med.dose_adult?.per_dose_min_mg ?? null, adult_max = med.dose_adult?.per_dose_max_mg ?? null;
      const perMin = adult_min ? Math.max(min, adult_min) : min;
      const perMax = adult_max ? Math.min(max, adult_max) : max;
      return { per_dose_mg: `${perMin} - ${perMax} mg`, frecuencia: med.dose_adult ? `Cada ${med.dose_adult.freq_hours.join('-')} horas` : 'Según indicación' };
    } else if(med.dose_adult){
      return { per_dose_mg: `${med.dose_adult.per_dose_min_mg} - ${med.dose_adult.per_dose_max_mg} mg`, frecuencia: med.dose_adult.freq_hours.length===1 ? `Cada ${med.dose_adult.freq_hours[0]} horas` : `Cada ${med.dose_adult.freq_hours[0]}-${med.dose_adult.freq_hours[1]} horas` };
    }
    return null;
  }

  function renderHistoryForCurrentUser(){ const user=currentUser(); if(!historyPanel) return; if(!user){ historyPanel.innerHTML='<p class="muted">Inicia sesión para ver historial.</p>'; return; } const list=getAccountHistories(user); if(!list||!list.length){ historyPanel.innerHTML='<p class="muted">No hay historial.</p>'; return; } historyPanel.innerHTML = list.map(h=>`<div class="history-row"><div><strong>${escapeHtml(h.patient?.name||'(Sin nombre)')}</strong> — ${h.patient?.age||'-'} años</div><div class="muted">${new Date(h.timestamp).toLocaleString()}</div></div>`).join(''); }

  // Export PDF (complete & robust)
  exportPdfBtn?.addEventListener('click', async () => {
    const user = currentUser(); if(!user){ alert('Inicia sesión para exportar'); return; }
    const patient = JSON.parse(sessionStorage.getItem('med_translator_current_patient') || 'null'); if(!patient){ alert('Completa la ficha antes de exportar'); return; }
    const selected = getSessionSelectedMeds();

    const printDiv = document.createElement('div');
    printDiv.style.width = '1000px'; printDiv.style.padding='28px'; printDiv.style.background=MEDCOG_IVO;
    printDiv.style.fontFamily='Arial, Helvetica, sans-serif'; printDiv.style.boxSizing='border-box'; printDiv.style.color='#111';

    printDiv.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="display:flex;gap:12px;align-items:center;">
          <img src="../Imagenes/medcog_logo.png" alt="MEDCOG" style="width:90px;height:auto;object-fit:contain;background:${MEDCOG_IVO};padding:6px;border-radius:6px;" />
          <div>
            <div style="font-weight:800;color:${MEDCOG_BLUE};font-size:20px;">MEDCOG</div>
            <div style="font-size:13px;color:#444;">Decisiones médicas inteligentes</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:700;font-size:16px;color:${MEDCOG_BLUE};">Receta Médica</div>
          <div style="font-size:12px;color:#666;margin-top:6px;">Cuenta: ${escapeHtml(user)}</div>
          <div style="font-size:12px;color:#666;">Generado: ${new Date().toLocaleString()}</div>
        </div>
      </div><hr style="border:none;border-top:2px solid rgba(31,92,154,0.12);margin:10px 0 18px;" />
    `;

    printDiv.innerHTML += `
      <div style="display:flex;gap:18px;margin-bottom:12px;">
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:700;margin-bottom:6px;">Paciente</div>
          <div style="font-size:13px;color:#222;">
            <div><strong>Nombre:</strong> ${escapeHtml(patient.name||'(Sin nombre)')}</div>
            <div><strong>Edad:</strong> ${escapeHtml(String(patient.age||'-'))} años</div>
            <div><strong>Sexo:</strong> ${escapeHtml(patient.sex||'-')}</div>
          </div>
        </div>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:700;margin-bottom:6px;">Medidas</div>
          <div style="font-size:13px;color:#222;">
            <div><strong>Estatura:</strong> ${escapeHtml(String(patient.height||'-'))} cm</div>
            <div><strong>Peso:</strong> ${escapeHtml(String(patient.weight||'-'))} kg</div>
            <div><strong>Condición:</strong> ${escapeHtml(patient.condition||'-')}</div>
          </div>
        </div>
      </div>
    `;

    printDiv.innerHTML += `<div style="margin-top:6px;font-weight:700;margin-bottom:8px;">Prescripción</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:12px;">
        <thead><tr>
          <th style="text-align:left;padding:8px;border-bottom:2px solid rgba(31,92,154,0.12);width:40px">#</th>
          <th style="text-align:left;padding:8px;border-bottom:2px solid rgba(31,92,154,0.12);">Medicamento</th>
          <th style="text-align:left;padding:8px;border-bottom:2px solid rgba(31,92,154,0.12);width:140px">Dosis</th>
          <th style="text-align:left;padding:8px;border-bottom:2px solid rgba(31,92,154,0.12);width:140px">Frecuencia</th>
          <th style="text-align:left;padding:8px;border-bottom:2px solid rgba(31,92,154,0.12);width:120px">Duración</th>
        </tr></thead><tbody>`;

    if(selected && selected.length){
      selected.forEach((mid, idx) => {
        const med = medicineDatabase.find(m => m.id === mid);
        if(!med) return;
        const dose = calculateDose(med, patient);
        const dosisText = dose?.per_dose_mg ?? (med.dose_adult ? `${med.dose_adult.per_dose_min_mg} - ${med.dose_adult.per_dose_max_mg} mg` : 'Según indicación');
        const frecuencia = dose?.frecuencia ?? (med.dose_adult ? (med.dose_adult.freq_hours.join('-') + ' h') : 'Según indicación');
        printDiv.innerHTML += `<tr style="background:${idx%2===0?'#fbfffe':'#ffffff'}">
          <td style="padding:10px;vertical-align:top;">${idx+1}</td>
          <td style="padding:10px;vertical-align:top;"><strong>${escapeHtml(med.commercial[0])}</strong><div style="color:#666;font-size:12px;">(${escapeHtml(med.chemical)})</div></td>
          <td style="padding:10px;vertical-align:top;">${escapeHtml(dosisText)}</td>
          <td style="padding:10px;vertical-align:top;">${escapeHtml(frecuencia)}</td>
          <td style="padding:10px;vertical-align:top;">Según indicación</td>
        </tr>`;
      });
    } else {
      printDiv.innerHTML += `<tr><td colspan="5" style="pad

ding:12px;color:#666;">No hay medicamentos seleccionados.</td></tr>`;
    }

    printDiv.innerHTML += `</tbody></table>`;

    printDiv.innerHTML += `
      <div style="margin-top:18px;display:flex;justify-content:space-between;align-items:center;">
        <div style="width:65%;"></div>
        <div style="text-align:center;">
          <div style="height:60px;border-bottom:1px solid #000;width:280px;margin-bottom:6px;"></div>
          <div style="font-size:13px;">Firma y sello del médico</div>
        </div>
      </div>
    `;

    printDiv.innerHTML += `<div style="margin-top:18px;padding:14px;border-radius:8px;background:#fff0f0;border:2px solid #ffb6b6;color:${DISCLAIMER_RED};font-weight:700;">
      <div style="font-size:14px;">DISCLAIMER: Esta receta es orientativa y educativa. NO sustituye la evaluación médica. Antes de tomar cualquier medicamento, consulte con un profesional de la salud. En caso de urgencia, contacte servicios médicos.</div>
    </div>`;

    printDiv.innerHTML += `<div style="margin-top:12px;font-size:11px;color:#666;text-align:right;">“Tecnología al servicio de tu bienestar.” — MEDCOG</div>`;

    printDiv.style.position='absolute'; printDiv.style.left='-9999px';
    document.body.appendChild(printDiv);
    try{
      await new Promise(r=>setTimeout(r,140));
      const canvas = await html2canvas(printDiv, { scale:2, useCORS:true, backgroundColor: MEDCOG_IVO });
      const jspdfGlobal = window.jspdf || window.jsPDF || (window.jspdf && window.jspdf.jsPDF) || null;
      const jsPDFClass = (jspdfGlobal && (jspdfGlobal.jsPDF || jspdfGlobal)) || window.jsPDF || null;
      if(!jsPDFClass) throw new Error('jsPDF no disponible');
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = (typeof window.jspdf === 'object' && window.jspdf.jsPDF) ? window.jspdf : { jsPDF: jsPDFClass };
      const pdf = new jsPDF({ orientation:'portrait', unit:'pt', format:'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight; let position = 0;
      pdf.addImage(imgData,'PNG',0,position,imgWidth,imgHeight);
      heightLeft -= pdfHeight;
      while(heightLeft > -1){
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData,'PNG',0,position,imgWidth,imgHeight);
        heightLeft -= pdfHeight;
      }
      const pageCount = pdf.internal.getNumberOfPages();
      pdf.setFontSize(10); pdf.setTextColor(120);
      for(let i=1;i<=pageCount;i++){ pdf.setPage(i); pdf.text(`Página ${i} / ${pageCount}`, pdf.internal.pageSize.getWidth() - 80, pdf.internal.pageSize.getHeight() - 10); }
      const safeUser = (user||'user').replace(/[^a-z0-9_\-@\.]/gi,'_');
      pdf.save(`${safeUser}_receta_medica.pdf`);
    }catch(err){ console.error('Error generando PDF',err); alert('Error generando PDF: '+(err.message||err)); } finally { if(printDiv && printDiv.parentNode) printDiv.parentNode.removeChild(printDiv); }
  });

  // Analyzer button: try open standalone analyzer file in ../Analizador/analyzer.html
  analyzerBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    try{
      const w = window.open('../Analizador/analyzer.html', '_blank');
      if(!w) alert('Popup bloqueado: permite abrir nuevas pestañas o abre Analizador/analyzer.html manualmente.');
    }catch(err){
      alert('No se pudo abrir la herramienta de análisis: abre ../Analizador/analyzer.html manualmente.');
    }
  });

  // init UI
  showStep(1);
  updateSessionInfo();
  renderHistoryForCurrentUser();
});