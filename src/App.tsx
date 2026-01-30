import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import * as THREE from 'three';

// === SZERVER KONFIGURÁCIÓ ===
const BACKEND_URL = "https://trash-backend.balazsnorberttt.workers.dev";

// === 1. GLOBÁLIS STÍLUSOK (TELJES DIZÁJN) ===
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@500;700;900&display=swap');
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body { margin: 0; background: #000; overflow: hidden; font-family: 'Rajdhani', sans-serif; color: white; touch-action: manipulation; }
  .app-layer { position: absolute; inset: 0; display: flex; flex-direction: column; z-index: 10; overflow-y: auto; overflow-x: hidden; width: 100vw; }
  .container { width: 100%; max-width: 600px; margin: 0 auto; padding: 15px; display: flex; flex-direction: column; min-height: 100vh; }
  .cyber-input { width: 100%; padding: 15px; background: rgba(0,0,0,0.8); border: 2px solid #ff00de; color: #ffdd00; font-family: 'Rajdhani'; font-size: 1.2rem; font-weight: bold; border-radius: 8px; text-align: center; outline: none; margin: 10px 0; text-transform: uppercase; }
  .btn-action { width: 100%; padding: 20px; background: linear-gradient(90deg, #ff00de, #00f3ff); color: white; font-family: 'Black Ops One'; font-size: 1.5rem; border: none; border-radius: 50px; cursor: pointer; text-transform: uppercase; box-shadow: 0 5px 30px rgba(255,0,222,0.4); text-shadow: 2px 2px 0 black; margin: 10px 0; transition: 0.2s; }
  .btn-action:active { transform: scale(0.95); }
  .glass-card { background: rgba(15, 10, 25, 0.9); border: 1px solid rgba(255, 0, 222, 0.4); border-radius: 16px; padding: 20px; margin-bottom: 20px; backdrop-filter: blur(10px); box-shadow: 0 10px 40px rgba(0,0,0,0.8); }
  .task-label { color: #00f3ff; font-weight: 900; letter-spacing: 2px; margin-bottom: 12px; text-transform: uppercase; font-size: 0.9rem; border-bottom: 1px solid #444; padding-bottom: 5px; }
  .celeb-badge { background: #ff00de; color: white; padding: 8px 12px; border-radius: 6px; font-weight: 900; font-size: 0.9rem; box-shadow: 0 0 10px #ff00de; text-transform: uppercase; display: inline-block; margin: 5px 0; }
  .highlight { color: #ff00de; font-weight: 900; text-shadow: 0 0 10px #ff00de; }
  .player-pill { padding: 8px 15px; background: #111; border-radius: 20px; border: 1px solid #ff00de; font-weight: bold; margin: 5px; }
  .casting-grid { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
  .cast-btn { width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid #444; color: #ccc; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.2s; text-transform: uppercase; }
  .cast-btn.selected { background: #00f3ff; color: black; border-color: #00f3ff; box-shadow: 0 0 20px #00f3ff; }
  .rating-box { margin-top: 10px; background: rgba(0,0,0,0.6); padding: 15px; border-radius: 12px; border: 1px dashed #ff00de; }
  input[type=range] { width: 100%; cursor: pointer; accent-color: #ff00de; height: 30px; }
`;

// === 2. 3D VISUALS ===
function FloatingDebris() {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const count = 50;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => Array.from({ length: count }, () => ({
    pos: [(Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60],
    rotSpeed: Math.random() * 0.015,
    scale: 0.4 + Math.random()
  })), []);
  useFrame((state) => {
    if (!mesh.current) return;
    particles.forEach((p, i) => {
      dummy.position.set(p.pos[0], p.pos[1], p.pos[2]);
      dummy.rotation.x += p.rotSpeed; dummy.rotation.y += p.rotSpeed;
      dummy.scale.setScalar(p.scale); dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.rotation.y = state.clock.elapsedTime * 0.05;
  });
  return <instancedMesh ref={mesh} args={[undefined, undefined, count]}><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#ff00de" wireframe /></instancedMesh>;
}

// === 3. ÓRIÁS ADATBÁZIS (MINDEN TRASH TARTALOM VISSZAÁLLÍTVA) ===
const TRASH_CELEBS = ["Tóth Gabi", "Alekosz", "Varga Irén", "Berki szelleme", "Győzike", "Orbán Viktor", "Pumped Gabo", "PSG Ogli", "Zámbó Jimmy", "Kiszel Tünde", "G.w.M", "Szabyest", "Deutsch Tamás", "Varga Judit", "Lakatos Brendon", "Gyurcsány Ferenc", "Németh Szilárd", "Whisper Ton", "Bartos Cs. István", "Fekete Pákó"];
const SITUATIONS = [
  "A Blahán {WHO} éppen ...-t csinál a szökőkútban.",
  "A Parlamentben {WHO} ...-al keni be magát meztelenül az oltár előtt.",
  "A ravatalozóban {WHO} véletlenül elejtett egy ...-t a koporsóba.",
  "Az OnlyFans oldalán {WHO} éppen egy ...-t dugott a fülébe.",
  "A Híradóban bemondták, hogy {WHO} otthonában egy óriási ...-t találtak.",
  "A Sziget fesztiválon {WHO} a toi-toi vécéből ...-t dobált a tömegbe."
];
const QUESTIONS = [
  "Maszturbálás közben véletlenül ezt kiabáltad ki az ablakon:", 
  "A proktológus benyúlt, ezt súgtad oda neki halkan:", 
  "Ezt írnád a saját sírkövedre utolsó üzenetként:",
  "Mit mondanál, ha Orbán Viktor meztelenül kopogna nálad éjfélkor?",
  "Mit súgnál Putyin fülébe, ha te lennél a tolmácsa?"
];
const ROLES = ["Aki titokban lábképeket árul az interneten", "Aki titokban szerelmes Németh Szilárdba", "Akinek a böngészési előzményeiért börtön járna", "Aki biztosan sírva fakad szex közben", "Aki simán lefeküdne egy állattal pénzért"];
const LETTERS = ["A", "B", "D", "E", "F", "G", "H", "K", "L", "M", "N", "P", "R", "S", "T", "V", "Z"];

const generateTasks = () => {
  const rand = (a: any[]): any => a[Math.floor(Math.random() * a.length)];
  const getLetters = () => `${rand(LETTERS)} - ${rand(LETTERS)} - ${rand(LETTERS)}`;
  return {
    t1: { text: rand(SITUATIONS).replace("{WHO}", `<span class="highlight">${rand(TRASH_CELEBS)}</span>`), letters: getLetters() },
    t2: { text: rand(QUESTIONS), letters: getLetters() },
    t3: { celebs: [rand(TRASH_CELEBS), rand(TRASH_CELEBS), rand(TRASH_CELEBS)] },
    t4: { role: rand(ROLES), options: [rand(TRASH_CELEBS), rand(TRASH_CELEBS), rand(TRASH_CELEBS)] }
  };
};

// === 4. FŐ ALKALMAZÁS ===
export default function App() {
  const [view, setView] = useState('MENU');
  const [role, setRole] = useState<'HOST' | 'CLIENT' | null>(null);
  const [roomId, setRoomId] = useState('');
  const [myName, setMyName] = useState('');
  const [state, setState] = useState<any>(null);
  const [answers, setAnswers] = useState<any>({ t1: "", t2: "", t3_1: "", t3_2: "", t4: null });
  const [myVote, setMyVote] = useState(5);
  const [votingIndex, setVotingIndex] = useState(0);

  // SZINKRONIZÁCIÓ GYORSÍTVA (800ms)
  useEffect(() => {
    if (!roomId || view === 'MENU') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}?roomId=${roomId}`);
        const data = await res.json();
        if (data && !data.error) {
          setState(data);
          if (data.currentPhase !== view) setView(data.currentPhase);
          if (data.votingIndex !== undefined) setVotingIndex(data.votingIndex);
        }
      } catch (e) { console.error("Sync hiba"); }
    }, 800);
    return () => clearInterval(interval);
  }, [roomId, view]);

  const postUpdate = async (update: any) => {
    await fetch(`${BACKEND_URL}?roomId=${roomId || update.roomId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update)
    });
  };

  const createRoom = async () => {
    if (!myName) return alert("Név!");
    const id = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomId(id); setRole('HOST');
    await postUpdate({ roomId: id, players: [{ name: myName, score: 0, answers: null, tasks: null, ready: false }], currentPhase: 'LOBBY' });
    setView('LOBBY');
  };

  const joinRoom = async () => {
    if (!roomId || !myName) return alert("Kód és Név!");
    const res = await fetch(`${BACKEND_URL}?roomId=${roomId}`);
    const data = await res.json();
    if (data.error) return alert("Nincs ilyen szoba!");
    setRole('CLIENT');
    await postUpdate({ players: [...data.players, { name: myName, score: 0, answers: null, tasks: null, ready: false }] });
    setView('LOBBY');
  };

  const startRound = async () => {
    const updated = state.players.map((p: any) => ({ ...p, tasks: generateTasks(), answers: null, ready: false }));
    await postUpdate({ players: updated, currentPhase: 'PLAYING', votingIndex: 0 });
  };

  const submitAnswers = async () => {
    const updated = state.players.map((p: any) => p.name === myName ? { ...p, answers, ready: true } : p);
    const allReady = updated.every((p: any) => p.ready);
    await postUpdate({ players: updated, currentPhase: allReady ? 'VOTING' : 'PLAYING' });
    setView('WAITING');
  };

  const submitVote = async () => {
    const target = state.players[votingIndex];
    const updated = state.players.map((p: any) => {
      let mod = { ...p };
      if (p.name === target.name) mod.score += myVote;
      if (p.name === myName) mod.ready = true;
      return mod;
    });
    const allVoted = updated.every((p: any) => p.ready);
    if (allVoted) {
      const nextIdx = votingIndex + 1;
      const isOver = nextIdx >= state.players.length;
      await postUpdate({ players: updated.map(p => ({ ...p, ready: false })), currentPhase: isOver ? 'LEADERBOARD' : 'VOTING', votingIndex: isOver ? 0 : nextIdx });
    } else {
      await postUpdate({ players: updated });
      setView('WAITING_VOTE');
    }
  };

  const myPlayer = state?.players.find((p: any) => p.name === myName);
  const targetPlayer = state?.players[votingIndex];

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="app-layer">
        <div style={{position:'absolute', inset:0, zIndex:-1}}><Canvas><Stars count={5000} factor={4} /><ambientLight intensity={0.5} /><pointLight position={[10,10,10]} color="#00f3ff" intensity={2} /><Float><FloatingDebris /></Float></Canvas></div>

        {view === 'MENU' && <div className="container" style={{justifyContent:'center'}}><h1 style={{fontFamily:'Black Ops One', fontSize:'3.5rem', textAlign:'center', textShadow:'0 0 20px #ff00de'}}>TRASH UNIVERSE</h1><div className="glass-card"><input className="cyber-input" placeholder="NEVED" value={myName} onChange={e=>setMyName(e.target.value)} /><button className="btn-action" onClick={createRoom}>ÚJ JÁTÉK</button><input className="cyber-input" placeholder="KÓD" value={roomId} onChange={e=>setRoomId(e.target.value)} /><button className="btn-action" style={{background:'#222'}} onClick={joinRoom}>CSATLAKOZÁS</button></div></div>}
        
        {view === 'LOBBY' && <div className="container"><h1 style={{fontSize:'3rem', textAlign:'center'}}>SZOBA: {roomId}</h1><div className="glass-card"><div style={{display:'flex', flexWrap:'wrap', justifyContent:'center'}}>{state?.players.map((p: any) => <div key={p.name} className="player-pill">{p.name}</div>)}</div></div>{role === 'HOST' && <button className="btn-action" onClick={startRound}>MENET INDÍTÁSA</button>}<p style={{textAlign:'center', color:'#888'}}>Várj a Host indítására...</p></div>}
        
        {view === 'PLAYING' && myPlayer?.tasks && <div className="container">
          <div className="glass-card"><div className="task-label">1. SZITUÁCIÓ ({myPlayer.tasks.t1.letters})</div><div style={{fontSize:'1.2rem'}} dangerouslySetInnerHTML={{__html: myPlayer.tasks.t1.text.replace("...", "_______")}} /><input className="cyber-input" value={answers.t1} onChange={e=>setAnswers({...answers, t1: e.target.value})} /></div>
          <div className="glass-card"><div className="task-label">2. KÍN-PAD ({myPlayer.tasks.t2.letters})</div><div style={{fontSize:'1.2rem'}}>{myPlayer.tasks.t2.text}</div><input className="cyber-input" value={answers.t2} onChange={e=>setAnswers({...answers, t2: e.target.value})} /></div>
          <div className="glass-card"><div className="task-label">3. SZTORILÁNC</div><div className="celeb-badge">{myPlayer.tasks.t3.celebs[0]}</div><input className="cyber-input" placeholder="Mit tett vele?" value={answers.t3_1} onChange={e=>setAnswers({...answers, t3_1: e.target.value})} /><div className="celeb-badge" style={{background:'#00f3ff', color:'black'}}>{myPlayer.tasks.t3.celebs[1]}</div><input className="cyber-input" placeholder="És mi lett?" value={answers.t3_2} onChange={e=>setAnswers({...answers, t3_2: e.target.value})} /><div className="celeb-badge" style={{background:'#ffdd00', color:'black'}}>{myPlayer.tasks.t3.celebs[2]}</div></div>
          <div className="glass-card"><div className="task-label">4. CASTING: {myPlayer.tasks.t4.role}</div><div className="casting-grid">{myPlayer.tasks.t4.options.map((opt: string, i: number) => <button key={i} className={`cast-btn ${answers.t4 === i ? 'selected' : ''}`} onClick={()=>setAnswers({...answers, t4: i})}>{opt}</button>)}</div></div>
          <button className="btn-action" onClick={submitAnswers}>KÉSZ VAGYOK!</button>
        </div>}

        {view === 'VOTING' && targetPlayer && <div className="container"><h1 style={{textAlign:'center', color:'#ff00de'}}>{targetPlayer.name} VÁLASZAI</h1><div className="glass-card"><div className="task-label">SZITUÁCIÓ:</div><div style={{color:'#ffdd00', fontSize:'1.3rem'}}>{targetPlayer.answers?.t1 || "Nem válaszolt"}</div></div><div className="glass-card"><div className="task-label">VALLOMÁS:</div><div style={{color:'#ffdd00', fontSize:'1.3rem'}}>{targetPlayer.answers?.t2 || "Nem válaszolt"}</div></div>{targetPlayer.name !== myName ? <div className="rating-box"><div style={{textAlign:'center', fontWeight:'bold', color:'#00f3ff'}}>PONT: {myVote}</div><input type="range" min="1" max="10" value={myVote} onChange={e=>setMyVote(parseInt(e.target.value))} /><button className="btn-action" style={{marginTop:'15px'}} onClick={submitVote}>SZAVAZOK</button></div> : <h2 style={{textAlign:'center'}}>Pontoznak...</h2>}</div>}
        
        {view === 'LEADERBOARD' && <div className="container"><h1 style={{textAlign:'center', fontSize:'3.5rem'}}>RANGSOR</h1>{state?.players.sort((a:any,b:any)=>b.score - a.score).map((p:any, i:number) => <div key={p.name} className="glass-card" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}><div>#{i+1} {p.name}</div><div style={{fontSize:'2rem', color:'#00f3ff'}}>{p.score}</div></div>)}<button className="btn-action" onClick={()=>window.location.reload()}>ÚJ JÁTÉK</button></div>}
        
        {(view === 'WAITING' || view === 'WAITING_VOTE') && <div className="container" style={{justifyContent:'center'}}><div style={{fontSize:'5rem', animation:'pulse 1.5s infinite', textAlign:'center'}}>⏳</div><h2 style={{textAlign:'center'}}>SZINKRONIZÁLÁS...</h2></div>}
      </div>
    </>
  );
}