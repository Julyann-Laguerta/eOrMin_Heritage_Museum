const modal = document.querySelector('.camera-modal');
const reveal = document.querySelector('.artifact-reveal');
const video = document.querySelector('#camera-feed');
const status = document.querySelector('#camera-status');
const model = document.querySelector('#artifact-model');
const qrModal = document.querySelector('.qr-modal');
const qrImage = document.querySelector('#qr-image');
const modelStatus = document.querySelector('#model-status');
const cameraView = document.querySelector('.camera-view');
let stream;
let scanTimer;
let navigationTimer;
const artifacts = {
  painting: { title:'The Painting', description:'A painted memory, now lifted from its frame and placed in your path. Move around it to find the details that only appear when you look closer.', src:'assets/painting.glb', material:'Pigment on canvas' },
  playok: { title:'Playok', description:'A hand-woven carrier, brought forward from the quiet of the display case. Look around it. Every edge holds a decision.', src:'assets/playok.glb', material:'Rattan & natural fiber' },
  olddress: { title:'Old Dress', description:'A garment in time — a record of movement, ritual, and the patient skill of making something last.', src:'assets/olddress.glb', material:'Woven textile' },
  garments: { title:'Garments', description:'Threads become identity. Explore the form and notice how pattern carries memory from one generation to the next.', src:'assets/garments.glb', material:'Natural fiber & dye' },
  cabinet: { title:'Memory Cabinet', description:'A small architecture for objects that stay. Rotate the cabinet and imagine what you would choose to keep.', src:'assets/Cabinet.glb', material:'Wood & hand finish' }
};
let current = 'painting';
model.src = artifacts[current].src;
let modelOrbitTimer = null;
let modelOrbitResumeTimer = null;
let modelOrbitPaused = false;
let modelOrbitAngle = 0;
let modelOrbitElevation = 8;

function syncModelOrbitFromUser(){
  const orbit = model.getCameraOrbit?.();
  if (!orbit) return;
  modelOrbitAngle = orbit.theta * 180 / Math.PI;
  modelOrbitElevation = 8 - (orbit.phi * 180 / Math.PI - 90);
}
function startModelOrbit(){
  clearTimeout(modelOrbitResumeTimer);
  cancelAnimationFrame(modelOrbitTimer);
  model.autoRotate = false;
  const tick = () => {
    if (!modelOrbitPaused && model.classList.contains('ar-model-overlay')) {
      modelOrbitAngle = (modelOrbitAngle + 0.12) % 360;
      const elevation = modelOrbitElevation + Math.sin(modelOrbitAngle * Math.PI / 180 * 0.7) * 10;
      model.cameraOrbit = `${modelOrbitAngle}deg ${90 - elevation}deg auto`;
    }
    modelOrbitTimer = requestAnimationFrame(tick);
  };
  modelOrbitTimer = requestAnimationFrame(tick);
}
function pauseModelOrbit(){
  syncModelOrbitFromUser();
  modelOrbitPaused = true;
  clearTimeout(modelOrbitResumeTimer);
}
function resumeModelOrbit(){
  syncModelOrbitFromUser();
  clearTimeout(modelOrbitResumeTimer);
  modelOrbitResumeTimer = setTimeout(() => { modelOrbitPaused = false; }, 900);
}
['pointerdown','touchstart','wheel'].forEach(eventName => model.addEventListener(eventName, pauseModelOrbit, { passive:true }));
['pointerup','pointercancel','touchend','touchcancel'].forEach(eventName => model.addEventListener(eventName, resumeModelOrbit, { passive:true }));

