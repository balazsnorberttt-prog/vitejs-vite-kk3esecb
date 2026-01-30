import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// === SZERVER KONFIGURÁCIÓ ===
const BACKEND_URL = "https://trash-backend.balazsnorberttt.workers.dev";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@500;700;900&display=swap');
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body { margin: 0; background: #000; overflow: hidden; font-family: 'Rajdhani', sans-serif; color: white; }
  .app-layer { position: absolute; inset: 0; display: flex; flex-direction: column; z-index: 10; overflow-y: auto; width: 100vw; }
  .container { width: 100%; max-width: 500px; margin: 0 auto; padding: 15px; display: flex; flex-direction: column; min-height: 100vh; }
  .cyber-input { width: 100%; padding: 15px; background: rgba(0,0,0,0.8); border: 2px solid #ff00de; color: #ffdd00; font-family: 'Rajdhani'; font-size: 1.2rem; font-weight: bold; border-radius: 8px; text-align: center; margin-top: 10px; outline: none; }
  .btn-action { width: 100%; padding: 20px; background: linear-gradient(90deg, #ff00de, #00f3ff); color: white; font-family: 'Black Ops One'; font-size: 1.5rem; border: none; border-radius: 50px; cursor: pointer; text-transform: uppercase; box-shadow: 0 5px 30px rgba(255,0,222,0.4); margin: 10px 0; transition: 0.2s; }
  .btn-action:active { transform: scale(0.95); }
  .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }
  .glass-card { background: rgba(15, 10, 25, 0.9); border: 1px solid rgba(255, 0, 222, 0.4); border-radius: 16px; padding: 20px; margin-bottom: 20px; backdrop-filter: blur(10px); }
  .highlight { color: #ff00de; font-weight: 900; }
`;

function FloatingDebris() {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const count = 40;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 60, y: (Math.random() - 0.5) * 60, z: (Math.random() - 0.5) * 60,
    rotSpeed: Math.random() * 0.02, scale: 0.5 + Math.random()
  })), []);
  useFrame(() => {
    if (!mesh.current) return;
    particles.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z); dummy.rotation.x += p.rotSpeed; 
      dummy.scale.setScalar(p.scale); dummy.updateMatrix(); 
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={mesh} args={[undefined, undefined, count]}><icosahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#ff00de" wireframe /></instancedMesh>;
}

const TRASH_CELEBS = ["Tóth Gabi", "Alekosz", "Varga Irén", "Berki szelleme", "Győzike", "Orbán Viktor", "Pumped Gabo", "PSG Ogli", "Zámbó Jimmy", "Kiszel Tünde", "G.w.M", "Lakatos Brendon"];
const SITUATIONS = [
  "A Blahán {WHO} éppen ...-t csinál a szökőkútban.",
  "A Parlamentben {WHO} ...-al keni be magát meztelenül.",
  "A ravatalozóban {WHO} véletlenül elejtett egy ...-t a koporsóba.",
  "Az OnlyFans oldalán {WHO} éppen egy ...-t dugott a fülébe."
];
const QUESTIONS = [
  "Maszturbálás közben véletlenül ezt kiabáltad:", 
  "A proktológus benyúlt, ezt súgtad neki:", 
  "Ezt írnád a sírkövedre:",
  "Mit mondanál, ha Orbán Viktor meztelenül kopogna nálad?"
];

const generateTasks = () => {
  const rand = (a: any[]) => a[Math.floor(Math.random() * a.length)];
  return {
    t1: { text: rand(SITUATIONS).replace("{WHO}", `<span class="highlight">${rand(TRASH_CELEBS)}</span>`) },
    t2: { text: rand(QUESTIONS) }
  };
};

export default function App() {
  const [view, setView] = useState('MENU');
  const [roomId, setRoomId] = useState('');
  const [myName, setMyName] = useState('');
  const [state, setState] = useState<any>(null);
  const [answers, setAnswers] = useState<any>({ t1: "", t2: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId || view === 'MENU') return;
    const sync = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}?roomId=${roomId}`);
        const data = await res.json();
        if (data && !data.error) {
          setState(data);
          if (data.currentPhase !== view) setView(data.currentPhase);
        }
      } catch (e) { console.log("Kapcsolódás..."); }
    }, 2500);
    return () => clearInterval(sync);
  }, [roomId, view]);

  const postUpdate = async (payload: any) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}?roomId=${roomId || payload.roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setLoading(false);
      return data;
    } catch (e) {
      setLoading(false);
      alert("Szerver hiba! Ellenőrizd a KV Binding-ot.");
      return { error: true };
    }
  };

  const createRoom = async () => {
    if (!myName) return alert("Név!");
    const id = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomId(id);
    const res = await postUpdate({ 
      roomId: id,
      players: [{ name: myName, score: 0, answers: null, ready: false }], 
      currentPhase: 'LOBBY' 
    });
    if (!res.error) setView('LOBBY');
  };

  const joinRoom = async () => {
    if (!roomId || !myName) return alert("Kód és Név!");
    const check = await fetch(`${BACKEND_URL}?roomId=${roomId}`);
    const data = await check.json();
    if (data.error) return alert("Nincs ilyen szoba!");
    
    const res = await postUpdate({ 
      players: [...data.players, { name: myName, score: 0, answers: null, ready: false }] 
    });
    if (!res.error) setView('LOBBY');
  };

  const startRound = async () => {
    const updated = state.players.map((p: any) => ({ ...p, tasks: generateTasks(), answers: null, ready: false }));
    await postUpdate({ players: updated, currentPhase: 'PLAYING' });
  };

  const submitAnswers = async () => {
    const updated = state.players.map((p: any) => p.name === myName ? { ...p, answers: answers, ready: true } : p);
    const allReady = updated.every((p: any) => p.ready);
    await postUpdate({ players: updated, currentPhase: allReady ? 'RESULTS' : 'PLAYING' });
    setView('WAITING');
  };

  const myTasks = state?.players.find((p:any) => p.name === myName)?.tasks;

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="app-layer">
        <div style={{position:'absolute', inset:0, zIndex:-1}}><Canvas><Stars /><ambientLight intensity={0.5} /><Float><FloatingDebris /></Float></Canvas></div>
        
        {view === 'MENU' && (
          <div className="container" style={{justifyContent:'center'}}>
            <h1 style={{fontFamily:'Black Ops One', fontSize:'3.5rem', textAlign:'center', textShadow:'0 0 20px #ff00de'}}>TRASH UNIVERSE</h1>
            <div className="glass-card">
              <input className="cyber-input" placeholder="NEVED" value={myName} onChange={e=>setMyName(e.target.value)} />
              <button className="btn-action" onClick={createRoom} disabled={loading}>{loading ? "..." : "ÚJ SZOBA"}</button>
              <div style={{margin:'15px 0', textAlign:'center', color:'#444'}}>----------</div>
              <input className="cyber-input" placeholder="KÓD" value={roomId} onChange={e=>setRoomId(e.target.value)} />
              <button className="btn-action" style={{background:'#222'}} onClick={joinRoom} disabled={loading}>{loading ? "..." : "CSATLAKOZÁS"}</button>
            </div>
          </div>
        )}

        {view === 'LOBBY' && (
          <div className="container">
            <h1 style={{textAlign:'center'}}>SZOBA: {roomId}</h1>
            <div className="glass-card">
              <h3>Játékosok:</h3>
              {state?.players.map((p:any)=><div key={p.name} style={{padding:'8px', fontSize:'1.2rem'}}>• {p.name}</div>)}
            </div>
            {state?.players[0].name === myName && state?.players.length > 1 && (
              <button className="btn-action" onClick={startRound}>JÁTÉK INDÍTÁSA</button>
            )}
            <p style={{textAlign:'center', color:'#888'}}>Várj a Host indítására...</p>
          </div>
        )}

        {view === 'PLAYING' && myTasks && (
          <div className="container">
            <div className="glass-card">
              <div className="task-label">1. SZITUÁCIÓ</div>
              <div style={{fontSize:'1.3rem', marginBottom:'15px'}} dangerouslySetInnerHTML={{__html: myTasks.t1.text.replace("...", "_______")}} />
              <input className="cyber-input" placeholder="Válasz..." value={answers.t1} onChange={e=>setAnswers({...answers, t1:e.target.value})} />
            </div>
            <div className="glass-card">
              <div className="task-label">2. KÉRDÉS</div>
              <div style={{fontSize:'1.3rem', marginBottom:'15px'}}>{myTasks.t2.text}</div>
              <input className="cyber-input" placeholder="Válasz..." value={answers.t2} onChange={e=>setAnswers({...answers, t2:e.target.value})} />
            </div>
            <button className="btn-action" onClick={submitAnswers}>KÉSZ VAGYOK</button>
          </div>
        )}

        {view === 'WAITING' && <div className="container" style={{justifyContent:'center', alignItems:'center'}}><div style={{fontSize:'5rem', animation:'pulse 1.5s infinite'}}>⏳</div><h2>VÁRAKOZÁS...</h2></div>}

        {view === 'RESULTS' && (
          <div className="container">
            <h1 style={{textAlign:'center'}}>EREDMÉNYEK</h1>
            <div className="glass-card">
              {state?.players.map((p:any)=><div key={p.name} style={{fontSize:'1.2rem', padding:'10px', borderBottom:'1px solid #333'}}>{p.name}: {p.ready ? "KÉSZ" : "ÍR..."}</div>)}
            </div>
            <button className="btn-action" onClick={()=>window.location.reload()}>KILÉPÉS</button>
          </div>
        )}
      </div>
    </>
  );
}