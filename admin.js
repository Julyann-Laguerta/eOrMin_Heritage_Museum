const seedArtifacts = [{ id:'painting', name:'The Painting', description:'Painted memory from the main gallery.', file:'assets/painting.glb', condition:'Clean', updated:'Today' }, { id:'playok', name:'Playok', description:'Hand-woven carrier from the craft collection.', file:'assets/playok.glb', condition:'Needs review', updated:'Today' }, { id:'cabinet', name:'Memory Cabinet', description:'A small architecture for objects that stay.', file:'assets/Cabinet.glb', condition:'Clean', updated:'Yesterday' }];
const conditionOptions = ['Clean','Needs review','Damaged','In restoration'];
const stored = localStorage.getItem('omhm-artifacts');
let artifacts = stored ? JSON.parse(stored) : seedArtifacts;
const save = () => localStorage.setItem('omhm-artifacts', JSON.stringify(artifacts));
const $ = (selector) => document.querySelector(selector);

function renderChecklist(){
  $('#checklist').innerHTML = artifacts.slice(0, 5).map(item => `<div class="check-row"><div><strong>${item.name}</strong><small>Last checked ${item.updated || 'Today'}</small></div>${conditionOptions.map(condition => `<button class="condition ${item.condition === condition ? 'active' : ''}" data-id="${item.id}" data-condition="${condition}" type="button">${condition}</button>`).join('')}</div>`).join('');
  document.querySelectorAll('.condition').forEach(button => button.addEventListener('click', () => { const item = artifacts.find(entry => entry.id === button.dataset.id); if (!item) return; item.condition = button.dataset.condition; item.updated = 'Today'; save(); render(); }));
}
function renderRecords(){
  $('#artifact-list').innerHTML = artifacts.length ? artifacts.map(item => `<article class="artifact-record"><div class="record-top"><div><h3>${item.name}</h3><span class="record-meta">${item.file || 'Local 3D asset'}</span></div><span class="health-badge">${item.condition}</span></div><div class="record-meta">${item.description || 'No description added.'}</div><div class="record-actions"><span class="record-meta">QR ready · ${item.updated || 'Today'}</span><button class="qr-button" data-qr="${item.id}" type="button">View QR ↗</button></div></article>`).join('') : '<p class="empty-state">No artifacts yet. Add your first 3D object above.</p>';
  document.querySelectorAll('[data-qr]').forEach(button => button.addEventListener('click', () => openQr(artifacts.find(item => item.id === button.dataset.qr))));
}
function render(){ $('#artifact-count').textContent = artifacts.length; $('#attention-count').textContent = artifacts.filter(item => item.condition !== 'Clean').length; renderChecklist(); renderRecords(); }
function openQr(item){ if (!item) return; const value = `OMHM:artifact:${item.id}`; $('#qr-title').textContent = item.name; $('#qr-value').textContent = value; const imageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=440x440&data=${encodeURIComponent(value)}`; $('#qr-image').src = imageUrl; $('#download-qr').href = imageUrl; $('#qr-dialog').classList.add('open'); $('#qr-dialog').setAttribute('aria-hidden','false'); }
$('#artifact-file').addEventListener('change', event => { const file = event.target.files[0]; if (file) $('#file-name').textContent = file.name; });
$('#artifact-form').addEventListener('submit', event => { event.preventDefault(); const name = $('#artifact-name').value.trim(); const file = $('#artifact-file').files[0]; const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${Date.now()}`; const item = { id, name, description:$('#artifact-description').value.trim() || 'Newly catalogued artifact.', file:file?.name || '3D file pending', condition:'Clean', updated:'Today' }; artifacts = [item, ...artifacts]; save(); render(); event.target.reset(); $('#file-name').textContent = 'Drop a .GLB or .GLTF file here'; $('#upload-message').textContent = `${name} added. Its QR marker is ready below.`; setTimeout(() => openQr(item), 250); });
$('#clear-data').addEventListener('click', () => { artifacts = seedArtifacts.map(item => ({...item})); save(); render(); $('#upload-message').textContent = 'Demo data restored.'; });
$('#close-qr').addEventListener('click', () => { $('#qr-dialog').classList.remove('open'); $('#qr-dialog').setAttribute('aria-hidden','true'); });
$('#qr-dialog').addEventListener('click', event => { if (event.target.id === 'qr-dialog') $('#close-qr').click(); });
$('#today').textContent = new Intl.DateTimeFormat('en',{month:'short',day:'numeric',year:'numeric'}).format(new Date());
render();