function openCamera(){ modal.classList.add('is-open'); modal.classList.remove('camera-fallback'); reveal.classList.remove('is-visible'); model.classList.remove('ar-model-overlay'); model.style.left=''; model.style.top=''; model.style.width=''; model.style.height=''; if(modelStage) modelStage.appendChild(model); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; status.textContent='Camera is ready — scan the Mangyang painting QR marker.'; startCamera(); }
function closeCamera(){ hideArtifactOverlay(); clearInterval(navigationTimer); navigationTimer=null; refreshNavigationOverlay=null; document.querySelector('.live-navigation-overlay')?.remove(); modal.classList.remove('is-open'); reveal.classList.remove('is-visible'); model.classList.remove('ar-model-overlay'); model.style.left=''; model.style.top=''; model.style.width=''; model.style.height=''; if(modelStage) modelStage.appendChild(model); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; if(stream){stream.getTracks().forEach(track=>track.stop());stream=null;} video.srcObject=null; if(scanTimer)cancelAnimationFrame(scanTimer); }
async function startCamera(){ if(!navigator.mediaDevices?.getUserMedia){ status.textContent='Camera unavailable — use demo scan to explore.'; return; } try { stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false}); video.srcObject=stream; status.textContent='Point your camera at the Mangyang QR marker.'; startQrDetection(); } catch { status.textContent='Camera access is off — use demo scan to explore.'; } }
function startQrDetection(){ if(!('BarcodeDetector' in window)){ status.textContent='QR detection is unavailable in this browser — use demo scan.'; return; } const detector=new BarcodeDetector({formats:['qr_code']}); const detect=async()=>{ if(!modal.classList.contains('is-open')||reveal.classList.contains('is-visible'))return; try{const codes=await detector.detect(video); if(codes.length){handleScanValue(codes[0].rawValue);return;}}catch{} scanTimer=requestAnimationFrame(detect); }; scanTimer=requestAnimationFrame(detect); }
function handleScanValue(value){ const normalized=String(value).toLowerCase(); if(normalized.includes('painting')){showArtifact('painting');status.textContent='Painting marker found.';} else if(normalized.includes('playok'))showArtifact('playok'); else status.textContent='Marker not recognized. Try the Mangyang painting QR.'; }
function showArtifact(key){ current=key; const item=artifacts[key]; model.src=item.src; document.querySelector('#reveal-title').textContent=item.title; document.querySelector('#reveal-description').textContent=item.description; document.querySelector('.reveal-meta strong').textContent=item.material; reveal.classList.remove('is-visible'); reveal.setAttribute('aria-hidden','true'); if(cameraView){ cameraView.appendChild(model); model.classList.add('ar-model-overlay'); model.style.left='50%'; model.style.top='47%'; model.style.width='min(58vw, 430px)'; model.style.height='min(58vw, 430px)'; } status.textContent=`${item.title} marker found — 3D object is now in the camera view.`; }
model.addEventListener('load',()=>{ modelStatus.textContent='3D artifact loaded — drag to explore.'; modelStatus.classList.remove('is-error'); });
model.addEventListener('error',()=>{ modelStatus.textContent=`3D file not found: ${artifacts[current].src}. Export the Blender file as GLB and place it in the assets folder.`; modelStatus.classList.add('is-error'); });
document.querySelectorAll('[data-open-camera]').forEach(btn=>btn.addEventListener('click',openCamera));
document.querySelectorAll('[data-close-camera]').forEach(btn=>btn.addEventListener('click',closeCamera));
document.querySelectorAll('[data-open-qr]').forEach(btn=>btn.addEventListener('click',()=>{ qrModal.classList.add('is-open'); qrModal.setAttribute('aria-hidden','false'); qrImage.src='https://api.qrserver.com/v1/create-qr-code/?size=440x440&data='+encodeURIComponent('MANGYANG:painting'); }));
document.querySelectorAll('[data-close-qr]').forEach(btn=>btn.addEventListener('click',()=>{qrModal.classList.remove('is-open');qrModal.setAttribute('aria-hidden','true');}));
document.querySelector('#demo-scan').addEventListener('click',()=>{ status.textContent='No demo reveal: place the Mangyang painting QR marker inside the camera frame.'; });
document.querySelector('#next-artifact').addEventListener('click',()=>{ const keys=Object.keys(artifacts); showArtifact(keys[(keys.indexOf(current)+1)%keys.length]); });
document.querySelectorAll('[data-artifact]').forEach(card=>card.addEventListener('click',()=>{ document.querySelectorAll('.artifact-card').forEach(c=>c.classList.remove('active')); card.classList.add('active'); current=card.dataset.artifact; openCamera(); }));
document.querySelector('#flash-toggle').addEventListener('click',e=>{ e.currentTarget.classList.toggle('active'); status.textContent=e.currentTarget.classList.contains('active')?'Flash marker enabled.':'Flash marker disabled.'; });
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCamera();});
const initialArtifact=new URLSearchParams(location.search).get('artifact');
if(initialArtifact&&artifacts[initialArtifact])showArtifact(initialArtifact);

