'use strict';
function switchVideo(video,stem){const playing=!video.paused;video.pause();video.src=`assets/showcase/${stem}.mp4`;video.poster=`assets/showcase/${stem}-poster.jpg`;video.load();if(playing)video.play().catch(()=>{});}
function selectButtons(selector,button){document.querySelectorAll(selector).forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}
document.querySelectorAll('[data-speech]').forEach(button=>button.addEventListener('click',()=>{switchVideo(document.getElementById('speech-video'),`speech-${button.dataset.speech}`);selectButtons('[data-speech]',button);}));
document.querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>{switchVideo(document.getElementById('image-video'),`image-driven-${button.dataset.image}`);selectButtons('[data-image]',button);}));
let portrait=0;const slider=document.getElementById('keyframe-slider'),picture=document.getElementById('comparison-image');
function updateMoment(){const n=Number(slider.value);picture.src=`assets/showcase/comparison-${portrait}-${n}.jpg`;document.getElementById('moment-label').textContent=`Moment ${n+1} of 3`;document.getElementById('previous-moment').disabled=n===0;document.getElementById('next-moment').disabled=n===2;}
document.querySelectorAll('[data-comparison]').forEach(button=>button.addEventListener('click',()=>{portrait=Number(button.dataset.comparison);slider.value=0;selectButtons('[data-comparison]',button);updateMoment();}));
slider.addEventListener('input',updateMoment);
document.getElementById('previous-moment').addEventListener('click',()=>{slider.value=Math.max(0,Number(slider.value)-1);updateMoment();});
document.getElementById('next-moment').addEventListener('click',()=>{slider.value=Math.min(2,Number(slider.value)+1);updateMoment();});updateMoment();
// Stop decoding clips once they leave the viewport; autoplay is limited to the two teasers.
const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(!entry.isIntersecting)entry.target.pause();},{threshold:0.05});document.querySelectorAll('video').forEach(video=>observer.observe(video));
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(video=>video.pause());});
