// Datos de horarios (simulados - puedes conectar a una base de datos)
let horariosData = {
  sesiones: [],
  talleres: []
};

/**
 * Guarda los datos de talleres en localStorage
 */
function guardarHorariosData() {
  try {
    localStorage.setItem('horariosData_talleres', JSON.stringify(horariosData.talleres));
    console.log('✅ Talleres guardados en localStorage:', horariosData.talleres);
  } catch (e) {
    console.error('Error al guardar horariosData:', e);
  }
}

/**
 * Carga los datos de talleres desde localStorage
 */
function cargarHorariosData() {
  try {
    const stored = localStorage.getItem('horariosData_talleres');
    if (stored) {
      horariosData.talleres = JSON.parse(stored);
      console.log('✅ Talleres cargados desde localStorage:', horariosData.talleres);
    } else {
      console.log('ℹ️ No hay talleres guardados en localStorage');
    }
  } catch (e) {
    console.error('Error al cargar horariosData:', e);
  }
}

let currentWeekStart = getMonday(new Date());

// ===== VARIABLES PARA VISTA DIARIA =====
let vistaActual = 'semanal'; // 'semanal' o 'diaria'
let diaSeleccionado = null;  // Día seleccionado en vista diaria

/**
 * 🔒 SISTEMA DE PROTECCIÓN DE DATOS
 * Función de backup automático que se ejecuta cada vez que se guardan cambios
 */
function backupHorariosData() {
  try {
    const backup = {
      timestamp: new Date().toISOString(),
      horariosPersonalizados: localStorage.getItem('horariosPersonalizados'),
      ausenciasUsuarias: localStorage.getItem('ausenciasUsuarias'),
      vacacionesPasantes: localStorage.getItem('vacacionesPasantes')
    };
    localStorage.setItem('backup_horarios_latest', JSON.stringify(backup));
  } catch (e) {
    console.error('Error en backup:', e);
  }
}

/**
 * 🔄 Restaura datos desde el backup más reciente
 */
function restoreFromBackup() {
  try {
    const backup = JSON.parse(localStorage.getItem('backup_horarios_latest') || '{}');
    if (backup.horariosPersonalizados) {
      localStorage.setItem('horariosPersonalizados', backup.horariosPersonalizados);
    }
    if (backup.ausenciasUsuarias) {
      localStorage.setItem('ausenciasUsuarias', backup.ausenciasUsuarias);
    }
    if (backup.vacacionesPasantes) {
      localStorage.setItem('vacacionesPasantes', backup.vacacionesPasantes);
    }
    showMessage('✅ Datos restaurados desde backup', 'success');
    location.reload();
  } catch (e) {
    console.error('Error restaurando backup:', e);
    showMessage('❌ No se pudo restaurar desde backup', 'error');
  }
}

/**
 * 📥 Descarga un backup JSON de todos los horarios
 */
function descargarBackup() {
  try {
    const datos = {
      fecha_backup: new Date().toISOString(),
      horariosPersonalizados: JSON.parse(localStorage.getItem('horariosPersonalizados') || '{}'),
      ausenciasUsuarias: JSON.parse(localStorage.getItem('ausenciasUsuarias') || '{}'),
      vacacionesPasantes: JSON.parse(localStorage.getItem('vacacionesPasantes') || '{}')
    };
    
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_horarios_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showMessage('✅ Backup descargado', 'success');
  } catch (e) {
    console.error('Error descargando backup:', e);
  }
}

// Variable global para pasante actual
let pasanteActual = null;

// Iconos de responsables
const RESPONSABLE_ICONS = {
  'Tavata Alexa Basurto Ramírez': 'icons/AlexaI.png',
  'Gloria Iraís Espinosa Peralta': 'icons/GloriaI.png',
  'Jorge Eduardo Rodríguez Romero': 'icons/JorgeI.png',
  'Andrea Ofelia Carrillo Valdés': 'icons/OfeliaI.png',
  'Alejandra María Contreras Cruz': 'icons/AlejandraMariaI.png',
  'Gabriel Rodríguez Hernández': 'icons/GabrielI.png',
  'Leslie Amellali Santillán García': 'icons/AmellaliI.png',
  'Francisco Nava Chávez': 'icons/FranciscoI.png',
  'Estefanía Zanabria': 'icons/EstefaniaI.png'
};

// 📌 LISTA DE USUARIAS - Se carga desde localStorage (si existe) o usa valores por defecto
let USUARIAS = [];

function cargarUsuarias() {
  // Intentar cargar desde localStorage (datos actualizados desde config)
  const savedUsuarias = localStorage.getItem('hsv_usuarias_config');
  if (savedUsuarias) {
    try {
      USUARIAS = JSON.parse(savedUsuarias);
      return;
    } catch (e) {
      console.error('Error al cargar usuarias desde localStorage:', e);
    }
  }
  
  // Fallback a lista por defecto
  USUARIAS = [
  { "nombre": "Virginia Vargas Acevedo", "habitacion": "2" },
  { "nombre": "Angélica Martínez Osornio", "habitacion": "4" },
  { "nombre": "María Eugenia Romo García", "habitacion": "5" },
  { "nombre": "María Isabel Tellez Velázquez", "habitacion": "6" },
  { "nombre": "María Gloria Aguilar Morín", "habitacion": "7" },
  { "nombre": "Ana Rosa Alemon Tovar", "habitacion": "8" },
  { "nombre": "Fidelina Quezada Pérez", "habitacion": "9" },
  { "nombre": "Beatriz Margarita Barajas y Zazueta", "habitacion": "11" },
  { "nombre": "Martha Sanchez Hernández", "habitacion": "12" },
  { "nombre": "Maria Guillermina Sierra y Estéves", "habitacion": "105" },
  { "nombre": "Norma Patricia Guadalupe Maravoto Guerrero", "habitacion": "107" },
  { "nombre": "María Elena Cortés Pardo", "habitacion": "107" },
  { "nombre": "Beatriz Carvajal Villegas", "habitacion": "108" },
  { "nombre": "Velia Torres Camacho", "habitacion": "108" },
  { "nombre": "María del Carmen Rosario Anguiano Carey", "habitacion": "109" },
  { "nombre": "María Guadalupe Huerta Juárez", "habitacion": "110" },
  { "nombre": "María Guadalupe Cristina Castillo López", "habitacion": "112" },
  { "nombre": "Isabel García Alcalá", "habitacion": "113" },
  { "nombre": "Bertha Ochoa Hoyos", "habitacion": "117" },
  { "nombre": "Teodora Hilda Margarita García Hernández", "habitacion": "118" },
  { "nombre": "Margarita Medina Godínez", "habitacion": "119" },
  { "nombre": "Sonia Buzon Ramírez", "habitacion": "120" },
  { "nombre": "Virginia Barba Casillas", "habitacion": "121" },
  { "nombre": "María Eugenia Vázquez e Ibarra", "habitacion": "122" },
  { "nombre": "Lucia Pérez Hernández", "habitacion": "123" },
  { "nombre": "Alicia Sandoval Guerrero", "habitacion": "124" },
  { "nombre": "Irma Rosado Palomar", "habitacion": "125" },
  { "nombre": "Salvador González", "habitacion": "204" },
  { "nombre": "Ma. de Lourdes Ramírez Martínez", "habitacion": "205" },
  { "nombre": "María Antinea López Monroy", "habitacion": "206" },
  { "nombre": "María Victoria Ruiz Moran", "habitacion": "207" },
  { "nombre": "María Elena Mancera y Aguayo", "habitacion": "208" },
  { "nombre": "María de la Peña Cardona", "habitacion": "209" },
  { "nombre": "Aura Paz Martha Graciela Luz Cravioto", "habitacion": "210" },
  { "nombre": "María Elena Muñoz Lara", "habitacion": "211" },
  { "nombre": "Virginia Reyes Velázquez", "habitacion": "213" },
  { "nombre": "Teresa Gutiérrez Zamorano", "habitacion": "214" },
  { "nombre": "Nidia María Donde Diego", "habitacion": "215" },
  { "nombre": "Eva Gutiérrez y Sotelo", "habitacion": "216" },
  { "nombre": "María Concepción Medina y Nicolau", "habitacion": "217" },
  { "nombre": "Aurora Benítez Avila", "habitacion": "218" },
  { "nombre": "Elizabeth Leon Mendózo", "habitacion": "219" },
  { "nombre": "Aida Santos Rosas", "habitacion": "220" },
  { "nombre": "María del Carmen Sánchez Vazquez", "habitacion": "222" },
  { "nombre": "Rosa María D'arce Arzate", "habitacion": "223" },
  { "nombre": "Elena Yolanda Guevara y Gómez", "habitacion": "301" },
  { "nombre": "Teodora Graciela García Carbajal", "habitacion": "302" },
  { "nombre": "Herminia Hernández Rodríguez", "habitacion": "303" },
  { "nombre": "Dolores Domínguez y Magaña Peon", "habitacion": "305" },
  { "nombre": "Angelica Magdalena Osorio Lugo", "habitacion": "306" },
  { "nombre": "Martha Aguilera Carrillo", "habitacion": "308" },
  { "nombre": "María Amador Moreno", "habitacion": "310" },
  { "nombre": "Nora Patricia Rivas Borja", "habitacion": "312" },
  { "nombre": "Juana Mesquite", "habitacion": "313" },
  { "nombre": "María Eugenia Solano Sainos", "habitacion": "314" },
  { "nombre": "María Guadalupe Gasca Boyer", "habitacion": "320" },
  { "nombre": "María Mendoza Alvarez", "habitacion": "322" },
  { "nombre": "Enedina Martínez Ochoa", "habitacion": "323" },
  { "nombre": "Ma Isabel Silva Ramírez", "habitacion": "324" },
  { "nombre": "Bertha Rosa Solano Guerrero", "habitacion": "326" },
  { "nombre": "Silvia Margarita Méndez Berrueta", "habitacion": "328" },
  { "nombre": "María del Rosario García Alcalá", "habitacion": "330" },
  { "nombre": "Yolanda Barajas del Castillo", "habitacion": "333" },
  { "nombre": "Estefana Sánchez de Anda", "habitacion": "5to Piso" },
  { "nombre": "Ma. Jesús Razo Madrigal", "habitacion": "5to Piso" },
  { "nombre": "María Magdalena García Alcalá", "habitacion": "5to Piso" },
  { "nombre": "Ma. del Carmen Rivera Soria", "habitacion": "5to Piso" },
  { "nombre": "María del Rosario Huerta Pérez", "habitacion": "5to Piso" },
  { "nombre": "Susana Patricia Moysen Márquez", "habitacion": "5to Piso" },
  { "nombre": "María Eva Delgadillo Escareño", "habitacion": "5to Piso" },
  { "nombre": "Blanca Estela", "habitacion": "No aplica" },
  { "nombre": "Juana del Angel", "habitacion": "No aplica" },
  { "nombre": "Georgina \"Coquis\" Ayala", "habitacion": "No aplica" },
  { "nombre": "Antonia Enriqueta Andrade Uriosti", "habitacion": "No aplica" },
  { "nombre": "Mary (Cuidadora)", "habitacion": "No aplica" },
  { "nombre": "Laura (Cuidadora)", "habitacion": "No aplica" }
  ];
}

// Horarios personalizados por pasante (se carga desde localStorage)
let horariosPersonalizados = {};
cargarHorariosPersonalizados();
cargarHorariosData();

// Almacenar vacaciones de pasantes
let vacacionesPasantes = {};
cargarVacacionesPasantes();

// Almacenar ausencias de usuarias (vacaciones, salidas, etc.)
let ausenciasUsuarias = {};
cargarAusenciasUsuarias();

// Colores para cada pasante
const PASANTE_COLORS = {
  'Tavata Alexa Basurto Ramírez': {
    bg: '#cc66aa',      // Lila rosado
    light: '#f5e0ef',   // Lila rosado muy claro
    dark: '#a34d8a'
  },
  'Gloria Iraís Espinosa Peralta': {
    bg: '#ff1493',      // Rosa mexicano
    light: '#ffe4f0',   // Rosa muy claro
    dark: '#c20974'     // Rosa oscuro
  },
  'Gloria Irais Espinosa Peralta': {
    bg: '#ff1493',      // Rosa mexicano (sin acento)
    light: '#ffe4f0',   // Rosa muy claro
    dark: '#c20974'     // Rosa oscuro
  },
  'Jorge Eduardo Rodríguez Romero': {
    bg: '#4a90e2',      // Azul
    light: '#d6e4f5',   // Azul muy claro
    dark: '#2963b8'
  },
  'Andrea Ofelia Carrillo Valdés': {
    bg: '#f4c430',      // Amarillo
    light: '#fef3c7',   // Amarillo muy claro
    dark: '#d4a017',
    textColor: '#000000' // Texto negro
  },
  'Alejandra María Contreras Cruz': {
    bg: '#ff8c00',      // Naranja
    light: '#ffe4c4',   // Naranja muy claro
    dark: '#cc7000',
    textColor: '#000000' // Texto negro
  },
  'Gabriel Rodríguez Hernández': {
    bg: '#00ced1',      // Aqua/Turquesa
    light: '#e0ffff',   // Aqua muy claro
    dark: '#008b8b'
  },
  'Leslie Amellali Santillán García': {
    bg: '#4caf50',      // Verde
    light: '#e8f5e9',   // Verde muy claro
    dark: '#388e3c'
  },
  'Francisco Nava Chávez': {
    bg: '#6a5acd',      // Morado azulado (Slate Blue)
    light: '#e0dfff',   // Morado azulado muy claro
    dark: '#483d8b'
  },
  'Estefanía Zanabria': {
    bg: '#dc143c',      // Rojo (Crimson)
    light: '#ffe4e9',   // Rojo muy claro
    dark: '#b01030'
  }
};

// Color para apoyos sin sesión propia
const APOYO_COLOR = {
  bg: '#bacbcc',        // Color personalizado
  light: '#dce4e5',     // Color muy claro (más transparente)
  dark: '#8a9b9c'       // Color oscuro
};

// Listas dinámicas de responsables (pasantes) y apoyos
// Se cargan desde localStorage, con valores por defecto si no existen
function getResponsablesLista() {
  const saved = localStorage.getItem('hsv_pasantes');
  if (saved) {
    return JSON.parse(saved).map(p => p.nombre);
  }
  // Valores por defecto
  return [
    'Tavata Alexa Basurto Ramírez',
    'Gloria Iraís Espinosa Peralta',
    'Jorge Eduardo Rodríguez Romero',
    'Gabriel Rodríguez Hernández',
    'Andrea Ofelia Carrillo Valdés',
    'Leslie Amellali Santillán García',
    'Estefanía Zanabria',
    'Francisco Nava Chávez'
  ];
}

function getApoyosLista() {
  const saved = localStorage.getItem('hsv_apoyos');
  if (saved) {
    return JSON.parse(saved).map(a => a.nombre);
  }
  // Valores por defecto
  return [
    'Gloria Iraís Espinosa Peralta',
    'Jorge Eduardo Rodríguez Romero',
    'Gabriel Rodríguez Hernández',
    'Andrea Ofelia Carrillo Valdés',
    'Leslie Amellali Santillán García',
    'Estefanía Zanabria',
    'Francisco Nava Chávez'
  ];
}

// Variables para compatibilidad (se actualizan dinámicamente)
let RESPONSABLES_LISTA = getResponsablesLista();
let APOYOS_LISTA = getApoyosLista();

// Función para refrescar las listas
function refreshListas() {
  RESPONSABLES_LISTA = getResponsablesLista();
  APOYOS_LISTA = getApoyosLista();
}

/**
 * Carga las vacaciones desde localStorage
 */
function cargarVacacionesPasantes() {
  const saved = localStorage.getItem('vacacionesPasantes');
  vacacionesPasantes = saved ? JSON.parse(saved) : {};
}

/**
 * Guarda las vacaciones en localStorage
 */
function guardarVacacionesPasantes() {
  localStorage.setItem('vacacionesPasantes', JSON.stringify(vacacionesPasantes));
  backupHorariosData(); // 🔒 Crear backup automático
}

/**
 * Carga las ausencias de usuarias desde localStorage
 */
function cargarAusenciasUsuarias() {
  const saved = localStorage.getItem('ausenciasUsuarias');
  if (saved) {
    ausenciasUsuarias = JSON.parse(saved);
  }
}

/**
 * Guarda las ausencias de usuarias en localStorage
 */
function guardarAusenciasUsuarias() {
  localStorage.setItem('ausenciasUsuarias', JSON.stringify(ausenciasUsuarias));
  backupHorariosData(); // 🔒 Crear backup automático
}

/**
 * ⚠️ LIMPIA TODO EL CACHE DE SESIONES Y DATOS
 * Llama a limpiarCache() en la consola para resetear todo desde 0
 */
function limpiarCache() {
  if (confirm('⚠️ ¿Estás seguro de que quieres BORRAR TODOS los horarios, ausencias, vacaciones y redistribuciones? Esta acción NO se puede deshacer.')) {
    localStorage.removeItem('horariosPersonalizados');
    localStorage.removeItem('horariosData');
    localStorage.removeItem('ausenciasUsuarias');
    localStorage.removeItem('vacacionesPasantes');
    
    // Reinicializar variables
    horariosPersonalizados = {};
    horariosData = { sesiones: [], talleres: [] };
    ausenciasUsuarias = {};
    vacacionesPasantes = {};
    
    showMessage('✅ Cache limpiado correctamente. Recarga la página.', 'success');
    console.log('Cache limpiado. Recarga la página con F5');
  }
}