// QR fallback for browsers without BarcodeDetector.
const qrCanvas = document.createElement('canvas');
const qrContext = qrCanvas.getContext('2d', { willReadFrequently: true });
const nativeQrDetection = startQrDetection;
startQrDetection = function(){
  if ('BarcodeDetector' in window) return nativeQrDetection();
  if (!window.jsQR || !qrContext) { status.textContent='QR detection is unavailable in this browser — use demo scan.'; return; }
  status.textContent='Point your camera at the Mangyang painting QR marker.';
  const detect = () => {
    if (!modal.classList.contains('is-open') || reveal.classList.contains('is-visible')) return;
    if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA && video.videoWidth) {
      qrCanvas.width = video.videoWidth; qrCanvas.height = video.videoHeight;
      qrContext.drawImage(video, 0, 0, qrCanvas.width, qrCanvas.height);
      const code = window.jsQR(qrCanvas.width ? qrContext.getImageData(0, 0, qrCanvas.width, qrCanvas.height).data : null, qrCanvas.width, qrCanvas.height, { inversionAttempts: 'attemptBoth' });
      if (code?.data) { handleScanValue(code.data); return; }
    }
    scanTimer = requestAnimationFrame(detect);
  };
  scanTimer = requestAnimationFrame(detect);
};

// Camera requires a secure origin. Keep the scanner surface visible and explain the fallback.
const originalOpenCamera = openCamera;
openCamera = function(){ modal.classList.add('is-open'); modal.classList.remove('camera-fallback'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; status.textContent='Camera is ready when you are.'; startCamera(); };
const originalStartCamera = startCamera;
startCamera = async function(){
  if(!window.isSecureContext || !navigator.mediaDevices?.getUserMedia){ modal.classList.add('camera-fallback'); status.textContent='Camera needs localhost or HTTPS. Demo scan is ready below.'; return; }
  try { stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false}); video.srcObject=stream; modal.classList.remove('camera-fallback'); status.textContent='Point your camera at the Mangyang QR marker.'; startQrDetection(); }
  catch { modal.classList.add('camera-fallback'); status.textContent='Camera permission was blocked. Use demo scan or allow camera access.'; }
};

const retryCamera = document.createElement('button');
retryCamera.className = 'demo-scan retry-camera';
retryCamera.textContent = 'Allow camera / retry';
retryCamera.addEventListener('click', startCamera);
document.querySelector('.camera-bottom')?.appendChild(retryCamera);

const modelStage = document.querySelector('.model-stage');
model.addEventListener('load', () => { if (model.classList.contains('ar-model-overlay')) startModelOrbit(); });
if (modelStage && !modelStage.querySelector('.fallback-3d')) {
  const fallback = document.createElement('div');
  fallback.className = 'fallback-3d';
  fallback.setAttribute('aria-label', 'Temporary 3D painting preview');
  fallback.innerHTML = '<div class="fallback-frame"><div class="fallback-canvas"><span></span><b></b><i></i></div></div><em>3D preview</em>';
  modelStage.appendChild(fallback);
}
model.addEventListener('load', () => modelStage?.classList.remove('model-missing'));
model.addEventListener('error', () => modelStage?.classList.add('model-missing'));

const navigationModal = document.querySelector('.navigation-modal');
const destinationSearch = document.querySelector('#destination-search');
const destinationResults = document.querySelector('#destination-results');
const routePanel = document.querySelector('#route-panel');
const navigationConfig = window.MUSEUM_NAV_CONFIG;
const destinations = navigationConfig.waypoints.filter(item => item.type === 'destination');
let navigationState = { confirmedWaypoint:'entrance', destination:null, route:[], currentIndex:0, orientationReady:false, deviceHeading:null };
let refreshNavigationOverlay = null;
let lastQrValue = '';
let lastQrAt = 0;

