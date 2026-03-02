// js/addnote.js
(function(){
  // Assumptions:
  // - Patient identity is taken from `#userName` textContent when available.
  // - PIN modal exists in DOM (from index.html) and plan.js wired modal buttons to window._plan_pin_cb.
  // - LocalStorage used to store drafts and cooldown timestamps per patient (client-only demo).

  // autosave timers removed
  const DEFAULT_PIN = '1234';
  
  // Build RESPONSABLE_PINS from APP_PERSONAL if available
  let RESPONSABLE_PINS = {};
  if (window.APP_PERSONAL && window.APP_PERSONAL.responsables) {
    window.APP_PERSONAL.responsables.forEach(person => {
      RESPONSABLE_PINS[person.nombre] = person.pin;
    });
  } else {
    // Fallback if constants not loaded
    RESPONSABLE_PINS = {
      'Tavata Alexa Basurto Ramírez': '1234',
      'Gloria Iraís Espinosa Peralta': '2345',
      'Joanna Stefania Martínez García': '3456',
      'Alejandra Reyna Lorenzo Rojo': '4567',
      'Jorge Eduardo Rodríguez Romero': '5678'
    };
  }

  function $(s){ return document.querySelector(s); }

  // simple helper: set select by visible text (selector or element)
  function setSelectByText(selOrEl, text){
    const sel = typeof selOrEl === 'string' ? document.querySelector(selOrEl) : selOrEl;
    if(!sel || !text) return;
    for(const opt of sel.options){ if(opt.textContent.trim()===text.trim()){ sel.value = opt.value; return; } }
  }

  // PIN Modal functions para firmar notas
  // Reutiliza el modal compartido con plan.js usando window._note_pin_cb
  function openPinModalNote(resName, expectedPin, cb){
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
    // store callback globally temporarily (plan.js manejará el submit y ejecutará ambos callbacks)
    window._note_pin_cb = cb;
  }

  function closePinModalNote(cancelled = true){
    const overlay = document.getElementById('pinModalOverlay');
    const input = document.getElementById('pinInput');
    if(!overlay) return;
    overlay.classList.remove('active');
    if(input) input.value='';
    if(cancelled){
      // if a callback exists, call with false (cancelled)
      if(window._note_pin_cb && typeof window._note_pin_cb === 'function'){
        window._note_pin_cb(false);
        window._note_pin_cb = null;
      }
    }
  }

  // Toggle activities helper (used by static sample and dynamic cards)
  window.toggleActivities = function(btn){
    try{
      const card = btn.closest('.note-card'); if(!card) return;
      const list = card.querySelector('.activity-list'); if(!list) return;
      if(list.style.display === 'none' || !list.style.display){ list.style.display = 'block'; btn.textContent = 'Ocultar actividades'; }
      else { list.style.display = 'none'; btn.textContent = 'Ver actividades realizadas'; }
    }catch(e){ console.warn('toggleActivities', e); }
  };

  // get patient id (simple): use #userName text or fallback
  function getPatientId(){
    // Primero intenta sessionStorage (usuaria actual)
    const stored = sessionStorage.getItem('usuaria_actual');
    if(stored) return stored;
    
    // Luego intenta #userName
    const el = document.getElementById('userName');
    if(el && el.textContent.trim()) return el.textContent.trim();
    return 'patient_default';
  }

  // storage keys
  function draftKey(pid){ return `note_draft_${pid}`; }
  

  // countdown display (timers removed)
  let writeTimer = null;
  // ensure listeners are bound only once to prevent duplicate rows
  let listenersBound = false;

  function formatTime(ms){
    const sec = Math.max(0, Math.ceil(ms/1000));
    const m = String(Math.floor(sec/60)).padStart(2,'0');
    const s = String(sec % 60).padStart(2,'0');
    return `${m}:${s}`;
  }
  // Automatic autosave removed: only manual 'Guardar como borrador' persists data.

  // Note: cooldown feature removed — no per-patient blocking.

  // cooldown helpers removed

  // cooldown removed: no runtime toggles

  // schedule options (30-min intervals 07:00-20:00)
  function populateScheduleSelects(){
    const start = 7, end = 20;
    const sStart = $('#note_sched_start'), sEnd = $('#note_sched_end');
    if(!sStart || !sEnd) return;
    sStart.innerHTML=''; sEnd.innerHTML='';
    for(let h=start; h<end; h++){
      ['00','30'].forEach(min=>{
        const hh = String(h).padStart(2,'0');
        const val = `${hh}:${min}`;
        const opt1 = document.createElement('option'); opt1.value = val; opt1.textContent = val; sStart.appendChild(opt1);
        const opt2 = document.createElement('option'); opt2.value = val; opt2.textContent = val; sEnd.appendChild(opt2);
      });
    }
  }

  // dynamic section toggles
  function applyNoteType(){
    const t = $('#note_tipo')?.value || 'seguimiento';
    const types = ['seguimiento','negacion','cancelacion_justificada','notificacion','cumplimiento'];
    // Map internal type names to section IDs for display
    const typeToSectionId = {
      'seguimiento': 'sec_seguimiento',
      'negacion': 'sec_negacion',
      'cancelacion_justificada': 'sec_cancelacion',
      'notificacion': 'sec_notificacion',
      'cumplimiento': 'sec_cumplimiento'
    };
    types.forEach(type=>{
      const sectionId = typeToSectionId[type];
      const s = document.getElementById(sectionId);
      if(s) s.style.display = (type===t)? 'block':'none';
    });
    
    // Controlar visibilidad de horarios según tipo
    const schedSection = document.getElementById('horarios_programados_section');
    const realSection = document.getElementById('horarios_reales_section');
    
    if (schedSection) {
      // MOSTRAR horarios programados en: seguimiento, negacion, cancelacion
      if (['seguimiento', 'negacion', 'cancelacion_justificada'].includes(t)) {
        schedSection.style.display = 'block';
      } else {
        schedSection.style.display = 'none';
      }
    }
    
    if (realSection) {
      // MOSTRAR horarios reales SOLO en: seguimiento
      if (t === 'seguimiento') {
        realSection.style.display = 'block';
      } else {
        realSection.style.display = 'none';
      }
    }
  }

  // simple list helpers
  function addListItem(listId, text){ const ul = $(listId); if(!ul) return; const li = document.createElement('li'); li.textContent = text; ul.appendChild(li); }

  // disable editing but allow signing (during cooldown)
  function setLocked(lock){
    const formEls = document.querySelectorAll('#view_addnote input, #view_addnote textarea, #view_addnote select, #view_addnote button');
    formEls.forEach(el=>{
      // keep back button enabled
      if(el.classList && el.classList.contains('back')) return;
      // allow sign button even when locked (so user can sign during cooldown)
      if(el.id === 'btn_sign_note') { el.disabled = false; return; }
      // allow cancel/navigation
      if(el.onclick && el.textContent && el.textContent.trim().toLowerCase().includes('cancelar')) return;
      // buttons used to add exercises/agents/circuits disabled when locked
      if(lock) el.disabled = true; else el.disabled = false;
    });
  }

  // collect note data
  function collectNote(){
    return {
      id: currentDraft?.id || undefined,
      paciente: getPatientId(),
      fecha: $('#note_fecha')?.value || '',
      hora: $('#note_hora')?.value || '',
      responsable: $('#note_responsable')?.value || '',
      responsable_prefix: $('#note_responsable')?.selectedOptions[0]?.dataset?.prefix || '',
      apoyo: $('#note_apoyo')?.value || '',
      apoyo_prefix: $('#note_apoyo')?.selectedOptions[0]?.dataset?.prefix || '',
      tipo: $('#note_tipo')?.value || 'seguimiento',
      sched_start: $('#note_sched_start')?.value || '',
      sched_end: $('#note_sched_end')?.value || '',
      real_start: $('#note_real_start')?.value || '',
      real_end: $('#note_real_end')?.value || '',
      vitals_ok: $('#vitals_ok')?.checked || false,
      v_ta: $('#v_ta')?.value || '', v_spo2: $('#v_spo2')?.value || '', v_fc: $('#v_fc')?.value || '',
      presentation: $('#note_presentation')?.value || '',
      subjective: $('#note_subjective')?.value || '',
      objective: $('#note_objective')?.value || '',
      analysis: $('#note_analysis')?.value || '',
      plan_obs: $('#note_plan_obs')?.value || '',
      exercises: Array.from($('#list_exercises')?.children||[]).map(li=>({
        name: li.querySelector('.ex-name')?.value || '',
        sets: li.querySelector('.ex-sets')?.value || '',
        reps: li.querySelector('.ex-reps')?.value || '',
        type: li.querySelector('.ex-type')?.value || '',
        rest: li.querySelector('.ex-rest')?.value || '',
        equip: li.querySelector('.ex-equip')?.value || ''
      })),
      agents: Array.from($('#list_agents')?.children||[]).map(li=>({
        agent: li.querySelector('.ag-type')?.value || '',
        duration: li.querySelector('.ag-dur')?.value || '',
        modality: li.querySelector('.ag-mod')?.value || ''
      })),
      circuits: Array.from($('#list_circuits')?.children||[]).map(li=>({
        activity: li.querySelector('.ci-activity')?.value || '',
        duration: li.querySelector('.ci-dur')?.value || '',
        rounds: li.querySelector('.ci-rounds')?.value || ''
      })),
      neg_reason: $('#neg_reason')?.value || '',
      cj_vitals: $('#cj_vitals')?.checked || false,
      cj_medical: $('#cj_medical')?.checked || false,
      cj_house: $('#cj_house')?.checked || false,
  cj_who: $('#cj_who')?.value || '',
  cj_time: $('#cj_time')?.value || '',
  cj_ta: $('#cj_ta')?.value || '',
  cj_spo2: $('#cj_spo2')?.value || '',
  cj_fc: $('#cj_fc')?.value || '',
      not_detail: $('#not_detail')?.value || '',
      cumplimiento_plan: $('#cum_plan_select')?.value || '',
      cumplimiento_obs: $('#cum_obs')?.value || '',
      status: $('#note_status')?.textContent || 'Borrador'
    };
  }

  /**
   * Sanitiza y valida una nota según su tipo
   * Elimina campos prohibidos y ordena los campos permitidos
   * Reglas maestras de validación por tipo
   */
  function sanitizeNoteByType(note) {
    const tipo = note.tipo || 'seguimiento';
    
    // Orden maestro de campos
    const fieldOrder = [
      'paciente', 'fecha', 'hora', 'responsable', 'responsable_prefix', 'apoyo', 'apoyo_prefix',
      'tipo', 'sched_start', 'sched_end', 'real_start', 'real_end',
      'vitals_ok', 'v_ta', 'v_spo2', 'v_fc',
      'presentation', 'subjective', 'objective', 'analysis', 'plan_obs',
      'exercises', 'agents', 'circuits',
      'neg_reason',
      'cj_vitals', 'cj_medical', 'cj_house', 'cj_who', 'cj_time', 'cj_ta', 'cj_spo2', 'cj_fc',
      'not_detail', 'cumplimiento_plan', 'cumplimiento_obs',
      'status', 'id', 'updatedAt', 'createdAt', 'signedAt'
    ];
    
    let fieldsToInclude = {};
    
    if (tipo === 'negacion') {
      // NEGACIÓN: solo estos campos
      fieldsToInclude = {
        paciente: note.paciente,
        fecha: note.fecha,
        hora: note.hora,
        responsable: note.responsable,
        responsable_prefix: note.responsable_prefix,
        apoyo: note.apoyo,
        apoyo_prefix: note.apoyo_prefix,
        tipo: note.tipo,
        sched_start: note.sched_start || '',
        sched_end: note.sched_end || '',
        neg_reason: note.neg_reason || '',
        status: note.status,
        id: note.id,
        updatedAt: note.updatedAt,
        createdAt: note.createdAt,
        signedAt: note.signedAt
      };
    } else if (tipo === 'seguimiento') {
      // SEGUIMIENTO: horarios reales Y SOAP
      fieldsToInclude = {
        paciente: note.paciente,
        fecha: note.fecha,
        hora: note.hora,
        responsable: note.responsable,
        responsable_prefix: note.responsable_prefix,
        apoyo: note.apoyo,
        apoyo_prefix: note.apoyo_prefix,
        tipo: note.tipo,
        sched_start: note.sched_start || '',
        sched_end: note.sched_end || '',
        real_start: note.real_start || '',
        real_end: note.real_end || '',
        vitals_ok: typeof note.vitals_ok === 'boolean' ? note.vitals_ok : true,
        presentation: note.presentation || '',
        subjective: note.subjective || '',
        objective: note.objective || '',
        analysis: note.analysis || '',
        plan_obs: note.plan_obs || '',
        exercises: Array.isArray(note.exercises) ? note.exercises : [],
        agents: Array.isArray(note.agents) ? note.agents : [],
        circuits: Array.isArray(note.circuits) ? note.circuits : [],
        status: note.status,
        id: note.id,
        updatedAt: note.updatedAt,
        createdAt: note.createdAt,
        signedAt: note.signedAt
      };
      // Agregar vitales SOLO si vitals_ok es false
      if (note.vitals_ok === false) {
        fieldsToInclude.v_ta = note.v_ta || '';
        fieldsToInclude.v_spo2 = note.v_spo2 || '';
        fieldsToInclude.v_fc = note.v_fc || '';
      }
    } else if (tipo === 'cumplimiento') {
      // CUMPLIMIENTO: sin horarios
      fieldsToInclude = {
        paciente: note.paciente,
        fecha: note.fecha,
        hora: note.hora,
        responsable: note.responsable,
        responsable_prefix: note.responsable_prefix,
        apoyo: note.apoyo,
        apoyo_prefix: note.apoyo_prefix,
        tipo: note.tipo,
        cumplimiento_plan: note.cumplimiento_plan || '',
        cumplimiento_obs: note.cumplimiento_obs || '',
        status: note.status,
        id: note.id,
        updatedAt: note.updatedAt,
        createdAt: note.createdAt,
        signedAt: note.signedAt
      };
      // Agregar campos cj_* SOLO si fue seleccionado vitals en el formulario
      if (note.cj_vitals === true) {
        fieldsToInclude.cj_who = note.cj_who || '';
        fieldsToInclude.cj_time = note.cj_time || '';
        fieldsToInclude.cj_ta = note.cj_ta || '';
        fieldsToInclude.cj_spo2 = note.cj_spo2 || '';
        fieldsToInclude.cj_fc = note.cj_fc || '';
      }
    } else if (tipo === 'cancelacion_justificada') {
      // CANCELACIÓN JUSTIFICADA: con sched_start/end y cj_*
      fieldsToInclude = {
        paciente: note.paciente,
        fecha: note.fecha,
        hora: note.hora,
        responsable: note.responsable,
        responsable_prefix: note.responsable_prefix,
        apoyo: note.apoyo,
        apoyo_prefix: note.apoyo_prefix,
        tipo: note.tipo,
        sched_start: note.sched_start || '',
        sched_end: note.sched_end || '',
        cj_vitals: note.cj_vitals === true,
        cj_medical: note.cj_medical === true,
        cj_house: note.cj_house === true,
        cj_who: note.cj_who || '',
        cj_time: note.cj_time || '',
        cj_ta: note.cj_ta || '',
        cj_spo2: note.cj_spo2 || '',
        cj_fc: note.cj_fc || '',
        not_detail: note.not_detail || '',
        status: note.status,
        id: note.id,
        updatedAt: note.updatedAt,
        createdAt: note.createdAt,
        signedAt: note.signedAt
      };
    } else if (tipo === 'notificacion') {
      // NOTIFICACIÓN: SOLO not_detail
      fieldsToInclude = {
        paciente: note.paciente,
        fecha: note.fecha,
        hora: note.hora,
        responsable: note.responsable,
        responsable_prefix: note.responsable_prefix,
        apoyo: note.apoyo,
        apoyo_prefix: note.apoyo_prefix,
        tipo: note.tipo,
        not_detail: note.not_detail || '',
        status: note.status,
        id: note.id,
        updatedAt: note.updatedAt,
        createdAt: note.createdAt,
        signedAt: note.signedAt
      };
    }

    // Limpiar arrays vacíos
    if (fieldsToInclude.exercises && Array.isArray(fieldsToInclude.exercises)) {
      fieldsToInclude.exercises = fieldsToInclude.exercises.filter(e => e && (e.name || e.sets || e.reps));
    }
    if (fieldsToInclude.agents && Array.isArray(fieldsToInclude.agents)) {
      fieldsToInclude.agents = fieldsToInclude.agents.filter(a => a && (a.agent || a.duration || a.modality));
    }
    if (fieldsToInclude.circuits && Array.isArray(fieldsToInclude.circuits)) {
      fieldsToInclude.circuits = fieldsToInclude.circuits.filter(c => c && (c.activity || c.duration || c.rounds));
    }

    // Reorganizar según orden maestro
    const sanitized = {};
    fieldOrder.forEach(field => {
      if (field in fieldsToInclude) {
        sanitized[field] = fieldsToInclude[field];
      }
    });

    return sanitized;
  }

  // Notes persistence: use DB (simulated JSON files) when available, fallback to localStorage
  // Load notas: primero de localStorage (borradores), luego del JSON (firmadas)
  function loadNotes(){ 
    try{ 
      // Intentar cargar de DB primero
      if(window.DB && typeof window.DB.load === 'function') {
        return window.DB.load('notas'); 
      }
      
      // Fallback a localStorage
      const notes = [];
      const raw = localStorage.getItem('hsv_notes_v1');
      if(raw) notes.push(...JSON.parse(raw));
      
      // Cargar también notas firmadas del JSON (para no perder datos)
      // Esto asegura que incluso si se pierde localStorage, las notas firmadas están disponibles
      const jsonNotes = [];
      if(window.DataController && typeof window.DataController.loadMonthlySyncFromMain === 'function'){
        try{
          const paciente = getPatientId();
          const hoy = new Date();
          const mesActual = String(hoy.getMonth() + 1).padStart(2, '0') + String(hoy.getFullYear());
          const mesPasado = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
          const mesPasadoStr = String(mesPasado.getMonth() + 1).padStart(2, '0') + String(mesPasado.getFullYear());
          
          // Cargar notas del mes actual y mes pasado
          [mesActual, mesPasadoStr].forEach(mes => {
            const loadedNotes = window.DataController.loadMonthlySyncFromMain('notas', paciente, mes.slice(-4) + '-' + mes.slice(0, 2) + '-01');
            if(Array.isArray(loadedNotes)){
              loadedNotes.forEach(jsonNote => {
                jsonNotes.push(jsonNote);
                // Solo agregar si no existe ya en notes (evitar duplicados)
                if(!notes.find(n => n.id === jsonNote.id)){
                  notes.push(jsonNote);
                }
              });
            }
          });
        }catch(e){ 
          console.warn('Error cargando notas del JSON:', e); 
        }
      }
      
      // LIMPIEZA: Eliminar notas de localStorage que ya NO existen en JSON y están firmadas
      // Esto respeta cambios manuales en el JSON (si borras del JSON, se elimina de la app)
      const notasLimpias = notes.filter(nota => {
        // Si la nota está firmada, debe existir en JSON
        if(nota.status === 'Firmada'){
          const existeEnJSON = jsonNotes.find(jn => jn.id === nota.id);
          if(!existeEnJSON){
            console.log('🗑️ Eliminando nota firmada que no existe en JSON:', nota.id);
            return false; // Eliminar de localStorage
          }
        }
        return true; // Mantener
      });
      
      // Sincronizar back a localStorage para que los formularios funcionen
      // Esto es crítico para recuperación de datos si localStorage se borra
      syncNotesToLocalStorage(notasLimpias);
      
      // Sincronizar asistencia desde notas firmadas
      // Esto asegura que todas las notas firmadas tengan su entrada en asistencia
      syncAsistenciaFromNotes(notasLimpias);
      
      return notasLimpias;
    } catch(e){ return []; } 
  }
  
  // Sincronizar notas a localStorage (especialmente importante para notas recuperadas del JSON)
  function syncNotesToLocalStorage(notes){
    try{
      localStorage.setItem('hsv_notes_v1', JSON.stringify(notes || []));
    }catch(e){
      console.warn('Error sincronizando notas a localStorage:', e);
    }
  }
  
  // Sincronizar asistencia desde todas las notas firmadas
  function syncAsistenciaFromNotes(notes){
    try{
      if(!Array.isArray(notes)) return;
      notes.forEach(note => {
        // Solo procesar notas firmadas que tengan tipo de asistencia
        if(note.status === 'Firmada' && note.tipo && ['seguimiento', 'negacion', 'cancelacion_justificada', 'cumplimiento', 'notificacion'].includes(note.tipo)){
          setAsistenciaForNote(note);
        }
      });
    }catch(e){
      console.warn('Error en syncAsistenciaFromNotes:', e);
    }
  }
  
  function saveNotes(notes){ try{ if(window.DB && typeof window.DB.save === 'function'){ return window.DB.save('notas', notes||[]); } localStorage.setItem('hsv_notes_v1', JSON.stringify(notes||[])); } catch(e){ console.warn('saveNotes', e); } }
  function ensureNoteId(){ try{ if(window.DB && typeof window.DB.generateId === 'function') return window.DB.generateId('notas'); }catch(e){} return 'n_' + Math.random().toString(36).slice(2,9); }

  // render notes into the Seguimiento view
  function renderNotesList(){
    const container = document.querySelector('#view_seguimiento .notes-container'); if(!container) return;
    const notes = loadNotes();
    // apply filter from UI (if present)
    const filterEl = document.getElementById('notes_filter_tipo');
    const filterVal = filterEl ? filterEl.value : 'all';
    container.innerHTML = '';
    const visible = filterVal && filterVal !== 'all' ? notes.filter(n=> (n.tipo||'').toLowerCase() === filterVal.toLowerCase()) : notes.slice();
    if(visible.length===0){ container.innerHTML = '<div class="section">No hay notas guardadas.</div>'; return; }
    // sort by updatedAt or signedAt desc
  visible.sort((a,b)=> (new Date(b.updatedAt||b.signedAt||b.createdAt)) - (new Date(a.updatedAt||a.signedAt||a.createdAt)));
    visible.forEach(n=>{
      const card = document.createElement('div'); card.className = 'note-card'; card.dataset.noteId = n.id || '';
      const head = document.createElement('div'); head.className='note-head';
      const title = document.createElement('div'); title.className='note-title';
  const dateLabel = n.fecha ? n.fecha : (n.savedAt ? new Date(n.savedAt).toISOString().slice(0,10) : '');
  // show date only; type is represented by the bubble to avoid duplication
  title.innerHTML = `<strong>${dateLabel}</strong>`;
      // type bubble
      const bubble = document.createElement('span'); bubble.className = 'note-type-bubble note-type-' + (n.tipo||'seguimiento');
      bubble.textContent = n.tipo ? capitalize(n.tipo) : 'Nota';
      title.appendChild(bubble);
      const meta = document.createElement('div'); 
      meta.className='note-meta'; 
      
      // Build responsable and apoyo strings with prefixes
      // Try to get prefix from saved data, fallback to constants if not available (for old notes)
      const respPrefix = n.responsable_prefix || (window.getResponsablePrefix ? window.getResponsablePrefix(n.responsable) : '');
      const respText = respPrefix ? `${respPrefix} ${n.responsable||'—'}` : (n.responsable||'—');
      const apoyoPrefix = n.apoyo_prefix || (window.getApoyoPrefix ? window.getApoyoPrefix(n.apoyo) : '');
      const apoyoText = n.apoyo ? (apoyoPrefix ? `${apoyoPrefix} ${n.apoyo}` : n.apoyo) : '—';
      
      meta.textContent = `Responsable: ${respText} | Apoyo: ${apoyoText} | Estado: ${n.status||'Borrador'}`;
      head.appendChild(title); head.appendChild(meta);
      card.appendChild(head);

      // body: render per-note-type layout
      const body = document.createElement('div'); body.className='note-body';
      if(n.tipo === 'seguimiento'){
        const obj = document.createElement('div'); obj.className='note-general'; obj.style.marginTop='8px'; obj.textContent = n.presentation || n.objective || '';
        body.appendChild(obj);
        const ul = document.createElement('ul'); ul.className='activity-list'; ul.style.display='none'; ul.style.listStyle='disc'; ul.style.paddingLeft='20px';
        if(Array.isArray(n.exercises) && n.exercises.length){ n.exercises.forEach(e=>{ const li = document.createElement('li'); li.textContent = `${e.name || ''} — ${e.sets||''}x${e.reps||''} ${e.type||''}`; ul.appendChild(li); }); }
        if(Array.isArray(n.agents) && n.agents.length){ n.agents.forEach(a=>{ const li = document.createElement('li'); li.textContent = `${a.agent || ''} — ${a.duration||''}min (${a.modality||''})`; ul.appendChild(li); }); }
        if(Array.isArray(n.circuits) && n.circuits.length){ n.circuits.forEach(c=>{ const li = document.createElement('li'); li.textContent = `${c.activity || ''} — ${c.duration||''}min x ${c.rounds||''}`; ul.appendChild(li); }); }
        body.appendChild(ul);
      } else if(n.tipo === 'negacion'){
        // Negación: Tipo, fecha, hora programada inicio/fin; top corner meta already shows responsable/apoyo/estado
        const sched = document.createElement('div'); sched.style.marginTop='6px'; sched.innerHTML = `<strong>Horario programado:</strong> ${escapeHtml(n.sched_start||'')} — ${escapeHtml(n.sched_end||'')}`;
        const motivo = document.createElement('div'); motivo.style.marginTop='10px'; motivo.innerHTML = `<strong>Motivo de negación:</strong><div style="white-space:pre-wrap;margin-top:6px">${escapeHtml(n.neg_reason||'')}</div>`;
        body.appendChild(sched); body.appendChild(motivo);
      } else if(n.tipo === 'notificacion'){
        // Notificación: Tipo, fecha, hora de firma; show notification content
        const timeStr = n.signedAt ? formatIsoTime(n.signedAt) : (n.updatedAt ? formatIsoTime(n.updatedAt) : '');
        const ts = document.createElement('div'); ts.style.marginTop='6px'; ts.innerHTML = `<strong>Hora:</strong> ${escapeHtml(timeStr)} `;
        const content = document.createElement('div'); content.style.marginTop='10px'; content.innerHTML = `<div style="white-space:pre-wrap">${escapeHtml(n.not_detail||'')}</div>`;
        body.appendChild(ts); body.appendChild(content);
      } else if(n.tipo === 'cumplimiento'){
        // Cumplimiento: Tipo y fecha; show which objective was completed
        const objDone = document.createElement('div'); objDone.style.marginTop='8px'; objDone.innerHTML = `<strong>Objetivo cumplido:</strong><div style="white-space:pre-wrap;margin-top:6px">${escapeHtml(n.cumplimiento_plan || n.cumplimiento_obs || n.presentation || '')}</div>`;
        body.appendChild(objDone);
      } else if(n.tipo === 'cancelacion_justificada'){
        // Cancelación justificada: show scheduled times and selected reasons + vitals details if any
        const sched = document.createElement('div'); sched.style.marginTop='6px'; sched.innerHTML = `<strong>Horario programado:</strong> ${escapeHtml(n.sched_start||'')} — ${escapeHtml(n.sched_end||'')}`;
        body.appendChild(sched);
        const reasons = [];
        if(n.cj_vitals) reasons.push('Signos vitales fuera de parámetros');
        if(n.cj_medical) reasons.push('Cita médica');
        if(n.cj_house) reasons.push('Actividades domiciliarias');
        const rdiv = document.createElement('div'); rdiv.style.marginTop='10px'; rdiv.innerHTML = `<strong>Motivo de cancelación:</strong><div style="white-space:pre-wrap;margin-top:6px">${escapeHtml(reasons.join('; ') || 'No especificado')}</div>`;
        body.appendChild(rdiv);
        if(n.cj_vitals){
          const vdiv = document.createElement('div'); vdiv.style.marginTop='8px'; vdiv.innerHTML = `<strong>Detalles verificados:</strong><div style="white-space:pre-wrap;margin-top:6px">${escapeHtml((n.cj_who?('Quién: '+n.cj_who+'\n'):'') + (n.cj_time?('Hora: '+n.cj_time+'\n'):'') + (n.cj_ta?('TA: '+n.cj_ta+'\n'):'') + (n.cj_spo2?('SpO2: '+n.cj_spo2+'\n'):'') + (n.cj_fc?('FC: '+n.cj_fc+'\n'):''))}</div>`;
          body.appendChild(vdiv);
        }
      } else {
        // fallback: show generic presentation and plan
        const parts = [];
        if(n.presentation) parts.push(`<div><strong>Presentación</strong><div style="white-space:pre-wrap;margin-top:6px">${escapeHtml(n.presentation)}</div></div>`);
        if(n.subjective) parts.push(`<div style="margin-top:8px"><strong>Subjetivo</strong><div style="white-space:pre-wrap;margin-top:6px">${escapeHtml(n.subjective)}</div></div>`);
        if(n.objective) parts.push(`<div style="margin-top:8px"><strong>Objetivo</strong><div style="white-space:pre-wrap;margin-top:6px">${escapeHtml(n.objective)}</div></div>`);
        if(n.analysis) parts.push(`<div style="margin-top:8px"><strong>Análisis</strong><div style="white-space:pre-wrap;margin-top:6px">${escapeHtml(n.analysis)}</div></div>`);
        if(n.plan_obs) parts.push(`<div style="margin-top:8px"><strong>Plan / Observaciones</strong><div style="white-space:pre-wrap;margin-top:6px">${escapeHtml(n.plan_obs)}</div></div>`);
        body.innerHTML = parts.join('');
      }

      card.appendChild(body);
      const btnRow = document.createElement('div'); btnRow.className='btn-row';
      if(n.status === 'Borrador'){
        const edit = document.createElement('button'); edit.className='btn btn-edit'; edit.textContent='Editar'; edit.addEventListener('click', ()=>{ loadNoteIntoForm(n.id); window.showView('view_addnote'); });
        const sign = document.createElement('button'); sign.className='btn btn-sign'; sign.textContent='Firmar'; sign.addEventListener('click', ()=>{ promptSignNoteById(n.id); });
        const del = document.createElement('button'); del.className='btn btn-del'; del.textContent='Eliminar'; del.addEventListener('click', ()=>{ deleteNoteById(n.id); });
        btnRow.appendChild(edit); btnRow.appendChild(sign); btnRow.appendChild(del);
        if(n.tipo === 'seguimiento'){
          const viewAct = document.createElement('button'); viewAct.className='btn btn-view'; viewAct.textContent='Ver actividades realizadas'; viewAct.addEventListener('click', ()=>{ toggleActivities(viewAct); });
          btnRow.appendChild(viewAct);
        }
      } else {
        // signed notes: if seguimiento, show the toggle button; else no extra actions except maybe view details inline
        if(n.tipo === 'seguimiento'){
          const viewAct = document.createElement('button'); viewAct.className='btn btn-view'; viewAct.textContent='Ver actividades realizadas'; viewAct.addEventListener('click', ()=>{ toggleActivities(viewAct); });
          btnRow.appendChild(viewAct);
        }
      }
      card.appendChild(btnRow);
      container.appendChild(card);
    });
  }

  async function deleteNoteById(id){
    const confirmado = await window.customConfirm(
      'Esta acción no se puede deshacer.',
      '¿Eliminar esta nota?',
      { type: 'danger', confirmText: 'Eliminar' }
    );
    if(!confirmado) return;
    // find the note before deletion
    const notesBefore = loadNotes(); 
    const noteToDelete = notesBefore.find(x=>x.id===id);
    
    // perform deletion (DB or localStorage)
    if(window.DB && typeof window.DB.delete === 'function'){
      try{ window.DB.delete('notas', id); }catch(e){ console.warn('DB.delete failed', e); }
    } else {
      const notes = notesBefore.filter(item=>item.id!==id); 
      saveNotes(notes);
    }
    
    // if deleted note was signed, update asistencia: try to find another signed note for same date
    try{
      if(noteToDelete && noteToDelete.status && String(noteToDelete.status).toLowerCase() === 'firmada'){
        const pid = noteToDelete.paciente || getPatientId(); 
        const date = noteToDelete.fecha;
        // find if any other signed note exists for that patient/date
        const replacement = getMostRecentSignedNoteForDate(pid, date, id);
        if(replacement){ 
          // set asistencia to replacement
          setAsistenciaForNote(replacement);
        } else { 
          // remove asistencia entry
          try{ removeAsistenciaForDateAndRefresh(pid, date); }catch(e){}
        }
      }
    }catch(e){ console.warn('post-delete asistencia update failed', e); }
    
    renderNotesList();
  }

  
  // --- Asistencia sync helpers ---
  function asistenciaKey(){ return 'hsv_asistencia_v1'; }
  function loadAsistencia(){ try{ const raw = localStorage.getItem(asistenciaKey()); return raw? JSON.parse(raw): {}; }catch(e){ return {}; } }
  function saveAsistencia(obj){ try{ localStorage.setItem(asistenciaKey(), JSON.stringify(obj||{})); }catch(e){ console.warn('saveAsistencia',e);} }
  function getPatientId(){ const el = document.getElementById('userName'); return el && el.textContent.trim() ? el.textContent.trim() : 'patient_default'; }
  function mapNoteTypeToAsistencia(note){ // returns { iconHtml, color, estado, tipo }
    const tipo = (note.tipo||'').toLowerCase(); switch(tipo){
      case 'seguimiento': return { icon: '<i class="fa-solid fa-check icon-accent-green"></i>', estado: 'Asistencia completada', tipo: 'seguimiento' };
      case 'negacion': return { icon: '<i class="fa-solid fa-xmark icon-accent-red"></i>', estado: 'Sesión no realizada', tipo: 'negacion' };
      case 'cancelacion_justificada': return { icon: '<i class="fa-solid fa-xmark icon-accent-lilac"></i>', estado: 'Sesión no realizada justificada', tipo: 'cancelacion_justificada' };
      case 'notificacion': return { icon: '<i class="fa-solid fa-bell icon-accent-blue"></i>', estado: 'Aviso informativo', tipo: 'notificacion' };
      case 'cumplimiento': return { icon: '<i class="fa-solid fa-star icon-accent-yellow"></i>', estado: 'Sesión cumplida', tipo: 'cumplimiento' };
      default: return null;
    } }
  function setAsistenciaForNote(note){ try{
      if(!note || !note.paciente || !note.fecha) return;
      const pid = note.paciente; const date = note.fecha; const map = mapNoteTypeToAsistencia(note); if(!map) return;
      const all = loadAsistencia(); all[pid] = all[pid]||{}; all[pid][date] = { tipo: map.tipo, icon: map.icon, color: map.color, estado: map.estado, noteId: note.id, updatedAt: new Date().toISOString() };
      saveAsistencia(all);
      
      // Guardar también en JSON si está firmada
      if(note.status === 'Firmada' && window.DataController){
        try{
          const asistenciaRecord = {
            id: note.id || 'asist_' + Date.now(),
            paciente: pid,
            fecha: date,
            tipo: map.tipo,
            estado: map.estado,
            noteId: note.id,
            createdAt: note.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          // Llamar saveMonthly de forma segura (fire and forget es ok aquí)
          if(typeof window.DataController.saveMonthly === 'function'){
            window.DataController.saveMonthly('asistencia', pid, date, asistenciaRecord)
              .then(success => {
                if(success) console.log('✅ Asistencia guardada en JSON:', asistenciaRecord.id);
                else console.warn('⚠️ Error guardando asistencia en JSON');
              })
              .catch(err => console.warn('Error guardando asistencia en JSON:', err));
          }
        }catch(e){ console.warn('Error en JSON save para asistencia:', e); }
      }
      
      try{ if(window._asistencia && typeof window._asistencia.refresh === 'function') window._asistencia.refresh(); }catch(e){}
    }catch(e){ console.warn('setAsistenciaForNote', e); } }
  function removeAsistenciaForDate(pid, date){ try{ const all = loadAsistencia(); if(!all || !all[pid]) return; delete all[pid][date]; saveAsistencia(all); }catch(e){ console.warn('removeAsistenciaForDate', e); } }
  function removeAsistenciaForDateAndRefresh(pid, date){ try{ removeAsistenciaForDate(pid,date); try{ if(window._asistencia && typeof window._asistencia.refresh === 'function') window._asistencia.refresh(); }catch(e){} }catch(e){ console.warn('removeAsistenciaForDateAndRefresh', e); } }
  function getMostRecentSignedNoteForDate(pid,date, excludingId){ const notes = loadNotes().filter(n=> (n.paciente===pid && (n.fecha===date) && n.status && n.status.toLowerCase()==='firmada' && n.id !== excludingId)); if(!notes.length) return null; notes.sort((a,b)=> new Date(b.signedAt||b.updatedAt||b.createdAt) - new Date(a.signedAt||a.updatedAt||a.createdAt)); return notes[0]; }

  function loadNoteIntoForm(id){ const notes = loadNotes(); const p = notes.find(x=>x.id===id); if(!p) return alert('Nota no encontrada');
    // populate form fields with p and set draft per-patient
    if(p.fecha && $('#note_fecha')) $('#note_fecha').value = p.fecha;
    if(p.sched_start && $('#note_sched_start')) $('#note_sched_start').value = p.sched_start;
    if(p.sched_end && $('#note_sched_end')) $('#note_sched_end').value = p.sched_end;
    if(p.real_start && $('#note_real_start')) $('#note_real_start').value = p.real_start;
    if(p.real_end && $('#note_real_end')) $('#note_real_end').value = p.real_end;
    if(p.responsable && $('#note_responsable')) setSelectByText('#note_responsable', p.responsable);
    if(p.apoyo && $('#note_apoyo')) setSelectByText('#note_apoyo', p.apoyo);
    if(p.presentation && $('#note_presentation')) $('#note_presentation').value = p.presentation;
    if(p.subjective && $('#note_subjective')) $('#note_subjective').value = p.subjective;
    if(p.objective && $('#note_objective')) $('#note_objective').value = p.objective;
    if(p.analysis && $('#note_analysis')) $('#note_analysis').value = p.analysis;
    if(p.plan_obs && $('#note_plan_obs')) $('#note_plan_obs').value = p.plan_obs;
    if(p.tipo && $('#note_tipo')) { $('#note_tipo').value = p.tipo; applyNoteType(); }
    // exercises/agents/circuits - clear and repopulate
    const le = $('#list_exercises'); if(le) le.innerHTML = '';
    if(Array.isArray(p.exercises)) p.exercises.forEach(e=>{ const ev = e; const row = createExerciseFromData(ev); if(row) le.appendChild(row); });
    const la = $('#list_agents'); if(la) la.innerHTML=''; if(Array.isArray(p.agents)) p.agents.forEach(a=>{ const r=createAgentFromData(a); if(r) la.appendChild(r); });
    const lc = $('#list_circuits'); if(lc) lc.innerHTML=''; if(Array.isArray(p.circuits)) p.circuits.forEach(c=>{ const r=createCircuitFromData(c); if(r) lc.appendChild(r); });
    // store per-patient draft copy for edit
    const pid = getPatientId(); localStorage.setItem(draftKey(pid), JSON.stringify({note:p, savedAt: Date.now()}));
    renderNotesList();
  }

  function promptSignNoteById(id){ const notes = loadNotes(); const n = notes.find(x=>x.id===id); if(!n) return alert('Nota no encontrada');
    if(!n.responsable) return alert('Seleccione responsable antes de firmar (abra la nota para editar).');
    const prefix = (n.responsable_prefix||'').toUpperCase(); const expected = RESPONSABLE_PINS[n.responsable] || DEFAULT_PIN;
  const cb = function(success){ if(!success) return; n.status='Firmada'; n.signedAt = new Date().toISOString(); n.updatedAt = n.signedAt; saveUpsertNote(n); try{ setAsistenciaForNote(n); }catch(e){} renderNotesList(); };
  if(prefix === 'LFT' || prefix === 'PSS'){ openPinForResponsable(n.responsable, expected, function(success){ if(!success) return; n.status='Firmada'; n.signedAt = new Date().toISOString(); n.updatedAt = n.signedAt; saveUpsertNote(n); try{ setAsistenciaForNote(n); }catch(e){} /* cooldown removed */ renderNotesList(); }); } else { cb(true); }
  }

  function saveUpsertNote(n){ // centralised upsert: prefer DB.upsert
    // SANITIZAR SEGÚN TIPO DE NOTA
    const sanitized = sanitizeNoteByType(n);
    
    try{
      if(window.DB && typeof window.DB.upsert === 'function'){
        const rec = Object.assign({}, sanitized);
        if(!rec.id) rec.id = window.DB.generateId('notas');
        rec.updatedAt = new Date().toISOString();
        if(!rec.createdAt) rec.createdAt = rec.updatedAt;
        window.DB.upsert('notas', rec);
        return;
      }
    }catch(e){ console.warn('DB.upsert failed', e); }
    // fallback
    const notes = loadNotes(); if(!sanitized.id) sanitized.id = ensureNoteId(); sanitized.updatedAt = new Date().toISOString(); const ix = notes.findIndex(x=>x.id===sanitized.id); if(ix>=0) notes[ix] = Object.assign({}, notes[ix], sanitized); else notes.push(sanitized); saveNotes(notes);
    
    // Guardar en JSON real solo si está firmada
    if(sanitized.status === 'Firmada' && sanitized.paciente && sanitized.fecha && window.DataController){
      try{
        const fecha = sanitized.fecha || new Date().toISOString().slice(0, 10);
        // Call saveMonthly without await (fire and forget), but it will still save
        window.DataController.saveMonthly('notas', sanitized.paciente, fecha, sanitized).then(success => {
          if(success) console.log('✅ Nota guardada en JSON:', sanitized.id);
          else console.warn('⚠️ Error guardando nota en JSON');
          // Eliminar borrador de localStorage
          if(success && window.DataController && window.DataController.deleteDraft) {
            window.DataController.deleteDraft('notas', sanitized.paciente, sanitized.id).catch(e => console.warn('Error eliminando borrador:', e));
          }
        }).catch(e => {
          console.error('Error guardando nota en JSON:', e);
        });
      }catch(e){
        console.error('Error guardando nota en JSON:', e);
      }
    }
  }

  function capitalize(s){ if(!s) return ''; return s.charAt(0).toUpperCase() + s.slice(1); }

  function escapeHtml(s){ if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }

  // helpers to create list row elements from saved data (used when loading a note into the editor)
  function createExerciseFromData(data){
    const li = document.createElement('li'); li.style.display='flex'; li.style.gap='8px'; li.style.alignItems='center'; li.style.marginBottom='6px';
    li.innerHTML = `
      <input class="input ex-name" placeholder="Ejercicio" style="min-width:160px" value="${(data&&data.name)||''}" />
      <input class="input ex-sets" placeholder="Series" style="width:70px" value="${(data&&data.sets)||''}" />
      <input class="input ex-reps" placeholder="Reps" style="width:70px" value="${(data&&data.reps)||''}" />
      <input class="input ex-type" placeholder="Tipo" style="min-width:120px" value="${(data&&data.type)||''}" />
      <input class="input ex-rest" placeholder="Descanso(s)" style="width:100px" value="${(data&&data.rest)||''}" />
      <input class="input ex-equip" placeholder="Equipo" style="min-width:120px" value="${(data&&data.equip)||''}" />
      <button class="btn btn-ghost btn-remove">Eliminar</button>
    `;
    li.querySelector('.btn-remove')?.addEventListener('click', ()=>{ li.remove(); });
    return li;
  }

  function createAgentFromData(data){
    const li = document.createElement('li'); li.style.display='flex'; li.style.gap='8px'; li.style.alignItems='center'; li.style.marginBottom='6px';
    li.innerHTML = `
      <input class="input ag-type" placeholder="Agente" style="min-width:200px" value="${(data&&data.agent)||''}" />
      <input class="input ag-dur" placeholder="Duración (min)" style="width:120px" value="${(data&&data.duration)||''}" />
      <input class="input ag-mod" placeholder="Modalidad" style="min-width:140px" value="${(data&&data.modality)||''}" />
      <button class="btn btn-ghost btn-remove">Eliminar</button>
    `;
    li.querySelector('.btn-remove')?.addEventListener('click', ()=>{ li.remove(); });
    return li;
  }

  function createCircuitFromData(data){
    const li = document.createElement('li'); li.style.display='flex'; li.style.gap='8px'; li.style.alignItems='center'; li.style.marginBottom='6px';
    li.innerHTML = `
      <input class="input ci-activity" placeholder="Actividad" style="min-width:200px" value="${(data&&data.activity)||''}" />
      <input class="input ci-dur" placeholder="Duración (min)" style="width:120px" value="${(data&&data.duration)||''}" />
      <input class="input ci-rounds" placeholder="Rondas" style="width:90px" value="${(data&&data.rounds)||''}" />
      <button class="btn btn-ghost btn-remove">Eliminar</button>
    `;
    li.querySelector('.btn-remove')?.addEventListener('click', ()=>{ li.remove(); });
    return li;
  }


  function saveDraft(){
    // Verificar si el usuario es de solo lectura (INVITADO)
    if(typeof window.isReadOnlyUser === 'function' && window.isReadOnlyUser()) {
      $('#note_msg').textContent = '⛔ No tienes permisos para guardar notas';
      setTimeout(()=>{ if($('#note_msg')) $('#note_msg').textContent = ''; }, 3000);
      return;
    }
    
    const pid = getPatientId();
    try{
      const data = collectNote() || {};
      data.status = 'Borrador';
      data.paciente = pid;
      if(!data.id) data.id = ensureNoteId();
      const now = new Date().toISOString();
      data.updatedAt = now; if(!data.createdAt) data.createdAt = now;
      // persist to notes list (DB or localStorage)
      saveUpsertNote(data);
      // also keep a per-patient draft copy for the editor
      try{ localStorage.setItem(draftKey(pid), JSON.stringify({note:data, savedAt: Date.now()})); }catch(e){}
      $('#note_msg').textContent = 'Borrador guardado.';
      setTimeout(()=>{ if($('#note_msg')) $('#note_msg').textContent=''; }, 2500);
    }catch(e){ console.warn('saveDraft', e); }
  }

  // autoSaveAndCooldown removed: autosave behavior disabled. Manual saveDraft() must be used.

  // simple confetti (small, lightweight)
  function celebrate(){
    const body = document.body; const count = 40; const root = document.createElement('div'); root.style.position='fixed'; root.style.inset='0'; root.style.pointerEvents='none';
  const confettiClasses = ['confetti-red','confetti-orange','confetti-green','confetti-teal','confetti-violet','confetti-blue'];
  for(let i=0;i<count;i++){ const c = document.createElement('div'); c.style.position='absolute'; c.style.width='8px'; c.style.height='14px'; c.style.left = Math.random()*100 + '%'; c.classList.add(confettiClasses[Math.floor(Math.random()*confettiClasses.length)]); c.style.top='-10%'; c.style.opacity='0.95'; c.style.transform = `rotate(${Math.random()*360}deg)`; c.style.transition = `transform 1.8s linear, top 1.8s ease-in`; root.appendChild(c); setTimeout(()=>{ c.style.top = (60 + Math.random()*30) + '%'; c.style.transform = `rotate(${Math.random()*720}deg) translateY(120%)`; }, 40); }
    body.appendChild(root); setTimeout(()=>{ body.removeChild(root); }, 2200);
  }

  // Sign flow: uses existing modal infrastructure by setting overlay dataset and window._plan_pin_cb
  function openPinForResponsable(resName, expectedPin, cb){
    const overlay = document.getElementById('pinModalOverlay');
    const desc = document.getElementById('pinModalDesc');
    const input = document.getElementById('pinInput');
    const error = document.getElementById('pinError');
    if(!overlay) return cb && cb(false);
    overlay.dataset.expected = expectedPin || DEFAULT_PIN;
    overlay.dataset.resname = resName || '';
    overlay.classList.add('active');
    if(desc) desc.textContent = `Firmar como ${resName}. Introduzca PIN:`;
    if(input){ input.value=''; input.classList.remove('invalid'); setTimeout(()=>input.focus(),60); }
    if(error) error.textContent='';
    window._plan_pin_cb = cb; // plan.js' modal wiring will call this
  }

  function lockAfterSign(){ setLocked(true); if($('#note_status')) $('#note_status').textContent = 'Firmada'; }

  function signAndSave(){
    const pid = getPatientId();
    // require responsable
    const resSel = $('#note_responsable');
    const resName = resSel?.selectedOptions[0]?.textContent || '';
    const resPrefix = resSel?.selectedOptions[0]?.dataset?.prefix || '';
    if(!resName){ alert('Seleccione responsable antes de firmar'); return; }

    function afterPin(success){
      if(!success){ $('#note_msg').textContent = 'PIN inválido. Guardado como borrador.'; saveDraft(); return; }
  // on success: mark signed and save
      const noteObj = collectNote(); noteObj.signedBy = (resPrefix? resPrefix + ' ':'') + resName; noteObj.status = 'Firmada';
      localStorage.setItem(draftKey(pid), JSON.stringify({note:noteObj, signedAt: Date.now()}));
      $('#note_msg').textContent = 'Nota firmada y guardada.'; lockAfterSign();
  if(noteObj.tipo === 'cumplimiento'){ /* cooldown removed */ celebrate(); }
      setTimeout(()=>{ if($('#note_msg')) $('#note_msg').textContent=''; }, 3000);
    }

    // Solo LFT y PSS pueden firmar notas
    if(resPrefix !== 'LFT' && resPrefix !== 'PSS'){
      alert('Solo los responsables LFT y PSS pueden firmar notas. Los practicantes no tienen permiso de firma.');
      return;
    }

    // if responsable requires PIN (LFT/PSS)
    if(resPrefix === 'LFT' || resPrefix === 'PSS'){
      const expected = RESPONSABLE_PINS[resName] || DEFAULT_PIN;
      openPinForResponsable(resName, expected, afterPin);
    } else {
      afterPin(true);
    }
  }

  function clearNoteForm(){
    // Limpiar todos los campos del formulario
    const pid = getPatientId();
    localStorage.removeItem(draftKey(pid));
    
    if($('#note_fecha')) $('#note_fecha').value = new Date().toISOString().slice(0,10);
    if($('#note_hora')) $('#note_hora').value = new Date().toTimeString().slice(0,5);
    if($('#note_sched_start')) $('#note_sched_start').value = '';
    if($('#note_sched_end')) $('#note_sched_end').value = '';
    if($('#note_real_start')) $('#note_real_start').value = '';
    if($('#note_real_end')) $('#note_real_end').value = '';
    if($('#note_responsable')) $('#note_responsable').selectedIndex = 0;
    if($('#note_apoyo')) $('#note_apoyo').selectedIndex = 0;
    if($('#note_presentation')) $('#note_presentation').value = '';
    if($('#note_subjective')) $('#note_subjective').value = '';
    if($('#note_objective')) $('#note_objective').value = '';
    if($('#note_analysis')) $('#note_analysis').value = '';
    if($('#note_plan_obs')) $('#note_plan_obs').value = '';
    if($('#neg_reason')) $('#neg_reason').value = '';
    if($('#not_detail')) $('#not_detail').value = '';
    if($('#cum_obs')) $('#cum_obs').value = '';
    if($('#note_tipo')) $('#note_tipo').value = 'seguimiento';
    if($('#note_status')) $('#note_status').textContent = 'Borrador';
    if($('#note_msg')) $('#note_msg').textContent = '';
    
    // Limpiar listas
    const listEx = $('#list_exercises'); if(listEx) listEx.innerHTML = '';
    const listAg = $('#list_agents'); if(listAg) listAg.innerHTML = '';
    const listCi = $('#list_circuits'); if(listCi) listCi.innerHTML = '';
    
    setLocked(false);
    applyNoteType();
  }

  function initAddNote(){
    // set date/time
    const now = new Date(); if($('#note_fecha')) {
      $('#note_fecha').value = now.toISOString().slice(0,10);
      // readable label
      const lab = document.getElementById('note_fecha_label');
      if(lab){
        const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
        const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const d = now; lab.textContent = `${days[d.getDay()]} ${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
      }
      // update when date changes (if ever)
      $('#note_fecha').addEventListener('change', (e)=>{
        const v = e.target.value; if(!v) return; const dd = new Date(v + 'T00:00'); if(isNaN(dd)) return;
        const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
        const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const lab = document.getElementById('note_fecha_label'); if(lab) lab.textContent = `${days[dd.getDay()]} ${dd.getDate()} de ${months[dd.getMonth()]} de ${dd.getFullYear()}`;
      });
    }
    if($('#note_hora')) $('#note_hora').value = now.toTimeString().slice(0,5);
    populateScheduleSelects(); applyNoteType();

    // Bind listeners once to avoid duplicate attachments
    if(!listenersBound){
      // wire type change
      $('#note_tipo')?.addEventListener('change', ()=>{ applyNoteType(); });

      // vitals toggle
      $('#vitals_ok')?.addEventListener('change', (e)=>{ const vf = $('#vitals_fields'); if(vf) vf.style.display = e.target.checked ? 'none' : 'grid'; });
      // cj_vitals
      $('#cj_vitals')?.addEventListener('change', (e)=>{ const el = $('#cj_vitals_extra'); if(el) el.style.display = e.target.checked ? 'block' : 'none'; });

      // add exercise -> create an editable row below the list
      function createExerciseRow(data){
        const ul = $('#list_exercises'); if(!ul) return;
        const li = document.createElement('li');
        li.style.display = 'flex'; li.style.gap = '8px'; li.style.alignItems = 'center'; li.style.flexWrap = 'wrap'; li.style.marginBottom = '8px'; li.style.padding = '10px'; li.style.background = '#f9fafb'; li.style.borderRadius = '8px';
        li.innerHTML = `
          <input class="input ex-name" placeholder="Ejercicio" style="min-width:0;flex:1;min-width:180px" value="${(data&&data.name)||''}" />
          <input class="input ex-sets" placeholder="Series" style="width:70px;min-width:0" value="${(data&&data.sets)||''}" />
          <input class="input ex-reps" placeholder="Reps" style="width:70px;min-width:0" value="${(data&&data.reps)||''}" />
          <input class="input ex-type" placeholder="Tipo" style="min-width:0;width:120px" value="${(data&&data.type)||''}" />
          <input class="input ex-rest" placeholder="Desc. (s)" style="width:80px;min-width:0" value="${(data&&data.rest)||''}" />
          <input class="input ex-equip" placeholder="Equipo" style="min-width:0;width:120px" value="${(data&&data.equip)||''}" />
          <button class="btn btn-pink btn-remove" style="white-space:nowrap">✕ Eliminar</button>
        `;
        ul.appendChild(li);
        li.querySelector('.btn-remove')?.addEventListener('click', ()=>{ li.remove(); });
      }
      $('#btn_add_ex')?.addEventListener('click', ()=>{
        createExerciseRow({
          name: $('#ex_name')?.value || '', sets: $('#ex_sets')?.value || '', reps: $('#ex_reps')?.value || '',
          type: $('#ex_type')?.value || '', rest: $('#ex_rest')?.value || '', equip: $('#ex_equip')?.value || ''
        });
        ['ex_name','ex_sets','ex_reps','ex_type','ex_rest','ex_equip'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
      });

      // add agent -> row
      function createAgentRow(data){
        const ul = $('#list_agents'); if(!ul) return;
        const li = document.createElement('li'); li.style.display='flex'; li.style.gap='8px'; li.style.alignItems='center'; li.style.flexWrap='wrap'; li.style.marginBottom='8px'; li.style.padding='10px'; li.style.background='#f9fafb'; li.style.borderRadius='8px';
        li.innerHTML = `
          <input class="input ag-type" placeholder="Tipo de agente" style="min-width:0;flex:1;min-width:180px" value="${(data&&data.agent)||''}" />
          <input class="input ag-dur" placeholder="Minutos" style="width:80px;min-width:0" value="${(data&&data.duration)||''}" />
          <input class="input ag-mod" placeholder="Modalidad" style="min-width:0;flex:1;min-width:140px" value="${(data&&data.modality)||''}" />
          <button class="btn btn-pink btn-remove" style="white-space:nowrap">✕ Eliminar</button>
        `;
        ul.appendChild(li);
        li.querySelector('.btn-remove')?.addEventListener('click', ()=>{ li.remove(); });
      }
      $('#btn_add_agent')?.addEventListener('click', ()=>{
        createAgentRow({ agent: $('#ag_type')?.value||'', duration: $('#ag_dur')?.value||'', modality: $('#ag_mod')?.value||'' });
        ['ag_type','ag_dur','ag_mod'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
      });

      // add circuit -> row
      function createCircuitRow(data){
        const ul = $('#list_circuits'); if(!ul) return;
        const li = document.createElement('li'); li.style.display='flex'; li.style.gap='8px'; li.style.alignItems='center'; li.style.flexWrap='wrap'; li.style.marginBottom='8px'; li.style.padding='10px'; li.style.background='#f9fafb'; li.style.borderRadius='8px';
        li.innerHTML = `
          <input class="input ci-activity" placeholder="Actividad del circuito" style="min-width:0;flex:1;min-width:200px" value="${(data&&data.activity)||''}" />
          <input class="input ci-dur" placeholder="Minutos" style="width:80px;min-width:0" value="${(data&&data.duration)||''}" />
          <input class="input ci-rounds" placeholder="Rondas" style="width:80px;min-width:0" value="${(data&&data.rounds)||''}" />
          <button class="btn btn-pink btn-remove" style="white-space:nowrap">✕ Eliminar</button>
        `;
        ul.appendChild(li);
        li.querySelector('.btn-remove')?.addEventListener('click', ()=>{ li.remove(); });
      }
      $('#btn_add_circuit')?.addEventListener('click', ()=>{
        createCircuitRow({ activity: $('#ci_activity')?.value||'', duration: $('#ci_dur')?.value||'', rounds: $('#ci_rounds')?.value||'' });
        ['ci_activity','ci_dur','ci_rounds'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
      });

      listenersBound = true;
    }

    // save and sign
    const btnSave = $('#btn_save_note');
    if(btnSave && !btnSave.dataset.initialized){
      btnSave.dataset.initialized = 'true';
      btnSave.addEventListener('click', ()=>{ 
        // use saveDraft which persists to notes list
        saveDraft(); renderNotesList();
      });
    }
    const btnSign = $('#btn_sign_note');
    if(btnSign && !btnSign.dataset.initialized){
      btnSign.dataset.initialized = 'true';
      btnSign.addEventListener('click', ()=>{ 
        // Verificar si el usuario es de solo lectura (INVITADO)
        if(typeof window.isReadOnlyUser === 'function' && window.isReadOnlyUser()) {
          $('#note_msg').textContent = '⛔ No tienes permisos para firmar notas';
          setTimeout(()=>{ if($('#note_msg')) $('#note_msg').textContent = ''; }, 3000);
          return;
        }
        
        // sign and persist globally
        const pid = getPatientId(); const n = collectNote(); n.paciente = pid; if(!n.id) n.id = ensureNoteId(); 
        const prefix = n.responsable_prefix || '';
        const expected = RESPONSABLE_PINS[n.responsable] || DEFAULT_PIN;
    const after = function(success){ if(!success){ $('#note_msg').textContent='PIN inválido'; saveDraft(); return; } n.status='Firmada'; n.signedAt = new Date().toISOString(); n.updatedAt = n.signedAt; saveUpsertNote(n); try{ setAsistenciaForNote(n); }catch(e){} setLocked(true); $('#note_msg').textContent='Nota firmada y guardada.'; celebrate(); renderNotesList(); setTimeout(()=>{ if($('#note_msg')) $('#note_msg').textContent=''; },3000); };
    if(prefix==='LFT' || prefix==='PSS'){ openPinForResponsable(n.responsable, expected, after); } else { after(true); }
      });
    }

    // load draft if present
    const pid = getPatientId();
    try{
      const raw = localStorage.getItem(draftKey(pid));
      if(raw){
        const parsed = JSON.parse(raw);
        const saved = parsed && parsed.note ? parsed.note : null;
        const savedAt = parsed && parsed.savedAt ? parsed.savedAt : parsed && parsed.signedAt ? parsed.signedAt : null;
        if(saved){
          // populate basic fields
          if(saved.fecha && $('#note_fecha')) $('#note_fecha').value = saved.fecha;
          if(saved.hora && $('#note_hora')) $('#note_hora').value = saved.hora;
          if(saved.sched_start && $('#note_sched_start')) $('#note_sched_start').value = saved.sched_start;
          if(saved.sched_end && $('#note_sched_end')) $('#note_sched_end').value = saved.sched_end;
          if(saved.real_start && $('#note_real_start')) $('#note_real_start').value = saved.real_start;
          if(saved.real_end && $('#note_real_end')) $('#note_real_end').value = saved.real_end;
          if(saved.responsable && $('#note_responsable')) setSelectByText('#note_responsable', saved.responsable);
          if(saved.apoyo && $('#note_apoyo')) setSelectByText('#note_apoyo', saved.apoyo);
          if(saved.presentation && $('#note_presentation')) $('#note_presentation').value = saved.presentation;
          if(saved.subjective && $('#note_subjective')) $('#note_subjective').value = saved.subjective;
          if(saved.objective && $('#note_objective')) $('#note_objective').value = saved.objective;
          if(saved.analysis && $('#note_analysis')) $('#note_analysis').value = saved.analysis;
          if(saved.plan_obs && $('#note_plan_obs')) $('#note_plan_obs').value = saved.plan_obs;
          if(saved.neg_reason && $('#neg_reason')) $('#neg_reason').value = saved.neg_reason;
          if(saved.not_detail && $('#not_detail')) $('#not_detail').value = saved.not_detail;
          if(saved.cumplimiento_obs && $('#cum_obs')) $('#cum_obs').value = saved.cumplimiento_obs;
          if(saved.tipo && $('#note_tipo')) { $('#note_tipo').value = saved.tipo; applyNoteType(); }
          // populate exercises
          if(Array.isArray(saved.exercises) && saved.exercises.length){
            saved.exercises.forEach(e=>{
              const ul = $('#list_exercises'); if(!ul) return;
              const li = document.createElement('li'); li.style.display='flex'; li.style.gap='8px'; li.style.alignItems='center'; li.style.marginBottom='6px';
              li.innerHTML = `\n          <input class="input ex-name" placeholder="Ejercicio" style="min-width:160px" value="${(e&&e.name)||''}" />\n          <input class="input ex-sets" placeholder="Series" style="width:70px" value="${(e&&e.sets)||''}" />\n          <input class="input ex-reps" placeholder="Reps" style="width:70px" value="${(e&&e.reps)||''}" />\n          <input class="input ex-type" placeholder="Tipo" style="min-width:120px" value="${(e&&e.type)||''}" />\n          <input class="input ex-rest" placeholder="Descanso(s)" style="width:100px" value="${(e&&e.rest)||''}" />\n          <input class="input ex-equip" placeholder="Equipo" style="min-width:120px" value="${(e&&e.equip)||''}" />\n          <button class="btn btn-ghost btn-remove">Eliminar</button>\n        `;
              ul.appendChild(li);
              li.querySelector('.btn-remove')?.addEventListener('click', ()=>{ li.remove(); });
            });
          }
          // populate agents
          if(Array.isArray(saved.agents) && saved.agents.length){
            saved.agents.forEach(a=>{
              const ul = $('#list_agents'); if(!ul) return;
              const li = document.createElement('li'); li.style.display='flex'; li.style.gap='8px'; li.style.alignItems='center'; li.style.marginBottom='6px';
              li.innerHTML = `\n          <input class="input ag-type" placeholder="Agente" style="min-width:200px" value="${(a&&a.agent)||''}" />\n          <input class="input ag-dur" placeholder="Duración (min)" style="width:120px" value="${(a&&a.duration)||''}" />\n          <input class="input ag-mod" placeholder="Modalidad" style="min-width:140px" value="${(a&&a.modality)||''}" />\n          <button class="btn btn-ghost btn-remove">Eliminar</button>\n        `;
              ul.appendChild(li);
              li.querySelector('.btn-remove')?.addEventListener('click', ()=>{ li.remove(); });
            });
          }
          // populate circuits
          if(Array.isArray(saved.circuits) && saved.circuits.length){
            saved.circuits.forEach(c=>{
              const ul = $('#list_circuits'); if(!ul) return;
              const li = document.createElement('li'); li.style.display='flex'; li.style.gap='8px'; li.style.alignItems='center'; li.style.marginBottom='6px';
              li.innerHTML = `\n          <input class="input ci-activity" placeholder="Actividad" style="min-width:200px" value="${(c&&c.activity)||''}" />\n          <input class="input ci-dur" placeholder="Duración (min)" style="width:120px" value="${(c&&c.duration)||''}" />\n          <input class="input ci-rounds" placeholder="Rondas" style="width:90px" value="${(c&&c.rounds)||''}" />\n          <button class="btn btn-ghost btn-remove">Eliminar</button>\n        `;
              ul.appendChild(li);
              li.querySelector('.btn-remove')?.addEventListener('click', ()=>{ li.remove(); });
            });
          }

          // status and locking
          if(saved.status && $('#note_status')) $('#note_status').textContent = saved.status;
          if(saved.status && saved.status.toLowerCase().includes('firm')){ setLocked(true); if($('#note_msg')) $('#note_msg').textContent='Nota previamente firmada.'; }
        }
          // no autosave timers: drafts remain until user explicitly saves
      }
    }catch(e){ console.warn('Failed to parse draft', e); }

    // no autosave timers started

    // make countdown float so it's visible while scrolling
    setCountdownFloating(true);

  // when navigating away: no timer to clear
  }

  // Initialize the form (date, tipo toggle, schedule options, etc.)
  function initAddNote(){
    // Set fecha to today if not set
    const fechaEl = $('#note_fecha');
    if(fechaEl && !fechaEl.value){
      fechaEl.value = new Date().toISOString().split('T')[0];
      // Update readable label
      const labelEl = $('#note_fecha_label');
      if(labelEl) labelEl.textContent = window.formatDateLongES ? window.formatDateLongES(fechaEl.value) : fechaEl.value;
    }
    
    // Populate schedule options
    populateScheduleSelects();
    
    // Apply tipo toggle on change
    const tipoEl = $('#note_tipo');
    if(tipoEl && !tipoEl.dataset.listenerSet){
      tipoEl.dataset.listenerSet = 'true';
      tipoEl.addEventListener('change', applyNoteType);
      applyNoteType(); // Apply initial state
    }
    
    // Wire up save and sign buttons (only once)
    const saveBtn = document.getElementById('btn_save_note');
    const signBtn = document.getElementById('btn_sign_note');
    
    if(saveBtn && !saveBtn.dataset.initialized){
      saveBtn.dataset.initialized = 'true';
      saveBtn.addEventListener('click', saveDraft);
    }
    
    if(signBtn && !signBtn.dataset.initialized){
      signBtn.dataset.initialized = 'true';
      signBtn.addEventListener('click', () => {
        // Pedir PIN antes de firmar
        const responsable = $('#note_responsable')?.value || '';
        if(!responsable) {
          const msgEl = $('#note_msg');
          if(msgEl) msgEl.textContent = 'Debe seleccionar un responsable';
          setTimeout(() => { if(msgEl) msgEl.textContent = ''; }, 2500);
          return;
        }
        
        // Obtener PIN esperado
        const expectedPin = RESPONSABLE_PINS[responsable] || DEFAULT_PIN;
        
        // Abrir modal PIN
        openPinModalNote(responsable, expectedPin, (success) => {
          if(success) {
            signAndSave();
          } else {
            // Si PIN es inválido o se cancela, guardar como borrador
            saveDraft();
          }
        });
      });
    }
  }

  // Clear form for a new note
  function clearNoteForm(){
    currentDraft = null;
    
    // Reset fecha
    const fechaEl = $('#note_fecha');
    if(fechaEl){
      fechaEl.value = new Date().toISOString().split('T')[0];
      const labelEl = $('#note_fecha_label');
      if(labelEl) labelEl.textContent = window.formatDateLongES ? window.formatDateLongES(fechaEl.value) : fechaEl.value;
    }
    
    // Reset tipo and trigger toggle
    const tipoEl = $('#note_tipo');
    if(tipoEl){
      tipoEl.selectedIndex = 0;
      tipoEl.dispatchEvent(new Event('change'));
    }
    
    // Reset responsables
    const respEl = $('#note_responsable');
    if(respEl) respEl.selectedIndex = 0;
    
    const apoyoEl = $('#note_apoyo');
    if(apoyoEl) apoyoEl.selectedIndex = 0;
    
    // Clear all textareas
    document.querySelectorAll('#view_addnote textarea').forEach(t => t.value = '');
    
    // Clear lists
    document.querySelectorAll('#view_addnote .activity-list, #list_exercises, #list_agents, #list_circuits').forEach(list => {
      list.innerHTML = '';
    });
    
    // Reset status
    const statusEl = $('#note_status');
    if(statusEl) statusEl.textContent = 'Borrador';
    
    // Reset all checkboxes
    document.querySelectorAll('#view_addnote input[type="checkbox"]').forEach(c => c.checked = false);
    
    // Re-enable all form elements
    document.querySelectorAll('#view_addnote input, #view_addnote textarea, #view_addnote select, #view_addnote button').forEach(e => {
      e.disabled = false;
    });
  }

  // Load a note into the form for editing
  function loadNoteIntoForm(id){
    const notes = loadNotes();
    const note = notes.find(n => n.id === id);
    if(!note) return;
    
    currentDraft = note;
    
    // Populate basic fields
    const fechaEl = $('#note_fecha');
    if(fechaEl){
      fechaEl.value = note.fecha || '';
      const labelEl = $('#note_fecha_label');
      if(labelEl) labelEl.textContent = window.formatDateLongES ? window.formatDateLongES(note.fecha) : note.fecha;
    }
    
    setSelectByText('#note_responsable', note.responsable || '');
    setSelectByText('#note_apoyo', note.apoyo || '');
    
    // Set tipo and apply toggle
    const tipoEl = $('#note_tipo');
    if(tipoEl){
      tipoEl.value = note.tipo || 'seguimiento';
      tipoEl.dispatchEvent(new Event('change'));
    }
    
    // Populate schedule and times
    const schedStartEl = $('#note_sched_start');
    if(schedStartEl) schedStartEl.value = note.sched_start || '';
    
    const schedEndEl = $('#note_sched_end');
    if(schedEndEl) schedEndEl.value = note.sched_end || '';
    
    const realStartEl = $('#note_real_start');
    if(realStartEl) realStartEl.value = note.real_start || '';
    
    const realEndEl = $('#note_real_end');
    if(realEndEl) realEndEl.value = note.real_end || '';
    
    // Populate SOAP fields
    const presentationEl = $('#note_presentation');
    if(presentationEl) presentationEl.value = note.presentation || '';
    
    const subjectiveEl = $('#note_subjective');
    if(subjectiveEl) subjectiveEl.value = note.subjective || '';
    
    const objectiveEl = $('#note_objective');
    if(objectiveEl) objectiveEl.value = note.objective || '';
    
    const analysisEl = $('#note_analysis');
    if(analysisEl) analysisEl.value = note.analysis || '';
    
    const planEl = $('#note_plan_obs');
    if(planEl) planEl.value = note.plan_obs || '';
    
    // Populate vitals if seguimiento
    if(note.tipo === 'seguimiento'){
      const vitalsOkEl = $('#vitals_ok');
      if(vitalsOkEl) vitalsOkEl.checked = note.vitals_ok === true;
      
      if(!note.vitals_ok){
        $('#v_ta').value = note.v_ta || '';
        $('#v_spo2').value = note.v_spo2 || '';
        $('#v_fc').value = note.v_fc || '';
      }
    }
    
    // Populate tipo-specific fields
    if(note.tipo === 'negacion'){
      const negReasonEl = $('#neg_reason');
      if(negReasonEl) negReasonEl.value = note.neg_reason || '';
    } else if(note.tipo === 'cancelacion_justificada'){
      $('#cj_vitals').checked = note.cj_vitals === true;
      $('#cj_medical').checked = note.cj_medical === true;
      $('#cj_house').checked = note.cj_house === true;
      $('#cj_who').value = note.cj_who || '';
      $('#cj_time').value = note.cj_time || '';
      $('#cj_ta').value = note.cj_ta || '';
      $('#cj_spo2').value = note.cj_spo2 || '';
      $('#cj_fc').value = note.cj_fc || '';
      $('#not_detail').value = note.not_detail || '';
    } else if(note.tipo === 'notificacion'){
      const detailEl = $('#not_detail');
      if(detailEl) detailEl.value = note.not_detail || '';
    } else if(note.tipo === 'cumplimiento'){
      const planEl = $('#cum_plan_select');
      if(planEl) planEl.value = note.cumplimiento_plan || '';
      
      const obsEl = $('#cum_obs');
      if(obsEl) obsEl.value = note.cumplimiento_obs || '';
      
      $('#cj_vitals').checked = note.cj_vitals === true;
      if(note.cj_vitals){
        $('#cj_who').value = note.cj_who || '';
        $('#cj_time').value = note.cj_time || '';
        $('#cj_ta').value = note.cj_ta || '';
        $('#cj_spo2').value = note.cj_spo2 || '';
        $('#cj_fc').value = note.cj_fc || '';
      }
    }
    
    // Update status
    const statusEl = $('#note_status');
    if(statusEl) statusEl.textContent = note.status || 'Borrador';
  }

  // Save draft
  function saveDraft(){
    let note = collectNote();
    note.status = 'Borrador';
    note.updatedAt = new Date().toISOString();
    if(!note.id) note.id = ensureNoteId();
    if(!note.createdAt) note.createdAt = note.updatedAt;
    
    // Usar saveUpsertNote para guardar (incluyendo JSON si es firmada)
    saveUpsertNote(note);
    
    currentDraft = note;
    
    const msgEl = $('#note_msg');
    if(msgEl) msgEl.textContent = 'Borrador guardado correctamente';
    setTimeout(() => {
      if(msgEl) msgEl.textContent = '';
    }, 2500);
    
    renderNotesList();
  }

  // Sign and save
  function signAndSave(){
    let note = collectNote();
    note.status = 'Firmada';
    note.signedAt = new Date().toISOString();
    note.updatedAt = note.signedAt;
    if(!note.id) note.id = ensureNoteId();
    if(!note.createdAt) note.createdAt = note.updatedAt;
    
    // Usar saveUpsertNote para guardar (incluyendo JSON)
    saveUpsertNote(note);
    
    // Update asistencia
    setAsistenciaForNote(note);
    
    currentDraft = note;
    
    const msgEl = $('#note_msg');
    if(msgEl) msgEl.textContent = 'Nota firmada correctamente';
    setTimeout(() => {
      if(msgEl) msgEl.textContent = '';
    }, 2500);
    
    renderNotesList();
    window.showView('view_seguimiento');
  }

  // Prompt sign note by ID
  function promptSignNoteById(id){
    const notes = loadNotes();
    const note = notes.find(n => n.id === id);
    if(!note) return;
    
    // Check if PIN is required based on responsable prefix
    if(!note.responsable) return alert('Seleccione responsable antes de firmar');
    
    const prefix = (note.responsable_prefix || '').toUpperCase();
    const expectedPin = RESPONSABLE_PINS[note.responsable] || DEFAULT_PIN;
    
    // If prefix requires PIN, open modal
    if(prefix === 'LFT' || prefix === 'PSS'){
      openPinForResponsable(note.responsable, expectedPin, function(success){
        if(!success) return;
        note.status = 'Firmada';
        note.signedAt = new Date().toISOString();
        note.updatedAt = note.signedAt;
        saveUpsertNote(note);
        try{ setAsistenciaForNote(note); }catch(e){}
        renderNotesList();
      });
    } else {
      // No PIN required, sign directly
      note.status = 'Firmada';
      note.signedAt = new Date().toISOString();
      note.updatedAt = note.signedAt;
      saveUpsertNote(note);
      try{ setAsistenciaForNote(note); }catch(e){}
      renderNotesList();
    }
  }

  // Track current draft
  let currentDraft = null;

  // Initialize when view is shown or on DOM ready
  document.addEventListener('DOMContentLoaded', ()=>{ initWhenVisible(); });
  function initWhenVisible(){
    initAddNote();
  }

  // helpers for floating countdown
  function setCountdownFloating(show){ const el = document.getElementById('note_countdown'); if(!el) return; if(show) el.classList.add('floating'); else el.classList.remove('floating'); }

  // Migración automática: guardar notas de localStorage a JSON
  function autoMigrateNotesToJSON(){
    try {
      const notas = loadNotes();
      if(!notas || notas.length === 0) return;
      
      const paciente = getPatientId();
      console.log(`🔄 Auto-migrando ${notas.length} notas a JSON...`);
      
      let migrados = 0;
      notas.forEach(nota => {
        if(nota.paciente === paciente && nota.fecha && window.DataController) {
          window.DataController.saveMonthly('notas', nota.paciente, nota.fecha, nota)
            .then(success => {
              if(success) {
                migrados++;
                console.log(`✅ Nota migrada: ${nota.id}`);
              }
            })
            .catch(e => console.warn(`⚠️ Error migrando nota ${nota.id}:`, e));
        }
      });
    } catch(e) {
      console.warn('Error en auto-migración de notas:', e);
    }
  }

  // re-init when SPA navigates to view_addnote; also toggle floating countdown visibility
  const origShow = window.showView;
  if(origShow){
    window.showView = function(id){ origShow(id);
      if(id === 'view_addnote'){
        setTimeout(()=>{ initAddNote(); }, 60);
        setCountdownFloating(true);
      } else {
        setCountdownFloating(false);
      }
      // when navigating to seguimiento, update the notes list and auto-migrate
      if(id === 'view_seguimiento'){
        setTimeout(()=>{ renderNotesList(); }, 50);
        setTimeout(autoMigrateNotesToJSON, 100); // Auto-migrate notes to JSON
      }
    };
  }

  // Attach filter change listener once so list updates immediately when user selects a tipo
  document.addEventListener('DOMContentLoaded', ()=>{
    const f = document.getElementById('notes_filter_tipo');
    if(f) f.addEventListener('change', ()=>{ renderNotesList(); });
    // Pin modal buttons ya están vinculados por plan.js que ahora soporta _note_pin_cb
  });

  // expose for debugging and external access
  window._addNote = { 
    saveDraft, 
    signAndSave, 
    collectNote,
    deleteNoteById,
    renderNotesList,
    loadNoteIntoForm,
    promptSignNoteById,
    clearNoteForm
  };

})();