/**
 * Guarda las ausencias de usuarias en localStorage
 */
function guardarAusenciasUsuarias() {
  localStorage.setItem('ausenciasUsuarias', JSON.stringify(ausenciasUsuarias));
}

/**
 * Carga los horarios personalizados desde localStorage
 */
function cargarHorariosPersonalizados() {
  const stored = localStorage.getItem('horariosPersonalizados');
  horariosPersonalizados = stored ? JSON.parse(stored) : {};
  
  // Limpiar sesiones pausadas antiguas que ya pasaron y duplicados
  const hoy = new Date();
  const fechaHoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  
  Object.keys(horariosPersonalizados).forEach(persona => {
    const horarios = horariosPersonalizados[persona];
    if (horarios.sesiones) {
      // Filtrar sesiones: eliminar pausadas antiguas
      horariosPersonalizados[persona].sesiones = horarios.sesiones.map(sesion => {
        // Si está pausada por vacaciones pero la fecha ya pasó, eliminar el flag pausada
        if (sesion.pausada && sesion.pausadaPor === 'vacaciones' && sesion.pausadaHasta) {
          const fechaPausa = new Date(sesion.pausadaHasta + 'T23:59:59');
          if (fechaPausa < hoy) {
            // Ya pasó la fecha de pausa, eliminar este flag
            sesion.pausada = false;
            sesion.pausadaPor = null;
            sesion.pausadaDesde = null;
            sesion.pausadaHasta = null;
          }
        }
        
        // Limpiar redistribucionesVacaciones antiguas
        if (sesion.redistribucionesVacaciones && sesion.redistribucionesVacaciones.length > 0) {
          sesion.redistribucionesVacaciones = sesion.redistribucionesVacaciones.filter(red => {
            const fechaHastaRed = new Date(red.hasta + 'T23:59:59');
            return fechaHastaRed >= hoy; // Mantener solo las que aún están vigentes
          });
          
          // Si no quedan redistribuciones, eliminar el array
          if (sesion.redistribucionesVacaciones.length === 0) {
            delete sesion.redistribucionesVacaciones;
          }
        }
        
        return sesion;
      }).filter(sesion => {
        // Eliminar sesiones que:
        // 1. Están pausadas por vacaciones pero el período ya pasó completamente
        // 2. NO tienen redistribucionesVacaciones vigentes
        // 3. Son coberturas vencidas (esCoberturaTemp pero fechasCobertureFin pasó)
        
        if (sesion.pausada && sesion.pausadaPor === 'vacaciones') {
          const fechaPausa = new Date(sesion.pausadaHasta + 'T23:59:59');
          if (fechaPausa < hoy) {
            return false; // Eliminar sesiones pausadas vencidas
          }
        }
        
        if (sesion.esCoberturaTemp && sesion.fechasCobertureFin) {
          const fechaCobertura = new Date(sesion.fechasCobertureFin + 'T23:59:59');
          if (fechaCobertura < hoy) {
            return false; // Eliminar coberturas vencidas
          }
        }
        
        return true;
      });
    }
  });
}

/**
 * Guarda los horarios personalizados en localStorage
 */
function guardarHorariosPersonalizados() {
  localStorage.setItem('horariosPersonalizados', JSON.stringify(horariosPersonalizados));
  backupHorariosData(); // 🔒 Crear backup automático cuando se guardan cambios
}

/**
 * Limpia automáticamente las coberturas temporales que ya han vencido
 */
function limpiarCoberturasvencidas() {
  const hoy = new Date();
  const fechaHoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  
  let limpiadas = 0;
  
  // Revisar cada persona en horariosPersonalizados
  Object.keys(horariosPersonalizados).forEach(persona => {
    const horarios = horariosPersonalizados[persona];
    
    if (horarios.sesiones && horarios.sesiones.length > 0) {
      // Filtrar sesiones: mantener las que no son coberturas vencidas
      horarios.sesiones = horarios.sesiones.filter(sesion => {
        // Si es una cobertura temporal, verificar si ya expiró
        if ((sesion.esCoberturaTemp || sesion.esApoyoEnCobertura) && sesion.fechasCobertureFin) {
          if (sesion.fechasCobertureFin < fechaHoyStr) {
            // Esta cobertura ya expiró, eliminarla
            console.log(`🗑️ Eliminando cobertura vencida de ${sesion.nombre} en ${persona} (hasta ${sesion.fechasCobertureFin})`);
            limpiadas++;
            return false; // No incluir en el nuevo array
          }
        }
        return true; // Mantener esta sesión
      });
    }
  });
  
  if (limpiadas > 0) {
    guardarHorariosPersonalizados();
    console.log(`✅ Se limpiaron ${limpiadas} coberturas temporales vencidas`);
  }
}


/**
 * Muestra el selector de pasantes y apoyos para Tavata
 */
function mostrarSelectorPasantes() {
  const container = document.getElementById('pasante-selector-container');
  const selector = document.getElementById('pasante-selector');
  
  if (!container || !selector) {
    console.error('No se encontró el contenedor o selector de pasantes');
    return;
  }
  
  // Refrescar listas desde localStorage
  refreshListas();
  
  container.style.display = 'block';
  
  // Limpiar opciones anteriores
  selector.innerHTML = '<option value="">-- Selecciona pasante, apoyo o coordinadora --</option>';
  
  // Agregar pasantes del array RESPONSABLES_LISTA (incluyendo a Tavata como Coordinadora)
  let pasantesHtml = '<optgroup label="Pasantes">';
  RESPONSABLES_LISTA.forEach(pasante => {
    if (pasante === 'Tavata Alexa Basurto Ramírez') {
      // Mostrar a Tavata como Coordinadora
      pasantesHtml += `<option value="${pasante}">👑 ${pasante} (Coordinadora)</option>`;
    } else {
      pasantesHtml += `<option value="${pasante}">${pasante}</option>`;
    }
  });
  pasantesHtml += '</optgroup>';
  
  // Agregar apoyos del array APOYOS_LISTA
  let apoyosHtml = '<optgroup label="Apoyos (Practicantes)">';
  APOYOS_LISTA.forEach(apoyo => {
    apoyosHtml += `<option value="${apoyo}">${apoyo}</option>`;
  });
  apoyosHtml += '</optgroup>';
  
  selector.innerHTML += pasantesHtml + apoyosHtml;
  
  // Evento de cambio
  selector.addEventListener('change', function() {
    pasanteActual = this.value;
    if (pasanteActual) {
      renderHorarios();
    }
  });
}

// Actualizar badge del usuario en el header
function updateBadge(name, prefijo) {
  const badgeName = document.getElementById('badge-name');
  const badgePrefix = document.getElementById('badge-prefix');
  const badgeIcon = document.getElementById('badge-icon');

  if (badgeName) {
    // Extraer nombre corto (primer nombre + primera letra del segundo apellido)
    const parts = name.split(' ');
    const shortName = parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
    badgeName.textContent = shortName;
  }

  if (badgePrefix) {
    badgePrefix.textContent = prefijo || 'LFT';
  }

  if (badgeIcon && RESPONSABLE_ICONS[name]) {
    badgeIcon.src = RESPONSABLE_ICONS[name];
  }
}

/**
 * Verifica si una usuaria está ausente en una fecha específica
 */
function isUsuariaAusente(nombreUsuaria, fecha) {
  if (!ausenciasUsuarias[nombreUsuaria]) {
    console.log('No hay ausencias registradas para:', nombreUsuaria);
    console.log('Ausencias disponibles:', Object.keys(ausenciasUsuarias));
    return false;
  }
  
  // Convertir la fecha a string en formato YYYY-MM-DD para comparación correcta
  let dateStr;
  if (typeof fecha === 'string') {
    dateStr = fecha.split('T')[0]; // Si es ISO, tomar solo la parte de la fecha
  } else if (fecha instanceof Date) {
    // Obtener la fecha local sin convertir a UTC
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    dateStr = `${year}-${month}-${day}`;
  } else {
    dateStr = fecha;
  }
  
  const ausencias = ausenciasUsuarias[nombreUsuaria];
  const resultado = ausencias.some(ausencia => {
    const inicio = ausencia.fechaInicio;
    const fin = ausencia.fechaFin;
    const isInRange = dateStr >= inicio && dateStr <= fin;
    console.log(`Comparando ${dateStr} entre ${inicio} y ${fin}: ${isInRange}`);
    return isInRange;
  });
  
  return resultado;
}

/**
 * Obtiene el lunes de la semana actual
 */
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

/**
 * Obtiene los días de la semana desde un lunes
 */
function getWeekDays(mondayDate) {
  const days = [];
  for (let i = 0; i < 5; i++) {  // 🔧 Solo 5 días: lunes a viernes
    const date = new Date(mondayDate);
    date.setDate(date.getDate() + i);
    days.push(date);
  }
  return days;
}

/**
 * Obtiene la fecha de un día específico de la semana
 */
function getDateForDay(mondayDate, dayName) {
  const daysMap = {
    'Lunes': 0,
    'Martes': 1,
    'Miércoles': 2,
    'Jueves': 3,
    'Viernes': 4
  };
  
  const dayIndex = daysMap[dayName];
  if (dayIndex === undefined) return null;
  
  const date = new Date(mondayDate);
  date.setDate(date.getDate() + dayIndex);
  return date;
}

/**
 * Formatea una fecha para mostrar
 */
function formatDate(date) {
  const options = { day: 'numeric', month: 'short' };
  return date.toLocaleDateString('es-ES', options);
}

/**
 * Obtiene el nombre del día de la semana
 */
function getDayName(date) {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[date.getDay()];
}

/**
 * Actualiza el título de la semana
 */
function updateWeekTitle() {
  const weekStart = currentWeekStart;
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 5);

  const monthStart = weekStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const monthEnd = weekEnd.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const title = `${weekStart.getDate()} - ${weekEnd.getDate()} de ${monthEnd}`;
  document.getElementById('weekTitle').textContent = title;
}

/**
 * Navega a la semana anterior
 */
function previousWeek() {
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  updateWeekTitle();
  renderHorarios();
}

/**
 * Navega a la siguiente semana
 */
function nextWeek() {
  currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  updateWeekTitle();
  renderHorarios();
}

/**
 * Cambia entre vista semanal y diaria
 */
function cambiarVista(vista) {
  vistaActual = vista;
  diaSeleccionado = null;
  
  const btnSemanal = document.getElementById('btn-vista-semanal');
  const btnDiaria = document.getElementById('btn-vista-diaria');
  const diaSelector = document.getElementById('dia-selector');
  const weekSelector = document.querySelector('.week-selector');
  
  if (vista === 'semanal') {
    btnSemanal.classList.add('active');
    btnSemanal.style.background = '#d4c5f9';
    btnSemanal.style.color = 'white';
    
    btnDiaria.classList.remove('active');
    btnDiaria.style.background = '#e5e7eb';
    btnDiaria.style.color = '#000';
    
    diaSelector.style.display = 'none';
    diaSelector.value = '';
    weekSelector.style.display = 'flex';
  } else {
    btnDiaria.classList.add('active');
    btnDiaria.style.background = '#d4c5f9';
    btnDiaria.style.color = 'white';
    
    btnSemanal.classList.remove('active');
    btnSemanal.style.background = '#e5e7eb';
    btnSemanal.style.color = '#000';
    
    diaSelector.style.display = 'block';
    weekSelector.style.display = 'none';
  }
  
  renderHorarios();
}

/**
 * Cambia el día seleccionado en vista diaria
 */
function cambiarDiaSeleccionado(event) {
  diaSeleccionado = event.target.value;
  renderHorarios();
}

/**
 * Renderiza los horarios de la semana o del día seleccionado
 */
function renderHorarios() {
  const grid = document.getElementById('horariosGrid');
  const loading = document.getElementById('horarios-loading');

  if (!grid || !loading) {
    console.error('No se encontraron elementos de grid o loading');
    return;
  }

  console.log('📊 Renderizando horarios. Vista:', vistaActual, 'Día:', diaSeleccionado);

  loading.style.display = 'block';
  grid.style.display = 'none';

  // Simular carga de datos
  setTimeout(() => {
    grid.innerHTML = '';
    // Resetear estilos de grid a los originales
    grid.style.gridTemplateColumns = '';
    grid.style.flexDirection = '';
    grid.style.gap = '';
    grid.style.overflowX = '';
    grid.style.paddingBottom = '';

    let daysToRender = [];
    
    if (vistaActual === 'semanal') {
      // Vista semanal: mostrar toda la semana
      daysToRender = getWeekDays(currentWeekStart);
    } else if (vistaActual === 'diaria' && diaSeleccionado) {
      // Vista diaria: mostrar solo el día seleccionado
      const selectedDate = getDateForDay(currentWeekStart, diaSeleccionado);
      daysToRender = selectedDate ? [selectedDate] : [];
    } else {
      // Si no hay día seleccionado en vista diaria, mostrar semana
      daysToRender = getWeekDays(currentWeekStart);
    }

    daysToRender.forEach((date) => {
      const dayName = getDayName(date);
      const formattedDate = formatDate(date);
      // Pasar también la fecha actual de la semana para validar coberturas
      const dayCard = createDayCard(dayName, formattedDate, date, pasanteActual, {
        weekStart: currentWeekStart,
        weekEnd: new Date(currentWeekStart.getTime() + 5 * 24 * 60 * 60 * 1000) // 5 días después
      });
      grid.appendChild(dayCard);
    });

    loading.style.display = 'none';
    grid.style.display = 'grid';
  }, 300);
}

/**
 * Crea una tarjeta de día
 */
function createDayCard(dayName, date, dateObj, pasante = null, weekRange = null) {
  const card = document.createElement('div');
  card.className = 'day-card';

  // Aplicar color según el pasante si se especifica
  if (pasante && PASANTE_COLORS[pasante]) {
    const colors = PASANTE_COLORS[pasante];
    card.style.backgroundColor = colors.light;
    card.style.borderLeftColor = colors.bg;
    card.dataset.pasante = pasante;
    if (colors.textColor) {
      card.style.color = colors.textColor;
    }
  } else if (pasante && isApoyo(pasante)) {
    // Si es un apoyo, usar fondo blanco para la tarjeta
    card.style.backgroundColor = '#ffffff';
    card.style.borderLeftColor = '#bacbcc';
    card.dataset.pasante = pasante;
  }

  const header = document.createElement('div');
  header.className = 'day-header';
  header.innerHTML = `
    <div>${dayName}</div>
    <div class="day-date">${date}</div>
  `;

  // Aplicar color del header según el pasante
  if (pasante && PASANTE_COLORS[pasante]) {
    header.style.backgroundColor = PASANTE_COLORS[pasante].bg;
    if (PASANTE_COLORS[pasante].textColor) {
      header.style.color = PASANTE_COLORS[pasante].textColor;
    }
  } else if (pasante && isApoyo(pasante)) {
    // Si es un apoyo, usar color personalizado para el header
    header.style.backgroundColor = '#bacbcc';
    header.style.color = 'white';
  }

  const content = document.createElement('div');
  content.className = 'day-content';

  // Aplicar color de texto al contenido si es necesario
  if (pasante && PASANTE_COLORS[pasante] && PASANTE_COLORS[pasante].textColor) {
    content.style.color = PASANTE_COLORS[pasante].textColor;
  }

  // Obtener horarios para este día (usando el pasante especificado si existe)
  const dayHorarios = getHorariosForDay(dayName, dateObj, pasante, weekRange);

  if (dayHorarios.length === 0) {
    content.innerHTML = '<div class="empty-day">📭 Libre</div>';
  } else {
    // Horario laboral
    const horaInicio = '09:30';
    const horaFin = '13:30';
    
    // Mostrar hueco libre al INICIO del día si la primera sesión no empieza a las 09:30
    const primeraSession = dayHorarios[0];
    const [hPrim, mPrim] = (primeraSession.horaInicio || '09:30').split(':').map(Number);
    const [hInicio, mInicio] = horaInicio.split(':').map(Number);
    const minutosPrim = hPrim * 60 + mPrim;
    const minutosInicio = hInicio * 60 + mInicio;
    
    if (minutosPrim > minutosInicio) {
      const huecoInicio = document.createElement('div');
      huecoInicio.className = 'horario-item-libre';
      huecoInicio.style.backgroundColor = '#e5e7eb';
      huecoInicio.style.borderLeftColor = '#9ca3af';
      huecoInicio.style.padding = '8px';
      huecoInicio.style.marginBottom = '8px';
      huecoInicio.style.borderRadius = '4px';
      huecoInicio.style.borderLeft = '3px solid';
      huecoInicio.style.fontSize = '12px';
      huecoInicio.style.color = '#718096';
      huecoInicio.style.fontStyle = 'italic';
      huecoInicio.innerHTML = `<div style="font-weight: 500;">⏰ Libre: ${horaInicio} - ${primeraSession.horaInicio}</div>`;
      content.appendChild(huecoInicio);
    }
    
    // Agregar items de sesión Y mostrar huecos libres entre ellas
    dayHorarios.forEach((horario, index) => {
      // Detectar solapamiento con otras sesiones
      const tieneConflicto = detectarSolapamiento(dayHorarios, horario);
      
      const item = createHorarioItem(horario, dateObj);
      
      // Si hay conflicto, agregar indicador visual
      if (tieneConflicto) {
        item.style.borderLeft = '4px solid #f59e0b';
        item.style.position = 'relative';
        const warningBadge = document.createElement('div');
        warningBadge.innerHTML = '⚠️';
        warningBadge.style.position = 'absolute';
        warningBadge.style.top = '4px';
        warningBadge.style.right = '4px';
        warningBadge.style.fontSize = '16px';
        warningBadge.title = 'Conflicto de horario: esta sesión se solapa con otra';
        item.appendChild(warningBadge);
      }
      
      content.appendChild(item);
      
      // Verificar si hay hueco libre con la siguiente sesión
      if (index < dayHorarios.length - 1) {
        const proximaSession = dayHorarios[index + 1];
        const horaFin = horario.horaFin || '00:00';
        const horaProxima = proximaSession.horaInicio || '00:00';
        
        // Convertir a minutos para comparación más precisa
        const [hFin, mFin] = horaFin.split(':').map(Number);
        const [hProx, mProx] = horaProxima.split(':').map(Number);
        const minutosFin = hFin * 60 + mFin;
        const minutosProx = hProx * 60 + mProx;
        
        // Si hay diferencia de al menos 1 minuto, mostrar "Libre"
        if (minutosProx > minutosFin) {
          const huecoLibre = document.createElement('div');
          huecoLibre.className = 'horario-item-libre';
          huecoLibre.style.backgroundColor = '#e5e7eb';
          huecoLibre.style.borderLeftColor = '#9ca3af';
          huecoLibre.style.padding = '8px';
          huecoLibre.style.marginBottom = '8px';
          huecoLibre.style.borderRadius = '4px';
          huecoLibre.style.borderLeft = '3px solid';
          huecoLibre.style.fontSize = '12px';
          huecoLibre.style.color = '#718096';
          huecoLibre.style.fontStyle = 'italic';
          huecoLibre.innerHTML = `<div style="font-weight: 500;">⏰ Libre: ${horaFin} - ${horaProxima}</div>`;
          content.appendChild(huecoLibre);
        }
      }
    });
    
    // Mostrar hueco libre al FINAL del día si la última sesión termina antes de las 13:30
    const ultimaSession = dayHorarios[dayHorarios.length - 1];
    const horaUltima = ultimaSession.horaFin || '13:30';
    const [hUlt, mUlt] = horaUltima.split(':').map(Number);
    const [hFinal, mFinal] = horaFin.split(':').map(Number);
    const minutosUlt = hUlt * 60 + mUlt;
    const minutosFinal = hFinal * 60 + mFinal;
    
    if (minutosUlt < minutosFinal) {
      const huecoFinal = document.createElement('div');
      huecoFinal.className = 'horario-item-libre';
      huecoFinal.style.backgroundColor = '#e5e7eb';
      huecoFinal.style.borderLeftColor = '#9ca3af';
      huecoFinal.style.padding = '8px';
      huecoFinal.style.marginBottom = '8px';
      huecoFinal.style.borderRadius = '4px';
      huecoFinal.style.borderLeft = '3px solid';
      huecoFinal.style.fontSize = '12px';
      huecoFinal.style.color = '#718096';
      huecoFinal.style.fontStyle = 'italic';
      huecoFinal.innerHTML = `<div style="font-weight: 500;">⏰ Libre: ${horaUltima} - ${horaFin}</div>`;
      content.appendChild(huecoFinal);
    }
  }

  card.appendChild(header);
  card.appendChild(content);

  return card;
}