function getWaypoint(id){ return navigationConfig.waypoints.find(item => item.id === id); }
function neighbors(id){
  return navigationConfig.edges.filter(edge => !edge.blocked && (edge.from === id || edge.to === id)).map(edge => ({ id:edge.from === id ? edge.to : edge.from, meters:edge.meters }));
}
function findRoute(startId, goalId){
  if (!getWaypoint(startId) || !getWaypoint(goalId)) return [];
  const open = [{ id:startId, score:0 }];
  const cameFrom = new Map();
  const cost = new Map([[startId, 0]]);
  while (open.length) {
    open.sort((a,b) => a.score - b.score);
    const current = open.shift().id;
    if (current === goalId) {
      const route = [current];
      while (cameFrom.has(route[0])) route.unshift(cameFrom.get(route[0]));
      return route;
    }
    neighbors(current).forEach(next => {
      const nextCost = cost.get(current) + next.meters;
      if (nextCost < (cost.get(next.id) ?? Infinity)) {
        cost.set(next.id, nextCost);
        cameFrom.set(next.id, current);
        const target = getWaypoint(goalId);
        const node = getWaypoint(next.id);
        const heuristic = Math.hypot(target.x - node.x, target.y - node.y);
        open.push({ id:next.id, score:nextCost + heuristic });
      }
    });
  }
  return [];
}
function routeDistance(route){ return route.slice(0,-1).reduce((total, id, index) => total + (navigationConfig.edges.find(edge => !edge.blocked && ((edge.from === id && edge.to === route[index + 1]) || (edge.to === id && edge.from === route[index + 1])))?.meters || 0), 0); }
async function requestHeadingTracking(){
  if (!('DeviceOrientationEvent' in window)) return false;
  try {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== 'granted') return false;
    }
    const handleOrientation = event => {
      const compassHeading = typeof event.webkitCompassHeading === 'number'
        ? event.webkitCompassHeading
        : (event.absolute && typeof event.alpha === 'number' ? (360 - event.alpha) % 360 : null);
      if (typeof compassHeading !== 'number' || Number.isNaN(compassHeading)) return;
      navigationState.deviceHeading = compassHeading;
      navigationState.orientationReady = true;
      if (document.querySelector('.live-navigation-overlay')) refreshNavigationOverlay?.();
    };
    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
    return true;
  } catch { return false; }
}
function routeBearing(from, to){
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const mapNorth = Number(navigationConfig.mapNorth || 0);
  return (Math.atan2(dx, -dy) * 180 / Math.PI + 360 + mapNorth) % 360;
}
function directionFor(route, index){
  const current = getWaypoint(route[index]);
  const next = getWaypoint(route[index + 1]);
  if (!current || !next) return { symbol:'✓', rotation:0 };
  const bearing = routeBearing(current, next);
  const rotation = navigationState.deviceHeading == null
    ? bearing
    : (bearing - navigationState.deviceHeading + 360) % 360;
  return { symbol:'↑', rotation };
}
function snakePathFor(route, index){
  const current = getWaypoint(route[index]);
  if (!current) return 'M 50 88 L 50 18';
  const points = [{ x:50, y:88 }];
  route.slice(index + 1).forEach(id => {
    const node = getWaypoint(id);
    if (!node) return;
    points.push({
      x: Math.max(10, Math.min(90, 50 + (node.x - current.x) * 0.8)),
      y: Math.max(12, Math.min(88, 88 + (node.y - current.y) * 0.8))
    });
  });
  if (points.length === 1) points.push({ x:50, y:18 });
  return points.map((point, pointIndex) => {
    if (pointIndex === 0) return `M ${point.x} ${point.y}`;
    const previous = points[pointIndex - 1];
    const midX = (previous.x + point.x) / 2;
    const midY = (previous.y + point.y) / 2;
    return `Q ${previous.x} ${previous.y} ${midX} ${midY} T ${point.x} ${point.y}`;
  }).join(' ');
}
function instructionFor(route, index){
  if (!route.length || index >= route.length - 1) return 'You have arrived at your destination.';
  const from = getWaypoint(route[index]);
  const to = getWaypoint(route[index + 1]);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'back toward the entrance' : 'ahead');
  return `Walk ${Math.max(1, Math.round(Math.hypot(dx,dy) / 10)) * 10} m ${direction} toward ${to.label}. Scan the next checkpoint QR when you reach it.`;
}

function renderDestinations(query=''){
  const matches = destinations.filter(item => item.label.toLowerCase().includes(query.trim().toLowerCase()));
  destinationResults.innerHTML = matches.length ? matches.map(item => `<button class="destination-result" data-destination="${item.id}"><span>${item.label}</span><small>Floor ${item.floor} · ${item.type}</small><b>↗</b></button>`).join('') : '<p class="no-destination">No destination found. Try “gallery” or “exit”.</p>';
  destinationResults.querySelectorAll('[data-destination]').forEach(button => button.addEventListener('click', () => showRoute(button.dataset.destination)));
}

