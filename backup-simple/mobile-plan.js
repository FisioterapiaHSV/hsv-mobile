// Lógica para el formulario de plan móvil
let currentPlanId = null;
let objetivos = [];
let actividades = [];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  initializeForm();
  loadEditIfNeeded();
});

function initializeForm() {
  // Fecha por defecto: hoy
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('fecha').value = today;
  
  // Hora por defecto: hora actual redondeada
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = now.getMinutes() < 30 ? '00' : '30';
  document.getElementById('hora_start').value = `${hours}:${minutes}`;
  
  // Calcular hora fin (+30 min)
  const endTime = new Date(now.getTime() + 30 * 60000);
  const endHours = String(endTime.getHours()).padStart(2, '0');
  const endMinutes = endTime.getMinutes() < 30 ? '00' : '30';
  document.getElementById('hora_end').value = `${endHours}:${endMinutes}`;
  
  // Poblar selects de responsable y apoyo
  populatePersonalSelects();
  
  // Enter en los campos
  document.getElementById('new_objetivo').addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addObjetivo();
    }
  });
  
  document.getElementById('new_actividad').addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addActividad();
    }
  });
}

function populatePersonalSelects() {
  const respSelect = document.getElementById('responsable');
  const apoyoSelect = document.getElementById('apoyo');
  
  APP_PERSONAL.responsables.forEach(person => {
    const opt = document.createElement('option');
    opt.value = person.nombre;
    opt.textContent = `${person.prefix} - ${person.nombre}`;
    respSelect.appendChild(opt);
  });
  
  APP_PERSONAL.apoyos.forEach(person => {
    const opt = document.createElement('option');
    opt.value = person.nombre;
    opt.textContent = `${person.prefix} - ${person.nombre}`;
    apoyoSelect.appendChild(opt);
  });
}

function addObjetivo() {
  const input = document.getElementById('new_objetivo');
  const text = input.value.trim();
  
  if (!text) return;
  
  objetivos.push(text);
  input.value = '';
  renderObjetivos();
}

function removeObjetivo(index) {
  objetivos.splice(index, 1);
  renderObjetivos();
}

function renderObjetivos() {
  const container = document.getElementById('objetivos_container');
  container.innerHTML = '';
  
  if (objetivos.length === 0) {
    container.innerHTML = '<p class="text-muted">No hay objetivos agregados</p>';
    return;
  }
  
  objetivos.forEach((obj, i) => {
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;align-items:center;gap:0.5rem;padding:0.5rem;background:var(--bg);border-radius:6px;margin-bottom:0.5rem;';
    
    const text = document.createElement('span');
    text.textContent = `${i + 1}. ${obj}`;
    text.style.flex = '1';
    
    const btnDel = document.createElement('button');
    btnDel.className = 'btn btn-danger';
    btnDel.textContent = '×';
    btnDel.style.cssText = 'padding:0.25rem 0.5rem;font-size:1.2rem;line-height:1;';
    btnDel.onclick = () => removeObjetivo(i);
    
    item.appendChild(text);
    item.appendChild(btnDel);
    container.appendChild(item);
  });
}

function addActividad() {
  const input = document.getElementById('new_actividad');
  const text = input.value.trim();
  
  if (!text) return;
  
  actividades.push(text);
  input.value = '';
  renderActividades();
}

function removeActividad(index) {
  actividades.splice(index, 1);
  renderActividades();
}

function renderActividades() {
  const container = document.getElementById('actividades_container');
  container.innerHTML = '';
  
  if (actividades.length === 0) {
    container.innerHTML = '<p class="text-muted">No hay actividades agregadas</p>';
    return;
  }
  
  actividades.forEach((act, i) => {
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;align-items:center;gap:0.5rem;padding:0.5rem;background:var(--bg);border-radius:6px;margin-bottom:0.5rem;';
    
    const text = document.createElement('span');
    text.textContent = `${i + 1}. ${act}`;
    text.style.flex = '1';
    
    const btnDel = document.createElement('button');
    btnDel.className = 'btn btn-danger';
    btnDel.textContent = '×';
    btnDel.style.cssText = 'padding:0.25rem 0.5rem;font-size:1.2rem;line-height:1;';
    btnDel.onclick = () => removeActividad(i);
    
    item.appendChild(text);
    item.appendChild(btnDel);
    container.appendChild(item);
  });
}

