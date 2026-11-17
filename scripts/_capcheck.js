const { launch, connect, sleep } = require("./_chrome");
const fs=require("fs");const sharp=require("sharp");
(async()=>{const chrome=await launch();const cdp=connect(chrome.wsUrl);await cdp.ready;
const {targetId}=await cdp.send("Target.createTarget",{url:"about:blank"});
const {sessionId}=await cdp.send("Target.attachToTarget",{targetId,flatten:true});
await cdp.send("Page.enable",{},sessionId);
await cdp.send("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false},sessionId);
await cdp.send("Page.navigate",{url:"http://localhost:3000/"},sessionId);await sleep(9000);
const ev=async e=>(await cdp.send("Runtime.evaluate",{expression:e,returnByValue:true},sessionId)).result.value;
const tiles=[];
for(let i=0;i<4;i++){await sleep(i?5200:800);
 const s=await cdp.send("Page.captureScreenshot",{format:"png",clip:{x:990,y:400,width:380,height:400,scale:1}},sessionId);tiles.push(Buffer.from(s.data,'base64'));
 console.log(i,await ev(`[...document.querySelectorAll('.hero-bubble')].map(b=>b.querySelector('.hero-bcap')?.textContent).join(' | ')`))}
await sharp({create:{width:380*2,height:400*2,channels:3,background:'#000'}}).composite(tiles.map((input,i)=>({input,left:(i%2)*380,top:Math.floor(i/2)*400}))).png().toFile('tmp/caps-sheet.png');
cdp.close();chrome.stop();})();
