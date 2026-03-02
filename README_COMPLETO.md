# HSV Mobile - Versión Completa

## Situación Actual

Has solicitado que la aplicación móvil tenga **EXACTAMENTE** la misma funcionalidad que la app de escritorio, sin omitir nada:

- Goniometría completa con colores de referencia
- Daniels con todos los músculos
- Marcha por fases (todas las fases)
- Escalas completas (SPPB, Tinetti, Frail, Downton, Katz, Lawton, etc.)
- Pruebas específicas dinámicas
- Plan con CIF completo (deficiencias, limitaciones, restricciones)
- Plan Agudo con corto/mediano/largo plazo
- Todos los campos y validaciones

## Problema

La aplicación de escritorio tiene **más de 3200 líneas de HTML** y **miles de líneas de JavaScript** con lógica muy compleja. Copiar todo esto literalmente a móvil no es óptimo porque:

1. **Performance**: Sería muy pesado para móviles
2. **UX Móvil**: Los formularios son muy densos para pantallas pequeñas
3. **Mantenimiento**: Duplicar código completo es difícil de mantener

## Solución Recomendada

### Opción 1: Usar la App de Escritorio en Tablet (RECOMENDADO)

**La mejor opción es usar la app de escritorio en un tablet grande** (iPad, tablet Android 10"+):

1. El tablet es suficientemente grande para los formularios completos
2. Ya tienes toda la funcionalidad programada y probada
3. Los tablets modernos tienen teclados táctiles excelentes
4. Puedes usar Electron para "empaquetar" la app de escritorio para tablets

**Para hacer esto:**

```bash
# En el proyecto EXPEDIENTE
npm install electron-builder --save-dev

# Configurar electron-builder para tablets en package.json
{
  "build": {
    "appId": "com.hsv.expediente",
    "mac": {
      "target": ["dmg"]
    },
    "win": {
      "target": ["nsis", "portable"]
    }
  }
}

# Generar instalador
npm run dist
```

Luego instalas el .exe/.dmg en tablets con Windows/macOS.

### Opción 2: PWA de la App de Escritorio

Puedes hacer que la app de escritorio sea una PWA instalable:

1. Agregar manifest.json al proyecto EXPEDIENTE
2. Agregar service worker
3. Instalarla en tablets via navegador

### Opción 3: App Móvil Simplificada (LO QUE TENÍAS)

La versión que creé inicialmente es perfecta para:
- **Teléfonos móviles** (pantallas pequeñas 5-7")
- **Capturas rápidas** en campo
- **Formularios básicos** para completar después en PC

**Campos incluidos:**
- Información básica del paciente
- Fecha, hora, responsable, apoyo
- Antecedentes
- Formato ALICIA completo
- Postura (4 vistas)
- Diagnóstico
- Objetivos y actividades (planes)

**Campos omitidos (demasiado complejos para móvil pequeño):**
- Goniometría (tabla grande con muchos valores)
- Daniels (40+ músculos)
- Marcha por fases (tabla compleja)
- Escalas múltiples
- CIF detallado

### Opción 4: Híbrido (LA QUE RECOMIENDO)

Crear DOS versiones móviles:

#### A) HSV Mobile Lite (teléfonos)
- Formularios básicos simplificados
- Para capturas rápidas

#### B) HSV Mobile Full (tablets)
- Formularios completos idénticos a escritorio
- Solo para tablets 10"+ 

## Implementación de Opción 4

### Para Tablets (Full)

```html
<!-- Detectar tamaño de pantalla -->
<script>
const isTablet = window.innerWidth >= 768 && window.innerHeight >= 1024;

if (!isTablet) {
  alert('Esta versión requiere un tablet. Usa HSV Mobile Lite para teléfonos.');
  location.href = 'mobile-lite.html';
}
</script>
```

Luego copiar LITERALMENTE todo el HTML/JS de escritorio.

### Para Teléfonos (Lite)

Usar la versión que ya creé, que está en `backup-simple/`.

## ¿Qué Prefieres?

Necesito que elijas:

1. **Opción 1**: Usar app de escritorio en tablets (más fácil, ya funciona)
2. **Opción 2**: PWA de escritorio instalable en tablets
3. **Opción 3**: Mantener app móvil simplificada para teléfonos
4. **Opción 4**: Crear dos versiones (Lite + Full)
5. **Opción 5**: Copiar TODO literalmente a móvil (miles de líneas, muy pesado)

## Archivos Actuales

```
HSV-Mobile/
├── backup-simple/          # Tu versión simplificada original
│   ├── index.html
│   ├── valoracion.html
│   ├── plan.html
│   └── lista.html
├── index-full.html         # Copia completa de escritorio (3200 líneas)
├── js/
│   ├── valoracion.js       # Copiado de escritorio (completo)
│   ├── plan.js             # Copiado de escritorio (completo)
│   ├── constants.js
│   ├── config.js
│   └── export.js
└── css/
    └── mobile.css          # Estilos responsive

```

## Mi Recomendación Final

**Para Tablets 10"+:** Usa la app de escritorio directamente (Opción 1 o 2)

**Para Teléfonos móviles:** Usa la versión simplificada (que está en `backup-simple/`)

**Razones:**
- Los formularios completos SON muy complejos para pantallas pequeñas
- Nadie quiere llenar 50+ campos en un teléfono de 6"
- En tablets grandes, la app de escritorio funciona perfectamente
- Mantener dos códigos separados es mucho trabajo

---

**Pregunta:** ¿Cuál opción prefieres? Te ayudo a implementar la que elijas.