function guardarBorrador() {
  const paciente = document.getElementById('paciente').value.trim();
  const fecha = document.getElementById('fecha').value;
  const tipo = document.getElementById('tipo').value;
  const responsable = document.getElementById('responsable').value;
  
  // Validaciones
  if (!paciente) {
    showToast('El nombre del paciente es requerido', 'error');
    return;
  }
  
  if (!fecha) {
    showToast('La fecha es requerida', 'error');
    return;
  }
  
  if (!tipo) {
    showToast('El tipo de plan es requerido', 'error');
    return;
  }
  
  if (!responsable) {
    showToast('El responsable es requerido', 'error');
    return;
  }
  
  if (objetivos.length === 0) {
    showToast('Debes agregar al menos un objetivo', 'warning');
    return;
  }
  
  if (actividades.length === 0) {
    showToast('Debes agregar al menos una actividad', 'warning');
    return;
  }
  
  // Construir objeto de plan
  const plan = {
    id: currentPlanId || generateId('plan'),
    paciente: paciente,
    fecha: fecha,
    hora_start: document.getElementById('hora_start').value || '',
    hora_end: document.getElementById('hora_end').value || '',
    hora_real_start: '',
    hora_real_end: '',
    tipo: tipo,
    responsable: responsable,
    responsable_prefix: getResponsablePrefix(responsable),
    apoyo: document.getElementById('apoyo').value || '',
    apoyo_prefix: document.getElementById('apoyo').value ? getApoyoPrefix(document.getElementById('apoyo').value) : '',
    status: 'Borrador',
    objetivos: [...objetivos],
    actividades: [...actividades],
    observaciones: document.getElementById('observaciones').value || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    signedAt: '',
    responsable_signed: ''
  };
  
  // Guardar en localStorage
  const planes = JSON.parse(localStorage.getItem('hsv_mobile_planes') || '[]');
  
  if (currentPlanId) {
    const index = planes.findIndex(p => p.id === currentPlanId);
    if (index >= 0) {
      planes[index] = plan;
    } else {
      planes.push(plan);
    }
  } else {
    planes.push(plan);
  }
  
  localStorage.setItem('hsv_mobile_planes', JSON.stringify(planes));
  
  showToast('✅ Plan guardado correctamente', 'success');
  
  setTimeout(() => {
    location.href = 'lista.html';
  }, 1500);
}

function clearForm() {
  if (!confirm('¿Estás seguro de limpiar el formulario?')) return;
  
  document.getElementById('paciente').value = '';
  document.getElementById('tipo').value = '';
  document.getElementById('responsable').value = '';
  document.getElementById('apoyo').value = '';
  document.getElementById('observaciones').value = '';
  objetivos = [];
  actividades = [];
  renderObjetivos();
  renderActividades();
  
  showToast('Formulario limpiado', 'warning');
}

function loadEditIfNeeded() {
  const params = new URLSearchParams(window.location.search);
  const editId = params.get('edit');
  
  if (!editId) return;
  
  const planes = JSON.parse(localStorage.getItem('hsv_mobile_planes') || '[]');
  const plan = planes.find(p => p.id === editId);
  
  if (!plan) {
    showToast('No se encontró el plan', 'error');
    return;
  }
  
  // Cargar datos al formulario
  currentPlanId = plan.id;
  document.getElementById('paciente').value = plan.paciente || '';
  document.getElementById('fecha').value = plan.fecha || '';
  document.getElementById('hora_start').value = plan.hora_start || '';
  document.getElementById('hora_end').value = plan.hora_end || '';
  document.getElementById('tipo').value = plan.tipo || '';
  document.getElementById('responsable').value = plan.responsable || '';
  document.getElementById('apoyo').value = plan.apoyo || '';
  document.getElementById('observaciones').value = plan.observaciones || '';
  
  objetivos = plan.objetivos || [];
  actividades = plan.actividades || [];
  renderObjetivos();
  renderActividades();
  
  showToast('Plan cargado para editar', 'success');
}
