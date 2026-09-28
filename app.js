'use strict';
function switchVideo(video,stem){const playing=!video.paused;video.pause();video.src=`assets/showcase/${stem}.mp4`;video.poster=`assets/showcase/${stem}-poster.jpg`;video.load();if(playing)video.play().catch(()=>{});}
function selectButtons(selector,button){document.querySelectorAll(selector).forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}
document.querySelectorAll('[data-speech]').forEach(button=>button.addEventListener('click',()=>{switchVideo(document.getElementById('speech-video'),`speech-${button.dataset.speech}`);selectButtons('[data-speech]',button);}));
document.querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>{switchVideo(document.getElementById('image-video'),`image-driven-${button.dataset.image}`);selectButtons('[data-image]',button);}));
const reconstructionExamples=[{"id":"000916","ours_mean":0.06728497550228695,"rome_mean":0.15151080060953195,"relative_reduction":0.5559064091035245,"wins":50},{"id":"007281","ours_mean":0.023821682069738444,"rome_mean":0.051972354347917166,"relative_reduction":0.5416470473846617,"wins":50},{"id":"000523","ours_mean":0.03856674285841284,"rome_mean":0.07220150703523305,"relative_reduction":0.465845735884807,"wins":50}];
let reconstructionPortrait=0,reconstructionMode='rgb';
const reconstructionVideo=document.getElementById('reconstruction-video');
function updateReconstruction(resetTime=false){
  const wasPlaying=!reconstructionVideo.paused,time=resetTime?0:reconstructionVideo.currentTime;
  reconstructionVideo.pause();
  const isError=reconstructionMode==='error',record=reconstructionExamples[reconstructionPortrait];
  const stem=`assets/reconstruction/portrait-${reconstructionPortrait}${isError?'-errors':''}`;
  document.getElementById('reconstruction-media').classList.toggle('error-mode',isError);
  document.getElementById('reconstruction-label').hidden=isError;
  document.getElementById('error-labels').hidden=!isError;
  document.getElementById('error-measurements').hidden=!isError;
  document.getElementById('reconstruction-rome-mae').textContent=record.rome_mean.toFixed(4);
  document.getElementById('reconstruction-ours-mae').textContent=record.ours_mean.toFixed(4);
  document.getElementById('reconstruction-gain').textContent=`${(record.relative_reduction*100).toFixed(1)}%`;
  reconstructionVideo.setAttribute('aria-label',isError?'Matched ROME and HSAvatar RGB error sequence':`HSAvatar reconstruction of portrait ${reconstructionPortrait+1}`);
  reconstructionVideo.width=isError?1024:512;
  reconstructionVideo.poster=stem+'-poster.jpg';
  reconstructionVideo.onloadedmetadata=()=>{reconstructionVideo.currentTime=Math.min(time,Math.max(0,reconstructionVideo.duration-.1));if(wasPlaying)reconstructionVideo.play().catch(()=>{});};
  reconstructionVideo.src=stem+'.mp4';reconstructionVideo.load();
}
document.querySelectorAll('[data-reconstruction]').forEach(button=>button.addEventListener('click',()=>{reconstructionPortrait=Number(button.dataset.reconstruction);selectButtons('[data-reconstruction]',button);updateReconstruction(true);}));
document.querySelectorAll('[data-reconstruction-mode]').forEach(button=>button.addEventListener('click',()=>{reconstructionMode=button.dataset.reconstructionMode;selectButtons('[data-reconstruction-mode]',button);updateReconstruction();}));
// Stop decoding clips once they leave the viewport; autoplay is limited to the two teasers.
const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(!entry.isIntersecting)entry.target.pause();},{threshold:0.05});document.querySelectorAll('video').forEach(video=>observer.observe(video));
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(video=>video.pause());});
