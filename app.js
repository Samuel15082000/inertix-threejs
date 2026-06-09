/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INERTIX — Presentacion de Socios · Three.js
 * Formato: 9:16 (1080×1920) · 30fps · ~10s
 * Estilo: Superheroes / Ingenieria de Impacto
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * INSTRUCCIONES DE IMAGENES:
 * Coloca las fotos de los socios en la carpeta /assets/ y actualiza las rutas:
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// ═══════════════════════════════════════════════════════════════
// ★ CONFIGURACION — EDITA AQUI ★
// ═══════════════════════════════════════════════════════════════

// Logo de la empresa (PNG transparente recomendado, ~800px ancho)
const LOGO_PATH = "assets/logo.png";    // ← Cambia a la ruta de tu logo

// Socios / partners
const SOCIOS = [
    {
        nombre: "ING. SAMUEL",
        rol: "ESTRUCTURAL · SISMICA",
        foto: "assets/socio1.png",       // ← Cambia esta ruta a tu imagen local
        acento: "#1a56cc"                 // Color azul
    },
    {
        nombre: "ING. CARLOS",
        rol: "CIVIL · VIAL · OBRAS",
        foto: "assets/socio2.png",       // ← Cambia esta ruta a tu imagen local
        acento: "#e8232a"                 // Color rojo
    }
];

// ═══════════════════════════════════════════════════════════════
// CONFIG GENERAL
// ═══════════════════════════════════════════════════════════════
const W = 1080, H = 1920;
const FPS = 30;
const TOTAL_DURATION = 10.0;
const D1 = 3.4, D2 = 3.3, D3 = 3.3;

// Paleta INERTIX
const COL = {
    DARK:  new THREE.Color(4/255, 6/255, 12/255),
    NAVY:  new THREE.Color(11/255, 31/255, 82/255),
    BLUE:  new THREE.Color(26/255, 86/255, 204/255),
    RED:   new THREE.Color(192/255, 24/255, 26/255),
    RED2:  new THREE.Color(232/255, 35/255, 42/255),
    GOLD:  new THREE.Color(255/255, 208/255, 0/255),
    GOLD2: new THREE.Color(255/255, 192/255, 0/255),
    WHITE: new THREE.Color(248/255, 249/255, 255/255),
};

// ═══════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════
const easeOut = (t, p = 3) => { t = Math.max(0, Math.min(1, t)); return 1 - Math.pow(1 - t, p); };
const easeInOut = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

// ═══════════════════════════════════════════════════════════════
// CARGA DE IMAGENES (LOGO + SOCIOS)
// ═══════════════════════════════════════════════════════════════
const socioImages = [];
let logoImage = null;
const loader = new THREE.TextureLoader();

function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

async function loadAllImages() {
    // Cargar logo
    logoImage = await loadImage(LOGO_PATH);
    // Cargar fotos de socios
    for (let i = 0; i < SOCIOS.length; i++) {
        socioImages[i] = await loadImage(SOCIOS[i].foto);
    }
}

// ═══════════════════════════════════════════════════════════════
// THREE.JS SETUP
// ═══════════════════════════════════════════════════════════════
const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setSize(W, H, false);
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const scene = new THREE.Scene();
scene.background = COL.DARK.clone();

const camera = new THREE.OrthographicCamera(0, W, 0, -H, -1000, 1000);
camera.position.z = 500;

// ═══════════════════════════════════════════════════════════════
// POST-PROCESSING
// ═══════════════════════════════════════════════════════════════
const composer = new EffectComposer(renderer);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(new THREE.Vector2(W, H), 0.6, 0.4, 0.85);
composer.addPass(bloomPass);

