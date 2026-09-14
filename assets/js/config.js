/**
 * ==========================================================================
 * PLaiT - ARCHIVO DE CONFIGURACIÓN CENTRAL
 * ==========================================================================
 * Todas las URLs configurables viven en este archivo y en ningún otro lado.
 * 1. CAL_LINK: usuario/evento de Cal.com. NO es la URL completa: va sin
 *    "https://cal.com/" adelante. Para cal.com/plait-riocuarto/demo
 *    acá se escribe "plait-riocuarto/demo".
 * 2. WHATSAPP_URL: enlace directo a WhatsApp. El número va con formato
 *    internacional sin "+", sin el 0 del area y sin el 15: 54 9 358 XXXXXXX.
 * 3. VIDEO_HORIZONTAL / VIDEO_VERTICAL: rutas a los MP4 del video demo.
 *    El vertical (4:5) se usa en celulares y el horizontal (16:9) en compu.
 *    Mientras esten vacios, el boton de play no hace nada.
 * 4. INSTAGRAM_URL: enlace al perfil de Instagram oficial de PLaiT.
 * 5. TRACK_URL: URL /exec de la app web de Google Apps Script que anota
 *    los eventos en la hoja "Eventos" de la planilla. Mientras este
 *    vacia, track.js no hace absolutamente nada y la pagina anda igual.
 * ==========================================================================
 */

window.PLAIT_CONFIG = {
  CAL_LINK: "plait-riocuarto/demo",
  WHATSAPP_URL: "https://wa.me/5493585006177?text=Hola%2C%20vi%20la%20web%20de%20PLaiT%20y%20quiero%20conocer%20m%C3%A1s",
  VIDEO_HORIZONTAL: "assets/video/demo-horizontal.mp4",
  VIDEO_VERTICAL: "assets/video/demo-vertical.mp4",
  INSTAGRAM_URL: "https://www.instagram.com/plait_ia/",
  EMAIL: "plaitriocuarto@gmail.com",
  TRACK_URL: "https://script.google.com/macros/s/AKfycbzFvGCR6OI7VBV-4GJvnufiUZ9SuA7tepr8qp6n4ECDSMg28TbNTF5MvF_MkGNdDf4daA/exec"
};
