# Cómo Importar Borradores del Móvil a la PC

## Proceso de Importación

Los archivos JSON exportados desde la aplicación móvil contienen valoraciones y planes con `status: "Borrador"`, lo que significa que al importarlos en la aplicación de escritorio aparecerán como borradores editables, no como documentos firmados.

## Pasos para Importar

### Opción 1: Importación Manual al localStorage

1. **Exporta desde el móvil**: Usa el botón "Exportar Todo" en la app móvil
2. **Transfiere el archivo JSON** a tu PC (email, USB, Drive, etc.)
3. **Abre la aplicación de escritorio**
4. **Abre las DevTools** (F12 en Electron)
5. **En la consola**, ejecuta:

```javascript
// Leer el archivo JSON (pegalo aquí)
const importData = {
  // ... pega aquí el contenido del archivo JSON exportado
};

// Importar valoraciones
if (importData.data.valoraciones) {
  const existing = JSON.parse(localStorage.getItem('hsv_valoraciones_v1') || '[]');
  importData.data.valoraciones.forEach(val => {
    if (!existing.find(v => v.id === val.id)) {
      existing.push(val);
    }
  });
  localStorage.setItem('hsv_valoraciones_v1', JSON.stringify(existing));
  console.log('✅ Importadas', importData.data.valoraciones.length, 'valoraciones');
}

// Importar planes
if (importData.data.planes) {
  const existing = JSON.parse(localStorage.getItem('hsv_plans_v1') || '[]');
  importData.data.planes.forEach(plan => {
    if (!existing.find(p => p.id === plan.id)) {
      existing.push(plan);
    }
  });
  localStorage.setItem('hsv_plans_v1', JSON.stringify(existing));
  console.log('✅ Importados', importData.data.planes.length, 'planes');
}

// Refrescar la vista
location.reload();
```

### Opción 2: Crear Utilidad de Importación en la App de Escritorio

Puedes agregar un botón de importación en la app de escritorio:

```javascript
// En index.html, agregar:
<button onclick="importFromMobile()">📥 Importar desde Móvil</button>

// En js/main.js o un archivo nuevo, agregar:
function importFromMobile() {
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
        
        if (!importData.data || importData.source !== 'HSV Mobile') {
          alert('Formato de archivo inválido');
          return;
        }
        
        let total = 0;
        
        // Importar valoraciones
        if (importData.data.valoraciones) {
          const vals = JSON.parse(localStorage.getItem('hsv_valoraciones_v1') || '[]');
          importData.data.valoraciones.forEach(val => {
            if (!vals.find(v => v.id === val.id)) {
              vals.push(val);
              total++;
            }
          });
          localStorage.setItem('hsv_valoraciones_v1', JSON.stringify(vals));
        }
        
        // Importar planes
        if (importData.data.planes) {
          const plans = JSON.parse(localStorage.getItem('hsv_plans_v1') || '[]');
          importData.data.planes.forEach(plan => {
            if (!plans.find(p => p.id === plan.id)) {
              plans.push(plan);
              total++;
            }
          });
          localStorage.setItem('hsv_plans_v1', JSON.stringify(plans));
        }
        
        alert(`✅ Importados ${total} elementos correctamente`);
        location.reload();
        
      } catch (err) {
        alert('Error al importar: ' + err.message);
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}
```

## Formato del Archivo JSON

El archivo exportado tiene esta estructura:

```json
{
  "version": "1.0.0",
  "exportDate": "2025-12-02T17:00:00.000Z",
  "source": "HSV Mobile",
  "data": {
    "valoraciones": [
      {
        "id": "val_1234567890_abc123",
        "paciente": "Nombre del Paciente",
        "fecha": "2025-12-02",
        "status": "Borrador",
        ...
      }
    ],
    "planes": [
      {
        "id": "plan_1234567890_xyz789",
        "paciente": "Nombre del Paciente",
        "fecha": "2025-12-02",
        "status": "Borrador",
        ...
      }
    ]
  }
}
```

## Importante

- ✅ Los elementos importados aparecerán como **Borradores** en la app de escritorio
- ✅ Podrás **editarlos y firmarlos** normalmente
- ✅ **No se duplicarán** si importas el mismo archivo varias veces (se valida por ID)
- ⚠️ Asegúrate de que el **nombre del paciente coincida** con los expedientes existentes
- 💡 Puedes importar múltiples archivos JSON secuencialmente

## Validación de Datos

Antes de firmar los borradores importados, verifica:

1. ✅ Nombre del paciente correcto
2. ✅ Fecha y horas correctas
3. ✅ Responsable y apoyo asignados
4. ✅ Toda la información clínica completa
5. ✅ Diagnóstico o intervenciones claras

## Respaldo

Antes de importar, considera hacer un respaldo:

```javascript
// Exportar datos actuales
const backup = {
  valoraciones: localStorage.getItem('hsv_valoraciones_v1'),
  planes: localStorage.getItem('hsv_plans_v1')
};
console.log('Backup:', JSON.stringify(backup));
// Guarda este JSON por si necesitas restaurar
```

---

**Hogar San Vicente** - Sistema de Importación Móvil
