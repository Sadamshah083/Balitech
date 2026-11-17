const { launch, connect, sleep } = require("./_chrome");
(async()=>{const chrome=await launch();const cdp=connect(chrome.wsUrl);await cdp.ready;
const {targetId}=await cdp.send("Target.createTarget",{url:"about:blank"});
const {sessionId}=await cdp.send("Target.attachToTarget",{targetId,flatten:true});
await cdp.send("Page.enable",{},sessionId);
await cdp.send("Emulation.setDeviceMetricsOverride",{width:1793,height:790,deviceScaleFactor:1,mobile:false},sessionId);
await cdp.send("Page.navigate",{url:"http://localhost:3000/"},sessionId);await sleep(9000);
const ev=async e=>(await cdp.send("Runtime.evaluate",{expression:e,returnByValue:true},sessionId)).result.value;
await ev(`document.querySelector('.hero-center').dispatchEvent(new MouseEvent('mouseenter')); 1`);
const key=`document.querySelector('.hero-center').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true})); 1`;
const out=[];
for(let i=0;i<12;i++){ await sleep(1700); out.push((await ev(`document.querySelector('.hero-center-caption strong').textContent+'  dark='+(+getComputedStyle(document.querySelector('.hero-dim')).opacity).toFixed(2)+'  (set '+document.querySelector('.hero-dim').style.opacity+')'`))); await ev(key); }
console.log(out.join('\n'));
console.log('rect h:', await ev(`Math.round(document.querySelectorAll('.hero-art__frame')[3].getBoundingClientRect().height)`));
cdp.close();chrome.stop();})();