/**
 * Obtiene los horarios para un día específico (considerando el rango de semana para coberturas)
 */
function getHorariosForDay(dayName, dateObj, pasante = null, weekRange = null) {
  const horarios = [];

  // Usar el pasante especificado o el actual
  const pasanteTarget = pasante || (typeof pasanteActual !== 'undefined' ? pasanteActual : null);

  // Convertir fecha actual a string YYYY-MM-DD para comparaciones
  const fechaActualStr = dateObj ? 
    `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}` 
    : null;

  // Obtener horarios del pasante (si existe)
  if (pasanteTarget) {
    // Obtener horarios personalizados del pasante
    const horariosDelPasante = horariosPersonalizados[pasanteTarget] || { sesiones: [], talleres: [] };
    
    // Sesiones personalizadas
    (horariosDelPasante.sesiones || []).forEach((sesion) => {
      if (sesion.dias && sesion.dias.includes(dayName)) {
        // Validar si la cobertura temporal aplica a esta semana
        const mostrarSesion = validarSesionEnSemana(sesion, weekRange, fechaActualStr);
        
        if (mostrarSesion) {
          horarios.push({
            ...sesion,
            type: 'sesion'
          });
        }
      }
    });

    // Buscar sesiones donde este pasante es apoyo de OTRO pasante
    // Estas sesiones aparecerán en color rosa
    RESPONSABLES_LISTA.forEach((otroPasante) => {
      if (otroPasante === pasanteTarget) return; // Saltar el mismo pasante
      
      const horariosDelOtro = horariosPersonalizados[otroPasante] || { sesiones: [], talleres: [] };
      (horariosDelOtro.sesiones || []).forEach((sesion) => {
        if (sesion.dias && sesion.dias.includes(dayName) && !sesion.pausada) {
          // Verificar si el pasante actual está en los apoyos
          const apoyos = sesion.apoyos || (sesion.apoyo ? [sesion.apoyo] : []);
          if (apoyos.includes(pasanteTarget)) {
            horarios.push({
              ...sesion,
              type: 'sesion',
              esApoyo: true, // Marcar como sesión de apoyo
              responsableOriginal: otroPasante,
              colorApoyo: '#ec4899' // Rosa
            });
          }
        }
      });
    });
  } else {
    // Si no hay pasante seleccionado, usar los datos generales
    // Sesiones
    horariosData.sesiones.forEach((sesion) => {
      if (sesion.dias && sesion.dias.includes(dayName)) {
        horarios.push({
          ...sesion,
          type: 'sesion'
        });
      }
    });
  }
  
  // ===== TALLERES GLOBALES (siempre se muestran, filtrados por visibilidad) =====
  horariosData.talleres.forEach((taller) => {
    if (taller.dias && taller.dias.includes(dayName)) {
      // Verificar si este taller se muestra para el pasante seleccionado
      let mostrarTaller = false;
      
      // Nuevo formato: array de responsables
      if (taller.responsables && taller.responsables.length > 0) {
        // Si no hay pasante seleccionado, mostrar
        if (!pasanteTarget) {
          mostrarTaller = true;
        } else {
          // Mostrar si el pasante está en la lista de responsables
          mostrarTaller = taller.responsables.includes(pasanteTarget);
        }
      }
      // Formato antiguo: un solo responsable (para compatibilidad)
      else if (!pasanteTarget) {
        mostrarTaller = !taller.responsable || taller.responsable === 'todos';
      } else if (!taller.responsable || taller.responsable === 'todos') {
        // Si no tiene asignación o es 'todos', mostrar a todos
        mostrarTaller = true;
      } else if (taller.responsable === 'responsables' && !isApoyo(pasanteTarget)) {
        // Si es para 'responsables', mostrar solo si es un responsable
        mostrarTaller = true;
      } else if (taller.responsable === 'apoyos' && isApoyo(pasanteTarget)) {
        // Si es para 'apoyos', mostrar solo si es un apoyo
        mostrarTaller = true;
      } else if (taller.responsable && taller.responsable.startsWith('responsable:')) {
        // Si es para un responsable específico, comparar nombres
        const nombreEspecifico = taller.responsable.replace('responsable:', '');
        mostrarTaller = pasanteTarget === nombreEspecifico;
      } else if (taller.responsable && taller.responsable.startsWith('apoyo:')) {
        // Si es para un apoyo específico, comparar nombres
        const nombreEspecifico = taller.responsable.replace('apoyo:', '');
        mostrarTaller = pasanteTarget === nombreEspecifico;
      }
      
      if (mostrarTaller) {
        horarios.push({
          ...taller,
          type: 'taller'
        });
      }
    }
  });

  // Ordenar por hora de inicio
  horarios.sort((a, b) => {
    const timeA = a.horaInicio || '00:00';
    const timeB = b.horaInicio || '00:00';
    return timeA.localeCompare(timeB);
  });

  const talleresEnEsteDia = horarios.filter(h => h.type === 'taller').length;
  if (talleresEnEsteDia > 0) {
    console.log(`📅 ${dayName}: ${talleresEnEsteDia} taller(es) mostrado(s). Pasante: ${pasanteTarget}`);
  }

  return horarios;
}

/**
 * Valida si una sesión debe mostrarse en la semana específica
 * Considera coberturas temporales y períodos de cobertura exactos
 */
function validarSesionEnSemana(sesion, weekRange, fechaActualStr) {
  // Si no hay rango de semana, mostrar siempre (para compatibilidad)
  if (!weekRange) {
    return !sesion.pausada || (sesion.pausada && sesion.pausadaPor === 'vacaciones') || sesion.esCoberturaTemp || sesion.esApoyoEnCobertura;
  }

  // Sesión de cobertura temporal - validar que esté dentro del rango de cobertura
  if ((sesion.esCoberturaTemp || sesion.esApoyoEnCobertura) && sesion.fechasCobertureFin) {
    const fechaCoberturaInicio = sesion.fechasCoberturaInicio;
    const fechaCoberturaFin = sesion.fechasCobertureFin;
    
    // Convertir fechas de cobertura a strings
    const fechaActual = new Date(fechaActualStr + 'T00:00:00');
    const fechaInicio = new Date(fechaCoberturaInicio + 'T00:00:00');
    const fechaFin = new Date(fechaCoberturaFin + 'T23:59:59');
    
    // Mostrar solo si la fecha actual está dentro del rango de cobertura
    return fechaActual >= fechaInicio && fechaActual <= fechaFin;
  }

  // Sesión pausada (no por vacaciones) - nunca mostrar
  if (sesion.pausada && sesion.pausadaPor !== 'vacaciones') {
    return false;
  }

  // Sesión normal - mostrar siempre
  return true;
}

/**
 * Verifica si un nombre es un apoyo (practicante)
 */
function isApoyo(nombre) {
  return APOYOS_LISTA.includes(nombre);
}

/**
 * Verifica si un nombre es un pasante (responsable)
 */
function isPasante(nombre) {
  return RESPONSABLES_LISTA.includes(nombre);
}

/**
 * Crea un elemento de horario
 */
function createHorarioItem(horario, dateObj = null) {
  const item = document.createElement('div');
  item.className = `horario-item ${horario.type}`;

  // Determinar el color a usar
  let backgroundColor = '#faf8ff'; // Color por defecto
  let borderColor = '#bacbcc'; // Color personalizado
  let isDisabled = false;
  let esCoberturaTemp = horario.esCoberturaTemp || false;
  let isPausada = horario.pausada || false;
  
  // Verificar si está siendo redistribuido en esta fecha específica
  let esRedistribuido = false;
  if (horario.redistribucionesVacaciones && dateObj) {
    const fechaStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    esRedistribuido = horario.redistribucionesVacaciones.some(red => {
      const desde = new Date(red.desde + 'T00:00:00');
      const hasta = new Date(red.hasta + 'T23:59:59');
      const fecha = new Date(fechaStr + 'T00:00:00');
      return fecha >= desde && fecha <= hasta;
    });
  }
  
  // Verificar si la usuaria está ausente
  if (horario.nombre && dateObj) {
    console.log('Verificando ausencia para:', horario.nombre, 'en fecha:', dateObj);
    if (isUsuariaAusente(horario.nombre, dateObj)) {
      console.log('Usuaria ENCONTRADA como ausente');
      isDisabled = true;
    }
  }
  
  if (!isDisabled) {
    // Si es sesión de apoyo (pasante apoyando a otro), usar color del responsable original
    if (horario.esApoyo && horario.responsableOriginal && PASANTE_COLORS[horario.responsableOriginal]) {
      backgroundColor = PASANTE_COLORS[horario.responsableOriginal].light;
      borderColor = PASANTE_COLORS[horario.responsableOriginal].bg;
    } else if (esCoberturaTemp && horario.responsableOriginal && PASANTE_COLORS[horario.responsableOriginal]) {
      // Si es una cobertura temporal, usar el color del pasante ORIGINAL
      backgroundColor = PASANTE_COLORS[horario.responsableOriginal].light;
      borderColor = PASANTE_COLORS[horario.responsableOriginal].bg;
    } else if (horario.isApoyo && horario.apoyoColor) {
      // Si es un apoyo (practicante), usar el color del pasante al que apoya
      if (PASANTE_COLORS[horario.apoyoColor]) {
        backgroundColor = PASANTE_COLORS[horario.apoyoColor].light;
        borderColor = PASANTE_COLORS[horario.apoyoColor].bg;
      }
    } else if (horario.responsable && PASANTE_COLORS[horario.responsable]) {
      // Si tiene responsable conocido, usar su color
      backgroundColor = PASANTE_COLORS[horario.responsable].light;
      borderColor = PASANTE_COLORS[horario.responsable].bg;
    } else if (horario.type === 'sesion' && !horario.responsable) {
      // Si es una sesión sin responsable (apoyo impartiendo), usar gris
      backgroundColor = APOYO_COLOR.light;
      borderColor = APOYO_COLOR.bg;
    }
  }

  item.style.backgroundColor = backgroundColor;
  item.style.borderLeftColor = borderColor;
  
  // Si está siendo redistribuido en esta fecha, mostrar opaca
  if (esRedistribuido) {
    item.style.position = 'relative';
    item.style.opacity = '0.6';
    item.style.backgroundColor = '#f5f5f5';
    item.style.borderLeftColor = '#cccccc';
  } else if (isPausada && horario.pausadaPor === 'vacaciones') {
    item.style.position = 'relative';
    item.style.opacity = '0.6';
    item.style.backgroundColor = '#f5f5f5';
    item.style.borderLeftColor = '#cccccc';
  } else if (isDisabled) {
    // Aplicar filtro gris y opacidad
    item.style.position = 'relative';
    item.style.opacity = '0.5';
    item.style.backgroundColor = '#e8e8e8';
    item.style.borderLeftColor = '#999999';
  }

  const timeRange = `${horario.horaInicio || '00:00'} - ${horario.horaFin || '00:00'}`;

  // Determinar el icono según el tipo
  let icono = isDisabled ? '🚫 ' : '👤 ';
  if (horario.esApoyo) {
    icono = '🩷 '; // Corazón rosa para sesiones donde es apoyo
  }

  let html = `
    <div class="horario-time" style="${isDisabled ? 'color: #999;' : ''}">${timeRange}</div>
    <div class="horario-name" style="${isDisabled ? 'color: #999;' : ''}">
      ${icono}
      <strong>${horario.nombre || horario.nombreTaller}</strong>
      ${horario.esApoyo ? '<span style="font-size: 10px; color: #ec4899; font-weight: 600;"> (APOYO)</span>' : ''}
    </div>
  `;

  if (horario.habitacion) {
    html += `<div class="horario-habitacion" style="${isDisabled ? 'color: #999;' : 'color: #2d3748;'}">🚪 Hab. ${horario.habitacion}</div>`;
  }

  if (horario.lugar) {
    html += `<div class="horario-lugar" style="${isDisabled ? 'color: #999;' : ''}">📍 ${horario.lugar}</div>`;
  }

  // Mostrar responsables (puede ser uno o múltiples para talleres)
  if (horario.responsables && horario.responsables.length > 0) {
    // Múltiples responsables (talleres)
    const nombresCortos = horario.responsables.map(r => getNombreCorto(r)).join(', ');
    const label = horario.responsables.length > 1 ? 'Imparten' : 'Imparte';
    html += `<div class="horario-responsable" style="${isDisabled ? 'color: #999;' : ''}">${label}: ${nombresCortos}</div>`;
  } else if (horario.responsable) {
    // No mostrar línea de responsable si es un apoyo en cobertura temporal
    // (se mostrará en la línea de apoyo en su lugar)
    if (horario.esApoyoEnCobertura) {
      // Saltar esta línea, se mostrará en apoyo
    } else {
      let textoResponsable = `Imparte: ${horario.responsable}`;
      if (esCoberturaTemp && horario.responsableOriginal) {
        if (horario.esCompartido) {
          textoResponsable = `Imparte: ${horario.responsableOriginal} (cubre ${horario.responsable} - COMPARTIDO con ${horario.usuariaCompartida})`;
        } else {
          textoResponsable = `Imparte: ${horario.responsableOriginal} (cubre ${horario.responsable} temporalmente)`;
        }
      }
      html += `<div class="horario-responsable" style="${isDisabled ? 'color: #999;' : ''}${esCoberturaTemp ? 'font-style: italic;' : ''}">${textoResponsable}</div>`;
    }
  }

  if (horario.apoyo || (horario.apoyos && horario.apoyos.length > 0)) {
    // Manejar múltiples apoyos
    const apoyosList = horario.apoyos && horario.apoyos.length > 0 ? horario.apoyos : [horario.apoyo];
    
    if (apoyosList.length === 1 && apoyosList[0]) {
      let textoApoyo = `Apoyo: ${apoyosList[0]}`;
      // Si es un apoyo viendo una sesión que está siendo cubierta temporalmente
      if (horario.esApoyoEnCobertura && horario.responsableOriginal && horario.responsable) {
        textoApoyo = `Apoyo con: ${horario.responsable} (cubre a ${horario.responsableOriginal})`;
      }
      html += `<div class="horario-apoyo" style="${isDisabled ? 'color: #999;' : ''}${horario.esApoyoEnCobertura ? 'color: #d32f2f; font-weight: bold;' : ''}">${textoApoyo}</div>`;
    } else if (apoyosList.length > 1) {
      // Múltiples apoyos
      html += `<div class="horario-apoyos-list" style="${isDisabled ? 'opacity: 0.6;' : ''}">`;
      html += `<span style="font-size: 11px; color: #666;">Apoyos:</span> `;
      apoyosList.forEach(apoyo => {
        html += `<span class="horario-apoyo-tag">${apoyo.split(' ')[0]}</span>`;
      });
      html += `</div>`;
    }
  }

  if (esCoberturaTemp) {
    html += `<div style="font-size: 11px; color: #2e7d32; font-weight: bold; margin-top: 4px;">⏱️ Cobertura temporal durante vacaciones</div>`;
  }

  // Si está siendo redistribuido en esta fecha, mostrar indicador
  if (esRedistribuido) {
    html += `<div style="font-size: 11px; color: #1976d2; font-weight: bold; margin-top: 4px;">🔄 Redistribuida</div>`;
  }

  // Si está pausada (y no es cobertura temporal), mostrar texto "Redistribuida" en azul
  if (isPausada && horario.pausadaPor === 'vacaciones' && !esCoberturaTemp && !esRedistribuido) {
    html += `<div style="font-size: 11px; color: #1976d2; font-weight: bold; margin-top: 4px;">🔄 Redistribuida</div>`;
  }

  if (horario.notas) {
    html += `<div class="horario-responsable" style="${isDisabled ? 'color: #999;' : ''}">📝 ${horario.notas}</div>`;
  }

  item.innerHTML = html;

  // Evento de clic para editar
  item.style.cursor = 'pointer';
  item.addEventListener('click', () => {
    editHorario(horario);
  });

  return item;
}

