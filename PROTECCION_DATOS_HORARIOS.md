# 🔒 Sistema de Protección de Datos de Horarios

## Cómo se guardan tus datos

Los horarios se guardan automáticamente en **localStorage** de tu navegador bajo las siguientes claves:

| Clave | Contenido |
|-------|-----------|
| `horariosPersonalizados` | Todos los horarios, sesiones y talleres |
| `ausenciasUsuarias` | Ausencias de pacientes |
| `vacacionesPasantes` | Vacaciones de terapeutas |

## 🛡️ Sistema de Backup Automático

He agregado un sistema de backup automático que:

1. **Se activa automáticamente** cada vez que guardas cambios en horarios, ausencias o vacaciones
2. **Guarda una copia** en la clave `backup_horarios_latest` de localStorage
3. **Incluye timestamp** para saber cuándo fue el último backup

### Cómo funcionan los backups:

```javascript
// Los backups se crean automáticamente cuando:
guardarHorariosPersonalizados()  // Guardas un horario
guardarAusenciasUsuarias()        // Guardas una ausencia
guardarVacacionesPasantes()       // Guardas vacaciones
```

## 📥 Descargar un Backup

Para descargar un backup de todos tus datos en un archivo JSON:

**En la consola del navegador (F12 → Console):**
```javascript
descargarBackup()
```

Esto descargará un archivo `backup_horarios_FECHA.json` con:
- Todos los horarios
- Todas las ausencias
- Todas las vacaciones
- Timestamp del backup

## 🔄 Restaurar desde Backup

Si accidentalmente pierdes datos:

**En la consola del navegador (F12 → Console):**
```javascript
restoreFromBackup()
```

Esto restaurará el último backup guardado automáticamente.

## ⚠️ CUIDADO: No llames a limpiarCache()

Existe una función `limpiarCache()` que **BORRA TODOS** los horarios:

❌ **NO hagas esto:**
```javascript
limpiarCache()  // ¡ESTO BORRA TODO!
```

Usa `descargarBackup()` primero si necesitas una copia.

## 📋 Checklist de Seguridad

- ✅ Los backups se crean automáticamente cuando guardas
- ✅ Puedes descargar backups manualmente con `descargarBackup()`
- ✅ Puedes restaurar con `restoreFromBackup()` si algo sale mal
- ✅ Los datos se guardan en localStorage (persistente entre sesiones)
- ✅ Cada navegador/dispositivo tiene su propia copia

## 🔍 Ver qué datos tienes guardados

En la consola (F12 → Console):

```javascript
// Ver todos los datos de horarios
console.log(JSON.parse(localStorage.getItem('horariosPersonalizados')))

// Ver las ausencias
console.log(JSON.parse(localStorage.getItem('ausenciasUsuarias')))

// Ver las vacaciones
console.log(JSON.parse(localStorage.getItem('vacacionesPasantes')))

// Ver el último backup
console.log(JSON.parse(localStorage.getItem('backup_horarios_latest')))
```

## 💾 Recomendación

**Descarga un backup regularmente** para tener una copia en tu computadora:

1. Abre la consola (F12)
2. Ejecuta `descargarBackup()`
3. Guarda el archivo en una carpeta segura
4. Repite cada semana o después de cambios importantes

---

**Si pierdes datos por accidente:**
1. Corre `restoreFromBackup()` en la consola
2. Si eso no funciona, recupera el archivo JSON que descargaste
3. Contacta al desarrollador si necesitas ayuda