function showRoute(key){
  const destination = getWaypoint(key);
  if (!destination) return;
  const route = findRoute(navigationState.confirmedWaypoint, destination.id);
  const routePoints = route.map(id => { const node = getWaypoint(id); return `${node.x},${node.y}`; }).join(' ') || `${destination.x},${destination.y}`;
  const distance = route.length ? `${routeDistance(route)} m` : 'No route';
  routePanel.hidden = false;
  routePanel.innerHTML = `<div class="route-heading"><div><span class="route-kicker">DESTINATION</span><h3>${destination.label}</h3><p>Confirmed start: ${getWaypoint(navigationState.confirmedWaypoint)?.label || 'Unknown'}</p></div><strong>${distance}</strong></div><div class="route-floor-plan ${destination.id}"><img src="assets/museum-floor-plan.png" alt="Editable sample museum floor plan route to ${destination.label}"><svg viewBox="0 0 100 100" aria-hidden="true"><polyline points="${routePoints}" class="floor-route"></polyline></svg><span class="floor-you">YOU</span><span class="floor-destination">${destination.label}</span></div><p class="route-disclaimer">${navigationConfig.sample ? 'Sample map: replace the waypoint coordinates and paths with the measured museum layout.' : 'Route calculated from the museum waypoint map.'}</p>${route.length ? `<button class="route-start" type="button">Start live camera direction <span>↗</span></button>` : '<p class="no-destination">No open walking route. Ask staff to unblock a path.</p>'}`;
  routePanel.querySelector('.route-start')?.addEventListener('click', () => startLiveNavigation(destination, route));
}

function startLiveNavigation(destination, route = findRoute(navigationState.confirmedWaypoint, destination.id)){
  navigationModal.classList.remove('is-open');
  navigationModal.setAttribute('aria-hidden','true');
  navigationState.destination = destination.id;
  navigationState.route = route;
  navigationState.currentIndex = Math.max(0, route.indexOf(navigationState.confirmedWaypoint));
  requestHeadingTracking().then(() => { if (document.querySelector('.live-navigation-overlay')) refreshNavigationOverlay?.(); });
  openCamera();
  const existing = document.querySelector('.live-navigation-overlay');
  existing?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'live-navigation-overlay';
  const locationName = destination.label;
  const render = () => {
    const index = navigationState.currentIndex;
    const current = getWaypoint(navigationState.route[index]);
    const next = getWaypoint(navigationState.route[index + 1]);
    const direction = instructionFor(navigationState.route, index);
    const dx = next ? next.x - current.x : 0;
    const dy = next ? next.y - current.y : 0;
    const arrow = !next ? '✓' : Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? '→' : '←') : (dy > 0 ? '↓' : '↑');
    const arrived = !next;
    const arrowDirection = directionFor(navigationState.route, index);
    const trackingLabel = navigationState.orientationReady ? 'HEADING SENSOR AVAILABLE · QR CHECKPOINTS CONFIRM POSITION' : 'QR CHECKPOINT MODE · CONTINUOUS POSITION NOT AVAILABLE';
    overlay.innerHTML = `<div class="live-nav-label"><span>LIVE AR NAVIGATION · ${navigationConfig.sample ? 'SAMPLE MAP' : 'CHECKPOINT MODE'}</span><div class="live-nav-location"><i>⌖</i><strong>${locationName}</strong></div><small>${trackingLabel}</small><small>Confirmed at ${current?.label || 'unknown'} · ${routeDistance(navigationState.route)} m total</small></div><div class="live-nav-path"><i></i><b></b><em></em><strong></strong></div><div class="live-nav-arrow ${arrived ? 'arrived' : ''}" aria-label="Direction arrow">${arrow}</div><div class="live-nav-card"><div class="live-nav-card-copy"><span>${arrived ? 'DESTINATION REACHED' : 'NEXT CHECKPOINT'}</span><strong>${arrived ? 'You Have Arrived at Your Destination!' : next?.label || destination.label}</strong><small>${direction}</small></div><button type="button" class="live-nav-stop">Stop</button><button type="button" class="live-nav-route-overview">Route overview</button></div>`;
    const snakeHost = overlay.querySelector('.live-nav-path');
    if (snakeHost) {
      const snakePath = snakePathFor(navigationState.route, index);
      snakeHost.innerHTML = `<svg class="live-route-snake" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Animated route to ${destination.label}"><path id="live-route-snake-path" class="live-route-line" d="${snakePath}" pathLength="1"></path><circle class="live-route-dot" r="1.7"><animateMotion dur="2.8s" repeatCount="indefinite"><mpath href="#live-route-snake-path" xlink:href="#live-route-snake-path"></mpath></animateMotion></circle><circle class="live-route-dot" r="1.3"><animateMotion dur="2.8s" begin="-0.9s" repeatCount="indefinite"><mpath href="#live-route-snake-path" xlink:href="#live-route-snake-path"></mpath></animateMotion></circle><text class="live-route-arrow">➤<animateMotion dur="2.8s" begin="-1.8s" repeatCount="indefinite" rotate="auto"><mpath href="#live-route-snake-path" xlink:href="#live-route-snake-path"></mpath></animateMotion></text><circle class="live-route-destination" cx="90" cy="14" r="2.6"></circle></svg>`;
    }
    const arrowElement = overlay.querySelector('.live-nav-arrow');
    if (arrowElement) {
      arrowElement.textContent = arrowDirection.symbol;
      arrowElement.style.setProperty('--arrow-rotation', `${arrowDirection.rotation}deg`);
    }
    overlay.querySelector('.live-nav-stop').addEventListener('click', closeCamera);
    overlay.querySelector('.live-nav-route-overview').addEventListener('click', () => { closeCamera(); navigationModal.classList.add('is-open'); navigationModal.setAttribute('aria-hidden','false'); renderDestinations(); if (navigationState.destination) showRoute(navigationState.destination); });
  };
  refreshNavigationOverlay = () => {
    if (!overlay.isConnected) cameraView.appendChild(overlay);
    render();
  };
  clearInterval(navigationTimer);
  navigationTimer = null;
}

