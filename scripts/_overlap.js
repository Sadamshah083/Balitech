const { launch, connect, sleep } = require("./_chrome");
(async()=>{const chrome=await launch();const cdp=connect(chrome.wsUrl);await cdp.ready;
const {targetId}=await cdp.send("Target.createTarget",{url:"about:blank"});
const {sessionId}=await cdp.send("Target.attachToTarget",{targetId,flatten:true});
await cdp.send("Page.enable",{},sessionId);
await cdp.send("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false},sessionId);
await cdp.send("Page.navigate",{url:"http://localhost:3000/"},sessionId);await sleep(9000);
const ev=async e=>(await cdp.send("Runtime.evaluate",{expression:e,returnByValue:true},sessionId)).result.value;
// install sampler: every 50ms, for each slider, find slides with opacity>0.05; flag overlap when 2+ visible and any of them is a cutout
await ev(`window.__bad=0;window.__swaps=0;window.__seen=new Set();setInterval(()=>{
 const groups=[...document.querySelectorAll('.hero-pslider, .hero-bubble__disc')];
 groups.forEach((g,gi)=>{const vis=[...g.querySelectorAll('.hero-pslider__slide, .hero-bslide')].filter(s=>+getComputedStyle(s).opacity>0.05);
  if(vis.length>=2){window.__seen.add(gi); if(vis.some(s=>s.classList.contains('is-cutout')))window.__bad++}})},50);1`);
await sleep(32000);
console.log(await ev(`JSON.stringify({sliders_that_swapped_with_two_visible_photos:[...window.__seen].length,overlap_samples_involving_a_cutout:window.__bad})`));
cdp.close();chrome.stop();})();
