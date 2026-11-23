import {FaceLandmarker,FilesetResolver} from "./vendor/vision_bundle.mjs";
const $=s=>document.querySelector(s),av=$("#avatar"),vid=$("#cam"),stage=$("#stage"),status=$("#status");
const K='stroke="#1B1B3A" stroke-width="6" stroke-linejoin="round"';
const bodies={
blob:`<ellipse cx="200" cy="215" rx="140" ry="130" fill="#7C5CFF" ${K}/>`,
robot:`<line x1="200" y1="60" x2="200" y2="95" ${K}/><circle cx="200" cy="52" r="14" fill="#FFC83D" ${K}/><rect x="70" y="95" width="260" height="240" rx="38" fill="#9DB2C8" ${K}/>`,
cat:`<polygon points="85,150 90,50 170,105" fill="#F4A340" ${K}/><polygon points="315,150 310,50 230,105" fill="#F4A340" ${K}/><ellipse cx="200" cy="225" rx="140" ry="120" fill="#F4A340" ${K}/>`};
function build(k){av.innerHTML=`<svg viewBox="0 0 400 400"><g id="head">${bodies[k]}
<g id="eL"><ellipse rx="30" ry="34" fill="#fff" ${K}/><circle id="pL" r="12" fill="#1B1B3A"/></g>
<g id="eR"><ellipse rx="30" ry="34" fill="#fff" ${K}/><circle id="pR" r="12" fill="#1B1B3A"/></g>
<path id="bL" fill="none" stroke="#1B1B3A" stroke-width="9" stroke-linecap="round"/><path id="bR" fill="none" stroke="#1B1B3A" stroke-width="9" stroke-linecap="round"/>
<path id="mouth" fill="#2A1033" ${K}/></g></svg>`}
const s={bl:0,br:0,open:0,smile:0,frown:0,pk:0,bd:0,bu:0,roll:0,yaw:0,pitch:0};
let sm=.45,base=null,lm,last=-1,running=false;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),$$=id=>document.getElementById(id);
function render(){
$$("eL").setAttribute("transform",`translate(150 175) scale(1 ${1-s.bl*.92})`);
$$("eR").setAttribute("transform",`translate(250 175) scale(1 ${1-s.br*.92})`);
const px=s.yaw*10,py=s.pitch*10;
$$("pL").setAttribute("transform",`translate(${px} ${py})`);$$("pR").setAttribute("transform",`translate(${px} ${py})`);
const by=125-s.bu*16+s.bd*8,inr=by+s.bd*14-s.bu*6;
$$("bL").setAttribute("d",`M115 ${by} L180 ${inr}`);$$("bR").setAttribute("d",`M285 ${by} L220 ${inr}`);
const d=s.smile-s.frown,c=272-d*24,w=46-s.pk*22+s.smile*14,uc=c+d*16,lc=uc+6+s.open*85;
$$("mouth").setAttribute("d",`M${200-w} ${c} Q200 ${uc} ${200+w} ${c} Q200 ${lc} ${200-w} ${c}Z`);
$$("head").setAttribute("transform",`translate(${s.yaw*160} ${s.pitch*110}) rotate(${s.roll} 200 220)`);}
function update(res){
const b={};res.faceBlendshapes[0].categories.forEach(x=>b[x.categoryName]=x.score);
const p=res.faceLandmarks[0],w=Math.abs(p[454].x-p[234].x)||1,h=Math.abs(p[152].y-p[10].y)||1;
const yaw=-(p[1].x-(p[234].x+p[454].x)/2)/w,pitch=(p[1].y-(p[10].y+p[152].y)/2)/h;
if(!base)base={yaw,pitch};
const t={bl:clamp(b.eyeBlinkLeft*1.2),br:clamp(b.eyeBlinkRight*1.2),open:clamp(b.jawOpen*1.6),
smile:clamp((b.mouthSmileLeft+b.mouthSmileRight)*.8),frown:clamp((b.mouthFrownLeft+b.mouthFrownRight)*.8),pk:clamp(b.mouthPucker),
bd:clamp((b.browDownLeft+b.browDownRight)/2*1.4),bu:clamp(b.browInnerUp*1.3),
roll:clamp(-Math.atan2(p[263].y-p[33].y,p[263].x-p[33].x)*180/Math.PI,-35,35),yaw:clamp(yaw-base.yaw,-.4,.4),pitch:clamp(pitch-base.pitch,-.3,.3)};
for(const k in t)s[k]+=(t[k]-s[k])*(1-sm);
render();}
function tick(){if(!running)return;
if(vid.currentTime!==last){last=vid.currentTime;const r=lm.detectForVideo(vid,performance.now());if(r.faceLandmarks.length)update(r);}
requestAnimationFrame(tick);}
async function load(){
const fs=await FilesetResolver.forVisionTasks("./vendor/wasm");
const mk=d=>FaceLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:"./models/face_landmarker.task",delegate:d},runningMode:"VIDEO",numFaces:1,outputFaceBlendshapes:true});
try{lm=await mk("GPU")}catch(e){lm=await mk("CPU")}}
$("#start").onclick=async()=>{
if(running)return;status.textContent="Loading face tracking…";
try{if(!lm)await load();}catch(e){status.textContent="Could not load the face model. Check that models/face_landmarker.task exists.";return}
try{vid.srcObject=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480,facingMode:"user"},audio:false});await vid.play()}
catch(e){status.textContent="Camera blocked. Allow camera access in your browser address bar, then try again.";return}
running=true;$("#start").textContent="Camera on";status.textContent="Tracking. Look straight ahead and press Recenter.";tick();};
$("#char").onchange=e=>build(e.target.value);
$("#bg").onchange=e=>stage.dataset.bg=e.target.value;
$("#smooth").oninput=e=>sm=e.target.value/100;
$("#showcam").onchange=e=>vid.classList.toggle("on",e.target.checked);
$("#recenter").onclick=()=>base=null;
$("#clean").onclick=()=>document.body.classList.add("clean");
addEventListener("keydown",e=>{if(e.key==="Escape")document.body.classList.remove("clean")});
build("blob");render();