/**
 * Carga los pasantes disponibles en el selector
 */
function loadPasantes(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  select.innerHTML = '<option value="">-- Selecciona pasante --</option>';
  
  // Usar RESPONSABLES_LISTA que contiene los nombres correctos de los pasantes
  RESPONSABLES_LISTA.forEach((pasante) => {
    const option = document.createElement('option');
    option.value = pasante;
    option.textContent = pasante;
    select.appendChild(option);
  });
}


/**
 * Abre el modal para nueva sesión
 */
function openModalSesion() {
  // Verificar permiso de edición
  const responsable_name = sessionStorage.getItem('responsable_name');
  if (responsable_name !== 'Tavata Alexa Basurto Ramírez') {
    showMessage('❌ Solo el administrador (LFT) puede crear sesiones', 'error');
    return;
  }

  document.getElementById('modalSesion').classList.add('active');
  loadUsuarias();
  loadApoyos();
  generarCuadriculaHoraria();
  
  // Establecer el responsable (pasante) automáticamente
  const responsableSelect = document.getElementById('sesion-responsable');
  
  if (pasanteActual && responsableSelect) {
    responsableSelect.value = pasanteActual;
    // Forzar actualización visual
    responsableSelect.textContent = pasanteActual;
    responsableSelect.innerHTML = `<option value="${pasanteActual}" selected>${pasanteActual}</option>`;
  }
}

/**
 * Genera la cuadrícula horaria (Lunes-Viernes, 9:30-13:30, bloques 30min)
 */
function generarCuadriculaHoraria() {
  const grid = document.getElementById('sesion-horario-grid');
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const horas = [];
  
  // Generar bloques de 30 minutos de 9:30 a 13:30
  for (let h = 9; h <= 13; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 13 && m > 0) break; // No incluir 13:30 en adelante
      const horaStr = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
      horas.push(horaStr);
    }
  }

  let html = '<div class="horario-grid">';
  
  // Header con días
  html += '<div class="horario-grid-header"></div>'; // Esquina superior izquierda
  dias.forEach(dia => {
    html += `<div class="horario-grid-header">${dia}</div>`;
  });

  // Filas de horarios
  horas.forEach(hora => {
    html += `<div class="horario-grid-time">${hora}</div>`;
    dias.forEach((dia, dayIndex) => {
      const slotId = `slot-${hora.replace(':', '')}-${dayIndex}`;
      html += `<div class="horario-slot" id="${slotId}" data-hora="${hora}" data-dia="${dayIndex}" data-dia-nombre="${dia}" onclick="toggleHorarioSlot('${slotId}')"></div>`;
    });
  });

  html += '</div>';
  grid.innerHTML = html;
}

/**
 * Alterna la selección de un slot horario
 */
function toggleHorarioSlot(slotId) {
  const slot = document.getElementById(slotId);
  const isSelected = slot.classList.contains('selected');
  
  if (isSelected) {
    slot.classList.remove('selected');
  } else {
    slot.classList.add('selected');
  }
  
  actualizarSlotsSeleccionados();
}

/**
 * Actualiza el campo hidden con los slots seleccionados
 */
function actualizarSlotsSeleccionados() {
  const slots = Array.from(document.querySelectorAll('.horario-slot.selected'));
  const selected = slots.map(slot => ({
    hora: slot.dataset.hora,
    dia: slot.dataset.diaNombre
  }));
  document.getElementById('sesion-selected-slots').value = JSON.stringify(selected);
}

/**
 * Cierra el modal de sesión
 */
function closeModalSesion() {
  document.getElementById('modalSesion').classList.remove('active');
  document.getElementById('formSesion').reset();
  // Habilitar el select de pasante nuevamente
  const pasanteSelect = document.getElementById('sesion-pasante');
  if (pasanteSelect) {
    pasanteSelect.disabled = false;
  }
}

/**
 * Abre el modal para nuevo taller
 */
function openModalTaller() {
  // Verificar permiso de edición
  const responsable_name = sessionStorage.getItem('responsable_name');
  if (responsable_name !== 'Tavata Alexa Basurto Ramírez') {
    showMessage('❌ Solo el administrador (LFT) puede crear talleres', 'error');
    return;
  }

  document.getElementById('modalTaller').classList.add('active');
  loadTallerResponsablesCheckboxes();
}

/**
 * Carga los checkboxes de responsables para el modal de taller
 */
function loadTallerResponsablesCheckboxes() {
  const container = document.getElementById('taller-responsables-checkboxes');
  if (!container) return;
  
  const pasantes = getResponsablesLista();
  
  let html = '';
  pasantes.forEach((pasante, index) => {
    const nombreCorto = pasante.split(' ').slice(0, 2).join(' ');
    const colors = PASANTE_COLORS[pasante] || { bg: '#6b7280', light: '#f3f4f6' };
    
    html += `
      <label style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: ${colors.light}; border-radius: 6px; cursor: pointer; border: 2px solid transparent;" class="taller-pasante-checkbox">
        <input type="checkbox" name="taller-responsables" value="${pasante}" data-index="${index}">
        <span style="font-size: 13px;">${nombreCorto}</span>
      </label>
    `;
  });
  
  container.innerHTML = html;
}

/**
 * Toggle todos los pasantes para el taller
 */
function toggleTallerTodos() {
  const todosCheck = document.getElementById('taller-todos');
  const checkboxes = document.querySelectorAll('input[name="taller-responsables"]');
  
  checkboxes.forEach(cb => {
    cb.checked = todosCheck.checked;
  });
}

/**
 * Cierra el modal de taller
 */
function closeModalTaller() {
  document.getElementById('modalTaller').classList.remove('active');
  document.getElementById('formTaller').reset();
}

/**
 * Maneja el cambio de taller personalizado
 */
function handleTallerChange() {
  const select = document.getElementById('taller-nombre');
  const customContainer = document.getElementById('taller-custom-container');
  
  if (select.value === 'otro') {
    customContainer.style.display = 'block';
    document.getElementById('taller-nombre-custom').required = true;
  } else {
    customContainer.style.display = 'none';
    document.getElementById('taller-nombre-custom').required = false;
  }
}

/**
 * Carga las usuarias en el selector y configura auto-llenado de habitación
 */
async function loadUsuarias() {
  const select = document.getElementById('sesion-usuaria');
  const habitacionInput = document.getElementById('sesion-habitacion');
  
  // Usar USUARIAS que está disponible globalmente en horarios.html
  if (typeof USUARIAS === 'undefined' || !Array.isArray(USUARIAS)) {
    console.error('USUARIAS no está disponible');
    return;
  }

  select.innerHTML = '<option value="">-- Selecciona usuaria --</option>';
  
  USUARIAS.forEach((usuaria) => {
    const option = document.createElement('option');
    option.value = usuaria.nombre;
    option.textContent = usuaria.nombre;
    option.dataset.habitacion = usuaria.habitacion || '';
    select.appendChild(option);
  });
  
  // Remover listener anterior si existe y agregar uno nuevo
  const newSelect = select.cloneNode(true);
  select.parentNode.replaceChild(newSelect, select);
  
  // Agregar listener para auto-llenar habitación
  document.getElementById('sesion-usuaria').addEventListener('change', function() {
    const selectedOption = this.options[this.selectedIndex];
    if (habitacionInput && selectedOption.dataset.habitacion) {
      habitacionInput.value = selectedOption.dataset.habitacion;
    } else if (habitacionInput) {
      habitacionInput.value = '';
    }
  });
}

/**
 * Carga la lista de apoyos (practicantes) en el selector
 * Ahora soporta selección múltiple
 */
function loadApoyos() {
  const select = document.getElementById('sesion-apoyo');
  
  if (!select) return;
  
  // Limpiar opciones (ya no necesitamos la opción "Sin apoyo" porque es múltiple)
  select.innerHTML = '';
  
  APOYOS_LISTA.forEach((apoyo) => {
    const option = document.createElement('option');
    option.value = apoyo;
    option.textContent = apoyo;
    select.appendChild(option);
  });
}

/**
 * Carga los responsables
 */
function loadResponsables(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  // Intentar usar PASANTES de horarios.html, si no está disponible usar lista alternativa
  let responsables = [];
  let apoyos = [];
  
  if (typeof PASANTES !== 'undefined' && Array.isArray(PASANTES)) {
    responsables = PASANTES.map(nombre => ({ nombre }));
  } else if (typeof RESPONSABLES_LISTA !== 'undefined' && Array.isArray(RESPONSABLES_LISTA)) {
    responsables = RESPONSABLES_LISTA.map(nombre => ({ nombre }));
  }
  
  if (typeof APOYOS !== 'undefined' && Array.isArray(APOYOS)) {
    apoyos = APOYOS.map(nombre => ({ nombre }));
  } else if (typeof APOYOS_LISTA !== 'undefined' && Array.isArray(APOYOS_LISTA)) {
    apoyos = APOYOS_LISTA.map(nombre => ({ nombre }));
  }

  // Encontrar los optgroups y rellenarlos
  const optgroupResponsables = select.querySelector('optgroup:nth-of-type(1)');
  const optgroupApoyos = select.querySelector('optgroup:nth-of-type(2)');
  
  if (optgroupResponsables) {
    optgroupResponsables.innerHTML = '<option disabled>Responsables Específicos</option>';
    responsables.forEach((responsable) => {
      const option = document.createElement('option');
      option.value = `responsable:${responsable.nombre}`;
      option.textContent = `  └─ ${responsable.nombre}`;
      optgroupResponsables.appendChild(option);
    });
  }
  
  if (optgroupApoyos) {
    optgroupApoyos.innerHTML = '<option disabled>Apoyos Específicos</option>';
    apoyos.forEach((apoyo) => {
      const option = document.createElement('option');
      option.value = `apoyo:${apoyo.nombre}`;
      option.textContent = `  └─ ${apoyo.nombre}`;
      optgroupApoyos.appendChild(option);
    });
  }
}

/**
 * Obtiene los días seleccionados
 */
function getSelectedDays(prefix) {
  const diasCompletos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];  // 🔧 Sin sábado
  const selected = [];

  diasCompletos.forEach((dia) => {
    // Construir el ID del checkbox usando el prefijo proporcionado
    const checkboxId = prefix ? `${prefix}-${dia}` : `day-${dia}`;
    const checkbox = document.getElementById(checkboxId);
    if (checkbox && checkbox.checked) {
      const dayMap = {
        'lunes': 'Lunes',
        'martes': 'Martes',
        'miercoles': 'Miércoles',
        'jueves': 'Jueves',
        'viernes': 'Viernes',
        'sabado': 'Sábado'
      };
      selected.push(dayMap[dia]);
    }
  });

  return selected;
}

/**
 * Guarda una nueva sesión
 */
function saveSesion(event) {
  event.preventDefault();

  // Verificar permiso de edición
  const responsable_name = sessionStorage.getItem('responsable_name');
  const isTavata = responsable_name === 'Tavata Alexa Basurto Ramírez';
  
  if (!isTavata) {
    showMessage('❌ Solo el administrador (LFT) puede crear sesiones', 'error');
    return;
  }

  // Obtener datos del formulario
  const pasante = pasanteActual;
  const usuaria = document.getElementById('sesion-usuaria').value;
  const habitacion = document.getElementById('sesion-habitacion').value;
  const responsable = document.getElementById('sesion-responsable').value;
  
  // Obtener apoyos seleccionados (múltiples)
  const apoyoSelect = document.getElementById('sesion-apoyo');
  const apoyos = Array.from(apoyoSelect.selectedOptions).map(opt => opt.value);
  
  const lugar = document.getElementById('sesion-lugar').value;
  const notas = document.getElementById('sesion-notas').value;
  const slotsJSON = document.getElementById('sesion-selected-slots').value;
  
  if (!pasante) {
    showMessage('❌ Falta establecer el pasante', 'error');
    return;
  }

  if (!usuaria || !responsable || !lugar) {
    showMessage('❌ Por favor completa todos los campos requeridos', 'error');
    return;
  }

  const slots = JSON.parse(slotsJSON || '[]');
  if (slots.length === 0) {
    showMessage('❌ Selecciona al menos un bloque horario', 'error');
    return;
  }

  // Procesar slots para crear sesiones por día
  const sesionPorDia = {};
  slots.forEach(slot => {
    const dia = slot.dia;
    if (!sesionPorDia[dia]) {
      sesionPorDia[dia] = [];
    }
    sesionPorDia[dia].push(slot.hora);
  });

  // Crear una sesión por cada día con sus horarios
  const sesiones = [];
  Object.entries(sesionPorDia).forEach(([dia, horas]) => {
    const horaInicio = horas[0]; // Primera hora seleccionada
    const horaFin = horas[horas.length - 1]; // Última hora
    
    // Calcular hora fin (sumar 30 minutos a la última hora)
    const [h, m] = horaFin.split(':').map(Number);
    const horaFinDateTime = new Date();
    horaFinDateTime.setHours(h, m + 30);
    const horaFinStr = String(horaFinDateTime.getHours()).padStart(2, '0') + ':' + 
                       String(horaFinDateTime.getMinutes()).padStart(2, '0');
    
    const sesion = {
      id: Date.now() + Math.random(),
      nombre: usuaria,
      usuaria,
      habitacion,
      responsable,
      apoyos: apoyos.length > 0 ? apoyos : [], // Ahora es un array
      apoyo: apoyos.length > 0 ? apoyos[0] : null, // Mantener compatibilidad con código antiguo
      lugar,
      horaInicio,
      horaFin: horaFinStr,
      notas,
      dias: [dia],
      type: 'sesion'
    };
    
    sesiones.push(sesion);
  });

  // Guardar en horarios personalizados del pasante
  if (!horariosPersonalizados[pasante]) {
    horariosPersonalizados[pasante] = { sesiones: [], talleres: [] };
  }
  horariosPersonalizados[pasante].sesiones.push(...sesiones);

  // Guardar en localStorage y notificar
  guardarHorariosPersonalizados();

  showMessage('✅ Sesión(es) guardada(s) exitosamente', 'success');
  setTimeout(() => {
    closeModalSesion();
    renderHorarios();
  }, 1500);
}

/**
 * Guarda un nuevo taller
 */
function saveTaller(event) {
  event.preventDefault();

  // Verificar permiso de edición
  const responsable_name = sessionStorage.getItem('responsable_name');
  if (responsable_name !== 'Tavata Alexa Basurto Ramírez') {
    showMessage('❌ Solo el administrador (LFT) puede crear talleres', 'error');
    return;
  }

  let nombre = document.getElementById('taller-nombre').value;
  
  if (nombre === 'otro') {
    nombre = document.getElementById('taller-nombre-custom').value;
    if (!nombre) {
      showMessage('❌ Por favor ingresa el nombre del taller personalizado', 'error');
      return;
    }
  }

  if (!nombre) {
    showMessage('❌ Por favor selecciona un nombre para el taller', 'error');
    return;
  }

  // Obtener responsables seleccionados (checkboxes)
  const checkboxes = document.querySelectorAll('input[name="taller-responsables"]:checked');
  const responsablesSeleccionados = Array.from(checkboxes).map(cb => cb.value);
  
  if (responsablesSeleccionados.length === 0) {
    showMessage('❌ Por favor selecciona al menos un pasante que imparta/vea este taller', 'error');
    return;
  }
  
  const lugar = document.getElementById('taller-lugar').value;
  const horaInicio = document.getElementById('taller-hora-inicio').value;
  const horaFin = document.getElementById('taller-hora-fin').value;
  const descripcion = document.getElementById('taller-descripcion').value;
  const dias = getSelectedDays('taller-day');

  if (!lugar) {
    showMessage('❌ Por favor selecciona un lugar', 'error');
    return;
  }

  if (!horaInicio) {
    showMessage('❌ Por favor selecciona la hora de inicio', 'error');
    return;
  }

  if (!horaFin) {
    showMessage('❌ Por favor selecciona la hora de fin', 'error');
    return;
  }

  if (dias.length === 0) {
    showMessage('❌ Por favor selecciona al menos un día de la semana', 'error');
    return;
  }

  const taller = {
    id: Date.now(),
    nombreTaller: nombre,
    responsables: responsablesSeleccionados,
    lugar,
    horaInicio,
    horaFin,
    descripcion,
    dias,
    type: 'taller'
  };

  horariosData.talleres.push(taller);
  guardarHorariosData();
  
  console.log('✅ TALLER GUARDADO:', taller);
  console.log('📊 Total de talleres en memoria:', horariosData.talleres.length);

  showMessage('✅ Taller guardado exitosamente', 'success');
  setTimeout(() => {
    closeModalTaller();
    renderHorarios();
  }, 1500);
}

