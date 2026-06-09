# INERTIX — Presentacion de Socios | Three.js

Video estilo superheroes para TikTok/Reels (9:16, 1080×1920, 30fps, ~10s)

## 📁 Estructura del Proyecto

```
inertix-threejs/
├── index.html          ← Abrir en el navegador
├── app.js              ← Animacion Three.js completa
├── assets/
│   ├── logo.png        ← LOGO de INERTIX (reemplazar)
│   ├── socio1.png      ← FOTO del Ing. Samuel (reemplazar)
│   └── socio2.png      ← FOTO del Ing. Carlos (reemplazar)
└── README.md
```

## 🚀 Como Usar

### 1. Agregar Logo e Imagenes

Coloca tus archivos en la carpeta `assets/`:
- `assets/logo.png` → Logo de INERTIX (PNG transparente, ~800px ancho recomendado)
- `assets/socio1.png` → Foto del Ing. Samuel
- `assets/socio2.png` → Foto del Ing. Carlos

> Si no colocas el logo.png, se usara el texto "INERTIX" en Poppins como fallback.

**Formatos soportados:** PNG, JPG, WebP
**Resolucion recomendada fotos:** 800×1000px minimo (retrato)

### 2. Personalizar Nombres, Roles y Logo

Abre `app.js` y edita la seccion de configuracion al inicio:

```js
// Logo
const LOGO_PATH = "assets/logo.png";    // Ruta a tu logo PNG

// Socios
const SOCIOS = [
    {
        nombre: "ING. SAMUEL",
        rol: "ESTRUCTURAL · SISMICA",
        foto: "assets/socio1.png",
        acento: "#1a56cc"
    },
    {
        nombre: "ING. CARLOS",
        rol: "CIVIL · VIAL · OBRAS",
        foto: "assets/socio2.png",
        acento: "#e8232a"
    }
];
```

### 3. Ejecutar

**Opcion A — Servidor local (recomendado):**
```bash
# Con Python
python -m http.server 8080

# Con Node.js
npx http-server . -p 8080 --cors

# Con PHP
php -S localhost:8080
```
Luego abre: `http://localhost:8080`

**Opcion B — VS Code Live Server:**
Click derecho en `index.html` → "Open with Live Server"

> ⚠️ NO abrir directamente el HTML como archivo (file://) porque las
> importaciones ES Module y la carga de imagenes no funcionaran.

### 4. Controles

- **PLAY** → Reproduce la animacion completa (10 segundos)
- **GRABAR WebM** → Graba y descarga el video en WebM 1080×1920

### 5. Convertir a MP4 (para TikTok/Reels)

El navegador graba en WebM. Para convertir a MP4 alta calidad:

```bash
ffmpeg -i INERTIX_Socios_1080x1920_30fps.webm \
       -c:v libx264 -crf 16 -preset slow \
       -pix_fmt yuv420p -profile:v high \
       -movflags +faststart \
       INERTIX_Socios_1080x1920.mp4
```

## 🎨 Escenas

| # | Nombre | Duracion | Descripcion |
|---|--------|----------|-------------|
| 1 | Impact Opener | 3.4s | Logo INERTIX con rayos + servicios |
| 2 | Hero Team | 3.3s | Presentacion de socios con cards + fotos |
| 3 | Power Close | 3.3s | Estadisticas + CTA final |

## ⚡ Efectos Incluidos

- Particulas GPU (additive blending)
- Lightning bolts animados
- Bloom / Glow (UnrealBloomPass)
- Vignette cinematico
- Film grain
- Transiciones con easing
- Flash de impacto
- Speed lines estilo comic

## 🛠 Requisitos

- Navegador moderno (Chrome 90+, Firefox 90+, Edge 90+)
- Soporte WebGL 2.0
- ES Modules (import maps)
- Conexion a internet (para cargar Three.js desde CDN)

## 📐 Especificaciones Tecnicas

- **Resolucion:** 1080×1920px (9:16)
- **Frame rate:** 30fps
- **Duracion:** 10 segundos
- **Render:** Three.js + WebGL + Canvas 2D overlay
- **Post-processing:** Bloom + Vignette + Noise
- **Export:** WebM VP9 @ 16Mbps
