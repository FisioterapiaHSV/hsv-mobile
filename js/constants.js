/**
 * ===================================================================
 * CONSTANTES GLOBALES - EXPEDIENTE CLÍNICO FISIOTERAPIA HSV
 * ===================================================================
 * 
 * Este archivo centraliza todas las constantes del sistema para
 * mantener coherencia visual y facilitar el mantenimiento.
 * 
 * Incluye:
 * - Paleta de colores
 * - Colores de botones y estados
 * - Constantes de UI (radios, sombras, etc.)
 * - Textos y mensajes comunes
 * 
 * IMPORTANTE: Modificar aquí para que los cambios se apliquen 
 * en todo el programa.
 * ===================================================================
 */

// ===================================================================
// PALETA DE COLORES PRINCIPAL
// ===================================================================
const COLORS = {
  // Colores de fondo y superficie
  bg: '#fbfaf9',
  surface: '#ffffff',
  
  // Textos
  text: '#27323a',
  muted: '#6b7280',
  
  // Bordes
  border: '#e9ecef',
  mutedBorder: '#f3f4f6',
  
  // Colores principales de la marca
  pink: '#f6d3dc',
  pinkHover: '#f9dde4',
  pinkLight: '#fff1f4',
  
  mint: '#dff6ef',
  mintHover: '#d0f0e6',
  
  lila: '#f3ecff',
  
  yellowLight: '#fffdf6',
  grayCard: '#f7f8fa',
  blueLight: '#eef7ff',
  blueSign: '#e6f0ff',
};

// ===================================================================
// COLORES SEMÁNTICOS (ESTADOS Y ACCIONES)
// ===================================================================
const SEMANTIC_COLORS = {
  // Estados de éxito/error/advertencia
  success: '#16a34a',
  successLight: '#dcfce7',
  
  error: '#ef4444',
  errorLight: '#fee2e2',
  
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  
  info: '#3b82f6',
  infoLight: '#dbeafe',
  
  // Colores de acento para diferentes propósitos
  accent: {
    green: '#16a34a',
    red: '#ef4444',
    blue: '#3b82f6',
    lilac: '#a855f7',
    yellow: '#facc15',
    orange: '#f59e0b',
    teal: '#06b6d4',
    violet: '#7c3aed',
    purple: '#9333ea',
  }
};

// ===================================================================
// COLORES DE BOTONES ESTANDARIZADOS
// ===================================================================
const BUTTON_COLORS = {
  // Botón primario (mint - acción principal)
  primary: {
    bg: COLORS.mint,
    hover: COLORS.mintHover,
    text: '#000000',
  },
  
  // Botón secundario (pink - navegación/volver)
  secondary: {
    bg: COLORS.pink,
    hover: COLORS.pinkHover,
    text: '#000000',
  },
  
  // Botón ghost (fondo blanco con borde)
  ghost: {
    bg: '#ffffff',
    hover: COLORS.pinkHover,
    border: COLORS.border,
    text: '#000000',
  },
  
  // Botón de cancelar
  cancel: {
    bg: '#f3f4f6',
    hover: '#e5e7eb',
    text: COLORS.muted,
  },
  
  // Botones de estado
  success: {
    bg: SEMANTIC_COLORS.successLight,
    hover: '#bbf7d0',
    text: SEMANTIC_COLORS.success,
  },
  
  error: {
    bg: SEMANTIC_COLORS.errorLight,
    hover: '#fecaca',
    text: SEMANTIC_COLORS.error,
  },
  
  warning: {
    bg: SEMANTIC_COLORS.warningLight,
    hover: '#fde68a',
    text: SEMANTIC_COLORS.warning,
  },
};

// ===================================================================
// CONSTANTES DE UI
// ===================================================================
const UI = {
  // Radios de borde
  radius: {
    sm: '8px',
    md: '12px',
    lg: '14px',
    xl: '16px',
    full: '999px',
  },
  
  // Sombras
  shadow: {
    sm: '0 4px 12px rgba(0,0,0,.06)',
    md: '0 8px 20px rgba(0,0,0,.12)',
    lg: '0 12px 35px rgba(0,0,0,.12)',
  },
  
  // Espaciados comunes
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },
  
  // Transiciones
  transition: {
    fast: '0.15s',
    normal: '0.25s',
    slow: '0.3s',
  },
};

