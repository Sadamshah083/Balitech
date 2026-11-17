const { launch, connect, sleep } = require("./_chrome");
(async()=>{const chrome=await launch();const cdp=connect(chrome.wsUrl);await cdp.ready;
const {targetId}=await cdp.send("Target.createTarget",{url:"about:blank"});
const {sessionId}=await cdp.send("Target.attachToTarget",{targetId,flatten:true});
await cdp.send("Page.enable",{},sessionId);
await cdp.send("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false},sessionId);
await cdp.send("Page.navigate",{url:"http://localhost:3000/"},sessionId);await sleep(9000);
const ev=async e=>(await cdp.send("Runtime.evaluate",{expression:e,returnByValue:true},sessionId)).result.value;
await ev(`window.__log=[];window.__last=null;window.__t0=performance.now();window.__s=setInterval(()=>{const cur=[...document.querySelectorAll('.hero-bubble')].map(b=>{const d=b.querySelector('.hero-bubble__disc').getBoundingClientRect().top,c=b.querySelector('.hero-bubble__caption').getBoundingClientRect();return Math.round(d*10)/10+'/'+Math.round(c.height*10)/10+'/'+b.querySelector('.hero-bcap').textContent});const k=JSON.stringify(cur);if(k!==window.__last){window.__log.push([Math.round(performance.now()-window.__t0),cur]);window.__last=k}},80);1`);
await sleep(26000);
const log=JSON.parse(await ev(`JSON.stringify(window.__log)`));
let prevTops=null;
for(const [t,cur] of log){const tops=cur.map(x=>x.split('/')[0]);const moved=prevTops&&tops.some((v,i)=>v!==prevTops[i]);console.log(String(t).padStart(6),'ms',moved?'TOP MOVED':'caption/text change only',moved?JSON.stringify(tops):'');prevTops=tops}
cdp.close();chrome.stop();})();
