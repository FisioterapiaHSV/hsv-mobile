// Sistema de exportación a JSON compatible con app de escritorio
function exportAll() {
  const valoraciones = JSON.parse(localStorage.getItem('hsv_valoraciones_v1') || '[]');
  const planes = JSON.parse(localStorage.getItem('hsv_plans_v1') || '[]');
  
  if (valoraciones.length === 0 && planes.length === 0) {
    showToast('No hay borradores para exportar', 'warning');
    return;
  }
  
  const exportData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    source: 'HSV Mobile',
    data: {
      valoraciones: valoraciones,
      planes: planes
    }
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  link.download = `HSV_Mobile_Export_${timestamp}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showToast(`Exportados ${valoraciones.length} valoraciones y ${planes.length} planes`, 'success');
}

function exportSingle(tipo, id) {
  const key = tipo === 'valoracion' ? 'hsv_valoraciones_v1' : 'hsv_plans_v1';
  const items = JSON.parse(localStorage.getItem(key) || '[]');
  const item = items.find(i => i.id === id);
  
  if (!item) {
    showToast('No se encontró el elemento', 'error');
    return;
  }
  
  const exportData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    source: 'HSV Mobile',
    data: tipo === 'valoracion' ? { valoraciones: [item] } : { planes: [item] }
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = tipo === 'valoracion' ? 
    `Valoracion_${item.paciente}_${timestamp}.json` :
    `Plan_${item.paciente}_${timestamp}.json`;
  link.download = filename;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showToast('Exportado correctamente', 'success');
}

function importJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const importData = JSON.parse(event.target.result);
        
        if (!importData.data) {
          throw new Error('Formato de archivo inválido');
        }
        
        let importedCount = 0;
        
        // Importar valoraciones
        if (importData.data.valoraciones && Array.isArray(importData.data.valoraciones)) {
          const existing = JSON.parse(localStorage.getItem('hsv_valoraciones_v1') || '[]');
          importData.data.valoraciones.forEach(val => {
            if (!existing.find(v => v.id === val.id)) {
              val.status = 'Borrador'; // Forzar como borrador
              existing.push(val);
              importedCount++;
            }
          });
          localStorage.setItem('hsv_valoraciones_v1', JSON.stringify(existing));
        }
        
        // Importar planes
        if (importData.data.planes && Array.isArray(importData.data.planes)) {
          const existing = JSON.parse(localStorage.getItem('hsv_plans_v1') || '[]');
          importData.data.planes.forEach(plan => {
            if (!existing.find(p => p.id === plan.id)) {
              plan.status = 'Borrador'; // Forzar como borrador
              existing.push(plan);
              importedCount++;
            }
          });
          localStorage.setItem('hsv_plans_v1', JSON.stringify(existing));
        }
        
        showToast(`Importados ${importedCount} elementos`, 'success');
        
        // Recargar si estamos en la lista
        if (typeof renderList === 'function') {
          renderList();
        }
      } catch (err) {
        showToast('Error al importar: ' + err.message, 'error');
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}

// ========================================
// FUNCIONES PARA EXPORTAR A PDF
// ========================================

// Generar PDF de la versión narrada (resumen clínico)
function exportValoracionNarradaPDF(id) {
  const valoraciones = JSON.parse(localStorage.getItem('hsv_valoraciones_v1') || '[]');
  const rec = valoraciones.find(v => v.id === id);
  
  if (!rec) {
    showToast('No se encontró la valoración', 'error');
    return;
  }
  
  // Generar HTML del contenido narrado
  const html = generateValoracionNarradaHTML(rec);
  
  // Crear ventana para imprimir
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Valoración Narrada - ${escapeHtml(rec.paciente)}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 20mm; max-width: 210mm; margin: 0 auto; line-height: 1.6; color: #1a1a1a; }
        h1 { font-size: 24px; margin-bottom: 8px; color: #2c5f2d; }
        h2 { font-size: 18px; margin-top: 16px; margin-bottom: 8px; color: #2c5f2d; }
        strong { font-weight: 600; }
        .header { margin-bottom: 20px; }
        .muted { color: #6b7280; font-size: 14px; }
        .thin-hr { border: none; border-top: 1px solid #e5e7eb; margin: 12px 0; }
        ul { margin: 6px 0 0 18px; padding: 0; }
        li { margin-bottom: 4px; }
        @media print {
          body { padding: 10mm; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      ${html}
      <div class="no-print" style="margin-top: 24px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #2c5f2d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">Imprimir / Guardar PDF</button>
        <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin-left: 10px;">Cerrar</button>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// Generar HTML de la valoración narrada
function generateValoracionNarradaHTML(rec) {
  let html = '';
  
  // Header
  const fecha = formatDateLongES(rec.fecha) || formatDateLongES(rec.updatedAt || rec.createdAt);
  const time = (rec.hora_start || '') + (rec.hora_end ? (' - ' + rec.hora_end) : '');
  
  html += `<div class="header">`;
  html += `<h1>Valoración Fisioterapéutica</h1>`;
  html += `<div class="muted">${escapeHtml(fecha)} ${time ? (' • ' + escapeHtml(time)) : ''}</div>`;
  html += `</div>`;
  
  html += `<div style="margin-bottom:10px"><strong>Paciente:</strong> ${escapeHtml(rec.paciente || '')}</div>`;
  html += `<div style="margin-bottom:10px"><strong>Habitación:</strong> ${escapeHtml(rec.habitacion || '')}</div>`;
  
  const responsableLabel = rec.responsable_signed || ((rec.responsable_prefix ? (rec.responsable_prefix + ' ') : '') + (rec.responsable || ''));
  html += `<div style="margin-bottom:10px"><strong>Responsable:</strong> ${escapeHtml(responsableLabel)}</div>`;
  
  const apoyoLabel = rec.apoyo ? ((rec.apoyo_prefix ? (rec.apoyo_prefix + ' ') : '') + rec.apoyo) : '';
  if (apoyoLabel) {
    html += `<div style="margin-bottom:10px"><strong>Apoyo:</strong> ${escapeHtml(apoyoLabel)}</div>`;
  }
  
  // Antecedentes
  const antecedentes = Array.isArray(rec.antecedentes) ? rec.antecedentes.filter(Boolean) : [];
  if (antecedentes.length) {
    html += `<div style="margin-top:12px"><strong>Antecedentes:</strong><ul>` + antecedentes.map(a => `<li>${escapeHtml(a)}</li>`).join('') + `</ul></div>`;
  } else {
    html += `<div style="margin-top:12px"><strong>Antecedentes:</strong> Sin antecedentes patológicos registrados.</div>`;
  }
  
  html += `<hr class="thin-hr">`;
  
  // Motivo / ALICIA - construcción narrativa
  const a = rec.alicia && rec.alicia.a ? rec.alicia.a.trim() : '';
  const l = rec.alicia && rec.alicia.l ? rec.alicia.l.trim() : '';
  const i = rec.alicia && rec.alicia.i ? rec.alicia.i.trim() : '';
  const c = rec.alicia && rec.alicia.c ? rec.alicia.c.trim() : '';
  const i2 = rec.alicia && rec.alicia.i2 ? String(rec.alicia.i2).trim() : '';
  const a2 = rec.alicia && rec.alicia.a2 ? rec.alicia.a2.trim() : '';
  
  let motivoParts = [];
  if (a) motivoParts.push(`El dolor apareció ${a}`);
  if (l) motivoParts.push(`se localiza en ${l}`);
  if (i) motivoParts.push(`irradiación: ${i}`);
  if (c) motivoParts.push(`se describe como ${c}`);
  if (i2) motivoParts.push(`intensidad ${i2}/10`);
  if (a2) motivoParts.push(`${a2}`);
  
  if (motivoParts.length) {
    html += `<div style="margin-top:10px"><strong>Motivo del dolor (ALICIA):</strong> ${escapeHtml(motivoParts.join(', '))}.`;
  }
  
  // Postura
  const posturaParts = [];
  if (rec.postura) {
    if (rec.postura.anterior) posturaParts.push(`Vista anterior: ${rec.postura.anterior.trim()}`);
    if (rec.postura.lateral) posturaParts.push(`vista lateral: ${rec.postura.lateral.trim()}`);
    if (rec.postura.posterior) posturaParts.push(`vista posterior: ${rec.postura.posterior.trim()}`);
    if (rec.postura.cefalo) posturaParts.push(`${rec.postura.cefalo.trim()}`);
  }
  if (posturaParts.length) {
    html += `<div style="margin-top:10px"><strong>Postura:</strong> ${escapeHtml(posturaParts.join('; '))}.</div>`;
  }
  
  // Goniometría resumen
  if (Array.isArray(rec.goniometria) && rec.goniometria.length) {
    // Agrupar por articulación para obtener todos los segmentos valorados
    const allJointsByName = {};
    rec.goniometria.forEach(g => {
      const joint = g.joint || '';
      if (!allJointsByName[joint]) {
        allJointsByName[joint] = [];
      }
      allJointsByName[joint].push(g);
    });

    const evaluatedJoints = Object.keys(allJointsByName);
    const alteredByJoint = {};
    const normalJoints = [];

    // Procesar cada articulación
    evaluatedJoints.forEach(joint => {
      const movements = allJointsByName[joint];
      let hasAlteration = false;

      movements.forEach(g => {
        const movement = g.movement || '';
        const expected = g.expected;
        let rightAltered = false, leftAltered = false;
        
        if (g.right != null && expected != null) {
          rightAltered = (g.right < (expected * 0.8));
        }
        if (g.left != null && expected != null) {
          leftAltered = (g.left < (expected * 0.8));
        }
        
        if (rightAltered || leftAltered) {
          hasAlteration = true;
          alteredByJoint[joint] = alteredByJoint[joint] || [];
          alteredByJoint[joint].push({ 
            movement: movement, 
            right: g.right != null ? g.right : null, 
            left: g.left != null ? g.left : null 
          });
        }
      });

      if (!hasAlteration) {
        normalJoints.push(joint);
      }
    });

    // Construir la narrativa
    html += `<div style="margin-top:10px"><strong>Goniometría:</strong> `;
    
    if (evaluatedJoints.length === 0) {
      html += `No se realizó valoración goniométrica.</div>`;
    } else {
      html += `Se valoraron los segmentos: ${escapeHtml(evaluatedJoints.join(', '))}. `;
      
      const alteredJoints = Object.keys(alteredByJoint);
      if (alteredJoints.length > 0) {
        const parts = [];
        alteredJoints.forEach(j => {
          const arr = alteredByJoint[j];
          const movParts = arr.map(item => {
            const sides = [];
            if (item.right != null) sides.push(`Der: ${item.right}°`);
            if (item.left != null) sides.push(`Izq: ${item.left}°`);
            return `${item.movement} (${sides.join('; ')})`;
          });
          parts.push(`${j}: ${movParts.join(', ')}`);
        });
        html += `Se encontraron alteraciones en: ${escapeHtml(parts.join('; '))}. `;
      }
      
      if (normalJoints.length > 0) {
        html += `Los segmentos ${escapeHtml(normalJoints.join(', '))} presentan rangos articulares conservados.`;
      } else if (alteredJoints.length > 0) {
        html += `El resto de los movimientos presentan rango funcional completo.`;
      } else {
        html += `Todos los segmentos valorados presentan rangos articulares conservados.`;
      }
      
      html += `</div>`;
    }
  }
  
  // Daniels (fuerza)
  if (Array.isArray(rec.daniels) && rec.daniels.length) {
    const groups = {};
    rec.daniels.forEach(d => {
      const v = (d.right != null ? d.right : d.left != null ? d.left : null);
      if (v == null) return;
      groups[v] = groups[v] || [];
      groups[v].push(d.muscle);
    });
    const parts = [];
    Object.keys(groups).sort((a, b) => b - a).forEach(k => {
      const muscles = Array.from(new Set(groups[k]));
      parts.push(`Fuerza ${k}/5 en ${muscles.join(' y ')}`);
    });
    html += `<div style="margin-top:10px"><strong>Fuerza muscular (Daniels):</strong> ${escapeHtml(parts.join('; '))}`;
    const comments = rec.daniels.map(d => d.comment).filter(Boolean);
    if (comments.length) html += ` — Observación: ${escapeHtml(comments.join(', '))}`;
    html += `</div>`;
  }
  
  // Marcha
  if (rec.marcha) {
    const m = rec.marcha;
    const phaseAlter = (m.phases || []).filter(p => p.rightAltered || p.leftAltered).map(p => p.phase);
    let marchText = '';
    if (phaseAlter.length) {
      marchText += `Alteraciones en fases: ${phaseAlter.join(', ')}.`;
    }
    if (m.description) marchText += (marchText ? ' ' : '') + m.description.trim() + '.';
    if (m.uses_aid) marchText += ` Utiliza ${m.aid_type || 'auxiliar de la marcha'}.`;
    if (marchText) {
      html += `<div style="margin-top:10px"><strong>Marcha:</strong> ${escapeHtml(marchText)}</div>`;
    }
  }
  
  // Escalas y pruebas
  if (rec.escalas) {
    const es = rec.escalas;
    const escalaParts = [];
    if (es.sppb && es.sppb.total != null) {
      escalaParts.push(`SPPB: ${es.sppb.total} pts (${interpretSPPB(es.sppb.total)})`);
    }
    if (es.tinetti && es.tinetti.total != null) {
      escalaParts.push(`Tinetti: ${es.tinetti.total} pts (${interpretTinetti(es.tinetti.total)})`);
    }
    if (es.frail && es.frail.score != null) {
      escalaParts.push(`FRAIL: ${es.frail.score} pts (${interpretFRAIL(es.frail.score)})`);
    }
    if (es.downton && es.downton.score != null) {
      escalaParts.push(`Downton: ${es.downton.score} pts (${interpretDownton(es.downton.score)})`);
    }
    if (es.katz && es.katz.score != null) {
      escalaParts.push(`Katz: ${es.katz.score} (${interpretKatz(es.katz.score)})`);
    }
    if (es.lawton && es.lawton.score != null) {
      escalaParts.push(`Lawton: ${es.lawton.score} pts (${interpretLawton(es.lawton.score)})`);
    }
    if (escalaParts.length) {
      html += `<div style="margin-top:10px"><strong>Escalas:</strong> ${escapeHtml(escalaParts.join('; '))}.</div>`;
    }
  }
  
  // Pruebas específicas
  if (Array.isArray(rec.pruebasEspecificas) && rec.pruebasEspecificas.length) {
    const pruebasParts = rec.pruebasEspecificas.map(p => (p.name || '') + (p.resultado ? (' — ' + p.resultado) : '')).filter(Boolean);
    if (pruebasParts.length) {
      html += `<div style="margin-top:10px"><strong>Pruebas específicas:</strong> ${escapeHtml(pruebasParts.join('; '))}.</div>`;
    }
  }
  
  html += `<hr class="thin-hr">`;
  
  // Diagnóstico
  if (rec.diagnostico) {
    html += `<div style="margin-top:12px"><strong>Diagnóstico fisioterapéutico:</strong><div style="font-weight:700;margin-top:6px">${escapeHtml(rec.diagnostico)}</div></div>`;
  }
  
  // Observaciones
  if (rec.observaciones) {
    html += `<div style="margin-top:10px"><strong>Observaciones:</strong> ${escapeHtml(rec.observaciones)}</div>`;
  }
  
  // Footer
  const signedBy = rec.responsable_signed || ((rec.responsable_prefix ? (rec.responsable_prefix + ' ') : '') + (rec.responsable || ''));
  const signedAt = rec.signedAt ? formatDateTimeES(rec.signedAt) : (rec.updatedAt ? formatDateTimeES(rec.updatedAt) : '');
  html += `<div style="margin-top:14px;color:#6b7280;font-size:14px">Valoración ${rec.status === 'Firmada' ? 'firmada' : 'guardada como borrador'} por ${escapeHtml(signedBy || '')} ${signedAt ? ('el ' + escapeHtml(signedAt)) : ''}.</div>`;
  
  return html;
}

// Generar PDF del formulario completo read-only
function exportValoracionFormularioCompletoPDF(id) {
  const valoraciones = JSON.parse(localStorage.getItem('hsv_valoraciones_v1') || '[]');
  const rec = valoraciones.find(v => v.id === id);
  
  if (!rec) {
    showToast('No se encontró la valoración', 'error');
    return;
  }
  
  // Generar HTML del formulario completo
  const html = generateValoracionFormularioCompletoHTML(rec);
  
  // Crear ventana para imprimir
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Formulario Completo - ${escapeHtml(rec.paciente)}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 20mm; max-width: 210mm; margin: 0 auto; line-height: 1.5; color: #1a1a1a; font-size: 13px; }
        h1 { font-size: 22px; margin-bottom: 8px; color: #2c5f2d; }
        h2 { font-size: 16px; margin-top: 16px; margin-bottom: 8px; color: #2c5f2d; }
        strong { font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { padding: 8px 6px; text-align: left; border-top: 1px solid #e5e7eb; }
        th { font-weight: 600; background: #f9fafb; }
        .muted { color: #6b7280; font-size: 13px; }
        .row-top-border { border-top: 1px solid #e5e7eb; }
        ul { margin: 6px 0 0 18px; padding: 0; }
        li { margin-bottom: 4px; }
        @media print {
          body { padding: 10mm; font-size: 11px; }
          .no-print { display: none; }
          h1 { font-size: 20px; }
          h2 { font-size: 14px; }
        }
      </style>
    </head>
    <body>
      ${html}
      <div class="no-print" style="margin-top: 24px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #2c5f2d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">Imprimir / Guardar PDF</button>
        <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin-left: 10px;">Cerrar</button>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// Generar HTML del formulario completo
function generateValoracionFormularioCompletoHTML(rec) {
  let html = '';
  
  // Header
  const fecha = formatDateLongES(rec.fecha) || formatDateLongES(rec.updatedAt || rec.createdAt);
  const time = (rec.hora_start || '') + (rec.hora_end ? (' - ' + rec.hora_end) : '');
  
  html += `<h1>Valoración Fisioterapéutica - Formulario Completo</h1>`;
  html += `<div class="muted" style="margin-bottom:12px">${escapeHtml(fecha)} ${time ? (' • ' + escapeHtml(time)) : ''}</div>`;
  html += `<div style="font-weight:700;margin-bottom:10px">Responsable: ${escapeHtml(rec.responsable_signed || ((rec.responsable_prefix ? (rec.responsable_prefix + ' ') : '') + (rec.responsable || '')))}</div>`;
  html += `<div style="margin-bottom:10px"><strong>Paciente:</strong> ${escapeHtml(rec.paciente || '')}</div>`;
  html += `<div style="margin-bottom:10px"><strong>Habitación:</strong> ${escapeHtml(rec.habitacion || '')}</div>`;
  
  // Antecedentes
  const antecedentes = Array.isArray(rec.antecedentes) ? rec.antecedentes.filter(Boolean) : [];
  if (antecedentes.length) {
    html += `<div style="margin-top:8px"><strong>Antecedentes:</strong><ul>` + antecedentes.map(a => `<li>${escapeHtml(a)}</li>`).join('') + `</ul></div>`;
  } else {
    html += `<div style="margin-top:8px"><strong>Antecedentes:</strong> Sin antecedentes patológicos registrados.</div>`;
  }
  
  // ALICIA campos completos
  html += `<div style="margin-top:10px"><strong>Motivo del dolor (ALICIA):</strong><div style="margin-top:6px">`;
  html += `<div><strong>Aparición / Inicio:</strong> ${escapeHtml((rec.alicia && rec.alicia.a) || '')}</div>`;
  html += `<div><strong>Localización:</strong> ${escapeHtml((rec.alicia && rec.alicia.l) || '')}</div>`;
  html += `<div><strong>Irradiación:</strong> ${escapeHtml((rec.alicia && rec.alicia.i) || '')}</div>`;
  html += `<div><strong>Características:</strong> ${escapeHtml((rec.alicia && rec.alicia.c) || '')}</div>`;
  html += `<div><strong>Intensidad (EVA):</strong> ${escapeHtml((rec.alicia && rec.alicia.i2) || '')}</div>`;
  html += `<div><strong>Atenuantes/Agravantes:</strong> ${escapeHtml((rec.alicia && rec.alicia.a2) || '')}</div>`;
  html += `</div></div>`;
  
  // Postura
  if (rec.postura) {
    html += `<div style="margin-top:10px"><strong>Postura:</strong><div style="margin-top:6px">`;
    if (rec.postura.anterior) html += `<div><strong>Anterior:</strong> ${escapeHtml(rec.postura.anterior)}</div>`;
    if (rec.postura.lateral) html += `<div><strong>Lateral:</strong> ${escapeHtml(rec.postura.lateral)}</div>`;
    if (rec.postura.posterior) html += `<div><strong>Posterior:</strong> ${escapeHtml(rec.postura.posterior)}</div>`;
    if (rec.postura.cefalo) html += `<div><strong>Céfalo-caudal:</strong> ${escapeHtml(rec.postura.cefalo)}</div>`;
    html += `</div></div>`;
  }
  
  // Goniometría tabla completa
  if (Array.isArray(rec.goniometria) && rec.goniometria.length) {
    html += `<div style="margin-top:10px"><strong>Goniometría (valores capturados):</strong><table><thead><tr><th>Segmento</th><th>Movimiento</th><th style="text-align:center">Derecha</th><th style="text-align:center">Izquierda</th></tr></thead><tbody>`;
    rec.goniometria.forEach(g => {
      html += `<tr class="row-top-border"><td>${escapeHtml(g.joint || '')}</td><td>${escapeHtml(g.movement || '')}</td><td style="text-align:center">${g.right != null ? escapeHtml(String(g.right) + '°') : '–'}</td><td style="text-align:center">${g.left != null ? escapeHtml(String(g.left) + '°') : '–'}</td></tr>`;
    });
    html += `</tbody></table></div>`;
  }
  
  // Daniels tabla read-only
  if (Array.isArray(rec.daniels) && rec.daniels.length) {
    html += `<div style="margin-top:10px"><strong>Fuerza muscular (Daniels) — valores registrados:</strong><table><thead><tr><th>Músculo</th><th style="text-align:center">Derecha</th><th style="text-align:center">Izquierda</th><th>Comentario</th></tr></thead><tbody>`;
    rec.daniels.forEach(d => {
      html += `<tr class="row-top-border"><td>${escapeHtml(d.muscle || '')}</td><td style="text-align:center">${d.right != null ? escapeHtml(String(d.right)) : '–'}</td><td style="text-align:center">${d.left != null ? escapeHtml(String(d.left)) : '–'}</td><td>${escapeHtml(d.comment || '')}</td></tr>`;
    });
    html += `</tbody></table></div>`;
  }
  
  // Marcha completa
  if (rec.marcha) {
    html += `<div style="margin-top:10px"><strong>Marcha:</strong>`;
    if (Array.isArray(rec.marcha.phases) && rec.marcha.phases.length) {
      html += `<div style="margin-top:6px"><table><thead><tr><th>Fase</th><th style="text-align:center">Derecha</th><th style="text-align:center">Izquierda</th></tr></thead><tbody>`;
      rec.marcha.phases.forEach(p => {
        html += `<tr class="row-top-border"><td>${escapeHtml(p.phase || '')}</td><td style="text-align:center">${p.rightAltered ? '⚠️ Alterado' : '✓ Normal'}</td><td style="text-align:center">${p.leftAltered ? '⚠️ Alterado' : '✓ Normal'}</td></tr>`;
      });
      html += `</tbody></table></div>`;
    }
    if (rec.marcha.description) html += `<div style="margin-top:6px"><strong>Descripción:</strong> ${escapeHtml(rec.marcha.description)}</div>`;
    if (rec.marcha.uses_aid) html += `<div style="margin-top:6px"><strong>Auxiliar de la marcha:</strong> ${escapeHtml(rec.marcha.aid_type || 'Sí')}</div>`;
    html += `</div>`;
  }
  
  // Escalas tabla
  if (rec.escalas) {
    const es = rec.escalas;
    html += `<div style="margin-top:10px"><strong>Escalas funcionales:</strong><table><thead><tr><th>Escala</th><th style="text-align:center">Valor</th><th>Detalles</th><th>Interpretación</th></tr></thead><tbody>`;
    
    if (es.sppb) {
      const sppbTotal = es.sppb.total != null ? escapeHtml(String(es.sppb.total)) : '–';
      const sppbDetails = `Balance: ${es.sppb.components ? escapeHtml(String(es.sppb.components.balance != null ? es.sppb.components.balance : '–')) : '–'}; Gait: ${es.sppb.components ? escapeHtml(String(es.sppb.components.gait != null ? es.sppb.components.gait : '–')) : '–'}; Chair: ${es.sppb.components ? escapeHtml(String(es.sppb.components.chair != null ? es.sppb.components.chair : '–')) : '–'}`;
      html += `<tr style="border-top:1px solid #e5e7eb"><td>SPPB</td><td style="text-align:center">${sppbTotal}</td><td>${sppbDetails}</td><td>${escapeHtml(interpretSPPB(es.sppb.total))}</td></tr>`;
    }
    
    if (es.tinetti) {
      const tinettiTotal = es.tinetti.total != null ? escapeHtml(String(es.tinetti.total)) : '–';
      const tinettiDetails = `Gait: ${es.tinetti.gait != null ? escapeHtml(String(es.tinetti.gait)) : '–'}; Balance: ${es.tinetti.balance != null ? escapeHtml(String(es.tinetti.balance)) : '–'}`;
      html += `<tr style="border-top:1px solid #e5e7eb"><td>Tinetti</td><td style="text-align:center">${tinettiTotal}</td><td>${tinettiDetails}</td><td>${escapeHtml(interpretTinetti(es.tinetti.total))}</td></tr>`;
    }
    
    if (es.frail) html += `<tr style="border-top:1px solid #e5e7eb"><td>FRAIL</td><td style="text-align:center">${es.frail.score != null ? escapeHtml(String(es.frail.score)) : '–'}</td><td>${escapeHtml(es.frail.details || '')}</td><td>${escapeHtml(interpretFRAIL(es.frail.score))}</td></tr>`;
    if (es.downton) html += `<tr style="border-top:1px solid #e5e7eb"><td>Downton</td><td style="text-align:center">${es.downton.score != null ? escapeHtml(String(es.downton.score)) : '–'}</td><td>${escapeHtml(es.downton.details || '')}</td><td>${escapeHtml(interpretDownton(es.downton.score))}</td></tr>`;
    if (es.katz) html += `<tr style="border-top:1px solid #e5e7eb"><td>Katz</td><td style="text-align:center">${es.katz.score != null ? escapeHtml(String(es.katz.score)) : '–'}</td><td>${escapeHtml(es.katz.details || '')}</td><td>${escapeHtml(interpretKatz(es.katz.score))}</td></tr>`;
    if (es.lawton) html += `<tr style="border-top:1px solid #e5e7eb"><td>Lawton</td><td style="text-align:center">${es.lawton.score != null ? escapeHtml(String(es.lawton.score)) : '–'}</td><td>${escapeHtml(es.lawton.details || '')}</td><td>${escapeHtml(interpretLawton(es.lawton.score))}</td></tr>`;
    
    html += `</tbody></table></div>`;
  }
  
  // Pruebas específicas
  if (Array.isArray(rec.pruebasEspecificas) && rec.pruebasEspecificas.length) {
    html += `<div style="margin-top:10px"><strong>Pruebas específicas:</strong><ul>` + rec.pruebasEspecificas.map(t => `<li>${escapeHtml((t.name || '') + (t.resultado ? (' — ' + t.resultado) : ''))}</li>`).join('') + `</ul></div>`;
  }
  
  // Diagnóstico
  if (rec.diagnostico) {
    html += `<div style="margin-top:12px"><strong>Diagnóstico fisioterapéutico:</strong><div style="font-weight:700;margin-top:6px">${escapeHtml(rec.diagnostico)}</div></div>`;
  }
  
  // Observaciones
  if (rec.observaciones) {
    html += `<div style="margin-top:10px"><strong>Observaciones:</strong> ${escapeHtml(rec.observaciones)}</div>`;
  }
  
  // Footer
  const signedBy = rec.responsable_signed || ((rec.responsable_prefix ? (rec.responsable_prefix + ' ') : '') + (rec.responsable || ''));
  const signedAt = rec.signedAt ? formatDateTimeES(rec.signedAt) : (rec.updatedAt ? formatDateTimeES(rec.updatedAt) : '');
  html += `<div style="margin-top:14px;color:#6b7280;font-size:14px">Valoración ${rec.status === 'Firmada' ? 'firmada' : 'guardada como borrador'} por ${escapeHtml(signedBy || '')} ${signedAt ? ('el ' + escapeHtml(signedAt)) : ''}.</div>`;
  
  return html;
}

// Funciones auxiliares de interpretación
function interpretSPPB(score) {
  if (score == null) return '';
  if (score <= 3) return 'Rendimiento físico muy bajo';
  if (score <= 6) return 'Rendimiento físico bajo';
  if (score <= 9) return 'Rendimiento físico moderado';
  return 'Rendimiento físico alto';
}

function interpretTinetti(score) {
  if (score == null) return '';
  if (score < 19) return 'Alto riesgo de caídas';
  if (score <= 23) return 'Riesgo moderado de caídas';
  return 'Bajo riesgo de caídas';
}

function interpretFRAIL(score) {
  if (score == null) return '';
  if (score === 0) return 'Robusto';
  if (score <= 2) return 'Pre-frágil';
  return 'Frágil';
}

function interpretDownton(score) {
  if (score == null) return '';
  if (score <= 2) return 'Riesgo bajo de caídas';
  return 'Riesgo alto de caídas';
}

function interpretKatz(score) {
  if (score == null) return '';
  if (score === 6) return 'Independiente';
  if (score >= 4) return 'Dependencia leve';
  if (score >= 2) return 'Dependencia moderada';
  return 'Dependencia severa';
}

function interpretLawton(score) {
  if (score == null) return '';
  if (score === 8) return 'Independiente';
  if (score >= 6) return 'Dependencia leve';
  if (score >= 4) return 'Dependencia moderada';
  return 'Dependencia severa';
}

// Helper para escapar HTML
function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Helper para formatear fechas
function formatDateLongES(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
}

function formatDateTimeES(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch (e) {
    return dateStr;
  }
}
