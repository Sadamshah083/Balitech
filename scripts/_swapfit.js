const { launch, connect, sleep } = require("./_chrome");
const fs=require("fs");
(async()=>{const chrome=await launch();const cdp=connect(chrome.wsUrl);await cdp.ready;
for(const [W,H] of [[1440,900],[1808,753],[1280,720],[1024,768],[1920,1000]]){
 const {targetId}=await cdp.send("Target.createTarget",{url:"about:blank"});
 const {sessionId}=await cdp.send("Target.attachToTarget",{targetId,flatten:true});
 await cdp.send("Page.enable",{},sessionId);
 await cdp.send("Emulation.setDeviceMetricsOverride",{width:W,height:H,deviceScaleFactor:1,mobile:false},sessionId);
 await cdp.send("Page.navigate",{url:"http://localhost:3000/"},sessionId);await sleep(9000);
 const ev=async e=>(await cdp.send("Runtime.evaluate",{expression:e,returnByValue:true},sessionId)).result.value;
 console.log(W+'x'+H, await ev(`(()=>{const b=s=>Math.round(Math.max(...[...document.querySelectorAll(s)].map(e=>e.getBoundingClientRect().bottom)));const page=Math.round(document.querySelector('.hero-stats').getBoundingClientRect().bottom);return JSON.stringify({pageBottom:page,leftContentBottom:b('.hero-art--left .hero-art__card, .hero-art--left .hero-bubble'),rightContentBottom:b('.hero-art--right .hero-art__card, .hero-art--right .hero-bubble'),overlapLeft:(()=>{const r=[...document.querySelectorAll('.hero-art--left > *')].map(e=>e.getBoundingClientRect());return r.some((a,i)=>i&&a.top<r[i-1].bottom-1)})(),overlapRight:(()=>{const r=[...document.querySelectorAll('.hero-art--right > *')].map(e=>e.getBoundingClientRect());return r.some((a,i)=>i&&a.top<r[i-1].bottom-1)})()})})()`));
 const r=await cdp.send("Page.captureScreenshot",{format:"png"},sessionId);fs.writeFileSync(`tmp/swap-${W}x${H}.png`,Buffer.from(r.data,'base64'));
 await cdp.send("Target.closeTarget",{targetId});}
cdp.close();chrome.stop();})();
