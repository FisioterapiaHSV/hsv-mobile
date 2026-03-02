# 📅 Sección de Horarios - Guía de Uso

## Introducción

La nueva sección de **Horarios** permite gestionar de manera profesional y organizada todas las sesiones y talleres del centro. Está optimizada para dispositivos móviles con un diseño moderno y responsivo.

## Características Principales

### 1. **Visualización por Semana**
- Vista de lunes a sábado en tarjetas elegantes
- Navegación fácil entre semanas
- Muestra la fecha completa de cada día

### 2. **Tipos de Actividades**
- **Sesiones Individuales**: Sesiones de fisioterapia personalizadas (indicador verde)
- **Talleres**: Actividades grupales (indicador púrpura)

### 3. **Información Detallada por Horario**
Cada horario muestra:
- ⏰ Hora de inicio y fin
- 👤 / 🎨 Tipo de actividad
- 📍 Lugar donde se realiza
- 👨‍⚕️ Responsable de la actividad
- 📝 Notas adicionales (si las hay)

### 4. **Gestión de Actividades**
- **Nueva Sesión**: Crear sesiones personalizadas para usuarias
- **Nuevo Taller**: Agregar talleres grupales

## Cómo Usar

### Navegar en los Horarios

1. **Ir a la sección de Horarios**
   - Desde el menú principal, haz clic en "Horarios" (📅)

2. **Cambiar de semana**
   - Usa los botones "← Semana Anterior" y "Siguiente Semana →"
   - Se actualizará automáticamente la vista

3. **Ver actividades del día**
   - Cada tarjeta muestra un día completo
   - Las actividades están ordenadas por hora

### Agregar una Nueva Sesión

1. Haz clic en el botón **"➕ Nueva Sesión"**
2. Completa los siguientes datos:
   - **Usuaria**: Selecciona la persona
   - **Responsable**: Selecciona quién dirigirá la sesión
   - **Lugar**: Dónde se realizará
   - **Horario**: Hora inicio y fin
   - **Días**: Selecciona los días (puede ser recurrente)
   - **Notas**: Observaciones opcionales
3. Haz clic en **"Guardar Sesión"**

### Agregar un Nuevo Taller

1. Haz clic en el botón **"🎨 Nuevo Taller"**
2. Completa los siguientes datos:
   - **Nombre del Taller**: Elige uno predefinido o crea uno personalizado
   - **Responsable**: Quién dirigirá el taller
   - **Lugar**: Dónde se realizará
   - **Horario**: Hora inicio y fin
   - **Días**: Selecciona los días (puede ser recurrente)
   - **Descripción**: Detalles opcionales
3. Haz clic en **"Guardar Taller"**

### Talleres Predefinidos Disponibles

- 🎯 Cuidado de manos
- 🏃 Mantente activa
- 💃 Baile
- 🚶 Movimiento
- 🧩 Gimnasia cerebral
- 🧘 Alivio y relajación
- 🧘‍♀️ Yoga
- 🕉️ Meditación
- ✏️ Personalizado

## Diseño y Accesibilidad

### Características de Diseño

✅ **Responsivo**: Se adapta a cualquier tamaño de pantalla
✅ **Colores Profesionales**: Gradientes modernos y coherentes
✅ **Animaciones Suaves**: Transiciones elegantes
✅ **Modo Oscuro**: Compatible con preferencias del sistema
✅ **Accesibilidad**: Soporte para navegación por teclado

### Colores Utilizados

| Elemento | Color | Código |
|----------|-------|--------|
| Primario | Púrpura | #667eea |
| Primario Oscuro | Púrpura Oscuro | #764ba2 |
| Sesiones | Verde | #10b981 |
| Talleres | Púrpura Claro | #a855f7 |
| Fondo | Gris Claro | #f8fafc |

## Lugares Predefinidos

Puedes seleccionar entre los siguientes lugares:

**Para Sesiones:**
- Área de Fisioterapia
- Sala de sesiones
- Habitación
- Consultorio
- Jardín

**Para Talleres:**
- Área de Fisioterapia
- Sala de talleres
- Comedor
- Jardín
- Salón multiusos

## Datos de Ejemplo

La aplicación viene con algunos datos de ejemplo para que puedas ver cómo funciona:

**Sesiones:**
- María García: Lunes, Miércoles, Viernes (09:00-10:00)
- Carmen López: Martes, Jueves (10:30-11:30)

**Talleres:**
- Yoga: Lunes, Miércoles (14:00-15:30)
- Baile: Martes, Viernes (15:00-16:00)
- Cuidado de manos: Lunes, Jueves (11:00-12:00)

*Puedes borrar estos datos y agregar los tuyos propios.*

## Persistencia de Datos

⚠️ **Nota Importante**: Por ahora los datos se guardan en la memoria de la sesión. 

Para implementar persistencia real:
1. Conectar a una base de datos
2. O usar localStorage del navegador
3. O sincronizar con un servidor

Contáctame si necesitas implementar la persistencia.

## Navegación

En la parte inferior de la pantalla encontrarás el menú de navegación:

- 📊 **Valoraciones** - Ir a valoraciones
- 📋 **Planes** - Ir a planes
- 📅 **Horarios** - Estás aquí
- 📈 **Seguimiento** - Ir a seguimiento

## Solución de Problemas

### No veo los horarios que agregué
- Verifica que estén seleccionados los días correctos
- Comprueba que el día esté en la semana actual

### El modal no se abre
- Intenta actualizar la página (F5 o Ctrl+R)
- Verifica que JavaScript esté habilitado

### Los horarios no se guardan
- Los datos se guardan en la sesión actual
- Al cerrar el navegador se perderán (comportamiento actual)

## Futura Expansión

Se pueden agregar las siguientes características:
- ✏️ Edición de horarios existentes
- 🗑️ Eliminación de horarios
- 🔔 Notificaciones/recordatorios
- 📱 Sincronización con calendario del teléfono
- 📊 Estadísticas de asistencia
- 🔍 Búsqueda de horarios

## Contacto y Soporte

Si tienes preguntas o necesitas personalizar la sección de horarios, contacta con el equipo de desarrollo.

---

**Última actualización**: Diciembre 2025
**Versión**: 1.0