const VignetteShader = {
    uniforms: {
        tDiffuse: { value: null },
        time: { value: 0 },
        vignetteStrength: { value: 0.5 },
        noiseStrength: { value: 0.035 }
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
        uniform sampler2D tDiffuse; uniform float time, vignetteStrength, noiseStrength;
        varying vec2 vUv;
        float rand(vec2 co){ return fract(sin(dot(co,vec2(12.9898,78.233)))*43758.5453); }
        void main(){
            vec4 c=texture2D(tDiffuse,vUv);
            vec2 center=vUv-0.5;
            float d=length(center*vec2(1.0,0.5625));
            c.rgb*=1.0-smoothstep(0.3,0.9,d)*vignetteStrength;
            c.rgb+=rand(vUv+time)*noiseStrength-noiseStrength*0.5;
            gl_FragColor=c;
        }`
};
const vignettePass = new ShaderPass(VignetteShader);
composer.addPass(vignettePass);

// ═══════════════════════════════════════════════════════════════
// OVERLAY 2D CANVAS
// ═══════════════════════════════════════════════════════════════
const overlayCanvas = document.getElementById('overlay');
const ctx = overlayCanvas.getContext('2d');
ctx.textBaseline = 'top';

function clearOverlay() { ctx.clearRect(0, 0, W, H); }

// ═══════════════════════════════════════════════════════════════
// PARTICLE SYSTEM (GPU)
// ═══════════════════════════════════════════════════════════════
class ParticleSystem {
    constructor(count, colors, seed = 42) {
        this.count = count;
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const colorAttr = new Float32Array(count * 3);
        this.basePos = new Float32Array(count * 3);
        this.vel = []; this.phases = [];
        let s = seed;
        const rng = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

        for (let i = 0; i < count; i++) {
            const px = rng() * W, py = -(rng() * H), pz = rng() * 50 - 25;
            this.basePos[i*3] = px; this.basePos[i*3+1] = py; this.basePos[i*3+2] = pz;
            positions[i*3] = px; positions[i*3+1] = py; positions[i*3+2] = pz;
            sizes[i] = 2 + rng() * 8;
            this.vel.push({ x: (rng()-0.5)*60, y: -(20+rng()*70) });
            this.phases.push(rng() * Math.PI * 2);
            const col = colors[i % colors.length];
            colorAttr[i*3] = col.r; colorAttr[i*3+1] = col.g; colorAttr[i*3+2] = col.b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geo.setAttribute('color', new THREE.BufferAttribute(colorAttr, 3));

        const mat = new THREE.ShaderMaterial({
            uniforms: { time:{value:0}, intensity:{value:1}, opacity:{value:1} },
            vertexShader: `
                attribute float size; attribute vec3 color;
                varying vec3 vColor; varying float vAlpha;
                uniform float time, intensity;
                void main(){
                    vColor=color; vAlpha=intensity;
                    vec4 mv=modelViewMatrix*vec4(position,1.0);
                    gl_PointSize=size*(300.0/-mv.z);
                    gl_Position=projectionMatrix*mv;
                }`,
            fragmentShader: `
                varying vec3 vColor; varying float vAlpha; uniform float opacity;
                void main(){
                    float d=length(gl_PointCoord-0.5);
                    if(d>0.5) discard;
                    float a=smoothstep(0.5,0.0,d)*vAlpha*opacity;
                    gl_FragColor=vec4(vColor,a);
                }`,
            transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
        });
        this.mesh = new THREE.Points(geo, mat);
        this.geo = geo;
    }
    update(t, intensity=1, opacity=1) {
        const pos = this.geo.attributes.position.array;
        for (let i=0; i<this.count; i++) {
            let x = (this.basePos[i*3] + this.vel[i].x*t) % W;
            let y = this.basePos[i*3+1] + this.vel[i].y*t;
            if (x<0) x+=W; if (y<-H) y+=H;
            pos[i*3]=x; pos[i*3+1]=y;
        }
        this.geo.attributes.position.needsUpdate = true;
        this.mesh.material.uniforms.intensity.value = intensity * Math.abs(Math.sin(t*1.5));
        this.mesh.material.uniforms.opacity.value = opacity;
    }
}

// ═══════════════════════════════════════════════════════════════
// LIGHTNING BOLT
// ═══════════════════════════════════════════════════════════════
class LightningBolt {
    constructor(x0, y0, x1, y1, color, segments=18, width=3, seed=1) {
        let s = seed;
        const rng = () => { s=(s*16807)%2147483647; return (s-1)/2147483646; };
        const pts = [];
        for (let i=0; i<=segments; i++) {
            const t=i/segments;
            const bx = lerp(x0,x1,t) + (i>0&&i<segments ? (rng()-0.5)*240 : 0);
            pts.push(new THREE.Vector3(bx, -lerp(y0,y1,t), 10));
        }
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        this.line = new THREE.Line(geo, new THREE.LineBasicMaterial({
            color, transparent:true, opacity:1, linewidth:width, blending:THREE.AdditiveBlending
        }));
        this.glow = new THREE.Line(geo.clone(), new THREE.LineBasicMaterial({
            color, transparent:true, opacity:0.4, linewidth:width*3, blending:THREE.AdditiveBlending
        }));
    }
    setOpacity(a) {
        this.line.material.opacity = a;
        this.glow.material.opacity = a*0.4;
        this.line.visible = this.glow.visible = a>0.01;
    }
}

// ═══════════════════════════════════════════════════════════════
// BACKGROUND HELPERS
// ═══════════════════════════════════════════════════════════════
function radialBG(centerCol, edgeCol, cx=0.5, cy=0.4, z=-100) {
    const geo = new THREE.PlaneGeometry(W, H);
    const mat = new THREE.ShaderMaterial({
        uniforms: { cc:{value:centerCol}, ec:{value:edgeCol}, center:{value:new THREE.Vector2(cx,1-cy)}, opacity:{value:1} },
        vertexShader: `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader: `
            uniform vec3 cc,ec; uniform vec2 center; uniform float opacity; varying vec2 vUv;
            void main(){ float d=distance(vUv,center)/0.85; vec3 c=mix(cc,ec,clamp(d,0.0,1.0)); gl_FragColor=vec4(c,opacity); }`,
        transparent: true
    });
    const m = new THREE.Mesh(geo, mat); m.position.set(W/2, -H/2, z); return m;
}

