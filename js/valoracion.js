(function(){
  // Enhanced valoracion manager implementing the requested behaviors
  function $(s){ return document.querySelector(s); }
  function getPatientId(){ const el = document.getElementById('userName'); return el && el.textContent.trim() ? el.textContent.trim() : 'patient_default'; }

  // Persistence helpers
  function loadVals(){ 
    try{ 
      if(window.DB && window.DB.load) return window.DB.load('valoraciones') || []; 
      const vals = [];
      const raw = localStorage.getItem('hsv_valoraciones_v1'); 
      if(raw) vals.push(...JSON.parse(raw));
      
      // Cargar valoraciones del JSON si localStorage está vacío o incompleto
      const jsonVals = [];
      if(window.DataController && typeof window.DataController.loadMonthlySyncFromMain === 'function'){
        try{
          const paciente = getPatientId();
          const hoy = new Date();
          const mesActual = String(hoy.getMonth() + 1).padStart(2, '0') + String(hoy.getFullYear());
          const mesPasado = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
          const mesPasadoStr = String(mesPasado.getMonth() + 1).padStart(2, '0') + String(mesPasado.getFullYear());
          
          [mesActual, mesPasadoStr].forEach(mes => {
            const loaded = window.DataController.loadMonthlySyncFromMain('valoraciones', paciente, mes.slice(-4) + '-' + mes.slice(0, 2) + '-01');
            if(Array.isArray(loaded)){
              loaded.forEach(jsonVal => {
                jsonVals.push(jsonVal);
                if(!vals.find(v => v.id === jsonVal.id)){
                  vals.push(jsonVal);
                }
              });
            }
          });
        }catch(e){ 
          console.warn('Error cargando valoraciones del JSON:', e); 
        }
      }
      
      // LIMPIEZA: Eliminar valoraciones de localStorage que ya NO existen en JSON y están firmadas
      const valsLimpias = vals.filter(val => {
        if(val.status === 'Firmada'){
          const existeEnJSON = jsonVals.find(jv => jv.id === val.id);
          if(!existeEnJSON){
            console.log('🗑️ Eliminando valoración firmada que no existe en JSON:', val.id);
            return false;
          }
        }
        return true;
      });
      
      // Sincronizar back a localStorage
      try{ localStorage.setItem('hsv_valoraciones_v1', JSON.stringify(valsLimpias || [])); }catch(e){ console.warn('Error sincronizando valoraciones:', e); }
      return valsLimpias;
    }catch(e){ return []; } 
  }
  function saveVals(arr){ try{ if(window.DB && window.DB.save) return window.DB.save('valoraciones', arr||[]); localStorage.setItem('hsv_valoraciones_v1', JSON.stringify(arr||[])); }catch(e){console.warn('saveVals',e);} }
  function upsertVal(v){ 
    try{ 
      if(window.DB && window.DB.upsert){ 
        if(!v.id) v.id = window.DB.generateId('valoraciones'); 
        v.updatedAt = new Date().toISOString(); 
        if(!v.createdAt) v.createdAt = v.updatedAt; 
        window.DB.upsert('valoraciones', v); 
        // También guardar en JSON
        saveValToJSON(v);
        return; 
      } 
    }catch(e){console.warn('DB.upsert valoracion',e);} 
    
    const arr = loadVals(); 
    if(!v.id) v.id = 'val_'+Math.random().toString(36).slice(2,9); 
    v.updatedAt = new Date().toISOString(); 
    const ix = arr.findIndex(x=>x.id===v.id); 
    if(ix>=0) arr[ix]=Object.assign({},arr[ix],v); 
    else arr.push(v); 
    saveVals(arr);
    // También guardar en JSON
    saveValToJSON(v);
  }

  // Normalizar valoración al formato JSON estándar
  function normalizeValoracionForJSON(v) {
    // Asegurar que todos los campos existan en el orden correcto
    return {
      id: v.id || '',
      paciente: v.paciente || '',
      fecha: v.fecha || '',
      hora_start: v.hora_start || '',
      hora_end: v.hora_end || '',
      tipo: v.tipo || '',
      responsable: v.responsable || '',
      responsable_prefix: v.responsable_prefix || '',
      apoyo: v.apoyo || '',
      apoyo_prefix: v.apoyo_prefix || '',
      status: v.status || 'Borrador',
      antecedentes: Array.isArray(v.antecedentes) ? v.antecedentes : [],
      alicia: {
        a: v.alicia?.a || '',
        l: v.alicia?.l || '',
        i: v.alicia?.i || '',
        c: v.alicia?.c || '',
        i2: v.alicia?.i2 || '',
        a2: v.alicia?.a2 || ''
      },
      postura: {
        anterior: v.postura?.anterior || '',
        lateral: v.postura?.lateral || '',
        posterior: v.postura?.posterior || '',
        cefalo: v.postura?.cefalo || ''
      },
      goniometria: Array.isArray(v.goniometria) ? v.goniometria.map(g => ({
        joint: g.joint || '',
        movement: g.movement || '',
        left: g.left !== undefined ? g.left : null,
        right: g.right !== undefined ? g.right : null,
        expected: g.expected !== undefined ? g.expected : null
      })) : [],
      daniels: Array.isArray(v.daniels) ? v.daniels : [],
      marcha: {
        phases: Array.isArray(v.marcha?.phases) ? v.marcha.phases : [],
        description: v.marcha?.description || '',
        constants: v.marcha?.constants || {}
      },
      escalas: {
        pruebas: v.escalas?.pruebas || {},
        sppb: v.escalas?.sppb || {},
        tinetti: v.escalas?.tinetti || {},
        frail: v.escalas?.frail || {},
        downton: v.escalas?.downton || {},
        katz: v.escalas?.katz || {},
        lawton: v.escalas?.lawton || {},
        customs: Array.isArray(v.escalas?.customs) ? v.escalas.customs : []
      },
      diagnostico: v.diagnostico || '',
      signedAt: v.signedAt || '',
      updatedAt: v.updatedAt || new Date().toISOString(),
      createdAt: v.createdAt || new Date().toISOString(),
      responsable_signed: v.responsable_signed || ''
    };
  }

  // Guardar valoración en JSON usando DataController
  function saveValToJSON(v){
    if(v.paciente && v.fecha && window.DataController){
      try{
        const fecha = v.fecha || new Date().toISOString().slice(0, 10);
        const paciente = v.paciente;
        const vNormalizada = normalizeValoracionForJSON(v);
        // Llamar saveMonthly (fire and forget)
        window.DataController.saveMonthly('valoraciones', paciente, fecha, vNormalizada).then(success => {
          if(success) console.log('✅ Valoración guardada en JSON:', v.id, 'Status:', v.status);
          else console.warn('⚠️ Error guardando valoración en JSON');
        }).catch(e => {
          console.error('Error guardando valoración en JSON:', e);
        });
      }catch(e){
        console.error('Error guardando valoración en JSON:', e);
      }
    }
  }

  function escapeHtml(s){ if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }

  // Automatic autosave removed: only manual "Guardar como borrador" or explicit sign actions will persist data.

  // Format a date into long Spanish form: "Jueves 13 de Noviembre de 2025"
  function formatDateLongES(dateInput){ try{ if(!dateInput) return ''; let d; if(typeof dateInput === 'string'){ // accept YYYY-MM-DD or ISO
      if(/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) d = new Date(dateInput + 'T00:00'); else d = new Date(dateInput);
    } else { d = dateInput; }
    if(!d || isNaN(d.getTime())) return String(dateInput);
    const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return `${days[d.getDay()]} ${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
  }catch(e){ return String(dateInput||''); } }

  // Render list of valoraciones for current patient
  function renderList(){
    const pid = getPatientId(); const list = loadVals().filter(x=>x.paciente===pid); const container = $('#valoraciones_list'); if(!container) return; container.innerHTML=''; if(!list.length){ container.innerHTML = '<div class="section">No hay valoraciones para este expediente.</div>'; return; }
    list.sort((a,b)=> new Date(b.updatedAt||b.createdAt) - new Date(a.updatedAt||a.createdAt));
    list.forEach(v=>{
      const d = document.createElement('div'); d.className='card'; d.style.marginBottom='8px';
      // header: type + date on left, responsible/apoyo/status on right
      const hdr = document.createElement('div'); hdr.style.display='flex'; hdr.style.justifyContent='space-between'; hdr.style.alignItems='center';
      const left = document.createElement('div'); const title = document.createElement('strong'); title.textContent = 'Valoración'; left.appendChild(title);
      const dateLabel = document.createElement('div'); dateLabel.style.color='var(--muted)'; dateLabel.style.fontSize='0.9rem'; dateLabel.style.marginTop='4px'; dateLabel.textContent = formatDateLongES(v.fecha) || formatDateLongES(v.updatedAt||v.createdAt) || '';
      left.appendChild(dateLabel);
      // show hora (start - end) if present
      const timeLabel = document.createElement('div'); timeLabel.style.color='var(--muted)'; timeLabel.style.fontSize='0.9rem'; timeLabel.style.marginTop='2px';
      const hs = v.hora_start || ''; const he = v.hora_end || ''; timeLabel.textContent = hs ? ('Hora: ' + hs + (he ? (' - ' + he) : '')) : '';
      if(timeLabel.textContent) left.appendChild(timeLabel);
      // show explicit tipo below the date/time
      const tipoLabel = document.createElement('div'); tipoLabel.style.color='var(--muted)'; tipoLabel.style.fontSize='0.95rem'; tipoLabel.style.marginTop='4px'; tipoLabel.textContent = 'Tipo de valoración: ' + (v.tipo || '—'); left.appendChild(tipoLabel);
      const right = document.createElement('div'); right.style.fontSize='0.9rem'; right.style.color='var(--muted)'; right.style.textAlign='right';
      const resp = document.createElement('div');
      // include prefix (PSS/LFT/EF) when available and label as Responsable:
      const respPrefix = v.responsable_prefix || v.responsablePrefix || (window.getResponsablePrefix ? window.getResponsablePrefix(v.responsable) : '');
      const respName = respPrefix ? (respPrefix + ' ' + (v.responsable || '')) : (v.responsable || '');
      resp.textContent = respName ? ('Responsable: ' + respName) : '';
      const apoyo = document.createElement('div');
      const apoyoPrefix = v.apoyo_prefix || v.apoyoPrefix || (window.getApoyoPrefix ? window.getApoyoPrefix(v.apoyo) : '');
      apoyo.textContent = v.apoyo ? ('Apoyo: ' + (apoyoPrefix ? (apoyoPrefix + ' ' + v.apoyo) : v.apoyo)) : '';
      const estado = document.createElement('div'); estado.textContent = v.status ? ('Estado: ' + v.status) : '';
      right.appendChild(resp); if(apoyo.textContent) right.appendChild(apoyo); if(estado.textContent) right.appendChild(estado);
      hdr.appendChild(left); hdr.appendChild(right); d.appendChild(hdr);

      const body = document.createElement('div'); body.style.marginTop='8px'; body.style.whiteSpace='pre-wrap'; body.innerHTML = escapeHtml(v.summary||v.detalle||''); d.appendChild(body);

      // Previously we displayed a small goniometría summary in the list cards.
      // Per UI change, do not show goniometría inside the compact list cards to keep them concise.

      // actions
      const actions = document.createElement('div'); actions.style.display='flex'; actions.style.gap='8px'; actions.style.justifyContent='flex-end'; actions.style.marginTop='8px';
      if(v.status === 'Firmada'){
        const btnView = document.createElement('button'); btnView.className='btn btn-view'; btnView.textContent = 'Ver resumen de la valoración'; btnView.addEventListener('click', ()=>{ viewValoracion(v.id); }); actions.appendChild(btnView);
      } else {
        const btnEdit = document.createElement('button'); btnEdit.className='btn btn-edit'; btnEdit.textContent='Editar'; btnEdit.addEventListener('click', ()=>{ editValoracion(v.id); });
        const btnSign = document.createElement('button'); btnSign.className='btn btn-sign'; btnSign.textContent='Firmar'; btnSign.addEventListener('click', ()=>{ signValoracion(v.id); });
        const btnDel = document.createElement('button'); btnDel.className='btn btn-del'; btnDel.textContent='Eliminar'; btnDel.addEventListener('click', ()=>{ deleteValoracion(v.id); });
        actions.appendChild(btnEdit); actions.appendChild(btnSign); actions.appendChild(btnDel);
      }
      d.appendChild(actions);
      container.appendChild(d);
    });
    list.forEach(v=>{
      const d = document.createElement('div'); d.className='card'; d.style.marginBottom='8px';
      // header: type + date on left, responsible/apoyo/status on right
      const hdr = document.createElement('div'); hdr.style.display='flex'; hdr.style.justifyContent='space-between'; hdr.style.alignItems='center';
  const left = document.createElement('div'); const title = document.createElement('strong'); title.textContent = 'Valoración'; left.appendChild(title);
  const dateLabel = document.createElement('div'); dateLabel.style.color='var(--muted)'; dateLabel.style.fontSize='0.9rem'; dateLabel.style.marginTop='4px'; dateLabel.textContent = formatDateLongES(v.fecha) || formatDateLongES(v.updatedAt||v.createdAt) || '';
  left.appendChild(dateLabel);
  // show hora (start - end) if present
  const timeLabel = document.createElement('div'); timeLabel.style.color='var(--muted)'; timeLabel.style.fontSize='0.9rem'; timeLabel.style.marginTop='2px';
  const hs = v.hora_start || ''; const he = v.hora_end || ''; timeLabel.textContent = hs ? ('Hora: ' + hs + (he ? (' - ' + he) : '')) : '';
  if(timeLabel.textContent) left.appendChild(timeLabel);
  // show explicit tipo below the date/time
  const tipoLabel = document.createElement('div'); tipoLabel.style.color='var(--muted)'; tipoLabel.style.fontSize='0.95rem'; tipoLabel.style.marginTop='4px'; tipoLabel.textContent = 'Tipo de valoración: ' + (v.tipo || '—'); left.appendChild(tipoLabel);
      const right = document.createElement('div'); right.style.fontSize='0.9rem'; right.style.color='var(--muted)'; right.style.textAlign='right';
  const resp = document.createElement('div');
  // include prefix (PSS/LFT/EF) when available and label as Responsable:
  const respPrefix = v.responsable_prefix || v.responsablePrefix || (window.getResponsablePrefix ? window.getResponsablePrefix(v.responsable) : '');
  const respName = respPrefix ? (respPrefix + ' ' + (v.responsable || '')) : (v.responsable || '');
  resp.textContent = respName ? ('Responsable: ' + respName) : '';
  const apoyo = document.createElement('div');
  const apoyoPrefix = v.apoyo_prefix || v.apoyoPrefix || (window.getApoyoPrefix ? window.getApoyoPrefix(v.apoyo) : '');
  apoyo.textContent = v.apoyo ? ('Apoyo: ' + (apoyoPrefix ? (apoyoPrefix + ' ' + v.apoyo) : v.apoyo)) : '';
      const estado = document.createElement('div'); estado.textContent = v.status ? ('Estado: ' + v.status) : '';
      right.appendChild(resp); if(apoyo.textContent) right.appendChild(apoyo); if(estado.textContent) right.appendChild(estado);
      hdr.appendChild(left); hdr.appendChild(right); d.appendChild(hdr);

      const body = document.createElement('div'); body.style.marginTop='8px'; body.style.whiteSpace='pre-wrap'; body.innerHTML = escapeHtml(v.summary||v.detalle||''); d.appendChild(body);

  // Previously we displayed a small goniometría summary in the list cards.
  // Per UI change, do not show goniometría inside the compact list cards to keep them concise.

      // actions
      const actions = document.createElement('div'); actions.style.display='flex'; actions.style.gap='8px'; actions.style.justifyContent='flex-end'; actions.style.marginTop='8px';
      if(v.status === 'Firmada'){
        const btnView = document.createElement('button'); btnView.className='btn btn-view'; btnView.textContent = 'Ver resumen de la valoración'; btnView.addEventListener('click', ()=>{ viewValoracion(v.id); }); actions.appendChild(btnView);
      } else {
        const btnEdit = document.createElement('button'); btnEdit.className='btn btn-edit'; btnEdit.textContent='Editar'; btnEdit.addEventListener('click', ()=>{ editValoracion(v.id); });
        const btnSign = document.createElement('button'); btnSign.className='btn btn-sign'; btnSign.textContent='Firmar'; btnSign.addEventListener('click', ()=>{ signValoracion(v.id); });
        const btnDel = document.createElement('button'); btnDel.className='btn btn-del'; btnDel.textContent='Eliminar'; btnDel.addEventListener('click', ()=>{ deleteValoracion(v.id); });
        actions.appendChild(btnEdit); actions.appendChild(btnSign); actions.appendChild(btnDel);
      }
      d.appendChild(actions);
      container.appendChild(d);
    });
  }

  // helper actions for list cards
  function editValoracion(id){ 
    try{ 
      const rec = loadVals().find(x=>x.id===id); 
      if(!rec) return; 
      currentVal = Object.assign({}, rec);
      // Load standard scales data into HSV_Escalas module if available
      if(window.HSV_Escalas && typeof window.HSV_Escalas.loadScalesData === 'function'){
        window.HSV_Escalas.loadScalesData();
      }
      window.showView('view_addvaloracion'); 
    }catch(e){ console.warn('editValoracion', e); } 
  }

  function deleteValoracion(id){ try{ if(!confirm('¿Eliminar valoración? Esta acción no se puede deshacer.')) return; const arr = loadVals(); const ix = arr.findIndex(x=>x.id===id); if(ix>=0){ arr.splice(ix,1); saveVals(arr); renderList(); } }catch(e){ console.warn('deleteValoracion', e); } }

  function signValoracion(id){ try{ const rec = loadVals().find(x=>x.id===id); if(!rec) return; const after = function(success){ if(!success){ alert('PIN inválido. La valoración se mantiene como borrador.'); return; } rec.status = 'Firmada'; rec.signedAt = new Date().toISOString(); rec.updatedAt = rec.signedAt; upsertVal(rec); renderList(); try{ if(window._info && typeof window._info.loadFromDB === 'function' && typeof window._info.saveToDB === 'function'){ const profile = window._info.loadFromDB() || { paciente: getPatientId() }; profile.info_antecedentes = rec.antecedentes || []; profile.updatedAt = rec.updatedAt; window._info.saveToDB(profile); if(typeof window._info.populateForm === 'function') window._info.populateForm(profile); } }catch(e){} };
    // Confetti / celebration helper (falls back to local celebrate if present)
    const _celebrate = function(){ try{ if(typeof window.launchConfetti === 'function'){ window.launchConfetti({count:60}); } else if(typeof window.celebrate === 'function'){ window.celebrate(); } }catch(e){} };
    if(typeof openPinModal === 'function'){ openPinModal('Firmar Valoración', 'ALL', function(ok){ after(ok); if(ok) _celebrate(); }); } else { const pin = prompt('Introduzca PIN del responsable'); const ok = (pin === '1234'); after(ok); if(ok) _celebrate(); } }catch(e){ console.warn('signValoracion', e); } }

  function viewValoracion(id){ try{ const rec = loadVals().find(x=>x.id===id); if(!rec) return; currentVal = Object.assign({}, rec); // open read-only subview
      openValoracionAsSubview(id);
    }catch(e){ console.warn('viewValoracion', e); } }

  // Open valoración as a read-only subview with compact clinical summary
  function openValoracionAsSubview(id){ try{ const rec = loadVals().find(x=>x.id===id); if(!rec) return;
    // only allow read-only summary for signed valoraciones
    if((rec.status||'').toLowerCase() !== 'firmada'){ alert('La vista de lectura solo está disponible para valoraciones firmadas.'); return; }
    // prepare header
      const titleDate = document.getElementById('vv_fecha_title'); const container = document.getElementById('vv_container'); if(!container) return;
      // date + time
      const fecha = formatDateLongES(rec.fecha) || formatDateLongES(rec.updatedAt||rec.createdAt);
      const time = (rec.hora_start || '') + (rec.hora_end ? (' - ' + rec.hora_end) : '');
      titleDate.textContent = fecha + (time ? (' • ' + time) : '');

      // build compact header block: Responsable / Apoyo / Estado / Última edición
      const respPrefix = rec.responsable_prefix || (window.getResponsablePrefix ? window.getResponsablePrefix(rec.responsable_signed || rec.responsable) : '');
      const responsableLabel = rec.responsable_signed || ( (respPrefix ? (respPrefix+' '):'') + (rec.responsable||'') );
      const apoyoPrefix = rec.apoyo_prefix || (window.getApoyoPrefix ? window.getApoyoPrefix(rec.apoyo) : '');
      const apoyoLabel = rec.apoyo ? (apoyoPrefix ? (apoyoPrefix + ' ' + rec.apoyo) : rec.apoyo) : '';
      const estado = rec.status || 'Borrador';
      const lastEdit = rec.updatedAt ? window.formatDateTimeES(rec.updatedAt) : (rec.createdAt ? window.formatDateTimeES(rec.createdAt) : '');
      let html = '';
      html += `<div style="color:var(--muted);font-size:0.95rem;margin-bottom:10px">`;
      html += `${responsableLabel?('<strong>Responsable:</strong> '+escapeHtml(responsableLabel)) : ''}`;
      if(apoyoLabel) html += ` &nbsp; · &nbsp; <strong>Apoyo:</strong> ${escapeHtml(apoyoLabel)}`;
      html += ` &nbsp; · &nbsp; <strong>Estado:</strong> ${escapeHtml(estado)}`;
      if(lastEdit) html += ` &nbsp; · &nbsp; <strong>Última edición:</strong> ${escapeHtml(lastEdit)}`;
      html += `</div>`;

      // Antecedentes (mostrar en viñetas, texto simple)
      const antecedentes = Array.isArray(rec.antecedentes) ? rec.antecedentes.filter(Boolean) : [];
      if(antecedentes.length){
        html += `<div style="margin-top:8px"><strong>Antecedentes:</strong><ul style="margin:6px 0 0 18px">` + antecedentes.map(a=>`<li>${escapeHtml(a)}</li>`).join('') + `</ul></div>`;
      } else {
        html += `<div style="margin-top:8px"><strong>Antecedentes:</strong> Sin antecedentes patológicos registrados.</div>`;
      }
  // separator
  html += `<div style="height:8px"></div><hr class="thin-hr">`;

      // Motivo / ALICIA - build continuous sentence
      const a = rec.alicia && rec.alicia.a ? rec.alicia.a.trim() : '';
      const l = rec.alicia && rec.alicia.l ? rec.alicia.l.trim() : '';
      const i = rec.alicia && rec.alicia.i ? rec.alicia.i.trim() : '';
      const c = rec.alicia && rec.alicia.c ? rec.alicia.c.trim() : '';
      const i2 = rec.alicia && rec.alicia.i2 ? String(rec.alicia.i2).trim() : '';
      const a2 = rec.alicia && rec.alicia.a2 ? rec.alicia.a2.trim() : '';
      let motivoParts = [];
      if(a) motivoParts.push(`El dolor apareció ${a}.`);
      if(l) motivoParts.push(`Se localiza en ${l}.`);
      if(i) motivoParts.push(`Irradiación: ${i}.`);
      if(c) motivoParts.push(`Se describe como ${c}.`);
      if(i2) motivoParts.push(`Intensidad ${i2}/10.`);
      if(a2) motivoParts.push(`${a2}.`);
  if(motivoParts.length){ html += `<div style="margin-top:10px"><strong>Motivo del dolor (ALICIA):</strong> ${escapeHtml(motivoParts.join(' '))}</div>`; }
  // separator
  html += `<div style="height:6px"></div>`;

      // Postura
      const posturaParts = [];
      if(rec.postura){ if(rec.postura.anterior) posturaParts.push(`Vista anterior: ${rec.postura.anterior.trim()}.`); if(rec.postura.lateral) posturaParts.push(`Vista lateral: ${rec.postura.lateral.trim()}.`); if(rec.postura.posterior) posturaParts.push(`Vista posterior: ${rec.postura.posterior.trim()}.`); if(rec.postura.cefalo) posturaParts.push(`${rec.postura.cefalo.trim()}.`); }
  if(posturaParts.length){ html += `<div style="margin-top:10px"><strong>Postura:</strong> ${escapeHtml(posturaParts.join(' '))}</div>`; }
  // separator
  html += `<div style="height:6px"></div>`;

      // Goniometría summary
      if(Array.isArray(rec.goniometria) && rec.goniometria.length){ // summarize per joint
        // if all functional
          const alteredByJoint = {};
          rec.goniometria.forEach(g=>{
            const joint = g.joint || '';
            const movement = g.movement || '';
            const expected = g.expected || ( (typeof EXPECTED_ROM !== 'undefined' && EXPECTED_ROM[joint] && EXPECTED_ROM[joint][movement]) ? EXPECTED_ROM[joint][movement] : null );
            let rightAltered = false, leftAltered = false;
            if(g.right!=null && expected!=null){ rightAltered = (g.right < (expected * 0.8)); }
            if(g.left!=null && expected!=null){ leftAltered = (g.left < (expected * 0.8)); }
            if(rightAltered || leftAltered){ alteredByJoint[joint] = alteredByJoint[joint] || []; alteredByJoint[joint].push({ movement: movement, right: g.right!=null?g.right:null, left: g.left!=null?g.left:null }); }
          });
          const joints = Object.keys(alteredByJoint);
          if(!joints.length){ html += `<div style="margin-top:10px"><strong>Goniometría:</strong> Rangos articulares conservados en todos los segmentos evaluados.</div>`; }
          else {
            const parts = [];
            joints.forEach(j=>{
              const arr = alteredByJoint[j];
              const movParts = arr.map(item=>{
                const sides = [];
                if(item.right!=null) sides.push(`Der: ${item.right}°`);
                if(item.left!=null) sides.push(`Izq: ${item.left}°`);
                return `${item.movement} (${sides.join('; ')})`;
              });
              parts.push(`${j}: ${movParts.join(', ')}`);
            });
            html += `<div style="margin-top:10px"><strong>Goniometría:</strong> ${escapeHtml(parts.join('; '))}. El resto de los movimientos articulares presentan rango funcional completo, sin limitaciones significativas.</div>`;
          }
        // separator
        html += `<div style="height:6px"></div>`;
      }

      // Daniels (fuerza)
      if(Array.isArray(rec.daniels) && rec.daniels.length){ // group by value
        const groups = {}; rec.daniels.forEach(d=>{ const v = (d.right!=null?d.right:d.left!=null?d.left:null); if(v==null) return; groups[v] = groups[v] || []; groups[v].push(d.muscle); });
        const parts = [];
        Object.keys(groups).sort((a,b)=>b-a).forEach(k=>{ const muscles = Array.from(new Set(groups[k])); parts.push(`Fuerza ${k}/5 en ${muscles.join(' y ')}`); });
        html += `<div style="margin-top:10px"><strong>Fuerza muscular (Daniels):</strong> ${escapeHtml(parts.join('; '))}`;
        // include any comments
        const comments = rec.daniels.map(d=>d.comment).filter(Boolean); if(comments.length) html += ` — Observación: ${escapeHtml(comments.join(', '))}`;
        html += `</div>`;
        // separator
        html += `<div style="height:6px"></div>`;
      }

      // Marcha
      if(rec.marcha){ const m = rec.marcha; const phaseAlter = (m.phases||[]).filter(p=>p.rightAltered||p.leftAltered).map(p=>p.phase); let marchText = '';
        if(phaseAlter.length){ marchText += `Alteraciones en fases: ${phaseAlter.join(', ')}.`; }
        if(m.description) marchText += (marchText? ' ' : '') + m.description;
        // constants summary
        const alteredConsts = Object.keys(m.constants||{}).filter(k=>m.constants[k]); const normalConsts = Object.keys(m.constants||{}).filter(k=>!m.constants[k]); let constsSummary = '';
        if(alteredConsts.length) constsSummary += `Alteradas: ${alteredConsts.join(', ')}.`; if(normalConsts.length) constsSummary += ` Normales: ${normalConsts.join(', ')}.`;
        if(marchText || constsSummary) html += `<div style="margin-top:10px"><strong>Marcha:</strong> ${escapeHtml((marchText + ' ' + constsSummary).trim())}</div>`; }
      // separator
      html += `<div style="height:6px"></div>`;

      // Escalas: include only those with data, render as bullet list in read-only view
      if(rec.escalas){
        const es = rec.escalas;
        let escParts = [];
        if(es.tinetti && es.tinetti.total!=null) escParts.push(`Tinetti: ${es.tinetti.total}/28 — ${interpretTinetti(es.tinetti.total)}`);
        if(es.sppb && es.sppb.total!=null) escParts.push(`SPPB: ${es.sppb.total}/12 — ${interpretSPPB(es.sppb.total)}`);
        if(es.frail && es.frail.score!=null) escParts.push(`FRAIL: ${es.frail.score} — ${interpretFRAIL(es.frail.score)}`);
        if(es.katz && es.katz.score!=null) escParts.push(`Katz: ${es.katz.score} — ${interpretKatz(es.katz.score)}`);
        if(es.lawton && es.lawton.score!=null) escParts.push(`Lawton: ${es.lawton.score} — ${interpretLawton(es.lawton.score)}`);
        if(es.downton && es.downton.score!=null) escParts.push(`Downton: ${es.downton.score} — ${interpretDownton(es.downton.score)}`);
        // include any custom saved scales as additional list items
        if(Array.isArray(es.customs) && es.customs.length){ es.customs.forEach(c=>{ const name = c.name || 'Escala personalizada'; const score = (c.score!=null && c.score!=='') ? `: ${c.score}` : ''; const interp = c.interpretacion ? ` — ${c.interpretacion}` : ''; escParts.push(`${name}${score}${interp}`); }); }
        if(escParts.length){ html += `<div style="margin-top:10px"><strong>Escalas:</strong><ul style="margin:6px 0 0 18px">` + escParts.map(s=>`<li>${escapeHtml(s)}</li>`).join('') + `</ul></div>`; }
      // separator
      html += `<div style="height:6px"></div>`;
      }

      // Pruebas específicas
  if(Array.isArray(rec.pruebasEspecificas) && rec.pruebasEspecificas.length){ const list = rec.pruebasEspecificas.map(t=> `${t.name} ${t.resultado? t.resultado : ''}`.trim()); html += `<div style="margin-top:10px"><strong>Pruebas específicas:</strong> ${escapeHtml(list.join(', '))}</div>`; }
  // separator
  html += `<div style="height:6px"></div>`;

      // Diagnóstico fisioterapéutico
      if(rec.diagnostico){ html += `<div style="margin-top:12px"><strong>Diagnóstico fisioterapéutico:</strong> <div style="font-weight:700;margin-top:6px">${escapeHtml(rec.diagnostico)}</div></div>`; }

      // Observaciones (if present)
      if(rec.observaciones){ html += `<div style="margin-top:10px"><strong>Observaciones:</strong> ${escapeHtml(rec.observaciones)}</div>`; }

      // Footer: signed by + button to view full form
      const signedBy = rec.responsable_signed || ((rec.responsable_prefix? (rec.responsable_prefix + ' '):'') + (rec.responsable||'')); const signedAt = rec.signedAt ? window.formatDateTimeES(rec.signedAt) : (rec.updatedAt? window.formatDateTimeES(rec.updatedAt) : '');
      html += `<div style="margin-top:14px;color:var(--muted);font-size:0.9rem">Valoración ${rec.status === 'Firmada' ? 'firmada' : 'guardada como borrador'} por ${escapeHtml(signedBy||'')} ${signedAt?('el '+escapeHtml(signedAt)):''}.</div>`;
      // If signed, add 'Ver formulario completo' button that opens the full read-only form view
      if((rec.status||'').toLowerCase() === 'firmada'){
        html += `<div style="margin-top:10px"><button class="btn btn-view" onclick="(function(){ try{ if(typeof window._valoracion !== 'undefined' && typeof window._valoracion.openFullForm === 'function'){ window._valoracion.openFullForm('${escapeHtml(rec.id)}'); } else if(typeof openValoracionFullForm === 'function'){ openValoracionFullForm('${escapeHtml(rec.id)}'); } }catch(e){} })()">Ver formulario completo</button></div>`;
      }

      container.innerHTML = html; window.showView('view_valoracion_view'); }catch(e){ console.warn('openValoracionAsSubview', e); } }

  // Render the full, read-only form view for a valoración (preserve all fields exactly as captured)
  function openValoracionFullForm(id){ try{ const rec = loadVals().find(x=>x.id===id); if(!rec) return; const container = document.getElementById('vv_full_container'); if(!container) return;
      let html = '';
      // Header: basic metadata
      const fecha = formatDateLongES(rec.fecha) || formatDateLongES(rec.updatedAt||rec.createdAt);
      const time = (rec.hora_start || '') + (rec.hora_end ? (' - ' + rec.hora_end) : '');
      html += `<div style="margin-bottom:12px;color:var(--muted);font-size:0.95rem">${escapeHtml(fecha)} ${time?(' • '+escapeHtml(time)) : ''}</div>`;
      html += `<div style="font-weight:700;margin-bottom:10px">Responsable: ${escapeHtml(rec.responsable_signed || ((rec.responsable_prefix? (rec.responsable_prefix + ' '):'') + (rec.responsable||'')))}</div>`;

      // Antecedentes - exact list
      const antecedentes = Array.isArray(rec.antecedentes) ? rec.antecedentes.filter(Boolean) : [];
      if(antecedentes.length){ html += `<div style="margin-top:8px"><strong>Antecedentes:</strong><ul style="margin:6px 0 0 18px">` + antecedentes.map(a=>`<li>${escapeHtml(a)}</li>`).join('') + `</ul></div>`; } else { html += `<div style="margin-top:8px"><strong>Antecedentes:</strong> Sin antecedentes patológicos registrados.</div>`; }

      // ALICIA full fields
      html += `<div style="margin-top:10px"><strong>Motivo del dolor (ALICIA):</strong><div style="margin-top:6px">`;
      html += `<div><strong>Aparición / Inicio:</strong> ${escapeHtml((rec.alicia && rec.alicia.a) || '')}</div>`;
      html += `<div><strong>Localización:</strong> ${escapeHtml((rec.alicia && rec.alicia.l) || '')}</div>`;
      html += `<div><strong>Irradiación:</strong> ${escapeHtml((rec.alicia && rec.alicia.i) || '')}</div>`;
      html += `<div><strong>Características:</strong> ${escapeHtml((rec.alicia && rec.alicia.c) || '')}</div>`;
      html += `<div><strong>Intensidad (EVA):</strong> ${escapeHtml((rec.alicia && rec.alicia.i2) || '')}</div>`;
      html += `<div><strong>Atenuantes/Agravantes:</strong> ${escapeHtml((rec.alicia && rec.alicia.a2) || '')}</div>`;
      html += `</div></div>`;

      // Postura
      if(rec.postura){ html += `<div style="margin-top:10px"><strong>Postura:</strong><div style="margin-top:6px">`;
        if(rec.postura.anterior) html += `<div><strong>Anterior:</strong> ${escapeHtml(rec.postura.anterior)}</div>`;
        if(rec.postura.lateral) html += `<div><strong>Lateral:</strong> ${escapeHtml(rec.postura.lateral)}</div>`;
        if(rec.postura.posterior) html += `<div><strong>Posterior:</strong> ${escapeHtml(rec.postura.posterior)}</div>`;
        if(rec.postura.cefalo) html += `<div><strong>Céfalo-caudal:</strong> ${escapeHtml(rec.postura.cefalo)}</div>`;
        html += `</div></div>`; }

      // Goniometría full table
      if(Array.isArray(rec.goniometria) && rec.goniometria.length){ html += `<div style="margin-top:10px"><strong>Goniometría (valores capturados):</strong><table style="width:100%;border-collapse:collapse;margin-top:8px"><thead><tr><th style="text-align:left;padding:6px">Segmento</th><th style="text-align:left;padding:6px">Movimiento</th><th style="text-align:center;padding:6px">Derecha</th><th style="text-align:center;padding:6px">Izquierda</th></tr></thead><tbody>`;
  rec.goniometria.forEach(g=>{ html += `<tr class="row-top-border"><td style="padding:8px">${escapeHtml(g.joint||'')}</td><td style="padding:8px">${escapeHtml(g.movement||'')}</td><td style="padding:8px;text-align:center">${g.right!=null?escapeHtml(String(g.right)+'°'):'–'}</td><td style="padding:8px;text-align:center">${g.left!=null?escapeHtml(String(g.left)+'°'):'–'}</td></tr>`; }); html += `</tbody></table></div>`; }

      // Daniels read-only table
      if(Array.isArray(rec.daniels) && rec.daniels.length){ html += `<div style="margin-top:10px"><strong>Fuerza muscular (Daniels) — valores registrados:</strong><table style="width:100%;border-collapse:collapse;margin-top:8px"><thead><tr><th style="text-align:left;padding:6px">Músculo</th><th style="text-align:center;padding:6px">Derecha</th><th style="text-align:center;padding:6px">Izquierda</th><th style="text-align:left;padding:6px">Comentario</th></tr></thead><tbody>`;
  rec.daniels.forEach(d=>{ html += `<tr class="row-top-border"><td style="padding:8px">${escapeHtml(d.muscle||'')}</td><td style="padding:8px;text-align:center">${d.right!=null?escapeHtml(String(d.right)):'–'}</td><td style="padding:8px;text-align:center">${d.left!=null?escapeHtml(String(d.left)):'–'}</td><td style="padding:8px">${escapeHtml(d.comment||'')}</td></tr>`; }); html += `</tbody></table></div>`; }

      // Marcha full (render phases as a simple table)
      if(rec.marcha){
        html += `<div style="margin-top:10px"><strong>Marcha:</strong>`;
        // Phases table
        if(Array.isArray(rec.marcha.phases) && rec.marcha.phases.length){
          html += `<div style="margin-top:6px"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:6px">Fase</th><th style="text-align:center;padding:6px">Derecha</th><th style="text-align:center;padding:6px">Izquierda</th></tr></thead><tbody>`;
          rec.marcha.phases.forEach(p=>{
            html += `<tr class="row-top-border"><td style="padding:8px">${escapeHtml(p.phase||'')}</td><td style="padding:8px;text-align:center">${p.rightAltered? 'Alterada' : 'Normal'}</td><td style="padding:8px;text-align:center">${p.leftAltered? 'Alterada' : 'Normal'}</td></tr>`;
          });
          html += `</tbody></table></div>`;
        }
        // Description
        if(rec.marcha.description) html += `<div style="margin-top:8px"><strong>Descripción:</strong> ${escapeHtml(rec.marcha.description)}</div>`;
        // Constants as a compact table
        if(rec.marcha.constants){ const keys = Object.keys(rec.marcha.constants||{}); if(keys.length){ html += `<div style="margin-top:8px"><strong>Constantes:</strong><table style="width:100%;border-collapse:collapse;margin-top:6px"><thead><tr><th style="text-align:left;padding:6px">Constante</th><th style="text-align:center;padding:6px">Estado</th></tr></thead><tbody>`; keys.forEach(k=>{ html += `<tr style="border-top:1px solid #f3f4f6"><td style="padding:8px">${escapeHtml(k)}</td><td style="padding:8px;text-align:center">${rec.marcha.constants[k]? 'Alterada' : 'Normal'}</td></tr>`; }); html += `</tbody></table></div>`; } }
        html += `</div>`;
      }

      // Escalas — show captured values in a simple table (Escala | Valor | Interpretación)
      if(rec.escalas){ const es = rec.escalas; html += `<div style="margin-top:10px"><strong>Escalas (capturadas):</strong><div style="margin-top:6px">`;
  html += `<table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:6px">Escala</th><th style="text-align:center;padding:6px">Valor</th><th style="text-align:left;padding:6px">Detalles</th><th style="text-align:left;padding:6px">Interpretación</th></tr></thead><tbody>`;
  if(es.sppb){ const sppbTotal = es.sppb.total!=null?escapeHtml(String(es.sppb.total)):'–'; const sppbDetails = `Balance: ${es.sppb.components?escapeHtml(String(es.sppb.components.balance!=null?es.sppb.components.balance:'–')):'–'}; Gait: ${es.sppb.components?escapeHtml(String(es.sppb.components.gait!=null?es.sppb.components.gait:'–')):'–'}; Chair: ${es.sppb.components?escapeHtml(String(es.sppb.components.chair!=null?es.sppb.components.chair:'–')):'–'}`; html += `<tr style="border-top:1px solid #f3f4f6"><td style="padding:8px">SPPB</td><td style="padding:8px;text-align:center">${sppbTotal}</td><td style="padding:8px">${sppbDetails}</td><td style="padding:8px">${escapeHtml(interpretSPPB(es.sppb.total))}</td></tr>`; }
  if(es.tinetti){ const tinettiTotal = es.tinetti.total!=null?escapeHtml(String(es.tinetti.total)):'–'; const tinettiDetails = `Gait: ${es.tinetti.gait!=null?escapeHtml(String(es.tinetti.gait)):'–'}; Balance: ${es.tinetti.balance!=null?escapeHtml(String(es.tinetti.balance)):'–'}`; html += `<tr style="border-top:1px solid #f3f4f6"><td style="padding:8px">Tinetti</td><td style="padding:8px;text-align:center">${tinettiTotal}</td><td style="padding:8px">${tinettiDetails}</td><td style="padding:8px">${escapeHtml(interpretTinetti(es.tinetti.total))}</td></tr>`; }
  if(es.frail) html += `<tr style="border-top:1px solid #f3f4f6"><td style="padding:8px">FRAIL</td><td style="padding:8px;text-align:center">${es.frail.score!=null?escapeHtml(String(es.frail.score)):'–'}</td><td style="padding:8px">${escapeHtml(es.frail.details||'')}</td><td style="padding:8px">${escapeHtml(interpretFRAIL(es.frail.score))}</td></tr>`;
  if(es.downton) html += `<tr style="border-top:1px solid #f3f4f6"><td style="padding:8px">Downton</td><td style="padding:8px;text-align:center">${es.downton.score!=null?escapeHtml(String(es.downton.score)):'–'}</td><td style="padding:8px">${escapeHtml(es.downton.details||'')}</td><td style="padding:8px">${escapeHtml(interpretDownton(es.downton.score))}</td></tr>`;
  if(es.katz) html += `<tr style="border-top:1px solid #f3f4f6"><td style="padding:8px">Katz</td><td style="padding:8px;text-align:center">${es.katz.score!=null?escapeHtml(String(es.katz.score)):'–'}</td><td style="padding:8px">${escapeHtml(es.katz.details||'')}</td><td style="padding:8px">${escapeHtml(interpretKatz(es.katz.score))}</td></tr>`;
  if(es.lawton) html += `<tr style="border-top:1px solid #f3f4f6"><td style="padding:8px">Lawton</td><td style="padding:8px;text-align:center">${es.lawton.score!=null?escapeHtml(String(es.lawton.score)):'–'}</td><td style="padding:8px">${escapeHtml(es.lawton.details||'')}</td><td style="padding:8px">${escapeHtml(interpretLawton(es.lawton.score))}</td></tr>`;
  if(Array.isArray(es.customs) && es.customs.length){ es.customs.forEach(c=>{ const cScore = c.score!=null?escapeHtml(String(c.score)):'–'; const cDetails = escapeHtml(c.detalles|| (c.componentes? JSON.stringify(c.componentes) : '')); html += `<tr style="border-top:1px solid #f3f4f6"><td style="padding:8px">${escapeHtml(c.name||'Escala personalizada')}</td><td style="padding:8px;text-align:center">${cScore}</td><td style="padding:8px">${cDetails}</td><td style="padding:8px">${escapeHtml(c.interpretacion||'')}</td></tr>`; }); }
  html += `</tbody></table></div></div>`; }

      // Pruebas específicas top-level
      if(Array.isArray(rec.pruebasEspecificas) && rec.pruebasEspecificas.length){ html += `<div style="margin-top:10px"><strong>Pruebas específicas:</strong><ul style="margin:6px 0 0 18px">` + rec.pruebasEspecificas.map(t=>`<li>${escapeHtml((t.name||'') + (t.resultado?(' — '+t.resultado):''))}</li>`).join('') + `</ul></div>`; }

      // Diagnóstico
      if(rec.diagnostico){ html += `<div style="margin-top:12px"><strong>Diagnóstico fisioterapéutico:</strong><div style="font-weight:700;margin-top:6px">${escapeHtml(rec.diagnostico)}</div></div>`; }

      // Observaciones
      if(rec.observaciones){ html += `<div style="margin-top:10px"><strong>Observaciones:</strong> ${escapeHtml(rec.observaciones)}</div>`; }

      // Footer: signed info + back to summary
      const signedBy = rec.responsable_signed || ((rec.responsable_prefix? (rec.responsable_prefix + ' '):'') + (rec.responsable||'')); const signedAt = rec.signedAt ? window.formatDateTimeES(rec.signedAt) : (rec.updatedAt? window.formatDateTimeES(rec.updatedAt) : '');
      html += `<div style="margin-top:14px;color:var(--muted);font-size:0.9rem">Valoración ${rec.status === 'Firmada' ? 'firmada' : 'guardada como borrador'} por ${escapeHtml(signedBy||'')} ${signedAt?('el '+escapeHtml(signedAt)):''}.</div>`;
      html += `<div style="margin-top:8px"><button class="btn btn-ghost" onclick="window.showView('view_valoracion_view')">Volver al resumen</button></div>`;

      container.innerHTML = html; window.showView('view_valoracion_full'); }catch(e){ console.warn('openValoracionFullForm', e); } }

  // expose helper for index-created onclicks
  window.openValoracionFullForm = openValoracionFullForm;

  // Timer/autosave utilities removed: No automatic timeout saves. Manual 'Guardar como borrador' or 'Firmar' remain.
  let valLocked = false; let currentVal = null;

  function lockForm(){ valLocked = true; const container = document.getElementById('view_addvaloracion'); if(!container) return; container.querySelectorAll('input,textarea,select,button').forEach(i=>{ if(i.id && (i.id==='btn_save_valoracion' || i.id==='btn_sign_valoracion')) return; if(i.classList && i.classList.contains('back')) return; i.disabled = true; }); const msg = document.getElementById('val_msg'); if(msg) msg.textContent = 'Valoración bloqueada (tiempo expirado)'; }

  function unlockForm(){ valLocked = false; const container = document.getElementById('view_addvaloracion'); if(!container) return; container.querySelectorAll('input,textarea,select,button').forEach(i=>{ if(i.classList && i.classList.contains('back')) return; i.disabled = false; }); const msg = document.getElementById('val_msg'); if(msg) msg.textContent = ''; }

  // Antecedentes UI helpers
  function renderAntecedentes(list){ const container = document.getElementById('val_antecedentes_container'); if(!container) return; container.innerHTML = ''; if(!list || !list.length){ container.innerHTML = '<div style="color:var(--muted)">(Sin antecedentes previos)</div>'; return; } list.forEach((a, idx)=>{ const row = document.createElement('div'); row.style.display='flex'; row.style.gap='8px'; row.style.alignItems='center'; const span = document.createElement('div'); span.style.flex='1'; span.textContent = a; row.appendChild(span); const cb = document.createElement('input'); cb.type='checkbox'; cb.title='Marcar para conservar'; cb.checked = true; cb.style.marginRight='6px'; row.appendChild(cb); const del = document.createElement('button'); del.className='btn btn-ghost'; del.textContent='Eliminar'; del.addEventListener('click', ()=>{ // remove
      list.splice(idx,1); renderAntecedentes(list); }); row.appendChild(del); container.appendChild(row); }); }

  // --- Goniometría support ---
  let goniData = [];
  // mapping of joint keys to movements and expected ROM (degrees)
  const EXPECTED_ROM = {
    'Cervical': { 'Flexión':50, 'Extensión':60, 'Rotación':80, 'Inclinación lateral':45 },
    'Hombro': { 'Flexión':180, 'Extensión':60, 'Abducción':180, 'Rotación interna':70, 'Rotación externa':90 },
    'Codo': { 'Flexión':150, 'Extensión':0, 'Prono-supinación':80 },
    'Muñeca': { 'Flexión':80, 'Extensión':70, 'Desviación radial':20, 'Desviación cubital':30 },
    'Cadera': { 'Flexión':120, 'Extensión':30, 'Abducción':45, 'Aducción':30 },
    'Rodilla': { 'Flexión':135, 'Extensión':0 },
    'Tobillo': { 'Dorsiflexión':20, 'Flexión plantar':50 }
  };

  const JOINT_LABELS = ['Cervical','Hombro','Codo/Antebrazo','Muñeca','Cadera','Rodilla','Tobillo/Pie'];
  const JOINT_KEY_MAP = { 'Codo/Antebrazo':'Codo', 'Tobillo/Pie':'Tobillo' };
  let selectedSegments = new Set(JOINT_LABELS.slice()); // all selected by default
  let selectionDirty = false;

  // simple debounce helper
  function debounce(fn, wait){ let t = null; return function(...args){ if(t) clearTimeout(t); t = setTimeout(()=>{ fn.apply(this,args); t = null; }, wait||250); }; }

  function renderSegmentSelectors(){ const container = document.getElementById('goni_segments'); const applyBtn = document.getElementById('btn_apply_goni_selection'); if(!container) { console.warn('⚠️ goni_segments container not found'); return; } console.log('✅ Renderizando Goniometría segments'); container.innerHTML=''; JOINT_LABELS.forEach(label=>{ const btn = document.createElement('button'); btn.className = 'seg-btn'; btn.dataset.seg = label; btn.style.border = '1px solid #e5e7eb'; btn.style.padding = '8px 10px'; btn.style.borderRadius = '999px'; btn.style.display='inline-flex'; btn.style.alignItems='center'; btn.style.gap='8px'; btn.style.cursor='pointer'; btn.style.fontSize='0.95rem'; const icon = document.createElement('i'); icon.className = 'fa-solid fa-check'; icon.style.minWidth='14px'; icon.style.textAlign='center'; icon.style.transition='0.15s'; const text = document.createElement('span'); text.textContent = label;
  // color scheme: lilac buttons use #f3d9ff and darker purple text for readability
  // toggle CSS class for lilac selector buttons
  if(selectedSegments.has(label)){ btn.classList.add('seg-btn--selected'); } else { btn.classList.remove('seg-btn--selected'); }
    btn.appendChild(icon); btn.appendChild(text);
    btn.addEventListener('click', ()=>{ if(selectedSegments.has(label)) selectedSegments.delete(label); else selectedSegments.add(label); selectionDirty = true; applyBtn.disabled = false; renderSegmentSelectors(); }); container.appendChild(btn); }); }

  function applySelection(){ const applyBtn = document.getElementById('btn_apply_goni_selection'); if(!applyBtn) return; // rebuild tables for selected segments
    renderGoniTables(); selectionDirty = false; applyBtn.disabled = true; }

  function renderGoniTables(){ const container = document.getElementById('goni_list'); if(!container) return; container.innerHTML=''; const segs = Array.from(selectedSegments); if(!segs.length){ container.innerHTML = '<div style="color:var(--muted)">No hay segmentos seleccionados.</div>'; return; }
    segs.forEach(segLabel=>{ const key = JOINT_KEY_MAP[segLabel]||segLabel; const movements = EXPECTED_ROM[key] ? Object.keys(EXPECTED_ROM[key]) : []; const section = document.createElement('div'); section.style.marginBottom='12px'; section.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div style="font-weight:700">${escapeHtml(segLabel)}</div><div style="color:var(--muted);font-size:0.9rem">${movements.length} movimientos</div></div>`;
  const table = document.createElement('table'); table.style.width='100%'; table.style.borderCollapse='collapse'; table.style.marginTop='8px'; table.style.tableLayout = 'fixed'; // keep columns aligned across segments
  const thead = document.createElement('thead'); thead.innerHTML = `<tr><th style="text-align:left;padding:8px 6px;width:60%">Movimiento</th><th style="padding:8px 6px;text-align:center;width:20%">Derecha</th><th style="padding:8px 6px;text-align:center;width:20%">Izquierda</th></tr>`; table.appendChild(thead);
      const tbody = document.createElement('tbody'); movements.forEach(mov=>{ const tr = document.createElement('tr'); tr.style.borderTop='1px solid #f7faf9'; tr.style.padding='0'; const td1 = document.createElement('td'); td1.style.padding='10px 8px'; td1.style.verticalAlign='middle'; td1.style.textAlign='left'; td1.textContent = mov;
        const tdR = document.createElement('td'); tdR.style.padding='8px 6px'; tdR.style.textAlign='center'; tdR.style.verticalAlign='middle'; const btnR = document.createElement('button'); btnR.className='goni-meas-btn'; btnR.dataset.joint = key; btnR.dataset.movement = mov; btnR.dataset.side = 'right'; btnR.style.padding='8px 10px'; btnR.style.borderRadius='8px'; btnR.style.border='none'; btnR.style.minWidth='84px'; btnR.style.width='84px'; btnR.style.boxSizing='border-box'; btnR.style.cursor='pointer'; btnR.style.display='inline-block'; btnR.addEventListener('click', ()=>{ openMeasurementModal(key,mov,'right'); });
  const tdL = document.createElement('td'); tdL.style.padding='8px 6px'; tdL.style.textAlign='center'; tdL.style.verticalAlign='middle'; const btnL = document.createElement('button'); btnL.className='goni-meas-btn'; btnL.dataset.joint = key; btnL.dataset.movement = mov; btnL.dataset.side = 'left'; btnL.style.padding='8px 10px'; btnL.style.borderRadius='8px'; btnL.style.border='none'; btnL.style.minWidth='84px'; btnL.style.width='84px'; btnL.style.boxSizing='border-box'; btnL.style.cursor='pointer'; btnL.style.display='inline-block'; btnL.addEventListener('click', ()=>{ openMeasurementModal(key,mov,'left'); });
        // initialize appearance: if there's a stored measurement, show it; otherwise show assumed (light green) check
        const entry = goniData.find(g=>g.joint===key && g.movement===mov);
        if(entry && entry.right!=null){ // right measured
          delete btnR.dataset.assumed; btnR.textContent = `${entry.right}°`;
          // assign measured class based on percent
          const pctR = entry.expected? Math.round((entry.right/entry.expected)*100) : null;
          btnR.classList.remove('goni-assumed','goni-empty','goni-measured-good','goni-measured-warn','goni-measured-mid','goni-measured-bad');
          if(pctR!==null){ if(pctR>=90) btnR.classList.add('goni-measured-good'); else if(pctR>=80) btnR.classList.add('goni-measured-warn'); else if(pctR>=65) btnR.classList.add('goni-measured-mid'); else btnR.classList.add('goni-measured-bad'); } else { btnR.classList.add('goni-measured-good'); }
          btnR.title = entry.expected? `${pctR}% del ROM esperado (${entry.expected}°)` : `${entry.right}°`;
        } else { // assumed default: light green with check
          btnR.textContent = '✓'; btnR.classList.remove('goni-measured-good','goni-measured-warn','goni-measured-mid','goni-measured-bad'); btnR.classList.add('goni-assumed'); btnR.title = 'Asumido: rango completo (no medido)'; btnR.dataset.assumed = 'true';
        }
  if(entry && entry.left!=null){ delete btnL.dataset.assumed; btnL.textContent = `${entry.left}°`;
          const pctL = entry.expected? Math.round((entry.left/entry.expected)*100) : null;
          btnL.classList.remove('goni-assumed','goni-empty','goni-measured-good','goni-measured-warn','goni-measured-mid','goni-measured-bad');
          if(pctL!==null){ if(pctL>=90) btnL.classList.add('goni-measured-good'); else if(pctL>=80) btnL.classList.add('goni-measured-warn'); else if(pctL>=65) btnL.classList.add('goni-measured-mid'); else btnL.classList.add('goni-measured-bad'); } else { btnL.classList.add('goni-measured-good'); }
          btnL.title = entry.expected? `${pctL}% del ROM esperado (${entry.expected}°)` : `${entry.left}°`;
        } else { btnL.textContent = '✓'; btnL.classList.remove('goni-measured-good','goni-measured-warn','goni-measured-mid','goni-measured-bad'); btnL.classList.add('goni-assumed'); btnL.title = 'Asumido: rango completo (no medido)'; btnL.dataset.assumed = 'true'; }
        tdR.appendChild(btnR);
        tdL.appendChild(btnL);
  // slight separator between movements for readability
  tr.style.borderBottom = '1px solid #f3f4f6';
  tr.appendChild(td1); tr.appendChild(tdR); tr.appendChild(tdL); tbody.appendChild(tr); }); table.appendChild(tbody); section.appendChild(table); container.appendChild(section); }); }

  function getButtonDisplay(joint,mov,side){ // return text shown on the measurement button
    const entry = goniData.find(g=>g.joint===joint && g.movement===mov);
    if(!entry) return '–'; const val = side==='right'? entry.right : entry.left; if(val==null) return '–'; return `${val}°`;
  }

  function renderGoniList(){ // render a compact summary only if a dedicated summary container exists
    const container = document.getElementById('goni_list_summary'); if(!container) return; // do nothing if not present
    // simple stylized summary: one row per measurement with percent chip
    const list = goniData.slice(); container.innerHTML = ''; if(!list.length){ container.innerHTML = '<div style="color:var(--muted)">(Sin mediciones goniométricas)</div>'; return; }
    list.forEach((g, idx)=>{
      const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.padding='8px'; row.style.border='1px solid #f3f4f6'; row.style.borderLeft = '6px solid #e5e7eb'; row.style.borderRadius='6px'; row.style.marginBottom='8px';
  const left = document.createElement('div'); left.style.display='flex'; left.style.alignItems='center'; left.style.gap='10px'; const icon = document.createElement('i'); icon.className='fa-solid fa-check'; icon.style.color='#16a34a'; icon.style.fontSize='14px'; const info = document.createElement('div'); info.innerHTML = `<div style="font-weight:700">${escapeHtml(g.joint)} — ${escapeHtml(g.movement)}</div><div style="color:var(--muted);font-size:0.9rem">Izq: ${g.left!=null?g.left+'°':'–'} — Der: ${g.right!=null?g.right+'°':'–'}${g.expected? ' • Esperado '+g.expected+'°':''}</div>`;
      left.appendChild(icon); left.appendChild(info);
      const right = document.createElement('div'); const pct = Math.round(((g.leftPct||0)+(g.rightPct||0))/(((g.leftPct!=null)?1:0)+((g.rightPct!=null)?1:0) || 1)); const chip = document.createElement('div'); chip.textContent = isNaN(pct)?'–':pct+'%'; // use pct-chip classes instead of inline styles
      chip.className = 'pct-chip ' + (isNaN(pct)? '' : (pct>=90? 'pct-good' : (pct>=80? 'pct-medium' : (pct>=65? 'pct-warning' : 'pct-bad'))));
  const del = document.createElement('button'); del.className='btn btn-ghost'; del.textContent='Eliminar'; del.style.marginLeft='8px'; del.addEventListener('click', ()=>{ goniData.splice(idx,1); renderGoniTables(); /* update summary if present */ renderGoniList(); }); right.appendChild(chip); right.appendChild(del);
      row.appendChild(left); row.appendChild(right); container.appendChild(row);
    }); }

  // --- Daniels (Fuerza muscular) support ---
  // Daniels groups simplified per user request
  const DANIELS_MUSCLES = [
    'Cabeza',
    'Tronco',
    'Miembro superior',
    'Miembro inferior'
  ];

  function renderDanielsTable(){ const container = document.getElementById('daniels_container'); if(!container) { console.warn('⚠️ daniels_container not found'); return; } console.log('✅ Renderizando Daniels'); container.innerHTML = '';
    const table = document.createElement('table'); table.style.width='100%'; table.style.borderCollapse='collapse'; table.style.marginTop='6px'; table.style.tableLayout='fixed';
    const thead = document.createElement('thead'); thead.innerHTML = `<tr><th style="text-align:left;padding:8px 6px;width:45%">Músculo</th><th style="text-align:center;padding:8px 6px;width:15%">Derecha</th><th style="text-align:center;padding:8px 6px;width:15%">Izquierda</th><th style="text-align:left;padding:8px 6px;width:25%">Comentario</th></tr>`; table.appendChild(thead);
    const tbody = document.createElement('tbody');
    // try to load existing daniels from currentVal if present
    const existing = (currentVal && Array.isArray(currentVal.daniels)) ? currentVal.daniels : [];
    DANIELS_MUSCLES.forEach((muscle, idx)=>{
      const tr = document.createElement('tr'); tr.style.borderBottom = '1px solid #f3f4f6';
      const tdM = document.createElement('td'); tdM.style.padding='8px 6px'; tdM.textContent = muscle;
      const tdR = document.createElement('td'); tdR.style.padding='8px 6px'; tdR.style.textAlign='center';
      const selR = document.createElement('select'); selR.className = 'daniels-select'; selR.dataset.muscle = muscle; selR.dataset.side = 'right'; selR.style.width = '84px'; selR.style.padding='6px'; selR.innerHTML = '<option value="">—</option>' + [0,1,2,3,4,5].map(n=>`<option value="${n}">${n}</option>`).join(''); tdR.appendChild(selR);
      const tdL = document.createElement('td'); tdL.style.padding='8px 6px'; tdL.style.textAlign='center';
      const selL = selR.cloneNode(true); selL.dataset.side = 'left'; tdL.appendChild(selL);
      const tdC = document.createElement('td'); tdC.style.padding='8px 6px'; const txt = document.createElement('input'); txt.className='daniels-comment'; txt.style.width='100%'; txt.style.padding='6px'; txt.placeholder = 'Comentario (opcional)'; tdC.appendChild(txt);
      // restore values if any
      const found = existing.find(e=>e.muscle===muscle);
      if(found){ if(found.right!=null) selR.value = String(found.right); if(found.left!=null) selL.value = String(found.left); if(found.comment) txt.value = found.comment; }
      // autosave removed: keep a lightweight handler that updates in-memory currentVal only
      const onDanielsChange = debounce(()=>{
        try{ const payload = gatherForm(); currentVal = payload; }catch(e){ /* ignore */ }
      }, 350);
      selR.addEventListener('change', onDanielsChange);
      selL.addEventListener('change', onDanielsChange);
      txt.addEventListener('input', debounce(onDanielsChange, 650));
      tr.appendChild(tdM); tr.appendChild(tdR); tr.appendChild(tdL); tr.appendChild(tdC); tbody.appendChild(tr);
    });
    table.appendChild(tbody); container.appendChild(table);
  }

  // --- Marcha support ---
  const MARCHA_PHASES = [
    'Contacto inicial',
    'Respuesta a la carga',
    'Apoyo medio',
    'Apoyo terminal',
    'Pre balanceo',
    'Balanceo inicial',
    'Balanceo medio',
    'Balanceo terminal'
  ];

  const MARCHA_CONSTANTS = [
    'Braceo',
    'Ángulo de paso',
    'Cadencia',
    'Longitud de paso',
    'Disociación cintura escapular',
    'Disociación cintura pélvica',
    'Basculación'
  ];

  function _applyNormalStyle(btn){
    btn.dataset.altered = 'false';
    btn.classList.remove('marcha-const-altered');
    btn.classList.add('marcha-const-normal');
    const label = btn.dataset.key || '';
    const accentClass = '';
    if(label){
      btn.innerHTML = `<span style="font-weight:700;margin-right:8px">✓</span><span style="font-weight:600">${escapeHtml(label)}</span>`;
    } else {
      btn.innerHTML = `<span style="font-weight:700">✓</span>`;
    }
  }

  function _applyAlteredStyle(btn){
    btn.dataset.altered = 'true';
    btn.classList.remove('marcha-const-normal');
    btn.classList.add('marcha-const-altered');
    const label = btn.dataset.key || '';
    if(label){
      btn.innerHTML = `<span style="font-weight:700;margin-right:8px">✖</span><span style="font-weight:600">${escapeHtml(label)}</span>`;
    } else {
      btn.innerHTML = `<span style="font-weight:700">✖</span>`;
    }
  }

  function renderMarchaSection(){ const table = document.getElementById('marcha_phases_table'); const constantsContainer = document.getElementById('marcha_constants'); const desc = document.getElementById('marcha_desc'); if(!table || !constantsContainer || !desc) { console.warn('⚠️ Marcha elements not found', {table: !!table, constantsContainer: !!constantsContainer, desc: !!desc}); return; } console.log('✅ Renderizando Marcha');
    // build phases rows
    const tbody = table.querySelector('tbody'); tbody.innerHTML = '';
    // restore existing data if present
    const existing = (currentVal && currentVal.marcha) ? currentVal.marcha : null;
    const phasesState = (existing && Array.isArray(existing.phases)) ? existing.phases.reduce((acc,p)=>{ acc[p.phase]=p; return acc; },{}) : {};
    MARCHA_PHASES.forEach(phase=>{
      const tr = document.createElement('tr'); tr.style.borderBottom='1px solid #f3f4f6';
      const td1 = document.createElement('td'); td1.style.padding='8px 6px'; td1.textContent = phase;
      const tdR = document.createElement('td'); tdR.style.padding='8px 6px'; tdR.style.textAlign='center';
      const tdL = document.createElement('td'); tdL.style.padding='8px 6px'; tdL.style.textAlign='center';
      const btnR = document.createElement('button'); btnR.className='marcha-phase-btn'; btnR.dataset.phase = phase; btnR.dataset.side='right'; btnR.style.minWidth='96px'; btnR.style.padding='8px'; btnR.style.border='none'; btnR.style.borderRadius='8px'; btnR.style.cursor='pointer';
      const btnL = btnR.cloneNode(true); btnL.dataset.side='left';
      // restore state
      const st = phasesState[phase]; if(st && st.rightAltered){ _applyAlteredStyle(btnR); } else { _applyNormalStyle(btnR); }
      if(st && st.leftAltered){ _applyAlteredStyle(btnL); } else { _applyNormalStyle(btnL); }
      // click handlers
      const onClick = function(e){ const b = e.currentTarget; const cur = b.dataset.altered === 'true'; if(cur) _applyNormalStyle(b); else _applyAlteredStyle(b); onMarchaChange(); };
      btnR.addEventListener('click', onClick); btnL.addEventListener('click', onClick);
      tdR.appendChild(btnR); tdL.appendChild(btnL); tr.appendChild(td1); tr.appendChild(tdR); tr.appendChild(tdL); tbody.appendChild(tr);
    });
    // description
    desc.value = (existing && existing.description) ? existing.description : '';
    desc.addEventListener('input', debounce(()=>{ onMarchaChange(); }, 600));

    // constants buttons
    constantsContainer.innerHTML = '';
    const existingConsts = (existing && existing.constants) ? existing.constants : {};
    MARCHA_CONSTANTS.forEach((c, idx)=>{
      const btn = document.createElement('button'); btn.className='marcha-const-btn'; btn.dataset.key = c; btn.style.padding='8px 12px'; btn.style.border='none'; btn.style.borderRadius='8px'; btn.style.cursor='pointer'; btn.style.marginRight='6px'; btn.style.minWidth='160px'; btn.style.textAlign='center';
      // initialize using the style functions which now render label + icon
      const altered = !!existingConsts[c]; if(altered) _applyAlteredStyle(btn); else _applyNormalStyle(btn);
      btn.addEventListener('click', (e)=>{ const b=e.currentTarget; const cur = b.dataset.altered==='true'; if(cur) _applyNormalStyle(b); else _applyAlteredStyle(b); onMarchaChange(); });
      constantsContainer.appendChild(btn);
      // layout: break after 3 items
      if((idx+1)%3===0) constantsContainer.appendChild(document.createElement('br'));
    });
  }

  function collectMarchaFromUI(){ const table = document.getElementById('marcha_phases_table'); const desc = document.getElementById('marcha_desc'); const constantsContainer = document.getElementById('marcha_constants'); const out = { phases: [], description: '', constants: {} };
    if(!table) return out; const rows = Array.from(table.querySelectorAll('tbody tr'));
    rows.forEach(r=>{ const phase = r.children && r.children[0] && r.children[0].textContent && r.children[0].textContent.trim(); if(!phase) return; const btnR = r.querySelector('button[data-side="right"]'); const btnL = r.querySelector('button[data-side="left"]'); const rightAltered = btnR ? (btnR.dataset.altered==='true') : false; const leftAltered = btnL ? (btnL.dataset.altered==='true') : false; out.phases.push({ phase: phase, rightAltered: rightAltered, leftAltered: leftAltered }); });
    out.description = desc ? (desc.value || '') : '';
    if(constantsContainer){ Array.from(constantsContainer.querySelectorAll('button')).forEach(b=>{ const k = b.dataset.key; if(k) out.constants[k] = (b.dataset.altered==='true'); }); }
    return out;
  }

  // autosave removed for marcha: update in-memory currentVal only
  const onMarchaChange = debounce(()=>{ try{ const payload = gatherForm(); currentVal = payload; }catch(e){ /* ignore */ } }, 350);

  // --- Escalas support ---
  let customScales = [];
  // pruebas específicas (multiple entries saved with la valoración)
  let pruebasEspecificas = [];

  // Top-level safe renderer for Pruebas específicas (defensive: works even if nested escalas init fails)
  function renderPruebasListGlobal(){ try{ const list = document.getElementById('es_test_list'); const savedMsg = document.getElementById('es_test_saved'); if(!list) return; list.innerHTML = ''; if(!pruebasEspecificas || !pruebasEspecificas.length){ list.innerHTML = '<div style="color:var(--muted)">(No hay pruebas específicas guardadas)</div>'; if(savedMsg) savedMsg.textContent = 'Guarda pruebas específicas para incluirlas en la valoración.'; return; } pruebasEspecificas.forEach((t, idx)=>{ const row = document.createElement('div'); row.className='card-surface'; row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.gap='8px'; row.style.marginBottom='8px'; const left = document.createElement('div'); left.innerHTML = `<div style="font-weight:700">${escapeHtml(t.name)}</div><div style="color:var(--muted);font-size:0.9rem">Qué evalúa: ${escapeHtml(t.que || '')}</div><div style="color:var(--muted);font-size:0.9rem">Resultado: ${escapeHtml(t.resultado || '')}</div>`; const right = document.createElement('div'); const del = document.createElement('button'); del.className='btn btn-ghost'; del.textContent='Eliminar'; del.addEventListener('click', ()=>{ pruebasEspecificas.splice(idx,1); // persist removal
    try{ persistPruebas(); }catch(e){} renderPruebasListGlobal(); }); right.appendChild(del); row.appendChild(left); row.appendChild(right); list.appendChild(row); }); if(savedMsg) savedMsg.textContent = `${pruebasEspecificas.length} prueba(s) guardada(s).`; }catch(e){ console.warn('renderPruebasListGlobal', e); } }

  // Top-level safe saver for current prueba (used by buttons bound at DOMContentLoaded)
  function saveCurrentTestGlobal(clearAfter){ try{ const name = (document.getElementById('es_test_name')||{}).value||''; const que = (document.getElementById('es_test_eval')||{}).value||''; const resultado = (document.getElementById('es_test_result')||{}).value||''; if(!name.trim()){ const m = document.getElementById('val_msg'); if(m) m.textContent = 'Nombre de prueba obligatorio.'; return; } pruebasEspecificas.push({ name: name.trim(), que: que.trim(), resultado: resultado.trim() }); // persist
    try{ persistPruebas(); }catch(e){ console.warn('saveCurrentTestGlobal persist', e); }
      renderPruebasListGlobal(); if(clearAfter){ (document.getElementById('es_test_name')||{}).value=''; (document.getElementById('es_test_eval')||{}).value=''; (document.getElementById('es_test_result')||{}).value='Positiva'; const m = document.getElementById('val_msg'); if(m) m.textContent = 'Prueba guardada. Puedes agregar otra.'; } else { const m = document.getElementById('val_msg'); if(m) m.textContent = 'Prueba guardada.'; } }catch(e){ console.warn('saveCurrentTestGlobal', e); } }
  function computeSPPB(){ const b = parseInt((document.getElementById('sppb_balance')||{}).value,10); const g = parseInt((document.getElementById('sppb_gait')||{}).value,10); const c = parseInt((document.getElementById('sppb_chair')||{}).value,10);
    let bb = isNaN(b)?0:b; let gg = isNaN(g)?0:g; let cc = isNaN(c)?0:c;
    const total = Math.max(0, Math.min(12, (bb||0) + (gg||0) + (cc||0)));
    return { total, components: { balance: bb, gait: gg, chair: cc } };
  }

  function computeTinetti(){ const gg = parseInt((document.getElementById('tinetti_gait')||{}).value,10); const bb = parseInt((document.getElementById('tinetti_balance')||{}).value,10); const g = isNaN(gg)?0:gg; const b = isNaN(bb)?0:bb; const total = Math.max(0, Math.min(28, g + b)); return { total, gait: g, balance: b }; }

  function computeBerg(){ const v = parseInt((document.getElementById('berg_total')||{}).value,10); return { total: isNaN(v)?null:v }; }

  // Interpretations for scales
  function interpretSPPB(total){ if(total==null) return 'No disponible'; if(total<=3) return 'Bajo rendimiento físico; alto riesgo funcional'; if(total<=6) return 'Rendimiento pobre'; if(total<=9) return 'Rendimiento moderado'; return 'Rendimiento bueno (bajo riesgo funcional)'; }
  function interpretTinetti(total){ if(total==null) return 'No disponible'; if(total<=18) return 'Alto riesgo de caídas'; if(total<=24) return 'Riesgo moderado de caídas'; return 'Bajo riesgo de caídas'; }
  function interpretFRAIL(score){ if(score==null || isNaN(score)) return 'No disponible'; if(score<=0) return 'Robusto (no frágil)'; if(score<=2) return 'Pre-frágil'; return 'Frágil'; }
  function interpretDownton(score){ if(score==null || isNaN(score)) return 'No disponible'; if(score<=0) return 'Bajo riesgo de caídas'; if(score<=2) return 'Riesgo moderado de caídas'; return 'Alto riesgo de caídas'; }
  function interpretKatz(score){ if(score==null || isNaN(score)) return 'No disponible'; if(score>=6) return 'Independiente en actividades básicas (Katz 6)'; if(score>=4) return 'Dependencia moderada en ADL'; return 'Dependencia severa en ADL'; }
  function interpretLawton(score){ if(score==null || isNaN(score)) return 'No disponible'; if(score>=8) return 'Independencia instrumental completa'; if(score>=5) return 'Dependencia instrumental leve/moderada'; return 'Dependencia instrumental severa'; }

  function renderEscalasSection(){ // enhanced: SPPB, Tinetti, FRAIL, Downton, KATZ, Lawton + custom
    const outSPPB = document.getElementById('esc_sppb_result'); const outT = document.getElementById('esc_tinetti_result');
    const existing = (currentVal && currentVal.escalas) ? currentVal.escalas : null;
  // initialize customScales from existing payload (support legacy single 'custom' too)
  customScales = [];
  if(existing){ if(Array.isArray(existing.customs)) customScales = existing.customs.slice(); else if(existing.custom) customScales = [ existing.custom ]; }
  // restore tests (only TUG is used) and specific tests list if present
  if(existing && existing.pruebas){ (document.getElementById('inp_tug')||{}).value = existing.pruebas.tug || ''; }
    // pruebasEspecificas handled separately (top-level payload.pruebasEspecificas). Do not load from escalas.
    pruebasEspecificas = [];

    // restore SPPB/Tinetti
    if(existing && existing.sppb){ (document.getElementById('sppb_balance')||{}).value = existing.sppb.components.balance || ''; (document.getElementById('sppb_gait')||{}).value = existing.sppb.components.gait || ''; (document.getElementById('sppb_chair')||{}).value = existing.sppb.components.chair || ''; outSPPB.textContent = existing.sppb.total!=null?existing.sppb.total:'—'; const interp = interpretSPPB(existing.sppb.total); if(document.getElementById('esc_sppb_interp')) document.getElementById('esc_sppb_interp').textContent = interp; }
    if(existing && existing.tinetti){ (document.getElementById('tinetti_gait')||{}).value = existing.tinetti.gait || ''; (document.getElementById('tinetti_balance')||{}).value = existing.tinetti.balance || ''; outT.textContent = existing.tinetti.total!=null?existing.tinetti.total:'—'; const interpT = interpretTinetti(existing.tinetti.total); if(document.getElementById('esc_tinetti_interp')) document.getElementById('esc_tinetti_interp').textContent = interpT; }

    // restore FRAIL/Downton/Katz/Lawton and custom
    if(existing){ if(existing.frail) (document.getElementById('inp_frail')||{}).value = existing.frail.score || ''; if(existing.downton) (document.getElementById('inp_downton')||{}).value = existing.downton.score || ''; if(existing.katz) (document.getElementById('inp_katz')||{}).value = existing.katz.score || ''; if(existing.lawton) (document.getElementById('inp_lawton')||{}).value = existing.lawton.score || ''; if(existing.custom) { (document.getElementById('es_custom_name')||{}).value = existing.custom.name||''; (document.getElementById('es_custom_score')||{}).value = existing.custom.score||''; (document.getElementById('es_custom_interp')||{}).value = existing.custom.interpretacion||''; } }

    // helpers that compute + save
  // autosave for escalas removed — manual persist only
  const doComputeAndSave = function() { /* no-op: autosave removed */ };

  // calculate automatically on input change (no buttons)

  // helper: render list of saved custom scales in the UI
  function renderCustomScalesList(){ const list = document.getElementById('es_custom_list'); const savedMsg = document.getElementById('es_custom_saved'); if(!list) return; list.innerHTML = ''; if(!customScales.length){ list.innerHTML = '<div style="color:var(--muted)">(No hay escalas personalizadas guardadas)</div>'; if(savedMsg) savedMsg.textContent = 'Guarda la escala para incluirla en la valoración.'; return; } customScales.forEach((c, idx)=>{ const row = document.createElement('div'); row.className='card-surface'; row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.gap='8px'; row.style.marginBottom='8px'; const left = document.createElement('div'); left.innerHTML = `<div style="font-weight:700">${escapeHtml(c.name)}</div><div style="color:var(--muted);font-size:0.9rem">Puntaje: ${escapeHtml(String(c.score||''))}</div><div style="color:var(--muted);font-size:0.9rem">${escapeHtml(c.interpretacion||'')}</div>`; const right = document.createElement('div'); const del = document.createElement('button'); del.className='btn btn-ghost'; del.textContent='Eliminar'; del.addEventListener('click', ()=>{ customScales.splice(idx,1); persistEscalas(); renderCustomScalesList(); }); right.appendChild(del); row.appendChild(left); row.appendChild(right); list.appendChild(row); }); if(savedMsg) savedMsg.textContent = `${customScales.length} escala(s) personalizada(s) guardada(s).`; }

  // helper: render list of saved 'Pruebas específicas'
  function renderPruebasList(){ const list = document.getElementById('es_test_list'); const savedMsg = document.getElementById('es_test_saved'); if(!list) return; list.innerHTML = ''; if(!pruebasEspecificas.length){ list.innerHTML = '<div style="color:var(--muted)">(No hay pruebas específicas guardadas)</div>'; if(savedMsg) savedMsg.textContent = 'Guarda pruebas específicas para incluirlas en la valoración.'; return; } pruebasEspecificas.forEach((t, idx)=>{ const row = document.createElement('div'); row.className='card-surface'; row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.gap='8px'; row.style.marginBottom='8px'; const left = document.createElement('div'); left.innerHTML = `<div style="font-weight:700">${escapeHtml(t.name)}</div><div style="color:var(--muted);font-size:0.9rem">Qué evalúa: ${escapeHtml(t.que || '')}</div><div style="color:var(--muted);font-size:0.9rem">Resultado: ${escapeHtml(t.resultado || '')}</div>`; const right = document.createElement('div'); const del = document.createElement('button'); del.className='btn btn-ghost'; del.textContent='Eliminar'; del.addEventListener('click', ()=>{ pruebasEspecificas.splice(idx,1); persistEscalas(); renderPruebasList(); }); right.appendChild(del); row.appendChild(left); row.appendChild(right); list.appendChild(row); }); if(savedMsg) savedMsg.textContent = `${pruebasEspecificas.length} prueba(s) guardada(s).`; }

  // helper: persist current escalas (including customScales)
  function persistEscalas(){ try{ const payload = gatherForm(); // override custom collection
    const es = collectEscalasFromUI(); es.customs = customScales.slice(); payload.escalas = es; payload.status = 'Borrador'; upsertVal(payload); currentVal = payload; const msg = document.getElementById('val_msg'); if(msg) msg.textContent = 'Escalas guardadas.'; }catch(e){ console.warn('persistEscalas', e); } }

  // helper: persist pruebas específicas as a top-level field (separate from escalas)
  function persistPruebas(){ try{ const payload = gatherForm(); payload.pruebasEspecificas = pruebasEspecificas.slice(); payload.status = 'Borrador'; upsertVal(payload); currentVal = payload; const msg = document.getElementById('val_msg'); if(msg) msg.textContent = 'Pruebas específicas guardadas.'; }catch(e){ console.warn('persistPruebas', e); } }

  // save current custom scale; if clearAfter=true, clear inputs so user can add another
  function saveCurrentCustom(clearAfter){ const name = (document.getElementById('es_custom_name')||{}).value||''; const score = (document.getElementById('es_custom_score')||{}).value||''; const interp = (document.getElementById('es_custom_interp')||{}).value||''; if(!name.trim()){ const m = document.getElementById('val_msg'); if(m) m.textContent = 'Nombre de escala obligatorio.'; return; } customScales.push({ name: name.trim(), score: score.trim(), interpretacion: interp.trim() }); persistEscalas(); renderCustomScalesList(); if(clearAfter){ (document.getElementById('es_custom_name')||{}).value=''; (document.getElementById('es_custom_score')||{}).value=''; (document.getElementById('es_custom_interp')||{}).value=''; const m = document.getElementById('val_msg'); if(m) m.textContent = 'Escala guardada. Puedes agregar otra.'; } else { const m = document.getElementById('val_msg'); if(m) m.textContent = 'Escala guardada.'; } }

  // custom save buttons
  const btnC = document.getElementById('btn_save_custom_scale'); if(btnC) btnC.addEventListener('click', ()=>{ saveCurrentCustom(false); });
  const btnAdd = document.getElementById('btn_add_custom_scale'); if(btnAdd) btnAdd.addEventListener('click', ()=>{ saveCurrentCustom(true); });

  // save current specific test; if clearAfter=true clear inputs to add another
  function saveCurrentTest(clearAfter){ const name = (document.getElementById('es_test_name')||{}).value||''; const que = (document.getElementById('es_test_eval')||{}).value||''; const resultado = (document.getElementById('es_test_result')||{}).value||''; if(!name.trim()){ const m = document.getElementById('val_msg'); if(m) m.textContent = 'Nombre de prueba obligatorio.'; return; } pruebasEspecificas.push({ name: name.trim(), que: que.trim(), resultado: resultado.trim() }); persistEscalas(); renderPruebasList(); if(clearAfter){ (document.getElementById('es_test_name')||{}).value=''; (document.getElementById('es_test_eval')||{}).value=''; (document.getElementById('es_test_result')||{}).value='Positiva'; const m = document.getElementById('val_msg'); if(m) m.textContent = 'Prueba guardada. Puedes agregar otra.'; } else { const m = document.getElementById('val_msg'); if(m) m.textContent = 'Prueba guardada.'; } }
  const btnT = document.getElementById('btn_save_test'); if(btnT) btnT.addEventListener('click', ()=>{ saveCurrentTest(false); });
  const btnTAdd = document.getElementById('btn_add_test'); if(btnTAdd) btnTAdd.addEventListener('click', ()=>{ saveCurrentTest(true); });

  // render existing saved customs & pruebas lists
  renderCustomScalesList();
  renderPruebasList();

  // inputs are not wired to autosave; computations remain manual or persisted via 'Guardar como borrador'
  }

  function collectEscalasFromUI(){
    const pruebas = {}; const tug = parseFloat((document.getElementById('inp_tug')||{}).value);
    if(!isNaN(tug)) pruebas.tug = tug;
    const sppb = computeSPPB(); const tinetti = computeTinetti();
    // FRAIL / Downton / Katz / Lawton
    const frailScore = (document.getElementById('inp_frail')||{}).value; const downtonScore = (document.getElementById('inp_downton')||{}).value; const katzScore = (document.getElementById('inp_katz')||{}).value; const lawtonScore = (document.getElementById('inp_lawton')||{}).value;
    const frail = { score: frailScore!==''? Number(frailScore): null, interpretation: interpretFRAIL(Number(frailScore)) };
    const downton = { score: downtonScore!==''? Number(downtonScore): null, interpretation: interpretDownton(Number(downtonScore)) };
    const katz = { score: katzScore!==''? Number(katzScore): null, interpretation: interpretKatz(Number(katzScore)) };
    const lawton = { score: lawtonScore!==''? Number(lawtonScore): null, interpretation: interpretLawton(Number(lawtonScore)) };
    // custom scales (array)
    return { pruebas, sppb, tinetti, frail, downton, katz, lawton, customs: customScales.slice() };
  }

  function collectDanielsFromUI(){ const container = document.getElementById('daniels_container'); if(!container) return []; const out = []; container.querySelectorAll('tr').forEach(tr=>{ const selR = tr.querySelector('select[data-side="right"]'); const selL = tr.querySelector('select[data-side="left"]'); const muscle = tr.children && tr.children[0] && tr.children[0].textContent && tr.children[0].textContent.trim(); const comment = tr.querySelector('.daniels-comment')?.value || '';
    if(!muscle) return; const r = selR ? (selR.value!==''? parseInt(selR.value,10): null) : null; const l = selL ? (selL.value!==''? parseInt(selL.value,10): null) : null; if(r!=null || l!=null || (comment && comment.trim())){ out.push({ muscle: muscle, right: r, left: l, comment: comment?comment.trim():'' }); } }); return out; }

  // open modal for a single side measurement
  let modalContext = null; // {joint,movement,side}
  function openMeasurementModal(joint,mov,side){ const modal = document.getElementById('goniModalOverlay'); const ctx = document.getElementById('goniModalContext'); const input = document.getElementById('goni_value'); const exp = document.getElementById('goni_expected'); const interp = document.getElementById('goni_interpretation'); if(!modal||!input) return; modal.style.display='flex'; modal.setAttribute('aria-hidden','false'); modalContext = { joint, movement: mov, side };
    ctx.textContent = `${joint} — ${mov} (${side==='right'?'Derecha':'Izquierda'})`;
    const expected = (EXPECTED_ROM[joint]||{})[mov] || null; exp.textContent = expected ? `Valor esperado (ROM normal): ${expected}°` : 'Valor esperado no disponible';
    const entry = goniData.find(g=>g.joint===joint && g.movement===mov);
    const existing = entry ? (side==='right'? entry.right : entry.left) : null; input.value = existing!=null ? existing : '';
    interp.textContent = '';
    // wire save/cancel
    const cancel = document.getElementById('goniCancel'); const save = document.getElementById('goniSave'); function close(){ modal.style.display='none'; modal.setAttribute('aria-hidden','true'); cancel.removeEventListener('click', onCancel); save.removeEventListener('click', onSave); }
    function onCancel(){ close(); }
    function updateMeasurementButtonInDOM(joint,mov,side){ // update only the specific measurement button in the existing table
      try{
        const btn = Array.from(document.querySelectorAll('.goni-meas-btn')).find(b=>b.dataset.joint===joint && b.dataset.movement===mov && b.dataset.side===side);
        const entry = goniData.find(g=>g.joint===joint && g.movement===mov);
        if(!btn) return;
          // if there's no stored measurement -> assumed default state
          if(!entry || (side==='right' ? entry.right==null : entry.left==null)){
            delete btn.dataset.assumed; // ensure clean before setting
            // assumed (not measured) state - use goni-assumed class
            btn.textContent = '✓';
            btn.classList.remove('goni-measured-good','goni-measured-warn','goni-measured-mid','goni-measured-bad','goni-empty');
            btn.classList.add('goni-assumed');
            btn.title = 'Asumido: rango completo (no medido)'; btn.dataset.assumed = 'true'; return;
          }
          const val = side==='right' ? entry.right : entry.left; const expectedVal = entry.expected || ((EXPECTED_ROM[joint]||{})[mov] || null);
          const pct = expectedVal ? Math.round((val/expectedVal)*100) : null;
          // determine color for measured values (intense green for >=90)
          const colors = window.APP_SCALE_COLORS || { excellent: '#16a34a', moderate: '#f59e0b', poor: '#ef4444' };
          let bg = colors.poor; if(pct!==null){ if(pct>=90) bg = colors.excellent; else if(pct>=80) bg = colors.moderate; else if(pct>=65) bg = '#f97316'; else bg = colors.poor; }
          const symbol = (pct!==null && pct>=80) ? '✓' : (pct!==null ? '✖' : '');
  delete btn.dataset.assumed;
  btn.textContent = `${val}°${symbol?(' '+symbol):''}`;
  // map pct to class
  btn.classList.remove('goni-assumed','goni-empty','goni-measured-good','goni-measured-warn','goni-measured-mid','goni-measured-bad');
  if(pct!==null){ if(pct>=90) btn.classList.add('goni-measured-good'); else if(pct>=80) btn.classList.add('goni-measured-warn'); else if(pct>=65) btn.classList.add('goni-measured-mid'); else btn.classList.add('goni-measured-bad'); } else { btn.classList.add('goni-measured-good'); }
  btn.title = pct!==null ? `${pct}% del ROM esperado (${expectedVal}°)` : `${val}°`;
      }catch(e){ console.warn('updateMeasurementButtonInDOM', e); }
    }

    function onSave(){ const v = parseFloat(input.value||''); const now = new Date().toISOString(); const expectedVal = expected||null;
      // update data model
      let e = goniData.find(g=>g.joint===joint && g.movement===mov);
      if(isNaN(v)){
        // clear value for this side
        if(e){ if(side==='right') e.right = null; else e.left = null; if(e.left==null && e.right==null){ // remove entry if both empty
            const ix = goniData.findIndex(x=>x.joint===joint && x.movement===mov); if(ix>=0) goniData.splice(ix,1);
          } }
      } else {
        if(!e){ e = { joint, movement: mov, left:null, right:null, expected: expectedVal, createdAt: now }; goniData.push(e); }
        if(side==='right'){ e.right = v; e.rightPct = expectedVal? Math.round((v/expectedVal)*100):null; } else { e.left = v; e.leftPct = expectedVal? Math.round((v/expectedVal)*100):null; }
        e.updatedAt = now;
      }
      // update only the relevant button(s) in the table
      updateMeasurementButtonInDOM(joint,mov,side);
      // if we removed the whole entry, also update the opposite side button to clear it
      if(!goniData.find(g=>g.joint===joint && g.movement===mov)){
        const otherSide = side==='right'?'left':'right'; const otherBtn = Array.from(document.querySelectorAll('.goni-meas-btn')).find(b=>b.dataset.joint===joint && b.dataset.movement===mov && b.dataset.side===otherSide);
  if(otherBtn){ otherBtn.textContent = '–'; otherBtn.classList.remove('goni-measured-good','goni-measured-warn','goni-measured-mid','goni-measured-bad','goni-assumed'); otherBtn.classList.add('goni-empty'); otherBtn.title = 'Sin medición'; }
      }
      close(); }
    cancel.addEventListener('click', onCancel); save.addEventListener('click', onSave);
  }


  function collectAntecedentesFromUI(){ const container = document.getElementById('val_antecedentes_container'); if(!container) return []; const arr = []; container.querySelectorAll('div').forEach(div=>{ // div rows
    const txt = div.children && div.children[0] && (div.children[0].textContent||'').trim(); if(txt) arr.push(txt); }); return arr; }

  // autosave on timeout removed: no-op helper kept for compatibility
  function autoSaveDraftOnTimeout(){ /* autosave removed */ }

  function gatherForm(){ const payload = { paciente: getPatientId(), fecha: (document.getElementById('val_fecha')||{}).value || new Date().toISOString().slice(0,10), hora_start: (document.getElementById('val_hora_start')||{}).value || '', hora_end: (document.getElementById('val_hora_end')||{}).value || '', tipo: (document.getElementById('val_tipo')||{}).value||'', habitacion: (document.getElementById('val_habitacion')||{}).value||'', responsable: (document.getElementById('val_responsable')||{}).value||'', apoyo: (document.getElementById('val_apoyo')||{}).value||'', antecedentes: collectAntecedentesFromUI(), alicia: { a: (document.getElementById('alic_a')||{}).value||'', l: (document.getElementById('alic_l')||{}).value||'', i: (document.getElementById('alic_i')||{}).value||'', c: (document.getElementById('alic_c')||{}).value||'', i2: (document.getElementById('alic_i2')||{}).value||'', a2: (document.getElementById('alic_a2')||{}).value||'' }, postura: { anterior: (document.getElementById('post_anterior')||{}).value||'', lateral: (document.getElementById('post_lateral')||{}).value||'', posterior: (document.getElementById('post_posterior')||{}).value||'', cefalo: (document.getElementById('post_cefalo')||{}).value||'' }, diagnostico: (document.getElementById('val_diagnostico')||{}).value||'', status: currentVal && currentVal.status || 'Borrador' };
    // preserve selected options' prefixes if present (keeps PSS/LFT/EF)
    try{ const selResp = document.getElementById('val_responsable'); const selAp = document.getElementById('val_apoyo'); const rp = selResp && selResp.selectedOptions && selResp.selectedOptions[0] ? (selResp.selectedOptions[0].dataset && selResp.selectedOptions[0].dataset.prefix ? selResp.selectedOptions[0].dataset.prefix : '') : ''; const ap = selAp && selAp.selectedOptions && selAp.selectedOptions[0] ? (selAp.selectedOptions[0].dataset && selAp.selectedOptions[0].dataset.prefix ? selAp.selectedOptions[0].dataset.prefix : '') : ''; if(rp) payload.responsable_prefix = rp; if(ap) payload.apoyo_prefix = ap; }
    catch(e){ /* ignore */ }
    // include observaciones (final free-text field)
    payload.observaciones = (document.getElementById('val_observaciones')||{}).value || '';
    // attach goniometría measurements
    payload.goniometria = Array.isArray(goniData) ? goniData.slice() : (currentVal && currentVal.goniometria) || [];
    // attach daniels strength grid
    try{ payload.daniels = collectDanielsFromUI(); }catch(e){ payload.daniels = (currentVal && currentVal.daniels) || []; }
  // attach marcha (gait)
  try{ payload.marcha = collectMarchaFromUI(); }catch(e){ payload.marcha = (currentVal && currentVal.marcha) || { phases: [], description: '', constants: {} }; }
    // attach escalas
    try{ payload.escalas = collectEscalasFromUI(); }catch(e){ payload.escalas = (currentVal && currentVal.escalas) || {}; }
    
    // attach escalas estandarizadas (from escalas.js)
    try{ 
      if(window.HSV_Escalas && typeof window.HSV_Escalas.getAllScalesData === 'function'){
        const standardScales = window.HSV_Escalas.getAllScalesData();
        payload.escalasEstandarizadas = standardScales;
      } else {
        payload.escalasEstandarizadas = {};
      }
    }catch(e){ payload.escalasEstandarizadas = (currentVal && currentVal.escalasEstandarizadas) || {}; }
    if(currentVal && currentVal.id) payload.id = currentVal.id;
    return payload;
  }

  // Initialize add form: date, time options, responsables, load antecedentes from Información General
  function initAddForm(){ 
    console.log('🔧 initAddForm() called - iniciando renderizado de secciones');
    // Unlock form first
    unlockForm();
    
    // Si currentVal es null, limpiar todos los campos (nueva valoración)
    if (!currentVal) {
      console.log('📝 Nueva valoración - limpiando formulario');
      // Limpiar todos los inputs, textareas y selects
      const form = document.getElementById('view_addvaloracion');
      if (form) {
        form.querySelectorAll('input[type="text"], input[type="date"], input[type="time"], textarea, select').forEach(el => {
          if (el.id === 'val_fecha') {
            // La fecha se establece a continuación
            return;
          }
          if (el.id === 'val_habitacion') {
            // La habitación se establece después
            return;
          }
          if (el.id === 'val_responsable' || el.id === 'val_apoyo') {
            // Los selects se establecen después
            return;
          }
          // Limpiar otros campos
          if (el.tagName === 'SELECT') {
            el.selectedIndex = 0;
          } else {
            el.value = '';
          }
        });
      }
      // Limpiar arrays globales si existen
      if (typeof goniData !== 'undefined') goniData = [];
      if (typeof customScales !== 'undefined') customScales = [];
      if (typeof pruebasEspecificas !== 'undefined') pruebasEspecificas = [];
    }
    
    // date
    const fecha = document.getElementById('val_fecha'); 
    if(fecha){ 
      const iso = new Date().toISOString().slice(0,10); 
      fecha.value = iso; 
      const label = document.getElementById('val_fecha_label'); 
      if(label) label.textContent = formatDateLongES(iso); 
      fecha.addEventListener('change', ()=>{ if(label) label.textContent = formatDateLongES(fecha.value); }); 
    }
    // time slots
    const start = document.getElementById('val_hora_start'); 
    const end = document.getElementById('val_hora_end'); 
    if(start && end){ 
      start.innerHTML=''; 
      end.innerHTML=''; 
      const startMins = 7*60; 
      const endMins = 20*60+30; 
      for(let m=startMins;m<=endMins;m+=30){ 
        const hh = String(Math.floor(m/60)).padStart(2,'0'); 
        const mm = String(m%60).padStart(2,'0'); 
        const label = `${hh}:${mm}`; 
        const o1 = document.createElement('option'); 
        o1.value = label; 
        o1.textContent = label; 
        const o2 = o1.cloneNode(true); 
        start.appendChild(o1); 
        end.appendChild(o2);
      } 
      start.selectedIndex = 0; 
      end.selectedIndex = 1; 
      start.addEventListener('change', ()=>{ 
        const idx = start.selectedIndex; 
        end.selectedIndex = Math.min(end.options.length-1, idx+1); 
      }); 
    }

    // set habitación from USUARIAS preestablecida list
    const paciente_actual = sessionStorage.getItem('paciente_actual');
    const habitacion_field = document.getElementById('val_habitacion');
    if(habitacion_field && paciente_actual){
      const usuaria = USUARIAS.find(u => u.nombre === paciente_actual);
      if(usuaria && usuaria.habitacion){
        habitacion_field.value = usuaria.habitacion;
        console.log('✅ Habitación establecida automáticamente:', usuaria.habitacion);
      }
    }

    // responsables & apoyo - mirror plan/note selects (dedupe and preserve data-prefix)
    const sel = document.getElementById('val_responsable'); const ap = document.getElementById('val_apoyo');
    if(sel){
      // start fresh with placeholder
      sel.innerHTML = '<option value="">-- Selecciona responsable --</option>';
      const seen = new Set();
      // prefer plan_responsable as primary source, then note_responsable as fallback
      const sources = [document.getElementById('plan_responsable'), document.getElementById('note_responsable')];
      sources.forEach(src=>{ if(!src) return; Array.from(src.options).forEach(o=>{ const val = (o.value||o.textContent||'').trim(); if(!val) return; if(seen.has(val)) return; seen.add(val); const copy = document.createElement('option'); copy.value = val; copy.textContent = o.textContent || o.value || val; if(o.dataset && o.dataset.prefix) copy.dataset.prefix = o.dataset.prefix; sel.appendChild(copy); }); });
      // if we're editing an existing valoración, restore selection
      if(currentVal && currentVal.responsable){ try{ sel.value = currentVal.responsable; }catch(e){} }
      else {
        // set default responsable to logged-in user
        const responsable_name = sessionStorage.getItem('responsable_name');
        if(responsable_name){
          sel.value = responsable_name;
          console.log('✅ Responsable establecido automáticamente:', responsable_name);
        }
      }
    }
    if(ap){
      ap.innerHTML = '<option value="">-- Selecciona apoyo --</option>';
      const seenA = new Set();
      const sourcesA = [document.getElementById('plan_apoyo'), document.getElementById('note_apoyo')];
      sourcesA.forEach(src=>{ if(!src) return; Array.from(src.options).forEach(o=>{ const val = (o.value||o.textContent||'').trim(); if(!val) return; if(seenA.has(val)) return; seenA.add(val); const copy = document.createElement('option'); copy.value = val; copy.textContent = o.textContent || o.value || val; if(o.dataset && o.dataset.prefix) copy.dataset.prefix = o.dataset.prefix; ap.appendChild(copy); }); });
      if(currentVal && currentVal.apoyo){ try{ ap.value = currentVal.apoyo; }catch(e){} }
    }

    // Load antecedentes from Información General
    let antecedentes = [];
    try{ if(window._info && typeof window._info.loadFromDB === 'function'){ const rec = window._info.loadFromDB(); if(rec){ // try common keys
          const keys = ['info_antecedentes','antecedentes','antecedentes_patologicos','antecedentes_patologicos_list']; for(const k of keys){ if(rec[k]){ if(Array.isArray(rec[k])) antecedentes = rec[k].slice(); else if(typeof rec[k] === 'string') antecedentes = rec[k].split(/\n|•/).map(s=>s.trim()).filter(Boolean); if(antecedentes.length) break; } }
        }
      }
    }catch(e){ console.warn('load antecedentes', e); }
    renderAntecedentes(antecedentes);

    // wire add antecedent button
    const addBtn = document.getElementById('btn_add_antecedente'); if(addBtn){ addBtn.addEventListener('click', ()=>{ const txt = (document.getElementById('val_new_antecedente')||{}).value || ''; if(!txt.trim()) return; // append
        // if current UI shows '(Sin antecedentes previos)', convert to list
        let list = collectAntecedentesFromUI(); if(list.length===1 && list[0]==='(Sin antecedentes previos)') list = [];
        list.push(txt.trim()); renderAntecedentes(list); document.getElementById('val_new_antecedente').value=''; }); }

    // posture cefalo-caudal auto show when anterior==posterior
    const pa = document.getElementById('post_anterior'); const pp = document.getElementById('post_posterior'); function checkCefalo(){ try{ const ca = (pa||{}).value||''; const cp = (pp||{}).value||''; const cc = document.getElementById('cefalo_caudal_container'); if(ca.trim() && cp.trim() && ca.trim()===cp.trim()){ cc.style.display='block'; } else { cc.style.display='none'; } }catch(e){} }
    if(pa && pp){ pa.addEventListener('input', checkCefalo); pp.addEventListener('input', checkCefalo); }

    // goniometría: render segment selectors and restore any existing measurements
    try{ renderSegmentSelectors(); const applyBtn = document.getElementById('btn_apply_goni_selection'); if(applyBtn){ applyBtn.disabled = true; applyBtn.addEventListener('click', applySelection); }
      // if editing an existing valoración, load its goniometría
      if(currentVal && Array.isArray(currentVal.goniometria) && currentVal.goniometria.length){ goniData = currentVal.goniometria.slice(); } else { goniData = []; }
      // render tables and summary
      renderGoniTables(); renderGoniList(); }catch(e){ console.warn('goni init', e); }

    // daniels: render strength grid and restore existing values
    try{ renderDanielsTable(); }catch(e){ console.warn('daniels init', e); }

  // marcha: render march/gait section
  try{ renderMarchaSection(); }catch(e){ console.warn('marcha init', e); }

    // escalas estandarizadas: initialize the new scales section
    try{ if(window.HSV_Escalas && typeof window.HSV_Escalas.init === 'function'){ window.HSV_Escalas.init(); } }catch(e){ console.warn('escalas estandarizadas init', e); }

  // *** RESTORE ALL FIELDS IF EDITING AN EXISTING VALORACIÓN (currentVal is set) ***
  try{ 
    if(currentVal){ 
      // Basic fields
      if(currentVal.tipo) (document.getElementById('val_tipo')||{}).value = currentVal.tipo;
      if(currentVal.habitacion) (document.getElementById('val_habitacion')||{}).value = currentVal.habitacion;
      if(currentVal.responsable) (document.getElementById('val_responsable')||{}).value = currentVal.responsable;
      if(currentVal.apoyo) (document.getElementById('val_apoyo')||{}).value = currentVal.apoyo;
      if(currentVal.diagnostico) (document.getElementById('val_diagnostico')||{}).value = currentVal.diagnostico; 
      if(currentVal.observaciones) (document.getElementById('val_observaciones')||{}).value = currentVal.observaciones;
      
      // Restore fecha into input+label (show friendly long format)
      if(currentVal.fecha){ 
        const fEl = document.getElementById('val_fecha'); 
        const fLab = document.getElementById('val_fecha_label'); 
        try{ 
          if(fEl) fEl.value = currentVal.fecha; 
          if(fLab) fLab.textContent = formatDateLongES(currentVal.fecha); 
        }catch(e){} 
      }
      
      // Restore time fields
      if(currentVal.hora_start) (document.getElementById('val_hora_start')||{}).value = currentVal.hora_start;
      if(currentVal.hora_end) (document.getElementById('val_hora_end')||{}).value = currentVal.hora_end;
      
      // Restore ALICIA fields
      if(currentVal.alicia){
        if(currentVal.alicia.a) (document.getElementById('alic_a')||{}).value = currentVal.alicia.a;
        if(currentVal.alicia.l) (document.getElementById('alic_l')||{}).value = currentVal.alicia.l;
        if(currentVal.alicia.i) (document.getElementById('alic_i')||{}).value = currentVal.alicia.i;
        if(currentVal.alicia.c) (document.getElementById('alic_c')||{}).value = currentVal.alicia.c;
        if(currentVal.alicia.i2) (document.getElementById('alic_i2')||{}).value = currentVal.alicia.i2;
        if(currentVal.alicia.a2) (document.getElementById('alic_a2')||{}).value = currentVal.alicia.a2;
      }
      
      // Restore postura fields
      if(currentVal.postura){
        if(currentVal.postura.anterior) (document.getElementById('post_anterior')||{}).value = currentVal.postura.anterior;
        if(currentVal.postura.lateral) (document.getElementById('post_lateral')||{}).value = currentVal.postura.lateral;
        if(currentVal.postura.posterior) (document.getElementById('post_posterior')||{}).value = currentVal.postura.posterior;
        if(currentVal.postura.cefalo) (document.getElementById('post_cefalo')||{}).value = currentVal.postura.cefalo;
      }
      
      // Restore antecedentes (already handled above in renderAntecedentes)
      if(Array.isArray(currentVal.antecedentes) && currentVal.antecedentes.length > 0){
        renderAntecedentes(currentVal.antecedentes);
      }
      
      // Restore pruebas específicas from top-level payload.pruebasEspecificas
      if(Array.isArray(currentVal.pruebasEspecificas)) { 
        pruebasEspecificas = currentVal.pruebasEspecificas.slice(); 
        renderPruebasListGlobal(); 
      }
      
      // Restore marcha
      if(currentVal.marcha){
        try{ renderMarchaSection(); }catch(e){ console.warn('Error restoring marcha', e); }
      }
      
      // Clear message
      const msg = document.getElementById('val_msg'); 
      if(msg) msg.textContent = 'Editando borrador...';
      setTimeout(()=>{ if(msg) msg.textContent = ''; }, 2000);
    }
  }catch(e){ 
    console.warn('Error restoring valoración fields:', e); 
  }

  // autosave timer removed; simply unlock the form for manual actions
  if(document.getElementById('val_msg') && !currentVal) document.getElementById('val_msg').textContent='';
  }

  // Clear form when creating new valoración
  function clearValoracionForm() {
    // Reset currentVal to null
    currentVal = null;
    
    // Reset all text inputs
    const textFields = ['val_tipo', 'val_new_antecedente', 'alic_a', 'alic_l', 'alic_i', 'alic_c', 'alic_i2', 'alic_a2', 'val_diagnostico', 'val_observaciones'];
    textFields.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    
    // Reset all textareas
    const textareas = ['post_anterior', 'post_lateral', 'post_posterior', 'post_cefalo'];
    textareas.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    
    // Reset selects to default
    const selects = ['val_responsable', 'val_apoyo'];
    selects.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.selectedIndex = 0;
    });
    
    // Reset time selects
    const start = document.getElementById('val_hora_start');
    const end = document.getElementById('val_hora_end');
    if (start) start.selectedIndex = 0;
    if (end) end.selectedIndex = 1;
    
    // Reset date to today
    const fecha = document.getElementById('val_fecha');
    if (fecha) {
      const iso = new Date().toISOString().slice(0,10);
      fecha.value = iso;
      const label = document.getElementById('val_fecha_label');
      if (label) label.textContent = formatDateLongES(iso);
    }
    
    // Clear goniometry data
    goniData = [];
    try { renderGoniTables(); renderGoniList(); } catch(e) {}
    
    // Clear pruebas específicas
    pruebasEspecificas = [];
    try { renderPruebasListGlobal(); } catch(e) {}
    
    // Clear custom scales
    customScales = [];
    
    // Reset escalas module if available
    if (typeof window.HSV_Escalas !== 'undefined' && typeof window.HSV_Escalas.resetAllScales === 'function') {
      try { window.HSV_Escalas.resetAllScales(); } catch(e) { console.warn('Error reseteando escalas:', e); }
    }
    
    // Clear antecedentes display
    const antContainer = document.getElementById('val_antecedentes_container');
    if (antContainer) antContainer.innerHTML = '';
    
    // Hide cefalo-caudal container
    const ccContainer = document.getElementById('cefalo_caudal_container');
    if (ccContainer) ccContainer.style.display = 'none';
    
    // Clear message
    const msg = document.getElementById('val_msg');
    if (msg) msg.textContent = '';
    
    console.log('✓ Formulario de valoración limpiado para nueva entrada');
  }

  // Save actions
  function saveDraft(){ if(valLocked) return; const payload = gatherForm(); payload.status = 'Borrador'; payload.updatedAt = new Date().toISOString(); if(!payload.id) payload.createdAt = payload.updatedAt; upsertVal(payload); currentVal = payload; const msg = document.getElementById('val_msg'); if(msg) msg.textContent = 'Borrador guardado.'; }

  function signAndSave(){ if(valLocked) return; const payload = gatherForm(); // require responsable pin if prefix requires
    const sel = document.getElementById('val_responsable'); const resName = sel?.selectedOptions[0]?.textContent || ''; const prefix = sel?.selectedOptions[0]?.dataset?.prefix || '';
    
    // Solo LFT y PSS pueden firmar valoraciones
    const upfx = (prefix||'').toUpperCase();
    if(upfx !== 'LFT' && upfx !== 'PSS'){
      alert('Solo los responsables LFT y PSS pueden firmar valoraciones. Los practicantes no tienen permiso de firma.');
      return;
    }
    
    const after = function(success){ if(!success){ const msg = document.getElementById('val_msg'); if(msg) msg.textContent = 'PIN inválido. Guardado como borrador.'; payload.status='Borrador'; upsertVal(payload); currentVal = payload; return; }
        // on success: mark signed and persist
        payload.status = 'Firmada'; payload.signedAt = new Date().toISOString(); payload.updatedAt = payload.signedAt; // store signed-by prefixed name for audit
        try{ const pref = (sel?.selectedOptions[0]?.dataset?.prefix || ''); payload.responsable_signed = (pref? (pref + ' ' + (resName||'')) : resName); }catch(e){}
        upsertVal(payload); currentVal = payload; const msg = document.getElementById('val_msg'); if(msg) msg.textContent = 'Valoración firmada y guardada.';
        // sync antecedentes to Información General (best-effort)
        try{ if(window._info && typeof window._info.loadFromDB === 'function' && typeof window._info.saveToDB === 'function'){ const rec = window._info.loadFromDB() || { paciente: getPatientId() }; rec.info_antecedentes = payload.antecedentes; rec.updatedAt = payload.updatedAt; window._info.saveToDB(rec); if(typeof window._info.populateForm === 'function') window._info.populateForm(rec); } }catch(e){ console.warn('sync antecedentes', e); }
    };

    // If responsable prefix requires PIN (LFT/PSS), request PIN tied to configured pins; else skip
    try{
      if(upfx === 'LFT' || upfx === 'PSS'){
        // try to compute expected pin from any available global mapping, else fallback to 'ALL' so modal accepts configured pins
        let expected = 'ALL';
        try{ if(window.RESPONSABLE_PINS && window.RESPONSABLE_PINS[resName]) expected = window.RESPONSABLE_PINS[resName]; else if(window._planModule && window._planModule.RESPONSABLE_PINS && window._planModule.RESPONSABLE_PINS[resName]) expected = window._planModule.RESPONSABLE_PINS[resName]; }
        catch(e){ /* ignore */ }
        // fire confetti on successful sign
        const _celebrate2 = function(){ try{ if(typeof window.launchConfetti === 'function'){ window.launchConfetti({count:60}); } else if(typeof window.celebrate === 'function'){ window.celebrate(); } }catch(e){} };
        if(typeof openPinModal === 'function'){ openPinModal(resName, expected, function(ok){ after(ok); if(ok) _celebrate2(); }); } else { const pin = prompt('Introduzca PIN del responsable'); // if we couldn't get expected mapping, accept default '1234' as fallback
          const ok = (expected === 'ALL') ? (pin === '1234') : (pin === expected); after(ok); if(ok) _celebrate2(); }
      } else {
        after(true);
      }
    }catch(e){ console.warn('signAndSave pin flow', e); after(true); }
  }

  // Wire up UI listeners when view shown
  document.addEventListener('DOMContentLoaded', ()=>{
    // init list when entering view
    const origShow = window.showView;
    if(origShow){ window.showView = function(id){ origShow(id); if(id === 'view_valoraciones'){ setTimeout(()=>{ try{ renderList(); }catch(e){} },50); } if(id === 'view_addvaloracion'){ setTimeout(()=>{ try{ initAddForm(); }catch(e){ console.warn('initAddForm',e); } },60); } } }

    // add button handlers - protected with dataset.initialized to prevent duplicate listeners
    const addBtn = document.getElementById('btn_add_valoracion'); 
    if(addBtn && !addBtn.dataset.initialized) {
      addBtn.dataset.initialized = 'true';
      addBtn.addEventListener('click', ()=>{ clearValoracionForm(); window.showView('view_addvaloracion'); });
    }
    
    const saveBtn = document.getElementById('btn_save_valoracion'); 
    if(saveBtn && !saveBtn.dataset.initialized) {
      saveBtn.dataset.initialized = 'true';
      saveBtn.addEventListener('click', ()=>{ saveDraft(); renderList(); });
    }
    
    const signBtn = document.getElementById('btn_sign_valoracion'); 
    if(signBtn && !signBtn.dataset.initialized) {
      signBtn.dataset.initialized = 'true';
      signBtn.addEventListener('click', ()=>{ signAndSave(); renderList(); });
    }
    
    // Bind pruebas específicas buttons to global safe handlers
    const btnT = document.getElementById('btn_save_test'); 
    if(btnT && !btnT.dataset.initialized) {
      btnT.dataset.initialized = 'true';
      btnT.addEventListener('click', ()=>{ saveCurrentTestGlobal(false); });
    }
    
    const btnTAdd = document.getElementById('btn_add_test'); 
    if(btnTAdd && !btnTAdd.dataset.initialized) {
      btnTAdd.dataset.initialized = 'true';
      btnTAdd.addEventListener('click', ()=>{ saveCurrentTestGlobal(true); });
    }
    
    // ensure list renders even if escalas init failed earlier
    setTimeout(()=>{ try{ renderPruebasListGlobal(); }catch(e){} },120);
  });

  // expose for debugging and external access
  window._valoracion = { 
    renderList, 
    initAddForm, 
    viewValoracion, 
    openValoracionAsSubview,
    editValoracion,
    deleteValoracion,
    signValoracion,
    clearValoracionForm
  };
  // TABLET: Exponer funciones de inicialización globalmente
  window.HSV_Valoracion = {
    init: initAddForm,
    renderGoniTables: renderGoniTables,
    renderSegmentSelectors: renderSegmentSelectors,
    renderDanielsTable: renderDanielsTable,
    renderMarchaSection: renderMarchaSection,
    renderEscalasSection: renderEscalasSection
  };
  
  // Exponer utilidades globalmente
  window.formatDateLongES = formatDateLongES;
  
  console.log('✓ Módulo valoracion.js cargado');
})();
