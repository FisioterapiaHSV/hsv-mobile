// pdf-export.js
// Funciones para exportar valoraciones y planes a PDF
// Siguiendo el formato del proyecto EXPEDIENTE original

// Helper: escape HTML
function escapeHtml(text) {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Helper: format date long ES
function formatDateLongES(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
  } catch(e) {
    return dateStr;
  }
}

// Helper: format datetime ES
function formatDateTimeES(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()} a las ${hours}:${minutes}`;
  } catch(e) {
    return dateStr;
  }
}

// Interpretation functions for scales
function interpretTinetti(score) {
  if (score == null) return '';
  if (score >= 25) return 'Riesgo bajo';
  if (score >= 19) return 'Riesgo moderado';
  return 'Riesgo alto';
}

function interpretSPPB(score) {
  if (score == null) return '';
  if (score >= 10) return 'Función normal';
  if (score >= 7) return 'Limitación leve';
  if (score >= 4) return 'Limitación moderada';
  return 'Limitación severa';
}

function interpretFRAIL(score) {
  if (score == null) return '';
  if (score === 0) return 'Robusto';
  if (score <= 2) return 'Prefrágil';
  return 'Frágil';
}

function interpretKatz(score) {
  if (score == null) return '';
  if (score >= 6) return 'Independiente';
  if (score >= 4) return 'Dependencia moderada';
  if (score >= 2) return 'Dependencia severa';
  return 'Dependencia total';
}

function interpretLawton(score) {
  if (score == null) return '';
  if (score >= 7) return 'Independiente';
  if (score >= 4) return 'Dependencia moderada';
  return 'Dependencia severa';
}

function interpretDownton(score) {
  if (score == null) return '';
  if (score < 3) return 'Riesgo bajo';
  return 'Riesgo alto';
}

// Export valoración narrada to PDF
function exportValoracionNarradaPDF(id) {
  const vals = JSON.parse(localStorage.getItem('hsv_valoraciones_v1') || '[]');
  const rec = vals.find(v => v.id === id);
  
  if (!rec) {
    alert('No se encontró la valoración');
    return;
  }

  let html = generateNarradaHTML(rec);
  
  // Open print window
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

// Export valoración formulario completo to PDF
function exportValoracionFormularioPDF(id) {
  const vals = JSON.parse(localStorage.getItem('hsv_valoraciones_v1') || '[]');
  const rec = vals.find(v => v.id === id);
  
  if (!rec) {
    alert('No se encontró la valoración');
    return;
  }

  let html = generateFormularioCompletoHTML(rec);
  
  // Open print window
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

// Generate narrada HTML (compact clinical summary)
function generateNarradaHTML(rec) {
  const fecha = formatDateLongES(rec.fecha) || formatDateLongES(rec.updatedAt || rec.createdAt);
  const time = (rec.hora_start || '') + (rec.hora_end ? (' - ' + rec.hora_end) : '');
  const responsableLabel = rec.responsable_signed || ((rec.responsable_prefix ? (rec.responsable_prefix + ' ') : '') + (rec.responsable || ''));
  
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Valoración Narrada - ${escapeHtml(rec.paciente)}</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      padding: 30px; 
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { 
      color: #e47b9c; 
      border-bottom: 3px solid #e47b9c; 
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .header-info {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 0.95rem;
      color: #666;
    }
    .section {
      margin: 15px 0;
      white-space: pre-line;
    }
    .section strong {
      color: #333;
    }
    @media print {
      body { padding: 20px; }
      h1 { page-break-after: avoid; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>VALORACIÓN FISIOTERAPÉUTICA</h1>
  <div class="header-info">
    <strong>Paciente:</strong> ${escapeHtml(rec.paciente)}<br>
    <strong>Fecha:</strong> ${fecha}${time ? (' • ' + time) : ''}<br>
    <strong>Responsable:</strong> ${escapeHtml(responsableLabel)}
  </div>
`;

  // Antecedentes
  const antecedentes = Array.isArray(rec.antecedentes) ? rec.antecedentes.filter(Boolean) : [];
  html += `<div class="section">`;
  if (antecedentes.length) {
    html += `<strong>Antecedentes:</strong> ${escapeHtml(antecedentes.join(', '))}.`;
  } else {
    html += `<strong>Antecedentes:</strong> Sin antecedentes patológicos registrados.`;
  }
  html += `</div>`;

  // ALICIA - motivo del dolor
  const a = rec.alicia && rec.alicia.a ? rec.alicia.a.trim() : '';
  const l = rec.alicia && rec.alicia.l ? rec.alicia.l.trim() : '';
  const i = rec.alicia && rec.alicia.i ? rec.alicia.i.trim() : '';
  const c = rec.alicia && rec.alicia.c ? rec.alicia.c.trim() : '';
  const i2 = rec.alicia && rec.alicia.i2 ? String(rec.alicia.i2).trim() : '';
  const a2 = rec.alicia && rec.alicia.a2 ? rec.alicia.a2.trim() : '';
  let motivoParts = [];
  if (a) motivoParts.push(`El dolor apareció ${a}`);
  if (l) motivoParts.push(`se localiza en ${l}`);
  if (i) motivoParts.push(`con irradiación a ${i}`);
  if (c) motivoParts.push(`se describe como ${c}`);
  if (i2) motivoParts.push(`con intensidad de ${i2}/10`);
  if (a2) motivoParts.push(`${a2}`);
  
  if (motivoParts.length) {
    html += `<div class="section"><strong>Motivo del dolor (ALICIA):</strong> ${escapeHtml(motivoParts.join(', '))}.</div>`;
  }

  // Postura
  const posturaParts = [];
  if (rec.postura) {
    if (rec.postura.anterior) posturaParts.push(`Vista anterior: ${rec.postura.anterior.trim()}`);
    if (rec.postura.lateral) posturaParts.push(`Vista lateral: ${rec.postura.lateral.trim()}`);
    if (rec.postura.posterior) posturaParts.push(`Vista posterior: ${rec.postura.posterior.trim()}`);
    if (rec.postura.cefalo) posturaParts.push(`${rec.postura.cefalo.trim()}`);
  }
  if (posturaParts.length) {
    html += `<div class="section"><strong>Postura:</strong> ${escapeHtml(posturaParts.join('; '))}.</div>`;
  }

  // Goniometría summary con formato específico: primero mencionar segmentos evaluados
  if (Array.isArray(rec.goniometria) && rec.goniometria.length) {
    // Obtener todas las articulaciones evaluadas
    const allJoints = [...new Set(rec.goniometria.map(g => g.joint || '').filter(Boolean))];
    
    // Agrupar alteraciones por articulación
    const alteredByJoint = {};
    rec.goniometria.forEach(g => {
      const joint = g.joint || '';
      const movement = g.movement || '';
      const expected = g.expected || null;
      let rightAltered = false, leftAltered = false;
      if (g.right != null && expected != null) {
        rightAltered = (g.right < (expected * 0.8));
      }
      if (g.left != null && expected != null) {
        leftAltered = (g.left < (expected * 0.8));
      }
      if (rightAltered || leftAltered) {
        alteredByJoint[joint] = alteredByJoint[joint] || [];
        alteredByJoint[joint].push({
          movement: movement,
          right: g.right != null ? g.right : null,
          left: g.left != null ? g.left : null,
          rightAltered: rightAltered,
          leftAltered: leftAltered
        });
      }
    });
    
    const joints = Object.keys(alteredByJoint);
    html += `<div class="section"><strong>Goniometría:</strong> Se evaluaron los segmentos: ${escapeHtml(allJoints.join(', '))}. `;
    
    if (!joints.length) {
      html += `Rangos articulares conservados en todos los segmentos, sin limitaciones significativas.</div>`;
    } else {
      const parts = [];
      joints.forEach(j => {
        const arr = alteredByJoint[j];
        const movParts = arr.map(item => {
          const sides = [];
          if (item.rightAltered && item.right != null) sides.push(`Der: ${item.right}°`);
          if (item.leftAltered && item.left != null) sides.push(`Izq: ${item.left}°`);
          return `${item.movement} (${sides.join('; ')})`;
        });
        parts.push(`${j}: ${movParts.join(', ')}`);
      });
      html += `Alteraciones: ${escapeHtml(parts.join('; '))}. El resto de los movimientos articulares presentan rango funcional completo.</div>`;
    }
  }

  // Daniels (fuerza) con especificación de lados
  if (Array.isArray(rec.daniels) && rec.daniels.length) {
    const groups = {};
    rec.daniels.forEach(d => {
      const v = (d.right != null ? d.right : d.left != null ? d.left : null);
      if (v == null) return;
      groups[v] = groups[v] || [];
      // Agregar el lado específico
      const muscle = d.muscle || '';
      if (d.right != null && d.left != null) {
        if (d.right === d.left) {
          groups[v].push(`${muscle} bilateral`);
        } else {
          if (d.right === v) groups[v].push(`${muscle} derecho`);
          if (d.left === v) groups[v].push(`${muscle} izquierdo`);
        }
      } else if (d.right != null) {
        groups[v].push(`${muscle} derecho`);
      } else if (d.left != null) {
        groups[v].push(`${muscle} izquierdo`);
      }
    });
    const parts = [];
    Object.keys(groups).sort((a, b) => b - a).forEach(k => {
      const muscles = Array.from(new Set(groups[k]));
      parts.push(`Fuerza ${k}/5 en ${muscles.join(', ')}`);
    });
    html += `<div class="section"><strong>Fuerza muscular (Daniels):</strong> ${escapeHtml(parts.join('; '))}`;
    const comments = rec.daniels.map(d => d.comment).filter(Boolean);
    if (comments.length) html += `. Observaciones: ${escapeHtml(comments.join(', '))}`;
    html += `.</div>`;
  }

  // Marcha
  if (rec.marcha) {
    const m = rec.marcha;
    const phaseAlter = (m.phases || []).filter(p => p.rightAltered || p.leftAltered).map(p => p.phase);
    let marchText = '';
    if (phaseAlter.length) {
      marchText += `Alteraciones en fases: ${phaseAlter.join(', ')}.`;
    }
    if (m.description) marchText += (marchText ? ' ' : '') + m.description;
    
    const alteredConsts = Object.keys(m.constants || {}).filter(k => m.constants[k]);
    const normalConsts = Object.keys(m.constants || {}).filter(k => !m.constants[k]);
    let constsSummary = '';
    if (alteredConsts.length) constsSummary += ` Constantes alteradas: ${alteredConsts.join(', ')}.`;
    if (normalConsts.length) constsSummary += ` Constantes normales: ${normalConsts.join(', ')}.`;
    
    if (marchText || constsSummary) {
      html += `<div class="section"><strong>Marcha:</strong> ${escapeHtml((marchText + ' ' + constsSummary).trim())}</div>`;
    }
  }

  // Escalas (formato con viñetas)
  if (rec.escalas) {
    const es = rec.escalas;
    let escParts = [];
    if (es.tinetti && es.tinetti.total != null) escParts.push(`• Tinetti: ${es.tinetti.total}/28 — ${interpretTinetti(es.tinetti.total)}`);
    if (es.sppb && es.sppb.total != null) escParts.push(`• SPPB: ${es.sppb.total}/12 — ${interpretSPPB(es.sppb.total)}`);
    if (es.frail && es.frail.score != null) escParts.push(`• FRAIL: ${es.frail.score} — ${interpretFRAIL(es.frail.score)}`);
    if (es.katz && es.katz.score != null) escParts.push(`• Katz: ${es.katz.score} — ${interpretKatz(es.katz.score)}`);
    if (es.lawton && es.lawton.score != null) escParts.push(`• Lawton: ${es.lawton.score} — ${interpretLawton(es.lawton.score)}`);
    if (es.downton && es.downton.score != null) escParts.push(`• Downton: ${es.downton.score} — ${interpretDownton(es.downton.score)}`);
    
    if (Array.isArray(es.customs) && es.customs.length) {
      es.customs.forEach(c => {
        const name = c.name || 'Escala personalizada';
        const score = (c.score != null && c.score !== '') ? `: ${c.score}` : '';
        const interp = c.interpretacion ? ` — ${c.interpretacion}` : '';
        escParts.push(`• ${name}${score}${interp}`);
      });
    }
    
    if (escParts.length) {
      html += `<div class="section"><strong>Escalas:</strong><br>${escapeHtml(escParts.join('\n'))}</div>`;
    }
  }

  // Pruebas específicas (formato con viñetas)
  if (Array.isArray(rec.pruebasEspecificas) && rec.pruebasEspecificas.length) {
    const parts = rec.pruebasEspecificas.map(t => `• ${t.name || ''}${t.resultado ? (' — ' + t.resultado) : ''}`);
    html += `<div class="section"><strong>Pruebas específicas:</strong><br>${escapeHtml(parts.join('\n'))}</div>`;
  }

  // Diagnóstico
  if (rec.diagnostico) {
    html += `<div class="section"><strong>Diagnóstico fisioterapéutico:</strong> ${escapeHtml(rec.diagnostico)}</div>`;
  }

  // Observaciones
  if (rec.observaciones) {
    html += `<div class="section"><strong>Observaciones:</strong> ${escapeHtml(rec.observaciones)}</div>`;
  }

  // Footer
  const signedBy = rec.responsable_signed || ((rec.responsable_prefix ? (rec.responsable_prefix + ' ') : '') + (rec.responsable || ''));
  const signedAt = rec.signedAt ? formatDateTimeES(rec.signedAt) : (rec.updatedAt ? formatDateTimeES(rec.updatedAt) : '');
  html += `<div style="margin-top:30px;color:#666;font-size:0.9rem;border-top:1px solid #e0e0e0;padding-top:15px;">`;
  html += `Valoración ${rec.status === 'Firmada' ? 'firmada' : 'guardada como borrador'} por ${escapeHtml(signedBy || '')}`;
  if (signedAt) html += ` el ${escapeHtml(signedAt)}`;
  html += `.`;
  html += `</div>`;

  html += `
</body>
</html>`;

  return html;
}