/**
 * Edita un horario (solo para el administrador LFT)
 */
function editHorario(horario) {
  // Verificar permiso de edición
  const responsable_name = sessionStorage.getItem('responsable_name');
  if (responsable_name !== 'Tavata Alexa Basurto Ramírez') {
    showMessage('❌ Solo el administrador (LFT) puede editar horarios', 'error');
    return;
  }

  // Guardar el horario actual para edición
  window.horarioEnEdicion = horario;

  // Mostrar botón eliminar (permitir eliminar cualquier horario)
  const btnEliminar = document.getElementById('btn-eliminar-horario');
  if (btnEliminar) {
    btnEliminar.style.display = 'inline-block';
    btnEliminar.onclick = () => {
      if (confirm('¿Estás seguro de que quieres eliminar este horario?')) {
        eliminarHorario(horario.id);
      }
    };
  }

  // Abrir modal (que cargará automáticamente los valores)
  openModalEditarHorario();
}

/**
 * Muestra un mensaje
 */
function showMessage(text, type = 'success') {
  const messageBox = document.getElementById('messageBox');
  messageBox.textContent = text;
  messageBox.className = `message show ${type}`;

  setTimeout(() => {
    messageBox.classList.remove('show');
  }, 4000);
}

/**
 * Inicializa la página
 */
function initPage() {
  // 📌 Cargar lista de usuarias actualizada desde config
  cargarUsuarias();
  
  updateWeekTitle();
  
  // Cargar horarios personalizados desde localStorage
  cargarHorariosPersonalizados();
  
  // Cargar datos de talleres desde localStorage
  cargarHorariosData();
  
  // Limpiar coberturas temporales que ya vencieron
  limpiarCoberturasvencidas();
  
  // Inicializar interfaz según el usuario
  const responsable_name = sessionStorage.getItem('responsable_name');
  const responsable_prefijo = sessionStorage.getItem('responsable_prefijo');
  
  if (!responsable_name) {
    alert('Por favor inicia sesión primero');
    window.location.href = 'index.html';
    return;
  }

  // Actualizar badge del usuario
  if (typeof updateBadge === 'function') {
    updateBadge(responsable_name, responsable_prefijo);
  }

  // Verificar si es Tavata (Coordinadora)
  const isTavata = responsable_name === 'Tavata Alexa Basurto Ramírez';
  
  if (isTavata) {
    // Mostrar selector de pasantes para Tavata (puede seleccionar a otros o su propio horario como Coordinadora)
    mostrarSelectorPasantes();
    const actionButtons = document.getElementById('action-buttons-container');
    if (actionButtons) {
      actionButtons.style.display = 'flex';
    }
    // Tavata puede consultar su propio horario
    // Se permite que seleccione en el selector
  } else {
    // Para pasantes normales, mostrar su propio horario
    pasanteActual = responsable_name;
    const selectorContainer = document.getElementById('pasante-selector-container');
    if (selectorContainer) {
      selectorContainer.style.display = 'none';
    }
    const actionButtons = document.getElementById('action-buttons-container');
    if (actionButtons) {
      actionButtons.style.display = 'none';
    }
  }
  
  renderHorarios();

  // Mostrar botón de vista global solo para Tavata
  const btnVistaGlobal = document.getElementById('btn-vista-global');
  if (btnVistaGlobal) {
    btnVistaGlobal.style.display = isTavata ? 'flex' : 'none';
  }
  
  // Mostrar botón de horarios libres solo para Tavata
  const btnHorariosLibres = document.getElementById('btn-horarios-libres');
  if (btnHorariosLibres) {
    btnHorariosLibres.style.display = isTavata ? 'flex' : 'none';
  }
}



/**
 * Abre el modal para establecer vacaciones
 */
function openModalVacaciones() {
  // Verificar permiso de edición
  const responsable_name = sessionStorage.getItem('responsable_name');
  if (responsable_name !== 'Tavata Alexa Basurto Ramírez') {
    showMessage('❌ Solo el administrador (LFT) puede establecer vacaciones', 'error');
    return;
  }

  document.getElementById('modalVacaciones').classList.add('active');
  loadPasantes('vacaciones-pasante');
}

/**
 * Cierra el modal de vacaciones
 */
function closeModalVacaciones() {
  document.getElementById('modalVacaciones').classList.remove('active');
  document.getElementById('formVacaciones').reset();
}

/**
 * Guarda las vacaciones de un pasante
 */
/**
 * Variable global para almacenar datos de redistribución en progreso
 */
let redistribucionEnProgreso = {
  pasante: null,
  fechaInicio: null,
  fechaFin: null,
  sesionesARedistribuir: [],
  asignacionesTemp: {},
  sesionesNoAsignadas: []
};

function saveVacaciones(event) {
  event.preventDefault();

  // Verificar permiso
  const responsable_name = sessionStorage.getItem('responsable_name');
  if (responsable_name !== 'Tavata Alexa Basurto Ramírez') {
    showMessage('❌ Solo el administrador (LFT) puede establecer vacaciones', 'error');
    return;
  }

  const pasante = document.getElementById('vacaciones-pasante').value;
  const fechaInicio = document.getElementById('vacaciones-fecha-inicio').value;
  const fechaFin = document.getElementById('vacaciones-fecha-fin').value;
  const notas = document.getElementById('vacaciones-notas').value;

  if (!pasante || !fechaInicio || !fechaFin) {
    showMessage('Por favor completa todos los campos requeridos', 'error');
    return;
  }

  // No permitir vacaciones para Tavata (Alexa Basurto)
  if (pasante === 'Tavata Alexa Basurto Ramírez') {
    showMessage('❌ No se pueden establecer vacaciones para el administrador', 'error');
    return;
  }

  // Crear registro de vacaciones
  if (!vacacionesPasantes[pasante]) {
    vacacionesPasantes[pasante] = [];
  }

  const vacacion = {
    id: Date.now(),
    fechaInicio: new Date(fechaInicio),
    fechaFin: new Date(fechaFin),
    notas: notas,
    estado: 'activa'
  };

  vacacionesPasantes[pasante].push(vacacion);
  guardarVacacionesPasantes();

  // Obtener sesiones a redistribuir
  const sesionesARedistribuir = (horariosPersonalizados[pasante]?.sesiones || []).filter(sesion => {
    // Filtrar sesiones que ocurren DURANTE el período de vacaciones
    if (!sesion.dias || sesion.dias.length === 0) {
      return false;
    }
    
    // Mapeo de nombres de días a números de getDay()
    const dayNameToNumber = {
      'Domingo': 0,
      'Lunes': 1,
      'Martes': 2,
      'Miércoles': 3,
      'Miercoles': 3, // Alternativa sin acento
      'Jueves': 4,
      'Viernes': 5,
      'Sábado': 6,
      'Sabado': 6  // Alternativa sin acento
    };
    
    // Convertir strings de fechas a Date
    const inicioVac = new Date(fechaInicio + 'T00:00:00');
    const finVac = new Date(fechaFin + 'T23:59:59');
    
    // Para cada día de sesión, verificar si al menos una ocurrencia cae dentro de vacaciones
    return sesion.dias.some(diaSesion => {
      const diaNumero = dayNameToNumber[diaSesion];
      
      if (diaNumero === undefined) {
        console.warn(`Día desconocido en sesión: ${diaSesion}`);
        return false;
      }
      
      // Iterar desde el inicio hasta el fin de vacaciones
      let fechaActual = new Date(inicioVac);
      
      while (fechaActual <= finVac) {
        // Si encontramos el día de la semana dentro del rango, incluir sesión
        if (fechaActual.getDay() === diaNumero) {
          return true;
        }
        fechaActual.setDate(fechaActual.getDate() + 1);
      }
      
      return false;
    });
  });

  // Preparar datos para redistribución
  console.log(`🔍 Buscar sesiones para ${pasante} entre ${fechaInicio} y ${fechaFin}`);
  console.log(`📋 Total de sesiones: ${(horariosPersonalizados[pasante]?.sesiones || []).length}`);
  console.log(`✅ Sesiones a redistribuir: ${sesionesARedistribuir.length}`);
  sesionesARedistribuir.forEach(s => {
    console.log(`  - ${s.nombre} (${s.dias?.join(', ')})`);
  });
  
  redistribucionEnProgreso = {
    pasante: pasante,
    fechaInicio: fechaInicio,
    fechaFin: fechaFin,
    sesionesARedistribuir: sesionesARedistribuir,
    asignacionesTemp: {},
    sesionesNoAsignadas: [...sesionesARedistribuir]
  };

  // Cerrar modal de vacaciones y abrir modal de redistribución
  closeModalVacaciones();
  abrirModalRedistribucion();
}

/**
 * Variables para manejar vista global
 */
let isVistaGlobalMode = false;

/**
 * Alterna entre vista individual y vista global
 */
function toggleVistaGlobal() {
  isVistaGlobalMode = !isVistaGlobalMode;
  const btnVistaGlobal = document.getElementById('btn-vista-global');
  const textElement = document.getElementById('vista-global-text');
  
  if (isVistaGlobalMode) {
    renderVistaGlobal();
    textElement.textContent = 'Vista Individual';
  } else {
    renderHorarios();
    textElement.textContent = 'Vista Global';
  }
}

/**
 * Renderiza la vista global con todos los pasantes
 */
function renderVistaGlobal() {
  const weekDays = getWeekDays(currentWeekStart);
  const grid = document.getElementById('horariosGrid');
  const loading = document.getElementById('horarios-loading');

  loading.style.display = 'block';
  grid.style.display = 'none';

  setTimeout(() => {
    grid.innerHTML = '';
    
    // Filtrar lista de pasantes (excluir a Tavata)
    const pasantesFiltrados = RESPONSABLES_LISTA.filter(p => !p.includes('Tavata'));
    
    // Crear tabla para alinear los días correctamente
    const table = document.createElement('div');
    table.style.display = 'grid';
    table.style.gridTemplateColumns = `80px repeat(${pasantesFiltrados.length}, 1fr)`;
    table.style.gap = '8px';
    table.style.width = '100%';
    table.style.overflowX = 'auto';
    
    // Fila de encabezados (vacío + nombres de pasantes)
    const headerEmpty = document.createElement('div');
    headerEmpty.style.fontWeight = '700';
    headerEmpty.style.padding = '8px';
    table.appendChild(headerEmpty);
    
    pasantesFiltrados.forEach((pasante) => {
      const pasanteHeader = document.createElement('div');
      pasanteHeader.style.fontWeight = '700';
      pasanteHeader.style.padding = '8px';
      pasanteHeader.style.borderRadius = '8px';
      pasanteHeader.style.textAlign = 'center';
      pasanteHeader.style.color = 'white';
      pasanteHeader.style.fontSize = '11px';
      if (PASANTE_COLORS[pasante]) {
        pasanteHeader.style.backgroundColor = PASANTE_COLORS[pasante].bg;
      }
      pasanteHeader.textContent = getNombreDisplay(pasante);
      table.appendChild(pasanteHeader);
    });
    
    // Filas de días (día + celdas de cada pasante)
    weekDays.forEach((date) => {
      const dayName = getDayName(date);
      const formattedDate = formatDate(date);
      
      // Celda del día
      const dayLabel = document.createElement('div');
      dayLabel.style.fontWeight = '600';
      dayLabel.style.fontSize = '11px';
      dayLabel.style.padding = '8px 4px';
      dayLabel.style.display = 'flex';
      dayLabel.style.flexDirection = 'column';
      dayLabel.style.justifyContent = 'flex-start';
      dayLabel.style.alignItems = 'center';
      dayLabel.style.borderRight = '2px solid #e5e7eb';
      dayLabel.innerHTML = `<span>${dayName.substring(0, 3)}</span><span style="font-size:9px;color:#666;">${formattedDate}</span>`;
      table.appendChild(dayLabel);
      
      // Celdas para cada pasante en este día
      pasantesFiltrados.forEach((pasante) => {
        const cell = document.createElement('div');
        cell.style.minHeight = '150px';
        cell.style.padding = '6px';
        cell.style.borderRadius = '6px';
        cell.style.fontSize = '10px';
        cell.style.overflow = 'hidden';
        
        if (PASANTE_COLORS[pasante]) {
          cell.style.backgroundColor = PASANTE_COLORS[pasante].light;
          cell.style.borderLeft = `3px solid ${PASANTE_COLORS[pasante].bg}`;
        } else {
          cell.style.backgroundColor = '#f9fafb';
          cell.style.borderLeft = '3px solid #e5e7eb';
        }
        
        // Obtener horarios para este día y pasante
        const dayHorarios = getHorariosForDay(dayName, date, pasante, null);
        
        if (dayHorarios.length === 0) {
          cell.innerHTML = '<div style="color:#9ca3af;text-align:center;padding:8px;">Libre</div>';
        } else {
          dayHorarios.forEach((horario) => {
            const miniItem = document.createElement('div');
            miniItem.style.padding = '6px';
            miniItem.style.marginBottom = '6px';
            miniItem.style.borderRadius = '4px';
            miniItem.style.backgroundColor = 'rgba(255,255,255,0.85)';
            miniItem.style.fontSize = '10px';
            miniItem.style.lineHeight = '1.4';
            
            // Detectar si es apoyo
            if (horario.esApoyo) {
              miniItem.style.backgroundColor = '#fce7f3';
              miniItem.style.borderLeft = '2px solid #ec4899';
            }
            
            // Detectar solapamiento
            const tieneConflicto = detectarSolapamiento(dayHorarios, horario);
            let conflictoHTML = '';
            if (tieneConflicto) {
              miniItem.style.backgroundColor = '#fef3c7';
              miniItem.style.borderLeft = '2px solid #f59e0b';
              conflictoHTML = '⚠️ ';
            }
            
            // Mostrar información completa
            const nombre = horario.nombre || horario.nombreTaller || '';
            const habitacion = horario.habitacion ? `Hab. ${horario.habitacion}` : '';
            const lugar = horario.lugar ? `📍 ${horario.lugar}` : '';
            const apoyoTag = horario.esApoyo ? '<span style="color:#ec4899;font-weight:600;">(APOYO)</span>' : '';
            
            miniItem.innerHTML = `
              ${conflictoHTML}<strong>${horario.horaInicio}-${horario.horaFin}</strong> ${apoyoTag}<br>
              <span style="font-weight:600;">${nombre}</span>
              ${habitacion ? `<br><span style="color:#666;">${habitacion}</span>` : ''}
              ${lugar ? `<br><span style="color:#666;">${lugar}</span>` : ''}
            `;
            cell.appendChild(miniItem);
          });
        }
        
        table.appendChild(cell);
      });
    });
    
    grid.appendChild(table);
    
    loading.style.display = 'none';
    grid.style.display = 'block';
  }, 300);
}

/**
 * Detecta si un horario se solapa con otros en la misma lista
 */
function detectarSolapamiento(horarios, horarioActual) {
  const [hIni, mIni] = (horarioActual.horaInicio || '00:00').split(':').map(Number);
  const [hFin, mFin] = (horarioActual.horaFin || '00:00').split(':').map(Number);
  const inicioActual = hIni * 60 + mIni;
  const finActual = hFin * 60 + mFin;
  
  return horarios.some(otro => {
    if (otro.id === horarioActual.id) return false;
    
    const [hOtroIni, mOtroIni] = (otro.horaInicio || '00:00').split(':').map(Number);
    const [hOtroFin, mOtroFin] = (otro.horaFin || '00:00').split(':').map(Number);
    const inicioOtro = hOtroIni * 60 + mOtroIni;
    const finOtro = hOtroFin * 60 + mOtroFin;
    
    // Hay solapamiento si: inicio1 < fin2 AND inicio2 < fin1
    return inicioActual < finOtro && inicioOtro < finActual;
  });
}

/**
 * Obtiene la habitación de una usuaria basada en su nombre
 */
function getHabitacionFromUsuaria(nombreUsuaria) {
  if (typeof USUARIAS === 'undefined') return '';
  
  const usuaria = USUARIAS.find(u => u.nombre === nombreUsuaria);
  return usuaria ? usuaria.habitacion : '';
}

/**
 * Auto-llena la habitación cuando se selecciona una usuaria
 */
function autoFillHabitacion() {
  const usuariaSelect = document.getElementById('sesion-usuaria');
  const habitacionInput = document.getElementById('sesion-habitacion');
  
  if (usuariaSelect && habitacionInput) {
    const nombreUsuaria = usuariaSelect.value;
    const habitacion = getHabitacionFromUsuaria(nombreUsuaria);
    habitacionInput.value = habitacion;
  }
}

/**
 * Abre el modal de edición de horario
 */