// ===================================================================
// CONSTANTES DE ESCALAS Y EVALUACIONES
// ===================================================================
const SCALE_THRESHOLDS = {
  // SPPB (0-12)
  sppb: {
    poor: 6,        // 0-6: Pobre
    moderate: 9,    // 7-9: Moderado
    good: 12,       // 10-12: Bueno
  },
  
  // Tinetti (0-28)
  tinetti: {
    highRisk: 18,   // <19: Alto riesgo
    moderateRisk: 23, // 19-23: Moderado
    lowRisk: 28,    // 24-28: Bajo riesgo
  },
  
  // FRAIL (0-5)
  frail: {
    robust: 0,      // 0: Robusto
    prefrail: 2,    // 1-2: Pre-frágil
    frail: 5,       // 3-5: Frágil
  },
  
  // Downton (0-11)
  downton: {
    lowRisk: 2,     // 0-2: Bajo riesgo
    highRisk: 11,   // ≥3: Alto riesgo
  },
  
  // Katz (0-6)
  katz: {
    independent: 6,      // 6: Independiente
    moderate: 4,         // 2-4: Dependencia moderada
    severe: 1,           // 0-2: Dependencia severa
  },
  
  // Lawton (0-8)
  lawton: {
    independent: 8,      // 8: Independiente
    moderate: 4,         // 4-7: Dependencia moderada
    severe: 3,           // 0-3: Dependencia severa
  },
};

// ===================================================================
// COLORES PARA VISUALIZACIÓN DE ESCALAS
// ===================================================================
const SCALE_COLORS = {
  excellent: SEMANTIC_COLORS.accent.green,  // #16a34a
  good: SEMANTIC_COLORS.accent.blue,        // #3b82f6
  moderate: SEMANTIC_COLORS.accent.orange,  // #f59e0b
  poor: SEMANTIC_COLORS.accent.red,         // #ef4444
};

// ===================================================================
// COLORES PARA CONFETTI (CELEBRACIONES)
// ===================================================================
const CONFETTI_COLORS = [
  SEMANTIC_COLORS.accent.red,     // #ef4444
  SEMANTIC_COLORS.accent.orange,  // #f59e0b
  SEMANTIC_COLORS.accent.green,   // #10b981
  SEMANTIC_COLORS.accent.teal,    // #06b6d4
  SEMANTIC_COLORS.accent.violet,  // #7c3aed
  '#ff6b6b',
  '#ffd166',
];

// ===================================================================
// MENSAJES Y TEXTOS COMUNES
// ===================================================================
const MESSAGES = {
  // Mensajes de éxito
  success: {
    saved: 'Guardado correctamente',
    signed: 'Firmado correctamente',
    updated: 'Actualizado correctamente',
    deleted: 'Eliminado correctamente',
  },
  
  // Mensajes de error
  error: {
    generic: 'Ha ocurrido un error',
    required: 'Este campo es obligatorio',
    invalidPin: 'PIN incorrecto',
    notFound: 'No se encontró el registro',
  },
  
  // Mensajes de confirmación
  confirm: {
    delete: '¿Estás seguro de eliminar este registro?',
    cancel: '¿Deseas cancelar? Los cambios no guardados se perderán.',
    sign: '¿Deseas firmar este documento? Una vez firmado no podrá editarse.',
  },
  
  // Estados
  status: {
    draft: 'Borrador',
    signed: 'Firmada',
    pending: 'Pendiente',
  },
};

// ===================================================================
// CONFIGURACIÓN DE TEMPORIZADORES
// ===================================================================
const TIMERS = {
  // Tiempo para completar valoración (en minutos)
  valoracionMinutes: 20,
  
  // Tiempo para completar nota de seguimiento (en minutos)
  notaMinutes: 7,
  
  // Intervalo de actualización de countdown (en ms)
  countdownInterval: 1000,
  
  // Cooldown entre notas (deshabilitado por ahora)
  noteCooldownMinutes: 0,
};

