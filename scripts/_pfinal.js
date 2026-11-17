const { launch, connect, sleep } = require("./_chrome");
const fs=require("fs");
(async()=>{const chrome=await launch();const cdp=connect(chrome.wsUrl);await cdp.ready;
const {targetId}=await cdp.send("Target.createTarget",{url:"about:blank"});
const {sessionId}=await cdp.send("Target.attachToTarget",{targetId,flatten:true});
await cdp.send("Page.enable",{},sessionId);
await cdp.send("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false},sessionId);
await cdp.send("Page.navigate",{url:"http://localhost:3000/"},sessionId);await sleep(8000);
const ev=async e=>(await cdp.send("Runtime.evaluate",{expression:e,returnByValue:true},sessionId)).result.value;
// wait until no slide is mid-fade, and every frame shows a new (non-first) photo
for(let i=0;i<60;i++){const st=JSON.parse(await ev(`JSON.stringify({leaving:document.querySelectorAll('.hero-pslider__slide.is-leaving').length,firsts:[...document.querySelectorAll('.hero-pslider')].filter(f=>f.querySelector('.is-active.is-cutout')).length})`));
 if(st.leaving===0&&st.firsts<=1)break;await sleep(400);}
const r=await cdp.send("Page.captureScreenshot",{format:"png"},sessionId);fs.writeFileSync('tmp/pslide-final.png',Buffer.from(r.data,'base64'));
console.log(await ev(`[...document.querySelectorAll('.hero-pslider')].map(f=>f.parentElement.querySelector('.hero-pslider__cap').textContent).join(' | ')`));
cdp.close();chrome.stop();})();
