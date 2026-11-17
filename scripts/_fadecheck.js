const { launch, connect, sleep } = require("./_chrome");
(async()=>{const chrome=await launch();const cdp=connect(chrome.wsUrl);await cdp.ready;
const {targetId}=await cdp.send("Target.createTarget",{url:"about:blank"});
const {sessionId}=await cdp.send("Target.attachToTarget",{targetId,flatten:true});
await cdp.send("Page.enable",{},sessionId);
await cdp.send("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false},sessionId);
await cdp.send("Page.navigate",{url:"http://localhost:3000/"},sessionId);await sleep(9000);
const ev=async e=>(await cdp.send("Runtime.evaluate",{expression:e,returnByValue:true},sessionId)).result.value;
// per-slide: [opacity, z-index]
const snap=`JSON.stringify([...document.querySelectorAll('.hero-center__slide')].map((s,i)=>{const c=getComputedStyle(s);return +c.opacity>0.01?i+':o'+(+c.opacity).toFixed(2)+'/z'+c.zIndex:null}).filter(Boolean))`;
const key=`document.querySelector('.hero-center').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true})); 1`;
await ev(`document.querySelector('.hero-center').dispatchEvent(new MouseEvent('mouseenter')); 1`);
await sleep(1500);
const gaps=[];
await ev(key);
for(let t=0;t<12;t++){ const s=await ev(snap); gaps.push(s); await sleep(90);}
console.log('during a change (every 90ms):'); gaps.forEach((g,i)=>console.log(' ',i*90+'ms',g));
// wrap
const cur=JSON.parse(await ev(`JSON.stringify([...document.querySelectorAll('.hero-center__slide')].findIndex(s=>s.classList.contains('is-active')))`));
for(let i=0;i<(7-cur+8)%8;i++){await ev(key);await sleep(1100);}
console.log('on last:', await ev(snap));
await ev(key);
for(let t=0;t<5;t++){await sleep(120);console.log(' wrap',t*120+120+'ms',await ev(snap));}
cdp.close();chrome.stop();})().catch(e=>{console.error(e.message);process.exit(1)});
