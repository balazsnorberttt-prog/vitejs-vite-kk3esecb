import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// === SZERVER KONFIGURÁCIÓ ===
const BACKEND_URL = "https://trash-backend.balazsnorberttt.workers.dev";

// === 1. GLOBÁLIS STÍLUSOK (MOBILRA OPTIMALIZÁLVA) ===
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@500;700;900&display=swap');
  
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body { margin: 0; background: #000; overflow-x: hidden; font-family: 'Rajdhani', sans-serif; color: white; touch-action: manipulation; }
  
  .app-layer { position: absolute; inset: 0; display: flex; flex-direction: column; z-index: 10; overflow-y: auto; overflow-x: hidden; width: 100vw; }
  
  .container { width: 100%; max-width: 500px; margin: 0 auto; padding: 15px; display: flex; flex-direction: column; min-height: 100vh; justify-content: flex-start; }
  
  .cyber-input { width: 100%; padding: 12px; background: rgba(0,0,0,0.9); border: 2px solid #ff0055; color: #ffdd00; font-family: 'Rajdhani'; font-size: 1.1rem; font-weight: bold; border-radius: 8px; text-align: center; outline: none; margin: 8px 0; transition: 0.3s; text-transform: uppercase; }
  
  .btn-action { width: 100%; padding: 18px; background: linear-gradient(90deg, #ff0055, #6600cc); color: white; font-family: 'Black Ops One'; font-size: 1.3rem; border: none; border-radius: 50px; cursor: pointer; text-transform: uppercase; box-shadow: 0 5px 20px rgba(255,0,85,0.4); text-shadow: 1px 1px 0 black; margin: 10px 0; flex-shrink: 0; }
  
  .glass-card { background: rgba(20, 5, 20, 0.85); border: 1px solid rgba(255, 0, 85, 0.4); border-radius: 12px; padding: 15px; margin-bottom: 15px; backdrop-filter: blur(10px); box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
  
  .task-label { color: #ff0055; font-weight: 900; letter-spacing: 1px; margin-bottom: 8px; text-transform: uppercase; font-size: 0.8rem; border-bottom: 1px solid #333; }
  .celeb-name { color: #ff00de; font-weight: 900; font-size: 1.1rem; text-shadow: 0 0 5px #ff00de; }
  .highlight { color: #ffdd00; font-weight: bold; }
  
  .top-bar { padding: 10px 15px; background: rgba(0,0,0,0.8); border-bottom: 1px solid #ff0055; display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
  
  .lobby-list { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin: 15px 0; }
  .player-pill { padding: 6px 12px; background: #222; border-radius: 20px; border: 1px solid #444; font-size: 0.9rem; }
  
  .vote-row { margin-top: 10px; background: rgba(0,0,0,0.4); padding: 10px; border-radius: 6px; }
  input[type=range] { width: 100%; accent-color: #ff0055; margin-top: 8px; }
`;

// === 2. 3D VISUALS ===
function Background3D() {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const count = 40;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      pos: [(Math.random()-0.5)*40, (Math.random()-0.5)*40, (Math.random()-0.5)*40],
      speed: Math.random() * 0.01,
      scale: 0.2 + Math.random() * 0.8
    }));
  }, []);

  useFrame((state) => {
    particles.forEach((p, i) => {
      dummy.position.set(p.pos[0], p.pos[1], p.pos[2]);
      dummy.rotation.y += p.speed;
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.rotation.y = state.clock.elapsedTime * 0.05;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#ff0055" wireframe />
    </instancedMesh>
  );
}

// === 3. TRASH CONTENT DATABASE ===
const CELEBS = ["Tóth Gabi", "Alekosz", "Varga Irén", "Berki szelleme", "Győzike", "Orbán Viktor", "Pumped Gabo", "PSG Ogli", "Zámbó Jimmy", "Kiszel Tünde", "G.w.M", "Szabyest"];
const SCENARIOS = [
  "A Blahán {WHO} éppen ...-t csinál a szökőkútban.",
  "A Parlament közepén {WHO} ...-al keni be magát meztelenül.",
  "A ravatalozóban {WHO} elejtett egy ...-t a koporsóba.",
  "A szülőszobán {WHO} ...-t akart adni az újszülöttnek.",
  "Az OnlyFans oldalán {WHO} ...-t dugott a fülébe."
];
const CHALLENGES = ["Maszturbálás közben ezt kiabáltad:", "A proktológus benyúlt, ezt súgtad neki:", "Ezt írnád a sírkövedre:", "Mit mondanál, ha Orbán Viktor meztelenül kopogna nálad?"];
const OBJECTS = ["Hüvelygomba", "Pacalpörkölt", "Használt óvszer", "Szájer eresze", "Végbélkúp", "Kőbányai sör", "Fityma", "Disznósajt"];

const generateTasks = () => {
  const rand = (a: any[]) => a[Math.floor(Math.random() * a.length)];
  return {
    t1: SCENARIOS[Math.floor(Math.random()*SCENARIOS.length)].replace("{WHO}", `<span class="celeb-name">${rand(CELEBS)}</span>`),
    t2: rand(CHALLENGES),
    t3: { s: rand(CELEBS), t: rand(CELEBS) },
    t4: { word: rand(OBJECTS), letters: ["A", "B", "C"] }
  };
};

// === 4. JÁTÉK MOTOR ===
export default function App() {
  const [view, setView] = useState('MENU');
  const [roomId, setRoomId] = useState('');
  const [myName, setMyName] = useState('');
  const [state, setState] = useState<any>(null);
  const [answers, setAnswers] = useState<any>({ t1: "", t2: "", t3_1: "", t3_2: "", t4_1: "", t4_2: "", t4_3: "" });
  const [myVotes, setMyVotes] = useState<any>({ t1: 5, t2: 5, t3: 5, t4: 5 });

  // Szinkronizáció a Cloudflare-rel
  useEffect(() => {
    if (!roomId || view === 'MENU') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}?roomId=${roomId}`);
        const data = await res.json();
        if (data && !data.error) {
          setState(data);
          if (data.currentPhase !== view) setView(data.currentPhase);
        }
      } catch (e) { console.error("Szerver hiba..."); }
    }, 2500);
    return () => clearInterval(interval);
  }, [roomId, view]);

  const postUpdate = async (update: any) => {
    await fetch(`${BACKEND_URL}?roomId=${roomId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update)
    });
  };

  const createRoom = async () => {
    if (!myName) return alert("Név!");
    const id = Math.floor(1000 + Math.random() * 9000).toString();
    const init = { players: [{ name: myName, score: 0, answers: null, tasks: null, ready: false }], currentPhase: 'LOBBY' };
    setRoomId(id);
    await postUpdate(init);
    setView('LOBBY');
  };

  const joinRoom = async () => {
    if (!roomId || !myName) return alert("Kód és név!");
    const res = await fetch(`${BACKEND_URL}?roomId=${roomId}`);
    const data = await res.json();
    if (data.error) return alert("Nincs ilyen szoba!");
    const updated = [...data.players, { name: myName, score: 0, answers: null, tasks: null, ready: false }];
    await postUpdate({ players: updated });
    setView('LOBBY');
  };

  const startRound = async () => {
    const updated = state.players.map((p: any) => ({ ...p, tasks: generateTasks(), answers: null, ready: false }));
    await postUpdate({ players: updated, currentPhase: 'PLAYING' });
  };

  const finishAnswers = async () => {
    const updated = state.players.map((p: any) => p.name === myName ? { ...p, answers: answers, ready: true } : p);
    const allReady = updated.every((p: any) => p.ready);
    await postUpdate({ players: updated, currentPhase: allReady ? 'VOTING' : 'PLAYING' });
    setView('WAITING');
  };

  // Ki az, akit én értékelek? (Körbe-értékelés)
  const getTarget = () => {
    if (!state) return null;
    const sorted = [...state.players].sort((a,b) => a.name.localeCompare(b.name));
    const idx = sorted.findIndex((p: any) => p.name === myName);
    return sorted[(idx + 1) % sorted.length];
  };

  const submitVotes = async () => {
    const target = getTarget();
    const total = Object.values(myVotes).reduce((a: any, b: any) => parseInt(a) + parseInt(b), 0);
    const updated = state.players.map((p: any) => {
      let mod = { ...p };
      if (p.name === target.name) mod.score += total;
      if (p.name === myName) mod.ready = true;
      return mod;
    });
    const allDone = updated.every((p: any) => p.ready);
    await postUpdate({ players: updated, currentPhase: allDone ? 'RESULTS' : 'VOTING' });
    setView('WAITING');
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="app-layer">
        <div style={{position:'absolute', inset:0, zIndex:-1}}>
          <Canvas><PerspectiveCamera makeDefault position={[0,0,20]} /><ambientLight intensity={0.5} /><Stars /><Float><Background3D /></Float></Canvas>
        </div>

        {view === 'MENU' && (
          <div className="container" style={{justifyContent:'center'}}>
            <h1 style={{fontFamily:'Black Ops One', fontSize:'3.5rem', textAlign:'center', textShadow:'0 0 15px #ff0055', margin:0}}>TRASH<br/>UNIVERSE</h1>
            <div className="glass-card" style={{marginTop:'30px'}}>
              <input className="cyber-input" placeholder="NEVED" value={myName} onChange={e=>setMyName(e.target.value)} />
              <button className="btn-action" onClick={createRoom}>ÚJ SZOBA</button>
              <div style={{height:'1px', background:'#444', margin:'15px 0'}} />
              <input className="cyber-input" placeholder="SZOBA KÓD" value={roomId} onChange={e=>setRoomId(e.target.value)} />
              <button className="btn-action" style={{background:'#222'}} onClick={joinRoom}>CSATLAKOZÁS</button>
            </div>
          </div>
        )}

        {view === 'LOBBY' && (
          <div className="container">
            <h1 style={{textAlign:'center', fontSize:'2.5rem', margin:'10px 0'}}>SZOBA: {roomId}</h1>
            <div className="glass-card">
              <div className="task-label">Váróterem:</div>
              <div className="lobby-list">{state?.players.map((p: any) => <div key={p.name} className="player-pill" style={{borderColor: p.name===myName?'#ff0055':'#444'}}>{p.name}</div>)}</div>
            </div>
            {state?.players[0].name === myName && state?.players.length > 1 && (
              <button className="btn-action" onClick={startRound}>JÁTÉK INDÍTÁSA</button>
            )}
            <p style={{textAlign:'center', color:'#888'}}>Várj a Host indítására...</p>
          </div>
        )}

        {view === 'PLAYING' && (
          <div className="container">
            <div className="top-bar"><span>{myName}</span><span style={{color:'#ff0055'}}>SZOBA: {roomId}</span></div>
            
            <div className="glass-card">
              <div className="task-label">1. SZITUÁCIÓ (Egészítsd ki!)</div>
              <div style={{fontSize:'1.1rem', marginBottom:'10px'}} dangerouslySetInnerHTML={{__html: state?.players.find((p:any)=>p.name===myName).tasks.t1.replace("...", "_______")}} />
              <input className="cyber-input" placeholder="Írd be a legdurvábbat..." value={answers.t1} onChange={e=>setAnswers({...answers, t1:e.target.value})} />
            </div>

            <div className="glass-card">
              <div className="task-label">2. KÍN-PAD (Vallomás)</div>
              <div style={{fontSize:'1.1rem', marginBottom:'10px'}}>{state?.players.find((p:any)=>p.name===myName).tasks.t2}</div>
              <input className="cyber-input" placeholder="Válasz..." value={answers.t2} onChange={e=>setAnswers({...answers, t2:e.target.value})} />
            </div>

            <button className="btn-action" onClick={finishAnswers}>KÉSZ VAGYOK</button>
          </div>
        )}

        {view === 'VOTING' && (
          <div className="container">
            <h2 style={{textAlign:'center', color:'#ff0055', margin:'10px 0'}}>ÉRTÉKELD: {getTarget()?.name}</h2>
            
            <div className="glass-card">
              <div className="task-label">SZITUÁCIÓ VÁLASZA:</div>
              <div style={{fontSize:'1.2rem', color:'#ffdd00', padding:'10px 0'}}>{getTarget()?.answers.t1}</div>
              <div className="vote-row">
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem'}}><span>SZÁNALMAS</span><span>{myVotes.t1}</span><span>ZSENIÁLIS</span></div>
                <input type="range" min="1" max="10" value={myVotes.t1} onChange={e=>setMyVotes({...myVotes, t1:e.target.value})} />
              </div>
            </div>

            <div className="glass-card">
              <div className="task-label">VALLOMÁS VÁLASZA:</div>
              <div style={{fontSize:'1.2rem', color:'#ffdd00', padding:'10px 0'}}>{getTarget()?.answers.t2}</div>
              <div className="vote-row">
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem'}}><span>UNALMAS</span><span>{myVotes.t2}</span><span>BETEG</span></div>
                <input type="range" min="1" max="10" value={myVotes.t2} onChange={e=>setMyVotes({...myVotes, t2:e.target.value})} />
              </div>
            </div>

            <button className="btn-action" onClick={submitVotes}>SZAVAZATOK BEKÜLDÉSE</button>
          </div>
        )}

        {(view === 'WAITING' || view === 'WAITING_VOTE') && (
          <div className="container" style={{justifyContent:'center', alignItems:'center'}}>
            <div style={{fontSize:'4rem', animation:'pulse 1.5s infinite'}}>⏳</div>
            <h2>VÁRAKOZÁS A TÖBBIEKRE...</h2>
            <p>{state?.players.filter((p:any)=>p.ready).length} / {state?.players.length} játékos kész</p>
          </div>
        )}

        {view === 'RESULTS' && (
          <div className="container">
            <h1 style={{textAlign:'center', fontSize:'3rem', textShadow:'0 0 10px #00f3ff'}}>EREDMÉNY</h1>
            <div className="glass-card">
              {state?.players.sort((a:any,b:any)=>b.score - a.score).map((p:any, i:number) => (
                <div key={p.name} style={{display:'flex', justifyContent:'space-between', padding:'12px', borderBottom: i===state.players.length-1?'none':'1px solid #333', fontSize:'1.3rem'}}>
                  <span>{i===0?'👑':''} {p.name}</span>
                  <span style={{color:'#ff0055', fontWeight:'bold'}}>{p.score} PT</span>
                </div>
              ))}
            </div>
            {state?.players[0].name === myName && (
              <button className="btn-action" onClick={startRound}>ÚJ KÖR INDÍTÁSA</button>
            )}
          </div>
        )}
      </div>
    </>
  );
}