const navConfig = JSON.parse(JSON.stringify(window.MUSEUM_NAV_CONFIG));
function openLocationQr(waypoint){
  const value = waypoint.qr || `OMHM:LOC:${waypoint.id}`;
  $('#qr-title').textContent = waypoint.label;
  $('#qr-value').textContent = value;
  const imageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=440x440&data=${encodeURIComponent(value)}`;
  $('#qr-image').src = imageUrl;
  $('#download-qr').href = imageUrl;
  $('#download-qr').download = `${waypoint.id}-checkpoint-qr.png`;
  $('#qr-dialog').classList.add('open');
  $('#qr-dialog').setAttribute('aria-hidden','false');
}
function renderNavigationConfig(){
  const locationOptions = navConfig.waypoints.map(item => `<option value="${item.id}">${item.label}</option>`).join('');
  $('#path-from').innerHTML = locationOptions;
  $('#path-to').innerHTML = locationOptions;
  $('#waypoint-list').innerHTML = navConfig.waypoints.map(waypoint => `<div class="waypoint-row"><div><strong>${waypoint.label}</strong><small>${waypoint.id} · QR: ${waypoint.qr}</small></div><label><span class="record-meta">X</span><input class="waypoint-coordinate" data-id="${waypoint.id}" data-axis="x" value="${waypoint.x}" type="number" min="0" max="100" /></label><label><span class="record-meta">Y</span><input class="waypoint-coordinate" data-id="${waypoint.id}" data-axis="y" value="${waypoint.y}" type="number" min="0" max="100" /></label><button class="qr-mini-button" data-location-qr="${waypoint.id}" type="button">QR ↗</button></div>`).join('');
  $('#path-list').innerHTML = navConfig.edges.map((edge, index) => { const from = navConfig.waypoints.find(item => item.id === edge.from); const to = navConfig.waypoints.find(item => item.id === edge.to); return `<div class="path-row"><div><strong>${from?.label || edge.from} → ${to?.label || edge.to}</strong><small>${edge.meters} m walking path</small></div><button class="block-button ${edge.blocked ? 'blocked' : ''}" data-path-index="${index}" type="button">${edge.blocked ? 'Blocked' : 'Open'}</button></div>`; }).join('');
  document.querySelectorAll('.waypoint-coordinate').forEach(input => input.addEventListener('change', event => { const waypoint = navConfig.waypoints.find(item => item.id === event.target.dataset.id); waypoint[event.target.dataset.axis] = Number(event.target.value); }));
  document.querySelectorAll('[data-location-qr]').forEach(button => button.addEventListener('click', () => openLocationQr(navConfig.waypoints.find(item => item.id === button.dataset.locationQr))));
  document.querySelectorAll('[data-path-index]').forEach(button => button.addEventListener('click', () => { const edge = navConfig.edges[Number(button.dataset.pathIndex)]; edge.blocked = !edge.blocked; renderNavigationConfig(); }));
}
$('#save-navigation').addEventListener('click', () => { localStorage.setItem('omhm-navigation-config', JSON.stringify(navConfig)); $('#navigation-message').textContent = 'Navigation map saved on this device. Reload the public site to use the new map.'; });
renderNavigationConfig();
$('#waypoint-form').addEventListener('submit', event => { event.preventDefault(); const id = $('#waypoint-id').value.trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-'); if (!id || navConfig.waypoints.some(item => item.id === id)) return; const label = $('#waypoint-label').value.trim(); navConfig.waypoints.push({ id, label, type:$('#waypoint-type').value, floor:1, x:50, y:50, qr:`OMHM:LOC:${id}` }); event.target.reset(); renderNavigationConfig(); $('#navigation-message').textContent = `${label} added. Print its QR marker from the list.`; });
$('#path-form').addEventListener('submit', event => { event.preventDefault(); const from = $('#path-from').value; const to = $('#path-to').value; const meters = Number($('#path-meters').value); if (from === to || !meters || navConfig.edges.some(edge => (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from))) return; navConfig.edges.push({ from, to, meters, blocked:false }); event.target.reset(); renderNavigationConfig(); $('#navigation-message').textContent = 'Walking path connected. Save the navigation map when ready.'; });
