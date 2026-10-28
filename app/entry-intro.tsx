'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
const SESSION_KEY='stada-ntgp-entry-intro-v3';
let seenInMemory=false;
function rememberIntro(){
  seenInMemory=true;
  try{sessionStorage.setItem(SESSION_KEY,'1');}catch{/* Storage restrictions never block entry. */}
}
export default function EntryIntro(){
  const [state,setState]=useState<'checking'|'playing'|'leaving'|'hidden'>('checking');
  const [videoFailed,setVideoFailed]=useState(false);
  const finished=useRef(false);
  const guard=useRef<ReturnType<typeof setTimeout>|null>(null);
  const exitTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const fallbackTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const finish=useCallback(()=>{
    if(finished.current)return;
    finished.current=true;
    rememberIntro();
    if(guard.current)clearTimeout(guard.current);
    setState('leaving');
    exitTimer.current=setTimeout(()=>setState('hidden'),850);
  },[]);
  const showPoster=useCallback(()=>{
    if(finished.current)return;
    setVideoFailed(true);
    rememberIntro();
    if(guard.current)clearTimeout(guard.current);
    if(!fallbackTimer.current)fallbackTimer.current=setTimeout(finish,350);
  },[finish]);
  const onPlaying=useCallback((event:React.SyntheticEvent<HTMLVideoElement>)=>{
    rememberIntro();
    if(guard.current)clearTimeout(guard.current);
    const video=event.currentTarget;
    const remaining=Number.isFinite(video.duration)?Math.max(0,video.duration-video.currentTime):3;
    // This is a stalled-playback safeguard, never the normal exit condition.
    guard.current=setTimeout(finish,Math.max(8000,remaining*1000+6000));
  },[finish]);
  useEffect(()=>{
    const init=setTimeout(()=>{
      let alreadySeen=seenInMemory;
      try{alreadySeen=alreadySeen||sessionStorage.getItem(SESSION_KEY)==='1';}catch{/* Use the in-memory session fallback. */}
      if(alreadySeen){setState('hidden');return;}
      setState('playing');
      guard.current=setTimeout(finish,8000);
    },0);
    return()=>{clearTimeout(init);if(guard.current)clearTimeout(guard.current);if(exitTimer.current)clearTimeout(exitTimer.current);if(fallbackTimer.current)clearTimeout(fallbackTimer.current);};
  },[finish,showPoster]);
  if(state==='hidden')return null;
  return <div className={`nt-intro ${state==='leaving'?'is-leaving':''} ${state==='checking'?'is-checking':''}`} aria-label="Opening STADA Neo Tokyo Grand Prix" role="status">
    {/* The fallback is the real, blank opening frame, never a frame from mid-video. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {videoFailed&&<img className="nt-intro-poster" src="/intro-first-frame.webp" alt="" width={1920} height={1080}/>}
    {state!=='checking'&&!videoFailed&&<video src="/intro.mp4" poster="/intro-first-frame.webp" autoPlay muted playsInline preload="auto" aria-hidden="true" onPlaying={onPlaying} onEnded={finish} onError={showPoster}/>}
    {state==='playing'&&<button className="nt-intro-skip" type="button" onClick={finish}>Пропустить</button>}
  </div>;
}
