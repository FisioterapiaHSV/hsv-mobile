# 🌐 Cómo compartir HSV-Mobile en red local

## Método 1: Python Simple Server (Más fácil)

### Windows / Mac / Linux

1. **Abre PowerShell o Terminal** en la carpeta HSV-Mobile
2. **Ejecuta**:
   ```bash
   python -m http.server 8000
   ```
   O si tienes Python 2:
   ```bash
   python -m SimpleHTTPServer 8000
   ```

3. **Encuentra tu IP local**:
   - Windows: Abre PowerShell y ejecuta:
     ```powershell
     ipconfig
     ```
     Busca "Dirección IPv4" (ejemplo: 192.168.1.100)
   
   - Mac/Linux: Abre Terminal y ejecuta:
     ```bash
     ifconfig
     ```
     O:
     ```bash
     ip addr show
     ```

4. **Comparte el link**:
   ```
   http://TU-IP:8000
   ```
   Ejemplo: `http://192.168.1.100:8000`

5. **En las tabletas**: Abrir el navegador y entrar a ese link

---

## Método 2: Live Server (Visual Studio Code)

Si usas VS Code:

1. **Instala la extensión "Live Server"**
2. **Clic derecho** en `index.html` → "Open with Live Server"
3. **Live Server mostrará la IP**, ejemplo:
   ```
   Server started at http://192.168.1.100:5500
   ```
4. **Comparte ese link** con las tabletas

---

## Método 3: Node.js http-server

1. **Instala Node.js** si no lo tienes
2. **Instala http-server**:
   ```bash
   npm install -g http-server
   ```
3. **Ejecuta** en la carpeta HSV-Mobile:
   ```bash
   http-server -p 8000
   ```
4. **Comparte la IP**:
   ```
   http://TU-IP:8000
   ```

---

## ⚠️ Consideraciones importantes:

### Firewall
- **Windows**: Permite el puerto en el Firewall cuando pregunte
- Si no carga, desactiva temporalmente el firewall para probar

### Red WiFi
- **Todas las tabletas deben estar en la misma red WiFi** que tu computadora
- No funcionará si están en datos móviles

### Mantener la computadora encendida
- El servidor debe estar corriendo mientras los alumnos usen la app
- Si apagas la computadora, se pierde el acceso

---

## 📱 Instalación en tabletas (PWA)

Una vez que las tabletas entren al link:

1. **Chrome Android**:
   - Presiona los 3 puntos (⋮)
   - "Agregar a pantalla de inicio"
   - Ahora funciona como app nativa

2. **Safari iOS**:
   - Presiona el botón compartir
   - "Agregar a pantalla de inicio"

3. **Funcionará sin internet** (después de la primera carga) ✅

---

## 🎯 Recomendación final

**Para clases regulares**: Usa hosting online (GitHub Pages o Netlify)
- ✅ No necesitas mantener tu PC encendida
- ✅ Funciona desde cualquier red
- ✅ Los alumnos guardan el link permanentemente

**Para demostración rápida**: Usa servidor local
- ✅ Inmediato (en 1 minuto)
- ❌ Solo mientras tu PC esté encendida
- ❌ Solo en la misma red WiFi

---

**Hogar San Vicente** - Versión Móvil 1.0.0
