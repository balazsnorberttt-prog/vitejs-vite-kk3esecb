// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, MeshDistortMaterial, Sparkles } from '@react-three/drei';

// KONFIGURÁCIÓ
const BACKEND_URL = "https://trash-backend.balazsnorberttt.workers.dev"; // CSERÉLD LE!!!
const POLL_INTERVAL = 1000;

// CYBERPUNK CSS STÍLUSOK
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700;900&family=Orbitron:wght@700&display=swap');
  
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  
  body { 
    margin: 0; 
    background: #050010; 
    color: white; 
    font-family: 'Rajdhani', sans-serif;
    overflow: hidden; 
  }

  .app-layer {
    position: absolute; inset: 0;
    overflow-y: auto; -webkit-overflow-scrolling: touch;
    padding: 15px; z-index: 10;
  }

  .container {
    width: 100%; max-width: 550px; margin: 0 auto; padding-bottom: 80px;
  }

  /* CYBER KÁRTYA */
  .card {
    background: rgba(10, 5, 20, 0.7);
    border: 1px solid rgba(255, 0, 222, 0.5);
    border-left: 5px solid #ff00de;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 25px;
    box-shadow: 0 0 20px rgba(255, 0, 222, 0.15);
    backdrop-filter: blur(10px);
    animation: slideIn 0.5s ease-out;
  }
  @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

  .title { 
    font-family: 'Orbitron', sans-serif; font-size: 2rem; 
    text-align: center; margin: 10px 0 20px 0; 
    color: #fff; text-shadow: 0 0 10px #ff00de;
  }
  
  .label { 
    color: #00f3ff; font-weight: 900; font-size: 0.9rem; 
    margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px;
  }
  
  .story-part {
    display: inline-block; padding: 5px 10px; 
    background: #ff00de; color: black; font-weight: bold; 
    border-radius: 4px; margin: 5px 0; transform: skew(-10deg);
  }

  /* INPUT MEZŐK */
  .input-field {
    width: 100%;
    background: rgba(0, 0, 0, 0.6);
    border: 2px solid #333;
    border-bottom: 2px solid #00f3ff;
    color: #ffdd00;
    padding: 15px;
    font-size: 1.1rem; 
    font-weight: bold;
    border-radius: 6px;
    margin-bottom: 15px;
    outline: none; transition: 0.3s;
  }
  .input-field:focus { border-color: #00f3ff; box-shadow: 0 0 15px rgba(0, 243, 255, 0.3); }

  /* NEON GOMBOK */
  .btn {
    width: 100%; padding: 18px;
    font-family: 'Orbitron', sans-serif; font-size: 1.2rem;
    text-transform: uppercase; border: none; border-radius: 6px;
    background: linear-gradient(90deg, #ff00de, #9900cc);
    color: white; cursor: pointer; margin-top: 15px;
    box-shadow: 0 5px 20px rgba(255, 0, 222, 0.4);
    position: relative; overflow: hidden;
  }
  .btn::after {
    content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
    background: linear-gradient(to bottom right, rgba(255,255,255,0.3), transparent);
    transform: rotate(45deg); animation: shine 3s infinite;
  }
  .btn:active { transform: scale(0.98); }
  @keyframes shine { 0% { left: -100%; } 100% { left: 200%; } }

  /* FLOATING CHAT GOMB (MOBIL FIX) */
  .chat-fab {
    position: fixed; bottom: 20px; right: 20px;
    width: 60px; height: 60px;
    background: #00f3ff; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 20px #00f3ff; z-index: 1000; cursor: pointer;
    font-size: 30px; border: 2px solid white;
  }

  .chat-window {
    position: fixed; bottom: 90px; right: 20px;
    width: 300px; height: 350px;
    background: rgba(0,0,0,0.9);
    border: 2px solid #00f3ff; border-radius: 10px;
    display: flex; flex-direction: column;
    z-index: 999; box-shadow: 0 0 30px rgba(0,0,0,0.8);
    transform-origin: bottom right; animation: popUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  @keyframes popUp { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }

  .chat-list { flex: 1; overflow-y: auto; padding: 10px; font-size: 0.9rem; }
  .msg { margin-bottom: 8px; border-bottom: 1px solid #333; padding-bottom: 4px; }
  .msg-name { color: #ff00de; font-weight: bold; margin-right: 5px; }

  /* SLIDER */
  input[type=range] { width: 100%; height: 10px; accent-color: #ff00de; cursor: pointer; margin: 15px 0; }
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

// --- 3D LÁTVÁNY (Space Trash) ---
function CyberBg() {
  return (
    <div style={{position:'fixed', inset:0, zIndex:-1, background: 'radial-gradient(circle at center, #1a0b2e 0%, #000000 100%)'}}>
      <Canvas camera={{ position: [0, 0, 10] }}>
        <Stars count={3000} factor={4} fade />
        <Sparkles count={500} scale={12} size={4} speed={0.4} opacity={0.5} color="#00f3ff" />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} color="#ff00de" intensity={2} />
        
        {/* Lebegő "Szemét" */}
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
          <mesh position={[3, 0, -5]}>
            <torusKnotGeometry args={[1.5, 0.4, 100, 16]} />
            <MeshDistortMaterial color="#440055" wireframe distort={0.4} speed={3} />
          </mesh>
        </Float>
        <Float speed={1.5} rotationIntensity={1.5} floatIntensity={0.5}>
          <mesh position={[-4, 2, -2]}>
            <icosahedronGeometry args={[2, 0]} />
            <MeshDistortMaterial color="#003344" wireframe distort={0.6} speed={2} />
          </mesh>
        </Float>
      </Canvas>
    </div>
  );
}

// --- CHAT MODUL (Lebegő gombbal) ---
function FloatingChat({ roomId, name, chats }) {
  const [isOpen, setIsOpen] = useState(false);
  const [txt, setTxt] = useState("");
  const endRef = useRef(null);

  useEffect(() => { if(isOpen) endRef.current?.scrollIntoView({behavior:'smooth'}); }, [chats, isOpen]);

  const send = async () => { if(!txt.trim())return; await api.post('/send-message',{roomId, playerName:name, message:txt}); setTxt(""); };

  if (!roomId) return null;

  return (
    <>
      <div className="chat-fab" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : '💬'}
      </div>
      
      {isOpen && (
        <div className="chat-window">
          <div style={{background:'#ff00de', padding:'10px', fontWeight:'bold', textAlign:'center', color:'black'}}>TRASH TALK</div>
          <div className="chat-list">
            {chats?.map((c,i)=>(<div key={i} className="msg"><span className="msg-name">{c.name}:</span><span style={{color:'#ddd'}}>{c.text}</span></div>))}
            <div ref={endRef}/>
          </div>
          <div style={{display:'flex', padding:'10px', background:'#111'}}>
            <input className="input-field" style={{marginBottom:0, padding:'8px', fontSize:'0.9rem'}} value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="..." />
            <button className="btn" style={{width:'50px', marginTop:0, padding:0, marginLeft:'5px'}} onClick={send}>&gt;</button>
          </div>
        </div>
      )}
    </>
  );
}

// --- FŐ APP ---
export default function App() {
  const [screen, setScreen] = useState('MENU');
  const [roomId, setRoomId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [name, setName] = useState('');
  const [data, setData] = useState(null);
  const [load, setLoad] = useState(false);
  const [err, setErr] = useState(null);

  // GAME STATES
  // ans.t3_1, t3_2, t3_3 (3 input a sztorilánchoz)
  const [ans, setAns] = useState({ t1:"", t2:"", t3_1:"", t3_2:"", t3_3:"", t4:"" });
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
          setScreen('PLAYING'); setAns({t1:"", t2:"", t3_1:"", t3_2:"", t3_3:"", t4:""});
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
  const totalVote = votes.t1 + votes.t2 + votes.t3 + votes.t4;

  return (
    <>
      <style>{STYLES}</style>
      <CyberBg />
      <div className="app-layer">
        <div className="container">
          
          {/* FEJLÉC */}
          {roomId && <div style={{textAlign:'center', marginBottom:10, fontSize:'0.8rem', color:'#aaa', background:'rgba(0,0,0,0.5)', padding:'5px', borderRadius:'20px'}}>SZOBA: <span style={{color:'#ff00de', fontWeight:'bold'}}>{roomId}</span> | {name}</div>}
          {err && <div style={{background:'rgba(255,0,0,0.8)', padding:10, borderRadius:5, marginBottom:10, border:'1px solid red'}}>{err}</div>}

          {/* MENÜ */}
          {screen === 'MENU' && (
            <div style={{marginTop:'15vh', textAlign:'center'}}>
              <h1 className="title" style={{fontSize:'3.5rem', marginBottom:'40px', textShadow:'0 0 20px #ff00de'}}>TRASH<br/>UNIVERSE</h1>
              <div className="card">
                <div className="label">KARAKTER NÉV</div>
                <input className="input-field" value={name} onChange={e=>setName(e.target.value)} placeholder="Írd be a neved..." />
                <button className="btn" onClick={async ()=>{
                  if(!name)return; 
                  const d = await act('/create-room',{});
                  if(d.success){ setRoomId(d.roomId); setData(d.roomData); setScreen('LOBBY'); }
                }} disabled={load}>ÚJ JÁTÉK LÉTREHOZÁSA</button>
                
                <div style={{margin:'20px 0', height:'1px', background:'#333'}}></div>
                
                <div className="label">CSATLAKOZÁS KÓDDAL</div>
                <input className="input-field" value={joinCode} onChange={e=>setJoinCode(e.target.value)} type="number" placeholder="Szoba kód" />
                <button className="btn" style={{background:'linear-gradient(90deg, #00f3ff, #0099cc)', color:'black'}} onClick={async ()=>{
                   if(!name || !joinCode)return;
                   const d = await api.post('/join-room',{roomId:joinCode, playerName:name});
                   if(d.success){ setRoomId(joinCode); setData(d.roomData); setScreen('LOBBY'); } else setErr(d.error);
                }} disabled={load}>BELÉPÉS</button>
              </div>
            </div>
          )}

          {/* LOBBY */}
          {screen === 'LOBBY' && data && (
            <div className="card">
              <h2 className="title" style={{fontSize:'1.5rem'}}>VÁRÓTEREM</h2>
              <div style={{display:'flex', flexWrap:'wrap', gap:'10px', justifyContent:'center', marginBottom:'20px'}}>
                {data.players.map(p => (
                  <div key={p.name} style={{
                    padding:'8px 15px', borderRadius:'20px', 
                    background: p.name===name ? '#ff00de' : '#333',
                    color: p.name===name ? 'black' : 'white', fontWeight:'bold'
                  }}>
                    {p.isHost ? '👑 ' : ''}{p.name}
                  </div>
                ))}
              </div>
              {me?.isHost ? (
                <button className="btn" onClick={()=>act('/start-round',{})} disabled={data.players.length<2}>JÁTÉK INDÍTÁSA 🚀</button>
              ) : <div style={{textAlign:'center', color:'#00f3ff', animation:'pulse 2s infinite'}}>A Host hamarosan indít...</div>}
            </div>
          )}

          {/* JÁTÉK - 4 FELADAT */}
          {screen === 'PLAYING' && me?.tasks && (
            <>
              <div style={{textAlign:'center', marginBottom:20}}>
                <span style={{color:'#ff00de', fontSize:'1.5rem', fontWeight:'bold', textShadow:'0 0 10px #ff00de'}}>
                  KÖR {data.currentRound}/{data.totalRounds}
                </span>
              </div>

              {/* T1 */}
              <div className="card">
                <div className="label">1. SZITUÁCIÓ ({me.tasks.t1.letters})</div>
                <p style={{fontSize:'1.2rem'}}>{me.tasks.t1.text}</p>
                <input className="input-field" value={ans.t1} onChange={e=>setAns({...ans,t1:e.target.value})} placeholder="Fejezd be a mondatot..." />
              </div>

              {/* T2 */}
              <div className="card">
                <div className="label">2. KÍN-PAD ({me.tasks.t2.letters})</div>
                <p style={{fontSize:'1.2rem'}}>{me.tasks.t2.text}</p>
                <input className="input-field" value={ans.t2} onChange={e=>setAns({...ans,t2:e.target.value})} placeholder="Őszinte válasz..." />
              </div>

              {/* T3 - SZTORILÁNC (ÚJ LOGIKA) */}
              <div className="card">
                <div className="label">3. SZTORILÁNC (FŰZD ÖSSZE!)</div>
                <div style={{fontSize:'0.9rem', color:'#aaa', marginBottom:'10px'}}>Alkoss egy összefüggő mondatot a 3 név felhasználásával!</div>
                
                <span className="story-part">{me.tasks.t3.celebs[0]}</span>
                <input className="input-field" style={{marginTop:'5px', marginBottom:'5px'}} value={ans.t3_1} onChange={e=>setAns({...ans,t3_1:e.target.value})} placeholder="Mit csinált?" />
                
                <span className="story-part">{me.tasks.t3.celebs[1]}</span>
                <input className="input-field" style={{marginTop:'5px', marginBottom:'5px'}} value={ans.t3_2} onChange={e=>setAns({...ans,t3_2:e.target.value})} placeholder="Hogyan / Mivel / Hol?" />
                
                <span className="story-part">{me.tasks.t3.celebs[2]}</span>
                <input className="input-field" style={{marginTop:'5px', marginBottom:'5px'}} value={ans.t3_3} onChange={e=>setAns({...ans,t3_3:e.target.value})} placeholder="Mi lett a vége / Reakció?" />
              </div>

              {/* T4 */}
              <div className="card">
                <div className="label">4. TRASH SZÓTÁR</div>
                <p style={{fontSize:'1.2rem'}}>{me.tasks.t4.prompt}</p>
                <h1 style={{textAlign:'center', color:'#00f3ff', letterSpacing:'8px', textShadow:'0 0 10px #00f3ff'}}>{me.tasks.t4.letters}</h1>
                <input className="input-field" value={ans.t4} onChange={e=>setAns({...ans,t4:e.target.value})} placeholder="Oldd fel a rövidítést..." />
              </div>

              <button className="btn" onClick={async ()=>{
                 const d = await act('/submit-answers',{answers:ans});
                 if(d.success) setScreen('WAIT');
              }}>BEKÜLDÉS ÉS KÉSZ ✅</button>
            </>
          )}

          {/* VÁRAKOZÁS */}
          {(screen === 'WAIT' || screen === 'WAIT_VOTE') && (
            <div style={{textAlign:'center', marginTop:'30vh'}}>
              <h1 style={{fontSize:'4rem', margin:0}}>⏳</h1>
              <h2 style={{color:'#00f3ff'}}>VÁRAKOZÁS...</h2>
              <p>Valaki még nagyon gondolkodik (vagy WC-n van).</p>
              {me?.isHost && (
                <button className="btn" style={{background:'red', marginTop:30, width:'auto', fontSize:'0.9rem'}} 
                  onClick={()=>act('/force-next',{})}>FORCE NEXT (PÁNIKGOMB)</button>
              )}
            </div>
          )}

          {/* SZAVAZÁS */}
          {screen === 'VOTING' && target && (
            <>
              <div style={{textAlign:'center', marginBottom:20}}>
                <div className="label" style={{color:'#888'}}>ÉRTÉKELÉS</div>
                <h1 style={{color:'#ff00de', fontSize:'2.5rem', margin:0, textShadow:'0 0 15px #ff00de'}}>{target.name}</h1>
                <div>{data.votingIndex+1} / {data.votingPlayers.length}</div>
              </div>

              {/* T1 */}
              <div className="card">
                <div className="label">1. SZITUÁCIÓ</div>
                <div style={{fontSize:'1.2rem', marginBottom:10}}>{target.answers?.t1 || "---"}</div>
                {target.name !== name && <input type="range" min="1" max="10" value={votes.t1} onChange={e=>setVotes({...votes, t1:parseInt(e.target.value)})} />}
              </div>

              {/* T2 */}
              <div className="card">
                <div className="label">2. KÍN-PAD</div>
                <div style={{fontSize:'1.2rem', marginBottom:10}}>{target.answers?.t2 || "---"}</div>
                {target.name !== name && <input type="range" min="1" max="10" value={votes.t2} onChange={e=>setVotes({...votes, t2:parseInt(e.target.value)})} />}
              </div>

              {/* T3 - ÖSSZEFŰZVE */}
              <div className="card">
                <div className="label">3. SZTORI</div>
                <div style={{fontSize:'1.1rem', lineHeight:'1.6', color:'#fff'}}>
                  <span style={{color:'#ff00de', fontWeight:'bold'}}>{target.tasks?.t3?.celebs?.[0]}</span>{' '}
                  <span style={{color:'#00f3ff'}}>{target.answers?.t3_1 || "..."}</span>{' '}
                  <span style={{color:'#ff00de', fontWeight:'bold'}}>{target.tasks?.t3?.celebs?.[1]}</span>{' '}
                  <span style={{color:'#00f3ff'}}>{target.answers?.t3_2 || "..."}</span>{' '}
                  <span style={{color:'#ff00de', fontWeight:'bold'}}>{target.tasks?.t3?.celebs?.[2]}</span>{' '}
                  <span style={{color:'#00f3ff'}}>{target.answers?.t3_3 || "..."}</span>
                </div>
                {target.name !== name && <input type="range" min="1" max="10" value={votes.t3} onChange={e=>setVotes({...votes, t3:parseInt(e.target.value)})} />}
              </div>

              {/* T4 */}
              <div className="card">
                <div className="label">4. SZÓTÁR ({target.tasks?.t4?.letters})</div>
                <div style={{fontSize:'1.2rem', marginBottom:10}}>{target.answers?.t4 || "---"}</div>
                {target.name !== name && <input type="range" min="1" max="10" value={votes.t4} onChange={e=>setVotes({...votes, t4:parseInt(e.target.value)})} />}
              </div>

              {target.name !== name ? (
                <div className="card" style={{position:'sticky', bottom:20, border:'2px solid #00f3ff', background:'rgba(0,0,0,0.9)', zIndex:50}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{fontWeight:'bold', fontSize:'1.2rem', color:'#ffdd00'}}>ÖSSZ: {totalVote} PONT</div>
                    <button className="btn" style={{width:'auto', margin:0, padding:'10px 20px'}} onClick={async ()=>{
                      const d = await act('/submit-vote', {votes});
                      if(d.success && !d.allVoted) setScreen('WAIT_VOTE');
                    }}>KÜLDÉS</button>
                  </div>
                </div>
              ) : (
                <div className="card" style={{textAlign:'center', color:'#888', fontStyle:'italic'}}>
                  Téged értékelnek éppen... reméljük nem leszel nullázva.
                </div>
              )}
            </>
          )}

          {/* EREDMÉNY */}
          {screen === 'LEADERBOARD' && data && (
            <div className="card" style={{textAlign:'center'}}>
              <h1 className="title" style={{color:'#ffdd00', textShadow:'0 0 20px #ffdd00'}}>VÉGEREDMÉNY</h1>
              {data.players.sort((a,b)=>b.score-a.score).map((p,i)=>(
                <div key={p.name} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:15, margin:'10px 0', borderRadius:10,
                  background: i===0 ? 'linear-gradient(90deg, #ffdd00, #ffaa00)' : 'rgba(255,255,255,0.1)',
                  color: i===0 ? 'black' : 'white', fontWeight: i===0?'900':'normal',
                  transform: i===0 ? 'scale(1.05)' : 'scale(1)'
                }}>
                  <span style={{fontSize:'1.2rem'}}>#{i+1} {p.name}</span>
                  <span style={{fontSize:'1.5rem'}}>{p.score}</span>
                </div>
              ))}
              {me?.isHost && <button className="btn" onClick={()=>act('/start-round',{})}>ÚJ KÖR INDÍTÁSA</button>}
            </div>
          )}

        </div>
        
        {/* LEBEGŐ CHAT */}
        {screen !== 'MENU' && <FloatingChat roomId={roomId} name={name} chats={data?.chat} />}
      </div>
    </>
  );
}