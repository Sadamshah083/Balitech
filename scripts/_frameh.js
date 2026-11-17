const { launch, connect, sleep } = require("./_chrome");
(async()=>{const chrome=await launch();const cdp=connect(chrome.wsUrl);await cdp.ready;
for(const [W,H] of [[1440,900],[1808,753],[1280,720]]){
 const {targetId}=await cdp.send("Target.createTarget",{url:"about:blank"});
 const {sessionId}=await cdp.send("Target.attachToTarget",{targetId,flatten:true});
 await cdp.send("Page.enable",{},sessionId);
 await cdp.send("Emulation.setDeviceMetricsOverride",{width:W,height:H,deviceScaleFactor:1,mobile:false},sessionId);
 await cdp.send("Page.navigate",{url:"http://localhost:3000/"},sessionId);await sleep(8000);
 const ev=async e=>(await cdp.send("Runtime.evaluate",{expression:e,returnByValue:true},sessionId)).result.value;
 console.log(W+'x'+H,await ev(`JSON.stringify({frameHeights:[...document.querySelectorAll('.hero-pslider')].map(f=>Math.round(f.getBoundingClientRect().height)),cssHeight:getComputedStyle(document.querySelector('.hero-pslider')).height})`));
 await cdp.send("Target.closeTarget",{targetId});}
cdp.close();chrome.stop();})();
