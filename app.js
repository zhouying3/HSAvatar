'use strict';
let mode='self';
const selected={self:0,cross:0};
const baseline=document.getElementById('baseline');
const samplesContainer=document.getElementById('samples');
const modeButtons=[...document.querySelectorAll('[data-mode]')];
function renderSample() {
  const sample=OE_SAMPLES[mode][selected[mode]];
  for(const [id,label] of [['source-image','Source'],['driver-image','Driver'],['baseline-image',baseline.value],['ours-image','Ours']]) {
    const image=document.getElementById(id);
    image.src=sample.images[label];
    image.alt=`${label}, source ${sample.source}, driver ${sample.driver}, target frame ${sample.target}`;
  }
  document.getElementById('baseline-title').textContent=baseline.value;
  document.getElementById('driver-title').textContent=mode==='self'?'Driving / ground truth':'Driving image';
  document.getElementById('sample-caption').textContent=mode==='self'
    ?`Source ${sample.source} · Frame ${sample.sourceFrame} · Target frame ${sample.target}`
    :`Source ${sample.source} · Frame ${sample.sourceFrame} · Driver ${sample.driver} · Frame ${sample.target}`;
  document.getElementById('full-comparison').href=`assets/${mode}-comparison.png`;
  samplesContainer.querySelectorAll('button').forEach((button,index)=>button.setAttribute('aria-pressed',String(index===selected[mode])));
}
function renderButtons() {
  samplesContainer.replaceChildren();
  OE_SAMPLES[mode].forEach((sample,index)=>{
    const button=document.createElement('button');button.type='button';button.className='sample-button';
    button.setAttribute('aria-label',`Show source ${sample.source}${mode==='cross'?`, driver ${sample.driver}`:''}`);
    button.setAttribute('aria-pressed',String(index===selected[mode]));
    const image=document.createElement('img');image.src=sample.images.Source;image.alt=`Source ${sample.source}`;image.width=512;image.height=512;
    const label=document.createElement('span');label.textContent=sample.source;
    button.append(image,label);button.addEventListener('click',()=>{selected[mode]=index;renderSample();});samplesContainer.append(button);
  });
}
modeButtons.forEach(button=>button.addEventListener('click',()=>{
  mode=button.dataset.mode;
  modeButtons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  renderButtons();renderSample();
}));
baseline.addEventListener('change',renderSample);
renderButtons();renderSample();

// The public page browses actual model-rendered parameter sweeps.
const controls = document.getElementById('control-mode');
const slider = document.getElementById('control-value');
const controlImage = document.getElementById('control-frame');
let sweepTimer=null, direction=1;
const ranges={yaw:[-.25,.25,'Head yaw'],pitch:[-.15,.15,'Head pitch'],jaw:[0,.30,'Jaw opening']};
function updateControl(){
 const [low,high,label]=ranges[controls.value],i=Number(slider.value);
 controlImage.src=`assets/demos/controls/${controls.value}/${String(i).padStart(3,'0')}.jpg`;
 controlImage.alt=`HSAvatar, ${label} ${Number(low+(high-low)*i/60).toFixed(3)} radians`;
 document.getElementById('control-label').textContent=label;
 document.getElementById('control-output').value=`${Number(low+(high-low)*i/60).toFixed(3)} rad`;
}
function stopSweep(){clearInterval(sweepTimer);sweepTimer=null;document.getElementById('control-play').textContent='Play sweep';}
controls.addEventListener('change',()=>{stopSweep();slider.value=controls.value==='jaw'?0:30;updateControl();});
slider.addEventListener('input',()=>{stopSweep();updateControl();});
document.getElementById('control-reset').addEventListener('click',()=>{stopSweep();slider.value=controls.value==='jaw'?0:30;updateControl();});
document.getElementById('control-play').addEventListener('click',()=>{
 if(sweepTimer){stopSweep();return;}
 document.getElementById('control-play').textContent='Pause sweep';
 sweepTimer=setInterval(()=>{let i=Number(slider.value)+direction;if(i>=60||i<=0)direction*=-1;slider.value=i;updateControl();},80);
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSweep();});
updateControl();
const audioVideo=document.getElementById('audio-video');
document.querySelectorAll('[data-audio]').forEach(button=>button.addEventListener('click',()=>{
 audioVideo.pause();audioVideo.src=`assets/demos/${button.dataset.audio}.mp4`;audioVideo.poster=`assets/demos/${button.dataset.audio}_poster.png`;audioVideo.load();
 document.querySelectorAll('[data-audio]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
}));
const comparisonVideo=document.getElementById('comparison-video');
const keyButtons=[...document.querySelectorAll('[data-frame]')];
let lastTime=0,heldFrames=new Set();
function revealKeyframe(button,seek=true){
 if(seek){comparisonVideo.pause();comparisonVideo.currentTime=Number(button.dataset.frame)/25;}
 document.getElementById('keyframe-detail').hidden=false;
 document.getElementById('detail-image').src=`assets/demos/keyframe-${button.dataset.frame}.jpg`;
 document.getElementById('detail-caption').textContent=button.dataset.caption;
 keyButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
}
keyButtons.forEach(button=>button.addEventListener('click',()=>revealKeyframe(button)));
comparisonVideo.addEventListener('timeupdate',()=>{
 const t=comparisonVideo.currentTime;
 if(t<lastTime-.2)heldFrames.clear();
 if(document.getElementById('keyframe-hold').checked&&!comparisonVideo.paused){
  const hit=keyButtons.find(b=>Number(b.dataset.frame)/25>lastTime&&Number(b.dataset.frame)/25<=t&&!heldFrames.has(b.dataset.frame));
  if(hit){heldFrames.add(hit.dataset.frame);revealKeyframe(hit);}
 }
 lastTime=t;
});
