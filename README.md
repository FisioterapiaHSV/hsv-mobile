# HSV Mobile - Valoraciones y Planes

Aplicación web progresiva (PWA) para crear valoraciones y planes de tratamiento en dispositivos móviles y tablets.

## Características

- ✅ **Offline First**: Funciona sin conexión a internet
- 📱 **Responsive**: Optimizado para móviles y tablets
- 💾 **Exportación JSON**: Compatible con la aplicación de escritorio
- 🔄 **Sincronización**: Los borradores se exportan para importar en PC
- 🎨 **Touch Friendly**: Interfaz optimizada para pantallas táctiles

## Instalación en Dispositivo Móvil

### iOS (iPhone/iPad)

1. Abre Safari y navega a la URL de la aplicación
2. Toca el botón "Compartir" (icono de cuadrado con flecha)
3. Desplázate y selecciona "Agregar a pantalla de inicio"
4. Toca "Agregar" en la esquina superior derecha

### Android (Chrome)

1. Abre Chrome y navega a la URL de la aplicación
2. Toca el menú (⋮) en la esquina superior derecha
3. Selecciona "Agregar a pantalla de inicio" o "Instalar aplicación"
4. Confirma tocando "Agregar"

## Uso

### Crear Nueva Valoración

1. Desde el menú principal, toca **"Nueva Valoración"**
2. Completa todos los campos requeridos:
   - Información del paciente
   - Fecha y horas
   - Responsable y apoyo
   - Antecedentes
   - Formato ALICIA
   - Postura
   - Goniometría (opcional)
   - Escalas (opcional)
   - Diagnóstico
3. Toca **"Guardar Borrador"** para guardar localmente

### Crear Nuevo Plan

1. Desde el menú principal, toca **"Nuevo Plan"**
2. Completa los campos:
   - Información del paciente
   - Fecha programada y horas
   - Responsable y apoyo
   - Tipo de plan (Crónico/Agudo)
   - Objetivos y actividades
3. Toca **"Guardar Borrador"**

### Exportar a PC

1. Crea tus valoraciones/planes en el móvil
2. Desde el menú principal, toca **"Exportar Todo"**
3. Se descargará un archivo JSON
4. Envía el archivo a tu PC (email, drive, airdrop, etc.)
5. En la PC, usa la función de importación para cargar los borradores

## Formato de Exportación

Los archivos JSON exportados contienen:

```json
{
  "version": "1.0.0",
  "exportDate": "2025-12-02T17:00:00.000Z",
  "source": "HSV Mobile",
  "data": {
    "valoraciones": [...],
    "planes": [...]
  }
}
```

Todos los elementos exportados tienen `status: "Borrador"` para que aparezcan en el localStorage de la aplicación de escritorio al importarlos.

## Estructura de Datos

### Valoración

- `id`: Identificador único
- `paciente`: Nombre del paciente
- `fecha`: Fecha de la valoración (YYYY-MM-DD)
- `hora_start`, `hora_end`: Horas de inicio y fin
- `tipo`: Tipo de valoración (Inicial, Trimestral, Egreso, Reingreso)
- `responsable`: Nombre del responsable
- `responsable_prefix`: Prefijo (PSS, LFT, EF)
- `apoyo`: Nombre del apoyo (opcional)
- `apoyo_prefix`: Prefijo del apoyo
- `status`: "Borrador" o "Firmada"
- `antecedentes`: Array de antecedentes
- `alicia`: Objeto con formato ALICIA
- `postura`: Objeto con vistas posturales
- `goniometria`: Array de mediciones goniométricas
- `escalas`: Objeto con escalas de valoración
- `diagnostico`: Texto del diagnóstico
- `createdAt`, `updatedAt`: Timestamps

### Plan

- `id`: Identificador único
- `paciente`: Nombre del paciente
- `fecha`: Fecha programada (YYYY-MM-DD)
- `hora_start`, `hora_end`: Horas programadas
- `hora_real_start`, `hora_real_end`: Horas reales (opcional)
- `tipo`: "Crónico" o "Agudo"
- `responsable`: Nombre del responsable
- `responsable_prefix`: Prefijo
- `apoyo`: Nombre del apoyo (opcional)
- `status`: "Borrador" o "Firmado"
- `objetivos`: Array de objetivos
- `actividades`: Array de actividades/intervenciones
- `createdAt`, `updatedAt`: Timestamps

## Almacenamiento Local

Los datos se guardan en localStorage del navegador:

- `hsv_mobile_valoraciones`: Array de valoraciones
- `hsv_mobile_planes`: Array de planes

## Compatibilidad

- ✅ iOS 12.2+ (Safari)
- ✅ Android 5.0+ (Chrome)
- ✅ Tablets (iPad, Android tablets)
- ✅ Navegadores modernos con soporte para:
  - Service Workers
  - LocalStorage
  - File Download API

## Desarrollo Local

Para probar la aplicación localmente:

1. Abre `index.html` en un navegador moderno
2. O usa un servidor HTTP local:
   ```bash
   python -m http.server 8000
   # o
   npx serve
   ```
3. Navega a `http://localhost:8000`

## Notas Importantes

- ⚠️ **Los borradores solo existen en tu dispositivo** hasta que los exportes
- 💾 **Exporta regularmente** para no perder tu trabajo
- 🔒 **No hay sincronización automática** - debes exportar manualmente
- 📱 **Limpia el cache** del navegador con precaución, perderás los borradores locales

## Soporte

Para problemas o sugerencias, contacta al equipo de desarrollo de HSV.

---

**Hogar San Vicente** - Versión Móvil 1.0.0
