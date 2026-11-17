const { launch, connect, sleep } = require("./_chrome");
const fs=require("fs");
(async()=>{const sizes=[[1440,900],[1808,753],[1280,720],[1024,768],[1920,1000]];
const chrome=await launch();const cdp=connect(chrome.wsUrl);await cdp.ready;
for(const [W,H] of sizes){
 const {targetId}=await cdp.send("Target.createTarget",{url:"about:blank"});
 const {sessionId}=await cdp.send("Target.attachToTarget",{targetId,flatten:true});
 await cdp.send("Page.enable",{},sessionId);
 await cdp.send("Emulation.setDeviceMetricsOverride",{width:W,height:H,deviceScaleFactor:1,mobile:false},sessionId);
 await cdp.send("Page.navigate",{url:"http://localhost:3000/"},sessionId);await sleep(9000);
 const ev=async e=>(await cdp.send("Runtime.evaluate",{expression:e,returnByValue:true},sessionId)).result.value;
 // sample the top of every bubble disc for ~22s: any movement = a bubble jumping
 await ev(`window.__t=[...document.querySelectorAll('.hero-bubble__disc')].map(()=>new Set());window.__s=setInterval(()=>{[...document.querySelectorAll('.hero-bubble__disc')].forEach((d,i)=>window.__t[i].add(Math.round(d.getBoundingClientRect().top)))},100);1`);
 await sleep(22000);
 const moved=await ev(`JSON.stringify(window.__t.map(s=>s.size))`);
 const fit=await ev(`JSON.stringify({pageBottom:Math.round(document.querySelector('.hero-stats').getBoundingClientRect().bottom),lastCaptionBottom:Math.round(Math.max(...[...document.querySelectorAll('.hero-bubble__caption')].map(c=>c.getBoundingClientRect().bottom))),rectH:Math.round(document.querySelectorAll('.hero-pslider')[3].getBoundingClientRect().height),vh:innerHeight})`);
 console.log(W+'x'+H,'distinct tops per bubble (1 = never moved):',moved,fit);
 const r=await cdp.send("Page.captureScreenshot",{format:"png"},sessionId);fs.writeFileSync(`tmp/resp-${W}x${H}.png`,Buffer.from(r.data,'base64'));
 await cdp.send("Target.closeTarget",{targetId});
}
cdp.close();chrome.stop();})();