function openModalEditarHorario() {
  const modal = document.getElementById('modalEditarHorario');
  if (modal) {
    modal.classList.add('active');
    
    // Cargar pasantes y apoyos en los selects
    loadPasantesInSelect('editar-responsable');
    loadApoyosInSelect('editar-apoyo');
    
    // Si hay un horario en edición, cargar sus valores actuales después de poblar los selects
    if (window.horarioEnEdicion) {
      setTimeout(() => {
        const horario = window.horarioEnEdicion;
        document.getElementById('editar-tipo').value = horario.type || 'sesion';
        document.getElementById('editar-nombre').value = horario.nombre || horario.nombreTaller || '';
        document.getElementById('editar-hora-inicio').value = horario.horaInicio || '';
        document.getElementById('editar-hora-fin').value = horario.horaFin || '';
        document.getElementById('editar-responsable').value = horario.responsable || horario.apoyoColor || '';
        document.getElementById('editar-lugar').value = horario.lugar || '';
        document.getElementById('editar-habitacion').value = horario.habitacion || '';
        
        // Manejar apoyos múltiples
        const apoyoSelect = document.getElementById('editar-apoyo');
        if (apoyoSelect) {
          // Limpiar selección previa
          Array.from(apoyoSelect.options).forEach(opt => opt.selected = false);
          
          // Seleccionar apoyos actuales
          const apoyos = horario.apoyos && horario.apoyos.length > 0 ? horario.apoyos : (horario.apoyo ? [horario.apoyo] : []);
          apoyos.forEach(apoyo => {
            const option = Array.from(apoyoSelect.options).find(opt => opt.value === apoyo);
            if (option) option.selected = true;
          });
        }
        
        document.getElementById('editar-notas').value = horario.notas || '';
      }, 50);
    }
  }
}

/**
 * Cierra el modal de edición de horario
 */
function closeModalEditarHorario() {
  const modal = document.getElementById('modalEditarHorario');
  if (modal) {
    modal.classList.remove('active');
    window.horarioEnEdicion = null;
  }
}

/**
 * Carga pasantes en un select específico
 */
function loadPasantesInSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = '<option value="">-- Selecciona responsable --</option>';

  if (typeof RESPONSABLES_LISTA !== 'undefined') {
    RESPONSABLES_LISTA.forEach(pasante => {
      const option = document.createElement('option');
      option.value = pasante;
      option.textContent = pasante;
      select.appendChild(option);
    });
  }
}

/**
 * Carga apoyos en un select específico
 * Ahora soporta selección múltiple con practicantes y otros pasantes
 */
function loadApoyosInSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  // Limpiar todas las opciones
  select.innerHTML = '';
  
  // Agregar grupo de practicantes
  const groupPracticantes = document.createElement('optgroup');
  groupPracticantes.label = '👥 Practicantes';
  
  if (typeof APOYOS_LISTA !== 'undefined') {
    APOYOS_LISTA.forEach(apoyo => {
      const option = document.createElement('option');
      option.value = apoyo;
      option.textContent = apoyo;
      groupPracticantes.appendChild(option);
    });
  }
  select.appendChild(groupPracticantes);
  
  // Agregar grupo de otros pasantes (excepto el responsable actual de la sesión)
  const groupPasantes = document.createElement('optgroup');
  groupPasantes.label = '🩷 Otros Pasantes (aparecerá en rosa en su horario)';
  
  const responsableActual = sessionStorage.getItem('responsable_name') || '';
  
  RESPONSABLES_LISTA.forEach(pasante => {
    // No incluir al pasante actual como opción de apoyo
    if (pasante !== responsableActual) {
      const option = document.createElement('option');
      option.value = pasante;
      option.textContent = getNombreCorto(pasante) + ' (PSS)';
      option.setAttribute('data-es-pasante', 'true');
      groupPasantes.appendChild(option);
    }
  });
  
  if (groupPasantes.children.length > 0) {
    select.appendChild(groupPasantes);
  }
}

/**
 * Guarda los cambios del horario editado
 */
function saveEditarHorario(event) {
  event.preventDefault();

  const horario = window.horarioEnEdicion;
  if (!horario) return;

  // Obtener valores del formulario
  const horaInicio = document.getElementById('editar-hora-inicio').value;
  const horaFin = document.getElementById('editar-hora-fin').value;
  const nuevoResponsable = document.getElementById('editar-responsable').value;
  
  // Obtener apoyos seleccionados (múltiples)
  const apoyoSelect = document.getElementById('editar-apoyo');
  const apoyosSeleccionados = Array.from(apoyoSelect.selectedOptions).map(opt => opt.value);
  
  const lugar = document.getElementById('editar-lugar').value;
  const habitacion = document.getElementById('editar-habitacion').value;
  const notas = document.getElementById('editar-notas').value;
  const nombre = document.getElementById('editar-nombre').value;

  // Validar
  if (!horaInicio || !horaFin || !nuevoResponsable) {
    showMessage('❌ Por favor completa los campos requeridos', 'error');
    return;
  }

  // Guardar el responsable anterior
  const responsableAnterior = horario.responsable;

  // Actualizar horario
  horario.horaInicio = horaInicio;
  horario.horaFin = horaFin;
  horario.responsable = nuevoResponsable;
  
  // Actualizar apoyos (múltiples)
  horario.apoyos = apoyosSeleccionados;
  horario.apoyo = apoyosSeleccionados.length > 0 ? apoyosSeleccionados[0] : null; // Mantener compatibilidad
  horario.lugar = lugar;
  horario.habitacion = habitacion;
  horario.notas = notas;
  if (horario.nombre) horario.nombre = nombre;
  if (horario.nombreTaller) horario.nombreTaller = nombre;

  // Si cambió el responsable, mover la sesión de un pasante a otro
  if (responsableAnterior !== nuevoResponsable && responsableAnterior && nuevoResponsable) {
    // Eliminar del pasante anterior
    if (horariosPersonalizados[responsableAnterior]) {
      if (horario.type === 'taller') {
        horariosPersonalizados[responsableAnterior].talleres = 
          horariosPersonalizados[responsableAnterior].talleres.filter(t => t.id !== horario.id);
      } else {
        horariosPersonalizados[responsableAnterior].sesiones = 
          horariosPersonalizados[responsableAnterior].sesiones.filter(s => s.id !== horario.id);
      }
    }

    // Agregar al nuevo pasante
    if (!horariosPersonalizados[nuevoResponsable]) {
      horariosPersonalizados[nuevoResponsable] = { sesiones: [], talleres: [] };
    }
    
    if (horario.type === 'taller') {
      horariosPersonalizados[nuevoResponsable].talleres.push(horario);
    } else {
      horariosPersonalizados[nuevoResponsable].sesiones.push(horario);
    }
  } else {
    // Si no cambió el responsable, solo actualizar en el pasante actual
    const responsablePasante = nuevoResponsable;
    if (horariosPersonalizados[responsablePasante]) {
      if (horario.type === 'taller') {
        const idx = horariosPersonalizados[responsablePasante].talleres.findIndex(t => t.id === horario.id);
        if (idx >= 0) horariosPersonalizados[responsablePasante].talleres[idx] = horario;
      } else {
        const idx = horariosPersonalizados[responsablePasante].sesiones.findIndex(s => s.id === horario.id);
        if (idx >= 0) horariosPersonalizados[responsablePasante].sesiones[idx] = horario;
      }
    }
  }

  // Guardar en localStorage
  guardarHorariosPersonalizados();

  showMessage('✅ Horario actualizado correctamente', 'success');
  closeModalEditarHorario();
  renderHorarios();
}

/**
 * Elimina un horario
 */
function eliminarHorario(id) {
  const horario = window.horarioEnEdicion;
  
  if (!horario) {
    showMessage('❌ No hay horario seleccionado para eliminar', 'error');
    return;
  }

  // Eliminar de horariosPersonalizados (horarios personalizados del pasante)
  if (pasanteActual && horariosPersonalizados[pasanteActual]) {
    if (horario.type === 'taller') {
      const index = horariosPersonalizados[pasanteActual].talleres.findIndex(t => 
        t.nombreTaller === horario.nombreTaller && 
        t.horaInicio === horario.horaInicio && 
        t.horaFin === horario.horaFin
      );
      if (index !== -1) {
        horariosPersonalizados[pasanteActual].talleres.splice(index, 1);
      }
    } else {
      const index = horariosPersonalizados[pasanteActual].sesiones.findIndex(s => 
        s.nombre === horario.nombre && 
        s.horaInicio === horario.horaInicio && 
        s.horaFin === horario.horaFin &&
        JSON.stringify(s.dias) === JSON.stringify(horario.dias)
      );
      if (index !== -1) {
        horariosPersonalizados[pasanteActual].sesiones.splice(index, 1);
      }
    }
  }

  // También eliminar de horariosData si existe
  if (horario.type === 'taller') {
    horariosData.talleres = horariosData.talleres.filter(t => t.id !== id);
  } else {
    horariosData.sesiones = horariosData.sesiones.filter(s => s.id !== id);
  }

  // Guardar en localStorage
  guardarHorariosPersonalizados();
  localStorage.setItem('horariosData', JSON.stringify(horariosData));

  showMessage('✅ Horario eliminado correctamente', 'success');
  closeModalEditarHorario();
  renderHorarios();
}

/**
 * Abre el modal de ausencias de usuarias
 */
/**
 * Abre el modal de gestión de ausencias
 */
function openModalGestionarAusencias() {
  const modal = document.getElementById('modalGestionarAusencias');
  if (modal) {
    modal.classList.add('active');
    
    // Cargar usuarias en el select
    const selectUsuaria = document.getElementById('ausencia-usuaria');
    if (selectUsuaria && typeof USUARIAS !== 'undefined') {
      selectUsuaria.innerHTML = '<option value="">-- Selecciona usuaria --</option>';
      USUARIAS.forEach(usuaria => {
        const option = document.createElement('option');
        option.value = usuaria.nombre;
        option.textContent = usuaria.nombre;
        selectUsuaria.appendChild(option);
      });
      
      // Agregar event listener para cargar ausencias cuando se selecciona una usuaria
      selectUsuaria.onchange = renderAusenciasLista;
    }
    
    // Mostrar todas las ausencias al abrir el modal
    renderAusenciasLista();
  }
}

/**
 * Cierra el modal de gestión de ausencias
 */
function closeModalGestionarAusencias() {
  const modal = document.getElementById('modalGestionarAusencias');
  if (modal) {
    modal.classList.remove('active');
    // Limpiar el formulario
    const form = document.getElementById('formAusenciasUsuaria');
    if (form) form.reset();
  }
}

/**
 * Renderiza la lista de ausencias filtradas
 */
function renderAusenciasLista() {
  const selectUsuaria = document.getElementById('ausencia-usuaria');
  const usuariaSeleccionada = selectUsuaria ? selectUsuaria.value : null;
  const listaDiv = document.getElementById('ausencias-lista');
  
  if (!listaDiv) return;
  
  listaDiv.innerHTML = '';
  
  // Si no hay usuaria seleccionada, mostrar todas las ausencias
  if (!usuariaSeleccionada) {
    if (Object.keys(ausenciasUsuarias).length === 0) {
      listaDiv.innerHTML = '<div style="color: #999; padding: 10px; text-align: center;">No hay ausencias registradas</div>';
      return;
    }
    
    // Mostrar todas las ausencias agrupadas por usuaria
    Object.keys(ausenciasUsuarias).forEach(nombreUsuaria => {
      const ausencias = ausenciasUsuarias[nombreUsuaria];
      
      if (ausencias && ausencias.length > 0) {
        const grupoDiv = document.createElement('div');
        grupoDiv.style.cssText = 'border-left: 4px solid #bacbcc; padding-left: 10px; margin-bottom: 12px; padding: 10px; background: #f9f9f9; border-radius: 4px;';
        
        const titulo = document.createElement('div');
        titulo.style.cssText = 'font-weight: bold; color: #333; margin-bottom: 8px; font-size: 13px;';
        titulo.textContent = nombreUsuaria;
        grupoDiv.appendChild(titulo);
        
        ausencias.forEach((ausencia, index) => {
          const ausenciaDiv = crearElementoAusencia(nombreUsuaria, ausencia, index);
          grupoDiv.appendChild(ausenciaDiv);
        });
        
        listaDiv.appendChild(grupoDiv);
      }
    });
    return;
  }
  
  // Mostrar ausencias de la usuaria seleccionada
  const ausencias = ausenciasUsuarias[usuariaSeleccionada];
  
  if (!ausencias || ausencias.length === 0) {
    listaDiv.innerHTML = `<div style="color: #999; padding: 10px; text-align: center;">No hay ausencias para ${usuariaSeleccionada}</div>`;
    return;
  }
  
  ausencias.forEach((ausencia, index) => {
    const ausenciaDiv = crearElementoAusencia(usuariaSeleccionada, ausencia, index);
    listaDiv.appendChild(ausenciaDiv);
  });
}

/**
 * Crea un elemento de ausencia individual
 */
function crearElementoAusencia(nombreUsuaria, ausencia, index) {
  const div = document.createElement('div');
  div.style.cssText = 'background: white; border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 8px; font-size: 13px;';
  
  const fechasDiv = document.createElement('div');
  fechasDiv.style.cssText = 'color: #555; font-weight: 500; margin-bottom: 4px;';
  fechasDiv.textContent = `📅 ${ausencia.fechaInicio} a ${ausencia.fechaFin}`;
  div.appendChild(fechasDiv);
  
  const motivoDiv = document.createElement('div');
  motivoDiv.style.cssText = 'color: #666; margin-bottom: 4px;';
  motivoDiv.textContent = `Motivo: ${ausencia.motivo}`;
  div.appendChild(motivoDiv);
  
  if (ausencia.notas) {
    const notasDiv = document.createElement('div');
    notasDiv.style.cssText = 'color: #888; font-size: 12px; margin-bottom: 4px; font-style: italic;';
    notasDiv.textContent = `Notas: ${ausencia.notas}`;
    div.appendChild(notasDiv);
  }
  
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '🗑️ Eliminar';
  deleteBtn.style.cssText = 'background: #ffcccc; border: 1px solid #ff6666; color: #cc0000; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 12px; margin-top: 8px;';
  deleteBtn.onclick = () => {
    if (confirm(`¿Estás seguro de que deseas eliminar esta ausencia de ${nombreUsuaria}?`)) {
      deleteAusencia(nombreUsuaria, index);
    }
  };
  div.appendChild(deleteBtn);
  
  return div;
}

/**
 * Elimina una ausencia específica
 */
function deleteAusencia(nombreUsuaria, index) {
  if (ausenciasUsuarias[nombreUsuaria] && ausenciasUsuarias[nombreUsuaria][index]) {
    const ausencia = ausenciasUsuarias[nombreUsuaria][index];
    ausenciasUsuarias[nombreUsuaria].splice(index, 1);
    
    // Si no hay más ausencias para esta usuaria, eliminar la clave
    if (ausenciasUsuarias[nombreUsuaria].length === 0) {
      delete ausenciasUsuarias[nombreUsuaria];
    }
    
    // Guardar en localStorage
    guardarAusenciasUsuarias();
    
    // Re-renderizar la lista y los horarios
    renderAusenciasLista();
    renderHorarios();
    
    showMessage(`✅ Ausencia eliminada correctamente`, 'success');
  }
}

/**
 * Guarda una ausencia de usuaria
 */
function saveAusenciaUsuaria(event) {
  event.preventDefault();

  const nombreUsuaria = document.getElementById('ausencia-usuaria').value;
  const fechaInicio = document.getElementById('ausencia-fecha-inicio').value;
  const fechaFin = document.getElementById('ausencia-fecha-fin').value;
  const motivo = document.getElementById('ausencia-motivo').value;
  const notas = document.getElementById('ausencia-notas').value;

  // Validar
  if (!nombreUsuaria || !fechaInicio || !fechaFin || !motivo) {
    showMessage('❌ Por favor completa todos los campos requeridos', 'error');
    return;
  }

  // Validar fechas
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  if (inicio > fin) {
    showMessage('❌ La fecha de fin debe ser posterior a la de inicio', 'error');
    return;
  }

  // Inicializar array si no existe
  if (!ausenciasUsuarias[nombreUsuaria]) {
    ausenciasUsuarias[nombreUsuaria] = [];
  }

  // Agregar nueva ausencia
  ausenciasUsuarias[nombreUsuaria].push({
    fechaInicio: fechaInicio,
    fechaFin: fechaFin,
    motivo: motivo,
    notas: notas,
    fechaRegistro: new Date().toISOString()
  });

  // Guardar en localStorage
  guardarAusenciasUsuarias();

  showMessage('✅ Ausencia registrada correctamente', 'success');
  
  // Limpiar el formulario y re-renderizar la lista
  document.getElementById('formAusenciasUsuaria').reset();
  document.getElementById('ausencia-usuaria').value = '';
  renderAusenciasLista();
  renderHorarios();
}

/**
 * Abre el modal de redistribución y genera las opciones de cobertura
 */
