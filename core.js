/* KOPTAN · مدير أعمالي — v9 Titanium Liquid Glass
   core: i18n, state, storage (IndexedDB "pbm" v5 — unchanged schema, fully compatible), formatting, UI primitives, images, files. */
'use strict';
const APP_VER='9.5.0';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const num=v=>Math.round((+v||0)*100)/100;

/* ---------- i18n: Arabic source strings, English dictionary in i18n.js ---------- */
let LANG=(()=>{try{return localStorage.getItem('koptan.lang')||'ar'}catch(e){return'ar'}})();
const L=(s,v)=>{let r=LANG==='en'&&window.EN&&EN[s]!=null?EN[s]:s;if(v)r=r.replace(/\{(\w+)\}/g,(_,k)=>v[k]??'');return r};
const loc=()=>LANG==='en'?'en-GB':'ar-EG-u-nu-latn';
function applyDir(){const h=document.documentElement;h.lang=LANG;h.dir=LANG==='en'?'ltr':'rtl'}
applyDir();

/* ---------- icons (Lucide, ISC) ---------- */
const LU={
home:'<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
pkg:'<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><polyline points="3.29 7 12 12 20.71 7"/><path d="m7.5 4.27 9 5.15"/>',
cart:'<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
hand:'<path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"/><path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/><path d="m2 16 6 6"/><circle cx="16" cy="9" r="2.9"/><circle cx="6" cy="5" r="3"/>',
grid:'<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
eye:'<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
eyeoff:'<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>',
plus:'<path d="M5 12h14"/><path d="M12 5v14"/>',minus:'<path d="M5 12h14"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
chevR:'<path d="m9 18 6-6-6-6"/>',chevL:'<path d="m15 18-6-6 6-6"/>',chevD:'<path d="m6 9 6 6 6-6"/>',
up:'<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',down:'<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
cal:'<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
chk:'<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
chart:'<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
shield:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
dl:'<path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/>',
ul:'<path d="M12 3v12"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
truck:'<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
star:'<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
pen:'<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
trash:'<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
img:'<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
imgplus:'<path d="M16 5h6"/><path d="M19 2v6"/><path d="M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/><circle cx="9" cy="9" r="2"/>',
sort:'<path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>',
warn:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
bell:'<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
lock:'<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
aup:'<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',adn:'<path d="M17 7 7 17"/><path d="M17 17H7V7"/>',
mega:'<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
fuel:'<line x1="3" x2="15" y1="22" y2="22"/><line x1="4" x2="14" y1="9" y2="9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/>',
wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/>',
user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
more:'<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
check:'<path d="M20 6 9 17l-5-5"/>',cok:'<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',circ:'<circle cx="12" cy="12" r="10"/>',
list:'<path d="M3 5h.01M3 12h.01M3 19h.01M8 5h13M8 12h13M8 19h13"/>',
dollar:'<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
repl:'<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
vib:'<path d="m2 8 2 4-2 4"/><path d="m22 8-2 4 2 4"/><rect width="8" height="14" x="8" y="5" rx="1"/>',
info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
copy:'<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
camera:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
card:'<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
receipt:'<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
map:'<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
archive:'<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/>',
gear:'<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
lang:'<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
db:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
fchk:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/>',
sq:'<rect width="18" height="18" x="3" y="3" rx="4"/>',sqc:'<rect width="18" height="18" x="3" y="3" rx="4"/><path d="m8 12 3 3 5-6"/>',
spark:'<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
link:'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
merge:'<path d="m8 6 4-4 4 4"/><path d="M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22"/><path d="m20 22-5-5"/>',
share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
clock:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
scan:'<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 8v8"/><path d="M11 8v8"/><path d="M15 8v8"/><path d="M18 8v8"/>',
finger:'<path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>',
target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
bksp:'<path d="M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/><path d="m12 9 6 6"/><path d="m18 9-6 6"/>'
};
const WA_SVG='<svg class="wa-i" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>';
const SV=(d,c='')=>`<svg class="si ${c}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
/* "back" chevron points to the reading start edge */
const BACK=()=>LANG==='en'?LU.chevL:LU.chevR,FWD=()=>LANG==='en'?LU.chevR:LU.chevL;

/* ---------- state ---------- */
const KDEF={cur:'USD',rate:90000,hide:false,pin:'',vib:true,anim:true,cc:'961',hp:'m',srt:'new',lastBk:0,lang:'ar',lite:null,nfStock:true,nfDebt:true,nfBk:true,nr:[],nd:[],nt:{},chr:'d',chm:'net'};
let S={p:[],sp:[],s:[],e:[],l:[],t:[],d:[],k:{...KDEF},dr:null},db=null,memOnly=false;
const STORES=['p','s','e','l','t','d','sp'];

/* ---------- storage ---------- */
function openDB(){return new Promise((res,rej)=>{try{const r=indexedDB.open('pbm',5);r.onupgradeneeded=()=>{['p','s','e','k','l','t','d','img','sp'].forEach(n=>{if(!r.result.objectStoreNames.contains(n))r.result.createObjectStore(n,{keyPath:'id'})})};r.onsuccess=()=>{db=r.result;res()};r.onerror=()=>rej(r.error);r.onblocked=()=>rej(new Error('blocked'))}catch(e){rej(e)}})}
const tx=(st,m)=>db.transaction(st,m).objectStore(st);
const rq=r=>new Promise((a,b)=>{r.onsuccess=()=>a(r.result);r.onerror=()=>b(r.error)});
/* data version: bumped on every write, used to cache derived results (notifications, reorder, customers, activity) */
let DV=0;const MEMO=new Map();
function memo(key,fn){const k=key+'|'+DV+'|'+sod()+'|'+LANG,h=MEMO.get(key);if(h&&h.k===k)return h.v;const v=fn();MEMO.set(key,{k,v});return v}
async function put(st,o){DV++;if(memOnly)return;try{await rq(tx(st,'readwrite').put(o))}catch(e){toast(L('تعذر الحفظ')+': '+(e&&e.name||''),'w')}}
async function del(st,id){DV++;if(memOnly)return;try{await rq(tx(st,'readwrite').delete(id))}catch(e){toast(L('تعذر الحذف'),'w')}}
let _skT=null;
const saveK=()=>{clearTimeout(_skT);return put('k',{id:'k',...S.k})};
const saveKSoon=()=>{clearTimeout(_skT);_skT=setTimeout(()=>put('k',{id:'k',...S.k}),400)};
/* removes accidental duplicate records (same id) so nothing is ever counted twice */
const uniq=a=>{const m=new Map();(a||[]).forEach(o=>{if(o&&o.id!=null)m.set(o.id,o)});return[...m.values()]};
async function load(){let rawLang='';try{await openDB();for(const n of STORES)S[n]=uniq(await rq(tx(n,'readonly').getAll()));const k=await rq(tx('k','readonly').get('k'));S.dr=(await rq(tx('k','readonly').get('dr')))||null;if(k){delete k.id;rawLang=k.lang||'';S.k={...KDEF,...k}}}catch(e){memOnly=true}
S.d.forEach(d=>{if(!Array.isArray(d.pays))d.pays=[]});S.p.forEach(p=>{p.qty=Math.max(0,+p.qty||0);p.min=+p.min||0;p.price=+p.price||0});
if(!S.k.nt||typeof S.k.nt!=='object')S.k.nt={};
/* language: the saved app setting wins; localStorage mirrors it for instant first paint */
if(rawLang==='ar'||rawLang==='en'){if(rawLang!==LANG){LANG=rawLang;applyDir()}}else S.k.lang=LANG;
try{localStorage.setItem('koptan.lang',LANG)}catch(e){}
if(S.k.lite==null)S.k.lite=autoLite()}
/* weak phones get the lighter glass (no live blur) automatically; it can be changed in settings */
function autoLite(){try{const m=navigator.deviceMemory,c=navigator.hardwareConcurrency;return!!((m&&m<=3)||(c&&c<=4))}catch(e){return false}}

/* ---------- formatting ---------- */
const LRI='⁦',PDI='⁩';
/* cached formatters: toLocaleString builds a new formatter on every call (slow with thousands of rows) */
const NF0=new Intl.NumberFormat('en',{maximumFractionDigits:0}),NF2=new Intl.NumberFormat('en',{maximumFractionDigits:2});
function fmt(v,cur){if(S.k.hide)return'••••';cur=cur||S.k.cur;v=+v||0;const l=cur==='LBP',n=l?v*S.k.rate:v,neg=n<0,a=Math.abs(n),s=l?NF0.format(Math.round(a)):NF2.format(a);
let r;if(LANG==='en')r=(neg?'−':'')+(l?'LBP '+s:'$'+s);else r=(neg?'−':'')+s+(l?' ل.ل':' $');return LRI+r+PDI}
const fmtS=v=>(v>0?'+':'')+fmt(v);
const curLbl=c=>c==='LBP'?L('ل.ل'):'$';
const fd=(d,v)=>{if(S.k.hide)return'••••';v=+v||0;const s=d.cur==='LBP'?NF0.format(Math.round(v)):NF2.format(num(v));return LRI+(LANG==='en'?(d.cur==='LBP'?'LBP '+s:'$'+s):s+' '+(d.cur==='LBP'?'ل.ل':'$'))+PDI};
const altC=v=>{if(S.k.hide||!S.k.rate)return'';return fmt(v,S.k.cur==='LBP'?'USD':'LBP')};
/* cached date formatters per language */
const DFC={};const DF=(n,o)=>{const k=LANG+n;return DFC[k]||(DFC[k]=new Intl.DateTimeFormat(loc(),o))};
const day=t=>t?DF('d',{day:'numeric',month:'short',year:'numeric'}).format(t):'—';
const dayS=t=>DF('s',{day:'numeric',month:'short'}).format(t);
const dtm=t=>t?DF('t',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(t):'—';
const sod=(d=new Date())=>new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();
const toTs=s=>s?new Date(s+'T12:00').getTime():0;
const toDs=t=>{if(!t)return'';const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const plural=(n,one,many)=>L(n===1?one:many,{n});
const fitS=(t,n)=>{t=String(t??'');return[...t].length>n?[...t].slice(0,n-1).join('')+'…':t};

/* ---------- money math (single source of truth) ---------- */
const uc=p=>(+p.cost||0)+(+p.ship||0)+(+p.extra||0);
const sRev=s=>s.price*s.qty-(s.disc||0);
const prof=s=>sRev(s)-(+s.uc||0)*s.qty;
const dPaid=d=>(d.pays||[]).reduce((a,p)=>a+(+p.amt||0),0),dRem=d=>num(d.amt-dPaid(d)),toU=(d,v)=>d.cur==='LBP'?v/(d.rate||S.k.rate||1):v;
/* aggregates a time window: sales revenue, sales profit, expenses, net. Debts are never mixed in (no double counting). */
function AGG(a,b){let rev=0,gp=0,ex=0,n=0;for(const x of S.s)if(x.date>=a&&x.date<b){rev+=sRev(x);gp+=prof(x);n++}for(const x of S.e)if(x.date>=a&&x.date<b)ex+=+x.amt||0;return{rev,gp,ex,net:gp-ex,n}}

/* ---------- feedback ---------- */
/* haptics: Android native Haptics plugin (precise, needs no extra permission) → browser vibrate fallback.
   kinds: select (very light), tap, press, heavy, success, warning, error. Rapid duplicates are merged; stronger feedback wins. */
/* intensity S.k.vibLv: l / m / h. Browser pulses under ~15 ms are ignored by many phones, so durations start at 12 ms. */
const HMS={select:12,tap:20,press:30,heavy:45,success:[18,60,28],warning:[35,70,35],error:[50,50,50,50,70]},HPR={select:0,tap:1,press:2,success:3,warning:3,heavy:4,error:5},HLV={l:.7,m:1,h:1.6},HST=['LIGHT','MEDIUM','HEAVY'];
let hapT=0,hapP=-1;
/* which engine can vibrate here: native (APK with Haptics plugin), web (Android browser), oldapk (APK built before haptics), ios, none */
function hapInfo(){const C=window.Capacitor;if(C&&C.isNativePlatform&&C.isNativePlatform())return C.Plugins&&C.Plugins.Haptics?'native':'oldapk';if('vibrate'in navigator)return'web';return/iP(hone|ad|od)|Macintosh.*Mobile/.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&/Mac/.test(navigator.platform))?'ios':'none'}
function hap(k,force){if(S.k.vib===false&&!force)return;const pr=HPR[k]??1,now=performance.now();if(!force&&now-hapT<90&&pr<=hapP)return;hapT=now;hapP=pr;const lv=S.k.vibLv||'m',x=HLV[lv]||1;
try{const P=window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.Haptics;if(P){if(k==='success'||k==='warning'||k==='error')P.notification({type:k.toUpperCase()}).catch(()=>{});else{const i=k==='heavy'?2:Math.max(0,Math.min(2,({select:-1,tap:0,press:1}[k]??0)+{l:0,m:1,h:2}[lv]-1));P.impact({style:HST[i]}).catch(()=>{})}return}
if(navigator.vibrate&&(!navigator.userActivation||navigator.userActivation.hasBeenActive)){const d=HMS[k]||HMS.tap;navigator.vibrate(Array.isArray(d)?d.map((v,j)=>j%2?v:Math.round(v*x)):Math.round(d*x))}}catch(e){}}
const buzz=(n=12)=>hap(n>=50?'error':n>=20?'heavy':n<=6?'select':n<=10?'tap':'press');
/* light tap on every press of an interactive element (specific actions add stronger feedback) */
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('button,a,[role=button],summary,.row,.pc,label.opt');if(t&&!t.disabled)hap('tap')},true);
function toast(m,k='',act){$$('.toast:not(.ld)').forEach(x=>x.remove());const t=document.createElement('div');t.className='toast gl '+k;t.setAttribute('role','status');
t.innerHTML=(k==='ok'?SV(LU.cok):k==='w'?SV(LU.warn):'')+'<span></span>'+(act?`<button class="tbtn">${SV(act.icon||LU.undo)}<b></b></button>`:'');t.querySelector('span').textContent=String(m);
let gone=false;const out=()=>{if(gone)return;gone=true;t.classList.add('out');setTimeout(()=>t.remove(),220);act&&act.end&&act.end()};
if(act){t.querySelector('b').textContent=act.label;t.querySelector('.tbtn').onclick=()=>{if(gone)return;gone=true;t.remove();act.fn()}}
document.body.append(t);if(k==='ok')hap('success');else if(k==='w')hap('warning');setTimeout(out,act?(act.ms||6500):2600);return t}
const ok=m=>toast(m,'ok'),warn=m=>toast(m,'w');
function toastP(m){const t=document.createElement('div');t.className='toast gl ld';t.innerHTML='<i class="spin"></i><span></span>';t.lastChild.textContent=m;document.body.append(t);return()=>t.remove()}

/* ---------- Android back button: closes the top overlay instead of leaving the app ---------- */
const OVS='.sheet-bg,.pg,.zm';let hst=0,hig=0,hsy,hg=0;
const hpush=()=>{try{history.pushState({o:1},'');hst++}catch(e){}};
/* one guard entry under the overlay entries: Back on a main tab goes to the previous tab (backRoot in more.js) instead of leaving */
const hguard=()=>{if(hg||hst)return;try{history.pushState({g:1},'');hg=1}catch(e){}};addEventListener('pointerdown',hguard,true);addEventListener('keydown',hguard,true);
const hsync=()=>{clearTimeout(hsy);hsy=setTimeout(()=>{const n=$$(OVS).length;while(hst<n){hguard();const b=hst;hpush();if(hst===b)break}if(hst>n){const k=hst-n;hst=n;hig=1;try{history.go(-k)}catch(e){hig=0}}},40)};
new MutationObserver(ms=>{if(ms.some(m=>[...m.addedNodes,...m.removedNodes].some(n=>n.nodeType===1&&n.matches&&n.matches(OVS))))hsync()}).observe(document.body,{childList:true});
addEventListener('popstate',()=>{if(hig>0){hig=0;return}const t=$$(OVS).pop();if(!t){hst=0;hg=0;if(typeof backRoot==='function')backRoot(false);return}hst=Math.max(0,hst-1);if(t._back){hpush();t._back();return}closeEl(t)});
/* native back (APK, @capacitor/app): same order: top overlay first, then the previous tab, then a double press exits */
function backTop(){const t=$$(OVS).pop();if(!t)return false;if(t._back)t._back();else closeEl(t);return true}
function closeEl(el){if(!el||!el.isConnected)return;if(el.classList.contains('sheet-bg')){el.classList.add('out');const s=el.firstChild;s.style.transition='transform .2s';s.style.transform='translateY(100%)';setTimeout(()=>el.remove(),190)}else if(el.classList.contains('pg')){el.classList.add('out');setTimeout(()=>el.remove(),170)}else el.remove()}

/* ---------- sheets (glass bottom sheets) ---------- */
function sheet(html,cls=''){const b=document.createElement('div');b.className='sheet-bg';b.innerHTML=`<div class="sheet gl ${cls}" role="dialog"><div class="grip" data-grip></div>${html}</div>`;b.addEventListener('click',e=>{if(e.target===b)closeEl(b)});const sh=b.firstChild;let y0=0,dy=0,on=false;
sh.addEventListener('touchstart',e=>{if(!e.target.closest('[data-grip]')&&sh.scrollTop>0)return;if(!e.target.closest('[data-grip],h2,.sh-h'))return;on=true;y0=e.touches[0].clientY;dy=0;sh.style.transition='none'},{passive:true});
sh.addEventListener('touchmove',e=>{if(!on)return;dy=Math.max(0,e.touches[0].clientY-y0);sh.style.transform='translateY('+dy+'px)'},{passive:true});
sh.addEventListener('touchend',()=>{if(!on)return;on=false;sh.style.transition='transform .2s';if(dy>80)closeEl(b);else sh.style.transform=''});
document.body.append(b);return b}
const closeSheets=()=>$$('.sheet-bg').forEach(x=>x.remove());
/* confirm dialog. o:{yes,no,danger,alt:[label,fn],sub} */
function confirmBox(msg,yes,o={}){const b=sheet(`<div class="cf"><div class="cf-i ${o.danger===false?'':'dg'}">${SV(o.icon||LU.warn)}</div><h2>${esc(msg)}</h2>${o.sub?`<p class="sub">${esc(o.sub)}</p>`:''}<div class="cf-b"><button class="btn ${o.danger===false?'p':'d'}" data-y>${esc(o.yes||L('تأكيد'))}</button>${o.alt?`<button class="btn" data-a>${esc(o.alt[0])}</button>`:''}<button class="btn ghost" data-n>${esc(o.no||L('إلغاء'))}</button></div></div>`);
b.querySelector('[data-n]').onclick=()=>closeEl(b);b.querySelector('[data-y]').onclick=()=>{if(o.danger!==false)hap('heavy');b.remove();yes()};if(o.alt)b.querySelector('[data-a]').onclick=()=>{b.remove();o.alt[1]()};return b}

/* ---------- full-screen pages ---------- */
/* shell: a read/navigate page. fill() re-renders its body (used for live refresh after data changes) */
function shell(title,fill,acts=''){const d=document.createElement('div');d.className='pg';d.innerHTML=`<header class="hdr gl"><button class="ib" data-x aria-label="${esc(L('رجوع'))}">${SV(BACK())}</button><h1></h1><div class="ph-a">${acts}</div></header><div class="sc"></div>`;
d.querySelector('h1').textContent=title;d.querySelector('[data-x]').onclick=()=>closeEl(d);d._fill=()=>{const sc=d.querySelector('.sc'),y=sc.scrollTop;const h=fill(d);if(h!=null){sc.innerHTML=h;sc.scrollTop=y}};document.body.append(d);d._fill();return d}
/* page: a form page with Save + unsaved-changes guard */
function page(title,body,ft,onSave){const d=document.createElement('div');d.className='pg';let dirty=false;
d.innerHTML=`<header class="hdr gl"><button class="ib" data-x aria-label="${esc(L('رجوع'))}">${SV(BACK())}</button><h1>${esc(title)}</h1></header><div class="sc">${body}</div><div class="ft gl">${ft||''}<button class="btn p" id="sv">${SV(LU.check)}${L('حفظ')}</button></div>`;
const bu=e=>{if(dirty){e.preventDefault();e.returnValue=''}};addEventListener('beforeunload',bu);
const P={d,q:n=>d.querySelector(`[name="${n}"]`),close(){P.dead=1;removeEventListener('beforeunload',bu);closeEl(d)}};
d.addEventListener('input',()=>dirty=true);d.addEventListener('click',e=>{if(e.target.closest('[data-g],[data-rm],[data-add],[data-mk]'))dirty=true});
d._back=()=>dirty?confirmBox(L('تجاهل التغييرات غير المحفوظة؟'),()=>{P.discard&&P.discard();P.close()},{yes:L('تجاهل'),no:L('متابعة التعديل')}):P.close();
d.querySelector('[data-x]').onclick=()=>d._back();
const sv=d.querySelector('#sv');sv.onclick=async()=>{if(sv.disabled)return;sv.disabled=true;try{if(await onSave(P)!==false){dirty=false;P.close();buzz();return}}catch(e){console.error(e);warn(L('تعذر الحفظ')+': '+e.message)}sv.disabled=false};document.body.append(d);return P}
/* chip groups inside a page: data-g / data-v */
function grp(P,st,cb){P.d.addEventListener('click',e=>{const b=e.target.closest('[data-g]');if(!b||b.disabled)return;const g=b.dataset.g;if(cb&&cb(g,b.dataset.v)===false)return;st[g]=b.dataset.v;P.d.querySelectorAll(`[data-g="${g}"]`).forEach(x=>x.classList.toggle('on',x===b))})}
function invalid(el,msg){if(!el)return warn(msg);const dt=el.closest('details');if(dt)dt.open=true;el.classList.add('bad');el.focus();setTimeout(()=>el.classList.remove('bad'),1600);warn(msg)}

/* ---------- phone / WhatsApp / links ---------- */
const wn=p=>{p=String(p||'').trim();let d=p.replace(/\D/g,'');if(!d)return'';let r;if(p.startsWith('+'))r=d;else if(d.startsWith('00'))r=d.slice(2);else if(d.startsWith('0')&&S.k.cc)r=S.k.cc+d.replace(/^0+/,'');else r=d;return r.length>=8&&r.length<=15?r:''};
const waLink=(p,t)=>{const n=wn(p);return n?'https://wa.me/'+n+(t?'?text='+encodeURIComponent(t):''):''};
const telLink=p=>{p=String(p||'').trim();const d=p.replace(/\D/g,'');if(d.length<3)return'';return'tel:'+(p.startsWith('+')?'+'+d:p.startsWith('00')?'+'+d.slice(2):d)};
const urlOk=l=>{l=String(l||'').trim();if(!l)return'';if(!/^[a-z][a-z0-9+.-]*:/i.test(l))l='https://'+l;try{const u=new URL(l);return/^https?:$/.test(u.protocol)&&u.hostname.includes('.')?u.href:''}catch(e){return''}};
const mapLink=a=>{a=String(a||'').trim();if(!a)return'';return urlOk(a)&&/^https?:\/\//i.test(a)?urlOk(a):'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(a)};
/* contact buttons: tel:, WhatsApp (official mark), website, map */
function cBtn(k,href,raw){const T={tel:[L('اتصال'),SV(LU.phone)],wa:[L('واتساب'),WA_SVG],link:[L('الموقع'),SV(LU.globe)],map:[L('العنوان'),SV(LU.map)]}[k];
if(href)return`<a class="cb ${k}" href="${esc(href)}" ${k==='tel'?'':'target="_blank" rel="noopener"'} data-cb="${k}">${T[1]}<span>${T[0]}</span></a>`;
const m={tel:raw?L('رقم الهاتف غير صالح'):L('لا يوجد رقم هاتف — أضفه من التعديل'),wa:raw?L('رقم واتساب غير صالح — اكتبه مع رمز الدولة (مثل +961…)'):L('لا يوجد رقم واتساب — أضفه من التعديل'),link:raw?L('الرابط غير صالح — ابدأه بـ https://'):L('لا يوجد رابط'),map:L('لا يوجد عنوان')}[k];
return`<button type="button" class="cb ${k} off" data-msg="${esc(m)}">${T[1]}<span>${T[0]}</span></button>`}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.cb.off[data-msg]');if(b)warn(b.dataset.msg)});

/* ---------- images: Blob storage in IndexedDB "img" (full + thumbnail) ---------- */
const IU={},IPR={},MEM={},ibg=(id,t=1)=>id?`data-bg="${esc(id)}" data-t="${t}"`:'',isrc=id=>id?`data-src="${esc(id)}" data-t="0"`:'',isD=v=>typeof v==='string'&&v.startsWith('data:');
const idbGet=(st,id)=>rq(tx(st,'readonly').get(id));
async function putImg(r){if(memOnly){MEM[r.id]=r;return}await rq(tx('img','readwrite').put(r))}
function imgUrl(id,th){if(!id)return Promise.resolve('');if(isD(id))return Promise.resolve(id);const k=id+(th?'t':'f');if(IU[k])return Promise.resolve(IU[k]);return IPR[k]||(IPR[k]=(async()=>{try{const r=memOnly?MEM[id]:await idbGet('img',id);if(!r)return'';const u=URL.createObjectURL(th&&r.th?r.th:r.full);IU[k]=u;return u}catch(e){return''}finally{delete IPR[k]}})())}
async function hyd(el){const id=el.dataset.bg||el.dataset.src,th=el.dataset.t==='1',key=id+'|'+th;if(!id||el._h===key)return;el._h=key;const u=await imgUrl(id,th);if(!u)return;if(el.dataset.bg){el.style.backgroundImage='url("'+u+'")';el.classList.add('has-img')}else el.src=u}
const hy=r=>{if(r.matches&&r.matches('[data-bg],[data-src]'))hyd(r);r.querySelectorAll&&r.querySelectorAll('[data-bg],[data-src]').forEach(hyd)};
new MutationObserver(ms=>ms.forEach(m=>{m.addedNodes.forEach(n=>n.nodeType===1&&hy(n));if(m.type==='attributes')hy(m.target)})).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-bg','data-src']});
async function decode(f){if(self.createImageBitmap){for(const o of[{imageOrientation:'from-image'},undefined]){try{const bm=await createImageBitmap(f,o);return{bm,W:bm.width,H:bm.height,done:()=>bm.close&&bm.close()}}catch(e){}}}
const u=URL.createObjectURL(f);try{const im=await new Promise((a,b)=>{const m=new Image();m.onload=()=>a(m);m.onerror=()=>b(new Error('decode'));m.src=u});return{bm:im,W:im.naturalWidth,H:im.naturalHeight,done:()=>URL.revokeObjectURL(u)}}catch(e){URL.revokeObjectURL(u);throw e}}
function canv(bm,W,H,mx,q){const k=Math.min(1,mx/Math.max(W,H)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(W*k));c.height=Math.max(1,Math.round(H*k));const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(bm,0,0,c.width,c.height);return new Promise((a,b)=>c.toBlob(r=>r?a(r):b(new Error('toBlob')),'image/jpeg',q))}
async function procBlob(f,keep){const d=await decode(f);try{const full=keep?f:await canv(d.bm,d.W,d.H,1600,.85),th=await canv(d.bm,d.W,d.H,360,.72),id='i'+uid();await putImg({id,full,th,t:Date.now()});return id}finally{d.done()}}
async function shrink(file){try{if(file.size>60*1048576)throw new Error('big');return await procBlob(file,false)}catch(e){warn(L('تعذر معالجة الصورة — استخدم JPG أو PNG أو WebP'));return null}}
async function conv(v){if(!isD(v))return v;try{const b=await(await fetch(v)).blob();return await procBlob(b,true)}catch(e){return v}}
function refd(){const r=new Set();S.p.forEach(p=>{(p.imgs||[]).forEach(i=>i&&r.add(i));p.img&&r.add(p.img)});S.e.forEach(e=>e.img&&r.add(e.img));S.d.forEach(d=>d.img&&r.add(d.img));S.sp.forEach(x=>x.img&&r.add(x.img));S.dr&&(S.dr.imgs||[]).forEach(i=>r.add(i));PENDING.forEach(p=>(p.imgs||[]).forEach(i=>r.add(i)));return r}
const PENDING=new Set(); /* products deleted but still undoable — keep their images */
async function gcImgs(ids){try{const r=refd();for(const id of ids||[]){if(!id||isD(id)||r.has(id))continue;['t','f'].forEach(x=>{const u=IU[id+x];if(u){URL.revokeObjectURL(u);delete IU[id+x]}});if(memOnly)delete MEM[id];else await rq(tx('img','readwrite').delete(id))}}catch(e){}}
async function sweepImgs(){if(memOnly)return;try{const ks=await rq(tx('img','readonly').getAllKeys()),r=refd(),lim=Date.now()-864e5;for(const k of ks){const t=parseInt(String(k).slice(1,9),36);if(!r.has(k)&&t&&t<lim)await rq(tx('img','readwrite').delete(k))}}catch(e){}}
async function migImgs(){try{const need=()=>S.p.some(p=>(p.imgs||[]).some(isD)||isD(p.img))||S.e.some(e=>isD(e.img))||S.d.some(d=>isD(d.img))||(S.dr&&(S.dr.imgs||[]).some(isD));if(!need())return;const t=toastP(L('جارٍ تحويل الصور إلى تخزين آمن…'));
for(const p of S.p){if(!(p.imgs||[]).some(isD)&&!isD(p.img))continue;const old=p.imgs&&p.imgs.length?p.imgs:p.img?[p.img]:[];const ni=[];for(const v of old)ni.push(await conv(v));p.imgs=ni;p.img=ni[0]||'';await put('p',p)}
for(const e of S.e)if(isD(e.img)){e.img=await conv(e.img);await put('e',e)}for(const d of S.d)if(isD(d.img)){d.img=await conv(d.img);await put('d',d)}
if(S.dr&&(S.dr.imgs||[]).some(isD)){const ni=[];for(const v of S.dr.imgs)ni.push(await conv(v));S.dr.imgs=ni;await put('k',{id:'dr',...S.dr})}t()}catch(e){}}
function zoom(src,id){if(!src)return;const z=document.createElement('div');z.className='zm';z.innerHTML=`<img src="${src}" alt=""><div class="zm-b"><button class="ib gl" data-sv aria-label="${esc(L('حفظ الصورة'))}">${SV(LU.dl)}</button><button class="ib gl" data-x aria-label="${esc(L('إغلاق'))}">${SV(LU.x)}</button></div>`;
z.querySelector('[data-x]').onclick=e=>{e.stopPropagation();z.remove()};z.querySelector('[data-sv]').onclick=async e=>{e.stopPropagation();try{const b=await(await fetch(src)).blob();saveFile('koptan-'+toDs(Date.now())+'-'+uid().slice(-4)+'.jpg',b,'image/jpeg')}catch(x){warn(L('تعذر حفظ الصورة'))}};z.onclick=e=>{if(e.target===z)z.remove()};document.body.append(z)}
async function zoomId(id){const u=await imgUrl(id,false);u?zoom(u,id):warn(L('تعذر فتح الصورة'))}

/* ---------- native bridge (Android APK via Capacitor) with web fallbacks ---------- */
const NAT=()=>!!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform());
const hasPl=n=>NAT()&&!!(Capacitor.Plugins&&Capacitor.Plugins[n]);
const capCall=(pl,m,o)=>Capacitor.Plugins[pl][m](o||{});
const cancelled=e=>/cancel/i.test(String(e&&(e.message||e.errorMessage||e)||''));
/* image picking: Android photo gallery / camera through the Camera plugin; browser file input elsewhere */
const ADDT=m=>`<button type="button" class="addt" data-add="${m?'m':'s'}">${SV(LU.imgplus)}<small>${L('المعرض')}</small></button><button type="button" class="addt" data-add="${m?'m':'s'}" data-cam="1">${SV(LU.camera)}<small>${L('الكاميرا')}</small></button>`;
let IMGT=null;
document.addEventListener('click',async e=>{const a=e.target.closest&&e.target.closest('[data-add]');if(!a)return;e.preventDefault();e.stopPropagation();const host=a.closest('.pg,.sheet-bg'),rep=a.dataset.rep!=null?+a.dataset.rep:-1,multi=a.dataset.add==='m'&&rep<0,cam=!!a.dataset.cam;IMGT={cb:host&&host._imgCb,rep};
if(hasPl('Camera')){try{let paths=[];if(cam){const r=await capCall('Camera','getPhoto',{source:'CAMERA',resultType:'uri',quality:85,correctOrientation:true,saveToGallery:false});paths=[r.webPath||r.path]}else if(multi){const r=await capCall('Camera','pickImages',{quality:85,limit:12,correctOrientation:true});paths=(r.photos||[]).map(x=>x.webPath||x.path)}else{const r=await capCall('Camera','getPhoto',{source:'PHOTOS',resultType:'uri',quality:85,correctOrientation:true});paths=[r.webPath||r.path]}
const fs=[];for(const p of paths.filter(Boolean)){try{fs.push(await(await fetch(p)).blob())}catch(x){}}await gotFiles(fs);return}catch(x){if(cancelled(x))return;/* fall back to the system file chooser */}}
const i=$(cam?'#fc':'#fg');i.multiple=multi;i.value='';i.click()},true);
async function gotFiles(fs){const T=IMGT;if(!fs.length||!T||!T.cb)return;const done=toastP(fs.length>1?L('جارٍ معالجة {n} صور…',{n:fs.length}):L('جارٍ معالجة الصورة…')),a=[];for(const f of fs){const id=await shrink(f);if(id)a.push(id)}done();if(a.length){T.cb(a,T.rep);buzz(8)}}
function onPick(e){const i=e.target,fs=[...i.files];i.value='';gotFiles(fs)}
/* files: Android → write to cache and open the share sheet (save to Files/Drive/WhatsApp); browser → download */
const b2d=b=>new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.onerror=()=>r('');f.readAsDataURL(b)});
async function saveFile(name,data,type){const blob=data instanceof Blob?data:new Blob([data],{type});
if(hasPl('Filesystem')){try{const b64=(await b2d(blob)).split(',')[1];const r=await capCall('Filesystem','writeFile',{path:name,data:b64,directory:'CACHE'});if(hasPl('Share')){try{await capCall('Share','share',{title:name,files:[r.uri],dialogTitle:L('حفظ أو مشاركة الملف')})}catch(x){if(!cancelled(x))throw x}}return true}catch(x){if(cancelled(x))return false;console.warn(x)}}
const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),8000);return true}
/* Arabic-Indic (٠-٩) and Persian (۰-۹) digits → Latin; Android Arabic keyboards type these */
const normD=s=>String(s??'').replace(/[\u0660-\u0669]/g,d=>d.charCodeAt(0)-1632).replace(/[\u06F0-\u06F9]/g,d=>d.charCodeAt(0)-1776).replace(/\D/g,'');
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
async function log(m){const o={id:uid(),m,d:Date.now()};S.l.push(o);await put('l',o)}

/* ---------- animated counters ---------- */
const CV={};
const cnt=(k,v,c='')=>`<b class="cnt ${c}" data-k="${k}" data-v="${num(v)}">${fmt(v)}</b>`;
function anim(root){const okA=S.k.anim!==false&&!matchMedia('(prefers-reduced-motion:reduce)').matches;(root||document).querySelectorAll('.cnt').forEach(el=>{const k=el.dataset.k,to=+el.dataset.v,from=CV[k]??0;CV[k]=to;if(!okA||S.k.hide||from===to)return;const t0=performance.now(),D=600,st=n=>{if(!el.isConnected)return;const p=Math.min(1,(n-t0)/D),e=1-Math.pow(1-p,3);el.textContent=fmt(p<1?from+(to-from)*e:to);if(p<1)requestAnimationFrame(st)};requestAnimationFrame(st)})}
