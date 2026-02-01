// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, MeshDistortMaterial, Sparkles, OrbitControls, PerspectiveCamera } from '@react-three/drei';

// KONFIG
const BACKEND_URL = "https://trash-backend.balazsnorberttt.workers.dev"; 
const POLL_INTERVAL = 1000;

// === ADVANCED 3D & HOLOGRAPHIC STYLES ===
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;500;700&display=swap');
  
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body { 
    margin: 0; 
    background: #000; 
    color: white; 
    font-family: 'Rajdhani', sans-serif; 
    overflow: hidden;
  }

  .app-layer { 
    position: absolute; 
    inset: 0; 
    overflow-y: auto; 
    padding: 20px; 
    z-index: 10; 
    perspective: 1200px;
    backdrop-filter: blur(2px);
  }
  
  .container { 
    width: 100%; 
    max-width: 600px; 
    margin: 0 auto; 
    padding-bottom: 120px; 
  }

  /* HOLOGRAPHIC TITLE */
  .title-3d {
    font-family: 'Orbitron', sans-serif;
    font-size: 4rem; 
    font-weight: 900;
    text-align: center; 
    margin: 40px 0 30px 0; 
    background: linear-gradient(45deg, #00f3ff, #ff00de, #ffdd00, #00f3ff);
    background-size: 300% 300%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 8px;
    text-transform: uppercase;
    filter: drop-shadow(0 0 30px rgba(0, 243, 255, 0.8)) 
            drop-shadow(0 0 60px rgba(255, 0, 222, 0.6));
    animation: hologram 8s ease infinite, textGlow 2s ease-in-out infinite;
    transform: rotateX(5deg) translateZ(50px);
    position: relative;
  }

  .title-3d::before {
    content: attr(data-text);
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, #00f3ff, #ff00de);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    opacity: 0.3;
    filter: blur(4px);
    animation: glitch 3s infinite;
  }

  @keyframes hologram {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  @keyframes textGlow {
    0%, 100% { filter: drop-shadow(0 0 30px rgba(0, 243, 255, 0.8)) drop-shadow(0 0 60px rgba(255, 0, 222, 0.6)); }
    50% { filter: drop-shadow(0 0 50px rgba(0, 243, 255, 1)) drop-shadow(0 0 80px rgba(255, 0, 222, 0.8)); }
  }

  @keyframes glitch {
    0%, 90%, 100% { transform: translate(0, 0); opacity: 0.3; }
    92% { transform: translate(-2px, 2px); opacity: 0.5; }
    94% { transform: translate(2px, -2px); opacity: 0.4; }
    96% { transform: translate(-2px, -2px); opacity: 0.5; }
  }

  /* FUTURISTIC GLASS CARD */
  .card-3d {
    position: relative;
    background: linear-gradient(135deg, rgba(0, 243, 255, 0.05), rgba(255, 0, 222, 0.05));
    backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(0, 243, 255, 0.3);
    border-radius: 20px;
    padding: 25px;
    margin-bottom: 25px;
    box-shadow: 
      0 8px 32px rgba(0, 243, 255, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset 0 -1px 0 rgba(0, 0, 0, 0.2);
    transform-style: preserve-3d;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    animation: cardFloat 0.8s ease-out;
    overflow: hidden;
  }

  .card-3d::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s;
  }

  .card-3d:hover {
    transform: translateY(-8px) rotateX(2deg) scale(1.02);
    border-color: rgba(0, 243, 255, 0.6);
    box-shadow: 
      0 16px 48px rgba(0, 243, 255, 0.3),
      0 0 80px rgba(255, 0, 222, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  .card-3d:hover::before {
    left: 100%;
  }

  @keyframes cardFloat {
    from { 
      opacity: 0; 
      transform: translateY(60px) rotateX(15deg) scale(0.95); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0) rotateX(0) scale(1); 
    }
  }

  /* NEON LABELS */
  .label { 
    color: #00f3ff; 
    font-family: 'Orbitron', sans-serif;
    font-weight: 700; 
    font-size: 0.9rem; 
    margin-bottom: 12px; 
    text-transform: uppercase; 
    letter-spacing: 3px; 
    text-shadow: 
      0 0 10px rgba(0, 243, 255, 0.8),
      0 0 20px rgba(0, 243, 255, 0.4);
    position: relative;
    padding-left: 15px;
  }

  .label::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 8px;
    height: 8px;
    background: #00f3ff;
    box-shadow: 0 0 10px #00f3ff;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 10px #00f3ff; }
    50% { opacity: 0.5; box-shadow: 0 0 20px #00f3ff; }
  }
  
  /* HOLOGRAPHIC INPUT */
  .input-field {
    width: 100%; 
    background: rgba(0, 20, 40, 0.6);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(0, 243, 255, 0.3);
    color: #fff;
    padding: 16px 20px; 
    font-size: 1.1rem; 
    font-family: 'Rajdhani', sans-serif;
    font-weight: 600; 
    border-radius: 12px; 
    margin-bottom: 15px;
    outline: none; 
    transition: all 0.3s ease;
    box-shadow: 
      0 4px 15px rgba(0, 0, 0, 0.3),
      inset 0 2px 0 rgba(255, 255, 255, 0.05);
  }

  .input-field:focus { 
    border-color: #00f3ff;
    background: rgba(0, 243, 255, 0.1);
    box-shadow: 
      0 0 25px rgba(0, 243, 255, 0.4),
      inset 0 0 15px rgba(0, 243, 255, 0.1);
    transform: translateY(-2px);
  }

  .input-field::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  /* CYBERPUNK BUTTON */
  .btn-3d {
    width: 100%; 
    padding: 18px; 
    font-family: 'Orbitron', sans-serif; 
    font-size: 1.2rem;
    font-weight: 700;
    text-transform: uppercase; 
    letter-spacing: 2px;
    border: none; 
    border-radius: 12px;
    background: linear-gradient(135deg, #00f3ff, #0088cc);
    color: black; 
    cursor: pointer; 
    margin-top: 10px;
    position: relative;
    overflow: hidden;
    box-shadow: 
      0 8px 0 #006699,
      0 12px 25px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateY(0);
  }

  .btn-3d::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s;
  }

  .btn-3d:hover:not(:disabled) {
    transform: translateY(-4px);
    box-shadow: 
      0 12px 0 #006699,
      0 16px 35px rgba(0, 243, 255, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }

  .btn-3d:hover:not(:disabled)::before {
    left: 100%;
  }

  .btn-3d:active:not(:disabled) { 
    transform: translateY(8px); 
    box-shadow: 
      0 0 0 #006699,
      0 4px 15px rgba(0, 0, 0, 0.4);
  }

  .btn-3d:disabled { 
    background: rgba(100, 100, 100, 0.3); 
    box-shadow: none; 
    color: rgba(255, 255, 255, 0.3); 
    transform: translateY(8px);
    cursor: not-allowed;
  }

  /* FLOATING CHAT */
  .chat-fab {
    position: fixed; 
    bottom: 30px; 
    right: 30px; 
    width: 70px; 
    height: 70px;
    background: linear-gradient(135deg, #ff00de, #cc0099);
    border-radius: 50%; 
    display: flex; 
    align-items: center; 
    justify-content: center;
    box-shadow: 
      0 8px 32px rgba(255, 0, 222, 0.6),
      inset 0 2px 0 rgba(255, 255, 255, 0.3);
    z-index: 1000; 
    cursor: pointer; 
    font-size: 32px; 
    border: 3px solid rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
    animation: float 3s ease-in-out infinite;
  }

  .chat-fab:hover {
    transform: scale(1.1) translateY(-5px);
    box-shadow: 
      0 12px 48px rgba(255, 0, 222, 0.8),
      inset 0 2px 0 rgba(255, 255, 255, 0.4);
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  .chat-window {
    position: fixed; 
    bottom: 120px; 
    right: 30px; 
    width: 340px; 
    height: 400px;
    background: rgba(10, 10, 30, 0.95);
    backdrop-filter: blur(20px);
    border: 2px solid rgba(255, 0, 222, 0.5);
    border-radius: 20px;
    display: flex; 
    flex-direction: column; 
    z-index: 999;
    box-shadow: 
      0 16px 48px rgba(0, 0, 0, 0.8),
      0 0 60px rgba(255, 0, 222, 0.3);
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from { 
      opacity: 0; 
      transform: translateY(20px) scale(0.9); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0) scale(1); 
    }
  }

  /* PLAYER BADGE */
  .player-badge {
    padding: 12px 20px;
    border-radius: 25px;
    font-weight: 700;
    font-family: 'Orbitron', sans-serif;
    font-size: 0.95rem;
    backdrop-filter: blur(10px);
    border: 2px solid;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .player-badge::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.6s;
  }

  .player-badge:hover::before {
    left: 100%;
  }

  /* RANGE SLIDER */
  input[type="range"] {
    width: 100%;
    height: 8px;
    border-radius: 5px;
    background: linear-gradient(90deg, #ff00de, #ffdd00, #00f3ff);
    outline: none;
    margin: 15px 0;
    -webkit-appearance: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
    border: 3px solid #00f3ff;
  }

  input[type="range"]::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
    border: 3px solid #00f3ff;
  }

  /* GRID SCAN EFFECT */
  .scan-line {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00f3ff, transparent);
    animation: scan 4s linear infinite;
    z-index: 1;
    pointer-events: none;
    opacity: 0.3;
  }

  @keyframes scan {
    0% { top: 0%; }
    100% { top: 100%; }
  }
`;

const api = {
  post: async (url, body) => {
    try {
      const r = await fetch(`${BACKEND_URL}${url}`, { 
        method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) 
      });
      return await r.json();
    } catch(e) { console.error(e); return {error: "Hálózati hiba"}; }
  },
  get: async (url) => {
    try {
      const r = await fetch(`${BACKEND_URL}${url}`);
      return await r.json();
    } catch(e) { console.error(e); return {error: "Hálózati hiba"}; }
  }
};

// --- ENHANCED 3D BACKGROUND ---
function RotatingTorus() {
  const meshRef = useRef();
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });
  
  return (
    <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} position={[0, 0, -10]}>
        <torusGeometry args={[8, 2, 16, 100]} />
        <MeshDistortMaterial 
          color="#1a0033" 
          wireframe 
          distort={0.4} 
          speed={2}
          opacity={0.5}
          transparent
        />
      </mesh>
    </Float>
  );
}

function FloatingOrbs() {
  return (
    <>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={3}>
        <mesh position={[-8, 4, -5]}>
          <sphereGeometry args={[1, 32, 32]} />
          <MeshDistortMaterial color="#00f3ff" distort={0.3} speed={3} emissive="#00f3ff" emissiveIntensity={0.5} />
        </mesh>
      </Float>
      <Float speed={1.8} rotationIntensity={0.5} floatIntensity={2}>
        <mesh position={[8, -3, -8]}>
          <sphereGeometry args={[1.5, 32, 32]} />
          <MeshDistortMaterial color="#ff00de" distort={0.4} speed={2.5} emissive="#ff00de" emissiveIntensity={0.5} />
        </mesh>
      </Float>
      <Float speed={2.2} rotationIntensity={0.5} floatIntensity={2.5}>
        <mesh position={[0, -6, -6]}>
          <sphereGeometry args={[1.2, 32, 32]} />
          <MeshDistortMaterial color="#ffdd00" distort={0.35} speed={2.8} emissive="#ffdd00" emissiveIntensity={0.5} />
        </mesh>
      </Float>
    </>
  );
}

function CyberBg() {
  return (
    <div style={{position:'fixed', inset:0, zIndex:0}}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 15]} />
        <color attach="background" args={['#000510']} />
        <fog attach="fog" args={['#000510', 10, 50]} />
        
        <Stars count={3000} factor={4} fade speed={1} />
        <Sparkles count={500} scale={15} size={6} speed={0.4} opacity={0.4} color="#00f3ff" />
        <Sparkles count={300} scale={20} size={4} speed={0.3} opacity={0.3} color="#ff00de" />
        
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} color="#00f3ff" intensity={2} />
        <pointLight position={[-10, -10, -10]} color="#ff00de" intensity={2} />
        <spotLight position={[0, 15, 0]} angle={0.3} penumbra={1} intensity={1} color="#ffdd00" />
        
        <RotatingTorus />
        <FloatingOrbs />
      </Canvas>
      <div className="scan-line" />
    </div>
  );
}

// --- CHAT ---
function FloatingChat({ roomId, name, chats }) {
  const [isOpen, setIsOpen] = useState(false);
  const [txt, setTxt] = useState("");
  const endRef = useRef(null);

  useEffect(() => { if(isOpen) endRef.current?.scrollIntoView({behavior:'smooth'}); }, [chats, isOpen]);
  const send = async () => { if(!txt.trim())return; await api.post('/send-message',{roomId, playerName:name, message:txt}); setTxt(""); };

  if (!roomId) return null;
  return (
    <>
      <div className="chat-fab" onClick={() => setIsOpen(!isOpen)}>{isOpen?'✕':'💬'}</div>
      {isOpen && (
        <div className="chat-window">
          <div style={{background:'linear-gradient(135deg, #ff00de, #cc0099)', padding:15, fontFamily:'Orbitron', fontWeight:'bold', textAlign:'center', color:'white', borderRadius:'18px 18px 0 0'}}>
            TRASH TALK
          </div>
          <div style={{flex:1, overflowY:'auto', padding:15}}>
            {chats?.map((c,i)=>(
              <div key={i} style={{marginBottom:10, padding:8, borderRadius:8, background:'rgba(255,255,255,0.05)', borderLeft:'3px solid #ff00de'}}>
                <span style={{color:'#00f3ff',fontWeight:'bold', fontFamily:'Orbitron', fontSize:'0.85rem'}}>{c.name}:</span> 
                <span style={{color:'white', marginLeft:8}}>{c.text}</span>
              </div>
            ))}
            <div ref={endRef}/>
          </div>
          <div style={{display:'flex', padding:10, gap:8}}>
            <input className="input-field" style={{marginBottom:0, padding:10, flex:1}} value={txt} onChange={e=>setTxt(e.target.value)} placeholder="Írj üzenetet..." onKeyPress={e => e.key === 'Enter' && send()} />
            <button className="btn-3d" style={{width:60, marginTop:0, padding:0}} onClick={send}>→</button>
          </div>
        </div>
      )}
    </>
  );
}

// --- MAIN APP ---
export default function App() {
  const [screen, setScreen] = useState('MENU');
  const [roomId, setRoomId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [name, setName] = useState('');
  const [data, setData] = useState(null);
  const [load, setLoad] = useState(false);
  const [err, setErr] = useState(null);

  const [ans, setAns] = useState({ t1:"", t2:"", story_1:"", story_2:"", story_3:"", t4:"" });
  const [votes, setVotes] = useState({ t1: 5, t2: 5, t3: 5, t4: 5 });

  useEffect(() => {
    if(!roomId || !name) return;
    const interval = setInterval(async () => {
      const d = await api.get(`/get-room?roomId=${roomId}&playerName=${encodeURIComponent(name)}`);
      if(d.success) {
        setData(d.roomData);
        const ph = d.roomData.currentPhase;
        if(ph === 'LOBBY' && screen !== 'LOBBY') setScreen('LOBBY');
        if(ph === 'PLAYING' && screen !== 'PLAYING' && screen !== 'WAIT') {
          setScreen('PLAYING'); setAns({t1:"", t2:"", story_1:"", story_2:"", story_3:"", t4:""});
        }
        if(ph === 'VOTING' && screen !== 'VOTING' && screen !== 'WAIT_VOTE') {
          setScreen('VOTING'); setVotes({t1:5, t2:5, t3:5, t4:5});
        }
        if(ph === 'LEADERBOARD' && screen !== 'LEADERBOARD') setScreen('LEADERBOARD');
      }
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [roomId, name, screen]);

  const act = async (url, body) => {
    setLoad(true); setErr(null);
    const d = await api.post(url, {roomId, playerName:name, ...body});
    setLoad(false);
    if(!d.success) setErr(d.error);
    return d;
  };

  const me = data?.players?.find(p => p.name === name);
  const target = data?.votingPlayers?.[data?.votingIndex];
  
  const buildStory = (taskData, userAnswers) => {
    if (!taskData || !taskData.template) return "Hiba: Nincs sztori adat.";
    let text = taskData.template;
    text = text.replace("{C1}", `<span style='color:#ff00de;font-weight:bold'>${taskData.celebs[0]}</span>`);
    text = text.replace("{C2}", `<span style='color:#ff00de;font-weight:bold'>${taskData.celebs[1]}</span>`);
    text = text.replace("{C3}", `<span style='color:#ff00de;font-weight:bold'>${taskData.celebs[2]}</span>`);
    
    const a1 = userAnswers?.story_1 || "___";
    const a2 = userAnswers?.story_2 || "___";
    const a3 = userAnswers?.story_3 || "___";
    
    text = text.replace("{A1}", `<span style='color:#00f3ff;font-weight:bold;text-decoration:underline'>${a1}</span>`);
    text = text.replace("{A2}", `<span style='color:#00f3ff;font-weight:bold;text-decoration:underline'>${a2}</span>`);
    text = text.replace("{A3}", `<span style='color:#00f3ff;font-weight:bold;text-decoration:underline'>${a3}</span>`);
    return text;
  };

  return (
    <>
      <style>{STYLES}</style>
      <CyberBg />
      <div className="app-layer">
        <div className="container">
          
          {/* HEADER */}
          {roomId && (
            <div style={{
              textAlign:'center', 
              marginBottom:20, 
              background:'rgba(0, 243, 255, 0.1)', 
              backdropFilter:'blur(10px)',
              padding:12, 
              borderRadius:15,
              border:'1px solid rgba(0, 243, 255, 0.3)',
              fontFamily:'Orbitron',
              fontSize:'0.9rem',
              letterSpacing:'2px'
            }}>
              <span style={{color:'#888'}}>ROOM:</span> <span style={{color:'#00f3ff', fontWeight:'bold'}}>{roomId}</span> 
              <span style={{margin:'0 10px', color:'#444'}}>|</span> 
              <span style={{color:'#ff00de', fontWeight:'bold'}}>{name}</span>
            </div>
          )}
          
          {err && (
            <div style={{
              background:'rgba(255, 0, 0, 0.2)', 
              border:'2px solid #ff0000',
              backdropFilter:'blur(10px)',
              padding:15, 
              borderRadius:10, 
              marginBottom:15, 
              fontWeight:'bold',
              color:'#ff6666',
              textAlign:'center',
              animation:'shake 0.5s'
            }}>
              ⚠️ {err}
            </div>
          )}

          {/* MENU */}
          {screen === 'MENU' && (
            <div style={{marginTop:'10vh', textAlign:'center'}}>
              <h1 className="title-3d" data-text="TRASH UNIVERSE">TRASH<br/>UNIVERSE</h1>
              <div className="card-3d">
                <div className="label">JÁTÉKOS NEVE</div>
                <input 
                  className="input-field" 
                  value={name} 
                  onChange={e=>setName(e.target.value)} 
                  placeholder="Add meg a neved..."
                  onKeyPress={e => e.key === 'Enter' && name && act('/create-room',{})}
                />
                <button className="btn-3d" onClick={async ()=>{
                  if(!name)return; const d=await act('/create-room',{}); 
                  if(d.success){setRoomId(d.roomId);setData(d.roomData);setScreen('LOBBY');}
                }} disabled={load}>
                  {load ? '⏳ LOADING...' : '🚀 ÚJ JÁTÉK'}
                </button>
                
                <div style={{height:2, background:'linear-gradient(90deg, transparent, #00f3ff, transparent)', margin:'30px 0', opacity:0.3}}></div>
                
                <div className="label">CSATLAKOZÁS KÓDDAL</div>
                <input 
                  className="input-field" 
                  value={joinCode} 
                  onChange={e=>setJoinCode(e.target.value)} 
                  type="number" 
                  placeholder="Írd be a szoba kódját..."
                  onKeyPress={e => e.key === 'Enter' && name && joinCode && act('/join-room',{roomId:joinCode, playerName:name})}
                />
                <button className="btn-3d" style={{background:'linear-gradient(135deg, #ff00de, #cc0099)'}} onClick={async ()=>{
                   if(!name||!joinCode)return; 
                   const d=await api.post('/join-room',{roomId:joinCode, playerName:name});
                   if(d.success){setRoomId(joinCode);setData(d.roomData);setScreen('LOBBY');}else setErr(d.error);
                }} disabled={load}>
                  {load ? '⏳ CSATLAKOZÁS...' : '🎮 BELÉPÉS'}
                </button>
              </div>
            </div>
          )}

          {/* LOBBY */}
          {screen === 'LOBBY' && data && (
            <div className="card-3d" style={{textAlign:'center'}}>
              <h2 className="title-3d" style={{fontSize:'2.5rem', margin:'20px 0'}} data-text="LOBBY">LOBBY</h2>
              <div style={{display:'flex', flexWrap:'wrap', gap:12, justifyContent:'center', marginBottom:30}}>
                {data.players.map(p => (
                  <div 
                    key={p.name} 
                    className="player-badge"
                    style={{
                      background: p.name===name ? 'linear-gradient(135deg, #ff00de, #cc0099)' : 'rgba(255, 255, 255, 0.1)',
                      borderColor: p.name===name ? '#ff00de' : 'rgba(255, 255, 255, 0.2)',
                      color: p.name===name ? 'white' : '#ccc',
                      boxShadow: p.name===name ? '0 0 20px rgba(255, 0, 222, 0.5)' : 'none'
                    }}
                  >
                    {p.isHost?'👑 ':''}{p.name}
                  </div>
                ))}
              </div>
              {me?.isHost ? (
                <button 
                  className="btn-3d" 
                  onClick={()=>act('/start-round',{})} 
                  disabled={data.players.length<2}
                >
                  {data.players.length<2 ? '⏳ VÁRUNK MÉG JÁTÉKOSOKAT...' : '🚀 JÁTÉK INDÍTÁSA'}
                </button>
              ) : (
                <div style={{
                  color:'#00f3ff', 
                  fontFamily:'Orbitron',
                  fontSize:'1.2rem',
                  animation:'pulse 2s infinite',
                  padding:'20px'
                }}>
                  ⏳ Várakozás a host indítására...
                </div>
              )}
            </div>
          )}

          {/* PLAYING */}
          {screen === 'PLAYING' && me?.tasks && (
            <>
              <div className="title-3d" style={{fontSize:'2.5rem'}} data-text={`KÖR ${data.currentRound}`}>
                KÖR {data.currentRound}
              </div>

              <div className="card-3d">
                <div className="label">🎯 1. SZITUÁCIÓ ({me.tasks.t1.letters})</div>
                <p style={{fontSize:'1.15rem', lineHeight:1.6, color:'#ccc'}}>{me.tasks.t1.text}</p>
                <input className="input-field" value={ans.t1} onChange={e=>setAns({...ans,t1:e.target.value})} placeholder="Írd be a válaszod..." />
              </div>

              <div className="card-3d">
                <div className="label">⚡ 2. KÍN-PAD ({me.tasks.t2.letters})</div>
                <p style={{fontSize:'1.15rem', lineHeight:1.6, color:'#ccc'}}>{me.tasks.t2.text}</p>
                <input className="input-field" value={ans.t2} onChange={e=>setAns({...ans,t2:e.target.value})} placeholder="Írd be a válaszod..." />
              </div>

              <div className="card-3d">
                <div className="label">📖 3. SZTORI KIEGÉSZÍTÉS</div>
                <p style={{fontSize:'0.95rem', color:'#888', marginBottom:20}}>Egészítsd ki a hiányzó részeket! A celebeket mi adjuk.</p>
                
                <div style={{marginBottom:8, color:'#ff00de', fontSize:'0.9rem', fontWeight:'600'}}>{me.tasks.t3.prompts[0]}</div>
                <input className="input-field" value={ans.story_1} onChange={e=>setAns({...ans,story_1:e.target.value})} />
                
                <div style={{marginBottom:8, color:'#ff00de', fontSize:'0.9rem', fontWeight:'600'}}>{me.tasks.t3.prompts[1]}</div>
                <input className="input-field" value={ans.story_2} onChange={e=>setAns({...ans,story_2:e.target.value})} />
                
                <div style={{marginBottom:8, color:'#ff00de', fontSize:'0.9rem', fontWeight:'600'}}>{me.tasks.t3.prompts[2]}</div>
                <input className="input-field" value={ans.story_3} onChange={e=>setAns({...ans,story_3:e.target.value})} />
              </div>

              <div className="card-3d">
                <div className="label">🔤 4. SZÓTÁR</div>
                <p style={{color:'#ccc', marginBottom:15}}>{me.tasks.t4.prompt}</p>
                <h1 style={{
                  textAlign:'center', 
                  fontFamily:'Orbitron',
                  fontSize:'3rem',
                  color:'#00f3ff', 
                  letterSpacing:8,
                  textShadow:'0 0 20px rgba(0, 243, 255, 0.8)',
                  marginBottom:20
                }}>
                  {me.tasks.t4.letters}
                </h1>
                <input className="input-field" value={ans.t4} onChange={e=>setAns({...ans,t4:e.target.value})} placeholder="Mi lehet ez a szó?" />
              </div>

              <button className="btn-3d" onClick={async ()=>{
                const d=await act('/submit-answers',{answers:ans}); 
                if(d.success)setScreen('WAIT');
              }}>
                ✅ KÉSZ VAGYOK!
              </button>
            </>
          )}

          {/* WAITING */}
          {(screen === 'WAIT' || screen === 'WAIT_VOTE') && (
             <div style={{textAlign:'center', marginTop:'25vh'}}>
                <h1 style={{fontSize:'5rem', animation:'pulse 1.5s infinite'}}>⏳</h1>
                <h2 className="title-3d" style={{fontSize:'2.5rem'}} data-text="VÁRAKOZÁS">VÁRAKOZÁS...</h2>
                <p style={{color:'#888', fontSize:'1.1rem', marginTop:20}}>Várunk a többi játékosra</p>
                {me?.isHost && (
                  <button 
                    className="btn-3d" 
                    style={{
                      background:'linear-gradient(135deg, #ff0000, #cc0000)', 
                      width:'auto', 
                      padding:'12px 40px',
                      marginTop:30
                    }} 
                    onClick={()=>act('/force-next',{})}
                  >
                    ⚡ FORCE NEXT
                  </button>
                )}
             </div>
          )}

          {/* VOTING */}
          {screen === 'VOTING' && target && (
            <>
              <div style={{textAlign:'center', marginBottom:25}}>
                <div style={{color:'#888', fontFamily:'Orbitron', letterSpacing:'2px', marginBottom:10}}>
                  ÉRTÉKELÉS ({data.votingIndex+1}/{data.votingPlayers.length})
                </div>
                <h1 className="title-3d" style={{
                  fontSize:'3rem', 
                  background:'linear-gradient(45deg, #ff00de, #ffdd00)',
                  WebkitBackgroundClip:'text',
                  WebkitTextFillColor:'transparent',
                  filter:'drop-shadow(0 0 30px rgba(255, 0, 222, 0.6))'
                }} data-text={target.name}>
                  {target.name}
                </h1>
              </div>

              <div className="card-3d">
                <div className="label">🎯 1. SZITUÁCIÓ</div>
                <div style={{fontSize:'1.3rem', color:'#fff', padding:'10px 0', fontWeight:'500'}}>{target.answers?.t1 || "..."}</div>
                {target.name!==name && (
                  <>
                    <input type="range" min="1" max="10" value={votes.t1} onChange={e=>setVotes({...votes,t1:parseInt(e.target.value)})} />
                    <div style={{textAlign:'center', fontFamily:'Orbitron', fontSize:'1.5rem', color:'#00f3ff', fontWeight:'bold'}}>
                      {votes.t1}/10
                    </div>
                  </>
                )}
              </div>

              <div className="card-3d">
                <div className="label">⚡ 2. KÍN-PAD</div>
                <div style={{fontSize:'1.3rem', color:'#fff', padding:'10px 0', fontWeight:'500'}}>{target.answers?.t2 || "..."}</div>
                {target.name!==name && (
                  <>
                    <input type="range" min="1" max="10" value={votes.t2} onChange={e=>setVotes({...votes,t2:parseInt(e.target.value)})} />
                    <div style={{textAlign:'center', fontFamily:'Orbitron', fontSize:'1.5rem', color:'#00f3ff', fontWeight:'bold'}}>
                      {votes.t2}/10
                    </div>
                  </>
                )}
              </div>

              <div className="card-3d">
                <div className="label">📖 3. SZTORI</div>
                <div style={{fontSize:'1.15rem', lineHeight:1.8, padding:'10px 0'}} 
                  dangerouslySetInnerHTML={{ __html: buildStory(target.tasks?.t3, target.answers) }}>
                </div>
                {target.name!==name && (
                  <>
                    <input type="range" min="1" max="10" value={votes.t3} onChange={e=>setVotes({...votes,t3:parseInt(e.target.value)})} />
                    <div style={{textAlign:'center', fontFamily:'Orbitron', fontSize:'1.5rem', color:'#00f3ff', fontWeight:'bold'}}>
                      {votes.t3}/10
                    </div>
                  </>
                )}
              </div>

              <div className="card-3d">
                <div className="label">🔤 4. SZÓTÁR ({target.tasks?.t4?.letters})</div>
                <div style={{fontSize:'1.3rem', color:'#fff', padding:'10px 0', fontWeight:'500'}}>{target.answers?.t4 || "..."}</div>
                {target.name!==name && (
                  <>
                    <input type="range" min="1" max="10" value={votes.t4} onChange={e=>setVotes({...votes,t4:parseInt(e.target.value)})} />
                    <div style={{textAlign:'center', fontFamily:'Orbitron', fontSize:'1.5rem', color:'#00f3ff', fontWeight:'bold'}}>
                      {votes.t4}/10
                    </div>
                  </>
                )}
              </div>

              {target.name!==name ? (
                <div className="card-3d" style={{
                  position:'sticky', 
                  bottom:20, 
                  zIndex:50, 
                  border:'2px solid #00f3ff',
                  background:'rgba(0, 243, 255, 0.1)',
                  backdropFilter:'blur(20px)'
                }}>
                   <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div style={{
                        fontWeight:'bold', 
                        fontFamily:'Orbitron',
                        color:'#00f3ff', 
                        fontSize:'1.8rem',
                        textShadow:'0 0 20px rgba(0, 243, 255, 0.8)'
                      }}>
                        ÖSSZESEN: {votes.t1+votes.t2+votes.t3+votes.t4}
                      </div>
                      <button className="btn-3d" style={{width:'auto', margin:0, padding:'15px 30px'}} onClick={async ()=>{
                         const d=await act('/submit-vote',{votes}); if(d.success && !d.allVoted)setScreen('WAIT_VOTE');
                      }}>
                        🗳️ SZAVAZÁS
                      </button>
                   </div>
                </div>
              ) : (
                <div className="card-3d" style={{textAlign:'center', color:'#888', fontSize:'1.2rem', padding:'30px'}}>
                  ⏳ Téged értékelnek...
                </div>
              )}
            </>
          )}

          {/* LEADERBOARD */}
          {screen === 'LEADERBOARD' && data && (
            <div className="card-3d">
              <h1 className="title-3d" style={{
                background:'linear-gradient(45deg, #ffdd00, #ff00de)',
                WebkitBackgroundClip:'text',
                WebkitTextFillColor:'transparent'
              }} data-text="VÉGEREDMÉNY">
                VÉGEREDMÉNY
              </h1>
              {data.players.sort((a,b)=>b.score-a.score).map((p,i)=>(
                 <div key={p.name} style={{
                    display:'flex', 
                    justifyContent:'space-between', 
                    alignItems:'center',
                    padding:20, 
                    margin:'15px 0', 
                    borderRadius:15,
                    background: i===0 
                      ? 'linear-gradient(135deg, #ffdd00, #ff9900)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    border: i===0 ? '2px solid #ffdd00' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: i===0 ? 'black' : 'white', 
                    fontFamily:'Orbitron',
                    fontWeight:'bold',
                    fontSize:'1.2rem',
                    boxShadow: i===0 ? '0 0 30px rgba(255, 221, 0, 0.5)' : 'none',
                    transition:'all 0.3s ease',
                    transform: i===0 ? 'scale(1.05)' : 'scale(1)'
                 }}>
                    <span>{i===0?'🏆':'#'+(i+1)} {p.name}</span>
                    <span style={{
                      padding:'8px 20px',
                      borderRadius:'20px',
                      background: i===0 ? 'rgba(0,0,0,0.2)' : 'rgba(0, 243, 255, 0.2)',
                      border: i===0 ? '2px solid rgba(0,0,0,0.3)' : '2px solid rgba(0, 243, 255, 0.3)'
                    }}>
                      {p.score}
                    </span>
                 </div>
              ))}
              {me?.isHost && (
                <button 
                  className="btn-3d" 
                  style={{marginTop:30}}
                  onClick={()=>act('/start-round',{})}
                >
                  🔄 ÚJ KÖR INDÍTÁSA
                </button>
              )}
            </div>
          )}

        </div>
        <FloatingChat roomId={roomId} name={name} chats={data?.chat} />
      </div>
    </>
  );
}