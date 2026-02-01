// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, MeshDistortMaterial, Sparkles } from '@react-three/drei';

// KONFIG (CSERÉLD LE!)
const BACKEND_URL = "https://trash-backend.balazsnorberttt.workers.dev"; 
const POLL_INTERVAL = 1000;

// === 3D & NEON STÍLUSOK ===
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@600;800&display=swap');
  
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body { margin: 0; background: #080010; color: white; font-family: 'Rajdhani', sans-serif; overflow: hidden; }

  .app-layer { position: absolute; inset: 0; overflow-y: auto; padding: 15px; z-index: 10; perspective: 1000px; }
  .container { width: 100%; max-width: 550px; margin: 0 auto; padding-bottom: 100px; }

  /* 3D TEXT */
  .title-3d {
    font-family: 'Black Ops One', cursive;
    font-size: 3rem; text-align: center; margin: 20px 0; color: #fff;
    text-transform: uppercase; letter-spacing: 2px;
    text-shadow: 
      0 1px 0 #ff00de, 0 2px 0 #ff00de, 0 3px 0 #ff00de, 
      0 4px 0 #ff00de, 0 5px 0 #ff00de, 0 6px 0 #000,
      0 0 20px rgba(255,0,222,0.8);
    transform: rotateX(10deg);
  }

  /* 3D CARD */
  .card-3d {
    background: linear-gradient(135deg, rgba(20, 10, 30, 0.9), rgba(0, 0, 0, 0.95));
    border: 2px solid #00f3ff;
    border-radius: 15px;
    padding: 20px;
    margin-bottom: 30px;
    box-shadow: 0 10px 30px rgba(0, 243, 255, 0.2);
    transform-style: preserve-3d;
    transition: transform 0.3s ease;
    animation: floatIn 0.6s ease-out;
  }
  .card-3d:hover { transform: translateY(-5px) rotateX(2deg); box-shadow: 0 15px 40px rgba(0, 243, 255, 0.3); }
  @keyframes floatIn { from { opacity: 0; transform: translateY(50px) rotateX(10deg); } to { opacity: 1; transform: translateY(0) rotateX(0); } }

  .label { color: #ff00de; font-weight: 800; font-size: 1rem; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; text-shadow: 0 0 5px #ff00de; }
  
  .input-field {
    width: 100%; background: #111; border: 2px solid #333; color: #ffdd00;
    padding: 15px; font-size: 1.1rem; font-weight: bold; border-radius: 8px; margin-bottom: 15px;
    outline: none; transition: 0.3s;
  }
  .input-field:focus { border-color: #ff00de; box-shadow: 0 0 15px rgba(255,0,222,0.3); }

  /* 3D BUTTON */
  .btn-3d {
    width: 100%; padding: 15px; font-family: 'Black Ops One'; font-size: 1.3rem;
    text-transform: uppercase; border: none; border-radius: 8px;
    background: #ffdd00; color: black; cursor: pointer; margin-top: 10px;
    box-shadow: 0 6px 0 #b39b00, 0 10px 10px rgba(0,0,0,0.5);
    transition: 0.1s; transform: translateY(0);
  }
  .btn-3d:active { transform: translateY(6px); box-shadow: 0 0 0 #b39b00, 0 0 0 rgba(0,0,0,0.5); }
  .btn-3d:disabled { background: #555; box-shadow: none; color: #888; transform: translateY(6px); }

  /* CHAT */
  .chat-fab {
    position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px;
    background: #ff00de; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 20px #ff00de; z-index: 1000; cursor: pointer; font-size: 30px; border: 3px solid white;
  }
  .chat-window {
    position: fixed; bottom: 90px; right: 20px; width: 300px; height: 350px;
    background: rgba(0,0,0,0.95); border: 2px solid #ff00de; border-radius: 10px;
    display: flex; flex-direction: column; z-index: 999;
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

// --- HÁTTÉR ---
function CyberBg() {
  return (
    <div style={{position:'fixed', inset:0, zIndex:-1, background: 'linear-gradient(to bottom, #050010, #1a0020)'}}>
      <Canvas camera={{ position: [0, 0, 10] }}>
        <Stars count={2000} factor={3} />
        <Sparkles count={300} scale={10} size={5} speed={0.5} opacity={0.6} color="#00f3ff" />
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} color="#ff00de" intensity={3} />
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
           <mesh position={[4, -2, -5]}>
             <torusGeometry args={[2, 0.5, 16, 100]} />
             <MeshDistortMaterial color="#220033" wireframe distort={0.3} speed={2} />
           </mesh>
        </Float>
      </Canvas>
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
          <div style={{background:'#ff00de', padding:10, fontWeight:'bold', textAlign:'center', color:'black'}}>TRASH TALK</div>
          <div style={{flex:1, overflowY:'auto', padding:10}}>
            {chats?.map((c,i)=>(<div key={i} style={{marginBottom:5, borderBottom:'1px solid #333'}}><span style={{color:'#ff00de',fontWeight:'bold'}}>{c.name}:</span> <span style={{color:'white'}}>{c.text}</span></div>))}
            <div ref={endRef}/>
          </div>
          <div style={{display:'flex', padding:5}}>
            <input className="input-field" style={{marginBottom:0, padding:8}} value={txt} onChange={e=>setTxt(e.target.value)} placeholder="..." />
            <button className="btn-3d" style={{width:50, marginTop:0, padding:0, marginLeft:5}} onClick={send}>&gt;</button>
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

  // States: sztorihoz 3 rész (story_1, story_2, story_3)
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
  
  // Sztori összerakó segédfüggvény
  const buildStory = (taskData, userAnswers) => {
    if (!taskData || !taskData.template) return "Hiba: Nincs sztori adat.";
    let text = taskData.template;
    // Celebek behelyettesítése
    text = text.replace("{C1}", `<span style='color:#ff00de;font-weight:bold'>${taskData.celebs[0]}</span>`);
    text = text.replace("{C2}", `<span style='color:#ff00de;font-weight:bold'>${taskData.celebs[1]}</span>`);
    text = text.replace("{C3}", `<span style='color:#ff00de;font-weight:bold'>${taskData.celebs[2]}</span>`);
    // User válaszok behelyettesítése
    // JAVÍTÁS: Ellenőrizzük, hogy létezik-e a válasz, ha nem, "..."-t írunk
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
          {roomId && <div style={{textAlign:'center', marginBottom:15, color:'#aaa', background:'rgba(0,0,0,0.5)', padding:5, borderRadius:10}}>
            SZOBA: <span style={{color:'#ff00de'}}>{roomId}</span> | {name}
          </div>}
          
          {err && <div style={{background:'rgba(255,0,0,0.8)', padding:10, borderRadius:5, marginBottom:10, border:'2px solid red', fontWeight:'bold'}}>{err}</div>}

          {/* MENU */}
          {screen === 'MENU' && (
            <div style={{marginTop:'15vh', textAlign:'center'}}>
              <h1 className="title-3d">TRASH<br/>UNIVERSE</h1>
              <div className="card-3d">
                <div className="label">JÁTÉKOS NEVE</div>
                <input className="input-field" value={name} onChange={e=>setName(e.target.value)} placeholder="Neved..." />
                <button className="btn-3d" onClick={async ()=>{
                  if(!name)return; const d=await act('/create-room',{}); if(d.success){setRoomId(d.roomId);setData(d.roomData);setScreen('LOBBY');}
                }} disabled={load}>ÚJ JÁTÉK</button>
                <div style={{height:2, background:'#333', margin:'20px 0'}}></div>
                <div className="label">CSATLAKOZÁS KÓDDAL</div>
                <input className="input-field" value={joinCode} onChange={e=>setJoinCode(e.target.value)} type="number" placeholder="Kód..." />
                <button className="btn-3d" style={{background:'#00f3ff'}} onClick={async ()=>{
                   if(!name||!joinCode)return; const d=await api.post('/join-room',{roomId:joinCode, playerName:name});
                   if(d.success){setRoomId(joinCode);setData(d.roomData);setScreen('LOBBY');}else setErr(d.error);
                }} disabled={load}>BELÉPÉS</button>
              </div>
            </div>
          )}

          {/* LOBBY */}
          {screen === 'LOBBY' && data && (
            <div className="card-3d" style={{textAlign:'center'}}>
              <h2 className="title-3d" style={{fontSize:'2rem'}}>LOBBY</h2>
              <div style={{display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center', marginBottom:20}}>
                {data.players.map(p => (
                  <div key={p.name} style={{padding:'10px 15px', borderRadius:20, background:p.name===name?'#ff00de':'#333', fontWeight:'bold', boxShadow:'0 5px 10px rgba(0,0,0,0.5)'}}>
                    {p.isHost?'👑 ':''}{p.name}
                  </div>
                ))}
              </div>
              {me?.isHost ? <button className="btn-3d" onClick={()=>act('/start-round',{})} disabled={data.players.length<2}>INDÍTÁS 🚀</button> 
              : <div style={{color:'#00f3ff', animation:'pulse 1s infinite'}}>A Host indít...</div>}
            </div>
          )}

          {/* PLAYING - 4 FELADAT */}
          {screen === 'PLAYING' && me?.tasks && (
            <>
              <div className="title-3d" style={{fontSize:'2rem'}}>KÖR {data.currentRound}</div>

              <div className="card-3d">
                <div className="label">1. SZITUÁCIÓ ({me.tasks.t1.letters})</div>
                <p style={{fontSize:'1.1rem'}}>{me.tasks.t1.text}</p>
                <input className="input-field" value={ans.t1} onChange={e=>setAns({...ans,t1:e.target.value})} placeholder="Válasz..." />
              </div>

              <div className="card-3d">
                <div className="label">2. KÍN-PAD ({me.tasks.t2.letters})</div>
                <p style={{fontSize:'1.1rem'}}>{me.tasks.t2.text}</p>
                <input className="input-field" value={ans.t2} onChange={e=>setAns({...ans,t2:e.target.value})} placeholder="Válasz..." />
              </div>

              {/* ÚJ MAD LIBS FELADAT */}
              <div className="card-3d">
                <div className="label">3. SZTORI KIEGÉSZÍTÉS</div>
                <p style={{fontSize:'0.9rem', color:'#aaa'}}>Egészítsd ki a hiányzó részeket! A celebeket mi adjuk.</p>
                
                {/* A Promptok dinamikusak a sablon alapján */}
                <div style={{marginBottom:5, color:'#ff00de'}}>{me.tasks.t3.prompts[0]}</div>
                <input className="input-field" value={ans.story_1} onChange={e=>setAns({...ans,story_1:e.target.value})} />
                
                <div style={{marginBottom:5, color:'#ff00de'}}>{me.tasks.t3.prompts[1]}</div>
                <input className="input-field" value={ans.story_2} onChange={e=>setAns({...ans,story_2:e.target.value})} />
                
                <div style={{marginBottom:5, color:'#ff00de'}}>{me.tasks.t3.prompts[2]}</div>
                <input className="input-field" value={ans.story_3} onChange={e=>setAns({...ans,story_3:e.target.value})} />
              </div>

              <div className="card-3d">
                <div className="label">4. SZÓTÁR</div>
                <p>{me.tasks.t4.prompt}</p>
                <h1 style={{textAlign:'center', color:'#00f3ff', letterSpacing:5}}>{me.tasks.t4.letters}</h1>
                <input className="input-field" value={ans.t4} onChange={e=>setAns({...ans,t4:e.target.value})} placeholder="Feloldás..." />
              </div>

              <button className="btn-3d" onClick={async ()=>{const d=await act('/submit-answers',{answers:ans}); if(d.success)setScreen('WAIT');}}>KÉSZ! ✅</button>
            </>
          )}

          {/* WAITING */}
          {(screen === 'WAIT' || screen === 'WAIT_VOTE') && (
             <div style={{textAlign:'center', marginTop:'30vh'}}>
                <h1 style={{fontSize:'4rem'}}>⏳</h1>
                <h2 className="title-3d" style={{fontSize:'2rem'}}>VÁRAKOZÁS...</h2>
                {me?.isHost && <button className="btn-3d" style={{background:'red', color:'white', width:'auto', padding:'10px 30px'}} onClick={()=>act('/force-next',{})}>FORCE NEXT</button>}
             </div>
          )}

          {/* VOTING - FIX: MOST MÁR LÁTSZIK A VÁLASZ */}
          {screen === 'VOTING' && target && (
            <>
              <div style={{textAlign:'center'}}>
                <div style={{color:'#888'}}>ÉRTÉKELÉS ({data.votingIndex+1}/{data.votingPlayers.length})</div>
                <h1 className="title-3d" style={{fontSize:'2.5rem', color:'#ff00de', textShadow:'0 3px 0 #fff'}}>{target.name}</h1>
              </div>

              <div className="card-3d">
                <div className="label">1. SZITUÁCIÓ</div>
                <div style={{fontSize:'1.2rem', color:'#fff'}}>{target.answers?.t1 || "..."}</div>
                {target.name!==name && <input type="range" min="1" max="10" value={votes.t1} onChange={e=>setVotes({...votes,t1:parseInt(e.target.value)})} />}
              </div>

              <div className="card-3d">
                <div className="label">2. KÍN-PAD</div>
                <div style={{fontSize:'1.2rem', color:'#fff'}}>{target.answers?.t2 || "..."}</div>
                {target.name!==name && <input type="range" min="1" max="10" value={votes.t2} onChange={e=>setVotes({...votes,t2:parseInt(e.target.value)})} />}
              </div>

              {/* SZTORI ÖSSZERAKÁSA (MAD LIBS) */}
              <div className="card-3d">
                <div className="label">3. SZTORI</div>
                <div style={{fontSize:'1.1rem', lineHeight:1.5}} 
                  dangerouslySetInnerHTML={{ __html: buildStory(target.tasks?.t3, target.answers) }}>
                </div>
                {target.name!==name && <input type="range" min="1" max="10" value={votes.t3} onChange={e=>setVotes({...votes,t3:parseInt(e.target.value)})} />}
              </div>

              <div className="card-3d">
                <div className="label">4. SZÓTÁR ({target.tasks?.t4?.letters})</div>
                <div style={{fontSize:'1.2rem', color:'#fff'}}>{target.answers?.t4 || "..."}</div>
                {target.name!==name && <input type="range" min="1" max="10" value={votes.t4} onChange={e=>setVotes({...votes,t4:parseInt(e.target.value)})} />}
              </div>

              {target.name!==name ? (
                <div className="card-3d" style={{position:'sticky', bottom:20, zIndex:50, border:'2px solid #ffdd00'}}>
                   <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div style={{fontWeight:'bold', color:'#ffdd00', fontSize:'1.2rem'}}>SUM: {votes.t1+votes.t2+votes.t3+votes.t4}</div>
                      <button className="btn-3d" style={{width:'auto', margin:0}} onClick={async ()=>{
                         const d=await act('/submit-vote',{votes}); if(d.success && !d.allVoted)setScreen('WAIT_VOTE');
                      }}>SZAVAZÁS</button>
                   </div>
                </div>
              ) : <div className="card-3d" style={{textAlign:'center', color:'#888'}}>Téged értékelnek...</div>}
            </>
          )}

          {/* LEADERBOARD */}
          {screen === 'LEADERBOARD' && data && (
            <div className="card-3d">
              <h1 className="title-3d" style={{color:'#ffdd00'}}>VÉGEREDMÉNY</h1>
              {data.players.sort((a,b)=>b.score-a.score).map((p,i)=>(
                 <div key={p.name} style={{
                    display:'flex', justifyContent:'space-between', padding:15, margin:'10px 0', borderRadius:10,
                    background: i===0?'#ffdd00':'rgba(255,255,255,0.1)', color: i===0?'black':'white', fontWeight:'bold'
                 }}>
                    <span>#{i+1} {p.name}</span><span>{p.score}</span>
                 </div>
              ))}
              {me?.isHost && <button className="btn-3d" onClick={()=>act('/start-round',{})}>ÚJ KÖR</button>}
            </div>
          )}

        </div>
        <FloatingChat roomId={roomId} name={name} chats={data?.chat} />
      </div>
    </>
  );
}