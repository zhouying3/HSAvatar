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