function slashLines(n=14, color=COL.WHITE, alpha=0.06) {
    const g = new THREE.Group(); const step = W/n;
    for (let i=0; i<n*3; i++) {
        const x=-W+i*step;
        const pts=[new THREE.Vector3(x,0,5), new THREE.Vector3(x+H*0.32,-H,5)];
        g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
            new THREE.LineBasicMaterial({color,transparent:true,opacity:alpha*(0.5+(i%3)*0.25)})));
    }
    return g;
}

function gridBG(cols=20, rows=36, color=COL.RED, alpha=0.05) {
    const g = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({color,transparent:true,opacity:alpha});
    const cw=W/cols, rh=H/rows;
    for (let i=0;i<=cols;i++) g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i*cw,0,3),new THREE.Vector3(i*cw,-H,3)]),mat));
    for (let j=0;j<=rows;j++) g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-j*rh,3),new THREE.Vector3(W,-j*rh,3)]),mat));
    return g;
}

function flashPlane() {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W,H), new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0}));
    m.position.set(W/2,-H/2,200); return m;
}

// ═══════════════════════════════════════════════════════════════
// SCENE OBJECTS
// ═══════════════════════════════════════════════════════════════

// --- SCENE 1: IMPACT OPENER ---
const s1 = new THREE.Group();
s1.add(radialBG(new THREE.Color(18/255,52/255,130/255), COL.DARK, 0.5, 0.38));
s1.add(slashLines(14, COL.WHITE, 0.06));
const p1 = new ParticleSystem(240, [COL.GOLD, COL.RED, COL.BLUE, COL.WHITE], 42);
s1.add(p1.mesh);
const b1m = new LightningBolt(W/2-80,0,W/2+50,H, COL.GOLD,22,4,7);
s1.add(b1m.line); s1.add(b1m.glow);
const b1l = new LightningBolt(200,0,350,H/2, COL.GOLD,18,2,1);
s1.add(b1l.line); s1.add(b1l.glow);
const b1r = new LightningBolt(W-180,100,W-300,H/2+200, COL.BLUE,18,2,5);
s1.add(b1r.line); s1.add(b1r.glow);
const f1 = flashPlane(); s1.add(f1);
scene.add(s1);

// --- SCENE 2: HERO TEAM ---
const s2 = new THREE.Group(); s2.visible = false;
s2.add(radialBG(new THREE.Color(60/255,8/255,8/255), COL.DARK, 0.5, 0.5));
s2.add(slashLines(14, COL.WHITE, 0.04));
const p2 = new ParticleSystem(180, [COL.RED, COL.RED2, COL.GOLD, COL.WHITE], 17);
s2.add(p2.mesh);
const b2l = new LightningBolt(80,H/4,250,H*3/4, COL.RED2,18,3,11);
s2.add(b2l.line); s2.add(b2l.glow);
const b2r = new LightningBolt(W-90,H/3,W-240,H*2/3, COL.BLUE,18,2,13);
s2.add(b2r.line); s2.add(b2r.glow);
const f2 = flashPlane(); s2.add(f2);
scene.add(s2);

// --- SCENE 3: POWER CLOSE ---
const s3 = new THREE.Group(); s3.visible = false;
s3.add(radialBG(new THREE.Color(12/255,35/255,100/255), COL.DARK, 0.5, 0.45));
s3.add(gridBG(20,36,COL.RED,0.05));
s3.add(slashLines(14, COL.WHITE, 0.03));
const p3 = new ParticleSystem(200, [COL.GOLD, COL.GOLD2, COL.BLUE, COL.WHITE], 55);
s3.add(p3.mesh);
const b3 = new LightningBolt(W/2,0,W/2+60,H/2, COL.GOLD,20,5,21);
s3.add(b3.line); s3.add(b3.glow);
const f3 = flashPlane(); s3.add(f3);
scene.add(s3);

