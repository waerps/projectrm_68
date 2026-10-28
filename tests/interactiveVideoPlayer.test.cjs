const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { transformSync } = require('esbuild');
const compiled = transformSync(fs.readFileSync('src/components/InteractiveVideoPlayer.jsx', 'utf8'), {loader:'jsx',format:'cjs',jsx:'automatic'}).code;
const tick = () => new Promise(resolve => setImmediate(resolve));
function harness(initial = {}) {
  let cursor=0, tree, now=0, effects=[], dirty=false;
  const slots=[], timers=[], calls=[], listeners=new Map();
  let save=async () => ({data:{watchPercent:10,lastWatchTime:10,blockedByQuestion:{questionId:1}}});
  const media={duration:60,currentTime:0,paused:false,seeking:false,playbackRate:1,
    addEventListener(n,f){listeners.set(n,f);},removeEventListener(n){listeners.delete(n);},
    pause(){this.paused=true;},play(){this.paused=false;listeners.get('play')?.();return Promise.resolve();}};
  const question={questionId:1,timestampMs:30000,text:'Question',answered:false,options:[{optionId:2,text:'Answer'}]};
  function memo(fn,deps,effect=false){const i=cursor++,old=slots[i];if(!old||deps.some((x,j)=>x!==old.deps[j])){slots[i]={deps,value:fn};if(effect) effects.push(fn);} return slots[i].value;}
  const hooks={useRef(value){const i=cursor++;return slots[i]??=( {current:value});},useState(value){const i=cursor++;if(!(i in slots)) slots[i]=value;return [slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;dirty=true;}];},useEffect:(f,d)=>memo(f,d,true),useCallback:(f,d)=>memo(f,d)};
  const jsx=(type,props,key)=>({type,props:props||{},key});
  const mod={exports:{}};
  vm.runInNewContext(compiled,{module:mod,exports:mod.exports,require(n){if(n==='react')return hooks;if(n==='react/jsx-runtime')return {jsx,jsxs:jsx};if(n==='lucide-react')return {};return {getVideoLearningState:async()=>({questions:[question]}),updateVideoWatchSegments:async(...args)=>{calls.push(['save',args[2]]);return save();},submitVideoQuestionAnswer:async()=>{calls.push(['answer']);return {isCorrect:true};}};},performance:{now:()=>now},document:{hidden:false,addEventListener(){},removeEventListener(){}},setInterval:f=>{timers.push(f);return timers.length;},clearInterval(){},queueMicrotask,console,crypto:{randomUUID:()=> '00000000-0000-4000-8000-000000000001'}});
  const props={video:{VideoId:1,WatchPercent:0,LastWatchTime:0,VideoUrl:'sample.mp4',...initial},token:'test',saveRef:{current:null}};
  const wrapper=mod.exports.default(props);
  const all=(node=tree)=>!node||typeof node!=='object'?[]:Array.isArray(node)?node.flatMap(n=>all(n ?? null)):[node,...all(node.props?.children ?? null)];
  function render(){let runs=0;do{dirty=false;cursor=0;effects=[];tree=wrapper.type(props);for(const n of all()){if(n.props?.ref)n.props.ref.current=n.type==='video'?media:{focus(){}};}const batch=effects;effects=[];batch.forEach(f=>f());}while(dirty&&++runs<10);}
  render();
  return {calls,media,all,render, saveClose:()=>props.saveRef.current(), async pause(){media.paused=true;listeners.get("pause")?.();await tick();render();},setSave:f=>{save=f;},async ready(){await tick();render();},async watch(to){media.paused=false;for(let t=media.currentTime+.25;t<=to;t+=.25){media.currentTime=t;now=t*1000;listeners.get('timeupdate')?.();}await tick();render();},async flush(){timers[0]();await tick();render();},select(){all().find(n=>n.type==='button'&&n.props.children?.[1]==='Answer').props.onClick();render();},submit(){return all().find(n=>n.type==='button'&&n.props.className?.includes('disabled:bg-neutral-200')).props.onClick();},play:()=>media.play()};
}
test('periodic save does not open the future question; reaching its timestamp overlays and locks the video',async()=>{
 const h=harness();await h.ready();await h.watch(10);await h.flush();assert.equal(h.all().some(n=>n.props.role==='dialog'),false);
 await h.watch(30);assert.ok(h.all().some(n=>n.props.role==='dialog'&&n.props.className.includes('absolute inset-0')));
 const video=h.all().find(n=>n.type==='video');assert.equal(video.props.controls,false);assert.equal(video.props.inert,true);await h.play();assert.equal(h.media.paused,true);
});
test('first viewing submits only after queued progress has persisted',async()=>{
 const h=harness();await h.ready();await h.watch(10);let release;h.setSave(()=>new Promise(r=>release=r));await h.flush();await h.watch(30);h.select();const answer=h.submit();await tick();assert.equal(h.calls.filter(c=>c[0]==='answer').length,0);
 h.setSave(async()=>({data:{watchPercent:50}}));release({data:{watchPercent:10}});await answer;h.render();assert.equal(h.calls.filter(c=>c[0]==='answer').length,1);
 assert.ok(h.calls.filter(c=>c[0]==='save').some(c=>c[1].segmentIndexes.includes(2)));
});
test('failed progress save blocks answering and restores segments for retry',async()=>{
 const h=harness();await h.ready();h.setSave(async()=>{throw Error('offline');});await h.watch(30);h.select();await h.submit();h.render();assert.equal(h.calls.some(c=>c[0]==='answer'),false);
 h.setSave(async()=>({data:{watchPercent:50}}));await h.submit();h.render();assert.equal(h.calls.filter(c=>c[0]==='answer').length,1);assert.ok(h.calls.at(-2)[1].segmentIndexes.includes(0));
});
test('pause before the first complete segment persists the exact position',async()=>{
 const h=harness();await h.ready();await h.watch(4);await h.pause();assert.equal(h.calls.at(-1)[1].lastWatchTime,4);assert.equal(h.calls.at(-1)[1].segmentIndexes.length,0);
});
test('close waits for persistence even when there is no new segment',async()=>{
 const h=harness();await h.ready();await h.watch(5);let release;h.setSave(()=>new Promise(r=>release=r));let closed=false;const close=h.saveClose().then(()=>closed=true);await tick();assert.equal(closed,false);assert.equal(h.calls.at(-1)[1].lastWatchTime,5);release({data:{watchPercent:0,lastWatchTime:5}});await close;assert.equal(closed,true);
});
test('resume keeps partial progress at zero percent and can complete the first segment',async()=>{
 const h=harness({LastWatchTime:5,WatchPercent:0});await h.ready();assert.equal(h.media.currentTime,5);await h.watch(10);await h.flush();assert.ok(h.calls.at(-1)[1].segmentIndexes.includes(0));
});
test('resume never skips an unanswered question',async()=>{
 const h=harness({LastWatchTime:40,WatchPercent:50});await h.ready();assert.equal(h.media.currentTime,30);
});
