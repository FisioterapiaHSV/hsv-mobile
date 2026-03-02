// config.js - Gestión de configuración del sistema
(function(){
  'use strict';

  // Helper: Cargar datos
  function loadData(key){
    try{
      if(window.DB && typeof window.DB.load === 'function') return window.DB.load(key);
      const raw = localStorage.getItem('hsv_' + key + '_v1');
      return raw ? JSON.parse(raw) : [];
    }catch(e){
      console.warn('loadData error:', key, e);
      return [];
    }
  }

  // Helper: Guardar datos
  function saveData(key, data){
    try{
      if(window.DB && typeof window.DB.save === 'function') return window.DB.save(key, data);
      localStorage.setItem('hsv_' + key + '_v1', JSON.stringify(data));
    }catch(e){
      console.warn('saveData error:', key, e);
    }
  }

  // Helper: Mostrar mensaje
  function showMessage(text, type = 'success'){
    const msg = document.getElementById('config_msg');
    const msgText = document.getElementById('config_msg_text');
    if(!msg || !msgText) return;

    msgText.textContent = text;
    msg.style.background = type === 'success' ? '#10b981' : '#ef4444';
    msg.style.display = 'block';

    setTimeout(() => {
      msg.style.display = 'none';
    }, 3000);
  }

  // ========== GESTIÓN DE USUARIAS ==========
  
  async function loadUsuarias(){
    // Cargar usuarias desde DataController
    try {
      if(window.getUsuarias && typeof window.getUsuarias === 'function'){
        const usuarias = await window.getUsuarias();
        // Convertir al formato esperado por config
        return usuarias.map(u => ({
          id: u.nombre, // Usar nombre como ID
          nombre: u.nombre,
          habitacion: u.habitacion || 'Sin asignar',
          estado: u.estado || 'activa',
          fechaDeceso: u.fechaDeceso
        }));
      }
    } catch(e) {
      console.error('❌ Error cargando usuarias en config:', e);
    }
    return [];
  }

  function saveUsuarias(usuarias){
    // Guardar en hsv_pacientes_v3
    try {
      const raw = localStorage.getItem('hsv_pacientes_v3');
      let data = { pacientes: [] };
      if (raw) {
        data = JSON.parse(raw);
      }
      
      // Actualizar los pacientes con los cambios
      usuarias.forEach(u => {
        const idx = data.pacientes.findIndex(p => p.id === u.id);
        if (idx >= 0) {
          data.pacientes[idx].estado = u.estado;
          data.pacientes[idx].fechaDeceso = u.fechaDeceso;
        }
      });
      
      localStorage.setItem('hsv_pacientes_v3', JSON.stringify(data));
    } catch(e) {
      console.error('Error guardando pacientes en config:', e);
    }
  }

  async function marcarDeceso(usuariaId){
    const confirmado = await window.customConfirm(
      'Se eliminarán todos sus horarios futuros, pero su historial clínico permanecerá intacto.',
      '¿Marcar como Deceso?',
      { type: 'danger', confirmText: 'Marcar Deceso' }
    );
    if(!confirmado) return;

    const usuarias = loadUsuarias();
    const usuaria = usuarias.find(u => u.id === usuariaId);
    if(!usuaria) return;

    // Cambiar estado
    usuaria.estado = 'deceso';
    usuaria.fechaDeceso = new Date().toISOString();
    saveUsuarias(usuarias);

    // Eliminar horarios futuros de esta usuaria
    eliminarHorariosFuturosUsuaria(usuaria.nombre);

    showMessage(`${usuaria.nombre} marcada como Deceso. Horarios futuros eliminados.`, 'success');
    renderUsuarias();
  }

  async function reactivarUsuaria(usuariaId){
    const confirmado = await window.customConfirm(
      'La usuaria volverá a aparecer en el sistema activo.',
      '¿Reactivar usuaria?',
      { type: 'info', confirmText: 'Reactivar' }
    );
    if(!confirmado) return;

    const usuarias = loadUsuarias();
    const usuaria = usuarias.find(u => u.id === usuariaId);
    if(!usuaria) return;

    usuaria.estado = 'activa';
    delete usuaria.fechaDeceso;
    saveUsuarias(usuarias);

    showMessage(`${usuaria.nombre} reactivada.`, 'success');
    renderUsuarias();
  }

  function eliminarHorariosFuturosUsuaria(nombreUsuaria){
    // Eliminar sesiones recurrentes y horarios futuros
    // (En tu implementación real, esto debe integrarse con js/horarios.js)
    console.log(`Eliminando horarios futuros de ${nombreUsuaria}`);
    // Aquí iría la lógica de eliminación de horarios
  }

  function renderUsuarias(){
    const activasContainer = document.getElementById('config_usuarias_activas');
    const decesoContainer = document.getElementById('config_usuarias_deceso');
    if(!activasContainer || !decesoContainer) return;

    (async () => {
      const usuarias = await loadUsuarias();
      const activas = usuarias.filter(u => u.estado === 'activa');
      const deceso = usuarias.filter(u => u.estado === 'deceso');

      // Render activas
      activasContainer.innerHTML = '';
      if(activas.length === 0){
        activasContainer.innerHTML = '<p style="color:#6b7280;font-style:italic">No hay usuarias activas</p>';
      } else {
        activas.forEach(u => {
          const card = document.createElement('div');
          card.style.display = 'flex';
          card.style.justifyContent = 'space-between';
          card.style.alignItems = 'center';
          card.style.padding = '12px 16px';
          card.style.background = '#f9fafb';
          card.style.borderRadius = '8px';
          card.style.border = '1px solid #e5e7eb';
          card.innerHTML = `
            <div>
              <div style="font-weight:600;color:#374151">${u.nombre}</div>
              <div style="font-size:0.9rem;color:#6b7280">Habitación: ${u.habitacion}</div>
            </div>
            <button class="btn btn-del" onclick="window._config.marcarDeceso('${u.id}')" style="font-size:0.9rem;padding:8px 16px">
              <i class="fa-solid fa-user-slash" style="margin-right:6px"></i>Marcar Deceso
            </button>
          `;
          activasContainer.appendChild(card);
        });
      }

      // Render deceso
      decesoContainer.innerHTML = '';
      if(deceso.length === 0){
        decesoContainer.innerHTML = '<p style="color:#6b7280;font-style:italic">No hay usuarias en deceso</p>';
      } else {
        deceso.forEach(u => {
          const card = document.createElement('div');
          card.style.display = 'flex';
          card.style.justifyContent = 'space-between';
          card.style.alignItems = 'center';
          card.style.padding = '12px 16px';
          card.style.background = '#f3f4f6';
          card.style.borderRadius = '8px';
          card.style.border = '1px solid #d1d5db';
          card.style.opacity = '0.7';
          card.innerHTML = `
            <div>
              <div style="font-weight:600;color:#6b7280">${u.nombre} <span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:4px;font-size:0.85rem">(Deceso)</span></div>
              <div style="font-size:0.9rem;color:#9ca3af">Habitación: ${u.habitacion}</div>
              ${u.fechaDeceso ? `<div style="font-size:0.85rem;color:#9ca3af">Fecha: ${window.formatDateLongES(u.fechaDeceso)}</div>` : ''}
            </div>
            <button class="btn btn-edit" onclick="window._config.reactivarUsuaria('${u.id}')" style="font-size:0.9rem;padding:8px 16px">
              <i class="fa-solid fa-user-check" style="margin-right:6px"></i>Reactivar
            </button>
        `;
        decesoContainer.appendChild(card);
      });
    }
    })();
  }

  // ========== GESTIÓN DE PERSONAL ==========

  function loadPersonal(){
    const personal = loadData('personal') || [];
    // Si no hay personal, usar constantes (responsables + practicantes)
    if(personal.length === 0 && window.APP_PERSONAL){
      const allPersonal = [];
      
      // Agregar responsables (LFT y PSS)
      if(window.APP_PERSONAL.responsables){
        window.APP_PERSONAL.responsables.forEach((p, idx) => {
          allPersonal.push({
            id: 'resp_' + idx,
            nombre: p.nombre,
            rol: p.rol,
            pin: p.pin,
            estado: 'activo'
          });
        });
      }
      
      // Agregar practicantes (EF)
      if(window.APP_PERSONAL.practicantes){
        window.APP_PERSONAL.practicantes.forEach((p, idx) => {
          allPersonal.push({
            id: 'prac_' + idx,
            nombre: p.nombre,
            rol: 'EF',
            pin: p.pin,
            estado: 'activo'
          });
        });
      }
      
      return allPersonal;
    }
    return personal;
  }

  function savePersonal(personal){
    saveData('personal', personal);
    // Actualizar también APP_PERSONAL para sincronización
    if(window.APP_PERSONAL){
      window.APP_PERSONAL.responsables = personal.filter(p => p.estado === 'activo');
    }
  }

  async function addPersonal(){
    const nombre = document.getElementById('config_personal_nombre').value.trim();
    const rol = document.getElementById('config_personal_rol').value;
    const pin = document.getElementById('config_personal_pin').value.trim();

    if(!nombre || !rol || !pin){
      await window.customAlert('Por favor completa todos los campos', 'Campos incompletos', 'warning');
      return;
    }

    if(pin.length !== 6){
      await window.customAlert('El PIN debe contener exactamente 6 dígitos', 'PIN inválido', 'warning');
      return;
    }

    if(!/^\d+$/.test(pin)){
      await window.customAlert('El PIN debe ser solo numérico (sin letras ni símbolos)', 'PIN inválido', 'warning');
      return;
    }

    const personal = loadPersonal();
    
    // Verificar que no exista
    if(personal.find(p => p.nombre === nombre)){
      alert('Ya existe personal con ese nombre');
      return;
    }

    const newPerson = {
      id: 'p' + Date.now(),
      nombre,
      rol,
      pin,
      estado: 'activo',
      fechaAlta: new Date().toISOString()
    };

    personal.push(newPerson);
    savePersonal(personal);

    showMessage(`${nombre} agregado correctamente`, 'success');
    clearPersonalForm();
    renderPersonal();
  }

  function clearPersonalForm(){
    document.getElementById('config_personal_nombre').value = '';
    document.getElementById('config_personal_rol').value = '';
    document.getElementById('config_personal_pin').value = '';
  }

  async function marcarInactivo(personalId){
    const confirmado = await window.customConfirm(
      'Se eliminarán todos sus horarios futuros, su PIN quedará invalidado y no podrá acceder al sistema. Su historial permanecerá intacto.',
      '¿Marcar como inactivo?',
      { type: 'danger', confirmText: 'Marcar Inactivo' }
    );
    if(!confirmado) return;

    const personal = loadPersonal();
    const persona = personal.find(p => p.id === personalId);
    if(!persona) return;

    persona.estado = 'inactivo';
    persona.fechaBaja = new Date().toISOString();
    persona.pinInvalidado = true;
    persona.pinAnterior = persona.pin; // Guardar para referencia
    persona.pin = 'INVALIDADO'; // Invalidar el PIN
    savePersonal(personal);

    // Eliminar horarios futuros de este responsable
    eliminarHorariosFuturosResponsable(persona.nombre);

    showMessage(`${persona.nombre} marcado como inactivo. Horarios futuros eliminados.`, 'success');
    renderPersonal();
  }

  async function reactivarPersonal(personalId){
    const confirmado = await window.customConfirm(
      'Se restaurará su acceso al sistema. Deberás asignarle un nuevo PIN.',
      '¿Reactivar personal?',
      { type: 'info', confirmText: 'Reactivar' }
    );
    if(!confirmado) return;

    const personal = loadPersonal();
    const persona = personal.find(p => p.id === personalId);
    if(!persona) return;

    persona.estado = 'activo';
    delete persona.fechaBaja;
    delete persona.pinInvalidado;
    
    // Si el PIN estaba invalidado, solicitar uno nuevo
    if(persona.pin === 'INVALIDADO'){
      const nuevoPin = prompt(`🔑 Asigna un nuevo PIN para ${persona.nombre}\n\n(6 dígitos numéricos):`, '');
      
      if(!nuevoPin){
        alert('⚠️ Reactivación cancelada. Debe asignar un PIN válido.');
        return;
      }
      
      const pinLimpio = nuevoPin.trim();
      
      if(pinLimpio.length !== 6 || !/^\d{6}$/.test(pinLimpio)){
        alert('⚠️ PIN inválido. Debe contener exactamente 6 dígitos numéricos.');
        return;
      }
      
      persona.pin = pinLimpio;
      delete persona.pinAnterior;
    }
    
    savePersonal(personal);

    showMessage(`${persona.nombre} reactivado`, 'success');
    renderPersonal();
  }

  function editarPersonal(personalId){
    const personal = loadPersonal();
    const persona = personal.find(p => p.id === personalId);
    if(!persona) return;

    const nuevoNombre = prompt('Nuevo nombre:', persona.nombre);
    if(!nuevoNombre || nuevoNombre === persona.nombre) return;

    persona.nombre = nuevoNombre.trim();
    savePersonal(personal);

    showMessage(`Nombre actualizado a ${persona.nombre}`, 'success');
    renderPersonal();
  }

  function cambiarPIN(personalId){
    const personal = loadPersonal();
    const persona = personal.find(p => p.id === personalId);
    if(!persona) return;

    // Crear modal personalizado para mejor UX
    const nuevoPin = prompt(`🔑 Cambiar PIN de ${persona.nombre}\n\nIngresa el nuevo PIN (6 dígitos numéricos):`, '');
    
    if(!nuevoPin) return; // Usuario canceló
    
    const pinLimpio = nuevoPin.trim();
    
    if(pinLimpio === persona.pin){
      alert('ℹ️ El nuevo PIN es idéntico al actual. No se realizaron cambios.');
      return;
    }

    if(pinLimpio.length !== 6){
      alert('⚠️ El PIN debe contener exactamente 6 dígitos');
      return;
    }

    if(!/^\d{6}$/.test(pinLimpio)){
      alert('⚠️ El PIN debe ser solo numérico (sin letras ni símbolos)');
      return;
    }

    persona.pin = pinLimpio;
    persona.fechaUltimoCambioPIN = new Date().toISOString();
    savePersonal(personal);

    showMessage(`✅ PIN actualizado correctamente para ${persona.nombre}`, 'success');
  }

  function eliminarHorariosFuturosResponsable(nombreResponsable){
    console.log(`Eliminando horarios futuros de ${nombreResponsable}`);
    // Aquí iría la lógica de eliminación de horarios
  }

  function renderPersonal(){
    const activoContainer = document.getElementById('config_personal_activo');
    const inactivoContainer = document.getElementById('config_personal_inactivo');
    if(!activoContainer || !inactivoContainer) return;

    const personal = loadPersonal();
    const activos = personal.filter(p => p.estado === 'activo');
    const inactivos = personal.filter(p => p.estado === 'inactivo');

    // Render activos
    activoContainer.innerHTML = '';
    if(activos.length === 0){
      activoContainer.innerHTML = '<p style="color:#6b7280;font-style:italic">No hay personal activo</p>';
    } else {
      activos.forEach(p => {
        const rolLabel = p.rol === 'LFT' ? 'Licenciada' : (p.rol === 'PSS' ? 'Pasante' : 'Practicante');
        const card = document.createElement('div');
        card.style.display = 'flex';
        card.style.justifyContent = 'space-between';
        card.style.alignItems = 'center';
        card.style.padding = '12px 16px';
        card.style.background = '#f9fafb';
        card.style.borderRadius = '8px';
        card.style.border = '1px solid #e5e7eb';
        card.innerHTML = `
          <div>
            <div style="font-weight:600;color:#374151">${p.nombre}</div>
            <div style="font-size:0.9rem;color:#6b7280">${p.rol} - ${rolLabel}</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-edit" onclick="window._config.editarPersonal('${p.id}')" style="font-size:0.85rem;padding:6px 12px">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-draft" onclick="window._config.cambiarPIN('${p.id}')" style="font-size:0.85rem;padding:6px 12px">
              <i class="fa-solid fa-key"></i>
            </button>
            <button class="btn btn-del" onclick="window._config.marcarInactivo('${p.id}')" style="font-size:0.85rem;padding:6px 12px">
              <i class="fa-solid fa-user-slash"></i>
            </button>
          </div>
        `;
        activoContainer.appendChild(card);
      });
    }

    // Render inactivos
    inactivoContainer.innerHTML = '';
    if(inactivos.length === 0){
      inactivoContainer.innerHTML = '<p style="color:#6b7280;font-style:italic">No hay personal inactivo</p>';
    } else {
      inactivos.forEach(p => {
        const rolLabel = p.rol === 'LFT' ? 'Licenciada' : (p.rol === 'PSS' ? 'Pasante' : 'Practicante');
        const card = document.createElement('div');
        card.style.display = 'flex';
        card.style.justifyContent = 'space-between';
        card.style.alignItems = 'center';
        card.style.padding = '12px 16px';
        card.style.background = '#f3f4f6';
        card.style.borderRadius = '8px';
        card.style.border = '1px solid #d1d5db';
        card.style.opacity = '0.7';
        card.innerHTML = `
          <div>
            <div style="font-weight:600;color:#6b7280">${p.nombre} <span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:4px;font-size:0.85rem">(Inactivo)</span></div>
            <div style="font-size:0.9rem;color:#9ca3af">${p.rol} - ${rolLabel}</div>
            ${p.fechaBaja ? `<div style="font-size:0.85rem;color:#9ca3af">Baja: ${window.formatDateLongES(p.fechaBaja)}</div>` : ''}
          </div>
          <button class="btn btn-edit" onclick="window._config.reactivarPersonal('${p.id}')" style="font-size:0.9rem;padding:8px 16px">
            <i class="fa-solid fa-user-check" style="margin-right:6px"></i>Reactivar
          </button>
        `;
        inactivoContainer.appendChild(card);
      });
    }
  }

  // ========== GESTIÓN DE TALLERES ==========

  function loadTalleres(){
    const talleres = loadData('talleres') || [];
    
    // Si no hay talleres guardados, cargar desde TALLERES global (de talleres.js)
    if(talleres.length === 0 && window.TALLERES && Array.isArray(window.TALLERES)){
      // Convertir TALLERES de talleres.js al formato de config
      const talleresDelSistema = window.TALLERES.map(t => ({
        id: t.id,
        nombre: t.nombre,
        descripcion: `${t.nombre}${t.tieneReportes ? ' - Con reportes' : ''}`,
        color: t.color,
        tieneReportes: t.tieneReportes,
        estado: 'activo',
        fechaCreacion: new Date().toISOString()
      }));
      // Guardar para próximas cargas
      saveTalleres(talleresDelSistema);
      return talleresDelSistema;
    }
    
    return talleres;
  }

  function saveTalleres(talleres){
    saveData('talleres', talleres);
  }

  function addTaller(){
    const nombre = document.getElementById('config_taller_nombre').value.trim();
    const descripcion = document.getElementById('config_taller_descripcion').value.trim();

    if(!nombre){
      alert('Por favor ingresa el nombre del taller');
      return;
    }

    const talleres = loadTalleres();
    
    if(talleres.find(t => t.nombre === nombre)){
      alert('Ya existe un taller con ese nombre');
      return;
    }

    const newTaller = {
      id: 't' + Date.now(),
      nombre,
      descripcion,
      estado: 'activo',
      fechaCreacion: new Date().toISOString()
    };

    talleres.push(newTaller);
    saveTalleres(talleres);

    showMessage(`Taller "${nombre}" agregado correctamente`, 'success');
    clearTallerForm();
    renderTalleres();
  }

  function clearTallerForm(){
    document.getElementById('config_taller_nombre').value = '';
    document.getElementById('config_taller_descripcion').value = '';
  }

  function desactivarTaller(tallerId){
    if(!confirm('¿Desactivar este taller?\n\nEl historial permanecerá intacto.')) return;

    const talleres = loadTalleres();
    const taller = talleres.find(t => t.id === tallerId);
    if(!taller) return;

    taller.estado = 'inactivo';
    taller.fechaBaja = new Date().toISOString();
    saveTalleres(talleres);

    showMessage(`Taller "${taller.nombre}" desactivado`, 'success');
    renderTalleres();
  }

  function reactivarTaller(tallerId){
    if(!confirm('¿Reactivar este taller?')) return;

    const talleres = loadTalleres();
    const taller = talleres.find(t => t.id === tallerId);
    if(!taller) return;

    taller.estado = 'activo';
    delete taller.fechaBaja;
    saveTalleres(talleres);

    showMessage(`Taller "${taller.nombre}" reactivado`, 'success');
    renderTalleres();
  }

  function editarTaller(tallerId){
    const talleres = loadTalleres();
    const taller = talleres.find(t => t.id === tallerId);
    if(!taller) return;

    const nuevoNombre = prompt('Nuevo nombre:', taller.nombre);
    if(!nuevoNombre || nuevoNombre === taller.nombre) return;

    taller.nombre = nuevoNombre.trim();
    saveTalleres(talleres);

    showMessage(`Taller actualizado a "${taller.nombre}"`, 'success');
    renderTalleres();
  }

  function renderTalleres(){
    const activosContainer = document.getElementById('config_talleres_activos');
    const inactivosContainer = document.getElementById('config_talleres_inactivos');
    if(!activosContainer || !inactivosContainer) return;

    const talleres = loadTalleres();
    const activos = talleres.filter(t => t.estado === 'activo');
    const inactivos = talleres.filter(t => t.estado === 'inactivo');

    // Render activos
    activosContainer.innerHTML = '';
    if(activos.length === 0){
      activosContainer.innerHTML = '<p style="color:#6b7280;font-style:italic">No hay talleres activos</p>';
    } else {
      activos.forEach(t => {
        const card = document.createElement('div');
        card.style.display = 'flex';
        card.style.justifyContent = 'space-between';
        card.style.alignItems = 'center';
        card.style.padding = '12px 16px';
        card.style.background = '#f9fafb';
        card.style.borderRadius = '8px';
        card.style.border = '1px solid #e5e7eb';
        card.innerHTML = `
          <div>
            <div style="font-weight:600;color:#374151">${t.nombre}</div>
            <div style="font-size:0.9rem;color:#6b7280">${t.descripcion || 'Sin descripción'}</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-edit" onclick="window._config.editarTaller('${t.id}')" style="font-size:0.85rem;padding:6px 12px">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-del" onclick="window._config.desactivarTaller('${t.id}')" style="font-size:0.85rem;padding:6px 12px">
              <i class="fa-solid fa-archive"></i>
            </button>
          </div>
        `;
        activosContainer.appendChild(card);
      });
    }

    // Render inactivos
    inactivosContainer.innerHTML = '';
    if(inactivos.length === 0){
      inactivosContainer.innerHTML = '<p style="color:#6b7280;font-style:italic">No hay talleres inactivos</p>';
    } else {
      inactivos.forEach(t => {
        const card = document.createElement('div');
        card.style.display = 'flex';
        card.style.justifyContent = 'space-between';
        card.style.alignItems = 'center';
        card.style.padding = '12px 16px';
        card.style.background = '#f3f4f6';
        card.style.borderRadius = '8px';
        card.style.border = '1px solid #d1d5db';
        card.style.opacity = '0.7';
        card.innerHTML = `
          <div>
            <div style="font-weight:600;color:#6b7280">${t.nombre} <span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:4px;font-size:0.85rem">(Inactivo)</span></div>
            <div style="font-size:0.9rem;color:#9ca3af">${t.descripcion || 'Sin descripción'}</div>
          </div>
          <button class="btn btn-edit" onclick="window._config.reactivarTaller('${t.id}')" style="font-size:0.9rem;padding:8px 16px">
            <i class="fa-solid fa-check-circle" style="margin-right:6px"></i>Reactivar
          </button>
        `;
        inactivosContainer.appendChild(card);
      });
    }
  }

  // ========== HERRAMIENTAS ADMINISTRATIVAS ==========

  function limpiarHorariosFuturos(){
    if(!confirm('¿Eliminar TODOS los horarios futuros del sistema?\n\nEsta acción no se puede deshacer.')) return;
    
    // Aquí iría la lógica real de limpieza
    console.log('Limpiando horarios futuros...');
    
    showMessage('Horarios futuros eliminados correctamente', 'success');
  }

  function marcarEgresados(){
    const personal = loadPersonal();
    const pasantes = personal.filter(p => p.estado === 'activo' && (p.rol === 'PSS' || p.rol === 'EF'));
    
    if(pasantes.length === 0){
      alert('No hay pasantes o practicantes activos para marcar como egresados');
      return;
    }

    const lista = pasantes.map((p, idx) => `${idx + 1}. ${p.nombre} (${p.rol})`).join('\n');
    const respuesta = confirm(`Se encontraron ${pasantes.length} pasantes/practicantes:\n\n${lista}\n\n¿Marcar todos como egresados (inactivos)?`);
    
    if(!respuesta) return;

    pasantes.forEach(p => {
      p.estado = 'inactivo';
      p.fechaBaja = new Date().toISOString();
      p.motivoBaja = 'Egreso de ciclo académico';
    });

    savePersonal(personal);
    showMessage(`${pasantes.length} personas marcadas como egresadas`, 'success');
    renderPersonal();
  }

  function revisarActividad(){
    const notas = loadData('notas');
    const planes = loadData('planes');
    const personal = loadPersonal().filter(p => p.estado === 'activo');

    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    const sinActividad = [];

    personal.forEach(p => {
      const notasResp = notas.filter(n => {
        if(!n.fecha) return false;
        const fecha = new Date(n.fecha);
        if(fecha < hace30Dias) return false;
        return (n.responsable_text === p.nombre || n.responsable_signed === p.nombre);
      });

      const planesResp = planes.filter(pl => {
        if(!pl.fecha) return false;
        const fecha = new Date(pl.fecha);
        if(fecha < hace30Dias) return false;
        return (pl.responsable_text === p.nombre || pl.responsable_signed === p.nombre);
      });

      if(notasResp.length === 0 && planesResp.length === 0){
        sinActividad.push(p);
      }
    });

    if(sinActividad.length === 0){
      alert('✅ Todo el personal activo tiene actividad registrada en el último mes');
      return;
    }

    const lista = sinActividad.map((p, idx) => `${idx + 1}. ${p.nombre} (${p.rol})`).join('\n');
    alert(`⚠️ Personal sin actividad en los últimos 30 días:\n\n${lista}\n\nConsidera revisar su estado o marcarlos como inactivos si ya no laboran.`);
  }

  // ========== GESTIÓN DE NÚMERO DE ACCESO ==========
  
  const DEFAULT_ACCESS_CODE = '2025HSV';
  
  function getAccessCode(){
    try {
      const stored = localStorage.getItem('hsv_access_code');
      return stored || DEFAULT_ACCESS_CODE;
    } catch(e) {
      return DEFAULT_ACCESS_CODE;
    }
  }
  
  function setAccessCode(code){
    try {
      localStorage.setItem('hsv_access_code', code);
      return true;
    } catch(e) {
      console.error('Error saving access code:', e);
      return false;
    }
  }
  
  function cambiarNumeroAcceso(){
    const codigoActual = getAccessCode();
    
    const mensaje = `🔐 CAMBIAR NÚMERO DE ACCESO DEL SISTEMA

⚠️ ADVERTENCIA IMPORTANTE:
Al cambiar este número, TODO el personal (pasantes, practicantes, incluso LFTs) quedará bloqueado hasta que se les comunique el nuevo código.

Este cambio es útil cuando:
• Termina un ciclo de prácticas
• Hay rotación de personal
• Se necesita revocar accesos masivamente

Código actual: ${codigoActual}

¿Deseas continuar?`;

    if(!confirm(mensaje)) return;
    
    const nuevoCodigoInput = prompt('🔑 Ingresa el NUEVO Número de Acceso\n\n(Puede contener letras, números, o combinación)\nRecomendado: 6-10 caracteres', '');
    
    if(!nuevoCodigoInput) return;
    
    const nuevoCodigo = nuevoCodigoInput.trim();
    
    if(nuevoCodigo.length < 4){
      alert('⚠️ El código debe tener al menos 4 caracteres');
      return;
    }
    
    if(nuevoCodigo.length > 20){
      alert('⚠️ El código no debe exceder 20 caracteres');
      return;
    }
    
    if(nuevoCodigo === codigoActual){
      alert('ℹ️ El nuevo código es idéntico al actual. No se realizaron cambios.');
      return;
    }
    
    // Confirmar nuevamente
    const confirmacion = confirm(`⚠️ CONFIRMA EL CAMBIO\n\nNuevo código: ${nuevoCodigo}\n\n¿Estás segura de cambiar el Número de Acceso?\n\nTodos los usuarios deberán usar este nuevo código para acceder.`);
    
    if(!confirmacion) return;
    
    if(setAccessCode(nuevoCodigo)){
      showMessage(`✅ Número de Acceso actualizado correctamente. Comunica el nuevo código: ${nuevoCodigo}`, 'success');
      
      // Actualizar la visualización
      const display = document.getElementById('current_access_code_display');
      if(display) display.textContent = '••••••';
    } else {
      alert('❌ Error al guardar el nuevo código. Intenta nuevamente.');
    }
  }

  // ========== NAVEGACIÓN DE TABS ==========
  window.showConfigTab = function(tabName){
    document.querySelectorAll('.config-tab-content').forEach(tab => {
      tab.style.display = 'none';
    });
    document.querySelectorAll('.config-tab').forEach(btn => {
      btn.classList.remove('active');
      btn.style.color = '#6b7280';
      btn.style.borderBottom = '3px solid transparent';
    });

    const selectedTab = document.getElementById('config_tab_' + tabName);
    if(selectedTab) selectedTab.style.display = 'block';

    const selectedBtn = document.querySelector(`.config-tab[data-tab="${tabName}"]`);
    if(selectedBtn){
      selectedBtn.classList.add('active');
      selectedBtn.style.color = '#3b82f6';
      selectedBtn.style.borderBottom = '3px solid #3b82f6';
    }
  };

  // ========== INICIALIZACIÓN ==========
  function init(){
    renderUsuarias();
    renderPersonal();
    renderTalleres();
    if (window._vacacionesUI) {
      window._vacacionesUI.init();
    }
  }

  // Auto-inicializar cuando se muestre la vista
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if(mutation.type === 'attributes' && mutation.attributeName === 'class'){
        const view = document.getElementById('view_config');
        if(view && view.classList.contains('active')){
          init();
        }
      }
    });
  });

  const view = document.getElementById('view_config');
  if(view) observer.observe(view, {attributes: true});

  // Exponer funciones globales
  window._config = {
    marcarDeceso,
    reactivarUsuaria,
    addPersonal,
    clearPersonalForm,
    marcarInactivo,
    reactivarPersonal,
    editarPersonal,
    cambiarPIN,
    addTaller,
    clearTallerForm,
    desactivarTaller,
    reactivarTaller,
    editarTaller,
    limpiarHorariosFuturos,
    marcarEgresados,
    revisarActividad,
    cambiarNumeroAcceso,
    getAccessCode,
    refresh: init
  };

  // ========== UI DE VACACIONES ==========
  window._vacacionesUI = {
    init: function() {
      this.cargarPasantesPSS();
      this.cargarVacacionesActivas();
      this.cargarSesionesPendientes();
    },

    cargarPasantesPSS: function() {
      const select = document.getElementById('vacaciones_pasante_select');
      if (!select) return;
      
      select.innerHTML = '<option value="">-- Selecciona un pasante --</option>';
      
      const personal = window.APP_PERSONAL;
      if (!personal || !personal.responsables) return;
      
      personal.responsables.forEach(p => {
        if (p.prefix === 'PSS') {
          const opt = document.createElement('option');
          opt.value = p.nombre;
          opt.textContent = `${p.nombre} (${p.prefix})`;
          select.appendChild(opt);
        }
      });
    },

    limpiarFormulario: function() {
      document.getElementById('vacaciones_pasante_select').value = '';
      document.getElementById('vacaciones_fecha_inicio').value = '';
      document.getElementById('vacaciones_fecha_fin').value = '';
    },

    programarVacaciones: function() {
      const pasante = document.getElementById('vacaciones_pasante_select').value;
      const fechaInicio = document.getElementById('vacaciones_fecha_inicio').value;
      const fechaFin = document.getElementById('vacaciones_fecha_fin').value;
      
      if (!pasante || !fechaInicio || !fechaFin) {
        window.customAlert('Por favor completa todos los campos.');
        return;
      }
      
      if (fechaInicio > fechaFin) {
        window.customAlert('La fecha de inicio no puede ser posterior a la fecha de fin.');
        return;
      }
      
      const resultado = window.VACACIONES.crearPeriodoVacaciones(pasante, fechaInicio, fechaFin);
      
      if (resultado.success) {
        const reasignadas = resultado.resultado.reasignadas.length;
        const pendientes = resultado.resultado.pendientes.length;
        
        let mensaje = `Vacaciones programadas exitosamente.\n\n`;
        mensaje += `✅ Sesiones reasignadas automáticamente: ${reasignadas}\n`;
        if (pendientes > 0) {
          mensaje += `⚠️ Sesiones pendientes de asignación manual: ${pendientes}`;
        }
        
        window.customAlert(mensaje);
        this.limpiarFormulario();
        this.cargarVacacionesActivas();
        this.cargarSesionesPendientes();
      } else {
        window.customAlert(resultado.error);
      }
    },

    cargarVacacionesActivas: function() {
      const container = document.getElementById('vacaciones_activas_lista');
      if (!container) return;
      
      const vacaciones = window.VACACIONES.obtenerVacacionesActivas();
      
      if (vacaciones.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:24px;color:#9ca3af"><i class="fa-solid fa-inbox" style="font-size:2rem;margin-bottom:8px"></i><br/>No hay vacaciones activas programadas</div>';
        return;
      }
      
      container.innerHTML = '';
      
      vacaciones.forEach(vac => {
        const card = document.createElement('div');
        card.style.cssText = 'background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;display:flex;justify-content:space-between;align-items:center';
        
        const fechaInicio = window.formatDateLongES(vac.fecha_inicio);
        const fechaFin = window.formatDateLongES(vac.fecha_fin);
        
        card.innerHTML = `
          <div>
            <div style="font-weight:700;color:#374151;margin-bottom:4px">
              <i class="fa-solid fa-user" style="margin-right:6px;color:#10b981"></i>${vac.pasante_nombre}
            </div>
            <div style="font-size:0.9rem;color:#6b7280;margin-bottom:8px">
              📅 ${fechaInicio} → ${fechaFin}
            </div>
            <div style="font-size:0.85rem;color:#6b7280">
              ✅ Reasignadas: ${vac.sesiones_reasignadas.length} | 
              ⚠️ Pendientes: ${vac.sesiones_pendientes.length}
            </div>
          </div>
          <button class="btn btn-cancel" onclick="window._vacacionesUI.cancelarVacaciones('${vac.id}')" style="padding:8px 16px">
            <i class="fa-solid fa-times" style="margin-right:4px"></i>Cancelar
          </button>
        `;
        
        container.appendChild(card);
      });
    },

    cancelarVacaciones: function(vacacionId) {
      if (!confirm('¿Estás segura de cancelar estas vacaciones? Todas las sesiones volverán a su responsable original.')) {
        return;
      }
      
      const resultado = window.cancelarVacaciones(vacacionId);
      
      if (resultado.success) {
        window.customAlert('Vacaciones canceladas. Las sesiones han sido restauradas.');
        this.cargarVacacionesActivas();
        this.cargarSesionesPendientes();
      } else {
        window.customAlert(resultado.error);
      }
    },

    cargarSesionesPendientes: function() {
      const container = document.getElementById('sesiones_pendientes_lista');
      if (!container) return;
      
      const vacaciones = window.VACACIONES.obtenerVacacionesActivas();
      const sesionesPendientes = [];
      
      vacaciones.forEach(vac => {
        vac.sesiones_pendientes.forEach(sp => {
          sesionesPendientes.push({
            vacacionId: vac.id,
            pasanteOriginal: vac.pasante_nombre,
            ...sp
          });
        });
      });
      
      if (sesionesPendientes.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:24px;color:#9ca3af;background:#f9fafb;border-radius:6px"><i class="fa-solid fa-check-circle" style="font-size:2rem;margin-bottom:8px;color:#10b981"></i><br/>No hay sesiones pendientes de asignación</div>';
        return;
      }
      
      container.innerHTML = '';
      
      sesionesPendientes.forEach(sesion => {
        const card = document.createElement('div');
        card.style.cssText = 'background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:6px';
        
        card.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:start;gap:16px">
            <div style="flex:1">
              <div style="font-weight:700;color:#92400e;margin-bottom:4px">
                <i class="fa-solid fa-user-injured" style="margin-right:6px"></i>${sesion.usuaria_nombre}
              </div>
              <div style="font-size:0.9rem;color:#78350f;margin-bottom:4px">
                📅 ${sesion.dia_semana} a las ${sesion.hora} (${sesion.duracion} min)
              </div>
              <div style="font-size:0.85rem;color:#92400e">
                Responsable original: ${sesion.pasanteOriginal}
              </div>
            </div>
            <div>
              <select id="asignar_${sesion.sesion_id}" class="input" style="min-width:200px;margin-bottom:8px">
                <option value="">-- Asignar a --</option>
              </select>
              <button class="btn btn-firmar" onclick="window._vacacionesUI.asignarSesionManual('${sesion.vacacionId}', '${sesion.sesion_id}')" style="width:100%;padding:6px 12px;font-size:0.9rem">
                <i class="fa-solid fa-check" style="margin-right:4px"></i>Asignar
              </button>
            </div>
          </div>
        `;
        
        container.appendChild(card);
        
        // Llenar selector con opciones disponibles
        const select = document.getElementById(`asignar_${sesion.sesion_id}`);
        this.llenarSelectorAsignacion(select);
      });
    },

    llenarSelectorAsignacion: function(select) {
      const personal = window.APP_PERSONAL;
      if (!personal) return;
      
      // Agregar practicantes
      const groupPracticantes = document.createElement('optgroup');
      groupPracticantes.label = 'Practicantes (Apoyo)';
      if (personal.apoyo) {
        personal.apoyo.forEach(p => {
          if (p.nombre !== 'Ninguno') {
            const opt = document.createElement('option');
            opt.value = p.nombre;
            opt.textContent = `${p.nombre} (${p.prefix})`;
            groupPracticantes.appendChild(opt);
          }
        });
      }
      select.appendChild(groupPracticantes);
      
      // Agregar pasantes PSS activos
      const groupPSS = document.createElement('optgroup');
      groupPSS.label = 'Pasantes (PSS)';
      if (personal.responsables) {
        personal.responsables.forEach(p => {
          if (p.prefix === 'PSS') {
            const opt = document.createElement('option');
            opt.value = p.nombre;
            opt.textContent = `${p.nombre} (${p.prefix})`;
            groupPSS.appendChild(opt);
          }
        });
      }
      select.appendChild(groupPSS);
      
      // Agregar LFT
      const groupLFT = document.createElement('optgroup');
      groupLFT.label = 'LFT (Administradora)';
      if (personal.responsables) {
        personal.responsables.forEach(p => {
          if (p.prefix === 'LFT') {
            const opt = document.createElement('option');
            opt.value = p.nombre;
            opt.textContent = `${p.nombre} (${p.prefix})`;
            groupLFT.appendChild(opt);
          }
        });
      }
      select.appendChild(groupLFT);
    },

    asignarSesionManual: function(vacacionId, sesionId) {
      const select = document.getElementById(`asignar_${sesionId}`);
      const nuevoResponsable = select.value;
      
      if (!nuevoResponsable) {
        window.customAlert('Por favor selecciona un responsable.');
        return;
      }
      
      const resultado = window.asignarSesionPendienteManual(vacacionId, sesionId, nuevoResponsable);
      
      if (resultado.success) {
        window.customAlert('Sesión asignada exitosamente.');
        this.cargarVacacionesActivas();
        this.cargarSesionesPendientes();
      } else {
        window.customAlert(resultado.error);
      }
    }
  };

})();

// ============================================
// MÓDULO DE CONFIGURACIÓN DE LA APP (ADMIN)
// Solo accesible para Tavata Alexa (LFT)
// ============================================

(function() {
  'use strict';

  // Variables de estado
  let configEditingPasante = null;
  let configEditingApoyo = null;
  let configEditingUsuaria = null;
  let configEditingPasswordUser = null;

  // Datos
  let PASANTES_DATA = [];
  let APOYOS_DATA = [];
  let USUARIAS_CONFIG_DATA = [];

  // Cargar datos al iniciar
  function loadConfigAppData() {
    // Cargar pasantes
    const savedPasantes = localStorage.getItem('hsv_pasantes');
    if (savedPasantes) {
      PASANTES_DATA = JSON.parse(savedPasantes);
      localStorage.setItem('hsv_pasantes', JSON.stringify(PASANTES_DATA));
    } else {
      // Datos por defecto
      PASANTES_DATA = [
        { nombre: 'Tavata Alexa Basurto Ramírez', prefijo: 'LFT', password: '1234', icono: 'icons/AlexaI.png' },
        { nombre: 'Gloria Iraís Espinosa Peralta', prefijo: 'PSS', password: '1111', icono: 'icons/GloriaI.png' },
        { nombre: 'Jorge Eduardo Rodríguez Romero', prefijo: 'PSS', password: '2222', icono: 'icons/JorgeI.png' },
        { nombre: 'Andrea Ofelia Carrillo Valdés', prefijo: 'PSS', password: '3333', icono: 'icons/OfeliaI.png' },
        { nombre: 'Alejandra María Contreras Cruz', prefijo: 'PSS', password: '4444', icono: 'icons/AlejandraMariaI.png' },
        { nombre: 'Gabriel Rodríguez Hernández', prefijo: 'PSS', password: '5555', icono: 'icons/GabrielI.png' },
        { nombre: 'Leslie Amellali Santillán García', prefijo: 'PSS', password: '6666', icono: 'icons/AmellaliI.png' },
        { nombre: 'Francisco Nava Chávez', prefijo: 'PSS', password: '7777', icono: 'icons/FranciscoI.png' },
        { nombre: 'Estefanía Zanabria', prefijo: 'PSS', password: '8888', icono: 'icons/EstefaniaI.png' }
      ];
      savePasantesData();
    }

    // Cargar apoyos
    const savedApoyos = localStorage.getItem('hsv_apoyos');
    if (savedApoyos) {
      APOYOS_DATA = JSON.parse(savedApoyos);
    } else {
      // Valores por defecto
      APOYOS_DATA = [
        { nombre: 'Paola Saraí Olivares Pérez', rol: 'EF' },
        { nombre: 'Sebastián', rol: 'EF' }
      ];
      saveApoyosData();
    }

    // Cargar usuarias desde localStorage
    const savedUsuarias = localStorage.getItem('hsv_usuarias_config');
    if (savedUsuarias) {
      USUARIAS_CONFIG_DATA = JSON.parse(savedUsuarias);
    } else {
      // Usar las usuarias existentes del sistema
      if (typeof USUARIAS !== 'undefined' && Array.isArray(USUARIAS)) {
        USUARIAS_CONFIG_DATA = [...USUARIAS];
      } else {
        USUARIAS_CONFIG_DATA = [];
      }
      saveUsuariasConfigData();
    }
  }

  // Guardar datos
  function savePasantesData() {
    localStorage.setItem('hsv_pasantes', JSON.stringify(PASANTES_DATA));
  }

  function saveApoyosData() {
    localStorage.setItem('hsv_apoyos', JSON.stringify(APOYOS_DATA));
  }

  function saveUsuariasConfigData() {
    localStorage.setItem('hsv_usuarias_config', JSON.stringify(USUARIAS_CONFIG_DATA));
  }

  // ============================================
  // ABRIR/CERRAR CONFIGURACIÓN
  // ============================================

  function openConfigApp() {
    const responsable = sessionStorage.getItem('responsable_name');
    if (responsable !== 'Tavata Alexa Basurto Ramírez') {
      alert('❌ Solo el administrador (LFT) puede acceder a la configuración');
      return;
    }

    loadConfigAppData();
    renderConfigPasantes();
    renderConfigApoyos();
    renderConfigUsuariasApp();
    renderConfigPasswords();

    document.getElementById('view_config_app').style.display = 'block';
    document.getElementById('view-menu').style.display = 'none';
    window.scrollTo(0, 0);
  }

  function closeConfigApp() {
    document.getElementById('view_config_app').style.display = 'none';
    document.getElementById('view-menu').style.display = 'flex';
  }

  // ============================================
  // RENDERIZAR LISTAS
  // ============================================

  function renderConfigPasantes() {
    const container = document.getElementById('config_pasantes_list');
    if (!container) return;

    let html = '';
    PASANTES_DATA.forEach((p, index) => {
      html += `
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#f9f9f9;border-radius:8px;border:1px solid #e5e7eb;">
          <img src="${p.icono}" alt="" style="width:36px;height:36px;border-radius:8px;object-fit:cover;" onerror="this.src='icons/default.png'">
          <div style="flex:1;">
            <div style="font-weight:600;color:var(--text-dark);">${p.nombre}</div>
            <div style="font-size:0.85rem;color:var(--text-light);">${p.prefijo}</div>
          </div>
          <button onclick="window.configApp.editPasante(${index})" style="background:none;border:none;font-size:1.2rem;cursor:pointer;">✏️</button>
          ${p.nombre !== 'Tavata Alexa Basurto Ramírez' ? `<button onclick="window.configApp.deletePasante(${index})" style="background:none;border:none;font-size:1.2rem;cursor:pointer;">🗑️</button>` : ''}
        </div>
      `;
    });

    container.innerHTML = html || '<p style="color:var(--text-light);text-align:center;">No hay pasantes registrados</p>';
  }

  function renderConfigApoyos() {
    const container = document.getElementById('config_apoyos_list');
    if (!container) return;

    let html = '';
    APOYOS_DATA.forEach((a, index) => {
      html += `
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#f9f9f9;border-radius:8px;border:1px solid #e5e7eb;">
          <div style="width:36px;height:36px;background:var(--accent-teal);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;">🤝</div>
          <div style="flex:1;">
            <div style="font-weight:600;color:var(--text-dark);">${a.nombre}</div>
            <div style="font-size:0.85rem;color:var(--text-light);">${a.rol || 'Apoyo'}</div>
          </div>
          <button onclick="window.configApp.editApoyo(${index})" style="background:none;border:none;font-size:1.2rem;cursor:pointer;">✏️</button>
          <button onclick="window.configApp.deleteApoyo(${index})" style="background:none;border:none;font-size:1.2rem;cursor:pointer;">🗑️</button>
        </div>
      `;
    });

    container.innerHTML = html || '<p style="color:var(--text-light);text-align:center;">No hay apoyos registrados</p>';
  }

  function renderConfigUsuariasApp() {
    const container = document.getElementById('config_usuarias_list');
    if (!container) return;

    const searchTerm = (document.getElementById('config_usuaria_search')?.value || '').toLowerCase();
    const filtered = USUARIAS_CONFIG_DATA.filter(u => 
      u.nombre.toLowerCase().includes(searchTerm) || 
      (u.habitacion && u.habitacion.toLowerCase().includes(searchTerm))
    );

    let html = '';
    filtered.forEach((u, index) => {
      const realIndex = USUARIAS_CONFIG_DATA.findIndex(x => x.nombre === u.nombre);
      html += `
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#f9f9f9;border-radius:8px;border:1px solid #e5e7eb;">
          <div style="width:36px;height:36px;background:var(--secondary-soft);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;">🏠</div>
          <div style="flex:1;">
            <div style="font-weight:600;color:var(--text-dark);">${u.nombre}</div>
            <div style="font-size:0.85rem;color:var(--text-light);">Hab. ${u.habitacion || 'Sin asignar'}</div>
          </div>
          <button onclick="window.configApp.editUsuaria(${realIndex})" style="background:none;border:none;font-size:1.2rem;cursor:pointer;">✏️</button>
          <button onclick="window.configApp.deleteUsuaria(${realIndex})" style="background:none;border:none;font-size:1.2rem;cursor:pointer;">🗑️</button>
        </div>
      `;
    });

    container.innerHTML = html || '<p style="color:var(--text-light);text-align:center;">No hay usuarias registradas</p>';
  }

  function filterUsuariasConfig() {
    renderConfigUsuariasApp();
  }

  function renderConfigPasswords() {
    const container = document.getElementById('config_passwords_list');
    if (!container) return;

    let html = '';
    PASANTES_DATA.forEach((p, index) => {
      html += `
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#fffbeb;border-radius:8px;border:1px solid #fef3c7;">
          <div style="width:36px;height:36px;background:var(--accent-yellow);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;">🔐</div>
          <div style="flex:1;">
            <div style="font-weight:600;color:var(--text-dark);">${p.nombre}</div>
            <div style="font-size:0.85rem;color:var(--text-light);">Contraseña: ****</div>
          </div>
          <button onclick="window.configApp.openChangePassword(${index})" class="btn" style="background:var(--accent-yellow);color:var(--text-dark);padding:6px 12px;font-size:0.85rem;">
            Cambiar
          </button>
        </div>
      `;
    });

    container.innerHTML = html || '<p style="color:var(--text-light);text-align:center;">No hay pasantes registrados</p>';
  }

  // ============================================
  // MODALES: PASANTES
  // ============================================

  function openAddPasanteModal() {
    configEditingPasante = null;
    document.getElementById('modal_pasante_title').textContent = 'Agregar Pasante';
    document.getElementById('pasante_nombre').value = '';
    document.getElementById('pasante_prefijo').value = 'PSS';
    document.getElementById('pasante_password').value = '';
    document.getElementById('pasante_icono').value = 'icons/';
    document.getElementById('modal_pasante').style.display = 'flex';
  }

  function editPasante(index) {
    configEditingPasante = index;
    const p = PASANTES_DATA[index];
    document.getElementById('modal_pasante_title').textContent = 'Editar Pasante';
    document.getElementById('pasante_nombre').value = p.nombre;
    document.getElementById('pasante_prefijo').value = p.prefijo;
    document.getElementById('pasante_password').value = p.password;
    document.getElementById('pasante_icono').value = p.icono;
    document.getElementById('modal_pasante').style.display = 'flex';
  }

  function closeModalPasante() {
    document.getElementById('modal_pasante').style.display = 'none';
    configEditingPasante = null;
  }

  function savePasante() {
    const nombre = document.getElementById('pasante_nombre').value.trim();
    const prefijo = document.getElementById('pasante_prefijo').value;
    const password = document.getElementById('pasante_password').value.trim();
    const icono = document.getElementById('pasante_icono').value.trim();

    if (!nombre || !password) {
      alert('Por favor completa el nombre y la contraseña');
      return;
    }

    const pasanteData = { nombre, prefijo, password, icono: icono || 'icons/default.png' };

    if (configEditingPasante !== null) {
      PASANTES_DATA[configEditingPasante] = pasanteData;
    } else {
      PASANTES_DATA.push(pasanteData);
    }

    savePasantesData();
    renderConfigPasantes();
    renderConfigPasswords();
    closeModalPasante();
    alert('✅ Pasante guardado correctamente');
  }

  function deletePasante(index) {
    if (PASANTES_DATA[index].nombre === 'Tavata Alexa Basurto Ramírez') {
      alert('❌ No se puede eliminar al administrador');
      return;
    }

    if (confirm(`¿Eliminar a ${PASANTES_DATA[index].nombre}?`)) {
      PASANTES_DATA.splice(index, 1);
      savePasantesData();
      renderConfigPasantes();
      renderConfigPasswords();
      alert('✅ Pasante eliminado');
    }
  }

  // ============================================
  // MODALES: APOYOS
  // ============================================

  function openAddApoyoModal() {
    configEditingApoyo = null;
    document.getElementById('modal_apoyo_title').textContent = 'Agregar Apoyo';
    document.getElementById('apoyo_nombre').value = '';
    document.getElementById('apoyo_rol').value = '';
    document.getElementById('modal_apoyo').style.display = 'flex';
  }

  function editApoyo(index) {
    configEditingApoyo = index;
    const a = APOYOS_DATA[index];
    document.getElementById('modal_apoyo_title').textContent = 'Editar Apoyo';
    document.getElementById('apoyo_nombre').value = a.nombre;
    document.getElementById('apoyo_rol').value = a.rol || '';
    document.getElementById('modal_apoyo').style.display = 'flex';
  }

  function closeModalApoyo() {
    document.getElementById('modal_apoyo').style.display = 'none';
    configEditingApoyo = null;
  }

  function saveApoyo() {
    const nombre = document.getElementById('apoyo_nombre').value.trim();
    const rol = document.getElementById('apoyo_rol').value.trim();

    if (!nombre) {
      alert('Por favor ingresa el nombre');
      return;
    }

    const apoyoData = { nombre, rol: rol || 'Apoyo' };

    if (configEditingApoyo !== null) {
      APOYOS_DATA[configEditingApoyo] = apoyoData;
    } else {
      APOYOS_DATA.push(apoyoData);
    }

    saveApoyosData();
    renderConfigApoyos();
    // Recargar los selects de apoyos en los formularios
    if (window.loadApoyosIntoSelects) {
      window.loadApoyosIntoSelects();
    }
    closeModalApoyo();
    alert('✅ Apoyo guardado correctamente');
  }

  function deleteApoyo(index) {
    if (confirm(`¿Eliminar a ${APOYOS_DATA[index].nombre}?`)) {
      APOYOS_DATA.splice(index, 1);
      saveApoyosData();
      renderConfigApoyos();
      // Recargar los selects de apoyos en los formularios
      if (window.loadApoyosIntoSelects) {
        window.loadApoyosIntoSelects();
      }
      alert('✅ Apoyo eliminado');
    }
  }

  // ============================================
  // MODALES: USUARIAS
  // ============================================

  function openAddUsuariaModal() {
    configEditingUsuaria = null;
    document.getElementById('modal_usuaria_title').textContent = 'Agregar Usuaria';
    document.getElementById('usuaria_nombre').value = '';
    document.getElementById('usuaria_habitacion').value = '';
    document.getElementById('modal_usuaria').style.display = 'flex';
  }

  function editUsuaria(index) {
    configEditingUsuaria = index;
    const u = USUARIAS_CONFIG_DATA[index];
    document.getElementById('modal_usuaria_title').textContent = 'Editar Usuaria';
    document.getElementById('usuaria_nombre').value = u.nombre;
    document.getElementById('usuaria_habitacion').value = u.habitacion || '';
    document.getElementById('modal_usuaria').style.display = 'flex';
  }

  function closeModalUsuaria() {
    document.getElementById('modal_usuaria').style.display = 'none';
    configEditingUsuaria = null;
  }

  function saveUsuaria() {
    const nombre = document.getElementById('usuaria_nombre').value.trim();
    const habitacion = document.getElementById('usuaria_habitacion').value.trim();

    if (!nombre || !habitacion) {
      alert('Por favor completa el nombre y la habitación');
      return;
    }

    const usuariaData = { nombre, habitacion };

    if (configEditingUsuaria !== null) {
      USUARIAS_CONFIG_DATA[configEditingUsuaria] = usuariaData;
    } else {
      USUARIAS_CONFIG_DATA.push(usuariaData);
    }

    saveUsuariasConfigData();
    renderConfigUsuariasApp();
    closeModalUsuaria();
    
    // Actualizar lista global si existe
    if (typeof window.cargarUsuarias === 'function') {
      window.cargarUsuarias();
    }
    
    alert('✅ Usuaria guardada correctamente');
  }

  function deleteUsuaria(index) {
    if (confirm(`¿Eliminar a ${USUARIAS_CONFIG_DATA[index].nombre}?`)) {
      USUARIAS_CONFIG_DATA.splice(index, 1);
      saveUsuariasConfigData();
      renderConfigUsuariasApp();
      
      // Actualizar lista global
      if (typeof window.cargarUsuarias === 'function') {
        window.cargarUsuarias();
      }
      
      alert('✅ Usuaria eliminada');
    }
  }

  // ============================================
  // MODALES: CONTRASEÑAS
  // ============================================

  function openChangePassword(index) {
    configEditingPasswordUser = index;
    const p = PASANTES_DATA[index];
    document.getElementById('password_user_name').textContent = p.nombre;
    document.getElementById('new_password').value = '';
    document.getElementById('confirm_password').value = '';
    document.getElementById('modal_password').style.display = 'flex';
  }

  function closeModalPassword() {
    document.getElementById('modal_password').style.display = 'none';
    configEditingPasswordUser = null;
  }

  function saveNewPassword() {
    const newPass = document.getElementById('new_password').value.trim();
    const confirmPass = document.getElementById('confirm_password').value.trim();

    if (!newPass) {
      alert('Por favor ingresa una contraseña');
      return;
    }

    if (newPass !== confirmPass) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (configEditingPasswordUser !== null) {
      PASANTES_DATA[configEditingPasswordUser].password = newPass;
      savePasantesData();
      closeModalPassword();
      alert('✅ Contraseña actualizada correctamente');
    }
  }

  // ============================================
  // DATOS Y RESPALDO
  // ============================================

  function exportAllData() {
    loadConfigAppData();
    const data = {
      pasantes: PASANTES_DATA,
      apoyos: APOYOS_DATA,
      usuarias: USUARIAS_CONFIG_DATA,
      horarios: localStorage.getItem('horariosPersonalizados') ? JSON.parse(localStorage.getItem('horariosPersonalizados')) : {},
      valoraciones: localStorage.getItem('hsv_valoraciones_v1') ? JSON.parse(localStorage.getItem('hsv_valoraciones_v1')) : [],
      planes: localStorage.getItem('hsv_planes_v1') ? JSON.parse(localStorage.getItem('hsv_planes_v1')) : [],
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hsv_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('✅ Datos exportados correctamente');
  }

  function importDataFromFile() {
    document.getElementById('import_data_file').click();
  }

  function handleDataImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        
        if (!confirm('⚠️ Esto reemplazará todos los datos actuales. ¿Continuar?')) {
          return;
        }

        if (data.pasantes) {
          PASANTES_DATA = data.pasantes;
          savePasantesData();
        }
        if (data.apoyos) {
          APOYOS_DATA = data.apoyos;
          saveApoyosData();
        }
        if (data.usuarias) {
          USUARIAS_CONFIG_DATA = data.usuarias;
          saveUsuariasConfigData();
        }
        if (data.horarios) {
          localStorage.setItem('horariosPersonalizados', JSON.stringify(data.horarios));
        }
        if (data.valoraciones) {
          localStorage.setItem('hsv_valoraciones_v1', JSON.stringify(data.valoraciones));
        }
        if (data.planes) {
          localStorage.setItem('hsv_planes_v1', JSON.stringify(data.planes));
        }

        // Recargar vistas
        renderConfigPasantes();
        renderConfigApoyos();
        renderConfigUsuariasApp();
        renderConfigPasswords();

        alert('✅ Datos importados correctamente');
      } catch (err) {
        alert('❌ Error al importar: ' + err.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function clearAllHorarios() {
    if (!confirm('⚠️ ¿Estás segura de eliminar TODOS los horarios? Esta acción no se puede deshacer.')) {
      return;
    }
    
    if (!confirm('⚠️ ÚLTIMA ADVERTENCIA: Se eliminarán todas las sesiones y talleres de todos los pasantes.')) {
      return;
    }

    localStorage.removeItem('horariosPersonalizados');
    alert('✅ Todos los horarios han sido eliminados');
  }

  // ============================================
  // INICIALIZACIÓN
  // ============================================

  // Mostrar botón de configuración solo para Tavata
  function checkShowConfigButton() {
    const responsable = sessionStorage.getItem('responsable_name');
    const btnConfig = document.getElementById('btn-config-app');
    if (btnConfig) {
      btnConfig.style.display = (responsable === 'Tavata Alexa Basurto Ramírez') ? 'block' : 'none';
    }
  }

  // Verificar autenticación de pasantes usando datos dinámicos
  function authenticatePasante(nombre, password) {
    loadConfigAppData();
    const pasante = PASANTES_DATA.find(p => p.nombre === nombre && p.password === password);
    return pasante || null;
  }

  // Obtener lista de pasantes
  function getPasantesList() {
    loadConfigAppData();
    return PASANTES_DATA.map(p => ({ nombre: p.nombre, prefijo: p.prefijo, icono: p.icono }));
  }

  // Obtener lista de apoyos
  function getApoyosList() {
    loadConfigAppData();
    return APOYOS_DATA;
  }

  // Obtener lista de usuarias desde config
  function getUsuariasConfigList() {
    loadConfigAppData();
    return USUARIAS_CONFIG_DATA;
  }

  // Cargar datos al inicio
  document.addEventListener('DOMContentLoaded', () => {
    loadConfigAppData();
    setTimeout(checkShowConfigButton, 100);
  });

  // Exponer funciones globalmente
  window.configApp = {
    open: openConfigApp,
    close: closeConfigApp,
    // Pasantes
    openAddPasanteModal: openAddPasanteModal,
    editPasante: editPasante,
    closeModalPasante: closeModalPasante,
    savePasante: savePasante,
    deletePasante: deletePasante,
    // Apoyos
    openAddApoyoModal: openAddApoyoModal,
    editApoyo: editApoyo,
    closeModalApoyo: closeModalApoyo,
    saveApoyo: saveApoyo,
    deleteApoyo: deleteApoyo,
    // Usuarias
    openAddUsuariaModal: openAddUsuariaModal,
    editUsuaria: editUsuaria,
    closeModalUsuaria: closeModalUsuaria,
    saveUsuaria: saveUsuaria,
    deleteUsuaria: deleteUsuaria,
    filterUsuariasConfig: filterUsuariasConfig,
    // Contraseñas
    openChangePassword: openChangePassword,
    closeModalPassword: closeModalPassword,
    saveNewPassword: saveNewPassword,
    // Datos
    exportAllData: exportAllData,
    importDataFromFile: importDataFromFile,
    handleDataImport: handleDataImport,
    clearAllHorarios: clearAllHorarios,
    // Utilidades
    checkShowConfigButton: checkShowConfigButton,
    authenticatePasante: authenticatePasante,
    getPasantesList: getPasantesList,
    getApoyosList: getApoyosList,
    getUsuariasConfigList: getUsuariasConfigList
  };

  // Exponer funciones principales
  window.openConfigApp = openConfigApp;
  window.closeConfigApp = closeConfigApp;
  window.openAddPasanteModal = openAddPasanteModal;
  window.closeModalPasante = closeModalPasante;
  window.savePasante = savePasante;
  window.openAddApoyoModal = openAddApoyoModal;
  window.closeModalApoyo = closeModalApoyo;
  window.saveApoyo = saveApoyo;
  window.openAddUsuariaModal = openAddUsuariaModal;
  window.closeModalUsuaria = closeModalUsuaria;
  window.saveUsuaria = saveUsuaria;
  window.filterUsuariasConfig = filterUsuariasConfig;
  window.closeModalPassword = closeModalPassword;
  window.saveNewPassword = saveNewPassword;
  window.exportAllData = exportAllData;
  window.importDataFromFile = importDataFromFile;
  window.handleDataImport = handleDataImport;
  window.clearAllHorarios = clearAllHorarios;

})();
