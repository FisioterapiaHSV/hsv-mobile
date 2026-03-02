# 🚀 Inicio Rápido - HSV Mobile

## Para Probar Localmente

### Opción 1: Abrir Directamente (Simple)
1. Haz doble clic en `index.html`
2. Se abrirá en tu navegador predeterminado
3. ⚠️ **Nota**: Algunas funciones PWA no funcionarán en modo `file://`

### Opción 2: Servidor Local (Recomendado)

#### Con Python (si lo tienes instalado)
```bash
cd HSV-Mobile
python -m http.server 8080
```
Luego abre: `http://localhost:8080`

#### Con Node.js
```bash
cd HSV-Mobile
npx serve
```

#### Con PHP
```bash
cd HSV-Mobile
php -S localhost:8080
```

## Para Desplegar en Internet

### Opción 1: GitHub Pages (Gratis)
1. Crea un repositorio en GitHub
2. Sube la carpeta HSV-Mobile
3. Ve a Settings → Pages
4. Selecciona la rama main
5. Tu app estará en: `https://tuusuario.github.io/hsv-mobile`

### Opción 2: Netlify (Gratis)
1. Crea cuenta en [netlify.com](https://netlify.com)
2. Arrastra la carpeta HSV-Mobile al sitio
3. Tu app estará lista en minutos

### Opción 3: Vercel (Gratis)
1. Crea cuenta en [vercel.com](https://vercel.com)
2. Instala Vercel CLI: `npm i -g vercel`
3. En la carpeta HSV-Mobile: `vercel`

## Instalar en Móvil

### iPhone/iPad
1. Abre Safari
2. Navega a la URL de tu app
3. Toca el botón **Compartir** (□↑)
4. Selecciona **"Agregar a pantalla de inicio"**
5. Toca **"Agregar"**

### Android
1. Abre Chrome
2. Navega a la URL de tu app
3. Toca el menú **⋮** (3 puntos)
4. Selecciona **"Agregar a pantalla de inicio"**
5. Confirma

## Primer Uso

1. **Crea una valoración**:
   - Toca "Nueva Valoración"
   - Completa los campos requeridos (*)
   - Guarda como borrador

2. **Crea un plan**:
   - Toca "Nuevo Plan"
   - Agrega objetivos y actividades
   - Guarda como borrador

3. **Exporta tus datos**:
   - Toca "Mis Borradores"
   - Toca "Exportar Todo"
   - Se descargará un archivo JSON

4. **Importa en PC**:
   - Transfiere el JSON a tu PC
   - Sigue las instrucciones en `IMPORTAR_A_PC.md`

## Solución de Problemas

### No se instala como PWA
- ✅ Verifica que estés usando **HTTPS** (no HTTP)
- ✅ O usa **localhost** para pruebas
- ✅ No funciona con `file://`

### Los datos no se guardan
- ✅ Verifica que el navegador permita localStorage
- ✅ No uses modo incógnito/privado
- ✅ Revisa permisos del navegador

### El Service Worker no se registra
- ✅ Necesitas HTTPS o localhost
- ✅ Revisa la consola de DevTools (F12)
- ✅ Puede tardar unos segundos

### La exportación no funciona
- ✅ Verifica permisos de descarga del navegador
- ✅ Algunos navegadores móviles bloquean descargas automáticas
- ✅ Intenta con otro navegador

## Estructura de la App

```
HSV-Mobile/
├── index.html              # Página principal (menú)
├── valoracion.html         # Formulario de valoración
├── plan.html              # Formulario de plan
├── lista.html             # Lista de borradores
├── manifest.json          # Configuración PWA
├── sw.js                  # Service Worker
├── css/
│   └── mobile.css         # Estilos responsive
├── js/
│   ├── constants.js       # Constantes y helpers
│   ├── export.js          # Sistema de exportación
│   ├── mobile-valoracion.js  # Lógica valoraciones
│   └── mobile-plan.js     # Lógica planes
└── icons/
    └── (agregar iconos aquí)
```

## Personalización

### Cambiar Colores
Edita `css/mobile.css`, líneas 3-10:
```css
:root {
  --primary: #4A90E2;      /* Color principal */
  --secondary: #50C878;    /* Color secundario */
  --danger: #E74C3C;       /* Color de peligro */
  /* ... */
}
```

### Cambiar Personal
Edita `js/constants.js`, líneas 2-14:
```javascript
const APP_PERSONAL = {
  responsables: [
    { nombre: 'Tu Nombre', prefix: 'PSS', pin: '1234' },
    // ...
  ]
};
```

### Agregar Iconos
1. Genera iconos 192x192 y 512x512 px
2. Guárdalos en `icons/icon-192.png` y `icons/icon-512.png`
3. Usa herramientas como [RealFaviconGenerator](https://realfavicongenerator.net/)

## Seguridad

⚠️ **IMPORTANTE**:
- Esta app guarda datos en localStorage del navegador
- Los datos NO están encriptados
- NO almacenes información extremadamente sensible
- Haz backups regulares exportando a JSON
- Si limpias el cache del navegador, **perderás los borradores**

## Soporte y Contacto

Para problemas técnicos:
1. Revisa la consola del navegador (F12)
2. Verifica que todos los archivos existan
3. Prueba en modo incógnito para descartar extensiones

---

**¡Listo para usar!** 🎉

Hogar San Vicente - Versión Móvil 1.0.0
