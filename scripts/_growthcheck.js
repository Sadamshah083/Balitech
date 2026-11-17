const { launch, connect, sleep } = require("./_chrome");
(async()=>{const chrome=await launch();const cdp=connect(chrome.wsUrl);await cdp.ready;
const {targetId}=await cdp.send("Target.createTarget",{url:"about:blank"});
const {sessionId}=await cdp.send("Target.attachToTarget",{targetId,flatten:true});
await cdp.send("Page.enable",{},sessionId);
await cdp.send("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false},sessionId);
await cdp.send("Page.navigate",{url:"http://localhost:3000/"},sessionId);await sleep(9000);
const ev=async e=>(await cdp.send("Runtime.evaluate",{expression:e,returnByValue:true},sessionId)).result.value;
await ev(`document.querySelector('.hero-center').dispatchEvent(new MouseEvent('mouseenter')); 1`);
const key=`document.querySelector('.hero-center').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true})); 1`;
const list=await ev(`JSON.stringify([...document.querySelectorAll('.hero-center__slide')].map((s,i)=>s.querySelector('img').alt.slice(0,34)))`);
console.log('slides:',JSON.parse(list).length); console.log(JSON.parse(list).join(' | '));
for(let i=0;i<9;i++){await ev(key);await sleep(900);}
await sleep(1500);
const r=await cdp.send("Page.captureScreenshot",{format:"png"},sessionId);
require('fs').writeFileSync('tmp/growth-center.png',Buffer.from(r.data,'base64'));
console.log('caption:',await ev(`document.querySelector('.hero-center-caption').textContent`));
cdp.close();chrome.stop();})();
