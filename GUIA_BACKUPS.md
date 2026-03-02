# 🛡️ Cómo Funcionan los Backups Automáticos

## 📊 Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                   TÚ TRABAJAS CON HORARIOS                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
        ┌────────────────────────────────────┐
        │  Guardas cambios en horarios       │
        │  (sesión, ausencia, vacación)     │
        └────────┬───────────────────────────┘
                 │
                 ↓ AUTOMÁTICAMENTE
        ┌────────────────────────────────────┐
        │   1. Se guardan en localStorage    │
        │   2. Se crea un backup automático  │
        └────────┬───────────────────────────┘
                 │
                 ↓
        ┌────────────────────────────────────┐
        │     Datos guardados con seguridad  │
        │                                    │
        │ ✅ horariosPersonalizados          │
        │ ✅ ausenciasUsuarias               │
        │ ✅ vacacionesPasantes              │
        │ ✅ backup_horarios_latest (copia)  │
        └────────────────────────────────────┘
```

## 🔄 Cuándo se hacen backups

Los backups automáticos se crean CADA VEZ que:

1. ✅ Guardas un horario o sesión
2. ✅ Guardas una ausencia de paciente
3. ✅ Guardas vacaciones de terapeuta
4. ✅ Haces cualquier cambio importante

**No tienes que hacer nada - ocurre automáticamente en segundo plano**

## 🚨 Si pierdes datos...

```
PASO 1: Abrir consola (F12 en el navegador)
        ↓
PASO 2: Ejecutar: restoreFromBackup()
        ↓
PASO 3: Los datos se restauran automáticamente
        ↓
PASO 4: ¡Listo! Tus horarios están de vuelta
```

## 📥 Descargar una copia en tu PC

```
PASO 1: Ir a ⚙️ Configuración en la app
        ↓
PASO 2: Buscar "🔒 Protección de Datos de Horarios"
        ↓
PASO 3: Hacer click en "📥 Descargar Backup de Horarios"
        ↓
PASO 4: Se descarga un archivo: backup_horarios_2025-01-22.json
        ↓
PASO 5: Guarda ese archivo en una carpeta importante (Documentos, etc)
```

## 🔄 Restaurar desde el archivo descargado

Si algo muy grave ocurre:

```
1. Contactar al desarrollador con tu archivo .json
2. El developer puede restaurar los datos usando el archivo
3. Tus datos se recuperan completamente
```

## ⏰ Timeline de Seguridad

```
14:32 - Guardas un horario
         ↓ Backup creado automáticamente

14:45 - Guardas una ausencia
         ↓ Backup actualizado automáticamente

15:00 - Descargas un backup manualmente
         ↓ Archivo JSON en tu PC

15:30 - Algo sale mal 😰
         ↓ Ejecutas restoreFromBackup()
         ↓ ¡Recuperado al estado de 14:45! 🎉
```

## 🎯 3 Niveles de Protección

### Nivel 1: Protección Local (Automática)
- localStorage guarda los datos
- Backup automático se crea con cada guardado
- Si el navegador se cierra, los datos persisten

### Nivel 2: Backup Manual (Tu PC)
- Descargas el JSON cuando quieras
- Lo guardas en tu computadora
- Tienes una copia física de seguridad

### Nivel 3: Recuperación de Desastres (Con Developer)
- Si todo falla, el archivo JSON que descargaste
- Puede ser restaurado completamente por el developer
- Nada se pierde permanentemente

## 📋 Checklist de Seguridad

- [ ] Entiendo cómo funcionan los backups automáticos
- [ ] He descargado un backup al menos una vez
- [ ] Guardo el archivo en un lugar seguro (Documentos, OneDrive, etc)
- [ ] Descargo un nuevo backup cada semana
- [ ] Sé cómo restaurar si algo sale mal (restoreFromBackup())

---

## 🚀 Resumen

**Tus datos están protegidos de 3 formas:**

1. **Se guardan automáticamente** ← No requiere acción
2. **Se hace backup automáticament** ← En segundo plano
3. **Puedes descargar copias** ← En tu PC como respaldo

**¡No pierderás tus horarios! 🛡️**
