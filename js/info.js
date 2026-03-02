/* js/info.js
   Handles editing and signed saving of Información general inside expediente.
   - Loads/saves an entry in 'usuarios' (client DB) keyed by paciente (userName text)
   - Editing requires opening the shared PIN modal; only on successful PIN the data is persisted
   - Updates the Última edición label with the saved timestamp
*/
(function(){
  // DEBUG: log when script starts
  console.log('✅ info.js loaded');
  function $(s){ return document.querySelector(s); }
  function getPatientId(){ const el = document.getElementById('userName'); return el && el.textContent.trim() ? el.textContent.trim() : 'patient_default'; }

  let currentRecord = null;

  async function loadFromDB(){ try{
      const pid = getPatientId();
      console.log('🔍 Buscando info para:', pid);
      
      // Primero intentar cargar de DataController (info.json)
      if(window.DataController && typeof window.DataController.loadUsuariaInfo === 'function'){
        try {
          const userData = await window.DataController.loadUsuariaInfo(pid);
          console.log('📥 userData recibido:', userData);
          
          if(userData){
            console.log('✅ Información cargada de info.json:', userData);
            // Convertir exactamente sin inventar datos
            return {
              paciente: pid,
              nombre: userData.nombre || '-',
              habitacion: userData.habitacion || '-',
              fnac: userData.fecha_nacimiento || '-',
              edad: userData.edad || '-',
              tipologia: userData.tipologia || '-',
              motivo: userData.motivo_de_fisioterapia || '-',
              plan: userData.plan_general || '-',
              ant_pat: userData.antecedentes_patologicos || '-',
              ant_orto: userData.antecedentes_ortopedicos || '-',
              medicamentos: userData.medicamentos || '-',
              sindromes: userData.sindromes_geriatricos || '-',
              consideraciones: userData.consideraciones_especiales || '-',
              updatedAt: new Date().toISOString()
            };
          }
        } catch(e) {
          console.warn('⚠️ Error cargando de info.json:', e);
        }
      }
      
      // Fallback: intentar cargar de window.DB
      if(window.DB && window.DB.load){ 
        try {
          const users = window.DB.load('usuarios') || []; 
          const found = users.find(u=>u.paciente === pid); 
          if(found) return found;
        } catch(e) {
          console.warn('DB.load failed:', e);
        }
      }
      
      return null;
    }catch(e){ console.warn('loadFromDB error', e); return null; } }

  async function saveToDB(obj){ try{
      console.log('💾 saveToDB called with:', obj);
      
      if(window.DataController && typeof window.DataController.saveUsuariaInfo === 'function'){
        // Usar el nombre actual de la usuaria (para ubicar la carpeta correcta)
        const nombre = (currentRecord && currentRecord.nombre) || getPatientId();
        console.log('📝 Usando nombre:', nombre);
        
        // Map campos del form a campos del info.json
        const datosParaGuardar = {
          nombre: obj.info_nombre || nombre,
          habitacion: obj.info_habitacion || '',
          fecha_nacimiento: obj.info_fnac || '',
          edad: obj.info_edad || '',
          tipologia: obj.info_tipologia || '',
          motivo_de_fisioterapia: obj.info_motivo || '',
          plan_general: obj.info_plan || '',
          antecedentes_patologicos: obj.info_ant_pat || '',
          antecedentes_ortopedicos: obj.info_ant_orto || '',
          medicamentos: obj.info_medicamentos || '',
          sindromes_geriatricos: obj.info_sindromes || '',
          consideraciones_especiales: obj.info_consideraciones || ''
        };
        
        console.log('💾 datosParaGuardar:', datosParaGuardar);
        const resultado = await window.DataController.saveUsuariaInfo(nombre, datosParaGuardar);
        console.log('🔄 resultado de saveUsuariaInfo:', resultado);
        
        if(resultado && resultado.success){
          console.log('✅ Información guardada exitosamente');
          // Mapear de vuelta a formato interno
          const mapped = {
            paciente: obj.paciente || getPatientId(),
            nombre: resultado.datos.nombre,
            habitacion: resultado.datos.habitacion,
            fnac: resultado.datos.fecha_nacimiento,
            edad: resultado.datos.edad,
            tipologia: resultado.datos.tipologia,
            motivo: resultado.datos.motivo_de_fisioterapia,
            plan: resultado.datos.plan_general,
            ant_pat: resultado.datos.antecedentes_patologicos,
            ant_orto: resultado.datos.antecedentes_ortopedicos,
            medicamentos: resultado.datos.medicamentos,
            sindromes: resultado.datos.sindromes_geriatricos,
            consideraciones: resultado.datos.consideraciones_especiales,
            updatedAt: resultado.datos.updatedAt
          };
          console.log('📦 mapped object:', mapped);
          return mapped;
        }else{
          console.error('❌ Error guardando - resultado.success es falso:', resultado);
          return null;
        }
      }
      if(window.DB && window.DB.upsert){ return window.DB.upsert('usuarios', obj); }
      console.warn('⚠️ Fallback: retornando obj sin mapeo');
      return obj;
    }catch(e){ console.error('❌ saveToDB error:', e); return null; } }

  function formatDateTime(iso){ if(!iso) return '—'; try{ return window.formatDateTimeES(iso); }catch(e){ return iso; } }

  // slugify heading text to a safe key
  function slug(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''); }

  function collectBlockText(startEl, stopTagName){ // gather text of siblings up to next same-level heading
    let txt = '';
    let el = startEl.nextElementSibling;
    while(el){
      if(el.tagName && el.tagName.toLowerCase()===stopTagName) break;
      // guard: if we reach controls/buttons area, stop to avoid including UI elements
      try{
        if(el.matches && (el.matches('button') || el.matches('.btn') || (el.id && el.id.indexOf('btn')===0))) break;
        if(el.querySelector && el.querySelector('button, .btn, [id^="btn"]')) break;
      }catch(e){}
      txt += (el.innerText || '') + '\n\n'; el = el.nextElementSibling;
    }
    return txt.trim();
  }

  // Mapeo de títulos de h3 a IDs de elementos del HTML
  const h3ToIdMap = {
    'diagnóstico / motivo actual': 'info_motivo',
    'plan de tratamiento general': 'info_plan',
    'antecedentes patológicos': 'info_ant_pat',
    'antecedentes ortopédicos': 'info_ant_orto',
    'medicamentos': 'info_medicamentos',
    'síndromes geriátricos': 'info_sindromes',
    'consideraciones especiales': 'info_consideraciones'
  };

  function h3TitleToFieldId(h3Text) {
    const lower = (h3Text || '').toLowerCase().trim();
    return h3ToIdMap[lower] || ('info_' + slug(lower));
  }

  function setBlockContent(startEl, text){
    let el = startEl.nextElementSibling;
    let parts = String(text||'').split(/\n\n/);
    let i = 0;
    while(el && i < parts.length){
      try{
        if(el.matches && (el.matches('button') || el.matches('.btn') || (el.id && el.id.indexOf('btn')===0))) break;
        if(el.querySelector && el.querySelector('button, .btn, [id^="btn"]')) break;
      }catch(e){}
      if(el.tagName && el.tagName.toLowerCase()==='ul'){
        const lines = parts[i].split(/\n/).map(l=>l.trim()).filter(Boolean);
        el.innerHTML = lines.map(l=>`<li>${escapeHtmlText(l)}</li>`).join('');
      } else if(el.tagName && (el.tagName.toLowerCase()==='div' || el.tagName.toLowerCase()==='p' || el.tagName.toLowerCase()==='section')){
        el.innerText = parts[i];
      } else if(el.tagName && (el.tagName.toLowerCase()==='label' || el.tagName.toLowerCase()==='article')){
        el.innerText = parts[i];
      }
      i++; el = el.nextElementSibling;
      if(el && el.tagName && el.tagName.toLowerCase()==='h3') break;
    }
  }

  function escapeHtmlText(s){ if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function populateForm(rec){ // rec may be null
    try{
      console.log('📝 populateForm called with:', rec);
      if(!rec) rec = {};
      
      // Llenar inputs
      const ids = ['info_nombre','info_habitacion','info_fnac','info_edad','info_tipologia'];
      ids.forEach(id=>{ 
        const el = document.getElementById(id); 
        if(el){
          const fieldName = id.replace('info_','');
          let val = rec[fieldName] || rec[id] || '-';
          
          console.log(`  📝 Setting ${id} = ${val}`);
          
          // Para inputs date, no usar '-'
          if(el.type === 'date' && val === '-') {
            val = '';
          }
          
          if(el.tagName.toLowerCase()==='input' || el.tagName.toLowerCase()==='textarea') {
            el.value = val;
          } else {
            el.innerText = val;
          }
        }
      });

      // Llenar divs de texto
      const textFields = {
        'info_motivo': rec.motivo || '-',
        'info_plan': rec.plan || '-',
        'info_consideraciones': rec.consideraciones || '-'
      };
      
      Object.entries(textFields).forEach(([id, val]) => {
        const el = document.getElementById(id);
        console.log(`  📝 Setting div ${id} = ${val}`);
        if(el) el.innerText = val;
      });
      
      // Llenar listas (ul)
      const listFields = {
        'info_ant_pat': rec.ant_pat || '-',
        'info_ant_orto': rec.ant_orto || '-',
        'info_medicamentos': rec.medicamentos || '-',
        'info_sindromes': rec.sindromes || '-'
      };
      
      Object.entries(listFields).forEach(([id, val]) => {
        const el = document.getElementById(id);
        console.log(`  📝 Setting list ${id} = ${val}`);
        if(el) {
          if(val === '-' || val === '') {
            el.innerHTML = '<li>-</li>';
          } else {
            // Si es string con saltos de línea, dividir en items
            const items = String(val).split(/\n/).map(l => l.trim()).filter(Boolean);
            el.innerHTML = items.length > 0 
              ? items.map(item => `<li>${escapeHtmlText(item)}</li>`).join('')
              : '<li>-</li>';
          }
        }
      });

      const updated = rec && (rec.updatedAt || rec.signedAt || rec.createdAt) || null;
      const label = document.getElementById('last_edit_label'); 
      if(label) label.textContent = 'Última edición: ' + (updated ? formatDateTime(updated) : '—');
      
      console.log('✅ populateForm completed');
    }catch(e){ console.error('❌ populateForm error:', e); }
  }

  function setEditing(enabled){
    const container = document.getElementById('exp_info'); if(!container) return;
    // enable/disable native inputs/selects
    const formEls = container.querySelectorAll('input,textarea,select');
    formEls.forEach(el=>{ el.disabled = !enabled; if(enabled) el.classList.add('input'); });

    if(enabled){
      // For each section (h3) that doesn't already contain form controls, create a generated textarea for editing
      const headings = Array.from(container.querySelectorAll('h3'));
      headings.forEach(h=>{
        // check if following siblings contain form controls
        let el = h.nextElementSibling; let hasForm=false;
        while(el){ if(el.tagName && el.tagName.toLowerCase()==='h3') break; if(el.querySelector && el.querySelector('input,textarea,select')){ hasForm=true; break; } el = el.nextElementSibling; }
        if(hasForm) return; // leave existing controls alone
        const key = h3TitleToFieldId(h.textContent || h.innerText);
        // if already generated textarea exists, show it
        let gen = container.querySelector(`textarea.generated[data-field="${key}"]`);
        if(!gen){
          const val = collectBlockText(h,'h3');
          gen = document.createElement('textarea'); gen.className = 'input generated'; gen.setAttribute('data-field', key); gen.style.minHeight = '100px'; gen.value = val;
          // insert right after heading
          h.parentNode.insertBefore(gen, h.nextElementSibling);
        } else {
          gen.style.display = '';
        }
        // hide original following siblings until next h3, but stop if we reach buttons/controls
        el = gen.nextElementSibling; while(el && !(el.tagName && el.tagName.toLowerCase()==='h3')){
          try{
            if(el.matches && (el.matches('button') || el.matches('.btn') || (el.id && el.id.indexOf('btn')===0))) break;
            if(el.querySelector && el.querySelector('button, .btn, [id^="btn"]')) break;
          }catch(e){}
          if(!el.dataset._origDisplay) el.dataset._origDisplay = el.style.display || ''; el.style.display = 'none'; el = el.nextElementSibling;
        }
      });
    } else {
      // disabling: remove generated textareas and restore original display, updating block content from textarea values
      const gens = Array.from(container.querySelectorAll('textarea.generated'));
      gens.forEach(gen=>{
        // find preceding h3
        let h = gen.previousElementSibling; while(h && !(h.tagName && h.tagName.toLowerCase()==='h3')) h = h.previousElementSibling;
        if(h) setBlockContent(h, gen.value);
        // restore hidden siblings
        let el = gen.nextElementSibling; while(el && !(el.tagName && el.tagName.toLowerCase()==='h3')){ if(el.dataset && el.dataset._origDisplay !== undefined){ el.style.display = el.dataset._origDisplay; delete el.dataset._origDisplay; } el = el.nextElementSibling; }
        gen.remove();
      });
      // ensure inputs disabled
      const formEls2 = container.querySelectorAll('input,textarea,select'); formEls2.forEach(el=>{ el.disabled = true; });
    }

    $('#btn_save_info').style.display = enabled ? '' : 'none';
    $('#btn_cancel_info').style.display = enabled ? '' : 'none';
    $('#btn_edit_info').style.display = enabled ? 'none' : '';
  }

  
  function gatherForm(){
    const payload = { paciente: getPatientId() };
    // Recolectar inputs y divs/listas por su ID real del HTML
    const ids = ['info_nombre','info_habitacion','info_fnac','info_edad','info_tipologia','info_motivo','info_plan','info_ant_pat','info_ant_orto','info_medicamentos','info_sindromes','info_consideraciones'];
    ids.forEach(id=>{ 
      const el = document.getElementById(id); 
      if(el){ 
        if(el.tagName === 'UL'){
          // Para listas, recopilar items de <li>
          const items = Array.from(el.querySelectorAll('li')).map(li => li.textContent.trim()).filter(t => t !== '-');
          payload[id] = items.length > 0 ? items.join('\n') : '';
        } else {
          // Para inputs y divs
          payload[id] = (el.value !== undefined) ? el.value : el.textContent;
        }
      } 
    });
    // collect generated section editors (en caso de modo edición con textareas generadas)
    const gens = document.querySelectorAll('#exp_info textarea.generated'); 
    gens.forEach(t=>{ 
      const k = t.dataset.field || ('info_' + slug((t.previousElementSibling&&t.previousElementSibling.textContent)||'section')); 
      payload[k] = t.value; 
    });
    return payload;
  }

  // Wire UI
  document.addEventListener('DOMContentLoaded', ()=>{
    const editBtn = document.getElementById('btn_edit_info'); const saveBtn = document.getElementById('btn_save_info'); const cancelBtn = document.getElementById('btn_cancel_info');

    if(editBtn) editBtn.addEventListener('click', ()=>{ setEditing(true); });
    if(cancelBtn) cancelBtn.addEventListener('click', ()=>{ // revert
      populateForm(currentRecord); setEditing(false);
    });

    if(saveBtn) saveBtn.addEventListener('click', ()=>{
      // gather and require PIN before saving
      const payload = gatherForm(); // attach id if editing existing
      // Asociar el id de la paciente actual si existe en sessionStorage
      const raw = sessionStorage.getItem('paciente_actual');
      if(raw){
        const pacienteActual = JSON.parse(raw);
        if(pacienteActual.id){
          payload.paciente = pacienteActual.id;
          payload.id = pacienteActual.id;
        }
      } else if(currentRecord && currentRecord.id){
        payload.id = currentRecord.id;
      }
      // Require PIN: reuse openPinModal if available, otherwise prompt
      const afterSave = async function(success){ 
        if(!success){ 
          alert('PIN inválido. La información no se guardó.'); 
          return; 
        }
        
        payload.status = 'Firmada'; 
        payload.signedAt = new Date().toISOString(); 
        payload.updatedAt = payload.signedAt; 
        payload.signedBy = 'info_edit';
        
        console.log('💾 Payload antes de guardar:', payload);
        const saved = await saveToDB(payload); 
        console.log('✅ Respuesta de saveToDB:', saved);
        
        if(saved){ 
          console.log('🔄 Actualizando currentRecord:', saved);
          currentRecord = saved; 
          console.log('📝 currentRecord después de actualizar:', currentRecord);
          populateForm(currentRecord); 
          setEditing(false); 
          setTimeout(()=>{ 
            const label = $('#last_edit_label');
            if(label) label.textContent = 'Última edición: ' + formatDateTime(saved.updatedAt || saved.signedAt || saved.createdAt); 
          },40); 
        } else {
          console.error('❌ saveToDB retornó null/falsy');
        }
      };

      if(typeof openPinModal === 'function'){ // ask for PIN — accept any configured responsable PINs
        // use special token 'ALL' so the modal accepts DEFAULT_PIN + all RESPONSABLE_PINS defined in plan.js
        openPinModal('Editar Información', 'ALL', afterSave);
      } else {
        // fallback: en Electron, no hay prompt(), así que simplemente proceder sin PIN
        console.warn('⚠️ PIN modal no disponible, guardando sin verificación');
        afterSave(true);
      }
    });

    // load data when expediente view is shown
    const origShow = window.showView;
    if(origShow){
      window.showView = function(id){
        origShow(id);
        if(id === 'view_expediente'){
          setTimeout(async ()=>{
            try{
              console.log('📂 Cargando información general...');
              const pid = getPatientId();
              console.log('👤 Patient ID:', pid);
              
              // Intentar cargar de DataController primero (info.json)
              currentRecord = await loadFromDB();
              console.log('📋 Registro cargado:', currentRecord);
              
              if(currentRecord) {
                populateForm(currentRecord);
              } else {
                console.warn('⚠️ No se cargaron datos, usando formulario vacío');
                // build a record from current DOM values as baseline (do not persist until signed)
                const base = gatherForm(); 
                base.createdAt = null; 
                base.updatedAt = null; 
                currentRecord = base; 
                populateForm(currentRecord);
              }
              setEditing(false);
            }catch(e){ console.error('❌ showView exp load error:', e); }
          },50);
        }
      }
    }
  });

  window._info = { loadFromDB, saveToDB, populateForm };
})();