document.querySelectorAll('[data-open-navigation]').forEach(button => button.addEventListener('click', () => { navigationModal.classList.add('is-open'); navigationModal.setAttribute('aria-hidden','false'); destinationSearch.focus(); renderDestinations(); }));
document.querySelectorAll('[data-close-navigation]').forEach(button => button.addEventListener('click', () => { navigationModal.classList.remove('is-open'); navigationModal.setAttribute('aria-hidden','true'); }));
document.querySelectorAll('[data-open-navigation-qr]').forEach(button => button.addEventListener('click', () => { const qrModal = document.querySelector('#navigation-qr-modal'); qrModal.classList.add('is-open'); qrModal.setAttribute('aria-hidden','false'); }));
document.querySelectorAll('[data-open-navigation-qr]').forEach(button => button.addEventListener('click', () => {
  const image = document.querySelector('#navigation-qr-modal img');
  if (image) image.src = `https://api.qrserver.com/v1/create-qr-code/?size=440x440&data=${encodeURIComponent('MANGYANG:NAV:ENTRANCE')}`;
}));
document.querySelectorAll('[data-close-navigation-qr]').forEach(button => button.addEventListener('click', () => { const qrModal = document.querySelector('#navigation-qr-modal'); qrModal.classList.remove('is-open'); qrModal.setAttribute('aria-hidden','true'); }));
destinationSearch?.addEventListener('input', event => renderDestinations(event.target.value));

let markerLastSeen = 0;
let infoButton;
let infoPanel;

function hideArtifactOverlay(){
  markerLastSeen = 0;
  cancelAnimationFrame(modelOrbitTimer);
  modelOrbitPaused = false;
  window.speechSynthesis?.cancel();
  model.classList.remove('ar-model-overlay');
  model.style.left=''; model.style.top=''; model.style.width=''; model.style.height='';
  if (modelStage) modelStage.appendChild(model);
  infoButton?.remove(); infoPanel?.remove(); infoButton = null; infoPanel = null;
}

function showArtifactInfo(item){
  if (!cameraView || infoPanel) return;
  infoButton = document.createElement('button');
  infoButton.className = 'ar-info-button';
  infoButton.type = 'button';
  infoButton.textContent = 'View meaning';
  infoPanel = document.createElement('div');
  infoPanel.className = 'ar-info-panel';
  infoPanel.innerHTML = `<button type="button" class="ar-info-close" aria-label="Close meaning">×</button><span>THE STORY / ${item.title}</span><p>${item.description}</p>`;
  infoButton.addEventListener('click', () => { infoPanel.classList.add('is-visible'); speakNarration(item.description); });
  infoPanel.querySelector('.ar-info-close').addEventListener('click', () => { infoPanel.classList.remove('is-visible'); window.speechSynthesis?.cancel(); });
  cameraView.append(infoButton, infoPanel);
}

