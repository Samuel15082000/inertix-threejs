/**
 * INERTIX - Presentacion de Socios - Three.js
 * 9:16 (1080x1920) 30fps ~10s
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// =============================================
// CONFIGURACION
// =============================================
var LOGO_PATH = "assets/logo.png";

var SOCIOS = [
    { nombre: "ING. SAMUEL", rol: "ESTRUCTURAL - SISMICA", foto: "assets/socio1.png" },
    { nombre: "ING. CARLOS", rol: "CIVIL - VIAL - OBRAS", foto: "assets/socio2.png" }
];

var SERVICIOS = [
    { nombre: "INGENIERIA Y\nCONSTRUCCION", icono: "assets/1.png", keywords: ["Estructuras", "Sismica", "Supervision"] },
    { nombre: "IMPORTACION", icono: "assets/2.png", keywords: ["Materiales", "Equipos", "Logistica"] },
    { nombre: "INMOBILIARIA", icono: "assets/3.png", keywords: ["Proyectos", "Terrenos", "Venta"] },
    { nombre: "SOFTWARE", icono: "assets/4.png", keywords: ["Apps", "Calculo", "Automatizacion"] }
];

// =============================================
// CONFIG
// =============================================
var W = 1080, H = 1920;
var FPS = 30;
var TOTAL_DURATION = 10.0;
var D1 = 3.4, D2 = 3.3, D3 = 3.3;

var BLUE = "#1a56cc";
var DARK = "#04060c";
var NAVY = "#0b1f52";
var WHITE = "#f8f9ff";

var COL = {
    DARK: new THREE.Color(4/255, 6/255, 12/255),
    BLUE: new THREE.Color(26/255, 86/255, 204/255),
    NAVY: new THREE.Color(11/255, 31/255, 82/255),
    WHITE: new THREE.Color(248/255, 249/255, 255/255),
    GOLD: new THREE.Color(255/255, 208/255, 0/255)
};

// =============================================
// UTILS
// =============================================
function easeOut(t, p) {
    if (p === undefined) p = 3;
    t = Math.max(0, Math.min(1, t));
    return 1 - Math.pow(1 - t, p);
}
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(x, a, b) {
    if (a === undefined) a = 0;
    if (b === undefined) b = 1;
    return Math.max(a, Math.min(b, x));
}

// =============================================
// IMAGE LOADING
// =============================================
var logoImage = null;
var socioImages = [];
var servicioImages = [];

function loadImage(src) {
    return new Promise(function(resolve) {
        var img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function() { resolve(img); };
        img.onerror = function() { resolve(null); };
        img.src = src;
    });
}

async function loadAllImages() {
    logoImage = await loadImage(LOGO_PATH);
    for (var i = 0; i < SOCIOS.length; i++) {
        socioImages[i] = await loadImage(SOCIOS[i].foto);
    }
    for (var i = 0; i < SERVICIOS.length; i++) {
        servicioImages[i] = await loadImage(SERVICIOS[i].icono);
    }
}

// =============================================
// THREE.JS SETUP
// =============================================
var canvas = document.getElementById("three-canvas");
var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
renderer.setSize(W, H, false);
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

var scene = new THREE.Scene();
scene.background = COL.DARK.clone();

var camera = new THREE.OrthographicCamera(0, W, 0, -H, -1000, 1000);
camera.position.z = 500;

// Post-processing
var composer = new EffectComposer(renderer);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));

var bloomPass = new UnrealBloomPass(new THREE.Vector2(W, H), 0.4, 0.3, 0.9);
composer.addPass(bloomPass);

var cinematicVert = [
    "varying vec2 vUv;",
    "void main() {",
    "  vUv = uv;",
    "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
    "}"
].join("\n");

var cinematicFrag = [
    "uniform sampler2D tDiffuse;",
    "uniform float time;",
    "varying vec2 vUv;",
    "float rand(vec2 co) { return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453); }",
    "void main() {",
    "  vec2 dir = (vUv - 0.5) * 0.002;",
    "  float r = texture2D(tDiffuse, vUv + dir).r;",
    "  float g = texture2D(tDiffuse, vUv).g;",
    "  float b = texture2D(tDiffuse, vUv - dir).b;",
    "  vec3 color = vec3(r, g, b);",
    "  vec2 c = vUv - 0.5;",
    "  float d = length(c * vec2(0.9, 0.55));",
    "  color *= 1.0 - smoothstep(0.3, 0.9, d) * 0.4;",
    "  color += rand(vUv + fract(time)) * 0.025 - 0.0125;",
    "  gl_FragColor = vec4(color, 1.0);",
    "}"
].join("\n");

var CinematicShader = {
    uniforms: { tDiffuse: { value: null }, time: { value: 0 } },
    vertexShader: cinematicVert,
    fragmentShader: cinematicFrag
};
var cinematicPass = new ShaderPass(CinematicShader);
composer.addPass(cinematicPass);

// =============================================
// OVERLAY 2D
// =============================================
var overlayCanvas = document.getElementById("overlay");
var ctx = overlayCanvas.getContext("2d");
ctx.textBaseline = "top";
function clearOverlay() { ctx.clearRect(0, 0, W, H); }

// =============================================
// PARTICLES
// =============================================
var particleVert = [
    "attribute float size;",
    "attribute vec3 color;",
    "varying vec3 vColor;",
    "varying float vAlpha;",
    "uniform float intensity;",
    "void main() {",
    "  vColor = color;",
    "  vAlpha = intensity;",
    "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
    "  gl_PointSize = size * (300.0 / -mv.z);",
    "  gl_Position = projectionMatrix * mv;",
    "}"
].join("\n");

var particleFrag = [
    "varying vec3 vColor;",
    "varying float vAlpha;",
    "uniform float opacity;",
    "void main() {",
    "  float d = length(gl_PointCoord - 0.5);",
    "  if (d > 0.5) discard;",
    "  float a = smoothstep(0.5, 0.0, d) * vAlpha * opacity;",
    "  gl_FragColor = vec4(vColor, a);",
    "}"
].join("\n");

class ParticleSystem {
    constructor(count, colors, seed) {
        this.count = count;
        var positions = new Float32Array(count * 3);
        var sizes = new Float32Array(count);
        var colorAttr = new Float32Array(count * 3);
        this.basePos = new Float32Array(count * 3);
        this.vel = [];
        var s = seed || 42;
        var rng = function() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
        for (var i = 0; i < count; i++) {
            var px = rng() * W, py = -(rng() * H), pz = rng() * 50 - 25;
            this.basePos[i*3] = px; this.basePos[i*3+1] = py; this.basePos[i*3+2] = pz;
            positions[i*3] = px; positions[i*3+1] = py; positions[i*3+2] = pz;
            sizes[i] = 2 + rng() * 6;
            this.vel.push({ x: (rng()-0.5)*40, y: -(20+rng()*60) });
            var col = colors[i % colors.length];
            colorAttr[i*3] = col.r; colorAttr[i*3+1] = col.g; colorAttr[i*3+2] = col.b;
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
        geo.setAttribute("color", new THREE.BufferAttribute(colorAttr, 3));
        var mat = new THREE.ShaderMaterial({
            uniforms: { time: {value:0}, intensity: {value:1}, opacity: {value:1} },
            vertexShader: particleVert,
            fragmentShader: particleFrag,
            transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
        });
        this.mesh = new THREE.Points(geo, mat);
        this.geo = geo;
    }
    update(t, intensity, opacity) {
        if (intensity === undefined) intensity = 1;
        if (opacity === undefined) opacity = 1;
        var pos = this.geo.attributes.position.array;
        for (var i = 0; i < this.count; i++) {
            var x = (this.basePos[i*3] + this.vel[i].x * t) % W;
            var y = this.basePos[i*3+1] + this.vel[i].y * t;
            if (x < 0) x += W;
            if (y < -H) y += H;
            pos[i*3] = x; pos[i*3+1] = y;
        }
        this.geo.attributes.position.needsUpdate = true;
        this.mesh.material.uniforms.intensity.value = intensity * (0.6 + 0.4 * Math.abs(Math.sin(t * 2)));
        this.mesh.material.uniforms.opacity.value = opacity;
    }
}

// =============================================
// LIGHTNING
// =============================================
class LightningBolt {
    constructor(x0, y0, x1, y1, color, segments, seed) {
        segments = segments || 18;
        var s = seed || 1;
        var rng = function() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
        var pts = [];
        for (var i = 0; i <= segments; i++) {
            var t = i / segments;
            var bx = lerp(x0, x1, t) + (i > 0 && i < segments ? (rng() - 0.5) * 200 : 0);
            pts.push(new THREE.Vector3(bx, -lerp(y0, y1, t), 10));
        }
        var geo = new THREE.BufferGeometry().setFromPoints(pts);
        this.line = new THREE.Line(geo, new THREE.LineBasicMaterial({
            color: color, transparent: true, opacity: 1, blending: THREE.AdditiveBlending
        }));
        this.glow = new THREE.Line(geo.clone(), new THREE.LineBasicMaterial({
            color: color, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending
        }));
    }
    setOpacity(a) {
        this.line.material.opacity = a;
        this.glow.material.opacity = a * 0.3;
        this.line.visible = a > 0.01;
        this.glow.visible = a > 0.01;
    }
}

// =============================================
// BACKGROUNDS
// =============================================
var bgVert = [
    "varying vec2 vUv;",
    "void main() {",
    "  vUv = uv;",
    "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
    "}"
].join("\n");

// Scene 1: 40% white top, 60% blue bottom
var bg1Frag = [
    "uniform float opacity;",
    "varying vec2 vUv;",
    "void main() {",
    "  float cutoff = 0.60;",
    "  float edge = smoothstep(cutoff - 0.02, cutoff + 0.02, vUv.y);",
    "  vec3 white = vec3(0.96, 0.97, 1.0);",
    "  vec3 blue = vec3(0.04, 0.12, 0.32);",
    "  vec3 color = mix(blue, white, edge);",
    "  gl_FragColor = vec4(color, opacity);",
    "}"
].join("\n");

// Scene 2: elegant navy
var bg2Frag = [
    "uniform float opacity;",
    "varying vec2 vUv;",
    "void main() {",
    "  float d = distance(vUv, vec2(0.5, 0.55)) / 0.9;",
    "  vec3 center = vec3(0.06, 0.14, 0.38);",
    "  vec3 edge = vec3(0.015, 0.02, 0.05);",
    "  vec3 color = mix(center, edge, clamp(d, 0.0, 1.0));",
    "  gl_FragColor = vec4(color, opacity);",
    "}"
].join("\n");

// Scene 3: dark blue center
var bg3Frag = [
    "uniform float opacity;",
    "varying vec2 vUv;",
    "void main() {",
    "  float d = distance(vUv, vec2(0.5, 0.5)) / 0.85;",
    "  vec3 center = vec3(0.05, 0.12, 0.35);",
    "  vec3 edge = vec3(0.01, 0.015, 0.04);",
    "  vec3 color = mix(center, edge, clamp(d, 0.0, 1.0));",
    "  gl_FragColor = vec4(color, opacity);",
    "}"
].join("\n");

function makeBG(frag) {
    var geo = new THREE.PlaneGeometry(W, H);
    var mat = new THREE.ShaderMaterial({
        uniforms: { opacity: { value: 1 } },
        vertexShader: bgVert,
        fragmentShader: frag,
        transparent: true
    });
    var m = new THREE.Mesh(geo, mat);
    m.position.set(W/2, -H/2, -100);
    return m;
}

function flashPlane() {
    var m = new THREE.Mesh(
        new THREE.PlaneGeometry(W, H),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
    );
    m.position.set(W/2, -H/2, 200);
    return m;
}

// =============================================
// SCENE GROUPS
// =============================================
var s1 = new THREE.Group();
s1.add(makeBG(bg1Frag));
var p1 = new ParticleSystem(150, [COL.BLUE, COL.WHITE, COL.NAVY], 42);
s1.add(p1.mesh);
var b1 = new LightningBolt(W/2 - 60, 0, W/2 + 40, H * 0.6, COL.BLUE, 20, 7);
s1.add(b1.line); s1.add(b1.glow);
var f1 = flashPlane(); s1.add(f1);
scene.add(s1);

var s2 = new THREE.Group(); s2.visible = false;
s2.add(makeBG(bg2Frag));
var p2 = new ParticleSystem(120, [COL.BLUE, COL.WHITE, COL.NAVY], 17);
s2.add(p2.mesh);
var b2 = new LightningBolt(100, H * 0.2, 250, H * 0.7, COL.BLUE, 16, 11);
s2.add(b2.line); s2.add(b2.glow);
var f2 = flashPlane(); s2.add(f2);
scene.add(s2);

var s3 = new THREE.Group(); s3.visible = false;
s3.add(makeBG(bg3Frag));
var p3 = new ParticleSystem(150, [COL.BLUE, COL.WHITE, COL.GOLD], 55);
s3.add(p3.mesh);
var b3 = new LightningBolt(W/2, 0, W/2 + 50, H * 0.5, COL.BLUE, 18, 21);
s3.add(b3.line); s3.add(b3.glow);
var f3 = flashPlane(); s3.add(f3);
scene.add(s3);

// =============================================
// 2D DRAWING
// =============================================
function drawText(text, x, y, opts) {
    opts = opts || {};
    var font = opts.font || "700 48px Poppins";
    var color = opts.color || WHITE;
    var alpha = opts.alpha !== undefined ? opts.alpha : 1;
    var align = opts.align || "center";
    var shadow = opts.shadow || false;
    ctx.save();
    ctx.globalAlpha = clamp(alpha);
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    if (shadow) {
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 3;
    }
    ctx.fillText(text, x, y);
    ctx.restore();
}

function drawLogo(x, y, scale, alpha) {
    if (scale === undefined) scale = 1;
    if (alpha === undefined) alpha = 1;
    ctx.save();
    ctx.globalAlpha = clamp(alpha);
    if (logoImage) {
        var baseW = 450 * scale;
        var ratio = logoImage.height / logoImage.width;
        var dw = baseW, dh = baseW * ratio;
        ctx.shadowColor = "rgba(26,86,204,0.25)";
        ctx.shadowBlur = 20;
        ctx.drawImage(logoImage, x - dw/2, y, dw, dh);
    } else {
        var sz = Math.round(100 * scale);
        ctx.font = "900 " + sz + "px Poppins";
        ctx.textAlign = "left";
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 20;
        var iW = ctx.measureText("INERT").width;
        var xW = ctx.measureText("IX").width;
        var sx = x - (iW + xW) / 2;
        ctx.fillStyle = BLUE;
        ctx.fillText("INERT", sx, y);
        ctx.fillStyle = "#0d3d99";
        ctx.fillText("IX", sx + iW, y);
    }
    ctx.restore();
}

function drawDivider(x, y, w, progress, color) {
    if (progress < 0.02) return;
    color = color || BLUE;
    var aw = w * progress;
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = color;
    ctx.fillRect(x + (w - aw) / 2, y, aw, 3);
    ctx.restore();
}

function drawHeroCard(x, y, socioIndex, alpha, w, h) {
    w = w || 460;
    h = h || 600;
    var socio = SOCIOS[socioIndex];
    var img = socioImages[socioIndex];
    ctx.save();
    ctx.globalAlpha = clamp(alpha);

    // Card bg
    ctx.shadowColor = "rgba(26,86,204,0.2)";
    ctx.shadowBlur = 30;
    ctx.fillStyle = "rgba(8,14,30,0.95)";
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 20); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 2;
    ctx.globalAlpha = clamp(alpha) * 0.5;
    ctx.stroke();
    ctx.globalAlpha = clamp(alpha);

    // Photo
    var pX = x + 16, pY = y + 16, pW = w - 32, pH = h - 150;
    if (img) {
        ctx.save();
        ctx.beginPath(); ctx.roundRect(pX, pY, pW, pH, 14); ctx.clip();
        var imgR = img.width / img.height, areaR = pW / pH;
        var sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (imgR > areaR) { sw = img.height * areaR; sx = (img.width - sw) / 2; }
        else { sh = img.width / areaR; sy = (img.height - sh) / 2; }
        ctx.drawImage(img, sx, sy, sw, sh, pX, pY, pW, pH);
        var grad = ctx.createLinearGradient(pX, pY + pH - 100, pX, pY + pH);
        grad.addColorStop(0, "rgba(8,14,30,0)");
        grad.addColorStop(1, "rgba(8,14,30,0.9)");
        ctx.fillStyle = grad;
        ctx.fillRect(pX, pY + pH - 100, pW, 100);
        ctx.restore();
    } else {
        ctx.fillStyle = BLUE;
        ctx.globalAlpha = clamp(alpha) * 0.05;
        ctx.beginPath(); ctx.roundRect(pX, pY, pW, pH, 14); ctx.fill();
        ctx.globalAlpha = clamp(alpha);
        ctx.font = "100px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = WHITE;
        ctx.fillText("\u{1F464}", x + w/2, pY + pH/2 - 60);
    }

    // Name
    ctx.globalAlpha = clamp(alpha);
    ctx.font = "800 40px Poppins";
    ctx.fillStyle = WHITE;
    ctx.textAlign = "center";
    ctx.fillText(socio.nombre, x + w/2, y + h - 120);

    // Role
    ctx.font = "500 22px Poppins";
    ctx.fillStyle = BLUE;
    ctx.fillText(socio.rol, x + w/2, y + h - 72);

    // Bottom line
    ctx.fillStyle = BLUE;
    ctx.globalAlpha = clamp(alpha) * 0.6;
    ctx.fillRect(x + 16, y + h - 20, w - 32, 3);
    ctx.restore();
}

function drawServiceBlock(x, y, index, alpha, w, h) {
    w = w || 220;
    h = h || 260;
    var serv = SERVICIOS[index];
    var img = servicioImages[index];
    ctx.save();
    ctx.globalAlpha = clamp(alpha);

    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 16); ctx.fill();
    ctx.strokeStyle = "rgba(26,86,204,0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (img) {
        var iSize = 70;
        ctx.drawImage(img, x + (w - iSize) / 2, y + 20, iSize, iSize);
    }

    ctx.font = "700 18px Poppins";
    ctx.fillStyle = WHITE;
    ctx.textAlign = "center";
    var lines = serv.nombre.split("\n");
    for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x + w/2, y + 105 + i * 22);
    }

    ctx.font = "400 14px Poppins";
    ctx.fillStyle = "rgba(248,249,255,0.6)";
    for (var i = 0; i < serv.keywords.length; i++) {
        ctx.fillText(serv.keywords[i], x + w/2, y + 160 + i * 20);
    }
    ctx.restore();
}

// =============================================
// SCENE RENDERERS
// =============================================
function renderScene1(t) {
    p1.update(t, Math.min(1, t / 0.5) * 0.6);
    var boltA = easeOut(t / 0.4) * Math.max(0, 1 - (t - 0.8) / 0.7);
    b1.setOpacity(boltA * 0.5);
    if (t > 0.35 && t < 0.55) f1.material.opacity = Math.max(0, 1 - Math.abs(t - 0.43) / 0.08) * 0.4;
    else f1.material.opacity = 0;
    bloomPass.strength = 0.3 + boltA * 0.4;

    var ga = 1;
    if (t > D1 - 0.35) ga = 1 - (t - (D1 - 0.35)) / 0.35;

    // Logo top
    var lp = easeOut(Math.min(1, t / 0.5), 4);
    var ly = lerp(-100, H * 0.03, lp);
    var ls = t < 0.55 ? 1 + 0.08 * Math.max(0, 1 - (t - 0.45) / 0.12) * (1 - lp) : 1;
    drawLogo(W/2, ly, ls, lp * ga);

    // Title below logo - dark blue color on white bg
    var eyA = easeOut(Math.max(0, (t - 0.4) / 0.4));
    drawText("INGENIERIA & CONSTRUCCION", W/2, H * 0.03 + 130, {font: "600 32px Poppins", color: NAVY, alpha: eyA * ga});

    // Main tagline in blue zone
    var ta = easeOut(Math.max(0, (t - 0.6) / 0.5));
    var to = (1 - ta) * 60;
    drawText("Transformando", W/2, H * 0.28 + to, {font: "900 110px Poppins", color: WHITE, alpha: ta * ga, shadow: true});
    drawText("Bolivia", W/2, H * 0.28 + 120 + to, {font: "900 110px Poppins", color: WHITE, alpha: ta * ga, shadow: true});

    // Divider
    drawDivider((W - 280) / 2, H * 0.28 + 260, 280, easeOut(Math.max(0, (t - 1.0) / 0.4)) * ga);

    // Sub
    drawText("Soluciones tecnicas al mas alto nivel", W/2, H * 0.28 + 285, {font: "400 34px Poppins", color: "rgba(248,249,255,0.8)", alpha: easeOut(Math.max(0, (t - 1.1) / 0.5)) * ga});

    // Service blocks 4 columns
    var blockW = 220, gap = 25;
    var totalW = blockW * 4 + gap * 3;
    var startX = (W - totalW) / 2;
    var blockY = H * 0.55;
    for (var i = 0; i < 4; i++) {
        var delay = 1.3 + i * 0.15;
        var ba = easeOut(Math.max(0, (t - delay) / 0.4));
        var off = (1 - ba) * 50;
        drawServiceBlock(startX + i * (blockW + gap), blockY + off, i, ba * ga, blockW, 260);
    }
}

function renderScene2(t) {
    p2.update(t, Math.min(1, t / 0.4) * 0.5);
    var bla = easeOut(Math.max(0, (t - 0.1) / 0.4)) * Math.max(0, 1 - (t - 1.5) / 1);
    b2.setOpacity(bla * 0.4);
    if (t > 1.4 && t < 1.6) { f2.material.opacity = Math.max(0, 1 - Math.abs(t - 1.5) / 0.1) * 0.3; }
    else f2.material.opacity = 0;
    bloomPass.strength = 0.35 + bla * 0.3;

    var ga = 1;
    if (t > D2 - 0.35) ga = 1 - (t - (D2 - 0.35)) / 0.35;

    // Eyebrow
    var eyA = easeOut(Math.max(0, (t - 0.15) / 0.4));
    drawText("EQUIPO INERTIX", W/2, H * 0.04, {font: "600 34px Poppins", color: BLUE, alpha: eyA * ga});

    // Title
    var ta = easeOut(Math.max(0, (t - 0.3) / 0.5));
    var to = (1 - ta) * 60;
    drawText("Nuestros Socios", W/2, H * 0.08 + to, {font: "900 90px Poppins", color: WHITE, alpha: ta * ga, shadow: true});

    // Sub
    drawText("Dos ingenieros, una vision", W/2, H * 0.08 + 110, {font: "500 38px Poppins", color: "rgba(248,249,255,0.7)", alpha: easeOut(Math.max(0, (t - 0.6) / 0.4)) * ga});

    // Divider
    drawDivider((W - 240) / 2, H * 0.08 + 165, 240, easeOut(Math.max(0, (t - 0.8) / 0.35)) * ga);

    // Hero cards
    var cW = 460, cGap = 40, totalCW = cW * 2 + cGap;
    var leftX = (W - totalCW) / 2, cardY = H * 0.30;

    var c1a = easeOut(Math.max(0, (t - 0.9) / 0.5), 3);
    drawHeroCard(leftX + (1 - c1a) * -180, cardY, 0, c1a * ga, cW, 600);

    // Separator line
    var vsa = easeOut(Math.max(0, (t - 1.3) / 0.3));
    if (vsa > 0.01) {
        var vh = 500 * vsa;
        ctx.save();
        ctx.globalAlpha = vsa * ga * 0.5;
        ctx.fillStyle = BLUE;
        ctx.fillRect(leftX + cW + cGap/2 - 1, cardY + (600 - 500)/2 + (500 - vh)/2, 2, vh);
        ctx.restore();
    }

    var c2a = easeOut(Math.max(0, (t - 1.1) / 0.5), 3);
    drawHeroCard(leftX + cW + cGap + (1 - c2a) * 180, cardY, 1, c2a * ga, cW, 600);

    // Logo bottom
    var lgA = easeOut(Math.max(0, (t - 2.2) / 0.5));
    drawLogo(W/2, H * 0.88, 0.6, lgA * 0.7 * ga);
}

function renderScene3(t) {
    p3.update(t, Math.min(1, t / 0.4) * 0.7);
    var ba = easeOut(t / 0.3) * Math.max(0, 1 - (t - 0.5) / 0.6);
    b3.setOpacity(ba * 0.4);
    if (t > 0.25 && t < 0.42) { f3.material.opacity = Math.max(0, 1 - Math.abs(t - 0.33) / 0.08) * 0.35; }
    else f3.material.opacity = 0;
    bloomPass.strength = 0.35 + ba * 0.5;

    var ga = 1;
    if (t > D3 - 0.40) ga = 1 - (t - (D3 - 0.40)) / 0.40;

    // Eyebrow
    drawText("RECURSOS - INNOVACION", W/2, H * 0.04, {font: "600 32px Poppins", color: BLUE, alpha: easeOut(Math.max(0, (t - 0.1) / 0.4)) * ga});

    // Title
    var ta = easeOut(Math.max(0, (t - 0.3) / 0.5));
    var to = (1 - ta) * 70;
    drawText("Herramientas", W/2, H * 0.09 + to, {font: "900 100px Poppins", color: WHITE, alpha: ta * ga, shadow: true});
    drawText("para Bolivia", W/2, H * 0.09 + 110 + to, {font: "900 100px Poppins", color: WHITE, alpha: ta * ga, shadow: true});

    // Stats
    var stats = [
        {s: "\u221E", l: "VISION", d: 0.8},
        {s: "100%", l: "DEDICACION", d: 1.0},
        {s: "01", l: "EMPRESA", d: 1.2}
    ];
    var sGap = 280, sx = W/2 - sGap;
    for (var i = 0; i < stats.length; i++) {
        var st = stats[i];
        var sa = easeOut(Math.max(0, (t - st.d) / 0.4));
        var sOff = (1 - sa) * -40;
        ctx.save();
        ctx.globalAlpha = clamp(sa * ga);
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(26,86,204,0.3)";
        ctx.shadowBlur = 15;
        ctx.font = "900 85px Poppins";
        ctx.fillStyle = BLUE;
        ctx.fillText(st.s, sx + i * sGap, H * 0.38 + sOff);
        ctx.shadowBlur = 0;
        ctx.font = "700 30px Poppins";
        ctx.fillStyle = WHITE;
        ctx.fillText(st.l, sx + i * sGap, H * 0.38 + 80 + sOff);
        ctx.fillStyle = BLUE;
        ctx.globalAlpha = clamp(sa * ga) * 0.7;
        ctx.fillRect(sx + i * sGap - 30, H * 0.38 + 115 + sOff, 60, 3);
        ctx.restore();
    }

    // CTA button
    var cta = easeOut(Math.max(0, (t - 1.6) / 0.5));
    ctx.save();
    ctx.globalAlpha = clamp(cta * ga);
    var btnW = 500, btnH = 70, btnX = (W - btnW) / 2, btnY = H * 0.56;
    ctx.fillStyle = BLUE;
    ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, btnH/2); ctx.fill();
    ctx.font = "700 32px Poppins";
    ctx.fillStyle = WHITE;
    ctx.textAlign = "center";
    ctx.fillText("CONTACTANOS AHORA", W/2, btnY + 20);
    ctx.restore();

    // Secondary link
    ctx.save();
    ctx.globalAlpha = clamp(cta * ga) * 0.7;
    ctx.font = "500 28px Poppins";
    ctx.fillStyle = WHITE;
    ctx.textAlign = "center";
    ctx.fillText("Ver Proyectos", W/2, H * 0.56 + 95);
    ctx.restore();

    // Logo centered safely
    var lgA = easeOut(Math.max(0, (t - 1.8) / 0.5));
    var beat = 1 + 0.02 * Math.sin(t * 6);
    drawLogo(W/2, H * 0.68, beat * 0.9, lgA * 0.9 * ga);

    // Tagline
    drawText("INGENIERIA - BOLIVIA - INNOVACION", W/2, H * 0.68 + 120, {font: "600 28px Poppins", color: BLUE, alpha: easeOut(Math.max(0, (t - 2.0) / 0.5)) * ga});
}

// =============================================
// RENDER
// =============================================
function renderFrame(t) {
    clearOverlay();
    if (t < D1) {
        s1.visible = true; s2.visible = false; s3.visible = false;
        renderScene1(t);
    } else if (t < D1 + D2) {
        s1.visible = false; s2.visible = true; s3.visible = false;
        renderScene2(t - D1);
    } else {
        s1.visible = false; s2.visible = false; s3.visible = true;
        renderScene3(t - D1 - D2);
    }
    cinematicPass.uniforms.time.value = t;
    composer.render();
}

// =============================================
// PLAYBACK + RECORDING
// =============================================
var isPlaying = false, animId = null, startT = 0;
var timerEl = document.getElementById("timer");

function play() {
    if (isPlaying) return;
    isPlaying = true;
    startT = performance.now();
    function loop() {
        if (!isPlaying) return;
        var elapsed = (performance.now() - startT) / 1000;
        if (elapsed >= TOTAL_DURATION) {
            renderFrame(TOTAL_DURATION - 0.001);
            isPlaying = false;
            document.getElementById("status").textContent = "Completado";
            return;
        }
        renderFrame(elapsed);
        timerEl.textContent = Math.floor(elapsed / 60) + ":" + String(Math.floor(elapsed % 60)).padStart(2, "0");
        animId = requestAnimationFrame(loop);
    }
    loop();
}

function stop() {
    isPlaying = false;
    if (animId) { cancelAnimationFrame(animId); animId = null; }
}

async function record() {
    stop();
    var btn = document.getElementById("btn-record");
    btn.classList.add("active");
    btn.textContent = "GRABANDO...";
    var recCanvas = document.createElement("canvas");
    recCanvas.width = W; recCanvas.height = H;
    var rctx = recCanvas.getContext("2d");
    var stream = recCanvas.captureStream(FPS);
    var recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9", videoBitsPerSecond: 18000000 });
    var chunks = [];
    recorder.ondataavailable = function(e) { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = function() {
        var blob = new Blob(chunks, { type: "video/webm" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "INERTIX_Socios_1080x1920.webm";
        a.click();
        btn.classList.remove("active");
        btn.textContent = "GRABAR";
        document.getElementById("status").textContent = "Descargado";
    };
    recorder.start();
    var totalFrames = Math.ceil(TOTAL_DURATION * FPS);
    for (var f = 0; f < totalFrames; f++) {
        renderFrame(f / FPS);
        rctx.drawImage(canvas, 0, 0);
        rctx.drawImage(overlayCanvas, 0, 0);
        await new Promise(function(r) { setTimeout(r, 1000 / FPS); });
        document.getElementById("status").textContent = "Grabando " + Math.round(f / totalFrames * 100) + "%";
        timerEl.textContent = Math.floor((f/FPS) / 60) + ":" + String(Math.floor((f/FPS) % 60)).padStart(2, "0");
    }
    recorder.stop();
}

// =============================================
// INIT
// =============================================
document.getElementById("btn-play").addEventListener("click", function() {
    stop();
    play();
    document.getElementById("status").textContent = "Reproduciendo...";
});
document.getElementById("btn-record").addEventListener("click", record);

loadAllImages().then(function() {
    renderFrame(0);
    document.getElementById("status").textContent = "Listo - PLAY";
});

function fit() {
    var c = document.getElementById("canvas-container");
    var s = Math.min(window.innerWidth / W, window.innerHeight / H, 1) * 0.92;
    c.style.transform = "scale(" + s + ")";
}
fit();
window.addEventListener("resize", fit);
