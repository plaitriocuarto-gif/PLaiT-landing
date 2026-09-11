# PLaiT — Landing Page (`plait-landing`)

Landing page estática de alta conversión para **PLaiT** (Secretarias virtuales con Inteligencia Artificial para negocios de Río Cuarto, Córdoba).

Sitio estático puro (HTML5, CSS3, JavaScript vanilla), sin frameworks ni procesos de compilación, listo para ser desplegado en **GitHub Pages**.

---

## ⚙️ Configuración Rápida (3 Variables)

Para actualizar los enlaces de agendamiento, contacto y video de demostración, edita únicamente el archivo [`assets/js/config.js`](./assets/js/config.js):

```javascript
window.PLAIT_CONFIG = {
  // 1. URL de Calendly para agendar videollamadas de 15 minutos
  CALENDLY_URL: "https://calendly.com/plait-demo/15min?utm_source=email&utm_campaign=icebreaker",

  // 2. Enlace de WhatsApp directo con mensaje predefinido
  WHATSAPP_URL: "https://wa.me/54935841XXXXX?text=Hola%2C%20vi%20la%20web%20de%20PLaiT%20y%20quiero%20saber%20m%C3%A1s",

  // 3. ID del video de YouTube con la demostración en vivo (ejemplo: 'dQw4w9WgXcQ')
  YOUTUBE_VIDEO_ID: "dQw4w9WgXcQ"
};
```

---

## 🚀 Publicación en GitHub Pages (Paso a Paso)

### 1. Crear el repositorio en GitHub
1. Entra a tu cuenta de GitHub y crea un **nuevo repositorio público** llamado `plait-landing`.
   *(Importante: GitHub Pages en cuentas gratuitas requiere que el repositorio sea público).*
2. **No** inicialices el repositorio con README ni .gitignore (ya están incluidos en este proyecto).

### 2. Subir los archivos
Abre tu terminal en la carpeta del proyecto y ejecuta:

```bash
git init
git add .
git commit -m "feat: landing page estatica inicial de PLaiT"
git branch -M main
git remote add origin https://github.com/tomasmaluf/plait-landing.git
git push -u origin main
```

### 3. Activar GitHub Pages
1. En GitHub, ve a tu repositorio `plait-landing` → **Settings** (Configuración).
2. En el menú lateral izquierdo, haz clic en **Pages**.
3. En **Build and deployment** → **Source**, selecciona:
   - Branch: `main`
   - Folder: `/ (root)`
4. Haz clic en **Save**.
5. Espera 1 a 2 minutos. La página estará disponible en:
   👉 **`https://tomasmaluf.github.io/plait-landing/`**

---

## 🌐 Configurar Subdominio Propio (`demo.plaitriocuarto.com`)

Si deseas utilizar tu propio subdominio en Hostinger:

1. **En Hostinger (Panel DNS):**
   - Ve a la zona DNS de `plaitriocuarto.com`.
   - Agrega un nuevo registro tipo **CNAME**:
     - **Nombre / Host:** `demo`
     - **Apunta a:** `tomasmaluf.github.io.`
     - **TTL:** 14400 (o por defecto).
   - *Nota importante:* No modifiques los registros MX, SPF, DKIM ni DMARC del correo.

2. **En el repositorio:**
   - Crea un archivo llamado `CNAME` (sin extensión) en la raíz del proyecto que contenga únicamente:
     ```text
     demo.plaitriocuarto.com
     ```
   - Haz commit y push del archivo `CNAME`.

3. **En GitHub Pages (Settings → Pages):**
   - En el campo **Custom domain**, ingresa `demo.plaitriocuarto.com` y guarda.
   - Una vez verificado el DNS por GitHub, marca la casilla **Enforce HTTPS**.

---

## 📁 Estructura del Proyecto

```text
plait-landing/
├── .nojekyll                  # Impide que GitHub Pages omita carpetas con guiones bajos
├── index.html                 # Código HTML5 semántico de la landing page
├── README.md                  # Esta guía de uso y despliegue
├── directivas/
│   └── landing_page.md        # Directiva viva con las decisiones arquitectónicas
└── assets/
    ├── css/
    │   └── styles.css         # Estilos responsive mobile-first (sin librerías)
    ├── js/
    │   ├── config.js          # Bloque de configuración centralizado
    │   └── main.js            # Acordeón accesible, lazy video y Calendly
    └── images/
        ├── favicon.svg        # Ícono de pestaña del navegador
        ├── og-image.svg       # Tarjeta de vista previa para redes y correo
        └── video-placeholder.svg # Portada 16:9 con botón de reproducción
```

---

## 📞 Contacto del Negocio
- **Email:** `plaitriocuarto@gmail.com`
- **Ubicación:** Río Cuarto, Córdoba, Argentina
