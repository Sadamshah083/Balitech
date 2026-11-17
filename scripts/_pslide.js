const { launch, connect, sleep } = require("./_chrome");
const fs=require("fs");
(async()=>{const W=+process.argv[2]||1440,H=+process.argv[3]||900;
const chrome=await launch();const cdp=connect(chrome.wsUrl);await cdp.ready;
const {targetId}=await cdp.send("Target.createTarget",{url:"about:blank"});
const {sessionId}=await cdp.send("Target.attachToTarget",{targetId,flatten:true});
await cdp.send("Page.enable",{},sessionId);
await cdp.send("Emulation.setDeviceMetricsOverride",{width:W,height:H,deviceScaleFactor:1,mobile:false},sessionId);
await cdp.send("Page.navigate",{url:"http://localhost:3000/"},sessionId);await sleep(10000);
const ev=async e=>(await cdp.send("Runtime.evaluate",{expression:e,returnByValue:true},sessionId)).result.value;
for(let step=0;step<3;step++){
  // force every page slider to slide "step" by dispatching clicks isn't available; wait for autoplay instead
  await sleep(step===0?500:5200);
  const r=await cdp.send("Page.captureScreenshot",{format:"png"},sessionId);
  fs.writeFileSync(`tmp/pslide-${W}-${step}.png`,Buffer.from(r.data,'base64'));
  console.log(step, await ev(`[...document.querySelectorAll('.hero-pslider')].map(f=>{const r=f.getBoundingClientRect();return Math.round(r.width)+'x'+Math.round(r.height)+' '+(f.parentElement.querySelector('.hero-pslider__cap')?.textContent||'')}).join(' | ')`));
}
console.log('page bottoms', await ev(`JSON.stringify({left:Math.round(document.querySelector('.hero-art--left').getBoundingClientRect().bottom),leftLast:Math.round([...document.querySelectorAll('.hero-art--left .hero-art__card')].pop().getBoundingClientRect().bottom),rightBubbles:Math.round(document.querySelector('.hero-bubbles').getBoundingClientRect().bottom),pageBottom:Math.round(document.querySelector('.hero-stats').getBoundingClientRect().bottom)})`));
cdp.close();chrome.stop();})();
