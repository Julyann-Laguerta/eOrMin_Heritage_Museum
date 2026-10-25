/* Editable sample navigation model. Replace coordinates and edges after measuring the real building. */
window.MUSEUM_NAV_CONFIG = {
  version: 1,
  sample: true,
  waypoints: [
    { id:'entrance', label:'Museum Entrance', type:'checkpoint', floor:1, x:10, y:70, qr:'OMHM:LOC:entrance' },
    { id:'reception', label:'Reception Area', type:'checkpoint', floor:1, x:25, y:70, qr:'OMHM:LOC:reception' },
    { id:'main-hall', label:'Main Hallway', type:'checkpoint', floor:1, x:45, y:70, qr:'OMHM:LOC:main-hall' },
    { id:'area-a', label:'Exhibit Area A', type:'destination', floor:1, x:45, y:35, qr:'OMHM:LOC:area-a' },
    { id:'area-b', label:'Exhibit Area B', type:'destination', floor:1, x:72, y:70, qr:'OMHM:LOC:area-b' },
    { id:'artifact-gallery', label:'Artifact Gallery', type:'destination', floor:1, x:72, y:35, qr:'OMHM:LOC:artifact-gallery' },
    { id:'information', label:'Information Desk', type:'destination', floor:1, x:25, y:45, qr:'OMHM:LOC:information' },
    { id:'exit', label:'Museum Exit', type:'destination', floor:1, x:10, y:70, qr:'OMHM:LOC:exit' }
  ],
  edges: [
    { from:'entrance', to:'reception', meters:12, blocked:false },
    { from:'reception', to:'main-hall', meters:24, blocked:false },
    { from:'reception', to:'information', meters:18, blocked:false },
    { from:'main-hall', to:'area-a', meters:20, blocked:false },
    { from:'main-hall', to:'area-b', meters:27, blocked:false },
    { from:'area-a', to:'artifact-gallery', meters:18, blocked:false },
    { from:'area-b', to:'artifact-gallery', meters:16, blocked:false },
    { from:'information', to:'area-a', meters:30, blocked:false },
    { from:'entrance', to:'exit', meters:4, blocked:false }
  ]
};
try {
  const saved = localStorage.getItem('omhm-navigation-config');
  if (saved) window.MUSEUM_NAV_CONFIG = JSON.parse(saved);
} catch { /* Use the checked-in sample when local storage is unavailable. */ }
