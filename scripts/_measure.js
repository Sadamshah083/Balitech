const { launch, connect, sleep } = require("./_chrome");
(async()=>{const chrome=await launch();const cdp=connect(chrome.wsUrl);await cdp.ready;
for (const [W,H] of [[2560,1300],[1620,888]]){
const {targetId}=await cdp.send("Target.createTarget",{url:"about:blank"});
const {sessionId}=await cdp.send("Target.attachToTarget",{targetId,flatten:true});
await cdp.send("Page.enable",{},sessionId);
await cdp.send("Emulation.setDeviceMetricsOverride",{width:W,height:H,deviceScaleFactor:1,mobile:false},sessionId);
await cdp.send("Page.navigate",{url:"http://localhost:3000/"},sessionId);await sleep(8000);
const r=(await cdp.send("Runtime.evaluate",{expression:`JSON.stringify({pt:getComputedStyle(document.querySelector('.hero-section')).paddingTop,sh:document.querySelector('.hero-shell').getBoundingClientRect().toJSON(),copy:document.querySelector('.hero-copy').getBoundingClientRect().height,minh:getComputedStyle(document.querySelector('.hero-copy')).minHeight,since:getComputedStyle(document.querySelector('.hero-since')).fontSize+' '+getComputedStyle(document.querySelector('.hero-since')).whiteSpace,w:document.querySelector('.hero-since').getBoundingClientRect().width,copyw:document.querySelector('.hero-copy').getBoundingClientRect().width,vh:innerHeight})`,returnByValue:true},sessionId)).result.value;
console.log(W,H,r);}
cdp.close();chrome.stop();})();




