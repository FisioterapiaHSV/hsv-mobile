// plan.js -- handles the Add Plan subview behaviors: date/time, tipo toggle, bullets, save & sign (PIN)
(function(){
  // Use PINs from constants.js
  const DEFAULT_PIN = '1234'; // testing default (fallback)
  
  // Build RESPONSABLE_PINS from APP_PERSONAL if available
  let RESPONSABLE_PINS = {};
  if (window.APP_PERSONAL && window.APP_PERSONAL.responsables) {
    window.APP_PERSONAL.responsables.forEach(person => {
      RESPONSABLE_PINS[person.nombre] = person.pin;
    });
    // Also add practicantes
    if (window.APP_PERSONAL.practicantes) {
      window.APP_PERSONAL.practicantes.forEach(person => {
        RESPONSABLE_PINS[person.nombre] = person.pin;
      });
    }
  } else {
    // Fallback if constants not loaded
    RESPONSABLE_PINS = {
      'Tavata Alexa Basurto Ramírez': '123456',
      'Gloria Iraís Espinosa Peralta': '234567',
      'Jorge Eduardo Rodríguez Romero': '567890',
      'Gabriel Rodríguez Hernández': '345678',
      'Andrea Ofelia Carrillo Valdés': '456789',
      'Leslie Amellali Santillán García': '111111',
      'Estefanía Zanabria': '222222',
      'Francisco Nava Chávez': '333333'
    };
  }
  
  // expose the mapping to global scope so other modules (valoracion, addnote) can reuse the same PINs
  try{ window.RESPONSABLE_PINS = RESPONSABLE_PINS; window.DEFAULT_PIN = DEFAULT_PIN; }catch(e){}
  const viewId = 'view_addplan';
  const formSelectors = {
    fecha: '#plan_fecha',
    horaStart: '#plan_hora_start',
    horaEnd: '#plan_hora_end',
    horaRealStart: '#plan_hora_real_start',
    horaRealEnd: '#plan_hora_real_end',
    responsable: '#plan_responsable',
    apoyo: '#plan_apoyo',
    tipo: '#plan_tipo',
    cronicoBlock: '#cronico',
    agudoBlock: '#agudo',
    status: '#plan_status',
    msg: '#plan_msg'
  };

  function $(s){ return document.querySelector(s); }

  // Get current patient ID from sessionStorage (set when switching users), fallback to userName or default
  function getPatientId(){ 
    const stored = sessionStorage.getItem('usuaria_actual');
    if(stored) return stored;
    const el = document.getElementById('userName'); 
    return el && el.textContent.trim() ? el.textContent.trim() : 'patient_default'; 
  }

  // Populate date to today and scheduled time options (30-min intervals)
  function initDateAndSchedule(){
    const fecha = $(formSelectors.fecha);
    const horaStart = $(formSelectors.horaStart);
    const horaEnd = $(formSelectors.horaEnd);
    if(fecha){
      const today = new Date();
      const iso = today.toISOString().slice(0,10);
      fecha.value = iso;
    }

    if(horaStart && horaEnd){
      // Slots from 07:00 to 20:30 inclusive in 30-min steps
      const startMins = 7 * 60;
      const endMins = 20 * 60 + 30;
      horaStart.innerHTML = '';
      horaEnd.innerHTML = '';
      for(let m = startMins; m <= endMins; m += 30){
        const hh = String(Math.floor(m/60)).padStart(2,'0');
        const mm = String(m % 60).padStart(2,'0');
        const label = `${hh}:${mm}`;
        const opt1 = document.createElement('option'); opt1.value = label; opt1.textContent = label;
        const opt2 = document.createElement('option'); opt2.value = label; opt2.textContent = label;
        horaStart.appendChild(opt1);
        horaEnd.appendChild(opt2);
      }

      // default select to nearest slot to current time for start
      const now = new Date(); const minutes = now.getMinutes(); const rounded = minutes < 30 ? 0 : 30;
      const val = String(now.getHours()).padStart(2,'0') + ':' + String(rounded).padStart(2,'0');
      const found = Array.from(horaStart.options).find(o=>o.value===val);
      if(found) horaStart.value = val; else horaStart.selectedIndex = 0;

      // default end = start + 30 min (cap to last option)
      function addMinutes(timeStr, minsToAdd){
        const [hh, mm] = timeStr.split(':').map(Number);
        const total = hh*60 + mm + minsToAdd;
        const h2 = Math.floor(total/60); const m2 = total%60;
        return `${String(h2).padStart(2,'0')}:${String(m2).padStart(2,'0')}`;
      }
      const candidate = addMinutes(horaStart.value, 30);
      const lastVal = horaEnd.options[horaEnd.options.length-1].value;
      horaEnd.value = candidate <= lastVal ? candidate : lastVal;

      // when user changes start, auto-adjust end to +30 (but allow manual override afterwards)
      horaStart.addEventListener('change', ()=>{
        const cand = addMinutes(horaStart.value, 30);
        horaEnd.value = cand <= lastVal ? cand : lastVal;
      });
    }
    // helper: format date in Spanish long form
    const formatDateLongES = window.formatDateLongES;

    // set readable label for fecha
    if(fecha){
      const label = document.getElementById('plan_fecha_label');
      const updateLabel = ()=>{ if(label) label.textContent = formatDateLongES(fecha.value); };
      updateLabel();
      fecha.addEventListener('change', updateLabel);
    }
  }

  // Toggle cronico/agudo blocks
  function initTipoToggle(){
    const tipo = document.getElementById('plan_tipo');
    const cron = document.getElementById('cronico');
    const agu = document.getElementById('agudo');
    
    if(!tipo || !cron || !agu) {
      console.warn('initTipoToggle: No se encontraron los elementos necesarios', {tipo: !!tipo, cron: !!cron, agu: !!agu});
      return;
    }
    
    function apply(){
      const tipoVal = tipo.value;
      console.log('🔄 Toggle tipo:', tipoVal);
      if(tipoVal === 'Crónico' || tipoVal === 'cronico'){
        cron.style.display='block'; 
        agu.style.display='none';
      } else if(tipoVal === 'Agudo' || tipoVal === 'agudo'){
        cron.style.display='none'; 
        agu.style.display='block';
      }
    }
    
    // Remove existing change listener if any (prevents duplicates)
    tipo.removeEventListener('change', apply);
    // Add new listener
    tipo.addEventListener('change', apply);
    // Apply initial state
    apply();
  }

  // Bullet insertion helpers
  function insertAtCaret(el, text){
    const start = el.selectionStart; const end = el.selectionEnd; const v = el.value;
    el.value = v.slice(0,start) + text + v.slice(end);
    el.selectionStart = el.selectionEnd = start + text.length;
  }

  function enableAutoBullets(){
    const areas = document.querySelectorAll('#' + viewId + ' .plan-bullet, #' + viewId + ' .auto-bullet');
    areas.forEach(a=>{
      // on focus: if empty, add bullet
      a.addEventListener('focus', ()=>{ if(a.value.trim()==='') { a.value = '• '; } });
      a.addEventListener('keydown', (ev)=>{
        if(ev.key === 'Enter'){
          ev.preventDefault();
          // insert newline + bullet at caret
          insertAtCaret(a, '\n• ');
        }
      });
    });
  }

  // Collect form data (simple object)
  function collectPlan(){
    return {
      // local id will be assigned when saving into storage
      id: currentPlan && currentPlan.id ? currentPlan.id : null,
      paciente: getPatientId(),
      fecha: $(formSelectors.fecha)?.value || '',
      motivo: document.getElementById('plan_motivo')?.value || '',
      hora_programada_start: $(formSelectors.horaStart)?.value || '',
      hora_programada_end: $(formSelectors.horaEnd)?.value || '',
      hora_real_start: $(formSelectors.horaRealStart)?.value || '',
      hora_real_end: $(formSelectors.horaRealEnd)?.value || '',
      habitacion: document.getElementById('plan_habitacion')?.value || '',
      responsable_idx: $(formSelectors.responsable)?.selectedIndex || 0,
      responsable_text: $(formSelectors.responsable)?.selectedOptions[0]?.textContent || '',
      responsable_prefix: $(formSelectors.responsable)?.selectedOptions[0]?.dataset?.prefix || '',
      apoyo_idx: $(formSelectors.apoyo)?.selectedIndex || 0,
      apoyo_text: $(formSelectors.apoyo)?.selectedOptions[0]?.textContent || '',
      apoyo_prefix: $(formSelectors.apoyo)?.selectedOptions[0]?.dataset?.prefix || '',
      tipo: $(formSelectors.tipo)?.value || 'Crónico',
      obj_general: document.getElementById('plan_obj_gen')?.value || '',
      plan_general: document.getElementById('plan_plan_gen')?.value || '',
      plan_general_short: (document.getElementById('plan_plan_gen')?.value || '').slice(0,120),
      corto: document.getElementById('plan_corto')?.value || '',
      mediano: document.getElementById('plan_mediano')?.value || '',
      largo: document.getElementById('plan_largo')?.value || '',
      cif_deficiencias: obtenerDeficiencias(),
      cif_lim: document.getElementById('cif_limitacion')?.value || '',
      cif_res: document.getElementById('cif_restriccion')?.value || '',
      status: document.getElementById('plan_status')?.textContent.replace('Estado:','').trim() || 'Borrador'
    };
  }

  // Save draft (local-only persistence to localStorage)
  let currentPlan = null; let isLocked = false;

  // Plans persistence using DB if available, fallback to localStorage
  function loadPlans(){ 
    try{ 
      if(window.DB && typeof window.DB.load === 'function') return window.DB.load('planes'); 
      const plans = [];
      const raw = localStorage.getItem('hsv_plans_v1'); 
      if(raw) plans.push(...JSON.parse(raw));
      
      // Cargar planes del JSON (firmados) si localStorage está vacío o incompleto
      const jsonPlans = [];
      if(window.DataController && typeof window.DataController.loadMonthlySyncFromMain === 'function'){
        try{
          const paciente = getPatientId();
          const hoy = new Date();
          const mesActual = String(hoy.getMonth() + 1).padStart(2, '0') + String(hoy.getFullYear());
          const mesPasado = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
          const mesPasadoStr = String(mesPasado.getMonth() + 1).padStart(2, '0') + String(mesPasado.getFullYear());
          
          [mesActual, mesPasadoStr].forEach(mes => {
            const loaded = window.DataController.loadMonthlySyncFromMain('planes', paciente, mes.slice(-4) + '-' + mes.slice(0, 2) + '-01');
            if(Array.isArray(loaded)){
              loaded.forEach(jsonPlan => {
                jsonPlans.push(jsonPlan);
                if(!plans.find(p => p.id === jsonPlan.id)){
                  plans.push(jsonPlan);
                }
              });
            }
          });
        }catch(e){ 
          console.warn('Error cargando planes del JSON:', e); 
        }
      }
      
      // LIMPIEZA: Eliminar planes de localStorage que ya NO existen en JSON y están firmados
      const planesLimpios = plans.filter(plan => {
        if(plan.status === 'Firmado'){
          const existeEnJSON = jsonPlans.find(jp => jp.id === plan.id);
          if(!existeEnJSON){
            console.log('🗑️ Eliminando plan firmado que no existe en JSON:', plan.id);
            return false;
          }
        }
        return true;
      });
      
      // Sincronizar back a localStorage
      try{ localStorage.setItem('hsv_plans_v1', JSON.stringify(planesLimpios || [])); }catch(e){ console.warn('Error sincronizando planes:', e); }
      return planesLimpios;
    }catch(e){ return []; } 
  }
  function savePlans(plans){ try{ if(window.DB && typeof window.DB.save === 'function') return window.DB.save('planes', plans || []); localStorage.setItem('hsv_plans_v1', JSON.stringify(plans || [])); }catch(e){ console.warn('savePlans', e); } }
  function ensureId(){ try{ if(window.DB && typeof window.DB.generateId === 'function') return window.DB.generateId('planes'); }catch(e){} return 'pl_' + Math.random().toString(36).slice(2,9); }

  function saveDraftPlus(plans){ // guardar localmente
    savePlans(plans);
  }
  
  function normalizarPlanPorTipo(p){
    // Crear una copia para no modificar el original en localStorage
    const plan = Object.assign({}, p);
    
    // Siempre eliminar estos campos (nunca deben existir en JSON)
    delete plan.hora_real_start;
    delete plan.hora_real_end;
    delete plan.responsable_idx;
    delete plan.responsable_text;
    delete plan.responsable_prefix;
    delete plan.apoyo_idx;
    delete plan.apoyo_text;
    delete plan.apoyo_prefix;
    delete plan.plan_general_short;
    
    if(plan.tipo === 'Crónico'){
      // En CRÓNICO: eliminar metas corto, mediano, largo
      delete plan.corto;
      delete plan.mediano;
      delete plan.largo;
    } else if(plan.tipo === 'Agudo'){
      // En AGUDO: eliminar objetivo general y plan general
      delete plan.obj_general;
      delete plan.plan_general;
    }
    
    return plan;
  }
  
  function savePlansWithDataController(p){ // guardar localmente y en JSON (cualquier estado)
    const plans = loadPlans();
    const idx = plans.findIndex(x=>x.id===p.id);
    if(idx>=0) plans[idx] = Object.assign({}, plans[idx], p);
    else plans.push(p);
    savePlans(plans);
    
    // Guardar en JSON SIEMPRE (borrador o firmado) - normalizar según tipo
    if(p.paciente && p.fecha && window.DataController){
      try{
        const fecha = p.fecha || new Date().toISOString().slice(0, 10);
        const paciente = p.paciente;
        const planNormalizado = normalizarPlanPorTipo(p);
        // Call saveMonthly without await (fire and forget), but it will still save
        window.DataController.saveMonthly('planes', paciente, fecha, planNormalizado).then(success => {
          if(success) console.log('✅ Plan guardado en JSON:', p.id, 'Status:', p.status, 'Tipo:', p.tipo);
          else console.warn('⚠️ Error guardando plan en JSON');
        }).catch(e => {
          console.error('Error guardando plan en JSON:', e);
        });
      }catch(e){
        console.error('Error guardando plan en JSON:', e);
      }
    }
  }

  function saveDraft(){
    // Verificar si el usuario es de solo lectura (INVITADO)
    if(typeof window.isReadOnlyUser === 'function' && window.isReadOnlyUser()) {
      const msg = $(formSelectors.msg);
      if(msg) msg.textContent = '⛔ No tienes permisos para guardar planes';
      setTimeout(()=>{ if(msg) msg.textContent=''; }, 3000);
      return;
    }
    
    if(isLocked) return; // cannot save
    const p = collectPlan(); p.status = 'Borrador';
    p.updatedAt = new Date().toISOString();
    if(!p.id) p.id = ensureId();
    // upsert into storage
    const plans = loadPlans();
    const idx = plans.findIndex(x=>x.id===p.id);
    try{
      if(window.DB && typeof window.DB.upsert === 'function'){
        if(!p.id) p.id = ensureId(); p.updatedAt = new Date().toISOString(); if(!p.createdAt) p.createdAt = p.updatedAt; window.DB.upsert('planes', p);
      } else {
        if(idx>=0) plans[idx] = Object.assign({}, plans[idx], p); else plans.push(p); savePlans(plans);
      }
    }catch(e){ console.warn('saveDraft DB', e); if(idx>=0) plans[idx] = Object.assign({}, plans[idx], p); else plans.push(p); savePlans(plans); }
    currentPlan = p;
    const msg = $(formSelectors.msg); if(msg) msg.textContent = 'Borrador guardado correctamente';
    const status = $(formSelectors.status); if(status) status.textContent = 'Estado: Borrador';
    renderPlansList();
    setTimeout(()=>{ if(msg) msg.textContent=''; }, 2500);
  }

  // Lock the form (after signing)
  function lockForm(){
    isLocked = true;
    const els = document.querySelectorAll('#' + viewId + ' input, #' + viewId + ' textarea, #' + viewId + ' select, #' + viewId + ' button');
    els.forEach(e=>{
      // keep the back button enabled
      if(e.classList && e.classList.contains('back')) return;
      // keep view navigation buttons disabled except back
      if(e.id === 'btn_sign_plan') e.disabled = true;
      if(e.id === 'btn_save_draft') e.disabled = true;
      if(e.tagName === 'BUTTON' && e.onclick && e.textContent.includes('Cancelar')) return;
      if(e.id === 'btn_sign_plan' || e.id === 'btn_save_draft') return;
      e.disabled = true;
    });
  }

  // Apply prefixes to the selected names when signing
  function prefixedName(selectEl){
    if(!selectEl) return '';
    const opt = selectEl.selectedOptions[0]; if(!opt) return '';
    const prefix = opt.dataset?.prefix || '';
    const name = opt.value || ''; // Usar value en lugar de textContent para evitar duplicar prefijo
    return prefix? `${prefix} ${name}` : name;
  }

  // Sign plan with PIN
  function signPlan(){
    // Verificar si el usuario es de solo lectura (INVITADO)
    if(typeof window.isReadOnlyUser === 'function' && window.isReadOnlyUser()) {
      const msg = $(formSelectors.msg);
      if(msg) msg.textContent = '⛔ No tienes permisos para firmar planes';
      setTimeout(()=>{ if(msg) msg.textContent=''; }, 3000);
      return;
    }
    
    if(isLocked) return;
    // motivo must be filled before signing
    const motivoEl = document.getElementById('plan_motivo');
    const motivoVal = motivoEl?.value.trim();
    const motivoErr = document.getElementById('plan_motivo_error');
    if(!motivoVal){
      // inline validation instead of alert
      if(motivoErr) { motivoErr.textContent = 'El motivo es obligatorio antes de firmar.'; motivoErr.style.display='block'; }
      if(motivoEl) { motivoEl.classList.add('invalid'); motivoEl.focus(); }
      return;
    } else {
      if(motivoErr) { motivoErr.textContent=''; motivoErr.style.display='none'; }
      if(motivoEl) motivoEl.classList.remove('invalid');
    }

    // check whether responsable category requires PIN (only LFT and PSS)
    const resSelect = document.getElementById('plan_responsable');
    const resPrefix = resSelect?.selectedOptions[0]?.dataset?.prefix || '';
    const resName = resSelect?.selectedOptions[0]?.textContent || '';
    // console.log('🔐 signPlan - resPrefix:', resPrefix, 'resName:', resName);
    const proceedWithSign = ()=>{
      // apply prefixes and lock; persist to storage
      const res = document.getElementById('plan_responsable');
      const ap = document.getElementById('plan_apoyo');
      const resPref = prefixedName(res);
      const apPref = prefixedName(ap);
      // store signed values
      let p = collectPlan();
      p.status = 'Firmado';
      p.responsable_signed = resPref;
      p.apoyo_signed = apPref;
      p.signedAt = new Date().toISOString();
      p.updatedAt = p.signedAt;
      if(!p.id) p.id = ensureId();
      // upsert with DataController integration
      savePlansWithDataController(p);
      currentPlan = p;
      const status = $(formSelectors.status); if(status) status.textContent = 'Estado: Firmado';
      const msg = $(formSelectors.msg); if(msg) msg.textContent = 'Plan firmado correctamente';
      lockForm();
  renderPlansList();
  try{ if(typeof window.launchConfetti === 'function'){ window.launchConfetti({count:50}); } else if(typeof window.celebrate === 'function'){ window.celebrate(); } }catch(e){}
  // note: in a real app we'd persist to backend here
      setTimeout(()=>{ if(msg) msg.textContent=''; }, 3000);
    };

    // Solo LFT y PSS pueden firmar planes
    // console.log('🔐 Validando prefijo - resPrefix es:', JSON.stringify(resPrefix));
    if(!resPrefix){
      alert('❌ Debes seleccionar un responsable válido (LFT o PSS) para firmar planes');
      return;
    }
    
    if(resPrefix !== 'LFT' && resPrefix !== 'PSS'){
      alert('Solo los responsables LFT y PSS pueden firmar planes. Los practicantes no tienen permiso de firma.');
      return;
    }

    if(resPrefix === 'LFT' || resPrefix === 'PSS'){
      // expected PIN: from RESPONSABLE_PINS mapping, fallback to DEFAULT_PIN
      const expected = RESPONSABLE_PINS[resName] || DEFAULT_PIN;
      // console.log('🔐 Abriendo modal PIN para:', resName, 'PIN esperado:', expected);
      openPinModal(resName, expected, function(success){ 
        // console.log('🔐 PIN callback result:', success);
        if(success) proceedWithSign(); 
      });
    } else {
      // no PIN required for apoyos (EF)
      // console.log('⚠️ No PIN required - proceeding directly');
      proceedWithSign();
    }
  }

  // Render plans list in view_plan (replaces sample cards)
  const formatDateLongES = window.formatDateLongES;
  function formatTimeShort(iso){ if(!iso) return ''; const d = new Date(iso); if(isNaN(d)) return ''; return d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); }

  function renderPlansList(){
    const container = document.querySelector('#view_plan .plans-container');
    if(!container) return;
    const plans = loadPlans();
    // ensure every plan has an id (fixes older entries without ids so 'Ver' works)
    let fixed = false;
    plans.forEach(p=>{ if(!p.id){ p.id = ensureId(); fixed = true; } });
    if(fixed) savePlans(plans);
    container.innerHTML = '';
    if(plans.length===0){ container.innerHTML = '<div class="section">No hay planes guardados.</div>'; return; }
    plans.sort((a,b)=> (new Date(b.updatedAt||b.signedAt||b.createdAt)) - (new Date(a.updatedAt||a.signedAt||a.createdAt)));
    plans.forEach(p=>{
      const card = document.createElement('div'); card.className='plan-card';
      const head = document.createElement('div'); head.className='plan-head';
      const title = document.createElement('div'); title.className='plan-title';
      const dateStr = formatDateLongES(p.fecha) || formatDateLongES(p.updatedAt||p.createdAt);
      const timeStr = p.signedAt ? formatTimeShort(p.signedAt) : (p.updatedAt ? formatTimeShort(p.updatedAt) : '');
      const titleParts = [dateStr];
      if(timeStr) titleParts.push(timeStr);
      if(p.motivo) titleParts.push(p.motivo);
      title.textContent = titleParts.join(' • ');
      const meta = document.createElement('div'); meta.className='plan-meta';
      
      // Build responsable and apoyo with prefixes
      const respPrefix = p.responsable_prefix || (window.getResponsablePrefix ? window.getResponsablePrefix(p.responsable_signed || p.responsable_text) : '');
      const respText = respPrefix ? `${respPrefix} ${p.responsable_signed||p.responsable_text||''}` : (p.responsable_signed||p.responsable_text||'');
      const apoyoPrefix = p.apoyo_prefix || (window.getApoyoPrefix ? window.getApoyoPrefix(p.apoyo_signed || p.apoyo_text) : '');
      const apoyoText = (p.apoyo_signed||p.apoyo_text) ? (apoyoPrefix ? `${apoyoPrefix} ${p.apoyo_signed||p.apoyo_text}` : (p.apoyo_signed||p.apoyo_text)) : '—';
      
      meta.textContent = `Responsable: ${respText} | Apoyo: ${apoyoText} | Estado: ${p.status||'Borrador'}`;
      head.appendChild(title); head.appendChild(meta);
      card.appendChild(head);
      const ptype = document.createElement('p'); ptype.style.margin='8px 0'; ptype.textContent = `Padecimiento: ${p.tipo || ''}`;
      card.appendChild(ptype);
      const btnRow = document.createElement('div'); btnRow.className='btn-row';
      if(p.status === 'Borrador'){
        const edit = document.createElement('button'); edit.className='btn btn-edit'; edit.textContent='Editar'; edit.addEventListener('click', ()=>{ loadPlanIntoForm(p.id); window.showView('view_addplan'); });
        const sign = document.createElement('button'); sign.className='btn btn-sign'; sign.textContent='Firmar'; sign.addEventListener('click', ()=>{ promptSignPlanById(p.id); });
        const del = document.createElement('button'); del.className='btn btn-del'; del.textContent='Eliminar'; del.addEventListener('click', ()=>{ deletePlanById(p.id); });
        btnRow.appendChild(edit); btnRow.appendChild(sign); btnRow.appendChild(del);
      } else {
        const view = document.createElement('button'); view.className='btn btn-view'; view.textContent='Ver plan de tratamiento'; view.addEventListener('click', ()=>{ openPlanAsSubview(p.id); });
        const pdf = document.createElement('button'); pdf.className='btn btn-secondary'; pdf.style.background='#2c5f2d'; pdf.style.color='white'; pdf.innerHTML='<i class="fa-solid fa-file-pdf" style="margin-right:6px"></i>PDF'; pdf.addEventListener('click', ()=>{ if(typeof exportPlanPDF === 'function') exportPlanPDF(p.id); else alert('Función de exportación no disponible'); });
        btnRow.appendChild(view); 
        btnRow.appendChild(pdf);
      }
      card.appendChild(btnRow);
      container.appendChild(card);
    });
  }

  function deletePlanById(id){
    if(!confirm('Eliminar este plan? Esta acción no se puede deshacer.')) return;
    try{ if(window.DB && typeof window.DB.delete === 'function'){ window.DB.delete('planes', id); } else { const plans = loadPlans().filter(p=>p.id!==id); savePlans(plans); } }catch(e){ const plans = loadPlans().filter(p=>p.id!==id); savePlans(plans); }
    renderPlansList();
  }

  function loadPlanIntoForm(id){
    const plans = loadPlans(); const p = plans.find(x=>x.id===id); if(!p) return;
    currentPlan = p; isLocked = false;
    
    // Unlock all form elements first
    document.querySelectorAll('#' + viewId + ' input, #' + viewId + ' textarea, #' + viewId + ' select, #' + viewId + ' button').forEach(e => {
      e.disabled = false;
    });
    
    // populate fields
    $(formSelectors.fecha).value = p.fecha || '';
    $(formSelectors.horaStart).value = p.hora_programada_start || '';
    $(formSelectors.horaEnd).value = p.hora_programada_end || '';
    $(formSelectors.horaRealStart) && ($(formSelectors.horaRealStart).value = p.hora_real_start || '');
    $(formSelectors.horaRealEnd) && ($(formSelectors.horaRealEnd).value = p.hora_real_end || '');
    // restore habitación
    document.getElementById('plan_habitacion') && (document.getElementById('plan_habitacion').value = p.habitacion || '');
    // set selects by matching textContent where possible
    const res = document.getElementById('plan_responsable'); if(res) setSelectByText(res, p.responsable_text || p.responsable_signed || '');
    const ap = document.getElementById('plan_apoyo'); if(ap) setSelectByText(ap, p.apoyo_text || p.apoyo_signed || '');
    document.getElementById('plan_motivo').value = p.motivo || '';
    document.getElementById('plan_plan_gen') && (document.getElementById('plan_plan_gen').value = p.plan_general || '');
    document.getElementById('plan_obj_gen') && (document.getElementById('plan_obj_gen').value = p.obj_general || '');
    document.getElementById('plan_corto') && (document.getElementById('plan_corto').value = p.corto || '');
    document.getElementById('plan_mediano') && (document.getElementById('plan_mediano').value = p.mediano || '');
    document.getElementById('plan_largo') && (document.getElementById('plan_largo').value = p.largo || '');
    cargarDeficiencias(p.cif_deficiencias || []);
    document.getElementById('cif_limitacion') && (document.getElementById('cif_limitacion').value = p.cif_lim || '');
    document.getElementById('cif_restriccion') && (document.getElementById('cif_restriccion').value = p.cif_res || '');
    // tipo - set value and trigger change to show correct section
    const tipoEl = document.getElementById('plan_tipo'); 
    if(tipoEl) {
      // Normalize old values to new capitalized format
      let tipoVal = p.tipo || 'Crónico';
      if(tipoVal === 'cronico') tipoVal = 'Crónico';
      if(tipoVal === 'agudo') tipoVal = 'Agudo';
      tipoEl.value = tipoVal;
      
      // Trigger visibility toggle immediately
      const cron = document.getElementById('cronico');
      const agu = document.getElementById('agudo');
      if(cron && agu){
        if(tipoVal === 'Crónico'){
          cron.style.display='block'; 
          agu.style.display='none';
        } else {
          cron.style.display='none'; 
          agu.style.display='block';
        }
      }
      
      // Also dispatch event for any other listeners
      tipoEl.dispatchEvent(new Event('change'));
    }
    const status = $(formSelectors.status); if(status) status.textContent = 'Estado: ' + (p.status || 'Borrador');
    // ensure auto-bullets and autosize updated (if present)
    setTimeout(()=>{
      // trigger input events to autosize
      document.querySelectorAll('#' + viewId + ' textarea').forEach(t=>{ t.dispatchEvent(new Event('input')); });
    },80);
  }

  function setSelectByText(selectEl, text){ if(!selectEl) return; for(const opt of selectEl.options){ if(opt.textContent.trim()===text.trim()){ selectEl.value = opt.value; return; } } }

  function promptSignPlanById(id){
    const plans = loadPlans(); const p = plans.find(x=>x.id===id); if(!p) return alert('Plan no encontrado');
    if(!p.motivo || p.motivo.trim()==='') return alert('El motivo es obligatorio antes de firmar. Abra el plan para completar el motivo.');
    // check responsable prefix mapping to require PIN
    const responsibleName = p.responsable_text || '';
    const prefix = (p.responsable_prefix || '').toUpperCase();
    const expected = RESPONSABLE_PINS[responsibleName] || DEFAULT_PIN;
    const cb = function(success){ if(!success) return; // if ok, mark signed
      p.status='Firmado'; p.signedAt = new Date().toISOString(); p.updatedAt = p.signedAt; p.responsable_signed = p.responsable_text; const plansAll = loadPlans(); const ix = plansAll.findIndex(x=>x.id===p.id); if(ix>=0) plansAll[ix]=p; else plansAll.push(p); savePlans(plansAll); renderPlansList(); try{ if(typeof window.launchConfetti === 'function'){ window.launchConfetti({count:50}); } else if(typeof window.celebrate === 'function'){ window.celebrate(); } }catch(e){} 
    };
    if(prefix==='LFT' || prefix==='PSS'){ openPinModal(responsibleName, expected, cb); } else { cb(true); }
  }

  // Read-only modal view
  function openPlanViewModal(id){
    // Deprecated modal method left for backward compatibility; prefer subview now.
    console.warn('openPlanViewModal is deprecated; use openPlanAsSubview instead');
  }

  // Open plan as a full subview (reads data and navigates to `view_plan_view`)
  function openPlanAsSubview(id){
    const plans = loadPlans(); const p = plans.find(x=>x.id===id); if(!p) return alert('Plan no encontrado');
    const container = document.getElementById('pv_container'); const titleDate = document.getElementById('pv_fecha_title');
    if(!container || !titleDate) return;
    const fecha = formatDateLongES(p.fecha) || formatDateLongES(p.updatedAt||p.createdAt);
    const time = p.signedAt ? formatTimeShort(p.signedAt) : (p.updatedAt ? formatTimeShort(p.updatedAt) : '');
    titleDate.textContent = fecha + (time ? (' • ' + time) : '');
    // Build content HTML using same read-only layout as the modal but full-width
    const parts = [];
    
    // Add prefixes to responsable and apoyo
    const respPrefix = p.responsable_prefix || (window.getResponsablePrefix ? window.getResponsablePrefix(p.responsable_signed || p.responsable_text) : '');
    const respText = respPrefix ? `${respPrefix} ${p.responsable_signed||p.responsable_text||''}` : (p.responsable_signed||p.responsable_text||'');
    const apoyoPrefix = p.apoyo_prefix || (window.getApoyoPrefix ? window.getApoyoPrefix(p.apoyo_signed || p.apoyo_text) : '');
    const apoyoText = (p.apoyo_signed||p.apoyo_text) ? (apoyoPrefix ? `${apoyoPrefix} ${p.apoyo_signed||p.apoyo_text}` : (p.apoyo_signed||p.apoyo_text)) : '—';
    
    parts.push(`<div><strong>Responsable:</strong> ${escapeHtml(respText)}</div>`);
    parts.push(`<div style="margin-top:6px"><strong>Apoyo:</strong> ${escapeHtml(apoyoText)}</div>`);
    parts.push(`<div style="margin-top:12px"><strong>Motivo:</strong><div style="white-space:pre-wrap;margin-top:6px">${escapeHtml(p.motivo||'')}</div></div>`);
    parts.push(`<div style="margin-top:12px"><strong>Tipo de padecimiento:</strong> ${escapeHtml(p.tipo||'')}</div>`);
    parts.push(`<div style="margin-top:12px"><strong>Objetivo general:</strong><div style="white-space:pre-wrap;margin-top:6px">${escapeHtml(p.obj_general||'')}</div></div>`);
    parts.push(`<div style="margin-top:12px"><strong>Plan de tratamiento general:</strong><div style="white-space:pre-wrap;margin-top:6px">${escapeHtml(p.plan_general||'')}</div></div>`);
    if(p.tipo === 'Agudo' || p.tipo === 'agudo'){
      parts.push(`<div style="margin-top:12px"><strong>Corto plazo:</strong><div style="white-space:pre-wrap;margin-top:6px">${escapeHtml(p.corto||'')}</div></div>`);
      parts.push(`<div style="margin-top:12px"><strong>Mediano plazo:</strong><div style="white-space:pre-wrap;margin-top:6px">${escapeHtml(p.mediano||'')}</div></div>`);
      parts.push(`<div style="margin-top:12px"><strong>Largo plazo:</strong><div style="white-space:pre-wrap;margin-top:6px">${escapeHtml(p.largo||'')}</div></div>`);
    }
    parts.push(`<div style="margin-top:12px"><strong>Cuadro CIF</strong></div>`);
    
    // Build deficiencias display
    let defHTML = '<div><strong>Deficiencia</strong>';
    if(p.cif_deficiencias && p.cif_deficiencias.length > 0) {
      p.cif_deficiencias.forEach(def => {
        defHTML += `<div style="margin-top:8px;padding:8px;background:#f9f9f9;border-radius:6px">`;
        defHTML += `<div style="font-weight:600;color:#059669;margin-bottom:4px">Estructura: ${escapeHtml(def.estructura||'')}</div>`;
        if(def.funciones && def.funciones.length > 0) {
          defHTML += `<div style="margin-left:12px">`;
          def.funciones.forEach(func => {
            defHTML += `<div style="margin-top:2px">• ${escapeHtml(func)}</div>`;
          });
          defHTML += `</div>`;
        }
        defHTML += `</div>`;
      });
    } else if(p.cif_def) {
      // Fallback for old format
      defHTML += `<div style="white-space:pre-wrap;margin-top:6px">${escapeHtml(p.cif_def)}</div>`;
    }
    defHTML += '</div>';
    
    parts.push(`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:8px">${defHTML}<div><strong>Limitación</strong><div style="white-space:pre-wrap;margin-top:6px">${escapeHtml(p.cif_lim||'')}</div></div><div><strong>Restricción</strong><div style="white-space:pre-wrap;margin-top:6px">${escapeHtml(p.cif_res||'')}</div></div></div>`);
    
    // Add PDF export button at the end
    parts.push(`<div style="margin-top:20px;text-align:center;border-top:1px solid #e0e0e0;padding-top:20px"><button class="btn btn-view" onclick="if(typeof exportPlanPDF === 'function') exportPlanPDF('${escapeHtml(p.id)}'); else alert('Función de exportación no disponible');" style="background:#2c5f2d;color:white;padding:12px 24px;font-size:1rem;"><i class="fa-solid fa-file-pdf" style="margin-right:8px"></i>Descargar PDF</button></div>`);
    
    container.innerHTML = parts.join('');
    // navigate to subview
    window.showView('view_plan_view');
  }

  function escapeHtml(s){ if(!s) return ''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }

  // NOTE: showView override is defined once at the bottom of this module.
  // Older/duplicate override removed to avoid referencing `originalShowView` before it's declared.

  // Wire action buttons
  function initActions(){
    const saveBtn = document.getElementById('btn_save_draft');
    const signBtn = document.getElementById('btn_sign_plan');
    if(saveBtn && !saveBtn.dataset.initialized){
      saveBtn.dataset.initialized = 'true';
      saveBtn.addEventListener('click', saveDraft);
    }
    if(signBtn && !signBtn.dataset.initialized){
      signBtn.dataset.initialized = 'true';
      signBtn.addEventListener('click', signPlan);
    }
    setupPinModal();
  }
  
  function clearPlanForm(){
    currentPlan = null;
    isLocked = false;
    
    const fecha = document.getElementById('plan_fecha');
    const horaStart = document.getElementById('plan_hora_start');
    const horaEnd = document.getElementById('plan_hora_end');
    const tipo = document.getElementById('plan_tipo');
    const responsable = document.getElementById('plan_responsable');
    const apoyo = document.getElementById('plan_apoyo');
    const status = document.getElementById('plan_status');
    const msg = document.getElementById('plan_msg');
    
    if(fecha) fecha.value = new Date().toISOString().split('T')[0];
    if(horaStart) horaStart.selectedIndex = 0;
    if(horaEnd) horaEnd.selectedIndex = 1;
    if(tipo) {
      tipo.selectedIndex = 0; // Default to Crónico
      
      // Apply visibility immediately
      const cron = document.getElementById('cronico');
      const agu = document.getElementById('agudo');
      if(cron && agu){
        cron.style.display='block'; 
        agu.style.display='none';
      }
      
      // Also dispatch event for any listeners
      tipo.dispatchEvent(new Event('change'));
    }
    if(responsable) responsable.selectedIndex = 0;
    if(apoyo) apoyo.selectedIndex = 0;
    if(status) status.textContent = 'Estado: Borrador';
    if(msg) msg.textContent = '';
    
    // Set habitación from USUARIAS list
    const habitacion = document.getElementById('plan_habitacion');
    const paciente_actual = sessionStorage.getItem('paciente_actual');
    if(habitacion && paciente_actual){
      const usuaria = USUARIAS.find(u => u.nombre === paciente_actual);
      if(usuaria && usuaria.habitacion){
        habitacion.value = usuaria.habitacion;
      }
    }
    
    // Set responsable from logged-in user
    if(responsable){
      const responsable_name = sessionStorage.getItem('responsable_name');
      if(responsable_name){
        // Find the option with matching text
        for(const opt of responsable.options){
          if(opt.textContent.trim() === responsable_name.trim()){
            responsable.value = opt.value;
            break;
          }
        }
      }
    }
    
    // Clear all textareas
    document.querySelectorAll('#view_addplan textarea').forEach(t => t.value = '');
    
    // Clear deficiencias and reset to one empty structure
    const container = document.getElementById('cif_deficiencias_container');
    if(container) {
      container.innerHTML = '';
      agregarDeficiencia();
    }
    
    // Re-enable all form elements
    document.querySelectorAll('#view_addplan input, #view_addplan textarea, #view_addplan select, #view_addplan button').forEach(e => e.disabled = false);
  }

  /* PIN modal helpers */
  function setupPinModal(){
    // create references
    const overlay = document.getElementById('pinModalOverlay');
    const input = document.getElementById('pinInput');
    const cancel = document.getElementById('pinCancel');
    const submit = document.getElementById('pinSubmit');
    const error = document.getElementById('pinError');
    if(!overlay || !input || !cancel || !submit) return;
    cancel.addEventListener('click', ()=>{ 
      // Ejecutar ambos callbacks con false (cancelado)
      if(window._plan_pin_cb && typeof window._plan_pin_cb === 'function') window._plan_pin_cb(false);
      if(window._note_pin_cb && typeof window._note_pin_cb === 'function') window._note_pin_cb(false);
      window._plan_pin_cb = null;
      window._note_pin_cb = null;
      closePinModal(); 
    });
    submit.addEventListener('click', ()=>{
      const expectedRaw = overlay.dataset.expected || DEFAULT_PIN;
      const resName = overlay.dataset.resname || '';
      const val = input.value || '';
      // build allowed list: support single PIN, multiple separated by '||', or special token 'ALL'
      let allowed = [];
      try{
        if(expectedRaw === 'ALL'){
          // accept default plus all responsable pins
          allowed = [DEFAULT_PIN].concat(Object.values(RESPONSABLE_PINS || {}));
        } else if(String(expectedRaw).indexOf('||') >= 0){
          allowed = String(expectedRaw).split('||').map(s=>s.trim()).filter(Boolean);
        } else {
          allowed = [String(expectedRaw)];
        }
      }catch(e){ allowed = [String(expectedRaw)]; }

      if(allowed.indexOf(val) !== -1){
        // preserve callback reference, close modal without triggering cancel-callback,
        // then call callback with success
        const planCb = window._plan_pin_cb && typeof window._plan_pin_cb === 'function' ? window._plan_pin_cb : null;
        const noteCb = window._note_pin_cb && typeof window._note_pin_cb === 'function' ? window._note_pin_cb : null;
        // close modal but indicate this is NOT a cancellation
        closePinModal(false);
        if(planCb) planCb(true);
        if(noteCb) noteCb(true);
        window._plan_pin_cb = null;
        window._note_pin_cb = null;
      } else {
        if(error) { error.textContent = 'PIN inválido'; }
        input.classList.add('invalid');
        input.focus();
      }
    });
    // clear error on input
    input.addEventListener('input', ()=>{ input.classList.remove('invalid'); if(error) error.textContent=''; });
  }

  function openPinModal(resName, expectedPin, cb){
    const overlay = document.getElementById('pinModalOverlay');
    const desc = document.getElementById('pinModalDesc');
    const input = document.getElementById('pinInput');
    const error = document.getElementById('pinError');
    if(!overlay) return cb && cb(false);
    overlay.dataset.expected = expectedPin || DEFAULT_PIN;
    overlay.dataset.resname = resName || '';
    overlay.classList.add('active');
    if(desc) desc.textContent = `Firmar como ${resName}. Introduzca PIN del responsable:`;
    if(input){ input.value=''; input.classList.remove('invalid'); setTimeout(()=>input.focus(),60); }
    if(error) error.textContent='';
    // store callback globally temporarily
    window._plan_pin_cb = cb;
  }

  // closePinModal(cancelled = true)
  // If `cancelled` is true (default) the stored callback will be invoked with false.
  // If `cancelled` is false, the function will only close the modal and clear the input
  // allowing the caller (e.g. submit handler) to call the callback with true.
  function closePinModal(cancelled = true){
    const overlay = document.getElementById('pinModalOverlay');
    const input = document.getElementById('pinInput');
    if(!overlay) return;
    overlay.classList.remove('active');
    if(input) input.value='';
    if(cancelled){
      // if a callback exists, call with false (cancelled)
      if(window._plan_pin_cb && typeof window._plan_pin_cb === 'function'){
        window._plan_pin_cb(false);
        window._plan_pin_cb = null;
      }
    }
  }

  // CIF Deficiencias: dynamic structure-function pairs
  function initDeficiencias(){
    const container = document.getElementById('cif_deficiencias_container');
    const btnAdd = document.getElementById('btn_add_deficiencia');
    if(!container || !btnAdd) return;
    
    btnAdd.addEventListener('click', agregarDeficiencia);
    
    // Add initial empty estructura if none exist
    if(container.children.length === 0) agregarDeficiencia();
  }
  
  function agregarDeficiencia(){
    const container = document.getElementById('cif_deficiencias_container');
    if(!container) return;
    
    const estructuraDiv = document.createElement('div');
    estructuraDiv.className = 'cif-estructura-item';
    estructuraDiv.style.cssText = 'border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:12px;background:#f9f9f9';
    estructuraDiv.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <label style="font-weight:600;font-size:0.9rem;margin:0">Estructura:</label>
        <button type="button" class="btn-eliminar-estructura" style="background:#fecaca;color:#991b1b;border:none;border-radius:6px;padding:4px 10px;font-size:0.85rem;cursor:pointer;font-weight:600">✕ Eliminar</button>
      </div>
      <input type="text" class="input estructura-input" placeholder="Ej.: Sistema musculoesquelético" style="width:100%;margin-bottom:12px" />
      <label style="display:block;font-weight:600;font-size:0.9rem;margin-bottom:6px">Funciones afectadas:</label>
      <div class="funciones-container"></div>
      <button type="button" class="btn-add-funcion" style="background:#d1fae5;color:#065f46;border:none;border-radius:6px;padding:6px 12px;font-size:0.85rem;cursor:pointer;width:100%;margin-top:8px;font-weight:600">+ Agregar función</button>
    `;
    
    container.appendChild(estructuraDiv);
    
    // Event listeners
    estructuraDiv.querySelector('.btn-eliminar-estructura').addEventListener('click', ()=> estructuraDiv.remove());
    estructuraDiv.querySelector('.btn-add-funcion').addEventListener('click', ()=> agregarFuncion(estructuraDiv.querySelector('.funciones-container')));
    
    // Add initial empty function
    agregarFuncion(estructuraDiv.querySelector('.funciones-container'));
  }
  
  function agregarFuncion(funcionesContainer){
    if(!funcionesContainer) return;
    
    const funcionDiv = document.createElement('div');
    funcionDiv.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:8px';
    funcionDiv.innerHTML = `
      <input type="text" class="input funcion-input" placeholder="Ej.: Movilidad articular reducida" style="flex:1" />
      <button type="button" class="btn-eliminar-funcion" style="background:#fecaca;color:#991b1b;border:none;border-radius:6px;padding:4px 8px;font-size:0.85rem;cursor:pointer;font-weight:600">✕</button>
    `;
    
    funcionesContainer.appendChild(funcionDiv);
    funcionDiv.querySelector('.btn-eliminar-funcion').addEventListener('click', ()=> funcionDiv.remove());
  }
  
  function obtenerDeficiencias(){
    const container = document.getElementById('cif_deficiencias_container');
    if(!container) return [];
    
    const deficiencias = [];
    container.querySelectorAll('.cif-estructura-item').forEach(estructuraDiv => {
      const estructura = estructuraDiv.querySelector('.estructura-input')?.value.trim() || '';
      const funciones = [];
      estructuraDiv.querySelectorAll('.funcion-input').forEach(input => {
        const val = input.value.trim();
        if(val) funciones.push(val);
      });
      if(estructura || funciones.length > 0) {
        deficiencias.push({ estructura, funciones });
      }
    });
    return deficiencias;
  }
  
  function cargarDeficiencias(deficiencias){
    const container = document.getElementById('cif_deficiencias_container');
    if(!container) return;
    container.innerHTML = '';
    
    if(!deficiencias || deficiencias.length === 0) {
      agregarDeficiencia();
      return;
    }
    
    deficiencias.forEach(def => {
      agregarDeficiencia();
      const estructuraDiv = container.lastElementChild;
      if(!estructuraDiv) return;
      
      const estructuraInput = estructuraDiv.querySelector('.estructura-input');
      if(estructuraInput) estructuraInput.value = def.estructura || '';
      
      const funcionesContainer = estructuraDiv.querySelector('.funciones-container');
      if(funcionesContainer) {
        funcionesContainer.innerHTML = '';
        if(def.funciones && def.funciones.length > 0) {
          def.funciones.forEach(func => {
            agregarFuncion(funcionesContainer);
            const funcionDiv = funcionesContainer.lastElementChild;
            const funcionInput = funcionDiv?.querySelector('.funcion-input');
            if(funcionInput) funcionInput.value = func;
          });
        } else {
          agregarFuncion(funcionesContainer);
        }
      }
    });
  }

  // Initialize everything when the view is shown
  function init(){
    initDateAndSchedule();
    initTipoToggle();
    enableAutoBullets();
    initActions();
    initDeficiencias();
  }
  
  // Migración automática: guardar planes de localStorage a JSON
  function autoMigrateToJSON(){
    try {
      const planes = loadPlans();
      if(!planes || planes.length === 0) return;
      
      const paciente = getPatientId();
      console.log(`🔄 Auto-migrando ${planes.length} planes a JSON...`);
      
      let migrados = 0;
      planes.forEach(plan => {
        if(plan.paciente === paciente && plan.fecha && window.DataController) {
          window.DataController.saveMonthly('planes', plan.paciente, plan.fecha, plan)
            .then(success => {
              if(success) {
                migrados++;
                console.log(`✅ Plan migrado: ${plan.id}`);
              }
            })
            .catch(e => console.warn(`⚠️ Error migrando plan ${plan.id}:`, e));
        }
      });
    } catch(e) {
      console.warn('Error en auto-migración:', e);
    }
  }

  // If using SPA navigation, initialize on load; also init/render when showing the views
  document.addEventListener('DOMContentLoaded', init);
  // single, safe override of window.showView: call original, then run our hooks
  const originalShowView = window.showView;
  if(originalShowView){
    window.showView = function(id){
      originalShowView(id);
      if(id === 'view_addplan') setTimeout(init, 50);
      if(id === 'view_plan') {
        setTimeout(renderPlansList, 60);
        setTimeout(autoMigrateToJSON, 100); // Auto-migrate plans to JSON
      }
    };
  }

  // expose for debugging and external access
  window._planModule = { 
    collectPlan, 
    saveDraft, 
    signPlan,
    deletePlanById,
    renderPlansList,
    loadPlanIntoForm,
    promptSignPlanById,
    clearPlanForm
  };
  
  // TABLET: Exponer funciones de inicialización globalmente
  function initPlanViewWrapper() {
    initDateAndSchedule();
    initTipoToggle();
    enableAutoBullets();
    initDeficiencias();
  }
  
  window.HSV_Plan = {
    init: initPlanViewWrapper,
    initTipoToggle: initTipoToggle,
    initDateAndSchedule: initDateAndSchedule,
    enableAutoBullets: enableAutoBullets,
    initDeficiencias: initDeficiencias
  };
  
  console.log('✓ Módulo plan.js cargado');
})();
