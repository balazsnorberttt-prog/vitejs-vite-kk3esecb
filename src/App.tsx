import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { Canvas } from '@react-three/fiber';
import { Stars, Sphere, MeshDistortMaterial } from '@react-three/drei';

// ==========================================
// 1. CSS (MOBILBARÁT & NEON)
// ==========================================
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@500;700;900&display=swap');
  
  body { margin: 0; background: #000; overflow: hidden; font-family: 'Rajdhani', sans-serif; color: white; }
  
  /* UI LAYER */
  .app-layer { position: absolute; inset: 0; display: flex; flex-direction: column; z-index: 10; overflow-y: auto; }
  
  /* CÍMSOR */
  .top-bar {
    padding: 15px; background: rgba(0,0,0,0.8); border-bottom: 2px solid #ff00de;
    display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100;
  }
  .room-code { font-family: 'Black Ops One'; font-size: 1.5rem; color: #ffdd00; }
  
  /* KONTÉNEREK */
  .container { padding: 20px; max-width: 600px; margin: 0 auto; width: 100%; box-sizing: border-box; }
  
  /* LOBBY */
  .lobby-list { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
  .player-tag { background: #333; padding: 10px 15px; border-radius: 20px; border: 1px solid #ff00de; font-weight: bold; }
  .player-tag.me { background: #ff00de; color: black; }

  /* KÁRTYÁK */
  .glass-card {
    background: rgba(20, 20, 30, 0.85); border: 1px solid rgba(255,255,255,0.2);
    border-radius: 12px; padding: 20px; margin-bottom: 20px; backdrop-filter: blur(10px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.5);
  }
  .task-label { color: #00f3ff; font-weight: 900; letter-spacing: 1px; margin-bottom: 5px; text-transform: uppercase; }
  .highlight { color: #ffdd00; font-weight: bold; text-decoration: underline; }
  
  /* INPUT */
  .cyber-input {
    width: 100%; padding: 15px; background: rgba(0,0,0,0.5); border: 2px solid #444;
    color: #ff00de; font-family: 'Rajdhani'; font-size: 1.2rem; font-weight: bold;
    border-radius: 8px; text-align: center; outline: none; margin-top: 10px; box-sizing: border-box;
  }
  .cyber-input:focus { border-color: #ff00de; box-shadow: 0 0 15px rgba(255, 0, 222, 0.3); }

  /* GOMBOK */
  .btn-action {
    width: 100%; padding: 20px; background: #00f3ff; color: black; font-family: 'Black Ops One';
    font-size: 1.5rem; border: none; border-radius: 50px; cursor: pointer; margin-top: 20px;
    text-transform: uppercase; box-shadow: 0 0 20px rgba(0, 243, 255, 0.4);
  }
  .btn-secondary { background: #333; color: white; border: 1px solid white; }

  /* SZTORILÁNC */
  .chain-row { display: flex; flex-direction: column; gap: 10px; }
  .chain-step { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 8px; }
  .pill { background: #ff00de; padding: 5px 10px; border-radius: 4px; font-weight: bold; font-size: 0.9rem; min-width: 80px; text-align: center; color: white; }

  /* MENU SCREEN */
  .menu { height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
  .title { font-size: 4rem; color: #ff00de; font-family: 'Black Ops One'; line-height: 0.9; margin-bottom: 20px; text-shadow: 0 0 20px #ff00de; }
`;

// ==========================================
// 2. ADATBÁZIS
// ==========================================
const TRASH_CELEBS = ["Tóth Gabi", "Alekosz", "Varga Irén", "Szájer", "BKV ellenőr", "GLS futár", "Berki szelleme", "Orbán", "Gyurcsány", "Zacher Gábor", "Kis Grófo", "Pumped Gabo", "Dancsó", "Whisper Ton", "Szomszéd néni", "MC Isti", "Bartos Cs.", "Gáspár Laci", "Kanos tini", "OnlyFans modell", "Korda Gyuri", "Zimány Linda", "Nőgyógyász", "PSG Ogli", "Hajdú Péter", "Mandula Ádám", "Részeg pap", "Fekete Pákó", "Németh Szilárd", "Curtis", "NAV ellenőr"];
const TEMPLATES = ["A Blahán {WHO} ...-t csinál a szökőkútban.", "{WHO} a 4-es 6-oson elad egy ...-t.", "A Parlamentben {WHO} ...-al keni be magát.", "Az első randin {WHO} elővett egy ...-t.", "A ravatalozóban {WHO} elejtett egy ...-t.", "{WHO} a toi-toi vécében ...-t húz le.", "A templomban {WHO} az oltárra tett egy ...-t.", "A szülőin {WHO} ...-t rajzolt a táblára.", "{WHO} részegen ...-t tetováltatott.", "A vonaton {WHO} ...-t dobált.", "{WHO} az OnlyFans-en ...-t dugott a fülébe."];
const QUESTIONS = ["Maszturbálás közben ezt kiabáltad:", "A proktológusnak ezt súgtad:", "Ha rajtakapnak egy kecskével:", "Szex után ezt mondod:", "Istennek ezt mondanád:", "A bíróságon ezzel védekeznél:", "Sírkövedre ezt írnád:", "Ha a párod meztelen, ezt mondod:", "Ha Tóth Gabi megkérné a kezed:", "Ha a futár látja a szexjátékod:"];
const LETTERS = "ABDEFGHKLMNPRSTVZ";

const getLetters = () => {
  let res = "";
  for(let i=0; i<3; i++) res += LETTERS[Math.floor(Math.random() * LETTERS.length)] + " ";
  return res.trim().replace(/ /g, " - ");
};

const generateTasks = () => {
  const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
  const celeb = getRandom(TRASH_CELEBS);
  const t1_text = getRandom(TEMPLATES).replace("{WHO}", `<span class="highlight">${celeb}</span>`);
  return {
    t1: { text: t1_text, letters: getLetters() },
    t2: { text: getRandom(QUESTIONS), letters: getLetters() },
    t3: { celebs: [getRandom(TRASH_CELEBS), getRandom(TRASH_CELEBS), getRandom(TRASH_CELEBS)] }
  };
};

// ==========================================
// 3. LOGIKA (MULTIPLAYER)
// ==========================================
export default function App() {
  const [view, setView] = useState('MENU');
  const [role, setRole] = useState<'HOST' | 'CLIENT' | null>(null);
  const [myId, setMyId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [myName, setMyName] = useState('');
  
  const [players, setPlayers] = useState<any[]>([]);
  const [votingIndex, setVotingIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const [myTasks, setMyTasks] = useState<any>(null);
  const [myAnswers, setMyAnswers] = useState<any>({ t1: "", t2: "", t3_1: "", t3_2: "" });
  const [votingData, setVotingData] = useState<any>(null);
  const [myVote, setMyVote] = useState(5);

  const peerRef = useRef<Peer>(null!);
  const connsRef = useRef<any[]>([]);

  useEffect(() => {
    const peer = new Peer();
    peer.on('open', (id) => setMyId(id));
    peer.on('connection', (conn) => {
      conn.on('data', (data: any) => handleDataHost(conn, data));
      connsRef.current.push(conn);
    });
    peerRef.current = peer;
    return () => peer.destroy();
  }, []);

  const createRoom = () => {
    if (!myName) return alert("Írj be egy nevet!");
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const newPeer = new Peer(code);
    
    newPeer.on('open', (id) => {
      setRoomId(id);
      setRole('HOST');
      setPlayers([{ id: id, name: myName, score: 0, tasks: null, answers: null }]);
      setView('LOBBY');
    });

    newPeer.on('connection', (conn) => {
      connsRef.current.push(conn);
      conn.on('data', (data) => handleDataHost(conn, data));
    });
    
    if(peerRef.current) peerRef.current.destroy();
    peerRef.current = newPeer;
  };

  const handleDataHost = (conn: any, data: any) => {
    if (data.type === 'JOIN') {
      setPlayers(prev => {
        const newList = [...prev, { id: conn.peer, name: data.name, score: 0, tasks: null, answers: null }];
        broadcast(newList, 'UPDATE_PLAYERS');
        return newList;
      });
    }
    if (data.type === 'SUBMIT_ANSWERS') {
      setPlayers(prev => prev.map(p => p.id === conn.peer ? { ...p, answers: data.answers } : p));
    }
    if (data.type === 'SUBMIT_VOTE') {
      addScoreToCurrent(data.value);
    }
  };

  const addScoreToCurrent = (points: number) => {
    setPlayers(prev => {
      const newList = [...prev];
      if(newList[votingIndex]) {
        newList[votingIndex].score += points;
      }
      return newList;
    });
  };

  const broadcast = (payload: any, type: string) => {
    connsRef.current.forEach(conn => conn.send({ type, payload }));
  };

  const startGameHost = () => {
    const updatedPlayers = players.map(p => ({ ...p, tasks: generateTasks(), answers: null }));
    setPlayers(updatedPlayers);
    
    connsRef.current.forEach(conn => {
      const pData = updatedPlayers.find(p => p.id === conn.peer);
      if (pData) conn.send({ type: 'START_GAME', tasks: pData.tasks });
    });
    
    const hostData = updatedPlayers.find(p => p.id === roomId);
    if(hostData) setMyTasks(hostData.tasks);

    setView('PLAYING');
    setTimeLeft(120);
  };

  const joinRoom = () => {
    if (!joinCode || !myName) return alert("Név és Kód kell!");
    const conn = peerRef.current.connect(joinCode);
    
    conn.on('open', () => {
      setRole('CLIENT');
      setRoomId(joinCode);
      conn.send({ type: 'JOIN', name: myName });
      setView('LOBBY');
    });

    conn.on('data', (data: any) => {
      if (data.type === 'UPDATE_PLAYERS') setPlayers(data.payload);
      if (data.type === 'START_GAME') { setMyTasks(data.tasks); setView('PLAYING'); setTimeLeft(120); }
      if (data.type === 'VOTE_PHASE') { setVotingData(data.targetPlayer); setView('VOTING'); setMyVote(5); }
      if (data.type === 'SHOW_LEADERBOARD') { setPlayers(data.players); setView('LEADERBOARD'); }
    });
    
    // @ts-ignore
    connsRef.current = [conn];
  };

  const sendToHost = (type: string, payload?: any) => {
    // @ts-ignore
    connsRef.current[0].send({ type, ...payload });
  };

  useEffect(() => {
    if (view !== 'PLAYING') return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { 
          if (role === 'HOST') startVotingPhase();
          return 0; 
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [view, role]);

  const submitMyAnswers = () => {
    if (role === 'HOST') {
      setPlayers(prev => prev.map(p => p.id === roomId ? { ...p, answers: myAnswers } : p));
      setView('WAITING');
    } else {
      sendToHost('SUBMIT_ANSWERS', { answers: myAnswers });
      setView('WAITING');
    }
  };

  const startVotingPhase = () => {
    setVotingIndex(0);
    broadcastVoting(0);
  };

  const broadcastVoting = (index: number) => {
    if (index >= players.length) {
      broadcast({ players }, 'SHOW_LEADERBOARD');
      setView('LEADERBOARD');
      return;
    }
    
    const target = players[index];
    setVotingData(target);
    setView('VOTING');
    setMyVote(5);

    broadcast(target, 'VOTE_PHASE');
  };

  const submitVote = () => {
    if (role === 'HOST') {
      addScoreToCurrent(parseInt(String(myVote)));
      const nextIdx = votingIndex + 1;
      setVotingIndex(nextIdx);
      setTimeout(() => broadcastVoting(nextIdx), 500);
    } else {
      sendToHost('SUBMIT_VOTE', { value: parseInt(String(myVote)) });
      setView('WAITING_NEXT_VOTE');
    }
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="app-layer">
        
        <div style={{position:'absolute', inset:0, zIndex:-1}}>
           <Canvas>
             <ambientLight intensity={0.5} />
             <pointLight position={[10,10,10]} color="#ff00de" />
             <Stars radius={100} count={5000} factor={4} fade />
             <Sphere args={[1,32,32]} position={[0,0,-5]} scale={[2,2,2]}>
               <MeshDistortMaterial color="#220022" distort={0.6} speed={2} />
             </Sphere>
           </Canvas>
        </div>

        {view === 'MENU' && (
          <div className="menu">
            <h1 className="title">TRASH<br/>HUNGARY</h1>
            <input className="cyber-input" style={{maxWidth:'300px'}} placeholder="NEVED" value={myName} onChange={e=>setMyName(e.target.value)} />
            
            <button className="btn-action" style={{position:'relative', maxWidth:'300px', marginTop:'40px'}} onClick={createRoom}>
              ÚJ SZOBA LÉTREHOZÁSA
            </button>
            
            <p style={{margin:'20px'}}>VAGY</p>
            
            <input className="cyber-input" style={{maxWidth:'300px'}} placeholder="SZOBA KÓDJA" value={joinCode} onChange={e=>setJoinCode(e.target.value)} />
            <button className="btn-action btn-secondary" style={{position:'relative', maxWidth:'300px', padding:'15px'}} onClick={joinRoom}>
              CSATLAKOZÁS
            </button>
          </div>
        )}

        {view === 'LOBBY' && (
          <div className="container">
            <h1 className="title" style={{fontSize:'3rem'}}>LOBBY</h1>
            <div style={{textAlign:'center', marginBottom:'20px'}}>
              <span style={{color:'#aaa'}}>SZOBA KÓD:</span>
              <div className="room-code" style={{fontSize:'4rem'}}>{roomId}</div>
            </div>
            
            <div className="lobby-list">
              {players.map(p => (
                <div key={p.id} className={`player-tag ${p.id === myId ? 'me' : ''}`}>{p.name}</div>
              ))}
            </div>

            {role === 'HOST' ? (
              <button className="btn-action" onClick={startGameHost}>JÁTÉK INDÍTÁSA ({players.length})</button>
            ) : (
              <p style={{textAlign:'center', marginTop:'50px', animation:'pulse 1s infinite'}}>A Host hamarosan indít...</p>
            )}
          </div>
        )}

        {view === 'PLAYING' && myTasks && (
          <div className="container">
            <div className="top-bar">
               <div>{myName}</div>
               <div className="room-code" style={{color: timeLeft<10?'red':'white'}}>{timeLeft}</div>
            </div>

            <div className="glass-card">
              <div className="task-label">1. SZITUÁCIÓ</div>
              <div style={{marginBottom:'10px'}} dangerouslySetInnerHTML={{__html: myTasks.t1.text.replace("...", "_______")}} />
              <div style={{color:'#ffdd00', fontSize:'0.8rem'}}>BETŰK: {myTasks.t1.letters}</div>
              <input className="cyber-input" value={myAnswers.t1} onChange={e=>setMyAnswers({...myAnswers, t1: e.target.value})} />
            </div>

            <div className="glass-card">
              <div className="task-label">2. KÍN-PAD</div>
              <div style={{marginBottom:'10px'}}>{myTasks.t2.text}</div>
              <div style={{color:'#ffdd00', fontSize:'0.8rem'}}>BETŰK: {myTasks.t2.letters}</div>
              <input className="cyber-input" value={myAnswers.t2} onChange={e=>setMyAnswers({...myAnswers, t2: e.target.value})} />
            </div>

            <div className="glass-card">
              <div className="task-label">3. SZTORILÁNC</div>
              <div className="chain-row">
                 <div className="chain-step"><div className="pill">{myTasks.t3.celebs[0]}</div> <span>mit csinált?</span></div>
                 <input className="cyber-input" style={{marginTop:0}} value={myAnswers.t3_1} onChange={e=>setMyAnswers({...myAnswers, t3_1: e.target.value})} />
                 
                 <div className="chain-step"><div className="pill" style={{background:'#00f3ff', color:'black'}}>{myTasks.t3.celebs[1]}</div> <span>mit reagált?</span></div>
                 <input className="cyber-input" style={{marginTop:0}} value={myAnswers.t3_2} onChange={e=>setMyAnswers({...myAnswers, t3_2: e.target.value})} />
                 
                 <div className="chain-step"><div className="pill" style={{background:'#ffdd00', color:'black'}}>{myTasks.t3.celebs[2]}</div></div>
              </div>
            </div>

            <button className="btn-action" style={{position:'relative'}} onClick={submitMyAnswers}>BEKÜLDÉS</button>
          </div>
        )}

        {view === 'WAITING' && (
           <div className="menu">
             <h2>VÁRJUK A LASSÚAKAT...</h2>
             {role === 'HOST' && <button className="btn-action btn-secondary" style={{width:'auto'}} onClick={startVotingPhase}>KÉNYSZERÍTETT TOVÁBBLÉPÉS</button>}
           </div>
        )}

        {view === 'WAITING_NEXT_VOTE' && (
           <div className="menu"><h2>KÖVETKEZŐ EMBER...</h2></div>
        )}

        {view === 'VOTING' && votingData && (
          <div className="container">
            <h2 style={{textAlign:'center', color:'#ff00de'}}>MOST PONTOZZUK: <br/><span style={{fontSize:'3rem', color:'white'}}>{votingData.name}</span></h2>
            
            <div className="glass-card">
               <div className="task-label">1. SZITUÁCIÓ</div>
               <div style={{fontSize:'0.8rem', color:'#aaa'}} dangerouslySetInnerHTML={{__html: votingData.tasks?.t1.text}} />
               <div className="cyber-input" style={{background:'black', color:'#ffdd00'}}>{votingData.answers?.t1 || "-(Nincs válasz)-"}</div>
            </div>

            <div className="glass-card">
               <div className="task-label">2. KÍN-PAD</div>
               <div style={{fontSize:'0.8rem', color:'#aaa'}}>{votingData.tasks?.t2.text}</div>
               <div className="cyber-input" style={{background:'black', color:'#ffdd00'}}>{votingData.answers?.t2 || "-(Nincs válasz)-"}</div>
            </div>

            <div className="glass-card">
               <div className="task-label">3. SZTORI</div>
               <div style={{background:'black', padding:'10px', borderRadius:'8px', color:'#00f3ff'}}>
                 {votingData.tasks?.t3.celebs[0]} {"->"} {votingData.answers?.t3_1} {"->"} {votingData.tasks?.t3.celebs[1]} {"->"} {votingData.answers?.t3_2} {"->"} {votingData.tasks?.t3.celebs[2]}
               </div>
            </div>

            <div style={{background:'#220022', padding:'20px', borderRadius:'15px', marginTop:'20px', border:'1px solid #ff00de'}}>
               <div style={{textAlign:'center', marginBottom:'10px'}}>MENNYIRE TRASH? (1-10)</div>
               <input type="range" min="1" max="10" style={{width:'100%', accentColor:'#ff00de', height:'20px'}} value={myVote} onChange={e=>setMyVote(parseInt(e.target.value))} />
               <div style={{textAlign:'center', fontSize:'2rem', fontWeight:'bold', color:'#ff00de'}}>{myVote}</div>
            </div>

            <button className="btn-action" style={{position:'relative'}} onClick={submitVote}>SZAVAZOK!</button>
          </div>
        )}

        {view === 'LEADERBOARD' && (
           <div className="container">
             <h1 className="title">VÉGEREDMÉNY</h1>
             <div className="lobby-list" style={{flexDirection:'column'}}>
                {players.sort((a,b) => b.score - a.score).map((p, i) => (
                  <div key={p.id} className="glass-card" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                     <div style={{fontSize:'1.5rem', fontWeight:'bold'}}>#{i+1} {p.name}</div>
                     <div style={{fontSize:'2rem', color:'#00f3ff'}}>{p.score} p</div>
                  </div>
                ))}
             </div>
             {role === 'HOST' && <button className="btn-action" onClick={startGameHost}>ÚJ KÖR ↻</button>}
           </div>
        )}

      </div>
    </>
  );
}