// ===================================================================
// OPCIONES DE PERSONAL
// ===================================================================
const PERSONAL = {
  // Responsables (con PIN para iniciar sesión y firmar)
  // NOTA: Todos los PINs deben ser de 6 dígitos numéricos
  // LFT: Licenciada en Fisioterapia - Solo Alexa
  responsables: [
    { nombre: 'Tavata Alexa Basurto Ramírez', prefix: 'LFT', pin: '123456', genero: 'F', rol: 'LFT' },
    { nombre: 'INVITADO', prefix: '', pin: '000000', genero: 'N', rol: 'INVITADO', readOnly: true },
  ],
  
  // Practicantes (con PIN solo para login, NO pueden firmar)
  // PSS: Pasante (Jorge, Gloria, Joanna, Ale)
  // EF: Estudiante Fisioterapia (Paola, Daniela, Claudia, Liz)
  practicantes: [
    { nombre: 'Jorge Eduardo Rodríguez Romero', prefix: 'PSS', pin: '567890', genero: 'M', rol: 'PSS' },
    { nombre: 'Gloria Iraís Espinosa Peralta', prefix: 'PSS', pin: '234567', genero: 'F', rol: 'PSS' },
    { nombre: 'Joanna Stefania Martínez García', prefix: 'PSS', pin: '345678', genero: 'F', rol: 'PSS' },
    { nombre: 'Alejandra Reyna Lorenzo Rojo', prefix: 'PSS', pin: '456789', genero: 'F', rol: 'PSS' },
    { nombre: 'Paola Saraí Olivares Pérez', prefix: 'EF', pin: '111111', genero: 'F', rol: 'EF' },
    { nombre: 'Daniela Fernanda García Jiménez', prefix: 'EF', pin: '333333', genero: 'F', rol: 'EF' },
    { nombre: 'Claudia Reyna Sanchez', prefix: 'EF', pin: '444444', genero: 'F', rol: 'EF' },
    { nombre: 'Lizbeth Itzel Montes Ocampo', prefix: 'EF', pin: '222222', genero: 'F', rol: 'EF' },
  ],
  
  // Apoyo (sin PIN, solo para asignación en reportes)
  apoyo: [
    { nombre: 'Paola Saraí Olivares Pérez', prefix: 'EF' },
    { nombre: 'Lizbeth Itzel Montes Ocampo', prefix: 'EF' },
    { nombre: 'Daniela Fernanda García Jiménez', prefix: 'EF' },
    { nombre: 'Claudia Reyna Sanchez', prefix: 'EF' },
    { nombre: 'Ninguno', prefix: '' },
  ],
};

// ===================================================================
// FUNCIONES HELPER PARA POBLAR SELECTORES
// ===================================================================

/**
 * Puebla un selector con las opciones de responsables desde PERSONAL
 * @param {string} selectId - ID del elemento select
 * @param {boolean} includeEmpty - Si incluir opción vacía al inicio
 */
function populateResponsableSelect(selectId, includeEmpty = true) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  select.innerHTML = '';
  if (includeEmpty) {
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '-- Selecciona responsable --';
    select.appendChild(emptyOption);
  }
  
  // Agregar LFT (de responsables, excluyendo INVITADO)
  PERSONAL.responsables.forEach(person => {
    if (person.nombre !== 'INVITADO') {
      const option = document.createElement('option');
      option.value = person.nombre;
      option.textContent = person.nombre;
      option.dataset.prefix = person.prefix;
      option.dataset.pin = person.pin;
      select.appendChild(option);
    }
  });
  
  // Agregar PSS (de practicantes, solo los que tienen rol PSS)
  if (PERSONAL.practicantes) {
    PERSONAL.practicantes.forEach(person => {
      if (person.rol === 'PSS') {
        const option = document.createElement('option');
        option.value = person.nombre;
        option.textContent = person.nombre;
        option.dataset.prefix = person.prefix;
        option.dataset.pin = person.pin;
        select.appendChild(option);
      }
    });
  }
}

/**
 * Puebla un selector con las opciones de apoyo desde PERSONAL
 * @param {string} selectId - ID del elemento select
 * @param {boolean} includeEmpty - Si incluir opción vacía al inicio
 */
function populateApoyoSelect(selectId, includeEmpty = true) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  select.innerHTML = '';
  if (includeEmpty) {
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '-- Selecciona apoyo --';
    select.appendChild(emptyOption);
  }
  
  PERSONAL.apoyo.forEach(person => {
    const option = document.createElement('option');
    option.value = person.nombre;
    option.textContent = person.nombre;
    option.dataset.prefix = person.prefix;
    select.appendChild(option);
  });
}

/**
 * Inicializa todos los selectores de personal en la página actual
 * Debe llamarse cuando se carga una vista con selectores de personal
 */