// ═══════════════════════════════════════════════════════════════
// 2D DRAWING HELPERS
// ═══════════════════════════════════════════════════════════════
function drawText(text, x, y, opts={}) {
    const { font='700 48px Poppins', color='#f8f9ff', alpha=1, align='center', shadow=false } = opts;
    ctx.save();
    ctx.globalAlpha = clamp(alpha);
    ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align;
    if (shadow) { ctx.shadowColor='rgba(0,0,0,0.85)'; ctx.shadowBlur=22; ctx.shadowOffsetX=3; ctx.shadowOffsetY=5; }
    ctx.fillText(text, x, y);
    ctx.restore();
}

function drawPill(text, x, y, opts={}) {
    const { font='700 30px Poppins', color='#ffd000', alpha=1 } = opts;
    ctx.save(); ctx.globalAlpha=clamp(alpha); ctx.font=font;
    const tw = ctx.measureText(text).width;
    const pw=tw+50, ph=52, rx=x-pw/2, ry=y;
    ctx.fillStyle=color; ctx.globalAlpha=clamp(alpha)*0.15;
    ctx.beginPath(); ctx.roundRect(rx,ry,pw,ph,ph/2); ctx.fill();
    ctx.globalAlpha=clamp(alpha)*0.8; ctx.strokeStyle=color; ctx.lineWidth=2; ctx.stroke();
    ctx.globalAlpha=clamp(alpha); ctx.fillStyle='#f8f9ff'; ctx.textAlign='center';
    ctx.fillText(text, x, ry+13);
    ctx.restore();
}

function drawDivider(x, y, w, progress, colorL='#1a56cc', colorR='#ffd000') {
    if (progress<0.02) return;
    const aw = w*progress;
    const grad = ctx.createLinearGradient(x,y,x+aw,y);
    grad.addColorStop(0,colorL); grad.addColorStop(1,colorR);
    ctx.save(); ctx.fillStyle=grad; ctx.fillRect(x+(w-aw)/2, y, aw, 4); ctx.restore();
}

function drawServiceCard(x, y, icon, title, sub, accent, alpha, w=960, h=140) {
    ctx.save(); ctx.globalAlpha=clamp(alpha);
    ctx.fillStyle=accent; ctx.globalAlpha=clamp(alpha)*0.08;
    ctx.beginPath(); ctx.roundRect(x,y,w,h,18); ctx.fill();
    ctx.globalAlpha=clamp(alpha)*0.45; ctx.strokeStyle=accent; ctx.lineWidth=2; ctx.stroke();
    ctx.globalAlpha=clamp(alpha);
    ctx.font='48px sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#fff'; ctx.fillText(icon,x+24,y+42);
    ctx.font='600 32px Poppins'; ctx.fillStyle='#f8f9ff'; ctx.fillText(title,x+90,y+32);
    ctx.font='400 26px Poppins'; ctx.fillStyle='rgba(248,249,255,0.65)'; ctx.fillText(sub,x+90,y+76);
    ctx.restore();
}

function drawLogo(x, y, scale=1, alpha=1) {
    ctx.save(); ctx.globalAlpha=clamp(alpha);

    if (logoImage) {
        // ── Renderizar logo desde imagen PNG ──
        // Escalar manteniendo proporcion, ancho base ~500px
        const baseW = 500 * scale;
        const ratio = logoImage.height / logoImage.width;
        const drawW = baseW;
        const drawH = baseW * ratio;
        const dx = x - drawW / 2;
        const dy = y - drawH * 0.2; // Ajuste vertical

        // Sombra
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 5;

        ctx.drawImage(logoImage, dx, dy, drawW, drawH);
    } else {
        // ── Fallback: texto INERTIX ──
        const sz = Math.round(110*scale);
        ctx.font=`900 ${sz}px Poppins`; ctx.textAlign='left';
        ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=25; ctx.shadowOffsetX=3; ctx.shadowOffsetY=5;
        const iW=ctx.measureText('INERT').width, xW=ctx.measureText('IX').width;
        const startX = x-(iW+xW)/2;
        ctx.fillStyle='#f8f9ff'; ctx.fillText('INERT', startX, y);
        ctx.fillStyle='#ffd000'; ctx.fillText('IX', startX+iW, y);
    }

    ctx.restore();
}

