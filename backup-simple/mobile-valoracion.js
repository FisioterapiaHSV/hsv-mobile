// Lógica para el formulario de valoración móvil
let currentValoracionId = null;
let antecedentes = [];

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
  
  // Enter en el campo de antecedentes
  document.getElementById('new_antecedente').addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAntecedente();
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

function addAntecedente() {
  const input = document.getElementById('new_antecedente');
  const text = input.value.trim();
  
  if (!text) return;
  
  antecedentes.push(text);
  input.value = '';
  renderAntecedentes();
}

function removeAntecedente(index) {
  antecedentes.splice(index, 1);
  renderAntecedentes();
}

function renderAntecedentes() {
  const container = document.getElementById('antecedentes_container');
  container.innerHTML = '';
  
  if (antecedentes.length === 0) {
    container.innerHTML = '<p class="text-muted">No hay antecedentes agregados</p>';
    return;
  }
  
  antecedentes.forEach((ant, i) => {
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;align-items:center;gap:0.5rem;padding:0.5rem;background:var(--bg);border-radius:6px;margin-bottom:0.5rem;';
    
    const text = document.createElement('span');
    text.textContent = `${i + 1}. ${ant}`;
    text.style.flex = '1';
    
    const btnDel = document.createElement('button');
    btnDel.className = 'btn btn-danger';
    btnDel.textContent = '×';
    btnDel.style.cssText = 'padding:0.25rem 0.5rem;font-size:1.2rem;line-height:1;';
    btnDel.onclick = () => removeAntecedente(i);
    
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
  const diagnostico = document.getElementById('diagnostico').value.trim();
  
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
    showToast('El tipo de valoración es requerido', 'error');
    return;
  }
  
  if (!responsable) {
    showToast('El responsable es requerido', 'error');
    return;
  }
  
  if (!diagnostico) {
    showToast('El diagnóstico es requerido', 'error');
    return;
  }
  
  // Construir objeto de valoración
  const valoracion = {
    id: currentValoracionId || generateId('val'),
    paciente: paciente,
    fecha: fecha,
    hora_start: document.getElementById('hora_start').value || '',
    hora_end: document.getElementById('hora_end').value || '',
    tipo: tipo,
    responsable: responsable,
    responsable_prefix: getResponsablePrefix(responsable),
    apoyo: document.getElementById('apoyo').value || '',
    apoyo_prefix: document.getElementById('apoyo').value ? getApoyoPrefix(document.getElementById('apoyo').value) : '',
    status: 'Borrador',
    antecedentes: [...antecedentes],
    alicia: {
      a: document.getElementById('alic_a').value || '',
      l: document.getElementById('alic_l').value || '',
      i: document.getElementById('alic_i').value || '',
      c: document.getElementById('alic_c').value || '',
      i2: document.getElementById('alic_i2').value || '',
      a2: document.getElementById('alic_a2').value || ''
    },
    postura: {
      anterior: document.getElementById('post_anterior').value || '',
      lateral: document.getElementById('post_lateral').value || '',
      posterior: document.getElementById('post_posterior').value || '',
      cefalo: document.getElementById('post_cefalo').value || ''
    },
    goniometria: [], // Simplificado para móvil
    daniels: [], // Simplificado para móvil
    marcha: { phases: [], description: '', constants: {} },
    escalas: {
      pruebas: {},
      sppb: {},
      tinetti: {},
      frail: {},
      downton: {},
      katz: {},
      lawton: {},
      customs: []
    },
    diagnostico: diagnostico,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    signedAt: '',
    responsable_signed: ''
  };
  
  // Guardar en localStorage
  const valoraciones = JSON.parse(localStorage.getItem('hsv_mobile_valoraciones') || '[]');
  
  if (currentValoracionId) {
    const index = valoraciones.findIndex(v => v.id === currentValoracionId);
    if (index >= 0) {
      valoraciones[index] = valoracion;
    } else {
      valoraciones.push(valoracion);
    }
  } else {
    valoraciones.push(valoracion);
  }
  
  localStorage.setItem('hsv_mobile_valoraciones', JSON.stringify(valoraciones));
  
  showToast('✅ Valoración guardada correctamente', 'success');
  
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
  document.getElementById('alic_a').value = '';
  document.getElementById('alic_l').value = '';
  document.getElementById('alic_i').value = '';
  document.getElementById('alic_c').value = '';
  document.getElementById('alic_i2').value = '';
  document.getElementById('alic_a2').value = '';
  document.getElementById('post_anterior').value = '';
  document.getElementById('post_lateral').value = '';
  document.getElementById('post_posterior').value = '';
  document.getElementById('post_cefalo').value = '';
  document.getElementById('diagnostico').value = '';
  antecedentes = [];
  renderAntecedentes();
  
  showToast('Formulario limpiado', 'warning');
}

function loadEditIfNeeded() {
  const params = new URLSearchParams(window.location.search);
  const editId = params.get('edit');
  
  if (!editId) return;
  
  const valoraciones = JSON.parse(localStorage.getItem('hsv_mobile_valoraciones') || '[]');
  const valoracion = valoraciones.find(v => v.id === editId);
  
  if (!valoracion) {
    showToast('No se encontró la valoración', 'error');
    return;
  }
  
  // Cargar datos al formulario
  currentValoracionId = valoracion.id;
  document.getElementById('paciente').value = valoracion.paciente || '';
  document.getElementById('fecha').value = valoracion.fecha || '';
  document.getElementById('hora_start').value = valoracion.hora_start || '';
  document.getElementById('hora_end').value = valoracion.hora_end || '';
  document.getElementById('tipo').value = valoracion.tipo || '';
  document.getElementById('responsable').value = valoracion.responsable || '';
  document.getElementById('apoyo').value = valoracion.apoyo || '';
  
  antecedentes = valoracion.antecedentes || [];
  renderAntecedentes();
  
  if (valoracion.alicia) {
    document.getElementById('alic_a').value = valoracion.alicia.a || '';
    document.getElementById('alic_l').value = valoracion.alicia.l || '';
    document.getElementById('alic_i').value = valoracion.alicia.i || '';
    document.getElementById('alic_c').value = valoracion.alicia.c || '';
    document.getElementById('alic_i2').value = valoracion.alicia.i2 || '';
    document.getElementById('alic_a2').value = valoracion.alicia.a2 || '';
  }
  
  if (valoracion.postura) {
    document.getElementById('post_anterior').value = valoracion.postura.anterior || '';
    document.getElementById('post_lateral').value = valoracion.postura.lateral || '';
    document.getElementById('post_posterior').value = valoracion.postura.posterior || '';
    document.getElementById('post_cefalo').value = valoracion.postura.cefalo || '';
  }
  
  document.getElementById('diagnostico').value = valoracion.diagnostico || '';
  
  showToast('Valoración cargada para editar', 'success');
}
