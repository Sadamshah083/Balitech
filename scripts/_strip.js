const { launch, connect, sleep } = require("./_chrome");
(async()=>{const chrome=await launch();const cdp=connect(chrome.wsUrl);await cdp.ready;
const {targetId}=await cdp.send("Target.createTarget",{url:"about:blank"});
const {sessionId}=await cdp.send("Target.attachToTarget",{targetId,flatten:true});
await cdp.send("Page.enable",{},sessionId);
await cdp.send("Emulation.setDeviceMetricsOverride",{width:1906,height:761,deviceScaleFactor:1,mobile:false},sessionId);
await cdp.send("Page.navigate",{url:"http://localhost:3000/"},sessionId);await sleep(9000);
const r=(await cdp.send("Runtime.evaluate",{expression:`JSON.stringify({sh2:getComputedStyle(document.querySelector('.hero-section'),'::before').background.slice(0,70)+' h='+getComputedStyle(document.querySelector('.hero-section'),'::before').height,bg:getComputedStyle(document.querySelector('.hero-strip--fourth')).backgroundColor,sh:getComputedStyle(document.querySelector('.hero-stats')).boxShadow.slice(-60),ov:getComputedStyle(document.querySelector('.hero-section')).overflowY,hh:document.querySelector('.hero-section').getBoundingClientRect().bottom+scrollY,after:[getComputedStyle(document.querySelector('.hero-section'),'::after').right,getComputedStyle(document.querySelector('.hero-section'),'::after').bottom],soft:getComputedStyle(document.querySelector('.hero-strip--soft')).right})`,returnByValue:true},sessionId)).result.value;
console.log(r);cdp.close();chrome.stop();})();




