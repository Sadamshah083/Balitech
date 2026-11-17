const fs=require("fs");
const { launch, connect, sleep } = require("./_chrome");
(async()=>{const chrome=await launch();const cdp=connect(chrome.wsUrl);await cdp.ready;
const {targetId}=await cdp.send("Target.createTarget",{url:"about:blank"});
const {sessionId}=await cdp.send("Target.attachToTarget",{targetId,flatten:true});
await cdp.send("Page.enable",{},sessionId);
await cdp.send("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:2,mobile:false},sessionId);
await cdp.send("Page.navigate",{url:"http://localhost:3000/"},sessionId);await sleep(9000);
const ev=async e=>(await cdp.send("Runtime.evaluate",{expression:e,returnByValue:true},sessionId)).result.value;
for(let i=0;i<40;i++){const ok=await ev(`(()=>{const f=document.querySelectorAll('.hero-pslider')[1];return f&&f.parentElement.querySelector('.hero-pslider__cap').textContent.includes('YES')&&!f.querySelector('.is-leaving')})()`);if(ok)break;await sleep(500)}
await sleep(700);
const s=await cdp.send("Page.captureScreenshot",{format:"png",clip:{x:90,y:380,width:370,height:230,scale:1}},sessionId);
fs.writeFileSync('tmp/yes-frame.png',Buffer.from(s.data,'base64'));
console.log(await ev(`document.querySelectorAll('.hero-pslider')[1].parentElement.querySelector('.hero-pslider__cap').textContent`));
cdp.close();chrome.stop();})();
