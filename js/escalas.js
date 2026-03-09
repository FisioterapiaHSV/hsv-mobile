(function(){
  // Escalas manager - independent module for standardized scales
  
  // Escalas definitions with items and scoring
  const ESCALAS_DEFS = {
    SPPB: {
      name: 'SPPB – Short Physical Performance Battery',
      type: 'structured', // Tipo especial con pruebas estructuradas
      tests: [
        {
          id: 'equilibrio',
          title: 'PRUEBA 1: EQUILIBRIO',
          instruction: 'Solicite al paciente mantener cada posición durante 10 segundos sin apoyo.',
          positions: [
            {
              id: 'pies_juntos',
              label: 'Pies juntos',
              options: [
                { value: 'no', label: 'No logra mantener la posición 10 segundos', points: 0 },
                { value: 'si', label: 'Mantiene la posición 10 segundos', points: 1 }
              ]
            },
            {
              id: 'semitandem',
              label: 'Posición semitándem',
              options: [
                { value: 'no', label: 'No logra mantener la posición 10 segundos', points: 0 },
                { value: 'si', label: 'Mantiene la posición 10 segundos', points: 1 }
              ]
            },
            {
              id: 'tandem',
              label: 'Posición tándem',
              options: [
                { value: 'no', label: 'No logra mantener la posición 10 segundos', points: 0 },
                { value: 'parcial', label: 'Mantiene la posición entre 3 y 9.99 segundos', points: 1 },
                { value: 'si', label: 'Mantiene la posición 10 segundos', points: 1 }
              ]
            }
          ],
          scoreCalculation: (responses) => {
            const piesJuntos = responses['pies_juntos'];
            const semitandem = responses['semitandem'];
            const tandem = responses['tandem'];
            
            if (!piesJuntos) return 0;
            if (piesJuntos === 'no') return 0;
            if (semitandem === 'no') return 1;
            if (tandem === 'no') return 2;
            if (tandem === 'parcial') return 3;
            if (tandem === 'si') return 4;
            return 0;
          }
        },
        {
          id: 'marcha',
          title: 'PRUEBA 2: VELOCIDAD DE LA MARCHA',
          instruction: 'Registrar el mejor tiempo de dos intentos caminando 4 metros a paso habitual.',
          fields: [
            { id: 'tiempo_intento1', label: 'Tiempo del intento 1 (segundos)', type: 'number', min: 0 },
            { id: 'tiempo_intento2', label: 'Tiempo del intento 2 (segundos)', type: 'number', min: 0 }
          ],
          option: {
            id: 'no_puede',
            label: 'No puede realizar la prueba',
            type: 'checkbox'
          },
          scoreCalculation: (responses) => {
            if (responses['no_puede']) return 0;
            const t1 = parseFloat(responses['tiempo_intento1']) || Infinity;
            const t2 = parseFloat(responses['tiempo_intento2']) || Infinity;
            const mejor = Math.min(t1, t2);
            
            if (mejor === Infinity) return 0;
            if (mejor >= 8.70) return 1;
            if (mejor >= 6.21) return 2;
            if (mejor >= 4.82) return 3;
            return 4;
          }
        },
        {
          id: 'silla',
          title: 'PRUEBA 3: LEVANTARSE DE LA SILLA',
          instruction: 'Paciente sentado en silla sin apoyabrazos, brazos cruzados sobre el pecho.',
          step1: {
            label: 'Paso 1 – Evaluación inicial: ¿Puede levantarse sin usar los brazos?',
            options: [
              { value: 'no', label: 'No puede levantarse de la silla sin usar los brazos', points: 0 },
              { value: 'si', label: 'Puede levantarse sin usar los brazos' }
            ]
          },
          step2: {
            label: 'Paso 2 – Tiempo total para 5 levantamientos consecutivos (segundos)',
            field: { id: 'tiempo_silla', type: 'number', min: 0 },
            conditional: true // Se muestra solo si paso1 es 'si'
          },
          scoreCalculation: (responses) => {
            if (responses['paso1'] === 'no') return 0;
            const tiempo = parseFloat(responses['tiempo_silla']) || Infinity;
            if (tiempo === Infinity) return 0;
            if (tiempo >= 16.70) return 1;
            if (tiempo >= 13.70) return 2;
            if (tiempo >= 11.20) return 3;
            return 4;
          }
        }
      ],
      sections: {},
      totalMax: 12,
      interpretation: (total) => {
        if (total >= 10) return 'Función normal';
        if (total >= 7) return 'Discapacidad leve';
        return 'Discapacidad grave';
      }
    },
    Tinetti: {
      name: 'Tinetti – Equilibrio y Marcha',
      items: [
        // EQUILIBRIO (9 ítems)
        { id: 'tinetti_eq1', label: '1. Equilibrio sentado', section: 'Equilibrio', options: [
          { label: 'Inestable', value: 0 },
          { label: 'Estable', value: 1 }
        ]},
        { id: 'tinetti_eq2', label: '2. Se levanta de la silla', section: 'Equilibrio', options: [
          { label: 'Incapaz', value: 0 },
          { label: 'Usa brazos', value: 1 },
          { label: 'Sin usar brazos', value: 2 }
        ]},
        { id: 'tinetti_eq3', label: '3. Intentos para levantarse', section: 'Equilibrio', options: [
          { label: 'Incapaz', value: 0 },
          { label: 'Más de 1 intento', value: 1 },
          { label: '1 intento', value: 2 }
        ]},
        { id: 'tinetti_eq4', label: '4. Equilibrio inmediato al ponerse de pie (5 seg)', section: 'Equilibrio', options: [
          { label: 'Se cae', value: 0 },
          { label: 'Inestable', value: 1 },
          { label: 'Estable', value: 2 }
        ]},
        { id: 'tinetti_eq5', label: '5. Equilibrio de pie', section: 'Equilibrio', options: [
          { label: 'Se apoya', value: 0 },
          { label: 'Inestable', value: 1 },
          { label: 'Estable', value: 2 }
        ]},
        { id: 'tinetti_eq6', label: '6. Respuesta al empuje esternal', section: 'Equilibrio', options: [
          { label: 'Se cae', value: 0 },
          { label: 'Da pasos', value: 1 },
          { label: 'Estable', value: 2 }
        ]},
        { id: 'tinetti_eq7', label: '7. Ojos cerrados', section: 'Equilibrio', options: [
          { label: 'Inestable', value: 0 },
          { label: 'Estable', value: 1 }
        ]},
        { id: 'tinetti_eq8', label: '8. Giro de 360°', section: 'Equilibrio', options: [
          { label: 'Incapaz', value: 0 },
          { label: 'Inseguro', value: 1 },
          { label: 'Seguro y continuo', value: 2 }
        ]},
        { id: 'tinetti_eq9', label: '9. Sentarse', section: 'Equilibrio', options: [
          { label: 'Se deja caer', value: 0 },
          { label: 'Usa brazos / inseguro', value: 1 },
          { label: 'Seguro', value: 2 }
        ]},
        
        // MARCHA (10 ítems - 12 puntos máximo)
        { id: 'tinetti_m1', label: '1. Inicio de la marcha', section: 'Marcha', options: [
          { label: 'Vacila, duda o necesita varios intentos', value: 0 },
          { label: 'Inicia la marcha inmediatamente, sin vacilación', value: 1 }
        ]},
        { id: 'tinetti_m2', label: '2. Longitud del paso (pie derecho)', section: 'Marcha', options: [
          { label: 'No lo sobrepasa', value: 0 },
          { label: 'El pie derecho sobrepasa al izquierdo', value: 1 }
        ]},
        { id: 'tinetti_m3', label: '3. Longitud del paso (pie izquierdo)', section: 'Marcha', options: [
          { label: 'No lo sobrepasa', value: 0 },
          { label: 'El pie izquierdo sobrepasa al derecho', value: 1 }
        ]},
        { id: 'tinetti_m4', label: '4. Altura del paso (pie derecho)', section: 'Marcha', options: [
          { label: 'Arrastra el pie', value: 0 },
          { label: 'El pie derecho se despega completamente del suelo', value: 1 }
        ]},
        { id: 'tinetti_m5', label: '5. Altura del paso (pie izquierdo)', section: 'Marcha', options: [
          { label: 'Arrastra el pie', value: 0 },
          { label: 'El pie izquierdo se despega completamente del suelo', value: 1 }
        ]},
        { id: 'tinetti_m6', label: '6. Simetría del paso', section: 'Marcha', options: [
          { label: 'Asimétrica', value: 0 },
          { label: 'Longitud del paso derecho e izquierdo similar', value: 1 }
        ]},
        { id: 'tinetti_m7', label: '7. Continuidad del paso', section: 'Marcha', options: [
          { label: 'Se detiene o hay interrupciones', value: 0 },
          { label: 'Marcha continua, sin interrupciones', value: 1 }
        ]},
        { id: 'tinetti_m8', label: '8. Trayectoria', section: 'Marcha', options: [
          { label: 'Desviación marcada o inestabilidad', value: 0 },
          { label: 'Leve desviación', value: 1 },
          { label: 'Camina en línea recta sin desviaciones', value: 2 }
        ]},
        { id: 'tinetti_m9', label: '9. Tronco', section: 'Marcha', options: [
          { label: 'Marcada inestabilidad', value: 0 },
          { label: 'Ligera flexión o balanceo', value: 1 },
          { label: 'Erguido, sin balanceo ni flexión', value: 2 }
        ]},
        { id: 'tinetti_m10', label: '10. Base de sustentación', section: 'Marcha', options: [
          { label: 'Base amplia', value: 0 },
          { label: 'Talones casi juntos al caminar', value: 1 }
        ]}
      ],
      sections: { 'Equilibrio': 0, 'Marcha': 0 },
      totalMax: 28,
      interpretation: (total) => {
        if (total >= 24) return 'Bajo riesgo de caída';
        if (total >= 19) return 'Riesgo moderado de caída';
        return 'Alto riesgo de caída';
      }
    },
    Katz: {
      name: 'Índice de Katz – ABVD (Actividades Básicas de la Vida Diaria)',
      items: [
        { id: 'katz_banio', label: '1. Baño', section: 'ABVD', options: [
          { label: 'Dependiente', value: 0 },
          { label: 'Independiente', value: 1 }
        ]},
        { id: 'katz_vestir', label: '2. Vestido', section: 'ABVD', options: [
          { label: 'Necesita ayuda', value: 0 },
          { label: 'Se viste solo', value: 1 }
        ]},
        { id: 'katz_wc', label: '3. Uso del WC', section: 'ABVD', options: [
          { label: 'Necesita ayuda', value: 0 },
          { label: 'Solo (incluye limpieza)', value: 1 }
        ]},
        { id: 'katz_transferencias', label: '4. Transferencias', section: 'ABVD', options: [
          { label: 'Requiere ayuda', value: 0 },
          { label: 'Se acuesta/levanta solo', value: 1 }
        ]},
        { id: 'katz_continencia', label: '5. Continencia', section: 'ABVD', options: [
          { label: 'Incontinencia parcial/total', value: 0 },
          { label: 'Control total', value: 1 }
        ]},
        { id: 'katz_alimentacion', label: '6. Alimentación', section: 'ABVD', options: [
          { label: 'Necesita ayuda', value: 0 },
          { label: 'Come solo', value: 1 }
        ]}
      ],
      sections: { 'ABVD': 0 },
      totalMax: 6,
      interpretation: (total) => {
        if (total === 6) return 'Independencia total';
        if (total === 5) return 'Dependencia leve';
        if (total >= 3) return 'Dependencia moderada';
        if (total >= 1) return 'Dependencia severa';
        return 'Dependencia total';
      }
    },
    Lawton: {
      name: 'Índice de Lawton y Brody – AIVD (Actividades Instrumentales de la Vida Diaria)',
      items: [
        { id: 'lawton_telefono', label: '1. Uso del teléfono', section: 'AIVD', options: [
          { label: 'No usa el teléfono', value: 0 },
          { label: 'Contesta el teléfono, pero no marca', value: 0 },
          { label: 'Usa el teléfono por iniciativa propia, marca números', value: 1 }
        ]},
        { id: 'lawton_compras', label: '2. Compras', section: 'AIVD', options: [
          { label: 'No realiza compras', value: 0 },
          { label: 'Realiza pequeñas compras con ayuda', value: 0 },
          { label: 'Realiza todas las compras necesarias de forma independiente', value: 1 }
        ]},
        { id: 'lawton_comida', label: '3. Preparación de alimentos', section: 'AIVD', options: [
          { label: 'No prepara comidas', value: 0 },
          { label: 'Prepara solo comidas sencillas', value: 0 },
          { label: 'Prepara comidas si le proporcionan los ingredientes', value: 0 },
          { label: 'Planea, prepara y sirve comidas completas', value: 1 }
        ]},
        { id: 'lawton_casa', label: '4. Cuidado de la casa', section: 'AIVD', options: [
          { label: 'Necesita ayuda para la mayoría de las tareas', value: 0 },
          { label: 'Realiza tareas ligeras', value: 0 },
          { label: 'Mantiene la casa sola o con ayuda ocasional', value: 1 }
        ]},
        { id: 'lawton_lavado', label: '5. Lavado de ropa', section: 'AIVD', options: [
          { label: 'No lava ropa', value: 0 },
          { label: 'Lava solo prendas pequeñas', value: 0 },
          { label: 'Lava toda su ropa', value: 1 }
        ]},
        { id: 'lawton_transporte', label: '6. Uso de transporte', section: 'AIVD', options: [
          { label: 'No usa transporte', value: 0 },
          { label: 'Usa transporte con ayuda o acompañado', value: 0 },
          { label: 'Viaja solo en transporte público o conduce', value: 1 }
        ]},
        { id: 'lawton_medicinas', label: '7. Manejo de medicación', section: 'AIVD', options: [
          { label: 'No es capaz de manejar su medicación', value: 0 },
          { label: 'Toma la medicación si se la preparan', value: 0 },
          { label: 'Toma correctamente su medicación en dosis y horarios', value: 1 }
        ]},
        { id: 'lawton_finanzas', label: '8. Manejo de finanzas', section: 'AIVD', options: [
          { label: 'Incapaz de manejar finanzas', value: 0 },
          { label: 'Realiza transacciones simples', value: 0 },
          { label: 'Administra su dinero y paga cuentas', value: 1 }
        ]}
      ],
      sections: { 'AIVD': 0 },
      totalMax: 8,
      interpretation: (total) => {
        if (total === 8) return 'Independiente';
        if (total >= 6) return 'Dependencia leve';
        if (total >= 4) return 'Dependencia moderada';
        return 'Dependencia severa';
      }
    },
    FRAIL: {
      name: 'Escala FRAIL – Tamizaje de Fragilidad en la Adulta Mayor',
      items: [
        { id: 'frail_fatiga', label: 'F – Fatiga: ¿Se siente cansada la mayor parte del tiempo?', section: 'Fragilidad', options: [
          { label: 'No', value: 0 },
          { label: 'Sí', value: 1 }
        ]},
        { id: 'frail_resistencia', label: 'R – Resistencia: ¿Tiene dificultad para subir un tramo de escaleras?', section: 'Fragilidad', options: [
          { label: 'No', value: 0 },
          { label: 'Sí', value: 1 }
        ]},
        { id: 'frail_ambulacion', label: 'A – Ambulación: ¿Tiene dificultad para caminar una cuadra?', section: 'Fragilidad', options: [
          { label: 'No', value: 0 },
          { label: 'Sí', value: 1 }
        ]},
        { id: 'frail_enfermedades', label: 'I – Enfermedades: ¿Tiene 5 o más enfermedades crónicas?', section: 'Fragilidad', options: [
          { label: 'No', value: 0 },
          { label: 'Sí', value: 1 }
        ]},
        { id: 'frail_peso', label: 'L – Pérdida de peso: ¿Ha perdido ≥5% de peso en el último año sin proponérselo?', section: 'Fragilidad', options: [
          { label: 'No', value: 0 },
          { label: 'Sí', value: 1 }
        ]}
      ],
      sections: { 'Fragilidad': 0 },
      totalMax: 5,
      interpretation: (total) => {
        if (total === 0) return 'Robusta';
        if (total <= 2) return 'Pre-frágil';
        return 'Frágil';
      }
    },
    Downton: {
      name: 'Escala de Downton – Valoración de Riesgo de Caídas',
      items: [
        // Factor 1: Caídas previas
        { id: 'downton_caidas_previas', label: '1. Caídas previas en el último año', section: 'Riesgo de Caídas', options: [
          { label: 'No', value: 0 },
          { label: 'Sí', value: 1 }
        ]},
        
        // Factor 2: Medicación (5 grupos, cada uno suma 1)
        { id: 'downton_med_sedantes', label: '2a. Medicación - Sedantes/hipnóticos', section: 'Medicación', options: [
          { label: 'Ausente', value: 0 },
          { label: 'Presente', value: 1 }
        ]},
        { id: 'downton_med_diureticos', label: '2b. Medicación - Diuréticos', section: 'Medicación', options: [
          { label: 'Ausente', value: 0 },
          { label: 'Presente', value: 1 }
        ]},
        { id: 'downton_med_antihipertensivos', label: '2c. Medicación - Antihipertensivos', section: 'Medicación', options: [
          { label: 'Ausente', value: 0 },
          { label: 'Presente', value: 1 }
        ]},
        { id: 'downton_med_antiparkinsonianos', label: '2d. Medicación - Antiparkinsonianos', section: 'Medicación', options: [
          { label: 'Ausente', value: 0 },
          { label: 'Presente', value: 1 }
        ]},
        { id: 'downton_med_antidepresivos', label: '2e. Medicación - Antidepresivos', section: 'Medicación', options: [
          { label: 'Ausente', value: 0 },
          { label: 'Presente', value: 1 }
        ]},
        
        // Factor 3: Déficits sensoriales (3 tipos, cada uno suma 1)
        { id: 'downton_deficit_visual', label: '3a. Déficit sensorial - Visual', section: 'Déficits Sensoriales', options: [
          { label: 'Ausente', value: 0 },
          { label: 'Presente', value: 1 }
        ]},
        { id: 'downton_deficit_auditivo', label: '3b. Déficit sensorial - Auditivo', section: 'Déficits Sensoriales', options: [
          { label: 'Ausente', value: 0 },
          { label: 'Presente', value: 1 }
        ]},
        { id: 'downton_deficit_extremidades', label: '3c. Déficit sensorial - Extremidades', section: 'Déficits Sensoriales', options: [
          { label: 'Ausente', value: 0 },
          { label: 'Presente', value: 1 }
        ]},
        
        // Factor 4: Estado mental
        { id: 'downton_confusion', label: '4. Estado mental - Confusión/desorientación', section: 'Riesgo de Caídas', options: [
          { label: 'Ausente', value: 0 },
          { label: 'Presente', value: 1 }
        ]},
        
        // Factor 5: Marcha
        { id: 'downton_marcha', label: '5. Marcha insegura o necesita ayuda', section: 'Riesgo de Caídas', options: [
          { label: 'Segura', value: 0 },
          { label: 'Insegura o necesita ayuda', value: 1 }
        ]}
      ],
      sections: { 'Riesgo de Caídas': 0, 'Medicación': 0, 'Déficits Sensoriales': 0 },
      totalMax: 11,
      interpretation: (total) => {
        if (total >= 3) return 'Alto riesgo de caídas';
        return 'Bajo riesgo de caídas';
      }
    }
  };

  // Current scale being edited
  let currentScale = null;
  let currentScaleData = {};
  let allScalesData = {};

  // Initialize scales data from currentVal (if available)
  function loadScalesData() {
    if (window._valoracion && window._valoracion.currentVal) {
      // Buscar en escalasEstandarizadas (nombre correcto) o escalas (por compatibilidad)
      const savedData = window._valoracion.currentVal.escalasEstandarizadas || window._valoracion.currentVal.escalas || {};
      allScalesData = JSON.parse(JSON.stringify(savedData));
      console.log('✓ Escalas cargadas:', allScalesData);
    } else {
      allScalesData = {};
    }
  }

  // Render the scales list in the main form
  function renderScalesList() {
    const container = document.getElementById('escalas_list');
    if (!container) return;

    loadScalesData();

    let html = '';
    Object.keys(ESCALAS_DEFS).forEach(key => {
      const escDef = ESCALAS_DEFS[key];
      const scaleData = allScalesData[key] || { completed: false, responses: {} };
      const status = scaleData.completed ? '✓ Completada' : '⚪ No completada';
      const statusColor = scaleData.completed ? '#2e7d32' : '#999999';
      let scoreHtml = '';

      if (scaleData.completed && scaleData.total !== null && scaleData.total !== undefined) {
        scoreHtml = `<div style="margin-top:4px;color:${statusColor};font-size:0.85rem"><strong>Total:</strong> ${scaleData.total}/${escDef.totalMax}</div>`;
      }

      html += `
        <div style="border:1px solid #c3e7df;border-radius:8px;padding:12px;background:white;cursor:pointer;transition:all 0.2s" onclick="window.HSV_Escalas.openScale('${key}')">
          <div style="font-weight:600;color:var(--text-dark);margin-bottom:4px">${escDef.name}</div>
          <div style="color:${statusColor};font-size:0.9rem;font-weight:500">${status}</div>
          ${scoreHtml}
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // Open a specific scale for editing
  function openScale(scaleKey) {
    if (!ESCALAS_DEFS[scaleKey]) return;

    currentScale = scaleKey;
    const escDef = ESCALAS_DEFS[scaleKey];
    currentScaleData = allScalesData[scaleKey] || { completed: false, responses: {} };

    // Update header
    document.getElementById('scale_title').textContent = escDef.name;

    // Render scale form
    renderScaleForm();

    // Show the scale view
    window.showView('view_complete_scale');
    
    // Scroll to top of the scale view
    setTimeout(() => {
      window.scrollTo(0, 0);
      const container = document.getElementById('scale_content_container');
      if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  // Render the scale form with all items
  function renderScaleForm() {
    if (!currentScale || !ESCALAS_DEFS[currentScale]) return;

    const escDef = ESCALAS_DEFS[currentScale];
    const container = document.getElementById('scale_content_container');

    // Manejo especial para SPPB (y futuras escalas estructuradas)
    if (escDef.type === 'structured' && escDef.tests) {
      renderStructuredScale();
      return;
    }

    // Renderizado estándar (para escalas simples)
    let html = `<div style="margin-bottom:16px"><p style="color:var(--text-dark);margin:0">${escDef.name}</p></div>`;

    // Group items by section
    const groupedBySection = {};
    escDef.items.forEach(item => {
      if (!groupedBySection[item.section]) {
        groupedBySection[item.section] = [];
      }
      groupedBySection[item.section].push(item);
    });

    // Render each section
    Object.keys(groupedBySection).forEach(section => {
      html += `<div style="margin-bottom:16px;padding:12px;background:#f9f9f9;border-radius:8px;border-left:4px solid #c3e7df">`;
      html += `<h4 style="margin:0 0 12px;color:var(--text-dark)">${section}</h4>`;

      groupedBySection[section].forEach(item => {
        const currentValue = currentScaleData.responses[item.id];
        html += `<div style="margin-bottom:14px;padding:10px;background:white;border-radius:6px;border:1px solid #e5e7eb">`;
        html += `<label style="display:block;margin-bottom:8px;font-weight:600;color:var(--text-dark)">${item.label}</label>`;
        
        // Crear opciones basadas en item.options
        if (item.options && Array.isArray(item.options)) {
          item.options.forEach(option => {
            const isChecked = currentValue === option.value ? 'checked' : '';
            html += `<label style="display:flex;align-items:center;margin-bottom:8px;cursor:pointer;user-select:none;padding:6px;background:#f5f5f5;border-radius:4px;transition:all 0.2s" onclick="this.style.background='#e3f2fd'">`;
            html += `<div id="vis_rad_${item.id}_${option.value}" style="display:flex;align-items:center;justify-content:center;width:18px;height:18px;border:2px solid #66bb6a;border-radius:50%;background:white;flex-shrink:0;margin-right:8px"><div style="width:9px;height:9px;border-radius:50%;background:${isChecked ? '#66bb6a' : 'white'}"></div></div>`;
            html += `<input type="radio" id="rad_${item.id}_${option.value}" name="item_${item.id}" value="${option.value}" ${isChecked} style="display:none !important" />`;
            html += `<span style="color:var(--text-dark);font-weight:500">${option.label}</span>`;
            html += `</label>`;
          });
        }
        
        html += `</div>`;
      });

      html += `</div>`;
    });

    // Summary section
    html += `<div style="margin-top:20px;padding:12px;background:#e8f5e9;border-radius:8px;border:1px solid #c8e6c9">`;
    html += `<h4 style="margin:0 0 8px;color:#2e7d32">Resumen</h4>`;
    html += `<div id="scale_summary"></div>`;
    html += `</div>`;

    // Completion button
    html += `<div style="margin-top:20px;display:flex;gap:8px">`;
    if (!currentScaleData.completed) {
      html += `<button class="btn btn-mint" onclick="window.HSV_Escalas.confirmScale()" style="flex:1">✓ Confirmar escala completada</button>`;
    } else {
      html += `<button class="btn btn-ghost" onclick="window.HSV_Escalas.resetScale()" style="flex:1">🔄 Editar escala</button>`;
    }
    html += `</div>`;

    container.innerHTML = html;

    // Attach event listeners for radio buttons (simple scales)
    const radios = container.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
      radio.addEventListener('change', function() {
        if (this.checked) {
          const itemId = this.name.replace('item_', '');
          const value = parseInt(this.value);
          
          // Update visual radio button
          const visId = `vis_rad_${itemId}_${value}`;
          const visRadio = document.getElementById(visId);
          if (visRadio) {
            const dot = visRadio.querySelector('div');
            dot.style.background = '#66bb6a';
          }
          
          // Clear other radio buttons in the group
          container.querySelectorAll(`input[name="${this.name}"]`).forEach(r => {
            if (r !== this) {
              const otherVisId = `vis_rad_${itemId}_${r.value}`;
              const otherVis = document.getElementById(otherVisId);
              if (otherVis) {
                const otherDot = otherVis.querySelector('div');
                otherDot.style.background = 'white';
              }
            }
          });
          
          window.HSV_Escalas.updateResponse(itemId, value);
        }
      });
    });

    // Update summary
    updateScaleSummary();
  }

  // Renderizado especial para escalas estructuradas (como SPPB)
  function renderStructuredScale() {
    if (!currentScale || !ESCALAS_DEFS[currentScale]) return;

    const escDef = ESCALAS_DEFS[currentScale];
    const container = document.getElementById('scale_content_container');
    let html = '';

    // Título
    html += `<div style="margin-bottom:24px">`;
    html += `<h3 style="margin:0 0 8px;color:var(--text-dark)">${escDef.name}</h3>`;
    html += `</div>`;

    // Renderizar cada prueba
    escDef.tests.forEach((test, testIndex) => {
      html += `<div style="margin-bottom:24px;padding:16px;background:#f9fafb;border-radius:8px;border-left:4px solid #c3e7df">`;
      html += `<h4 style="margin:0 0 8px;color:var(--text-dark);font-weight:700">${test.title}</h4>`;
      html += `<p style="color:var(--muted);margin:0 0 16px;font-size:0.95rem">${test.instruction}</p>`;

      if (test.positions) {
        // PRUEBA 1: EQUILIBRIO
        test.positions.forEach(position => {
          html += `<div style="margin-bottom:16px;padding:12px;background:white;border-radius:6px;border:1px solid #e5e7eb">`;
          html += `<label style="display:block;margin-bottom:8px;font-weight:600;color:var(--text-dark)">${position.label}</label>`;
          position.options.forEach(option => {
            const isChecked = currentScaleData.responses[position.id] === option.value;
            html += `<label style="display:flex;align-items:center;margin-bottom:6px;cursor:pointer;user-select:none" onclick="event.stopPropagation(); document.getElementById('rad_eq_${position.id}_${option.value}').checked = true; document.getElementById('rad_eq_${position.id}_${option.value}').dispatchEvent(new Event('change'));"><div id="vis_rad_eq_${position.id}_${option.value}" style="display:flex;align-items:center;justify-content:center;width:20px;height:20px;border:2px solid #66bb6a;border-radius:50%;background:white;flex-shrink:0;margin-right:8px"><div style="width:10px;height:10px;border-radius:50%;background:${isChecked ? '#66bb6a' : 'white'}"></div></div><input type="radio" id="rad_eq_${position.id}_${option.value}" name="sppb_eq_${position.id}" value="${option.value}" ${isChecked ? 'checked' : ''} style="display:none !important" /><span style="color:var(--text-dark)">${option.label}</span></label>`;
          });
          html += `</div>`;
        });
      } else if (test.fields) {
        // PRUEBA 2: MARCHA
        test.fields.forEach(field => {
          const currentValue = currentScaleData.responses[field.id] || '';
          html += `<div style="margin-bottom:12px"><label style="display:block;margin-bottom:6px;font-weight:600;color:var(--text-dark)">${field.label}</label><input type="number" id="${field.id}" class="input" min="${field.min || 0}" step="0.01" value="${currentValue}" placeholder="Ingresa tiempo en segundos" onchange="window.HSV_Escalas.updateStructuredResponse('${field.id}', this.value)" style="width:150px;padding:8px;border:1px solid #ddd;border-radius:4px" /></div>`;
        });
        
        // Agregar checkbox para "No puede realizar"
        if (test.option) {
          const optionId = test.option.id;
          const isChecked = currentScaleData.responses[optionId] === true;
          const checkmarkSVG = isChecked ? '✓' : '';
          html += `<div style="margin-top:12px;padding:12px;background:#fff9e6;border-radius:6px;border:1px solid #ffe082"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none" onclick="event.stopPropagation(); const el = document.getElementById('opt_${optionId}'); el.checked = !el.checked; el.dispatchEvent(new Event('change'));"><div id="vis_opt_${optionId}" style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;border:2px solid #66bb6a;border-radius:4px;background:${isChecked ? '#66bb6a' : 'white'};color:white;font-weight:bold;font-size:14px;flex-shrink:0">${checkmarkSVG}</div><input type="checkbox" id="opt_${optionId}" ${isChecked ? 'checked="checked"' : ''} style="display:none !important;opacity:0;width:0;height:0" /><span style="color:var(--text-dark);font-weight:600">${test.option.label}</span></label></div>`;
        }
      } else if (test.step1) {
        // PRUEBA 3: SILLA
        html += `<div style="margin-bottom:16px;padding:12px;background:white;border-radius:6px;border:1px solid #e5e7eb">`;
        html += `<label style="display:block;margin-bottom:8px;font-weight:600;color:var(--text-dark)">${test.step1.label}</label>`;
        test.step1.options.forEach(option => {
          const isChecked = currentScaleData.responses.paso1 === option.value;
          html += `<label style="display:flex;align-items:center;margin-bottom:6px;cursor:pointer;user-select:none" onclick="event.stopPropagation(); document.getElementById('rad_silla_paso1_${option.value}').checked = true; document.getElementById('rad_silla_paso1_${option.value}').dispatchEvent(new Event('change'));"><div id="vis_rad_silla_paso1_${option.value}" style="display:flex;align-items:center;justify-content:center;width:20px;height:20px;border:2px solid #66bb6a;border-radius:50%;background:white;flex-shrink:0;margin-right:8px"><div style="width:10px;height:10px;border-radius:50%;background:${isChecked ? '#66bb6a' : 'white'}"></div></div><input type="radio" id="rad_silla_paso1_${option.value}" name="sppb_paso1" value="${option.value}" ${isChecked ? 'checked' : ''} style="display:none !important" /><span style="color:var(--text-dark)">${option.label}</span></label>`;
        });
        html += `</div>`;

        // Paso 2 (condicional)
        if (currentScaleData.responses.paso1 === 'si') {
          html += `<div style="margin-top:16px;padding:12px;background:#fffacd;border-radius:6px;border:2px solid #ffd700">`;
          html += `<label style="display:block;margin-bottom:8px;font-weight:600;color:#333">${test.step2.label}</label>`;
          const currentValue = currentScaleData.responses.tiempo_silla || '';
          html += `
            <input type="number" 
              id="tiempo_silla" 
              class="input" 
              min="0" 
              step="0.01"
              value="${currentValue}" 
              placeholder="Ingresa tiempo en segundos"
              onchange="window.HSV_Escalas.updateStructuredResponse('tiempo_silla', this.value)"
              style="width:150px;padding:8px;border:1px solid #ddd;border-radius:4px" />
          `;
          html += `</div>`;
        }
      }

      html += `</div>`;
    });

    // Summary section
    html += `<div style="margin-top:24px;padding:16px;background:#e8f5e9;border-radius:8px;border:1px solid #c8e6c9">`;
    html += `<h4 style="margin:0 0 16px;color:#2e7d32;font-weight:700">📊 RESUMEN FINAL SPPB</h4>`;
    html += `<div id="scale_summary" style="font-size:1rem;line-height:1.8"></div>`;
    html += `</div>`;

    // Completion button
    html += `<div style="margin-top:24px;display:flex;gap:8px">`;
    if (!currentScaleData.completed) {
      html += `<button class="btn btn-mint" onclick="window.HSV_Escalas.confirmScale()" style="flex:1;padding:12px;font-size:1rem;font-weight:700">✓ Confirmar escala SPPB completada</button>`;
    } else {
      html += `<button class="btn btn-ghost" onclick="window.HSV_Escalas.resetScale()" style="flex:1;padding:12px">🔄 Editar escala</button>`;
    }
    html += `</div>`;

    container.innerHTML = html;

    // Attach event listeners for checkboxes
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      const optId = checkbox.id.replace('opt_', '');
      
      checkbox.addEventListener('change', function() {
        // Update visual checkbox
        const visualCheckbox = document.getElementById(`vis_opt_${optId}`);
        if (visualCheckbox) {
          visualCheckbox.style.background = this.checked ? '#66bb6a' : 'white';
          visualCheckbox.textContent = this.checked ? '✓' : '';
        }
        
        window.HSV_Escalas.updateStructuredResponse(optId, this.checked);
      });
    });

    // Attach event listeners for radio buttons
    const radios = container.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
      radio.addEventListener('change', function() {
        if (this.checked) {
          // Update visual radio buttons in the same group
          const groupName = this.name;
          container.querySelectorAll(`input[name="${groupName}"]`).forEach(r => {
            const visId = r.id.replace('rad_', 'vis_rad_');
            const visRadio = document.getElementById(visId);
            if (visRadio) {
              const dot = visRadio.querySelector('div');
              dot.style.background = r.checked ? '#66bb6a' : 'white';
            }
          });
          
          // Determine which field to update
          if (this.name.startsWith('sppb_eq_')) {
            // Equilibrio
            const posId = this.name.replace('sppb_eq_', '');
            window.HSV_Escalas.updateStructuredResponse(posId, this.value);
          } else if (this.name === 'sppb_paso1') {
            // Silla paso1
            window.HSV_Escalas.updateStructuredResponse('paso1', this.value);
          }
        }
      });
    });

    // Update summary
    updateStructuredScaleSummary();
  }

  // Update response and recalculate
  function updateResponse(itemId, value) {
    const escDef = ESCALAS_DEFS[currentScale];
    const numValue = parseInt(value) || 0;

    // Validate
    const item = escDef.items.find(i => i.id === itemId);
    if (item && numValue > item.max) {
      alert(`El valor máximo para este ítem es ${item.max}`);
      document.getElementById(itemId).value = item.max;
      currentScaleData.responses[itemId] = item.max;
    } else {
      currentScaleData.responses[itemId] = numValue;
    }

    // Save response to localStorage
    saveScaleToStorage();

    // Update summary
    updateScaleSummary();
  }

  // Update response for structured scales (SPPB, etc.)
  function updateStructuredResponse(fieldId, value) {
    // Handle boolean conversion for checkboxes
    if (value === 'true') value = true;
    if (value === 'false') value = false;
    if (typeof value === 'string' && (value === 'on' || value === 'off')) {
      value = value === 'on';
    }
    
    currentScaleData.responses[fieldId] = value;
    
    // Save response to localStorage
    saveScaleToStorage();

    // Update summary only (don't re-render form to avoid losing focus)
    updateStructuredScaleSummary();
    
    // Check if we need to show/hide conditional fields
    // For SPPB, check if paso1 changed and we need to show step2
    if (fieldId === 'paso1') {
      const step2Container = document.querySelector('[style*="fffacd"]');
      if (value === 'si' && !step2Container) {
        // Need to re-render to show step2
        renderScaleForm();
      } else if (value !== 'si' && step2Container) {
        // Need to re-render to hide step2
        renderScaleForm();
      }
    }
  }

  // Calculate SPPB scores
  function calculateSPPBScores(responses) {
    let equilibrio = 0;
    let marcha = 0;
    let silla = 0;

    // PRUEBA 1: EQUILIBRIO
    // Lógica: si logra tándem=4, semitándem=3, juntos=2, no puede=0
    if (responses.pies_juntos === 'no') {
      equilibrio = 0;
    } else if (responses.semitandem === 'no') {
      equilibrio = 2;
    } else if (responses.tandem === 'no') {
      equilibrio = 3;
    } else if (responses.tandem === 'si') {
      equilibrio = 4;
    }

    // PRUEBA 2: VELOCIDAD DE MARCHA
    if (responses.no_puede === true) {
      marcha = 0;
    } else {
      const tiempo1 = parseFloat(responses.tiempo_intento1) || Infinity;
      const tiempo2 = parseFloat(responses.tiempo_intento2) || Infinity;
      const mejorTiempo = Math.min(tiempo1, tiempo2);

      // Puntaje según tiempo (4 metros)
      if (mejorTiempo === Infinity) marcha = 0;
      else if (mejorTiempo >= 8.70) marcha = 1;
      else if (mejorTiempo >= 6.21) marcha = 2;
      else if (mejorTiempo >= 4.82) marcha = 3;
      else marcha = 4;
    }

    // PRUEBA 3: LEVANTARSE DE LA SILLA
    if (responses.paso1 !== 'si') {
      silla = 0;
    } else {
      const tiempoSilla = parseFloat(responses.tiempo_silla) || Infinity;
      // Puntaje según tiempo (5 repeticiones)
      if (tiempoSilla === Infinity) silla = 0;
      else if (tiempoSilla >= 16.70) silla = 1;
      else if (tiempoSilla >= 13.70) silla = 2;
      else if (tiempoSilla >= 11.20) silla = 3;
      else silla = 4;
    }

    const total = equilibrio + marcha + silla;

    // Interpretation
    let interpretation = '';
    if (total >= 10) interpretation = 'Función normal';
    else if (total >= 7) interpretation = 'Discapacidad leve';
    else interpretation = 'Discapacidad grave/severa';

    return { equilibrio, marcha, silla, total, interpretation };
  }

  // Update and display the scale summary
  function updateScaleSummary() {
    if (!currentScale || !ESCALAS_DEFS[currentScale]) return;

    const escDef = ESCALAS_DEFS[currentScale];
    
    // For structured scales, use specialized function
    if (escDef.type === 'structured') {
      updateStructuredScaleSummary();
      return;
    }

    let totalScore = 0;
    let sectionScores = {};

    // Calculate scores
    escDef.items.forEach(item => {
      const value = currentScaleData.responses[item.id];
      const numValue = typeof value === 'string' ? parseInt(value) : value;
      const finalValue = (numValue !== null && !isNaN(numValue)) ? numValue : 0;
      
      totalScore += finalValue;

      if (!sectionScores[item.section]) {
        sectionScores[item.section] = 0;
      }
      sectionScores[item.section] += finalValue;
    });

    // Get section max values (from options, not from max property)
    let sectionMaxes = {};
    escDef.items.forEach(item => {
      if (!sectionMaxes[item.section]) {
        sectionMaxes[item.section] = 0;
      }
      // Get max value from options if available, otherwise fallback to item.max
      let itemMax = item.max || 0;
      if (item.options && Array.isArray(item.options)) {
        itemMax = Math.max(...item.options.map(opt => opt.value));
      }
      sectionMaxes[item.section] += itemMax;
    });

    let summaryHtml = '';

    // Show section scores
    Object.keys(sectionScores).forEach(section => {
      summaryHtml += `<div style="margin-bottom:8px"><strong>${section}:</strong> ${sectionScores[section]}/${sectionMaxes[section]}</div>`;
    });

    summaryHtml += `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #a5d6a7">`;
    summaryHtml += `<div style="font-size:1.1rem;font-weight:700;color:#1b5e20"><strong>Total: ${totalScore}/${escDef.totalMax}</strong></div>`;
    summaryHtml += `<div style="margin-top:8px;color:#2e7d32">${escDef.interpretation(totalScore)}</div>`;
    summaryHtml += `</div>`;

    const summaryEl = document.getElementById('scale_summary');
    if (summaryEl) summaryEl.innerHTML = summaryHtml;
  }

  // Update summary for structured scales (SPPB, etc.)
  function updateStructuredScaleSummary() {
    if (currentScale === 'SPPB') {
      const scores = calculateSPPBScores(currentScaleData.responses);
      
      // Update display fields (read-only)
      const summaryHTML = `
        <div class="structured-scale-summary">
          <h3>Resumen de Puntajes</h3>
          <div class="score-line">
            <label>Puntaje Equilibrio:</label>
            <span class="score-value">${scores.equilibrio}/4</span>
          </div>
          <div class="score-line">
            <label>Puntaje Marcha:</label>
            <span class="score-value">${scores.marcha}/4</span>
          </div>
          <div class="score-line">
            <label>Puntaje Levantarse de Silla:</label>
            <span class="score-value">${scores.silla}/4</span>
          </div>
          <div class="score-line score-total">
            <label><strong>TOTAL SPPB:</strong></label>
            <span class="score-value"><strong>${scores.total}/12</strong></span>
          </div>
          <div class="score-interpretation">
            <label>Interpretación:</label>
            <span>${scores.interpretation}</span>
          </div>
        </div>
      `;

      const summaryContainer = document.getElementById('scale_summary');
      if (summaryContainer) {
        summaryContainer.innerHTML = summaryHTML;
      }

      // Store scores
      currentScaleData.total = scores.total;
      currentScaleData.scores = scores;
      saveScaleToStorage();
    }
  }

  // Confirm scale as completed
  function confirmScale() {
    if (!currentScale || !ESCALAS_DEFS[currentScale]) return;

    const escDef = ESCALAS_DEFS[currentScale];

    // For structured scales, validate differently
    if (escDef.type === 'structured') {
      if (currentScale === 'SPPB') {
        // Validate SPPB completion
        const resp = currentScaleData.responses;
        
        // Validate Equilibrio
        if (resp.pies_juntos === undefined || resp.pies_juntos === '') {
          alert('⚠️ Por favor completa la Prueba 1 (Equilibrio) - Pies juntos');
          return;
        }
        if (resp.semitandem === undefined || resp.semitandem === '') {
          alert('⚠️ Por favor completa la Prueba 1 (Equilibrio) - Semitándem');
          return;
        }
        if (resp.tandem === undefined || resp.tandem === '') {
          alert('⚠️ Por favor completa la Prueba 1 (Equilibrio) - Tándem');
          return;
        }

        // Validate Marcha
        if (resp.no_puede !== true) {
          if (!resp.tiempo_intento1 || resp.tiempo_intento1 === '') {
            alert('⚠️ Por favor ingresa el tiempo del Intento 1 en la Prueba 2 (Marcha)');
            return;
          }
          if (!resp.tiempo_intento2 || resp.tiempo_intento2 === '') {
            alert('⚠️ Por favor ingresa el tiempo del Intento 2 en la Prueba 2 (Marcha)');
            return;
          }
        }

        // Validate Silla
        if (resp.paso1 === undefined || resp.paso1 === '') {
          alert('⚠️ Por favor responde Paso 1 de la Prueba 3 (Levantarse de Silla)');
          return;
        }
        if (resp.paso1 === 'si') {
          if (!resp.tiempo_silla || resp.tiempo_silla === '') {
            alert('⚠️ Por favor ingresa el tiempo en Paso 2 de la Prueba 3 (Levantarse de Silla)');
            return;
          }
        }

        // Calculate final scores
        const scores = calculateSPPBScores(currentScaleData.responses);
        currentScaleData.completed = true;
        currentScaleData.total = scores.total;
        currentScaleData.scores = scores;
        currentScaleData.interpretation = scores.interpretation;
      }
    } else {
      // For simple scales, validate as before
      const allAnswered = escDef.items.every(item => currentScaleData.responses[item.id] !== undefined && currentScaleData.responses[item.id] !== '');

      if (!allAnswered) {
        alert('⚠️ Por favor completa todos los ítems antes de confirmar la escala.');
        return;
      }

      // Calculate final score
      let totalScore = 0;
      escDef.items.forEach(item => {
        const value = currentScaleData.responses[item.id];
        const numValue = typeof value === 'string' ? parseInt(value) : value;
        const finalValue = (numValue !== null && !isNaN(numValue)) ? numValue : 0;
        totalScore += finalValue;
      });

      // Mark as completed
      currentScaleData.completed = true;
      currentScaleData.total = totalScore;
      currentScaleData.interpretation = escDef.interpretation(totalScore);
    }

    // Save to storage
    allScalesData[currentScale] = currentScaleData;
    saveAllScalesToStorage();

    // También llamar a saveDraft para persistir los cambios en localStorage
    try {
      if (window._valoracion && typeof window._valoracion.saveDraft === 'function') {
        setTimeout(() => {
          window._valoracion.saveDraft();
          console.log('✓ Valoración guardada automáticamente después de completar escala');
        }, 200);
      }
    } catch (e) {
      console.warn('No se pudo guardar automáticamente', e);
    }

    alert(`✓ Escala ${ESCALAS_DEFS[currentScale].name} completada exitosamente.\nPuntaje: ${currentScaleData.total}/${currentScale === 'SPPB' ? '12' : ESCALAS_DEFS[currentScale].totalMax}`);

    // Re-render form to show completion state
    renderScaleForm();
  }

  // Reset scale for editing
  function resetScale() {
    if (confirm('¿Deseas editar esta escala completada? Se mantendrán los datos actuales.')) {
      currentScaleData.completed = false;
      renderScaleForm();
    }
  }

  // Save scale to temporary storage (during editing)
  function saveScaleToStorage() {
    allScalesData[currentScale] = currentScaleData;
    // Save to window for access by valoracion.js
    if (window._valoracion && window._valoracion.currentVal) {
      window._valoracion.currentVal.escalasEstandarizadas = JSON.parse(JSON.stringify(allScalesData));
    }
    console.log('✓ Escalas guardadas:', allScalesData);
  }

  // Save all scales to permanent storage
  function saveAllScalesToStorage() {
    // Save to window
    if (window._valoracion && window._valoracion.currentVal) {
      window._valoracion.currentVal.escalasEstandarizadas = JSON.parse(JSON.stringify(allScalesData));
    }
    console.log('✓ Todos los datos de escalas sincronizados');
  }

  // Public interface
  window.HSV_Escalas = {
    init: function() {
      loadScalesData();
      renderScalesList();
    },
    renderScalesList,
    openScale,
    updateResponse,
    updateStructuredResponse,
    confirmScale,
    resetScale,
    loadScalesData,
    resetAllScales: function() {
      // Reset all scales data when starting a new valoración
      allScalesData = {};
      Object.keys(ESCALAS_DEFS).forEach(key => {
        allScalesData[key] = { completed: false, responses: {} };
      });
      console.log('✓ Todas las escalas reseteadas');
    },
    getAllScalesData: function() {
      return allScalesData;
    }
  };

  console.log('✓ Módulo escalas.js cargado');
})();
