# Sección de Escalas Estandarizadas

## Descripción General

Se ha agregado una nueva sección **Escalas Estandarizadas** al formulario de valoración fisioterapéutica. Esta sección:

- ✅ Es completamente independiente del formulario principal (no modifica nada del formato existente)
- ✅ Mantiene todos los datos de la valoración intactos al navegar entre escalas
- ✅ Permite completar 6 escalas clínicas estandarizadas
- ✅ Calcula puntajes automáticamente en tiempo real
- ✅ Requiere confirmación explícita para marcar como completada

---

## Escalas Disponibles

### 1. **SPPB** (Short Physical Performance Battery)
- **Máximo:** 12 puntos
- **Secciones:** Equilibrio, Marcha, Levantarse
- **Interpretación:**
  - ≥10: Función normal
  - 7-9: Discapacidad leve
  - <7: Discapacidad grave

### 2. **Tinetti** (Marcha y Equilibrio)
- **Máximo:** 28 puntos
- **Secciones:** Equilibrio (máx 6), Marcha (máx 12) + extras
- **Interpretación:**
  - ≥24: Bajo riesgo de caída
  - 18-23: Riesgo medio de caída
  - <18: Alto riesgo de caída

### 3. **Katz** (Actividades Básicas de la Vida Diaria)
- **Máximo:** 6 puntos
- **Secciones:** ABVD (Baño, Vestirse, WC, Movilidad, Continencia, Alimentación)
- **Interpretación:**
  - 6: Independiente
  - 4-5: Dependencia leve
  - <4: Dependencia moderada a grave

### 4. **Lawton** (Actividades Instrumentales de la Vida Diaria)
- **Máximo:** 8 puntos
- **Secciones:** AIVD (Teléfono, Compras, Comida, Casa, Lavado, Transporte, Medicinas, Dinero)
- **Interpretación:**
  - 8: Independencia completa
  - 6-7: Dependencia leve
  - <6: Dependencia moderada a grave

### 5. **FRAIL** (Fragilidad)
- **Máximo:** 5 puntos
- **Ítems:** Fatiga, Resistencia, Actividad, Marcha lenta, Pérdida de peso
- **Interpretación:**
  - 0: No frágil
  - 1-2: Pre-frágil
  - ≥3: Frágil

### 6. **Downton** (Riesgo de Caídas)
- **Máximo:** 5 puntos
- **Ítems:** Antecedente de caídas, Medicamentos de riesgo, Déficit sensorial, Estado mental, Marcha alterada
- **Interpretación:**
  - 0: Sin riesgo
  - 1: Riesgo bajo
  - ≥2: Riesgo alto

---

## Uso

### Acceder a una escala

1. En el formulario de valoración, ve a la sección **"Escalas Estandarizadas"**
2. Verás una tarjeta para cada escala mostrando:
   - Nombre de la escala
   - Estado: **⚪ No completada** o **✓ Completada**
   - Si está completada: **Total: X/MAX**
3. Haz clic en la tarjeta para abrir la escala

### Completar una escala

1. Se abre una vista dedicada con todos los ítems de la escala
2. Cada ítem tiene:
   - Etiqueta descriptiva
   - Campo de entrada numérica (0 a máximo)
   - Máximo permitido
3. **Las respuestas se guardan automáticamente** conforme escribes
4. La sección **"Resumen"** muestra:
   - Puntajes por sección
   - Puntaje total
   - Interpretación clínica

### Confirmar una escala

1. **Opción: Escala incompleta**
   - Botón: "✓ Confirmar escala completada"
   - Si falta algún ítem: ⚠️ Aviso "Por favor completa todos los ítems"
   - No se permite confirmar si hay ítems vacíos

2. **Opción: Escala completada**
   - Botón: "🔄 Editar escala"
   - Permite re-responder los ítems
   - Los datos se mantienen

3. **Después de confirmar:**
   - ✓ La escala se marca como "Completada"
   - ✓ Se guardan los puntajes finales
   - ✓ Se calcula la interpretación
   - ✓ Vuelves al formulario principal

---

## Integración con Valoración

### Guardado

Cuando **guardas la valoración** como borrador o la firmas:
- ✅ Se incluyen las escalas completadas en `payload.escalasEstandarizadas`
- ✅ Se preserva toda la información del resto del formulario
- ✅ No se pierde nada al navegar entre escalas

### Estructura de datos

```javascript
valoracion.escalasEstandarizadas = {
  "SPPB": {
    completed: true,
    total: 11,
    interpretation: "Función normal",
    responses: {
      "sppb_equilibrio": 4,
      "sppb_marcha": 4,
      "sppb_levantarse": 3
    }
  },
  "Tinetti": {
    completed: false,
    responses: { ... }
  },
  ...
}
```

### Edición de valoración existente

1. Al abrir una valoración para editar
2. Las escalas que ya estaban completadas se cargan automáticamente
3. Puedes:
   - Ver los resultados guardados
   - Editar la escala (clic en "🔄 Editar escala")
   - Re-confirmar con nuevos valores

---

## Flujo Completo

```
┌─────────────────────────────────┐
│  Nuevo Formulario de Valoración │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Sección Escalas Estandarizadas         │
│  - Lista de 6 escalas (No completadas)  │
│  - Estados visuales claros              │
└────────────┬────────────────────────────┘
             │ (clic en escala)
             ▼
┌──────────────────────────────────┐
│  Vista de Escala Dedicada        │
│  - Todos los ítems               │
│  - Respuestas se guardan auto    │
│  - Resumen en tiempo real        │
│  - Botón: Confirmar              │
└────────────┬─────────────────────┘
             │ (validación)
             ▼
  ¿Todos los ítems respondidos?
             │
       ┌─────┴──────┐
       │             │
      NO            SÍ
       │             │
       ▼             ▼
   ⚠️ Aviso   ✓ Marcar Completada
       │         Guardar Puntajes
       │             │
       └─────┬───────┘
             │ (volver a formulario)
             ▼
┌─────────────────────────────────┐
│  Formulario Principal            │
│  - Escala: ✓ Completada         │
│  - Puntaje: X/MAX visible       │
│  - Resto de campos intacto      │
└─────────────────────────────────┘
             │ (guardar/firmar)
             ▼
        Valoración Guardada
     (con escalas completadas)
```

---

## Notas Técnicas

- **Archivo principal:** `js/escalas.js`
- **Integración:** Cargado automáticamente en `index.html`
- **Dependencias:** Requiere que `window.showView()` esté disponible
- **Almacenamiento:** Se guarda en `payload.escalasEstandarizadas` de la valoración
- **Sin modificaciones:** El formulario principal (`index.html` lineas 920-1230) NO se modificó

---

## Ejemplo: Completar SPPB

1. Abre una nueva valoración
2. Scroll hasta "Escalas Estandarizadas"
3. Haz clic en "Short Physical Performance Battery (SPPB)"
4. Rellena los 3 ítems:
   - Equilibrio: 4
   - Marcha: 3
   - Levantarse: 2
5. Resumen automático:
   - Equilibrio: 4/4
   - Marcha: 3/4
   - Levantarse: 2/4
   - **Total: 9/12** → "Discapacidad leve"
6. Clic en "✓ Confirmar escala completada"
7. ✅ Escala marcada como Completada
8. Vuelves al formulario → ves "SPPB: ✓ Completada (9/12)"
9. Continúa rellenando el resto de la valoración y guarda

---

¡Listo! 🎉 La sección de escalas está completamente integrada y lista para usar.
