# Estado Actual - HSV Tablet

## Problemas Identificados

### 1. Plan: No cambia entre Agudo/Crónico
**Causa:** El módulo `plan.js` tiene un listener que no se activa en la app tablet.

**Solución Temporal:** Agregué manualmente el toggle en `initializePlanView()` en index.html.

**Prueba:**
1. Abre "Nuevo Plan"
2. Cambia el selector "Tipo de padecimiento" entre Crónico y Agudo
3. Debe mostrar/ocultar las secciones correspondientes

### 2. Plan: Deficiencias CIF no completas
**Causa:** El botón "+ Agregar estructura" no funciona porque el módulo plan.js no se inicializa.

**Necesita:** Los listeners del módulo original plan.js deben conectarse.

### 3. Valoración: Goniometría sin datos
**Causa:** La función `renderGoniTables()` del módulo valoracion.js no se ejecuta al abrir la vista.

**Problema:** Los datos de referencia (rangos normales, colores) están en el módulo pero no se renderizan.

### 4. Valoración: No pide cantidad en goniometría
**Causa:** Los inputs dinámicos no se crean porque `renderGoniList()` no se ejecuta.

## Problema Fundamental

Los módulos `valoracion.js` y `plan.js` están envueltos en IIFEs (funciones auto-ejecutables) que:

1. Se ejecutan inmediatamente al cargar
2. Buscan elementos del DOM que aún no existen (porque están en vistas ocultas)
3. No exponen funciones públicas para re-inicializar

## Soluciones Posibles

### Opción A: Modificar los módulos JS originales (NO RECOMENDADO)
- Cambiaría el código de la app de escritorio
- Riesgo de romper funcionalidad existente

### Opción B: Crear wrappers (ACTUAL)
- Crear funciones wrapper que llamen a las funciones internas
- Problema: Las funciones están en scope cerrado

### Opción C: Reescribir módulos para tablet (RECOMENDADO)
- Crear versiones simplificadas de valoracion.js y plan.js
- Específicas para tablet
- Mantener compatibilidad de datos

### Opción D: Usar iframe con app original
- Cargar la app de escritorio completa en iframe
- Interceptar solo el guardado
- Más pesado pero 100% compatible

## Recomendación

Para que TODO funcione correctamente necesitas elegir:

**1. Reescribir módulos JS para tablet** (2-3 horas de trabajo)
   - Pro: Funciona perfectamente
   - Pro: Código limpio y mantenible
   - Contra: Hay que programar todo de nuevo

**2. Modificar módulos originales** (30 minutos)
   - Pro: Rápido
   - Contra: Puede romper app de escritorio
   - Contra: Necesita testing extensivo

**3. Usar app de escritorio en iframe** (15 minutos)
   - Pro: Muy rápido
   - Pro: 100% compatible
   - Contra: Más pesado

## ¿Qué prefieres?

Dime qué opción prefieres y procedo a implementarla.