// Generate formulario completo HTML (detailed form view)
function generateFormularioCompletoHTML(rec) {
  const fecha = formatDateLongES(rec.fecha) || formatDateLongES(rec.updatedAt || rec.createdAt);
  const time = (rec.hora_start || '') + (rec.hora_end ? (' - ' + rec.hora_end) : '');
  const responsableLabel = rec.responsable_signed || ((rec.responsable_prefix ? (rec.responsable_prefix + ' ') : '') + (rec.responsable || ''));
  
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Formulario Completo - ${escapeHtml(rec.paciente)}</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      padding: 30px; 
      line-height: 1.5;
      max-width: 900px;
      margin: 0 auto;
      font-size: 0.9rem;
    }
    h1 { 
      color: #e47b9c; 
      border-bottom: 3px solid #e47b9c; 
      padding-bottom: 10px;
      margin-bottom: 20px;
      font-size: 1.8rem;
    }
    h2 {
      color: #555;
      font-size: 1.2rem;
      margin-top: 25px;
      margin-bottom: 10px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .header-info {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    th, td {
      padding: 8px;
      text-align: left;
      border: 1px solid #ddd;
    }
    th {
      background: #f3f4f6;
      font-weight: 600;
    }
    .field {
      margin: 8px 0;
    }
    .field strong {
      color: #333;
      display: inline-block;
      min-width: 150px;
    }
    ul {
      margin: 5px 0 0 20px;
    }
    @media print {
      body { padding: 15px; font-size: 0.85rem; }
      h1 { font-size: 1.5rem; page-break-after: avoid; }
      h2 { font-size: 1.1rem; page-break-after: avoid; }
      table { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>VALORACIÓN FISIOTERAPÉUTICA - FORMULARIO COMPLETO</h1>
  <div class="header-info">
    <div class="field"><strong>Paciente:</strong> ${escapeHtml(rec.paciente)}</div>
    <div class="field"><strong>Fecha:</strong> ${fecha}${time ? (' • ' + time) : ''}</div>
    <div class="field"><strong>Responsable:</strong> ${escapeHtml(responsableLabel)}</div>
  </div>
`;

  // Antecedentes
  html += `<h2>Antecedentes</h2>`;
  const antecedentes = Array.isArray(rec.antecedentes) ? rec.antecedentes.filter(Boolean) : [];
  if (antecedentes.length) {
    html += `<ul>` + antecedentes.map(a => `<li>${escapeHtml(a)}</li>`).join('') + `</ul>`;
  } else {
    html += `<div>Sin antecedentes patológicos registrados.</div>`;
  }

  // ALICIA
  html += `<h2>Motivo del dolor (ALICIA)</h2>`;
  if (rec.alicia) {
    html += `<div class="field"><strong>Aparición / Inicio:</strong> ${escapeHtml(rec.alicia.a || '')}</div>`;
    html += `<div class="field"><strong>Localización:</strong> ${escapeHtml(rec.alicia.l || '')}</div>`;
    html += `<div class="field"><strong>Irradiación:</strong> ${escapeHtml(rec.alicia.i || '')}</div>`;
    html += `<div class="field"><strong>Características:</strong> ${escapeHtml(rec.alicia.c || '')}</div>`;
    html += `<div class="field"><strong>Intensidad (EVA):</strong> ${escapeHtml(rec.alicia.i2 || '')}</div>`;
    html += `<div class="field"><strong>Atenuantes/Agravantes:</strong> ${escapeHtml(rec.alicia.a2 || '')}</div>`;
  }

  // Postura
  if (rec.postura) {
    html += `<h2>Postura</h2>`;
    if (rec.postura.anterior) html += `<div class="field"><strong>Anterior:</strong> ${escapeHtml(rec.postura.anterior)}</div>`;
    if (rec.postura.lateral) html += `<div class="field"><strong>Lateral:</strong> ${escapeHtml(rec.postura.lateral)}</div>`;
    if (rec.postura.posterior) html += `<div class="field"><strong>Posterior:</strong> ${escapeHtml(rec.postura.posterior)}</div>`;
    if (rec.postura.cefalo) html += `<div class="field"><strong>Céfalo-caudal:</strong> ${escapeHtml(rec.postura.cefalo)}</div>`;
  }

  // Goniometría
  if (Array.isArray(rec.goniometria) && rec.goniometria.length) {
    html += `<h2>Goniometría</h2>`;
    html += `<table><thead><tr><th>Segmento</th><th>Movimiento</th><th style="text-align:center;">Derecha</th><th style="text-align:center;">Izquierda</th></tr></thead><tbody>`;
    rec.goniometria.forEach(g => {
      html += `<tr>`;
      html += `<td>${escapeHtml(g.joint || '')}</td>`;
      html += `<td>${escapeHtml(g.movement || '')}</td>`;
      html += `<td style="text-align:center;">${g.right != null ? escapeHtml(String(g.right) + '°') : '–'}</td>`;
      html += `<td style="text-align:center;">${g.left != null ? escapeHtml(String(g.left) + '°') : '–'}</td>`;
      html += `</tr>`;
    });
    html += `</tbody></table>`;
  }

  // Daniels
  if (Array.isArray(rec.daniels) && rec.daniels.length) {
    html += `<h2>Fuerza muscular (Daniels)</h2>`;
    html += `<table><thead><tr><th>Músculo</th><th style="text-align:center;">Derecha</th><th style="text-align:center;">Izquierda</th><th>Comentario</th></tr></thead><tbody>`;
    rec.daniels.forEach(d => {
      html += `<tr>`;
      html += `<td>${escapeHtml(d.muscle || '')}</td>`;
      html += `<td style="text-align:center;">${d.right != null ? escapeHtml(String(d.right)) : '–'}</td>`;
      html += `<td style="text-align:center;">${d.left != null ? escapeHtml(String(d.left)) : '–'}</td>`;
      html += `<td>${escapeHtml(d.comment || '')}</td>`;
      html += `</tr>`;
    });
    html += `</tbody></table>`;
  }

  // Marcha
  if (rec.marcha) {
    html += `<h2>Marcha</h2>`;
    if (Array.isArray(rec.marcha.phases) && rec.marcha.phases.length) {
      html += `<table><thead><tr><th>Fase</th><th style="text-align:center;">Derecha</th><th style="text-align:center;">Izquierda</th></tr></thead><tbody>`;
      rec.marcha.phases.forEach(p => {
        html += `<tr>`;
        html += `<td>${escapeHtml(p.phase || '')}</td>`;
        html += `<td style="text-align:center;">${p.rightAltered ? 'Alterada' : 'Normal'}</td>`;
        html += `<td style="text-align:center;">${p.leftAltered ? 'Alterada' : 'Normal'}</td>`;
        html += `</tr>`;
      });
      html += `</tbody></table>`;
    }
    if (rec.marcha.constants) {
      html += `<div class="field"><strong>Constantes:</strong>`;
      const consts = Object.keys(rec.marcha.constants).map(k => `${k}: ${rec.marcha.constants[k] ? 'Alterada' : 'Normal'}`);
      html += ` ${escapeHtml(consts.join(', '))}</div>`;
    }
    if (rec.marcha.description) {
      html += `<div class="field"><strong>Descripción:</strong> ${escapeHtml(rec.marcha.description)}</div>`;
    }
  }

  // Escalas
  if (rec.escalas) {
    html += `<h2>Escalas</h2>`;
    html += `<table><thead><tr><th>Escala</th><th style="text-align:center;">Puntuación</th><th>Detalles</th><th>Interpretación</th></tr></thead><tbody>`;
    
    const es = rec.escalas;
    if (es.tinetti && es.tinetti.total != null) {
      const details = `Marcha: ${es.tinetti.gait != null ? es.tinetti.gait : '–'}; Equilibrio: ${es.tinetti.balance != null ? es.tinetti.balance : '–'}`;
      html += `<tr><td>Tinetti</td><td style="text-align:center;">${es.tinetti.total}/28</td><td>${escapeHtml(details)}</td><td>${escapeHtml(interpretTinetti(es.tinetti.total))}</td></tr>`;
    }
    if (es.sppb && es.sppb.total != null) {
      const details = `Balance: ${es.sppb.components?.balance || '–'}; Marcha: ${es.sppb.components?.gait || '–'}; Silla: ${es.sppb.components?.chair || '–'}`;
      html += `<tr><td>SPPB</td><td style="text-align:center;">${es.sppb.total}/12</td><td>${escapeHtml(details)}</td><td>${escapeHtml(interpretSPPB(es.sppb.total))}</td></tr>`;
    }
    if (es.frail && es.frail.score != null) {
      html += `<tr><td>FRAIL</td><td style="text-align:center;">${es.frail.score}</td><td>${escapeHtml(es.frail.details || '')}</td><td>${escapeHtml(interpretFRAIL(es.frail.score))}</td></tr>`;
    }
    if (es.katz && es.katz.score != null) {
      html += `<tr><td>Katz</td><td style="text-align:center;">${es.katz.score}</td><td>${escapeHtml(es.katz.details || '')}</td><td>${escapeHtml(interpretKatz(es.katz.score))}</td></tr>`;
    }
    if (es.lawton && es.lawton.score != null) {
      html += `<tr><td>Lawton</td><td style="text-align:center;">${es.lawton.score}</td><td>${escapeHtml(es.lawton.details || '')}</td><td>${escapeHtml(interpretLawton(es.lawton.score))}</td></tr>`;
    }
    if (es.downton && es.downton.score != null) {
      html += `<tr><td>Downton</td><td style="text-align:center;">${es.downton.score}</td><td>${escapeHtml(es.downton.details || '')}</td><td>${escapeHtml(interpretDownton(es.downton.score))}</td></tr>`;
    }
    if (Array.isArray(es.customs) && es.customs.length) {
      es.customs.forEach(c => {
        html += `<tr><td>${escapeHtml(c.name || 'Escala personalizada')}</td><td style="text-align:center;">${c.score != null ? escapeHtml(String(c.score)) : '–'}</td><td>${escapeHtml(c.detalles || '')}</td><td>${escapeHtml(c.interpretacion || '')}</td></tr>`;
      });
    }
    
    html += `</tbody></table>`;
  }

  // Pruebas específicas
  if (Array.isArray(rec.pruebasEspecificas) && rec.pruebasEspecificas.length) {
    html += `<h2>Pruebas específicas</h2>`;
    html += `<ul>` + rec.pruebasEspecificas.map(t => `<li>${escapeHtml((t.name || '') + (t.resultado ? (' — ' + t.resultado) : ''))}</li>`).join('') + `</ul>`;
  }

  // Diagnóstico
  if (rec.diagnostico) {
    html += `<h2>Diagnóstico fisioterapéutico</h2>`;
    html += `<div style="font-weight:600;font-size:1.05rem;">${escapeHtml(rec.diagnostico)}</div>`;
  }

  // Observaciones
  if (rec.observaciones) {
    html += `<h2>Observaciones</h2>`;
    html += `<div>${escapeHtml(rec.observaciones)}</div>`;
  }

  // Footer
  const signedBy = rec.responsable_signed || ((rec.responsable_prefix ? (rec.responsable_prefix + ' ') : '') + (rec.responsable || ''));
  const signedAt = rec.signedAt ? formatDateTimeES(rec.signedAt) : (rec.updatedAt ? formatDateTimeES(rec.updatedAt) : '');
  html += `<div style="margin-top:30px;color:#666;font-size:0.85rem;border-top:1px solid #e0e0e0;padding-top:15px;">`;
  html += `Valoración ${rec.status === 'Firmada' ? 'firmada' : 'guardada como borrador'} por ${escapeHtml(signedBy || '')}`;
  if (signedAt) html += ` el ${escapeHtml(signedAt)}`;
  html += `.`;
  html += `</div>`;

  html += `
</body>
</html>`;

  return html;
}

// Make functions available globally
window.exportValoracionNarradaPDF = exportValoracionNarradaPDF;
window.exportValoracionFormularioPDF = exportValoracionFormularioPDF;

// ========== PLAN DE TRATAMIENTO PDF EXPORT ==========

// Export plan de tratamiento to PDF
function exportPlanPDF(id) {
  // Try to load from DB first, fallback to localStorage
  let plans = [];
  try {
    if (window.DB && typeof window.DB.load === 'function') {
      plans = window.DB.load('planes') || [];
    } else {
      plans = JSON.parse(localStorage.getItem('hsv_plans_v1') || '[]');
    }
  } catch(e) {
    plans = JSON.parse(localStorage.getItem('hsv_plans_v1') || '[]');
  }
  
  const p = plans.find(plan => plan.id === id);
  
  if (!p) {
    alert('No se encontró el plan de tratamiento');
    return;
  }

  let html = generatePlanHTML(p);
  
  // Open print window
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

// Generate plan HTML for PDF
function generatePlanHTML(p) {
  const fecha = formatDateLongES(p.fecha) || formatDateLongES(p.updatedAt || p.createdAt);
  const time = p.signedAt ? formatTimeShort(p.signedAt) : (p.updatedAt ? formatTimeShort(p.updatedAt) : '');
  
  // Build responsable and apoyo with prefixes
  const respPrefix = p.responsable_prefix || '';
  const respText = respPrefix ? `${respPrefix} ${p.responsable_signed || p.responsable_text || ''}` : (p.responsable_signed || p.responsable_text || '');
  const apoyoPrefix = p.apoyo_prefix || '';
  const apoyoText = (p.apoyo_signed || p.apoyo_text) ? (apoyoPrefix ? `${apoyoPrefix} ${p.apoyo_signed || p.apoyo_text}` : (p.apoyo_signed || p.apoyo_text)) : '—';
  
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Plan de Tratamiento - ${escapeHtml(p.paciente || '')}</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      padding: 30px; 
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { 
      color: #2c5f2d; 
      border-bottom: 3px solid #2c5f2d; 
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    h2 {
      color: #555;
      font-size: 1.2rem;
      margin-top: 25px;
      margin-bottom: 10px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .header-info {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 0.95rem;
      color: #666;
    }
    .section {
      margin: 15px 0;
      white-space: pre-line;
    }
    .section strong {
      color: #333;
    }
    .cif-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-top: 10px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 15px;
      background: #fafafa;
    }
    .cif-column {
      padding: 10px;
    }
    .cif-column strong {
      display: block;
      margin-bottom: 8px;
      color: #2c5f2d;
      border-bottom: 1px solid #ddd;
      padding-bottom: 4px;
    }
    .estructura-item {
      background: white;
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 10px;
      border-left: 3px solid #2c5f2d;
    }
    .estructura-title {
      font-weight: 600;
      color: #2c5f2d;
      margin-bottom: 6px;
    }
    .funciones-list {
      margin-left: 12px;
      font-size: 0.9rem;
      color: #555;
    }
    @media print {
      body { padding: 20px; }
      h1 { page-break-after: avoid; }
      .section { page-break-inside: avoid; }
      .cif-grid { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>PLAN DE TRATAMIENTO FISIOTERAPÉUTICO</h1>
  <div class="header-info">
    <strong>Paciente:</strong> ${escapeHtml(p.paciente || '')}<br>
    <strong>Fecha:</strong> ${fecha}${time ? (' • ' + time) : ''}<br>
    <strong>Responsable:</strong> ${escapeHtml(respText)}<br>
    <strong>Apoyo:</strong> ${escapeHtml(apoyoText)}
  </div>
`;

  // Motivo
  if (p.motivo) {
    html += `<div class="section"><strong>Motivo clínico:</strong><br>${escapeHtml(p.motivo)}</div>`;
  }

  // Tipo de padecimiento
  html += `<div class="section"><strong>Tipo de padecimiento:</strong> ${escapeHtml(p.tipo || 'Crónico')}</div>`;

  // Objetivo general (para Crónico)
  if (p.obj_general && (p.tipo === 'Crónico' || p.tipo === 'cronico' || !p.tipo)) {
    html += `<h2>Objetivo General</h2>`;
    html += `<div class="section">${escapeHtml(p.obj_general)}</div>`;
  }

  // Plan de tratamiento general (para Crónico)
  if (p.plan_general && (p.tipo === 'Crónico' || p.tipo === 'cronico' || !p.tipo)) {
    html += `<h2>Plan de Tratamiento General</h2>`;
    html += `<div class="section">${escapeHtml(p.plan_general)}</div>`;
  }

  // Metas por plazo (para Agudo)
  if (p.tipo === 'Agudo' || p.tipo === 'agudo') {
    if (p.corto) {
      html += `<h2>Metas a Corto Plazo</h2>`;
      html += `<div class="section">${escapeHtml(p.corto)}</div>`;
    }
    if (p.mediano) {
      html += `<h2>Metas a Mediano Plazo</h2>`;
      html += `<div class="section">${escapeHtml(p.mediano)}</div>`;
    }
    if (p.largo) {
      html += `<h2>Metas a Largo Plazo</h2>`;
      html += `<div class="section">${escapeHtml(p.largo)}</div>`;
    }
  }

  // Cuadro CIF
  html += `<h2>Marco de Referencia CIF</h2>`;
  html += `<div class="cif-grid">`;
  
  // Deficiencias
  html += `<div class="cif-column">`;
  html += `<strong>Deficiencia</strong>`;
  if (Array.isArray(p.cif_deficiencias) && p.cif_deficiencias.length > 0) {
    p.cif_deficiencias.forEach(def => {
      html += `<div class="estructura-item">`;
      html += `<div class="estructura-title">${escapeHtml(def.estructura || '')}</div>`;
      if (Array.isArray(def.funciones) && def.funciones.length > 0) {
        html += `<div class="funciones-list">`;
        def.funciones.forEach(func => {
          html += `<div>• ${escapeHtml(func)}</div>`;
        });
        html += `</div>`;
      }
      html += `</div>`;
    });
  } else if (p.cif_def) {
    // Fallback for old format
    html += `<div>${escapeHtml(p.cif_def)}</div>`;
  }
  html += `</div>`;
  
  // Limitación
  html += `<div class="cif-column">`;
  html += `<strong>Limitación en la Actividad</strong>`;
  html += `<div>${escapeHtml(p.cif_lim || '')}</div>`;
  html += `</div>`;
  
  // Restricción
  html += `<div class="cif-column">`;
  html += `<strong>Restricción en la Participación</strong>`;
  html += `<div>${escapeHtml(p.cif_res || '')}</div>`;
  html += `</div>`;
  
  html += `</div>`; // end cif-grid

  // Footer
  const signedBy = p.responsable_signed || respText;
  const signedAt = p.signedAt ? formatDateTimeES(p.signedAt) : (p.updatedAt ? formatDateTimeES(p.updatedAt) : '');
  html += `<div style="margin-top:30px;color:#666;font-size:0.9rem;border-top:1px solid #e0e0e0;padding-top:15px;">`;
  html += `Plan de tratamiento ${p.status === 'Firmado' ? 'firmado' : 'guardado como borrador'} por ${escapeHtml(signedBy || '')}`;
  if (signedAt) html += ` el ${escapeHtml(signedAt)}`;
  html += `.`;
  html += `</div>`;

  html += `
</body>
</html>`;

  return html;
}

// Helper for time formatting
function formatTimeShort(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  } catch(e) {
    return '';
  }
}

// Make plan export available globally
window.exportPlanPDF = exportPlanPDF;

console.log('✓ Módulo pdf-export.js cargado');
