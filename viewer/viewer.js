'use strict';
const $=id=>document.getElementById(id),clone=x=>JSON.parse(JSON.stringify(x));
let base='',fitted=null,state=null,busy=false,dirty=false,connected=false,lastBlob=null,sequence=null,sequenceName='',animation=null,keys=[],activeKey=-1;
const paramGroups=[['neck',3,'neck_pose'],['jaw',3,'jaw_pose'],['head',3,'head_pose'],['eyes',6,'eyes_pose']];
function message(text){$('message').textContent=text;}
function makeJointFields(){
 $('joint-controls').replaceChildren();
 for(const [key,n,label] of paramGroups){
  for(let start=0;start<n;start+=3){
   const joint=document.createElement('div');joint.className='joint';joint.innerHTML=`<div class="joint-title">${label}${n===6?(start===0?' · left':' · right'):''}</div><div class="joint-values"></div>`;
   for(let i=start;i<start+3;i++){
    const axis=document.createElement('div');axis.className='axis';const num=document.createElement('input'),range=document.createElement('input');
    num.type='number';num.step='0.001';num.min=range.min=key==='head'?'-3.14':'-1.2';num.max=range.max=key==='head'?'3.14':'1.2';
    range.type='range';range.step='0.005';num.setAttribute('aria-label',`${label} ${n===6?(start===0?'left':'right')+' ':''}${'xyz'[i%3]}`);range.setAttribute('aria-label',`${num.getAttribute('aria-label')} slider`);
    num.dataset.key=range.dataset.key=key;num.dataset.index=range.dataset.index=i;
    [num,range].forEach(input=>input.addEventListener('input',()=>{if(!state||!$('enabled').checked)return;stop();state[key][i]=Math.max(+input.min,Math.min(+input.max,+input.value||0));num.value=state[key][i].toFixed(3);range.value=state[key][i];requestRender();}));
    axis.append(num,range);joint.querySelector('.joint-values').append(axis);
   }
   $('joint-controls').append(joint);
  }
 }
}
for(let i=0;i<100;i+=5){const o=document.createElement('option');o.value=i;o.textContent=`${i}–${i+4}`;$('expression-page').append(o);}
function expressionFields(){
 $('expression-controls').replaceChildren();const start=Number($('expression-page').value);
 for(let i=start;i<start+5;i++){
  const row=document.createElement('div');row.className='exp-row';const range=document.createElement('input'),num=document.createElement('input'),label=document.createElement('span');
  range.type='range';num.type='number';range.min=num.min='-5';range.max=num.max='5';range.step='0.01';num.step='0.01';
  label.textContent=i;range.setAttribute('aria-label',`Expression ${i} slider`);num.setAttribute('aria-label',`Expression ${i}`);
  range.dataset.key=num.dataset.key='expression';range.dataset.index=num.dataset.index=i;
  [range,num].forEach(input=>input.addEventListener('input',()=>{if(!state||!$('enabled').checked)return;stop();state.expression[i]=Math.max(-5,Math.min(5,+input.value||0));range.value=state.expression[i];num.value=state.expression[i].toFixed(2);requestRender();}));
  row.append(range,num,label);$('expression-controls').append(row);
 }
 syncFields();
}
function syncFields(){
 if(!state)return;
 document.querySelectorAll('[data-key]').forEach(input=>{const v=state[input.dataset.key][Number(input.dataset.index)];input.value=input.type==='number'?v.toFixed(3):v;});
 for(const k of ['splat','mesh','wire','refine'])$(k).checked=state[k];$('background').value=state.background;$('fov').value=state.camera.fov.toFixed(3);
 for(const key of ['orbit','pan'])for(let i=0;i<2;i++)$(`${key}-${i}`).value=state.camera[key][i].toFixed(3);
 $('stage').style.background=state.background==='white'?'#fff':'#000';
}
for(const [key,label] of [['orbit','Orbit'],['pan','Pan']])for(let i=0;i<2;i++){
 const row=document.createElement('div');row.className='camera-row';row.innerHTML=`<label for="${key}-${i}">${label} ${'xy'[i]}</label><input id="${key}-${i}" type="number" step="0.02" min="-3" max="3" value="0">`;$('camera-controls').append(row);
 $(`${key}-${i}`).addEventListener('input',()=>{if(!connected||!state)return;stop();state.camera[key][i]=Math.max(-3,Math.min(3,Number($(`${key}-${i}`).value)||0));requestRender();});
}
makeJointFields();expressionFields();
$('expression-page').addEventListener('change',expressionFields);
function enablePanel(value){document.querySelectorAll('.panel input,.panel select,.panel button').forEach(el=>el.disabled=!value);document.querySelectorAll('.file-button').forEach(el=>{el.style.pointerEvents=value?'':'none';el.style.opacity=value?'1':'.5';});}
async function connect(){
 enablePanel(false);connected=false;stop();
 $('connection').textContent='Connecting to renderer…';$('connection').className='';
 const local=location.hostname==='127.0.0.1'||location.hostname==='localhost';
 const candidates=local&&location.port==='8877'?['']:['http://127.0.0.1:8877'];
 for(const candidate of candidates){
  try{
   const response=await fetch(candidate+'/api/init',{signal:AbortSignal.timeout(7000)});if(!response.ok)continue;const info=await response.json();
   base=candidate;fitted=clone(info.fitted);state=clone(fitted);connected=true;
   $('identity').textContent=`HSAvatar · ${info.identity}`;$('connection').textContent=`Connected · ${info.gpu}`;$('connection').className='connected';$('empty').hidden=true;$('local-viewer').hidden=local;
   enablePanel(true);syncFields();requestRender();return;
  }catch(e){/* Try only the configured local renderer. */}
 }
 connected=false;$('connection').textContent='Preview · renderer offline';$('empty').hidden=true;
 message('Connect a running rendering session to enable live controls.');
}
async function requestRender(){
 if(!connected||!state)return;dirty=true;if(busy)return;busy=true;
 while(dirty&&connected){dirty=false;const snapshot=clone(state),sent=performance.now();
  try{
   const result=await fetch(base+'/api/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(snapshot),signal:AbortSignal.timeout(20000)});
   if(!result.ok){const e=await result.json();throw Error(e.error||'Rendering failed');}
   const ms=Number(result.headers.get('X-Render-Ms'));const blob=await result.blob(),url=URL.createObjectURL(blob),image=new Image();image.src=url;await image.decode();
   $('avatar').src=url;if(lastBlob)URL.revokeObjectURL(lastBlob);lastBlob=url;
   $('fps').textContent=(1000/ms).toFixed(1);$('latency').textContent=`(${ms.toFixed(1)} ms)`;
   $('delivery').textContent=`Model FPS · response ${(performance.now()-sent).toFixed(0)} ms`;message('');
  }catch(e){message(e.message);stop();dirty=false;}
 }
 busy=false;
}
$('reconnect').addEventListener('click',connect);
for(const k of ['splat','mesh','wire','refine'])$(k).addEventListener('change',()=>{if(!connected||!state)return;state[k]=$(k).checked;requestRender();});
$('background').addEventListener('change',()=>{if(!connected||!state)return;state.background=$('background').value;syncFields();requestRender();});
$('fov').addEventListener('input',()=>{if(!connected||!state)return;state.camera.fov=Math.max(4,Math.min(60,+$('fov').value||9.527));requestRender();});
$('reset-camera').onclick=()=>{if(!connected||!state)return;state.camera=clone(fitted.camera);syncFields();requestRender();};
$('reset-flame').onclick=()=>{if(!connected||!state)return;stop();for(const [key,n]of [...paramGroups,['expression',100]])state[key]=Array(n).fill(0);syncFields();requestRender();};
$('reset-fitted').onclick=()=>{if(!connected||!state)return;stop();for(const [key]of [...paramGroups,['expression']])state[key]=clone(fitted[key]);syncFields();requestRender();};
let drag=null;
$('stage').oncontextmenu=e=>e.preventDefault();
$('stage').addEventListener('pointerdown',e=>{if(!connected||!state)return;drag={x:e.clientX,y:e.clientY,button:e.button,camera:clone(state.camera)};$('stage').setPointerCapture(e.pointerId);$('stage').classList.add('dragging');});
$('stage').addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(drag.button===2||e.shiftKey){state.camera.pan=[drag.camera.pan[0]+dx*.003,drag.camera.pan[1]+dy*.003];}else{state.camera.orbit=[drag.camera.orbit[0]+dx*.004,drag.camera.orbit[1]+dy*.004];}syncFields();requestRender();});
function endDrag(){drag=null;$('stage').classList.remove('dragging');}
$('stage').addEventListener('pointerup',endDrag);$('stage').addEventListener('pointercancel',endDrag);
$('stage').addEventListener('wheel',e=>{if(!connected||!state)return;e.preventDefault();state.camera.fov=Math.max(4,Math.min(60,state.camera.fov*Math.exp(e.deltaY*.001)));syncFields();requestRender();},{passive:false});
function download(name,data,type='application/json'){
 const url=URL.createObjectURL(new Blob([typeof data==='string'?data:JSON.stringify(data,null,2)],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('enabled').onchange=()=>document.querySelectorAll('[data-key]').forEach(input=>input.disabled=!$('enabled').checked);
function validated(value){
 if(!value||typeof value!=='object')throw Error('Invalid parameter file');const v=clone(fitted);
 for(const [key,n]of [...paramGroups,['expression',100]]){if(!Array.isArray(value[key])||value[key].length!==n||!value[key].every(Number.isFinite))throw Error(`Invalid ${key} values`);const limit=key==='expression'?5:key==='head'?3.14:1.2;v[key]=value[key].map(x=>Math.max(-limit,Math.min(limit,x)));}
 if(value.camera){for(const k of ['orbit','pan']){if(!Array.isArray(value.camera[k])||value.camera[k].length!==2||!value.camera[k].every(Number.isFinite))throw Error('Invalid camera');v.camera[k]=value.camera[k].map(x=>Math.max(-3,Math.min(3,x)));}if(Number.isFinite(value.camera.fov))v.camera.fov=Math.max(4,Math.min(60,value.camera.fov));}
 for(const k of ['splat','mesh','wire','refine'])if(typeof value[k]==='boolean')v[k]=value[k];if(['white','black'].includes(value.background))v.background=value.background;return v;
}
$('save-params').onclick=()=>state&&download('HSAvatar-parameters.json',{format:'HSAvatar-controls-v1',parameters:state});
$('save-image').onclick=()=>{if(lastBlob){const a=document.createElement('a');a.href=lastBlob;a.download='HSAvatar-render.jpg';a.click();}};
$('load-params').onchange=async e=>{try{if(!fitted)throw Error('Connect the renderer first');const file=e.target.files[0];if(!file)return;if(file.size>1000000)throw Error('File too large');const d=JSON.parse(await file.text());state=validated(d.parameters||d);stop();syncFields();requestRender();message('Parameters loaded.');}catch(error){message(error.message);}e.target.value='';};
function showKeys(){const s=$('keyframes');s.replaceChildren();keys.forEach((v,i)=>{const o=document.createElement('option');o.value=i;o.textContent=`Keyframe ${i+1}`;o.selected=i===activeKey;s.append(o);});}
$('add-key').onclick=()=>{if(!connected||!state)return;keys.push(clone(state));activeKey=keys.length-1;showKeys();};
$('delete-key').onclick=()=>{if(activeKey<0)return;keys.splice(activeKey,1);activeKey=Math.min(activeKey,keys.length-1);showKeys();};
$('update-key').onclick=()=>{if(state&&activeKey>=0){keys[activeKey]=clone(state);message('Keyframe updated.');}};
$('keyframes').onchange=()=>{activeKey=Number($('keyframes').value);if(keys[activeKey]){stop();state=clone(keys[activeKey]);syncFields();requestRender();}};
$('export-traj').onclick=()=>download('HSAvatar-trajectory.json',{format:'HSAvatar-trajectory-v1',interval:Math.max(.1,+$('interval').value||1),keyframes:keys});
function interpolate(a,b,t){const v=clone(a);for(const [k]of [...paramGroups,['expression']])v[k]=a[k].map((x,i)=>x+(b[k][i]-x)*t);for(const k of ['orbit','pan'])v.camera[k]=a.camera[k].map((x,i)=>x+(b.camera[k][i]-x)*t);v.camera.fov=a.camera.fov+(b.camera.fov-a.camera.fov)*t;return v;}
function stop(){if(animation)cancelAnimationFrame(animation);animation=null;$('play-motion').textContent='play motion';$('play-traj').textContent='play trajectory';}
async function loadMotion(){
 if(!connected||!state)return;const name=$('motion').value;if(name==='uploaded'){if(!sequence)message('Load a motion JSON file.');return;}
 try{const r=await fetch(base+'/api/motion/'+name);if(!r.ok)throw Error('Motion unavailable');const d=await r.json();sequence=d.motion;sequenceName=name;$('timeline').max=$('frame-number').max=sequence.length-1;$('motion-meta').textContent=`/ ${sequence.length-1} · 25 fps`;applyMotion(0);message('Motion loaded.');}catch(e){message(e.message);}
}
function applyMotion(frame){if(!sequence||!state)return;frame=Math.max(0,Math.min(sequence.length-1,Math.round(frame)));const m=sequence[frame];state.expression=m.slice(0,100);state.head=m.slice(100,103);state.jaw=m.slice(103,106);state.neck=[0,0,0];state.eyes=clone(fitted.eyes);$('timeline').value=$('frame-number').value=frame;syncFields();requestRender();}
$('load-motion').onclick=()=>{stop();loadMotion();};
$('timeline').oninput=()=>{stop();applyMotion(+$('timeline').value);};$('frame-number').oninput=()=>{stop();applyMotion(+$('frame-number').value);};
$('stop-motion').onclick=stop;
$('play-motion').onclick=async()=>{
 if(animation){stop();return;}if(!sequence||sequenceName!==$('motion').value)await loadMotion();if(!sequence)return;
 const start=performance.now(),offset=+$('timeline').value;let last=-1;$('play-motion').textContent='pause motion';
 function tick(now){let frame=offset+Math.floor((now-start)/1000*25);if(frame>=sequence.length){if(!$('loop').checked){stop();return;}frame%=sequence.length;}if(frame!==last){applyMotion(frame);last=frame;}animation=requestAnimationFrame(tick);}animation=requestAnimationFrame(tick);
};
$('play-traj').onclick=()=>{if(animation){stop();return;}if(keys.length<2){message('Add at least two keyframes.');return;}const start=performance.now(),interval=Math.max(.1,+$('interval').value||1),duration=(keys.length-1)*interval,cycles=Math.max(1,Math.min(20,+$('cycles').value||1));$('play-traj').textContent='pause trajectory';function tick(now){let time=(now-start)/1000;if(!$('loop').checked&&time>=duration*cycles){state=clone(keys[keys.length-1]);syncFields();requestRender();stop();return;}time%=duration;const i=Math.min(keys.length-2,Math.floor(time/interval));state=interpolate(keys[i],keys[i+1],time/interval-i);syncFields();requestRender();animation=requestAnimationFrame(tick);}animation=requestAnimationFrame(tick);};
$('motion-file').onchange=async e=>{try{if(!fitted)throw Error('Connect the renderer first');const f=e.target.files[0];if(!f)return;if(f.size>20000000)throw Error('File too large');const d=JSON.parse(await f.text());stop();if(d.keyframes){if(!Array.isArray(d.keyframes)||d.keyframes.length>200)throw Error('Invalid trajectory');keys=d.keyframes.map(validated);activeKey=keys.length?0:-1;showKeys();if(Number.isFinite(d.interval))$('interval').value=Math.max(.1,Math.min(10,d.interval));message('Trajectory loaded.');}else{const m=d.motion||d;if(!Array.isArray(m)||!m.length||m.length>10000||!m.every(row=>Array.isArray(row)&&row.length===106&&row.every(Number.isFinite)))throw Error('Motion must have 106 values per frame');sequence=m;sequenceName='uploaded';$('motion').value='uploaded';$('timeline').max=$('frame-number').max=m.length-1;$('motion-meta').textContent=`/ ${m.length-1} · 25 fps`;applyMotion(0);message('Motion loaded.');}}catch(error){message(error.message);}e.target.value='';};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
async function initialize(){enablePanel(false);try{const r=await fetch('initial.json');const info=await r.json();fitted=clone(info.fitted);state=clone(fitted);$('identity').textContent=`HSAvatar · ${info.identity}`;syncFields();}catch(e){}connect();}
initialize();
