// @ts-nocheck
// ============================================================================
// TRASH UNIVERSE - FRONTEND FULL V4.0 (TypeScript Friendly)
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, MeshDistortMaterial } from '@react-three/drei';

// ============================================================================
// KONFIGURÁCIÓ
// ============================================================================
const BACKEND_URL = "https://trash-backend.balazsnorberttt.workers.dev"; // <--- IDE MÁSOLD BE A SAJÁT URL-EDET!
const POLL_INTERVAL = 1000;

// ============================================================================
// CSS STYLES (JAVÍTOTT GLITCH + CRT)
// ============================================================================
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@500;700;900&family=VT323&display=swap');
  
  * { box-sizing: border-box; }
  body { margin: 0; background: #050011; overflow: hidden; font-family: 'Rajdhani', sans-serif; color: white; }
  
  /* CRT SCANLINE OVERLAY */
  .crt-overlay {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
    background-size: 100% 2px, 3px 100%; pointer-events: none; z-index: 9999;
  }

  .app-layer { position: absolute; inset: 0; display: flex; flex-direction: column; z-index: 10; overflow-y: auto; overflow-x: hidden; width: 100vw; }
  .container { width: 100%; max-width: 600px; margin: 0 auto; padding: 15px; display: flex; flex-direction: column; min-height: 100vh; position: relative; z-index: 10; }
  
  /* GLITCH TEXT EFFECT */
  .glitch { position: relative; color: #fff; font-family: 'Black Ops One'; letter-spacing: 2px; }
  .glitch::before, .glitch::after { content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
  .glitch::before { left: 2px; text-shadow: -1px 0 #ff00de; clip: rect(44px, 450px, 56px, 0); animation: glitch-anim-1 5s infinite linear alternate-reverse; }
  .glitch::after { left: -2px; text-shadow: -1px 0 #00f3ff; clip: rect(44px, 450px, 56px, 0); animation: glitch-anim-2 5s infinite linear alternate-reverse; }
  
  @keyframes glitch-anim-1 { 0% { clip: rect(20px, 9999px, 10px, 0); } 100% { clip: rect(80px, 9999px, 90px, 0); } }
  @keyframes glitch-anim-2 { 0% { clip: rect(60px, 9999px, 70px, 0); } 100% { clip: rect(10px, 9999px, 30px, 0); } }

  .glass-card { 
    background: rgba(10, 5, 20, 0.85); border: 2px solid #ff00de; 
    border-radius: 4px; padding: 20px; margin-bottom: 20px; 
    box-shadow: 0 0 15px rgba(255, 0, 222, 0.3);
    position: relative; overflow: hidden;
  }
  .glass-card::before {
    content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    animation: shine 3s infinite;
  }
  @keyframes shine { 0% { left: -100%; } 20% { left: 200%; } 100% { left: 200%; } }

  .cyber-input { 
    width: 100%; padding: 15px; background: rgba(0,0,0,0.8); border: 2px solid #00f3ff; 
    color: #ffdd00; font-family: 'VT323'; font-size: 1.5rem; text-align: center; margin: 10px 0; outline: none;
  }
  
  .btn-action { 
    width: 100%; padding: 15px; background: #ff00de; color: black; 
    font-family: 'Black Ops One'; font-size: 1.5rem; border: none; cursor: pointer; 
    text-transform: uppercase; box-shadow: 5px 5px 0px #00f3ff; margin: 10px 0; 
    transition: 0.1s; position: relative;
  }
  .btn-action:active { transform: translate(2px, 2px); box-shadow: 3px 3px 0px #00f3ff; }
  .btn-action:disabled { background: #555; box-shadow: none; cursor: not-allowed; }

  /* CHAT STYLES */
  .chat-box {
    height: 150px; overflow-y: auto; background: rgba(0,0,0,0.6); 
    border: 1px solid #555; padding: 10px; margin-top: 10px; font-family: 'VT323'; font-size: 1.1rem;
    scrollbar-width: thin; scrollbar-color: #ff00de #111;
  }
  .chat-msg { margin-bottom: 4px; border-bottom: 1px solid #222; padding-bottom: 2px; word-wrap: break-word; }
  .chat-name { color: #ff00de; font-weight: bold; margin-right: 5px; }
  .chat-text { color: #ccc; }
  
  .error-banner {
    background: rgba(255,0,0,0.8); color: white; padding: 10px; text-align: center; 
    border: 1px solid red; margin-bottom: 10px;
  }
`;

// ============================================================================
// API SEGÉD
// ============================================================================
const api = {
  post: async (url, body) => {
    try {
      const res = await fetch(`${BACKEND_URL}${url}`, { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(body) 
      });
      return await res.json();
    } catch (e) {
      console.error("API POST Error:", e);
      return { error: "Hálózati hiba" };
    }
  },
  get: async (url) => {
    try {
      const res = await fetch(`${BACKEND_URL}${url}`);
      return await res.json();
    } catch (e) {
      console.error("API GET Error:", e);
      return { error: "Hálózati hiba" };
    }
  }
};

// ============================================================================
// 3D KOMPONENSEK
// ============================================================================
function Background3D() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
      <Canvas camera={{ position: [0, 0, 15] }}>
        <Stars count={5000} factor={4} fade />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} color="#ff00de" intensity={2} />
        <Float speed={2} rotationIntensity={0.5}>
          <mesh position={[4, 2, -5]}>
            <dodecahedronGeometry args={[2.5]} />
            <MeshDistortMaterial color="#ff00de" wireframe distort={0.6} speed={2} />
          </mesh>
        </Float>
        <Float speed={3} rotationIntensity={1}>
          <mesh position={[-4, -3, -5]}>
            <octahedronGeometry args={[3]} />
            <MeshDistortMaterial color="#00f3ff" wireframe distort={0.4} speed={4} />
          </mesh>
        </Float>
      </Canvas>
    </div>
  );
}

// ============================================================================
// CHAT KOMPONENS (Javított)
// ============================================================================
function TrashChat({ roomId, playerName, chatData }) {
  const [msg, setMsg] = useState("");
  const endRef = useRef(null);

  // Auto scroll
  useEffect(() => { 
    endRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [chatData]);

  const send = async () => {
    if (!msg.trim()) return;
    await api.post('/send-message', { roomId, playerName, message: msg });
    setMsg("");
  };

  return (
    <div className="glass-card" style={{marginTop: 'auto'}}>
      <h3 style={{margin: '0 0 10px 0', color: '#00f3ff', fontSize: '1rem'}}>TRASH TALK</h3>
      <div className="chat-box">
        {chatData?.map((c, i) => (
          <div key={i} className="chat-msg">
            <span className="chat-name">{c.name}:</span>
            <span className="chat-text">{c.text}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{display: 'flex', marginTop: '10px', gap: '5px'}}>
        <input 
          className="cyber-input" 
          style={{margin: 0, fontSize: '1.2rem', padding: '5px'}}
          value={msg} 
          onChange={e => setMsg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ugass be..."
        />
        {/* JAVÍTOTT GOMB: Nincs > jel, helyette HTML entity */}
        <button onClick={send} className="btn-action" style={{width: '60px', margin: 0, fontSize: '1rem'}}>
          &gt;
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// FŐ APP KOMPONENS
// ============================================================================
export default function App() {
  const [screen, setScreen] = useState('MENU');
  const [roomId, setRoomId] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState(''); // JAVÍTOTT: State a HTML elem helyett
  const [myName, setMyName] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Játék statek
  const [answers, setAnswers] = useState({ t1: "", t2: "", t3_1: "", t3_2: "", t4: "" });
  const [myVote, setMyVote] = useState(5);

  const pollRef = useRef(null);

  // --------------------------------------------------------------------------
  // POLLING RENDSZER
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!roomId || !myName) return;

    const poll = async () => {
      try {
        const data = await api.get(`/get-room?roomId=${roomId}&playerName=${encodeURIComponent(myName)}`);
        
        if (data.success && data.roomData) {
          setRoomData(data.roomData);
          setError(null);

          const ph = data.roomData.currentPhase;
          
          // Automatikus képernyő váltások
          if (ph === 'LOBBY' && screen !== 'LOBBY') setScreen('LOBBY');
          
          if (ph === 'PLAYING' && screen !== 'PLAYING' && screen !== 'WAITING') {
            setScreen('PLAYING'); 
            setAnswers({t1:"",t2:"",t3_1:"",t3_2:"",t4:""}); // Reset answers
          }
          
          if (ph === 'VOTING' && screen !== 'VOTING' && screen !== 'WAITING_VOTE') {
            setScreen('VOTING'); 
            setMyVote(5); // Reset vote
          }
          
          if (ph === 'LEADERBOARD' && screen !== 'LEADERBOARD') setScreen('LEADERBOARD');
        } else if (data.error) {
          // Ha törölték a szobát vagy hiba van
          // setError(data.error); // Opcionális: ne zavarjon állandóan
        }
      } catch (e) { console.error(e); }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [roomId, myName, screen]);

  // --------------------------------------------------------------------------
  // HANDLEREK
  // --------------------------------------------------------------------------
  const handleCreate = async () => {
    if(!myName.trim()) { setError("Név kötelező!"); return; }
    setLoading(true);
    const d = await api.post('/create-room', { playerName: myName });
    if(d.success) { setRoomId(d.roomId); setRoomData(d.roomData); setScreen('LOBBY'); }
    else setError(d.error); 
    setLoading(false);
  };

  const handleJoin = async () => {
    // JAVÍTÁS: joinCodeInput state használata a document.getElementById helyett
    if(!myName.trim() || !joinCodeInput.trim()) { setError("Név és Kód kötelező!"); return; }
    setLoading(true);
    const d = await api.post('/join-room', { roomId: joinCodeInput, playerName: myName });
    if(d.success) { setRoomId(joinCodeInput); setRoomData(d.roomData); setScreen('LOBBY'); }
    else setError(d.error); 
    setLoading(false);
  };

  const handleStart = async () => {
    setLoading(true);
    const d = await api.post('/start-round', { roomId, playerName: myName });
    if(!d.success) setError(d.error);
    setLoading(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const d = await api.post('/submit-answers', { roomId, playerName: myName, answers });
    if(d.success) setScreen('WAITING');
    else setError(d.error);
    setLoading(false);
  };

  const handleVote = async () => {
    setLoading(true);
    const d = await api.post('/submit-vote', { roomId, playerName: myName, vote: myVote });
    if(d.success) {
        if (!d.allVoted) setScreen('WAITING_VOTE');
    } else setError(d.error);
    setLoading(false);
  };

  const handleForceNext = async () => {
    if(!confirm("Kényszerített továbbítás? Csak vészhelyzetben használd!")) return;
    setLoading(true);
    await api.post('/force-next', { roomId, playerName: myName });
    setLoading(false);
  };

  // --------------------------------------------------------------------------
  // RENDER HELPERS
  // --------------------------------------------------------------------------
  const me = roomData?.players?.find(p => p.name === myName);
  const target = roomData?.votingPlayers?.[roomData?.votingIndex];
  const isHost = me?.isHost || false;

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="crt-overlay"></div>
      <Background3D />
      
      <div className="app-layer">
        <div className="container">
          
          {/* HEADER */}
          {roomId && (
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', background: 'rgba(0,0,0,0.5)', padding: '5px'}}>
              <div style={{color:'#ff00de', fontWeight:'bold'}}>ROOM: {roomId}</div>
              <div style={{color:'#00f3ff'}}>{myName} {isHost ? '(HOST)' : ''}</div>
            </div>
          )}

          {/* HIBAÜZENET */}
          {error && (
            <div className="error-banner">
              {error} <button onClick={()=>setError(null)} style={{background:'transparent', border:'none', color:'white', marginLeft:'10px', cursor:'pointer'}}>X</button>
            </div>
          )}

          {/* ======================= MENU SCREEN ======================= */}
          {screen === 'MENU' && (
            <div style={{textAlign:'center', marginTop:'50px'}}>
              <h1 className="glitch" data-text="TRASH UNIVERSE" style={{fontSize:'3.5rem', marginBottom:'40px'}}>TRASH UNIVERSE</h1>
              
              <div className="glass-card">
                <label style={{display:'block', textAlign:'left', color:'#00f3ff'}}>NÉV:</label>
                <input 
                  className="cyber-input" 
                  placeholder="TRASH NÉV" 
                  value={myName} 
                  onChange={e=>setMyName(e.target.value)} 
                />
                
                <button className="btn-action" onClick={handleCreate} disabled={loading}>
                  {loading ? 'LÉTREHOZÁS...' : 'ÚJ JÁTÉK'}
                </button>
                
                <hr style={{borderColor:'#333', margin:'20px 0'}}/>
                
                <label style={{display:'block', textAlign:'left', color:'#00f3ff'}}>SZOBA KÓD:</label>
                {/* JAVÍTÁS: Controlled input */}
                <input 
                  className="cyber-input" 
                  placeholder="SZOBA KÓD" 
                  value={joinCodeInput}
                  onChange={e=>setJoinCodeInput(e.target.value)}
                />
                <button className="btn-action" style={{background:'#00f3ff'}} onClick={handleJoin} disabled={loading}>
                  {loading ? 'CSATLAKOZÁS...' : 'CSATLAKOZÁS'}
                </button>
              </div>
            </div>
          )}

          {/* ======================= LOBBY SCREEN ======================= */}
          {screen === 'LOBBY' && roomData && (
            <>
              <h2 className="glitch" data-text="LOBBY" style={{textAlign:'center', fontSize:'3rem'}}>LOBBY</h2>
              <div className="glass-card">
                <h3 style={{marginTop:0, color: '#ff00de'}}>JÁTÉKOSOK ({roomData.players.length}/10):</h3>
                {roomData.players.map(p => (
                  <div key={p.name} style={{padding:'10px', borderBottom:'1px solid #333', display:'flex', justifyContent:'space-between', color: p.name===myName?'#ff00de':'white'}}>
                    <span>{p.isHost && '👑'} {p.name}</span>
                    <span>{p.score} pont</span>
                  </div>
                ))}
              </div>
              
              {isHost ? (
                <button className="btn-action" onClick={handleStart} disabled={roomData.players.length < 2 || loading}>
                  {roomData.players.length < 2 ? 'VÁRJ MÉG EMBERT!' : 'JÁTÉK INDÍTÁSA'}
                </button>
              ) : (
                <div style={{textAlign:'center', color:'#888', animation: 'pulse 2s infinite'}}>
                  Várakozás a hostra...
                </div>
              )}
            </>
          )}

          {/* ======================= PLAYING SCREEN ======================= */}
          {screen === 'PLAYING' && me?.tasks && (
            <>
               <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <h2 style={{color: '#ff00de'}}>KÖR: {roomData.currentRound}/{roomData.totalRounds}</h2>
               </div>
               
               {/* FELADAT 1 */}
               <div className="glass-card">
                  <div style={{color:'#00f3ff', fontWeight:'bold'}}>1. SZITUÁCIÓ</div>
                  <div style={{fontSize: '0.9em', color: '#aaa', marginBottom: '5px'}}>Betűk: {me.tasks.t1.letters}</div>
                  <p style={{fontSize: '1.2rem'}}>{me.tasks.t1.text}</p>
                  <input className="cyber-input" value={answers.t1} onChange={e=>setAnswers({...answers, t1:e.target.value})} placeholder="Válasz..." />
               </div>
               
               {/* FELADAT 2 */}
               <div className="glass-card">
                  <div style={{color:'#ffff00', fontWeight:'bold'}}>2. KÍN-PAD</div>
                  <div style={{fontSize: '0.9em', color: '#aaa', marginBottom: '5px'}}>Betűk: {me.tasks.t2.letters}</div>
                  <p style={{fontSize: '1.2rem'}}>{me.tasks.t2.text}</p>
                  <input className="cyber-input" value={answers.t2} onChange={e=>setAnswers({...answers, t2:e.target.value})} placeholder="Válasz..." />
               </div>

                {/* FELADAT 4 */}
                <div className="glass-card">
                  <div style={{color:'#ff00de', fontWeight:'bold'}}>3. TRASH SZÓTÁR</div>
                  <p style={{fontSize: '1.2rem'}}>{me.tasks.t4.prompt}</p>
                  <h3 style={{textAlign:'center', letterSpacing:'5px', color:'#00f3ff'}}>{me.tasks.t4.letters}</h3>
                  <input className="cyber-input" value={answers.t4} onChange={e=>setAnswers({...answers, t4:e.target.value})} placeholder="Mi a rövidítés?" />
               </div>

               <button className="btn-action" onClick={handleSubmit} disabled={loading}>BEKÜLDÉS</button>
            </>
          )}

          {/* ======================= WAITING SCREENS ======================= */}
          {(screen === 'WAITING' || screen === 'WAITING_VOTE') && (
             <div style={{textAlign:'center', marginTop:'50px'}}>
                <h1 style={{fontSize:'5rem', margin:0}}>⏳</h1>
                <h2 className="glitch" data-text="LOADING...">LOADING...</h2>
                <p>A többiek lassúak...</p>
                
                {isHost && (
                   <div style={{marginTop: '40px', border: '1px dashed red', padding: '10px'}}>
                     <p style={{color: 'red', fontSize: '0.8rem'}}>HOST ZÓNA</p>
                     <button className="btn-action" style={{background:'red', fontSize:'1rem'}} onClick={handleForceNext}>
                        FORCE NEXT (PÁNIKGOMB)
                     </button>
                   </div>
                )}
             </div>
          )}

          {/* ======================= VOTING SCREEN ======================= */}
          {screen === 'VOTING' && target && (
             <>
                <div style={{textAlign:'center'}}>
                   <h3>ÉRTÉKELÉS:</h3>
                   <h1 className="glitch" data-text={target.name} style={{color:'#ff00de', fontSize:'3rem'}}>{target.name}</h1>
                   <div style={{color: '#888'}}>
                     {roomData.votingIndex + 1} / {roomData.votingPlayers.length}
                   </div>
                </div>

                <div className="glass-card">
                   <small style={{color:'#00f3ff'}}>SZITUÁCIÓ VÁLASZ:</small>
                   <div style={{fontSize:'1.3rem', marginBottom:'15px'}}>{target.answers?.t1 || "---"}</div>
                   
                   <hr style={{borderColor:'#333'}}/>
                   
                   <small style={{color:'#ffff00'}}>KÍN-PAD VÁLASZ:</small>
                   <div style={{fontSize:'1.3rem', marginBottom:'15px'}}>{target.answers?.t2 || "---"}</div>

                   <hr style={{borderColor:'#333'}}/>

                   <small style={{color:'#ff00de'}}>TRASH SZÓTÁR:</small>
                   <div style={{fontSize:'1.3rem'}}>{target.answers?.t4 || "---"}</div>
                </div>

                {target.name !== myName ? (
                   <div className="glass-card" style={{textAlign:'center'}}>
                      <div style={{fontSize:'2rem', color:'#ffff00'}}>{myVote} PONT</div>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={myVote} 
                        onChange={e=>setMyVote(parseInt(e.target.value))} 
                        style={{width:'100%', accentColor:'#ff00de', height: '30px'}} 
                      />
                      <button className="btn-action" onClick={handleVote} disabled={loading} style={{marginTop: '20px'}}>
                        SZAVAZOK
                      </button>
                   </div>
                ) : (
                   <div className="glass-card" style={{textAlign:'center', color:'#888', fontStyle: 'italic'}}>
                      Téged oltanak éppen... Várj türelemmel, amíg a többiek röhögnek.
                   </div>
                )}
             </>
          )}

          {/* ======================= LEADERBOARD SCREEN ======================= */}
          {screen === 'LEADERBOARD' && roomData && (
             <>
                <h1 className="glitch" data-text="VÉGEREDMÉNY" style={{textAlign:'center', color:'#ffff00'}}>VÉGEREDMÉNY</h1>
                
                {roomData.players
                  .sort((a,b) => (b.score || 0) - (a.score || 0))
                  .map((p,i) => (
                   <div key={p.name} className="glass-card" style={{
                      display:'flex', 
                      justifyContent:'space-between', 
                      alignItems: 'center',
                      borderColor: i===0 ? '#ffff00' : '#ff00de',
                      background: i===0 ? 'rgba(255, 221, 0, 0.1)' : undefined
                   }}>
                      <div style={{fontSize:'1.5rem'}}>
                        {i===0 && '🏆 '}
                        #{i+1} {p.name}
                      </div>
                      <div style={{fontSize:'2rem', fontWeight:'bold', color: i===0 ? '#ffff00' : 'white'}}>
                        {p.score}
                      </div>
                   </div>
                ))}
                
                {isHost && (
                  <button className="btn-action" onClick={handleStart} style={{marginTop: '30px'}}>
                    ÚJ KÖR INDÍTÁSA
                  </button>
                )}
             </>
          )}

          {/* CHAT MINDIG LÁTSZIK (kivéve menü) */}
          {screen !== 'MENU' && roomId && (
             <TrashChat roomId={roomId} playerName={myName} chatData={roomData?.chat} />
          )}

        </div>
      </div>
    </>
  );
}