function abrirModalRedistribucion() {
  const modal = document.getElementById('modalRedistribuirVacaciones');
  const contenido = document.getElementById('redistribuir-contenido');
  
  if (!modal) return;
  
  contenido.innerHTML = '';
  
  const { pasante, sesionesARedistribuir, fechaInicio, fechaFin } = redistribucionEnProgreso;
  
  console.log('Abriendo modal de redistribución');
  console.log('Pasante:', pasante);
  console.log('Sesiones a redistribuir:', sesionesARedistribuir);
  
  if (!sesionesARedistribuir || sesionesARedistribuir.length === 0) {
    const vacio = document.createElement('div');
    vacio.style.cssText = 'padding: 15px; background: #e8f5e9; border-radius: 4px; text-align: center; color: #2e7d32;';
    vacio.textContent = '✅ Este pasante no tiene sesiones registradas durante el período de vacaciones';
    contenido.appendChild(vacio);
    modal.classList.add('active');
    return;
  }
  
  // Crear título con información del pasante en vacaciones
  const titulo = document.createElement('div');
  titulo.style.cssText = 'padding: 15px; background: #fff3cd; border-radius: 4px; margin-bottom: 15px; font-size: 14px;';
  titulo.innerHTML = `
    <strong>📅 ${pasante}</strong> estará en vacaciones del <strong>${fechaInicio}</strong> al <strong>${fechaFin}</strong>.<br>
    <strong>${sesionesARedistribuir.length}</strong> usuarias necesitan ser reacomodadas. Se mostrarán sugerencias de horarios disponibles.
  `;
  contenido.appendChild(titulo);
  
  // Para cada sesión del pasante, buscar opciones de cobertura
  sesionesARedistribuir.forEach((sesion, index) => {
    const optionesCobertura = encontrarOpcionesCobertura(sesion);
    crearPanelConfirmacionUsuaria(contenido, sesion, optionesCobertura, index);
  });
  
  // Mostrar resumen al final
  const resumen = document.createElement('div');
  resumen.id = 'resumen-distribucion';
  resumen.style.cssText = 'padding: 15px; background: #f5f5f5; border-radius: 4px; margin-top: 20px; border-left: 4px solid #bacbcc;';
  resumen.innerHTML = `
    <strong>📊 Resumen de Redistribución:</strong><br>
    <div style="margin-top: 8px; font-size: 13px;">
      <div>✓ Asignadas: <span id="count-asignadas">0</span></div>
      <div>⏳ Pendientes: <span id="count-pendientes">${sesionesARedistribuir.length}</span></div>
    </div>
  `;
  contenido.appendChild(resumen);
  
  modal.classList.add('active');
}

/**
 * Encuentra pasantes disponibles (no en vacaciones) que tengan espacio a la misma hora
 */
function encontrarOpcionesCobertura(sesion) {
  const opciones = [];
  const horaInicio = sesion.horaInicio || '00:00';
  const horaFin = sesion.horaFin || '23:59';
  const dias = sesion.dias || [];
  
  const { fechaInicio, fechaFin, pasante } = redistribucionEnProgreso;
  
  // Revisar cada pasante (excepto Tavata y el que está de vacaciones)
  RESPONSABLES_LISTA.forEach(otroPasante => {
    if (otroPasante === pasante || otroPasante === 'Tavata Alexa Basurto Ramírez') {
      return; // Saltar el pasante de vacaciones y Tavata
    }
    
    // Verificar que el pasante no esté en vacaciones
    const estáEnVacaciones = (vacacionesPasantes[otroPasante] || []).some(vac => {
      const vacInicio = new Date(vac.fechaInicio);
      const vacFin = new Date(vac.fechaFin);
      const desdeVac = new Date(fechaInicio);
      const hastaVac = new Date(fechaFin);
      return !(hastaVac < vacInicio || desdeVac > vacFin);
    });
    
    if (estáEnVacaciones) {
      return;
    }
    
    // Revisar cada día de la semana
    dias.forEach(dia => {
      const horariosDelOtroPasante = getHorariosForDay(dia, null, otroPasante);
      
      // Buscar conflictos de horario y sesiones parciales
      let hayConflictoTotal = false;
      let tieneUnaSolaUsuaria = false;
      let usuariaConflictiva = null;
      
      horariosDelOtroPasante.forEach(h => {
        const hInicio = h.horaInicio || '00:00';
        const hFin = h.horaFin || '23:59';
        
        // Verifica si los tiempos se solapan
        const seSOlapa = !(hFin <= horaInicio || hInicio >= horaFin);
        
        if (seSOlapa) {
          hayConflictoTotal = true;
          // Pero podría ser una sesión que podemos compartir (si solo tiene una usuaria)
          if (hInicio === horaInicio && hFin === horaFin) {
            // Misma hora exacta, entonces se podría dividir el tiempo
            tieneUnaSolaUsuaria = true;
            usuariaConflictiva = h.nombre;
          }
        }
      });
      
      // Crear opción si hay espacio o si se puede compartir
      const key = `${otroPasante}_${dia}_${horaInicio}`;
      if (!opciones.find(o => o.key === key)) {
        opciones.push({
          pasante: otroPasante,
          dia: dia,
          horaInicio: horaInicio,
          horaFin: horaFin,
          key: key,
          hayEspacio: !hayConflictoTotal,
          puedeCompartir: tieneUnaSolaUsuaria,
          usuariaExistente: usuariaConflictiva
        });
      }
    });
  });
  
  return opciones;
}

/**
 * Crea un panel de confirmación para una usuaria
 */
function crearPanelConfirmacionUsuaria(contenedor, sesion, opciones, index) {
  const panel = document.createElement('div');
  panel.style.cssText = `
    border: 2px solid #ddd;
    border-radius: 6px;
    padding: 15px;
    margin-bottom: 15px;
    background: #fafafa;
  `;
  panel.id = `panel-sesion-${index}`;
  
  // Información de la usuaria
  const infoDiv = document.createElement('div');
  infoDiv.style.cssText = 'margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #ddd;';
  infoDiv.innerHTML = `
    <div style="font-weight: bold; color: #333; margin-bottom: 5px; font-size: 15px;">
      👤 ${sesion.nombre || 'Usuaria sin identificar'}
    </div>
    <div style="font-size: 13px; color: #666;">
      🕐 ${sesion.horaInicio || '--:--'} - ${sesion.horaFin || '--:--'} | 
      📍 ${sesion.lugar || 'Lugar no especificado'} |
      Días: ${(sesion.dias || []).join(', ')}
    </div>
  `;
  panel.appendChild(infoDiv);
  
  // Opciones de cobertura
  if (opciones.length === 0) {
    const noOpcionesDiv = document.createElement('div');
    noOpcionesDiv.style.cssText = 'padding: 10px; background: #ffe8e8; border-radius: 4px; color: #d32f2f; font-size: 13px; margin-bottom: 10px;';
    noOpcionesDiv.innerHTML = '<strong>❌ Sin opciones directas</strong><br>No hay pasantes con espacio libre en este horario. Requiere ajuste manual de horarios.';
    panel.appendChild(noOpcionesDiv);
  } else {
    // Separar opciones por tipo
    const conEspacioTotal = opciones.filter(o => o.hayEspacio);
    const conOpcionCompartir = opciones.filter(o => o.puedeCompartir && !o.hayEspacio);
    
    // Mostrar opciones con espacio total
    if (conEspacioTotal.length > 0) {
      const seccionEspacio = document.createElement('div');
      seccionEspacio.style.cssText = 'margin-bottom: 12px;';
      seccionEspacio.innerHTML = '<div style="font-size: 12px; font-weight: bold; color: #2e7d32; margin-bottom: 8px;">✓ OPCIONES CON ESPACIO DISPONIBLE:</div>';
      
      const botonesEspacio = document.createElement('div');
      botonesEspacio.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px;';
      
      conEspacioTotal.forEach(opcion => {
        const btn = crearBotonOpcion(sesion, opcion, index, false);
        botonesEspacio.appendChild(btn);
      });
      
      seccionEspacio.appendChild(botonesEspacio);
      panel.appendChild(seccionEspacio);
    }
    
    // Mostrar opciones para compartir tiempo
    if (conOpcionCompartir.length > 0) {
      const seccionCompartir = document.createElement('div');
      seccionCompartir.style.cssText = 'margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd;';
      seccionCompartir.innerHTML = `<div style="font-size: 12px; font-weight: bold; color: #f57c00; margin-bottom: 8px;">💡 SUGERENCIAS DE HORARIO COMPARTIDO:</div>`;
      
      const botonesCompartir = document.createElement('div');
      botonesCompartir.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px;';
      
      conOpcionCompartir.forEach(opcion => {
        const btn = crearBotonOpcion(sesion, opcion, index, true);
        botonesCompartir.appendChild(btn);
      });
      
      seccionCompartir.appendChild(botonesCompartir);
      panel.appendChild(seccionCompartir);
    }
  }
  
  contenedor.appendChild(panel);
}

/**
 * Crea un botón de opción para asignar una sesión
 */
function crearBotonOpcion(sesion, opcion, index, esCompartido) {
  const btn = document.createElement('button');
  btn.type = 'button';
  const colorPasante = PASANTE_COLORS[opcion.pasante];
  
  let textoBtn = `${getNombreDisplay(opcion.pasante)}`;
  if (esCompartido) {
    textoBtn += ` (divide con ${opcion.usuariaExistente})`;
  }
  textoBtn += ` - ${opcion.dia} ${opcion.horaInicio}`;
  
  btn.style.cssText = `
    padding: 10px 14px;
    background: ${colorPasante?.bg || '#bacbcc'};
    border: 2px solid ${colorPasante?.dark || '#999'};
    color: ${colorPasante?.textColor || 'white'};
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: transform 0.2s;
    white-space: nowrap;
  `;
  btn.textContent = `✓ ${textoBtn}`;
  
  btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
  btn.onmouseout = () => btn.style.transform = 'scale(1)';
  
  btn.onclick = () => {
    if (esCompartido) {
      // Pedir confirmación para dividir tiempo
      const msg = `¿Asignar a ${sesion.nombre} con ${opcion.pasante}?\n\nEsto dividirá el horario de ${opcion.horaInicio} a ${opcion.horaFin}:\n- Primera mitad: ${sesion.nombre} con el responsable original\n- Segunda mitad: ${sesion.nombre} con ${opcion.pasante}`;
      if (confirm(msg)) {
        asignarSesionTemporal(sesion, opcion, index, esCompartido);
        actualizarResumenDistribucion();
      }
    } else {
      asignarSesionTemporal(sesion, opcion, index, esCompartido);
      actualizarResumenDistribucion();
    }
  };
  
  return btn;
}

/**
 * Actualiza el resumen de distribución
 */
function actualizarResumenDistribucion() {
  const countAsignadas = document.getElementById('count-asignadas');
  const countPendientes = document.getElementById('count-pendientes');
  
  if (countAsignadas && countPendientes) {
    const asignadas = Object.keys(redistribucionEnProgreso.asignacionesTemp).length;
    const pendientes = redistribucionEnProgreso.sesionesNoAsignadas.length;
    
    countAsignadas.textContent = asignadas;
    countPendientes.textContent = pendientes;
  }
}

/**
 * Registra una asignación temporal de sesión
 */
function asignarSesionTemporal(sesion, opcion, index, esCompartido = false) {
  const key = `sesion_${index}`;
  redistribucionEnProgreso.asignacionesTemp[key] = {
    sesionOriginal: sesion,
    asignadoA: opcion.pasante,
    opcion: opcion,
    esCompartido: esCompartido
  };
  
  // Actualizar la lista de no asignadas
  redistribucionEnProgreso.sesionesNoAsignadas = redistribucionEnProgreso.sesionesNoAsignadas.filter(s => s !== sesion);
  
  // Actualizar visual del panel
  const panel = document.getElementById(`panel-sesion-${index}`);
  if (panel) {
    panel.style.background = '#e8f5e9';
    panel.style.borderColor = '#4caf50';
    
    // Reemplazar botones con confirmación
    const botonesDiv = panel.querySelector('div[style*="display: flex"]');
    if (botonesDiv) {
      const colorPasante = PASANTE_COLORS[opcion.pasante];
      let textoCompartido = '';
      if (esCompartido) {
        textoCompartido = `<br><small style="color: #f57c00; font-weight: bold;">💡 Horario dividido con ${opcion.usuariaExistente}</small>`;
      }
      botonesDiv.innerHTML = `
        <div style="width: 100%; padding: 10px; background: white; border-radius: 4px; border-left: 4px solid ${colorPasante?.bg};">
          <strong style="color: ${colorPasante?.bg};">✓ Reasignado a ${opcion.pasante}</strong><br>
          <small style="color: #666;">${opcion.dia} ${opcion.horaInicio}${textoCompartido}</small>
          <button type="button" onclick="desasignarSesion(${index})" style="margin-left: 10px; padding: 4px 8px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
            Cambiar
          </button>
        </div>
      `;
    }
  }
}

/**
 * Desasigna una sesión temporal
 */
function desasignarSesion(index) {
  const key = `sesion_${index}`;
  if (redistribucionEnProgreso.asignacionesTemp[key]) {
    const sesion = redistribucionEnProgreso.asignacionesTemp[key].sesionOriginal;
    redistribucionEnProgreso.sesionesNoAsignadas.push(sesion);
    delete redistribucionEnProgreso.asignacionesTemp[key];
    
    // Reabrir modal para re-elegir
    abrirModalRedistribucion();
  }
}

/**
 * Finaliza la redistribución y aplica los cambios
 */
function finalizarRedistribucion() {
  const { pasante, asignacionesTemp, sesionesNoAsignadas, fechaInicio, fechaFin } = redistribucionEnProgreso;
  
  let contadorAsignadas = 0;
  let contadorPendientes = 0;
  
  // Aplicar asignaciones temporales
  Object.values(asignacionesTemp).forEach(asignacion => {
    const { sesionOriginal, asignadoA, opcion, esCompartido } = asignacion;
    
    // Marcar la sesión original con información de redistribución (sin pausarla completamente)
    // Esto permite que se muestre en el horario original con el estado de redistribución
    if (!sesionOriginal.redistribucionesVacaciones) {
      sesionOriginal.redistribucionesVacaciones = [];
    }
    sesionOriginal.redistribucionesVacaciones.push({
      desde: fechaInicio,
      hasta: fechaFin,
      redistribuidoA: asignadoA
    });
    
    if (esCompartido) {
      // Dividir la sesión en dos partes de 30 minutos SOLO para quien la cubre
      const horaInicio = sesionOriginal.horaInicio || '00:00';
      const horaFin = sesionOriginal.horaFin || '00:00';
      
      // Calcular la hora del medio (30 minutos después del inicio)
      const [hInicio, minInicio] = horaInicio.split(':').map(Number);
      const horaMedio = new Date(2000, 0, 1, hInicio, minInicio + 30);
      const horaMedioStr = `${String(horaMedio.getHours()).padStart(2, '0')}:${String(horaMedio.getMinutes()).padStart(2, '0')}`;
      
      // Segunda mitad: nueva sesión con el pasante que la cubre (compartida)
      const sesionSegunda = {
        ...sesionOriginal,
        id: `${sesionOriginal.id}_cobertura_${Date.now()}`, // ID único para evitar duplicados
        horaInicio: horaMedioStr,
        horaFin: horaFin,
        responsableOriginal: pasante,
        responsable: asignadoA,
        cubreA: pasante,
        esCoberturaTemp: true,
        fechasCoberturaInicio: fechaInicio,
        fechasCobertureFin: fechaFin,
        esCompartido: false,
        usuariaCompartida: null
      };
      
      // Agregar SOLO la segunda mitad a quien la cubre
      if (!horariosPersonalizados[asignadoA]) {
        horariosPersonalizados[asignadoA] = { sesiones: [], talleres: [] };
      }
      horariosPersonalizados[asignadoA].sesiones.push(sesionSegunda);
      
      // Si la sesión tiene apoyo, crear sesión de apoyo solo para la cobertura
      if (sesionOriginal.apoyo) {
        const sesionApoyoCobertura = {
          ...sesionOriginal,
          id: `${sesionOriginal.id}_apoyo_cobertura_${Date.now()}`,
          horaInicio: horaMedioStr,
          horaFin: horaFin,
          responsableOriginal: pasante,
          responsable: asignadoA,
          cubreA: pasante,
          esApoyoEnCobertura: true,
          esCoberturaTemp: true,
          fechasCoberturaInicio: fechaInicio,
          fechasCobertureFin: fechaFin
        };
        
        // Agregar a horariosPersonalizados del apoyo (practicante)
        if (!horariosPersonalizados[sesionOriginal.apoyo]) {
          horariosPersonalizados[sesionOriginal.apoyo] = { sesiones: [], talleres: [] };
        }
        horariosPersonalizados[sesionOriginal.apoyo].sesiones.push(sesionApoyoCobertura);
      }
      
      contadorAsignadas++;

    } else {
      // Sin compartir: crear una copia de la sesión con información de cobertura temporal
      const sesionCopia = {
        ...sesionOriginal,
        id: `${sesionOriginal.id}_cobertura_${Date.now()}`, // ID único para evitar duplicados
        responsableOriginal: pasante,
        responsable: asignadoA,
        cubreA: pasante,
        esCoberturaTemp: true,
        fechasCoberturaInicio: fechaInicio,
        fechasCobertureFin: fechaFin,
        esCompartido: false,
        usuariaCompartida: null
      };
      
      // Agregar a horariosPersonalizados del pasante que la cubre
      if (!horariosPersonalizados[asignadoA]) {
        horariosPersonalizados[asignadoA] = { sesiones: [], talleres: [] };
      }
      horariosPersonalizados[asignadoA].sesiones.push(sesionCopia);
      
      // Si la sesión tiene apoyo, crear sesión de apoyo solo para la cobertura
      if (sesionOriginal.apoyo) {
        const sesionApoyo = {
          ...sesionOriginal,
          id: `${sesionOriginal.id}_apoyo_cobertura_${Date.now()}`,
          responsableOriginal: pasante,
          responsable: asignadoA,
          cubreA: pasante,
          esCoberturaTemp: true,
          fechasCoberturaInicio: fechaInicio,
          fechasCobertureFin: fechaFin,
          esCompartido: false,
          usuariaCompartida: null,
          apoyo: sesionOriginal.apoyo,
          esApoyoEnCobertura: true // Bandera para el apoyo
        };
        
        // Agregar a horariosPersonalizados del apoyo (practicante)
        if (!horariosPersonalizados[sesionOriginal.apoyo]) {
          horariosPersonalizados[sesionOriginal.apoyo] = { sesiones: [], talleres: [] };
        }
        horariosPersonalizados[sesionOriginal.apoyo].sesiones.push(sesionApoyo);
      }
      
      contadorAsignadas++;
    }
  });
  
  // Marcar sesiones sin asignar como pendientes
  sesionesNoAsignadas.forEach(sesion => {
    sesion.pausada = true;
    sesion.pausadaPor = 'vacaciones';
    sesion.pausadaDesde = fechaInicio;
    sesion.pausadaHasta = fechaFin;
    sesion.estado = 'pendiente_cobertura';
    sesion.razonPendiente = `Vacaciones: ${fechaInicio} a ${fechaFin} - Requiere cobertura manual`;
    contadorPendientes++;
  });
  
  guardarHorariosPersonalizados();
  
  const mensaje = `✅ Redistribución completada.\n✓ Reasignadas: ${contadorAsignadas}\n⏳ Pendientes: ${contadorPendientes}`;
  showMessage(mensaje, 'success');
  
  closeModalRedistribuirVacaciones();
  renderHorarios();
}

