'use strict';
const samples = [
  {stem:'1380_020027_00000065',video:'020027',target:65},
  {stem:'0756_020015_00000015',video:'020015',target:15},
  {stem:'2013_020040_00000047',video:'020040',target:47},
  {stem:'1995_020039_00000149',video:'020039',target:149}
];
let selected = 0;
const baseline = document.getElementById('baseline');
const buttons = [...document.querySelectorAll('.sample-button')];
function renderSample() {
  const sample = samples[selected];
  for (const [id,method] of [['source-image','Input'],['baseline-image',baseline.value],['ours-image','Ours'],['gt-image','GT']]) {
    const image = document.getElementById(id);
    image.src = `assets/${sample.stem}_${method}.png`;
    image.alt = `${method}, VFHQ ${sample.video}, source frame 0, target frame ${sample.target}`;
  }
  document.getElementById('baseline-title').textContent = baseline.value;
  document.getElementById('sample-caption').textContent = `VFHQ ${sample.video} · Source frame 0 · Target frame ${sample.target}`;
  buttons.forEach((button,index)=>button.setAttribute('aria-pressed',String(index === selected)));
}
buttons.forEach((button,index)=>button.addEventListener('click',()=>{selected=index;renderSample();}));
baseline.addEventListener('change',renderSample);
