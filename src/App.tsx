// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, Float, MeshDistortMaterial } from '@react-three/drei';

// CONFIG (IDE ÍRD A SAJÁT URL-EDET!)
const BACKEND_URL = "https://trash-backend.balazsnorberttt.workers.dev";
const POLL_INTERVAL = 1000;

// MOBILBARÁT CSS
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap');
  
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  
  body { 
    margin: 0; 
    background: #0a0a0a; 
    color: white; 
    font-family: 'Rajdhani', sans-serif;
    overflow: hidden; /* Prevent body scroll, handle in app-layer */
  }

  .app-layer {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    overflow-y: auto; /* Enable scroll */
    -webkit-overflow-scrolling: touch; /* Smooth iOS scroll */
    padding: 10px;
    z-index: 10;
  }

  .container {
    width: 100%;
    max-width: 500px; /* Mobilra optimalizált szélesség */
    margin: 0 auto;
    padding-bottom: 50px;
  }

  /* KÁRTYA DESIGN MOBILRA */
  .card {
    background: rgba(20, 20, 25, 0.95);
    border: 1px solid #ff00de;
    border-radius: 12px;
    padding: 15px;
    margin-bottom: 20px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
  }

  .title { font-size: 1.8rem; text-align: center; margin: 10px 0; color: #ff00de; text-transform: uppercase; }
  .label { color: #00f3ff; font-size: 0.9rem; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
  
  /* INPUTOK MOBILRA (16px hogy ne zoomoljon iOS) */
  .input-field {
    width: 100%;
    background: #111;
    border: 1px solid #444;
    color: #ffdd00;
    padding: 12px;
    font-size: 16px; 
    border-radius: 8px;
    margin-bottom: 10px;
    outline: none;
  }
  .input-field:focus { border-color: #00f3ff; }

  /* GOMBOK */
  .btn {
    width: 100%;
    padding: 15px;
    font-size: 1.2rem;
    font-weight: bold;
    text-transform: uppercase;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, #ff00de, #9900cc);
    color: white;
    cursor: pointer;
    margin-top: 10px;
  }
  .btn:active { transform: scale(0.98); }
  .btn:disabled { background: #444; opacity: 0.7; }

  /* CHAT */
  .chat-container {
    background: rgba(0,0,0,0.8);
    border-top: 2px solid #333;
    padding: 10px;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    max-width: 500px;
    margin: 0 auto;
    z-index: 100;
  }
  .chat-list {
    height: 100px;
    overflow-y: auto;
    font-size: 0.9rem;
    margin-bottom: 5px;
  }
  .msg { margin-bottom: 4px; border-bottom: 1px solid #222; }
  .msg-name { color: #ff00de; font-weight: bold; margin-right: 5px; }
  .msg-text { color: #ddd; }

  /* RANGE SLIDER */
  input[type=range] {
    width: 100%;
    height: 25px;
    accent-color: #ff00de;
    cursor: pointer;
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

// 3D HÁTTÉR (Könnyített)
function Bg() {
  return (
    <div style={{position:'fixed', inset:0, zIndex:-1, opacity: 0.6}}>
      <Canvas>
        <Stars count={2000} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10,10,10]} color="#ff00de" />
        <Float speed={2}><mesh position={[0,0,-5]}><dodecahedronGeometry args={[2]} /><MeshDistortMaterial color="#220033" wireframe /></mesh></Float>
      </Canvas>
    </div>
  );
}

// CHAT
function Chat({ roomId, name, chats }) {
  const [txt, setTxt] = useState("");
  const endRef = useRef(null);
  useEffect(()=> endRef.current?.scrollIntoView(), [chats]);
  const send = async () => { if(!txt.trim())return; await api.post('/send-message',{roomId, playerName:name, message:txt}); setTxt(""); };
  
  return (
    <div className="chat-container">
      <div className="chat-list">
        {chats?.map((c,i)=>(<div key={i} className="msg"><span className="msg-name">{c.name}:</span><span className="msg-text">{c.text}</span></div>))}
        <div ref={endRef}/>
      </div>
      <div style={{display:'flex', gap:'5px'}}>
        <input className="input-field" style={{marginBottom:0}} value={txt} onChange={e=>setTxt(e.target.value)} placeholder="Üzenet..." />
        <button className="btn" style={{width:'60px', marginTop:0, padding:'5px'}} onClick={send}>&gt;</button>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState('MENU');
  const [roomId, setRoomId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [name, setName] = useState('');
  const [data, setData] = useState(null);
  const [load, setLoad] = useState(false);
  const [err, setErr] = useState(null);

  // GAME STATES
  const [ans, setAns] = useState({ t1:"", t2:"", t3_1:"", t3_2:"", t4:"" });
  // Részletes szavazás: külön pontszám minden feladatra
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
          setScreen('PLAYING'); setAns({t1:"", t2:"", t3_1:"", t3_2:"", t4:""});
        }
        if(ph === 'VOTING' && screen !== 'VOTING' && screen !== 'WAIT_VOTE') {
          setScreen('VOTING'); setVotes({t1:5, t2:5, t3:5, t4:5}); // Reset votes
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
  
  // Összpontszám számolása (kliens oldali kijelzéshez)
  const currentTotalScore = votes.t1 + votes.t2 + votes.t3 + votes.t4;

  return (
    <>
      <style>{STYLES}</style>
      <Bg />
      <div className="app-layer">
        <div className="container">
          
          {/* HEADER */}
          {roomId && <div style={{textAlign:'center', marginBottom:10, fontSize:'0.8rem', color:'#888'}}>SZOBA: {roomId} | {name}</div>}
          {err && <div style={{background:'red', padding:10, borderRadius:5, marginBottom:10}}>{err} <button onClick={()=>setErr(null)} style={{background:'none',border:'none',color:'white',float:'right'}}>X</button></div>}

          {/* MENU */}
          {screen === 'MENU' && (
            <div className="card" style={{marginTop:'20vh'}}>
              <h1 className="title">TRASH UNIVERSE</h1>
              <div className="label">JÁTÉKOS NEVE</div>
              <input className="input-field" value={name} onChange={e=>setName(e.target.value)} placeholder="Pl: Gipsz Jakab" />
              <button className="btn" onClick={async ()=>{
                if(!name)return; 
                const d = await act('/create-room',{});
                if(d.success){ setRoomId(d.roomId); setData(d.roomData); setScreen('LOBBY'); }
              }} disabled={load}>ÚJ JÁTÉK INDÍTÁSA</button>
              
              <div style={{textAlign:'center', margin:'20px 0', color:'#444'}}>- VAGY -</div>
              
              <div className="label">SZOBA KÓD</div>
              <input className="input-field" value={joinCode} onChange={e=>setJoinCode(e.target.value)} type="number" placeholder="Pl: 1234" />
              <button className="btn" style={{background:'#333'}} onClick={async ()=>{
                 if(!name || !joinCode)return;
                 const d = await api.post('/join-room',{roomId:joinCode, playerName:name});
                 if(d.success){ setRoomId(joinCode); setData(d.roomData); setScreen('LOBBY'); } else setErr(d.error);
              }} disabled={load}>CSATLAKOZÁS</button>
            </div>
          )}

          {/* LOBBY */}
          {screen === 'LOBBY' && data && (
            <div className="card">
              <h2 className="title">VÁRÓTEREM</h2>
              <div style={{marginBottom:20}}>
                {data.players.map(p => (
                  <div key={p.name} style={{padding:10, borderBottom:'1px solid #333', color: p.name===name?'#ff00de':'white'}}>
                    {p.isHost ? '👑 ' : '👤 '} {p.name}
                  </div>
                ))}
              </div>
              {me?.isHost ? (
                <button className="btn" onClick={()=>act('/start-round',{})} disabled={data.players.length<2}>INDÍTÁS</button>
              ) : <div style={{textAlign:'center', color:'#888'}}>A Host hamarosan indít...</div>}
            </div>
          )}

          {/* PLAYING - 4 FELADAT */}
          {screen === 'PLAYING' && me?.tasks && (
            <>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}>
                <span style={{color:'#ff00de', fontWeight:'bold'}}>KÖR: {data.currentRound}/{data.totalRounds}</span>
              </div>

              {/* T1 */}
              <div className="card">
                <div className="label">1. SZITUÁCIÓ ({me.tasks.t1.letters})</div>
                <p>{me.tasks.t1.text}</p>
                <input className="input-field" value={ans.t1} onChange={e=>setAns({...ans,t1:e.target.value})} />
              </div>

              {/* T2 */}
              <div className="card">
                <div className="label">2. KÍN-PAD ({me.tasks.t2.letters})</div>
                <p>{me.tasks.t2.text}</p>
                <input className="input-field" value={ans.t2} onChange={e=>setAns({...ans,t2:e.target.value})} />
              </div>

              {/* T3 - SZTORILÁNC */}
              <div className="card">
                <div className="label">3. SZTORILÁNC</div>
                <div style={{background:'#222', padding:5, borderRadius:4, marginBottom:5}}>{me.tasks.t3.celebs[0]}</div>
                <input className="input-field" placeholder="Mit csinált vele?" value={ans.t3_1} onChange={e=>setAns({...ans,t3_1:e.target.value})} />
                <div style={{background:'#222', padding:5, borderRadius:4, marginBottom:5}}>{me.tasks.t3.celebs[1]}</div>
                <input className="input-field" placeholder="Mi történt utána?" value={ans.t3_2} onChange={e=>setAns({...ans,t3_2:e.target.value})} />
                <div style={{background:'#222', padding:5, borderRadius:4, marginBottom:5}}>{me.tasks.t3.celebs[2]}</div>
              </div>

              {/* T4 */}
              <div className="card">
                <div className="label">4. TRASH SZÓTÁR</div>
                <p>{me.tasks.t4.prompt}</p>
                <h3 style={{textAlign:'center', color:'#00f3ff', letterSpacing:3}}>{me.tasks.t4.letters}</h3>
                <input className="input-field" value={ans.t4} onChange={e=>setAns({...ans,t4:e.target.value})} placeholder="Rövidítés feloldása..." />
              </div>

              <button className="btn" onClick={async ()=>{
                 const d = await act('/submit-answers',{answers:ans});
                 if(d.success) setScreen('WAIT');
              }}>KÉSZ VAGYOK</button>
            </>
          )}

          {/* VÁRAKOZÁS */}
          {(screen === 'WAIT' || screen === 'WAIT_VOTE') && (
            <div className="card" style={{textAlign:'center', padding:40}}>
              <h1>⏳</h1>
              <h3>TÜRELEM...</h3>
              <p>A többiek még írnak/olvasnak.</p>
              {me?.isHost && (
                <button className="btn" style={{background:'red', marginTop:30, fontSize:'0.8rem'}} 
                  onClick={()=>act('/force-next',{})}>FORCE NEXT (PÁNIKGOMB)</button>
              )}
            </div>
          )}

          {/* VOTING - RÉSZLETES */}
          {screen === 'VOTING' && target && (
            <>
              <div style={{textAlign:'center', marginBottom:15}}>
                <h2 style={{color:'#ff00de', margin:0}}>{target.name}</h2>
                <small style={{color:'#888'}}>értékelése</small>
              </div>

              {/* T1 VOTE */}
              <div className="card">
                <div className="label">1. SZITUÁCIÓ VÁLASZ</div>
                <div style={{fontSize:'1.1rem', marginBottom:10}}>{target.answers?.t1 || "---"}</div>
                {target.name !== name && (
                  <div>
                    <input type="range" min="1" max="10" value={votes.t1} onChange={e=>setVotes({...votes, t1:parseInt(e.target.value)})} />
                    <div style={{textAlign:'right', color:'#ff00de'}}>{votes.t1} pont</div>
                  </div>
                )}
              </div>

              {/* T2 VOTE */}
              <div className="card">
                <div className="label">2. KÍN-PAD VÁLASZ</div>
                <div style={{fontSize:'1.1rem', marginBottom:10}}>{target.answers?.t2 || "---"}</div>
                {target.name !== name && (
                  <div>
                    <input type="range" min="1" max="10" value={votes.t2} onChange={e=>setVotes({...votes, t2:parseInt(e.target.value)})} />
                    <div style={{textAlign:'right', color:'#ff00de'}}>{votes.t2} pont</div>
                  </div>
                )}
              </div>

              {/* T3 VOTE */}
              <div className="card">
                <div className="label">3. SZTORILÁNC</div>
                <div style={{fontSize:'0.9rem', color:'#aaa'}}>
                  {target.tasks?.t3?.celebs?.[0]} <br/>
                  <span style={{color:'white', fontSize:'1.1rem'}}>{target.answers?.t3_1 || "..."}</span> <br/>
                  {target.tasks?.t3?.celebs?.[1]} <br/>
                  <span style={{color:'white', fontSize:'1.1rem'}}>{target.answers?.t3_2 || "..."}</span> <br/>
                  {target.tasks?.t3?.celebs?.[2]}
                </div>
                {target.name !== name && (
                  <div style={{marginTop:10}}>
                    <input type="range" min="1" max="10" value={votes.t3} onChange={e=>setVotes({...votes, t3:parseInt(e.target.value)})} />
                    <div style={{textAlign:'right', color:'#ff00de'}}>{votes.t3} pont</div>
                  </div>
                )}
              </div>

              {/* T4 VOTE */}
              <div className="card">
                <div className="label">4. TRASH SZÓTÁR</div>
                <div style={{color:'#00f3ff'}}>{target.tasks?.t4?.letters}</div>
                <div style={{fontSize:'1.1rem', marginBottom:10}}>{target.answers?.t4 || "---"}</div>
                {target.name !== name && (
                  <div>
                    <input type="range" min="1" max="10" value={votes.t4} onChange={e=>setVotes({...votes, t4:parseInt(e.target.value)})} />
                    <div style={{textAlign:'right', color:'#ff00de'}}>{votes.t4} pont</div>
                  </div>
                )}
              </div>

              {target.name !== name ? (
                <div className="card" style={{position:'sticky', bottom:70, zIndex:20, border:'2px solid white'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span style={{fontWeight:'bold'}}>ÖSSZESEN: {currentTotalScore} pont</span>
                    <button className="btn" style={{width:'auto', margin:0}} onClick={async ()=>{
                      const d = await act('/submit-vote', {votes}); // Küldjük az objektumot
                      if(d.success && !d.allVoted) setScreen('WAIT_VOTE');
                    }}>KÜLDÉS</button>
                  </div>
                </div>
              ) : (
                <div className="card" style={{textAlign:'center', color:'#888'}}>
                  Téged értékelnek éppen...
                </div>
              )}
            </>
          )}

          {/* LEADERBOARD */}
          {screen === 'LEADERBOARD' && data && (
            <div className="card">
              <h1 className="title">VÉGEREDMÉNY</h1>
              {data.players.sort((a,b)=>b.score-a.score).map((p,i)=>(
                <div key={p.name} style={{display:'flex', justifyContent:'space-between', padding:15, borderBottom:'1px solid #333', fontSize:'1.2rem', color: i===0?'#ffdd00':'white'}}>
                  <span>#{i+1} {p.name}</span>
                  <b>{p.score}</b>
                </div>
              ))}
              {me?.isHost && <button className="btn" onClick={()=>act('/start-round',{})}>ÚJ KÖR</button>}
            </div>
          )}

        </div>
        
        {/* CHAT mindig alul */}
        {screen!=='MENU' && roomId && <Chat roomId={roomId} name={name} chats={data?.chat} />}
      </div>
    </>
  );
}