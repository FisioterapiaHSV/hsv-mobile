# 🏥 HSV TABLET - App Completa para Tablets/iPads

## ✅ QUÉ TIENE

**Formularios COMPLETOS** exactamente iguales a la app de escritorio:

- ✅ **Valoración completa** con:
  - Formato ALICIA
  - Postura (4 vistas)
  - Goniometría completa (40+ movimientos)
  - Daniels (40+ músculos)
  - Marcha por fases
  - Escalas (SPPB, Tinetti, Frail, Downton, Katz, Lawton)
  - Pruebas específicas
  - Diagnóstico

- ✅ **Plan completo** con:
  - Plan Crónico (objetivo general y plan)
  - Plan Agudo (corto/mediano/largo plazo)
  - CIF (deficiencias, limitaciones, restricciones)
  - Responsable, apoyo, motivo

- ✅ **Exportación JSON** compatible con app de escritorio
- ✅ **Detección automática** de tamaño de pantalla
- ✅ **Offline** con Service Worker

## 📱 REQUISITOS

**SOLO funciona en tablets/iPads** con:
- Ancho mínimo: 768px
- Alto mínimo: 1000px

**Dispositivos compatibles:**
- ✅ iPad (cualquier modelo)
- ✅ iPad Pro
- ✅ Tablets Android 10" o más
- ✅ Surface Pro
- ❌ NO funciona en teléfonos (pantalla muy pequeña)

## 🚀 CÓMO USAR

### Opción 1: Abrir Directamente
1. Copia la carpeta `HSV-Mobile` a tu tablet
2. Abre `index.html` con Safari (iOS) o Chrome (Android)

### Opción 2: Servidor Local (para desarrollo)
```bash
cd HSV-Mobile
python -m http.server 8080
```
Luego abre `http://localhost:8080` en el tablet

### Opción 3: Subir a Internet
- Sube la carpeta completa a un servidor web
- Accede desde el tablet via HTTPS
- Instala como PWA

## 📖 FLUJO DE USO

1. **Ingresa nombre del paciente**
   - Al abrir aparece pantalla para ingresar nombre
   - Escribe el nombre completo
   - Presiona "Continuar"

2. **Selecciona acción**
   - Nueva Valoración → Formulario completo
   - Nuevo Plan → Formulario completo
   - Mis Borradores → Ver guardados
   - Exportar → Descargar JSON

3. **Completa el formulario**
   - Todos los campos funcionan igual que en PC
   - Toca "Guardar como borrador" para guardar
   - O toca "Firmar" para finalizar

4. **Exporta a JSON**
   - Ve a menú principal
   - Toca "Exportar"
   - Se descarga archivo JSON
   - Envía el archivo a tu PC (email, drive, airdrop)

5. **Importa en PC**
   - Abre app de escritorio
   - Usa función de importación (ver IMPORTAR_A_PC.md)
   - Los borradores aparecerán en la app de PC

## ⚠️ IMPORTANTE

- **Los datos se guardan en el navegador** del tablet
- **Si borras datos del navegador, pierdes los borradores**
- **Exporta regularmente** para no perder tu trabajo
- **Un paciente a la vez** (cambia paciente desde el menú)

## 🔧 ARCHIVOS INCLUIDOS

```
HSV-Mobile/
├── index.html              ← Abrir este archivo
├── manifest.json
├── sw.js
├── css/
│   ├── styles.css          ← Estilos originales
│   ├── tablet-overrides.css ← Adaptaciones táctiles
│   └── mobile.css
├── js/
│   ├── valoracion.js       ← Lógica completa
│   ├── plan.js             ← Lógica completa
│   ├── constants.js
│   ├── config.js
│   ├── confetti.js
│   └── export.js
├── README.md               ← Documentación completa
├── LEEME.md                ← Este archivo
└── IMPORTAR_A_PC.md        ← Cómo importar en PC
```

## 💡 TIPS

- **Gira el tablet** en horizontal para más espacio
- **Zoom**: Usa pellizco para ampliar tablas pequeñas
- **Teclado**: Conecta teclado Bluetooth para escribir más rápido
- **Stylus**: Funciona perfecto con Apple Pencil o stylus Android

## 🐛 PROBLEMAS COMUNES

### "Dispositivo No Compatible"
→ Tu pantalla es muy pequeña. Necesitas tablet de 9" mínimo.

### No se guardan los datos
→ Verifica que el navegador permita localStorage. No uses modo incógnito.

### El formulario no carga
→ Refresca la página (F5 o pull down). Verifica conexión a internet en primer uso.

### No puedo exportar
→ Verifica permisos de descarga del navegador. Algunos bloquean descargas automáticas.

## 📞 SOPORTE

Lee estos archivos para más ayuda:
- `README.md` - Documentación técnica completa
- `IMPORTAR_A_PC.md` - Guía de importación detallada
- `README_COMPLETO.md` - Opciones y decisiones de diseño

---

**Hogar San Vicente**
Versión Tablet 1.0.0 - Diciembre 2025