/**
 * Cierra el modal de redistribución
 */
function closeModalRedistribuirVacaciones() {
  const modal = document.getElementById('modalRedistribuirVacaciones');
  if (modal) {
    modal.classList.remove('active');
  }
  redistribucionEnProgreso = {
    pasante: null,
    fechaInicio: null,
    fechaFin: null,
    sesionesARedistribuir: [],
    asignacionesTemp: {},
    sesionesNoAsignadas: []
  };
}


window.addEventListener('click', (event) => {
  const modalSesion = document.getElementById('modalSesion');
  const modalTaller = document.getElementById('modalTaller');
  const modalVacaciones = document.getElementById('modalVacaciones');
  const modalGestionarAusencias = document.getElementById('modalGestionarAusencias');
  const modalRedistribuirVacaciones = document.getElementById('modalRedistribuirVacaciones');

  if (event.target === modalSesion) {
    closeModalSesion();
  }
  if (event.target === modalTaller) {
    closeModalTaller();
  }
  if (event.target === modalVacaciones) {
    closeModalVacaciones();
  }
  if (event.target === modalGestionarAusencias) {
    closeModalGestionarAusencias();
  }
  if (event.target === modalRedistribuirVacaciones) {
    closeModalRedistribuirVacaciones();
  }
});

/**
 * Exporta el horario actual a PDF como imagen de alta calidad
 */
function exportHorarioToPDF() {
  try {
    const grid = document.getElementById('horariosGrid');
    const weekTitle = document.getElementById('weekTitle');
    
    if (!grid || grid.innerHTML.trim() === '') {
      alert('❌ No hay horarios para exportar');
      return;
    }
    
    alert('⏳ Generando PDF... por favor espera');
    
    // Forzar estilos para la captura
    const originalStyle = grid.style.cssText;
    grid.style.backgroundColor = '#ffffff';
    grid.style.opacity = '1';
    
    // Usar html2canvas para capturar el grid como imagen de alta calidad
    html2canvas(grid, {
      scale: 3,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: true,
      width: grid.scrollWidth,
      height: grid.scrollHeight,
      windowWidth: grid.scrollWidth,
      windowHeight: grid.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      imageTimeout: 0,
      removeContainer: false,
      foreignObjectRendering: false
    }).then(canvas => {
      // Restaurar estilos originales
      grid.style.cssText = originalStyle;
      // Crear PDF con la imagen
      const imgData = canvas.toDataURL('image/png');  // PNG para máxima calidad
      
      // Calcular dimensiones
      const imgWidth = 280;  // mm - ancho máximo en A4 horizontal
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Crear instancia de jsPDF usando el namespace window.jspdf
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Construir título con nombre del pasante/apoyo
      let titulo = 'Horario';
      if (pasanteActual) {
        titulo += ` - ${pasanteActual}`;
      }
      
      // Agregar título
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(titulo, 20, 15);
      
      // Agregar subtítulo
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      // Usar título dinámico según la vista
      const subtitulo = vistaActual === 'diaria' && diaSeleccionado 
        ? `Dia: ${diaSeleccionado}` 
        : weekTitle.textContent;
      doc.text(subtitulo, 20, 23);
      
      // Agregar imagen del grid
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.addImage(imgData, 'PNG', 10, 30, imgWidth, imgHeight);
      
      // Guardar PDF con nombre dinámico
      let nombreArchivo;
      const fecha = new Date().toISOString().slice(0,10);
      const pasanteNombre = pasanteActual ? pasanteActual.split(' ')[0].toLowerCase() : 'general';
      
      if (vistaActual === 'diaria' && diaSeleccionado) {
        nombreArchivo = `horario_${pasanteNombre}_${diaSeleccionado.toLowerCase()}_${fecha}.pdf`;
      } else {
        nombreArchivo = `horario_${pasanteNombre}_semana_${fecha}.pdf`;
      }
      
      doc.save(nombreArchivo);
      alert('✅ Horario exportado exitosamente');
    }).catch(error => {
      // Restaurar estilos originales en caso de error
      grid.style.cssText = originalStyle;
      console.error('Error capturando grid:', error);
      alert('❌ Error al capturar el horario: ' + error.message);
    });
    
  } catch (e) {
    console.error('Error exportando PDF:', e);
    alert('❌ Error al exportar el horario: ' + e.message);
  }
}

// =====================================================
// LISTADO DE SESIONES POR USUARIA
// =====================================================

/**
 * Abre el modal de listado de sesiones por usuaria
 */
function openModalListadoUsuarias() {
  const modal = document.getElementById('modalListadoUsuarias');
  if (modal) {
    modal.style.display = 'flex';
    renderListadoUsuarias();
  }
}

/**
 * Cierra el modal de listado de sesiones por usuaria
 */
function closeModalListadoUsuarias() {
  const modal = document.getElementById('modalListadoUsuarias');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Obtiene el nombre preferido para mostrar (casos especiales)
 */
function getNombreDisplay(nombreCompleto) {
  if (!nombreCompleto) return '';
  
  // Casos especiales: usar segundo nombre
  if (nombreCompleto.includes('Andrea Ofelia')) return 'Ofelia';
  if (nombreCompleto.includes('Leslie Amellali')) return 'Amellali';
  
  // Por defecto, usar primer nombre
  return nombreCompleto.split(' ')[0];
}

/**
 * Obtiene el nombre corto del pasante (nombre preferido + inicial del apellido)
 */
function getNombreCorto(nombreCompleto) {
  if (!nombreCompleto) return '';
  
  // Casos especiales
  if (nombreCompleto.includes('Andrea Ofelia')) {
    const parts = nombreCompleto.split(' ');
    return `Ofelia ${parts[parts.length - 1][0]}.`;
  }
  if (nombreCompleto.includes('Leslie Amellali')) {
    const parts = nombreCompleto.split(' ');
    return `Amellali ${parts[parts.length - 1][0]}.`;
  }
  
  const parts = nombreCompleto.split(' ');
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  }
  return parts[0];
}

/**
 * Obtiene el prefijo (PSS o LFT) basado en el nombre del pasante
 */
function getPrefijoPasante(nombrePasante) {
  // Tavata es LFT (admin), los demás son PSS
  if (nombrePasante && nombrePasante.includes('Tavata')) {
    return 'LFT';
  }
  return 'PSS';
}

/**
 * Renderiza el listado completo de sesiones organizadas por usuaria
 */
function renderListadoUsuarias() {
  const container = document.getElementById('listado-usuarias-container');
  if (!container) return;

  // Obtener todas las sesiones de todos los horarios
  const sesionesData = obtenerTodasLasSesiones();
  
  // Agrupar por usuaria
  const sesionesAgrupadas = agruparSesionesPorUsuaria(sesionesData);
  
  // Ordenar usuarias alfabéticamente
  const usuariasOrdenadas = Object.keys(sesionesAgrupadas).sort((a, b) => a.localeCompare(b, 'es'));
  
  if (usuariasOrdenadas.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-light);">
        <p style="font-size: 48px; margin-bottom: 16px;">📭</p>
        <p>No hay sesiones programadas.</p>
      </div>
    `;
    return;
  }

  let html = '';
  
  usuariasOrdenadas.forEach(usuaria => {
    const sesiones = sesionesAgrupadas[usuaria];
    const totalSesiones = sesiones.length;
    
    html += `
      <div class="usuaria-card" data-usuaria="${usuaria.toLowerCase()}" style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="background: #f8f9fa; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 15px; color: var(--text-dark); font-weight: 600;">
            👤 ${usuaria}
          </h3>
          <span style="background: #4a90e2; color: white; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">
            ${totalSesiones} ${totalSesiones === 1 ? 'sesión' : 'sesiones'}/semana
          </span>
        </div>
        <div style="padding: 12px 16px;">
          <div style="display: flex; flex-direction: column; gap: 8px;">
    `;
    
    // Ordenar sesiones por día de la semana
    const ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    sesiones.sort((a, b) => {
      const indexA = ordenDias.indexOf(a.dia);
      const indexB = ordenDias.indexOf(b.dia);
      if (indexA !== indexB) return indexA - indexB;
      // Si mismo día, ordenar por hora
      return a.horaInicio.localeCompare(b.horaInicio);
    });
    
    sesiones.forEach(sesion => {
      const colors = PASANTE_COLORS[sesion.responsable] || APOYO_COLOR;
      const nombreCorto = getNombreCorto(sesion.responsable);
      const prefijo = getPrefijoPasante(sesion.responsable);
      
      html += `
        <div style="display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: ${colors.light}; border-left: 4px solid ${colors.bg}; border-radius: 6px;">
          <div style="flex: 1;">
            <span style="font-weight: 600; color: var(--text-dark);">${sesion.dia}</span>
            <span style="color: var(--text-light); margin-left: 8px;">${sesion.horaInicio} - ${sesion.horaFin}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="background: ${colors.bg}; color: ${colors.textColor || 'white'}; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">
              ${prefijo}. ${nombreCorto}
            </span>
          </div>
        </div>
      `;
    });
    
    html += `
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

/**
 * Obtiene todas las sesiones de todos los pasantes
 */
function obtenerTodasLasSesiones() {
  const sesiones = [];
  
  // Obtener lista de todos los pasantes (responsables)
  const pasantes = getResponsablesLista();
  
  pasantes.forEach(pasante => {
    const horariosPasante = horariosPersonalizados[pasante];
    if (!horariosPasante) return;
    
    // Las sesiones están en horariosPersonalizados[pasante].sesiones
    const sesionesPasante = horariosPasante.sesiones || [];
    
    sesionesPasante.forEach(sesion => {
      // Solo incluir sesiones activas (no pausadas)
      if (sesion.nombre && !sesion.pausada) {
        // Las sesiones pueden tener "dias" (array) o "dia" (string)
        const diasSesion = sesion.dias || (sesion.dia ? [sesion.dia] : []);
        
        // Crear una entrada por cada día de la sesión
        diasSesion.forEach(dia => {
          sesiones.push({
            usuaria: sesion.nombre,
            dia: dia,
            horaInicio: sesion.horaInicio,
            horaFin: sesion.horaFin,
            responsable: sesion.responsable || pasante,
            habitacion: sesion.habitacion || ''
          });
        });
      }
    });
  });
  
  return sesiones;
}

/**
 * Agrupa las sesiones por nombre de usuaria
 */
function agruparSesionesPorUsuaria(sesiones) {
  const agrupadas = {};
  
  sesiones.forEach(sesion => {
    const usuaria = sesion.usuaria;
    if (!agrupadas[usuaria]) {
      agrupadas[usuaria] = [];
    }
    agrupadas[usuaria].push(sesion);
  });
  
  return agrupadas;
}

/**
 * Filtra el listado de usuarias según el texto de búsqueda
 */
function filtrarListadoUsuarias() {
  const filtro = document.getElementById('filtro-usuaria');
  const container = document.getElementById('listado-usuarias-container');
  
  if (!filtro || !container) return;
  
  const texto = filtro.value.toLowerCase().trim();
  const cards = container.querySelectorAll('.usuaria-card');
  
  cards.forEach(card => {
    const usuaria = card.getAttribute('data-usuaria') || '';
    if (texto === '' || usuaria.includes(texto)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

/**
 * Muestra el modal de horarios libres
 */
function mostrarHorariosLibres() {
  const modal = document.getElementById('modalHorariosLibres');
  if (modal) {
    modal.style.display = 'flex';
    renderHorariosLibres('todos');
  }
}

/**
 * Cierra el modal de horarios libres
 */
function closeModalHorariosLibres() {
  const modal = document.getElementById('modalHorariosLibres');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Filtra los horarios libres por día
 */
function filtrarHorariosLibres(dia) {
  // Actualizar botones activos
  document.querySelectorAll('.btn-filtro-dia').forEach(btn => {
    if (btn.getAttribute('data-dia') === dia) {
      btn.style.background = '#d4c5f9';
      btn.style.color = 'white';
      btn.classList.add('active');
    } else {
      btn.style.background = '#e5e7eb';
      btn.style.color = '#374151';
      btn.classList.remove('active');
    }
  });
  
  renderHorariosLibres(dia);
}

/**
 * Renderiza los horarios libres de todos los pasantes
 */
function renderHorariosLibres(filtrarDia) {
  const container = document.getElementById('horarios-libres-container');
  if (!container) return;
  
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const horaInicioDia = '09:30';
  const horaFinDia = '13:30';
  
  // Convertir horas a minutos para cálculos
  const minutosInicio = horaAMinutos(horaInicioDia);
  const minutosFin = horaAMinutos(horaFinDia);
  
  let html = '';
  
  // Para cada pasante
  RESPONSABLES_LISTA.forEach(pasante => {
    const colors = PASANTE_COLORS[pasante] || { bg: '#6b7280', light: '#f3f4f6' };
    const nombreCorto = getNombreCorto(pasante);
    
    let diasHTML = '';
    let tieneLibres = false;
    
    diasSemana.forEach(dia => {
      if (filtrarDia !== 'todos' && filtrarDia !== dia) return;
      
      // Obtener sesiones del pasante para este día
      const sesiones = getHorariosForDay(dia, new Date(), pasante, null);
      
      // Calcular huecos libres
      const libres = calcularHuecosLibres(sesiones, minutosInicio, minutosFin);
      
      if (libres.length > 0) {
        tieneLibres = true;
        diasHTML += `
          <div style="margin-bottom: 8px;">
            <span style="font-weight: 600; color: #374151; font-size: 13px;">${dia}:</span>
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
              ${libres.map(hueco => `
                <span style="background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                  ⏰ ${minutosAHora(hueco.inicio)} - ${minutosAHora(hueco.fin)}
                </span>
              `).join('')}
            </div>
          </div>
        `;
      }
    });
    
    if (!tieneLibres && filtrarDia === 'todos') {
      diasHTML = '<p style="color: #9ca3af; font-style: italic; font-size: 13px;">Sin horarios libres esta semana</p>';
    } else if (!tieneLibres) {
      diasHTML = `<p style="color: #9ca3af; font-style: italic; font-size: 13px;">Sin horarios libres el ${filtrarDia}</p>`;
    }
    
    html += `
      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="background: ${colors.bg}; padding: 10px 16px; display: flex; align-items: center; gap: 10px;">
          <span style="color: ${colors.textColor || 'white'}; font-weight: 600; font-size: 14px;">
            ${nombreCorto}
          </span>
        </div>
        <div style="padding: 12px 16px;">
          ${diasHTML}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

/**
 * Convierte hora "HH:MM" a minutos
 */
function horaAMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convierte minutos a hora "HH:MM"
 */
function minutosAHora(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Calcula los huecos libres entre sesiones
 */
function calcularHuecosLibres(sesiones, minutosInicio, minutosFin) {
  const libres = [];
  
  if (sesiones.length === 0) {
    // Todo el día está libre
    libres.push({ inicio: minutosInicio, fin: minutosFin });
    return libres;
  }
  
  // Ordenar sesiones por hora de inicio
  const sesionesOrdenadas = [...sesiones].sort((a, b) => {
    return horaAMinutos(a.horaInicio || '00:00') - horaAMinutos(b.horaInicio || '00:00');
  });
  
  let ultimoFin = minutosInicio;
  
  sesionesOrdenadas.forEach(sesion => {
    const inicio = horaAMinutos(sesion.horaInicio || '00:00');
    const fin = horaAMinutos(sesion.horaFin || '00:00');
    
    // Si hay hueco antes de esta sesión
    if (inicio > ultimoFin) {
      libres.push({ inicio: ultimoFin, fin: inicio });
    }
    
    // Actualizar último fin
    if (fin > ultimoFin) {
      ultimoFin = fin;
    }
  });
  
  // Hueco al final del día
  if (ultimoFin < minutosFin) {
    libres.push({ inicio: ultimoFin, fin: minutosFin });
  }
  
  return libres;
}

/**
 * Vuelve al menú principal
 */
function goBackToIndex() {
  window.location.href = 'index.html';
}

/**
 * Cierra la sesión del usuario
 */
function logout() {
  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
    sessionStorage.clear();
    window.location.href = 'index.html';
  }
}

/**
 * Inicializa cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', () => {
  initPage();
});
