const fs=require("fs");const sharp=require("sharp");
const { launch, connect, sleep } = require("./_chrome");
(async()=>{const chrome=await launch();const cdp=connect(chrome.wsUrl);await cdp.ready;
const {targetId}=await cdp.send("Target.createTarget",{url:"about:blank"});
const {sessionId}=await cdp.send("Target.attachToTarget",{targetId,flatten:true});
await cdp.send("Page.enable",{},sessionId);
await cdp.send("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false},sessionId);
await cdp.send("Page.navigate",{url:"http://localhost:3000/"},sessionId);await sleep(9000);
const ev=async e=>(await cdp.send("Runtime.evaluate",{expression:e,returnByValue:true},sessionId)).result.value;
console.log(await ev(`(()=>{const c=document.querySelector('.hero-stage__disc').getBoundingClientRect();const cx=c.x+c.width/2,cy=c.y+c.height/2,R=c.width/2;return JSON.stringify([...document.querySelectorAll('.hero-bubble__disc')].map(b=>{const r=b.getBoundingClientRect();const bx=r.x+r.width/2,by=r.y+r.height/2;const dist=Math.hypot(bx-cx,by-cy)-R-r.width/2;return Math.round(dist)}))})()`)+'  <- gap (px) of each bubble from the centre circle');
const clip={x:990,y:400,width:380,height:400,scale:1};const tiles=[];
for(let i=0;i<6;i++){await sleep(i===0?800:4300);const s=await cdp.send("Page.captureScreenshot",{format:"png",clip},sessionId);tiles.push(Buffer.from(s.data,'base64'))}
await sharp({create:{width:380*3,height:400*2,channels:3,background:'#000'}}).composite(tiles.map((input,i)=>({input,left:(i%3)*380,top:Math.floor(i/3)*400}))).png().toFile('tmp/bubbles-sheet.png');
cdp.close();chrome.stop();})();