function initPersonalSelectors() {
  // Buscar todos los selectores de responsable
  document.querySelectorAll('select[id*="responsable"], select[id*="plan_responsable"], select[id*="note_responsable"], select[id*="val_responsable"]').forEach(select => {
    if (select.id && !select.dataset.populated) {
      populateResponsableSelect(select.id);
      select.dataset.populated = 'true';
    }
  });
  
  // Buscar todos los selectores de apoyo
  document.querySelectorAll('select[id*="apoyo"], select[id*="plan_apoyo"], select[id*="note_apoyo"], select[id*="val_apoyo"]').forEach(select => {
    if (select.id && !select.dataset.populated) {
      populateApoyoSelect(select.id);
      select.dataset.populated = 'true';
    }
  });
}

/**
 * Obtiene el PIN de un responsable por nombre
 * @param {string} nombre - Nombre del responsable
 * @returns {string|null} PIN o null si no se encuentra
 */
function getResponsablePin(nombre) {
  const person = PERSONAL.responsables.find(p => p.nombre === nombre);
  return person ? person.pin : null;
}

/**
 * Obtiene el prefijo de un responsable por nombre
 * @param {string} nombre - Nombre del responsable
 * @returns {string} Prefijo o cadena vacía
 */
function getResponsablePrefix(nombre) {
  const person = PERSONAL.responsables.find(p => p.nombre === nombre);
  return person ? person.prefix : '';
}

/**
 * Obtiene el prefijo de apoyo por nombre
 * @param {string} nombre - Nombre del apoyo
 * @returns {string} Prefijo o cadena vacía
 */
function getApoyoPrefix(nombre) {
  const person = PERSONAL.apoyo.find(p => p.nombre === nombre);
  return person ? person.prefix : '';
}

/**
 * Verifica si el usuario actual tiene permisos de solo lectura
 * @returns {boolean} true si es usuario de solo lectura
 */
function isReadOnlyUser() {
  try {
    const userData = localStorage.getItem('hsv_user');
    if (!userData) return false;
    const user = JSON.parse(userData);
    const person = PERSONAL.responsables.find(p => p.nombre === user.username);
    return person && person.readOnly === true;
  } catch(e) {
    return false;
  }
}

/**
 * Verifica si un nombre de usuario corresponde a un usuario de solo lectura
 * @param {string} username - Nombre de usuario
 * @returns {boolean} true si es usuario de solo lectura
 */
function isUsernameReadOnly(username) {
  const person = PERSONAL.responsables.find(p => p.nombre === username);
  return person && person.readOnly === true;
}

// ===================================================================
// EXPORTAR TODAS LAS CONSTANTES Y FUNCIONES
// ===================================================================
// Para que estén disponibles globalmente en todos los scripts
if (typeof window !== 'undefined') {
  window.APP_COLORS = COLORS;
  window.APP_SEMANTIC_COLORS = SEMANTIC_COLORS;
  window.APP_BUTTON_COLORS = BUTTON_COLORS;
  window.APP_UI = UI;
  window.APP_SCALE_THRESHOLDS = SCALE_THRESHOLDS;
  window.APP_SCALE_COLORS = SCALE_COLORS;
  window.APP_CONFETTI_COLORS = CONFETTI_COLORS;
  window.APP_MESSAGES = MESSAGES;
  window.APP_TIMERS = TIMERS;
  window.APP_PERSONAL = PERSONAL;
  window.isReadOnlyUser = isReadOnlyUser;
  window.isUsernameReadOnly = isUsernameReadOnly;
  
  // Mapeo de iconos personalizados por usuario
  window.USER_ICONS = {
    'Tavata Alexa Basurto Ramírez': 'icons/AlexaI.png',
    'Gloria Iraís Espinosa Peralta': 'icons/GloriaI.png',
    'Joanna Stefania Martínez García': 'icons/JoannaI.png',
    'Alejandra Reyna Lorenzo Rojo': 'icons/AleI.png',
    'Jorge Eduardo Rodríguez Romero': 'icons/JorgeI.png',
    'Paola Saraí Olivares Pérez': 'icons/PaoI.png',
    'Lizbeth Itzel Montes Ocampo': 'icons/LizI.png',
    'Daniela Fernanda García Jiménez': 'icons/DanielaI.png',
    'Claudia Reyna Sanchez': 'icons/ClaudiaI.png'
  };
  
  // Exportar funciones helper
  window.populateResponsableSelect = populateResponsableSelect;
  window.populateApoyoSelect = populateApoyoSelect;
  window.initPersonalSelectors = initPersonalSelectors;
  window.getResponsablePin = getResponsablePin;
  window.getResponsablePrefix = getResponsablePrefix;
  window.getApoyoPrefix = getApoyoPrefix;
  
  // Auto-inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPersonalSelectors);
  } else {
    initPersonalSelectors();
  }
}