function speakNarration(text){
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => /female|samantha|victoria|karen|zira|susan|jenny|aria|ava/i.test(voice.name))
      || voices.find(voice => /^en(-|_)/i.test(voice.lang));
    if (femaleVoice) utterance.voice = femaleVoice;
    utterance.lang = femaleVoice?.lang || 'en-US';
    utterance.rate = 0.92;
    utterance.pitch = 1.08;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  };
  if (window.speechSynthesis.getVoices().length) speak();
  else window.speechSynthesis.addEventListener('voiceschanged', speak, { once:true });
}

const trackedShowArtifact = showArtifact;
showArtifact = function(key){
  trackedShowArtifact(key);
  showArtifactInfo(artifacts[key]);
};

const trackedHandleScanValue = handleScanValue;
function waypointFromQr(value){
  const normalized = decodeURIComponent(String(value)).toLowerCase().replace(/[_\s]+/g, '-');
  const match = normalized.match(/(?:omhm:loc:|mangyang:nav:|mangyang:loc:)([a-z0-9-]+)/i);
  if (match?.[1]) return getWaypoint(match[1]);
  if (/entrance|front[- -]?door|museum[- -]?start/.test(normalized)) return getWaypoint('entrance');
  return null;
}
handleScanValue = function(value){
  const raw = String(value).trim();
  const normalized = raw.toLowerCase();
  const waypoint = waypointFromQr(raw);
  if (waypoint) {
    navigationState.confirmedWaypoint = waypoint.id;
    if (navigationState.destination && modal.classList.contains('is-open')) {
      navigationState.route = findRoute(waypoint.id, navigationState.destination);
      navigationState.currentIndex = Math.max(0, navigationState.route.indexOf(waypoint.id));
      status.textContent = `Checkpoint confirmed: ${waypoint.label}. Route recalculated.`;
      refreshNavigationOverlay?.();
    } else {
      closeCamera();
      navigationModal.classList.add('is-open');
      navigationModal.setAttribute('aria-hidden','false');
      renderDestinations();
      status.textContent = `Starting location confirmed: ${waypoint.label}. Choose a destination.`;
    }
    return;
  }
  if (normalized.includes('painting')) {
    const alreadyVisible = model.classList.contains('ar-model-overlay');
    markerLastSeen = Date.now();
    if (!alreadyVisible) trackedHandleScanValue(value);
  }
};

startQrDetection = function(){
  if (scanTimer) cancelAnimationFrame(scanTimer);
  const detector = 'BarcodeDetector' in window ? new BarcodeDetector({formats:['qr_code']}) : null;
  if (!detector && (!window.jsQR || !qrContext)) { status.textContent='QR detection is unavailable in this browser.'; return; }
  status.textContent = navigationState.destination ? 'Scan the next museum checkpoint QR to confirm your position.' : 'Scan a museum location QR checkpoint.';
  const detect = async () => {
    if (!modal.classList.contains('is-open')) return;
    let rawValue = '';
    try {
      if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA && video.videoWidth) {
        if (detector) {
          const codes = await detector.detect(video);
          rawValue = codes[0]?.rawValue || '';
        } else {
          qrCanvas.width = video.videoWidth; qrCanvas.height = video.videoHeight;
          qrContext.drawImage(video, 0, 0, qrCanvas.width, qrCanvas.height);
          const image = qrContext.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
          rawValue = window.jsQR(image.data, image.width, image.height, { inversionAttempts:'attemptBoth' })?.data || '';
        }
      }
    } catch {}
    const normalized = rawValue.toLowerCase();
    const recognized = normalized.includes('painting') || Boolean(waypointFromQr(rawValue));
    if (recognized && normalized.includes('painting')) markerLastSeen = Date.now();
    if (recognized && (rawValue !== lastQrValue || Date.now() - lastQrAt > 2500)) {
      lastQrValue = rawValue;
      lastQrAt = Date.now();
      handleScanValue(rawValue);
    } else if (markerLastSeen && Date.now() - markerLastSeen > 500) {
      hideArtifactOverlay();
      status.textContent = navigationState.destination ? 'Checkpoint not visible. Scan the next location QR when you reach it.' : 'Marker lost — scan a museum location QR checkpoint.';
    }
    scanTimer = requestAnimationFrame(detect);
  };
  scanTimer = requestAnimationFrame(detect);
};