function drawCornerFrame(x, y, size, alpha, rot=0) {
    ctx.save(); ctx.globalAlpha=clamp(alpha);
    ctx.translate(x+size/2, y+size/2); ctx.rotate(rot); ctx.translate(-size/2,-size/2);
    ctx.strokeStyle='#1a56cc'; ctx.lineWidth=4;
    ctx.beginPath(); ctx.moveTo(size,0); ctx.lineTo(0,0); ctx.lineTo(0,size); ctx.stroke();
    ctx.restore();
}

function drawStatBlock(x, y, stat, label, accent, alpha) {
    ctx.save(); ctx.globalAlpha=clamp(alpha); ctx.textAlign='center';
    ctx.font='900 90px Poppins'; ctx.fillStyle=accent; ctx.fillText(stat,x,y);
    ctx.font='700 34px Poppins'; ctx.fillStyle='#f8f9ff'; ctx.fillText(label,x,y+80);
    ctx.globalAlpha=clamp(alpha)*0.8; ctx.fillStyle=accent; ctx.fillRect(x-30,y+110,60,3);
    ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
// HERO CARD WITH PHOTO
// ═══════════════════════════════════════════════════════════════
function drawHeroCard(x, y, socioIndex, alpha, w=440, h=560) {
    const socio = SOCIOS[socioIndex];
    const img = socioImages[socioIndex];
    const accent = socio.acento;

    ctx.save(); ctx.globalAlpha = clamp(alpha);

    // Card background
    ctx.fillStyle = 'rgba(4,6,12,0.9)';
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 24); ctx.fill();
    ctx.strokeStyle = accent; ctx.lineWidth = 3;
    ctx.globalAlpha = clamp(alpha)*0.7; ctx.stroke();
    ctx.globalAlpha = clamp(alpha);

    // Inner photo area
    const photoX = x+20, photoY = y+20, photoW = w-40, photoH = h-160;
    ctx.fillStyle = accent; ctx.globalAlpha = clamp(alpha)*0.06;
    ctx.beginPath(); ctx.roundRect(photoX, photoY, photoW, photoH, 16); ctx.fill();
    ctx.globalAlpha = clamp(alpha);

    // Photo or placeholder
    if (img) {
        // Clip to rounded rect
        ctx.save();
        ctx.beginPath(); ctx.roundRect(photoX, photoY, photoW, photoH, 16); ctx.clip();
        // Cover fit
        const imgRatio = img.width / img.height;
        const areaRatio = photoW / photoH;
        let sx=0, sy=0, sw=img.width, sh=img.height;
        if (imgRatio > areaRatio) {
            sw = img.height * areaRatio;
            sx = (img.width - sw) / 2;
        } else {
            sh = img.width / areaRatio;
            sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
        // Gradient overlay at bottom of photo
        const grad = ctx.createLinearGradient(photoX, photoY+photoH-100, photoX, photoY+photoH);
        grad.addColorStop(0, 'rgba(4,6,12,0)');
        grad.addColorStop(1, 'rgba(4,6,12,0.8)');
        ctx.fillStyle = grad;
        ctx.fillRect(photoX, photoY+photoH-100, photoW, 100);
        ctx.restore();
    } else {
        // Placeholder
        ctx.font = '900 160px Poppins'; ctx.textAlign = 'center';
        ctx.fillStyle = accent; ctx.globalAlpha = clamp(alpha)*0.12;
        ctx.fillText(String(socioIndex+1).padStart(2,'0'), x+w/2, photoY+60);
        ctx.globalAlpha = clamp(alpha);
        ctx.font = '120px sans-serif'; ctx.fillStyle = '#f8f9ff';
        ctx.fillText('👤', x+w/2, photoY + photoH/2 - 80);
    }

    // Name
    ctx.globalAlpha = clamp(alpha);
    ctx.font = '900 42px Poppins'; ctx.fillStyle = '#f8f9ff'; ctx.textAlign = 'center';
    ctx.shadowColor='rgba(0,0,0,0.8)'; ctx.shadowBlur=12;
    ctx.fillText(socio.nombre, x+w/2, y+h-115);
    ctx.shadowBlur=0;

    // Role
    ctx.font = '600 24px Poppins'; ctx.fillStyle = accent;
    ctx.fillText(socio.rol, x+w/2, y+h-65);

    // Bottom accent line
    ctx.fillStyle = accent; ctx.globalAlpha = clamp(alpha)*0.8;
    ctx.fillRect(x+20, y+h-22, w-40, 4);

    ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
// SCENE RENDERERS
// ═══════════════════════════════════════════════════════════════

function renderScene1(t) {
    const pInt = Math.min(1, t/0.5)*0.9;
    p1.update(t, pInt);

    b1m.setOpacity(easeOut(t/0.4) * Math.max(0, 1-(t-0.8)/0.7));
    const sideA = easeOut(t/0.6) * Math.max(0, 1-(t-1.2)/0.8);
    b1l.setOpacity(sideA); b1r.setOpacity(sideA);

    if (t>0.38 && t<0.56) f1.material.opacity = Math.max(0, 1-Math.abs(t-0.45)/0.08)*0.6;
    else f1.material.opacity = 0;

    bloomPass.strength = 0.5 + easeOut(t/0.4)*Math.max(0,1-(t-0.8)/0.7)*0.8;

    let ga = 1;
    if (t > D1-0.35) ga = 1-(t-(D1-0.35))/0.35;

    // Logo
    const lp = easeOut(Math.min(1,t/0.45),4);
    const ly = lerp(-120, H*0.12, lp);
    const ls = t<0.55 ? 1+0.12*Math.max(0,1-(t-0.4)/0.15)*(1-lp) : 1;
    drawLogo(W/2, ly, ls, lp*ga);

    // Underline
    const ua = easeOut(Math.max(0,(t-0.35)/0.3));
    if (ua>0.01) { ctx.save(); ctx.globalAlpha=ua*ga; ctx.fillStyle='#ffd000'; ctx.fillRect((W-400*ua)/2, H*0.12+130, 400*ua, 5); ctx.restore(); }

    // Eyebrow
    drawText('INGENIERIA & CONSTRUCCION', W/2, H*0.12+165, {font:'600 36px Poppins', color:'#ffd000', alpha:easeOut(Math.max(0,(t-0.3)/0.4))*ga});

    // Tagline
    const ta = easeOut(Math.max(0,(t-0.5)/0.55));
    const to = (1-ta)*80;
    drawText('Transformando', W/2, H*0.30+to, {font:'900 120px Poppins', alpha:ta*ga, shadow:true});
    drawText('Bolivia.', W/2, H*0.30+135+to, {font:'900 120px Poppins', alpha:ta*ga, shadow:true});

    // Divider
    drawDivider((W-320)/2, H*0.30+295, 320, easeOut(Math.max(0,(t-0.85)/0.4))*ga);

    // Sub
    drawText('Soluciones tecnicas al mas alto nivel.', W/2, H*0.30+325, {font:'400 38px Poppins', color:'rgba(248,249,255,0.75)', alpha:easeOut(Math.max(0,(t-1.1)/0.5))*ga});

    // Pills
    const pills = [{t:'ESTRUCTURAS',c:'#1a56cc',d:1.4},{t:'SISMICA',c:'#e8232a',d:1.6},{t:'ACI 318',c:'#ffc000',d:1.8}];
    let px = W/2-280;
    pills.forEach(p => { const pa=easeOut(Math.max(0,(t-p.d)/0.35)); drawPill(p.t, px, H*0.68+(1-pa)*40, {color:p.c,alpha:pa*ga}); px+=200; });

    // Cards
    const cards = [{i:'🏗',t:'Estructural',s:'Diseno ACI·AISC',a:'#1a56cc',d:1.6},{i:'📐',t:'Sismico',s:'Espectros multi-norma',a:'#e8232a',d:1.85},{i:'🚀',t:'Software',s:'Apps INERTIX',a:'#ffc000',d:2.1}];
    cards.forEach((c,idx) => { const ca=easeOut(Math.max(0,(t-c.d)/0.4)); drawServiceCard(60, H*0.76+idx*158+(1-ca)*60, c.i,c.t,c.s,c.a, ca*ga); });
}

function renderScene2(t) {
    p2.update(t, Math.min(1,t/0.4)*0.8);

    const bla = easeOut(Math.max(0,(t-0.1)/0.4))*Math.max(0,1-(t-1.5)/1);
    b2l.setOpacity(bla);
    b2r.setOpacity(easeOut(Math.max(0,(t-0.25)/0.4))*Math.max(0,1-(t-1.5)/1));

    if (t>1.45&&t<1.65) { f2.material.opacity=Math.max(0,1-Math.abs(t-1.55)/0.1)*0.4; f2.material.color.setRGB(1,0.78,0); }
    else f2.material.opacity=0;

    bloomPass.strength = 0.5 + bla*0.5;

    let ga = 1;
    if (t>D2-0.35) ga=1-(t-(D2-0.35))/0.35;

    // Eyebrow
    drawText('EQUIPO ELITE', W/2, H*0.055, {font:'600 38px Poppins', color:'#e8232a', alpha:easeOut(Math.max(0,(t-0.2)/0.4))*ga});

    // Title
    const ta = easeOut(Math.max(0,(t-0.35)/0.5));
    const to = (1-ta)*70;
    drawText('Un equipo.', W/2, H*0.12+to, {font:'900 108px Poppins', alpha:ta*ga, shadow:true});
    drawText('Una mision.', W/2, H*0.12+120+to, {font:'900 108px Poppins', alpha:ta*ga, shadow:true});

    // Sub
    drawText('Dos ingenieros. Cero limites.', W/2, H*0.12+270, {font:'500 42px Poppins', color:'rgba(248,249,255,0.8)', alpha:easeOut(Math.max(0,(t-0.7)/0.4))*ga});

    // Divider
    drawDivider((W-280)/2, H*0.12+330, 280, easeOut(Math.max(0,(t-0.9)/0.35))*ga, '#e8232a','#ffd000');

    // Hero cards with photos
    const cW=440, cGap=30, totalCW=cW*2+cGap;
    const leftX = (W-totalCW)/2, cardY = H*0.40;

    const c1a = easeOut(Math.max(0,(t-1.0)/0.5),3);
    drawHeroCard(leftX + (1-c1a)*-200, cardY, 0, c1a*ga);

    // VS line
    const vsa = easeOut(Math.max(0,(t-1.4)/0.3));
    if (vsa>0.01) { const vh=500*vsa; ctx.save(); ctx.globalAlpha=vsa*ga; ctx.fillStyle='#ffd000'; ctx.fillRect(leftX+cW+cGap/2-2, cardY+(560-500)/2+(500-vh)/2, 4, vh); ctx.restore(); }

    const c2a = easeOut(Math.max(0,(t-1.2)/0.5),3);
    drawHeroCard(leftX+cW+cGap + (1-c2a)*200, cardY, 1, c2a*ga);

    // Logo bottom
    drawLogo(W/2, H*0.91, 0.8, easeOut(Math.max(0,(t-2.2)/0.5))*0.85*ga);
}

function renderScene3(t) {
    p3.update(t, Math.min(1,t/0.4));

    const ba = easeOut(t/0.3)*Math.max(0,1-(t-0.5)/0.6);
    b3.setOpacity(ba);

    if (t>0.28&&t<0.46) { f3.material.opacity=Math.max(0,1-Math.abs(t-0.37)/0.09)*0.55; f3.material.color.setRGB(1,0.82,0); }
    else f3.material.opacity=0;

    bloomPass.strength = 0.5 + ba*0.7;

    let ga = 1;
    if (t>D3-0.40) ga=1-(t-(D3-0.40))/0.40;

    // Corners
    const cfa = easeOut(Math.max(0,(t-0.1)/0.4));
    drawCornerFrame(20,20,120, cfa*ga, 0);
    drawCornerFrame(W-140, H-140, 120, cfa*ga, Math.PI);

    // Eyebrow
    drawText('RECURSOS LIBRES · INNOVACION', W/2, H*0.055, {font:'600 36px Poppins', color:'#1a56cc', alpha:easeOut(Math.max(0,(t-0.15)/0.4))*ga});

    // Title
    const ta = easeOut(Math.max(0,(t-0.35)/0.55));
    const to = (1-ta)*80;
    drawText('Herramientas', W/2, H*0.12+to, {font:'900 108px Poppins', alpha:ta*ga, shadow:true});
    drawText('para Bolivia.', W/2, H*0.12+125+to, {font:'900 108px Poppins', alpha:ta*ga, shadow:true});

    // Stats
    const stats=[{s:'∞',l:'VISION',a:'#ffd000',d:0.9},{s:'100%',l:'DEDICACION',a:'#e8232a',d:1.1},{s:'01',l:'EMPRESA',a:'#1a56cc',d:1.3}];
    const sGap=280, sx=W/2-sGap;
    stats.forEach((st,i)=>{ const sa=easeOut(Math.max(0,(t-st.d)/0.4)); drawStatBlock(sx+i*sGap, H*0.48+(1-sa)*-50, st.s, st.l, st.a, sa*ga); });

    // CTA
    const cta = easeOut(Math.max(0,(t-1.7)/0.5));
    drawPill('CONTACTANOS AHORA →', W/2, H*0.68, {font:'700 40px Poppins', color:'#ffd000', alpha:cta*ga});
    drawPill('Ver Proyectos', W/2, H*0.68+80, {font:'700 34px Poppins', color:'#1a56cc', alpha:cta*ga});

    // Logo pulse
    const lga = easeOut(Math.max(0,(t-1.9)/0.5));
    drawLogo(W/2, H*0.82, 1+0.03*Math.sin(t*7), lga*0.95*ga);

    // Tagline
    drawText('INGENIERIA · BOLIVIA · INNOVACION', W/2, H*0.82+130, {font:'600 34px Poppins', color:'#ffd000', alpha:easeOut(Math.max(0,(t-2.1)/0.5))*ga});
}

// ═══════════════════════════════════════════════════════════════
// MAIN RENDER FRAME
// ═══════════════════════════════════════════════════════════════
function renderFrame(t) {
    clearOverlay();
    if (t < D1) {
        s1.visible=true; s2.visible=false; s3.visible=false;
        renderScene1(t);
    } else if (t < D1+D2) {
        s1.visible=false; s2.visible=true; s3.visible=false;
        renderScene2(t-D1);
    } else {
        s1.visible=false; s2.visible=false; s3.visible=true;
        renderScene3(t-D1-D2);
    }
    vignettePass.uniforms.time.value = t;
    composer.render();
}

// ═══════════════════════════════════════════════════════════════
// PLAYBACK
// ═══════════════════════════════════════════════════════════════
let isPlaying = false, animId = null, startT = 0;

function play() {
    if (isPlaying) return;
    isPlaying = true; startT = performance.now();
    (function loop() {
        if (!isPlaying) return;
        const elapsed = (performance.now()-startT)/1000;
        if (elapsed >= TOTAL_DURATION) { renderFrame(TOTAL_DURATION-0.001); isPlaying=false; document.getElementById('status').textContent='✅ Completado'; return; }
        renderFrame(elapsed);
        animId = requestAnimationFrame(loop);
    })();
}

function stop() { isPlaying=false; if(animId){cancelAnimationFrame(animId);animId=null;} }

// ═══════════════════════════════════════════════════════════════
// RECORDING (WebM via MediaRecorder)
// ═══════════════════════════════════════════════════════════════
async function record() {
    stop();
    const btn = document.getElementById('btn-record');
    btn.classList.add('active'); btn.textContent='⏺ GRABANDO...';
    document.getElementById('status').textContent = 'Preparando...';

    const recCanvas = document.createElement('canvas');
    recCanvas.width = W; recCanvas.height = H;
    const rctx = recCanvas.getContext('2d');

    const stream = recCanvas.captureStream(FPS);
    const recorder = new MediaRecorder(stream, { mimeType:'video/webm;codecs=vp9', videoBitsPerSecond: 16000000 });
    const chunks = [];
    recorder.ondataavailable = e => { if(e.data.size>0) chunks.push(e.data); };
    recorder.onstop = () => {
        const blob = new Blob(chunks, {type:'video/webm'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'INERTIX_Socios_1080x1920_30fps.webm';
        a.click();
        btn.classList.remove('active'); btn.textContent='⏺ GRABAR WebM';
        document.getElementById('status').textContent = '✅ Descargado!';
    };

    recorder.start();
    const totalFrames = Math.ceil(TOTAL_DURATION * FPS);

    for (let f=0; f<totalFrames; f++) {
        renderFrame(f / FPS);
        rctx.drawImage(canvas, 0, 0);
        rctx.drawImage(overlayCanvas, 0, 0);
        await new Promise(r => setTimeout(r, 1000/FPS));
        document.getElementById('status').textContent = `Grabando ${Math.round(f/totalFrames*100)}%`;
    }
    recorder.stop();
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
document.getElementById('btn-play').addEventListener('click', () => { stop(); play(); document.getElementById('status').textContent='▶ Reproduciendo...'; });
document.getElementById('btn-record').addEventListener('click', record);

// Load images then render first frame
loadAllImages().then(() => {
    renderFrame(0);
    const logoOk = logoImage ? '🏷️ Logo cargado' : '⚠️ Sin logo (usando texto)';
    const fotosOk = socioImages.some(i=>i) ? '📸 Fotos cargadas' : '📸 Sin fotos (placeholder)';
    document.getElementById('status').textContent = `${logoOk} · ${fotosOk} — Presiona PLAY`;
});

// Fit to viewport
function fit() {
    const c = document.getElementById('canvas-container');
    const s = Math.min(window.innerWidth/W, window.innerHeight/H, 1)*0.92;
    c.style.transform = `scale(${s})`;
}
fit(); window.addEventListener('resize', fit);
