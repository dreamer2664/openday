/* Read-only conservative range proof through the actual browser geometry module. */
const fs=require('fs'),vm=require('vm'),crypto=require('crypto');
const c='/home/user/.cache/casardi-rootcause',r=c+'/casardi_postcard';
const cfg=JSON.parse(fs.readFileSync(c+'/geometry-envelope-input.json','utf8'));
globalThis.PORTABLE=cfg.portable;
const code=fs.readFileSync(r+'/browser/composition.js','utf8');vm.runInThisContext(code);
const start=performance.now();let cases=0,minX=Infinity,minY=Infinity;
for(const scene of Object.keys(PORTABLE.photo))for(const mode of ['photo','nes'])for(let scale=65;scale<=135;scale++)for(let h=cfg.minimumHeight;h<=64;h++)for(const companion of cfg.companions){
 const job={scene,mode,composition:{actor:{x:300,y:350,scale}},companion:companion?.spec||null};
 const geo=CasardiComposition.actorGeometry(job,{w:64,h,anchor:32},companion?.descriptor,companion?.reference||1);
 const dx=576-geo.group.w,dy=376-geo.group.h;if(dx<=0||dy<=0)throw new Error(JSON.stringify({job,h,geo,dx,dy}));
 minX=Math.min(minX,dx);minY=Math.min(minY,dy);cases++;
}
const report={result:'PASS',date:'2026-11-27',engine:process.version,geometry_cases:cases,minimum_horizontal_range:minX,minimum_vertical_range:minY,seconds:(performance.now()-start)/1000,source_sha256:crypto.createHash('sha256').update(code).digest('hex'),scope:'Actual shared browser actorGeometry through Node, conservative 64x64/mandatory-height envelope, all 71 scales, all scenes/styles/42 companion variants and poses plus none. Not DOM or touch evidence.'};
fs.writeFileSync(c+'/browser-geometry-envelope-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
