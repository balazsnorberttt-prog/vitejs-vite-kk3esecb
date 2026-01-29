import { useState, useEffect, useRef, useMemo } from 'react';
import Peer from 'peerjs';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. STÍLUSOK
// ==========================================
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@500;700;900&display=swap');
  
  body { margin: 0; background: #000; overflow: hidden; font-family: 'Rajdhani', sans-serif; color: white; }
  .app-layer { position: absolute; inset: 0; display: flex; flex-direction: column; z-index: 10; overflow-y: auto; overflow-x: hidden; }
  
  .cyber-input { width: 100%; max-width: 400px; padding: 15px; background: rgba(0,0,0,0.8); border: 2px solid #444; color: #ffdd00; font-family: 'Rajdhani'; font-size: 1.2rem; font-weight: bold; border-radius: 8px; text-align: center; outline: none; margin-top: 5px; box-sizing: border-box; transition: 0.3s; text-transform: uppercase; }
  .cyber-input:focus { border-color: #ffdd00; box-shadow: 0 0 20px rgba(255, 221, 0, 0.4); }
  
  .btn-container { width: 100%; display: flex; justify-content: center; padding: 20px; box-sizing: border-box; margin-top: 20px; padding-bottom: 50px; }
  .btn-action { width: 100%; max-width: 400px; padding: 20px; background: linear-gradient(90deg, #ff00de, #00f3ff); color: white; font-family: 'Black Ops One'; font-size: 1.5rem; border: none; border-radius: 50px; cursor: pointer; text-transform: uppercase; box-shadow: 0 5px 30px rgba(0,0,0,0.5); text-shadow: 2px 2px 0 black; transition: all 0.2s; }
  .btn-action:active { transform: scale(0.95); }
  .btn-secondary { background: #333; color: white; border: 2px solid white; box-shadow: none; font-size: 1.2rem; }
  
  .container { padding: 20px; max-width: 650px; margin: 0 auto; width: 100%; box-sizing: border-box; flex: 1; display: flex; flex-direction: column; }
  .glass-card { background: linear-gradient(135deg, rgba(20,20,30,0.95), rgba(10,10,20,0.9)); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px; margin-bottom: 25px; box-shadow: 0 10px 40px rgba(0,0,0,0.7); backdrop-filter: blur(10px); }
  
  .task-label { color: #00f3ff; font-weight: 900; letter-spacing: 2px; margin-bottom: 12px; text-transform: uppercase; font-size: 0.9rem; border-bottom: 1px solid #333; padding-bottom: 5px; }
  .highlight { color: #ff00de; font-weight: bold; text-decoration: underline; }
  
  .story-row { display: flex; flex-direction: column; gap: 5px; margin-bottom: 15px; }
  .celeb-static { color: #ff00de; font-weight: 900; font-size: 1.1rem; text-transform: uppercase; text-shadow: 0 0 10px #ff00de; }
  
  .assoc-row { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
  .assoc-letter { font-size: 1.8rem; font-weight: 900; color: #ff00de; min-width: 30px; text-align: center; }
  
  .top-bar { padding: 15px 20px; background: rgba(0,0,0,0.9); border-bottom: 2px solid #ff00de; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; }
  .menu { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 20px; box-sizing: border-box; }
  .glitch-title { font-size: 3.5rem; color: #fff; font-family: 'Black Ops One'; line-height: 0.9; margin-bottom: 30px; text-shadow: 3px 3px 0 #ff00de, -3px -3px 0 #00f3ff; }
  
  .vote-slider-container { margin-top: 15px; background: rgba(0,0,0,0.6); padding: 15px; border-radius: 8px; border: 1px dashed #555; }
  .vote-label { font-size: 0.9rem; color: #aaa; display: flex; justify-content: space-between; margin-bottom: 5px; }
  input[type=range] { width: 100%; cursor: pointer; accent-color: #ff00de; height: 25px; }
  .score-badge { color: #ff00de; font-weight: bold; font-size: 1.5rem; }
  
  .lobby-list { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 30px; margin-bottom: 30px; }
  .player-pill { padding: 10px 20px; background: #333; border-radius: 30px; border: 1px solid #555; font-weight: bold; }
`;

// ==========================================
// 2. 3D HÁTTÉR
// ==========================================
function FloatingDebris() {
  const mesh = useRef<any>(null);
  const count = 40;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) temp.push({ x: (Math.random() - 0.5) * 60, y: (Math.random() - 0.5) * 60, z: (Math.random() - 0.5) * 60, rotSpeed: Math.random() * 0.02, scale: 0.5 + Math.random() });
    return temp;
  }, []);
  useFrame((state) => {
    if (!mesh.current) return;
    particles.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z); dummy.rotation.x += p.rotSpeed; dummy.rotation.y += p.rotSpeed; dummy.scale.set(p.scale, p.scale, p.scale); dummy.updateMatrix(); mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true; mesh.current.rotation.y += 0.001;
  });
  return <instancedMesh ref={mesh} args={[undefined, undefined, count]}><icosahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#ff00de" wireframe /></instancedMesh>;
}
function Scene3D() {
  return <><PerspectiveCamera makeDefault position={[0, 0, 20]} /><ambientLight intensity={0.5} /><pointLight position={[10, 10, 10]} intensity={2} color="#00f3ff" /><pointLight position={[-10, -10, -10]} intensity={2} color="#ff00de" /><Stars radius={100} depth={50} count={6000} factor={4} saturation={0} fade speed={2} /><Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}><FloatingDebris /></Float></>;
}

// ==========================================
// 3. ADATBÁZIS
// ==========================================
const FUNNY_CHARACTERS = [
  "Egy 3 napos lejárt parizer", "Zámbó Jimmy szelleme", "A Rezsidémon", "Egy kannásbor a Blaháról", 
  "Polgár Jenő (a Hivatal)", "Szalacsi Sándor", "Egy panelproli", "Vágó István szemüvege", 
  "Győzike zebracsíkos öltönye", "Matolcsy György jobb szeme", "Kiszel Tünde naptára", 
  "Egy BKV ellenőr karszalagja", "A szomszéd Marika néni", "Egy adag pacalpörkölt", 
  "Németh Szilárd bográcsa", "Egy suzukis a belső sávban", "Kádár János", "Rózsa Sándor lova",
  "Egy doboz Kőbányai", "A Feri (tudodmelyik)", "Egy NAV ellenőr lelke", "A magyar forint árfolyama",
  "Egy MÁV hangosbemondó", "A postás, aki kétszer csenget", "Egy részeg télapó", "Az Exed",
  "Anyósod", "Egy kóbor macska", "Dévényi Tibi bácsi pöttyös labdája", "Bunyós Pityu"
];

const SITUATIONS = [
  "{WHO} éppen ...-t csinál a Parlament közepén.", 
  "{WHO} a 4-es 6-oson üvöltve próbál eladni egy ...-t.", 
  "A Hősök terén {WHO} egy ...-t áldozott fel.", 
  "Az első randin {WHO} elővett egy ...-t.", 
  "A ravatalozóban {WHO} elejtett egy ...-t.", 
  "{WHO} a toi-toi vécében ...-t próbál lehúzni.", 
  "A templomban {WHO} az oltárra tett egy ...-t.", 
  "{WHO} részegen ...-t tetováltatott a homlokára.", 
  "A szülőszobán {WHO} ...-t adott a babának.", 
  "A temetésen {WHO} ...-al dobálózott.", 
  "A szaunában {WHO} ...-al csapkodta az embereket.", 
  "Az éjféli misén {WHO} ...-t ordított.", 
  "{WHO} az OnlyFans-en ...-t dugott a fülébe.", 
  "A Híradóban {WHO} ...-t mutatott a kamerának.", 
  "{WHO} a Tinderen ...-al pózolt profilképnek.", 
  "A vonaton {WHO} ...-t dobált az utasokra.", 
  "A Lidlben {WHO} ...-al fizetett a kasszánál.", 
  "{WHO} a kondiban ...-t emelgetett súlyzó helyett.", 
  "A NAV-nál {WHO} ...-t húzott elő a zsebéből.", 
  "Az állatkertben {WHO} ...-t etetett a majmokkal."
];

const QUESTIONS = [
  "Maszturbálás közben ezt kiabáltad:", "A proktológusnak ezt súgtad:", "Ha rajtakapnak egy kecskével:", 
  "Szex után ezt mondod:", "Istennek ezt mondanád:", "A bíróságon ezzel védekeznél:", "Sírkövedre ezt írnád:", 
  "Ha a párod meztelen, ezt mondod:", "Ha a futár látja a szexjátékod:", 
  "Utolsó szavaid a villamosszékben:", "Orgazmus közben ezt ordítod:", 
  "Tinder bemutatkozásod:", "Neve a nemi szervednek:", "Ha ellenkező nemű lennél:", 
  "Ha hullát találnál nálad:", "Legkínosabb Google keresésed:", 
  "Kannibálként ezt ennéd:", "Legrosszabb hely hányásra:", 
  "Ha a gyereked meglát szex közben:", "Kinek a bugyiját szagolnád:", "Legbetegebb fétised:", 
  "Részeg SMS az exednek:", "Ha tesók lennétek a pároddal:", 
  "Láthatatlanként mit tennél:", "Tetoválás a fenekedre:", "Ha a péniszed beszélne:", 
  "Hova rejtenél egy fejet:", "Szexeszköz a lakatlan szigetre:"
];

const ABSURD_WORDS = [
  "Hüvelygomba", "Endoplazmatikus retikulum", "Fakanál", "Farhát", "Pacal", "Kádár János szelleme", 
  "Egy vödör takony", "Szilikon mell", "Büdös zokni", "Műfogsor", "Kolbászzsír", "Prosztata", 
  "Aranyér kenőcs", "Szájer ereszcsatornája", "Egy döglött patkány", "Használt óvszer", 
  "Kőbányai sör", "Kannás bor", "Dugóhúzó", "WC kefe", "Szőrös hát", "Pattanás", "Körömgomba", 
  "Fityma", "Anyajegy", "Szemölcs", "Disznósajt", "Véres hurka", "Szotyi héj", "Lábvíz", 
  "Combközép", "Mellbimbó", "Végbélkúp", "Katéter", "Beöntés", "Szájpecek", "Bilincs"
];

const LETTERS = "ABDEFGHKLMNPRSTVZ"; 
const getLetters = (count: number) => {
  let res = [];
  for(let i=0; i<count; i++) res.push(LETTERS[Math.floor(Math.random() * LETTERS.length)]);
  return res;
};

const generateTasks = () => {
  const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
  const getCeleb = () => getRandom(FUNNY_CHARACTERS);
  const assocLetters = getLetters(3);
  
  return {
    t1: { text: getRandom(SITUATIONS).replace("{WHO}", `<span class="highlight">${getCeleb()}</span>`), letter: getLetters(1)[0] },
    t2: { text: getRandom(QUESTIONS), letter: getLetters(1)[0] },
    t3: { subject: getCeleb(), target: getCeleb() },
    t4: { topic: getRandom(ABSURD_WORDS), letters: assocLetters }
  };
};

// ==========================================
// 4. JÁTÉK LOGIKA (AUTO-SYNC WATCHER)
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
  
  const [myAnswers, setMyAnswers] = useState<any>({ t1: "", t2: "", t3_1: "", t3_2: "", t4_1: "", t4_2: "", t4_3: "" });
  const [votingData, setVotingData] = useState<any>(null);
  const [votes, setVotes] = useState<any>({ t1: 5, t2: 5, t3: 5, t4: 5 });

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

  // --- AUTOMATIKUS TOVÁBBLÉPÉS (WATCHER) ---
  // Ez figyeli, hogy mikor végzett mindenki, és azonnal lép.
  useEffect(() => {
    if (role === 'HOST' && players.length > 0) {
        // Ellenőrizzük, hogy mindenkinek van-e válasza
        const allDone = players.every(p => p.answers !== null);
        
        // Ha mindenki kész, és még nem szavazunk (hogy ne loopoljon)
        if (allDone && (view === 'PLAYING' || view === 'WAITING')) {
            console.log("MINDENKI KÉSZ! INDUL A SZAVAZÁS...");
            setTimeout(() => startVotingPhase(players), 1000); // Kis késleltetés a drámai hatásért
        }
    }
  }, [players, role, view]);

  const createRoom = () => {
    if (!myName) return alert("Írj be egy nevet!");
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const newPeer = new Peer(code);
    newPeer.on('open', (id) => {
      setRoomId(id); setRole('HOST'); setPlayers([{ id: id, name: myName, score: 0, tasks: null, answers: null }]); setView('LOBBY');
    });
    newPeer.on('connection', (conn) => {
      connsRef.current.push(conn); conn.on('data', (data) => handleDataHost(conn, data));
    });
    if(peerRef.current) peerRef.current.destroy(); peerRef.current = newPeer;
  };

  const handleDataHost = (conn: any, data: any) => {
    if (data.type === 'JOIN') {
      setPlayers(prev => {
        const newList = [...prev, { id: conn.peer, name: data.name, score: 0, tasks: null, answers: null }];
        broadcast(newList, 'UPDATE_PLAYERS'); return newList;
      });
    }
    if (data.type === 'SUBMIT_ANSWERS') {
        // Csak frissítjük az adatot, a Watcher (useEffect) fog továbblépni!
        setPlayers(prev => prev.map(p => p.id === conn.peer ? { ...p, answers: data.answers } : p));
    }
    if (data.type === 'SUBMIT_VOTE') addScoreToCurrent(data.scores);
  };

  const addScoreToCurrent = (scores: any) => {
    const total = parseInt(scores.t1) + parseInt(scores.t2) + parseInt(scores.t3) + parseInt(scores.t4);
    setPlayers(prev => { 
      const newList = [...prev]; 
      if(newList[votingIndex]) newList[votingIndex].score += total; 
      return newList; 
    });
  };

  const broadcast = (payload: any, type: string) => { connsRef.current.forEach(conn => conn.send({ type, payload })); };

  const startGameHost = () => {
    const updatedPlayers = players.map(p => ({ ...p, tasks: generateTasks(), answers: null }));
    setPlayers(updatedPlayers);
    connsRef.current.forEach(conn => {
      const pData = updatedPlayers.find(p => p.id === conn.peer); if (pData) conn.send({ type: 'START_GAME', tasks: pData.tasks });
    });
    const hostData = updatedPlayers.find(p => p.id === roomId); if(hostData) setMyTasks(hostData.tasks);
    setView('PLAYING'); setTimeLeft(180);
  };

  const joinRoom = () => {
    if (!joinCode || !myName) return alert("Név és Kód kell!");
    const conn = peerRef.current.connect(joinCode);
    conn.on('open', () => { setRole('CLIENT'); setRoomId(joinCode); conn.send({ type: 'JOIN', name: myName }); setView('LOBBY'); });
    conn.on('data', (data: any) => {
      if (data.type === 'UPDATE_PLAYERS') setPlayers(data.payload);
      if (data.type === 'START_GAME') { setMyTasks(data.tasks); setView('PLAYING'); setTimeLeft(180); }
      if (data.type === 'VOTE_PHASE') { 
          setVotingData(data.payload); 
          setView('VOTING'); 
          setVotes({t1:5, t2:5, t3:5, t4:5}); 
      }
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
      setTimeLeft(t => { if (t <= 1) { if (role === 'HOST') startVotingPhase(players); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [view, role]);

  const submitMyAnswers = () => {
    if (role === 'HOST') { 
        // A Host is csak frissíti az adatot, a Watcher majd intézi a továbblépést
        setPlayers(prev => prev.map(p => p.id === roomId ? { ...p, answers: myAnswers } : p)); 
        setView('WAITING'); 
    } else { 
        sendToHost('SUBMIT_ANSWERS', { answers: myAnswers }); 
        setView('WAITING'); 
    }
  };

  const startVotingPhase = (currentPlayersList: any[] = players) => { 
      setVotingIndex(0); 
      broadcastVoting(0, currentPlayersList); 
  };

  const broadcastVoting = (index: number, currentPlayersList: any[] = players) => {
    if (index >= currentPlayersList.length) { 
        broadcast({ players: currentPlayersList }, 'SHOW_LEADERBOARD'); 
        setPlayers(currentPlayersList); 
        setView('LEADERBOARD'); 
        return; 
    }
    
    const target = currentPlayersList[index]; 
    if (!target) return; // Biztonsági csekk

    const packet = {
        name: target.name,
        tasks: target.tasks,
        answers: target.answers || { t1:"-", t2:"-", t3_1:"-", t3_2:"-", t4_1:"-", t4_2:"-", t4_3:"-" } // Fallback, hogy ne legyen crash
    };

    setVotingData(packet); 
    setView('VOTING'); 
    setVotes({t1:5, t2:5, t3:5, t4:5}); 
    
    broadcast(packet, 'VOTE_PHASE');
  };

  const submitVote = () => {
    if (role === 'HOST') { 
      addScoreToCurrent(votes); 
      const nextIdx = votingIndex + 1; 
      setVotingIndex(nextIdx); 
      setTimeout(() => broadcastVoting(nextIdx, players), 500); 
    } 
    else { 
      sendToHost('SUBMIT_VOTE', { scores: votes }); 
      setView('WAITING_NEXT_VOTE'); 
    }
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="app-layer">
        <div style={{position:'absolute', inset:0, zIndex:-1}}><Canvas><Scene3D /></Canvas></div>
        
        {/* MENU */}
        {view === 'MENU' && (
          <div className="menu">
            <h1 className="glitch-title">TRASH<br/>UNIVERSE</h1>
            <input className="cyber-input" style={{maxWidth:'350px'}} placeholder="NEVED" value={myName} onChange={e=>setMyName(e.target.value)} />
            <div className="btn-container"><button className="btn-action" onClick={createRoom}>ÚJ SZOBA</button></div>
            <p style={{margin:'20px', color:'#aaa'}}>VAGY</p>
            <input className="cyber-input" style={{maxWidth:'350px'}} placeholder="SZOBA KÓD" value={joinCode} onChange={e=>setJoinCode(e.target.value)} />
            <div className="btn-container"><button className="btn-action btn-secondary" onClick={joinRoom}>CSATLAKOZÁS</button></div>
          </div>
        )}

        {/* LOBBY */}
        {view === 'LOBBY' && (
          <div className="menu">
            <h1 className="glitch-title" style={{fontSize:'3rem'}}>LOBBY</h1>
            <div style={{color:'#aaa'}}>SZOBA KÓD:</div>
            <div className="room-code" style={{fontSize:'4rem'}}>{roomId}</div>
            <div className="lobby-list">{players.map(p => (<div key={p.id} className="player-pill" style={{background: p.id===myId?'#ff00de':'#333'}}>{p.name}</div>))}</div>
            {role === 'HOST' ? (<div className="btn-container"><button className="btn-action" onClick={startGameHost}>JÁTÉK INDÍTÁSA</button></div>) : (<p style={{marginTop:'40px', color:'#00f3ff', animation:'pulse 1s infinite'}}>A Host hamarosan indít...</p>)}
          </div>
        )}

        {/* GAME */}
        {view === 'PLAYING' && myTasks && (
          <div className="container">
            <div className="top-bar"><div style={{fontWeight:'bold', color:'#00f3ff'}}>{myName}</div><div className="room-code" style={{color: timeLeft<10?'red':'white'}}>{timeLeft}</div></div>
            
            <div className="glass-card"><div className="task-label">1. SZITUÁCIÓ (Egészítsd ki!)</div><div style={{marginBottom:'10px'}} dangerouslySetInnerHTML={{__html: myTasks.t1.text.replace("...", "_______")}} /><div style={{color:'#ffdd00', fontSize:'0.8rem', fontWeight:'bold'}}>KEZDŐBETŰ: {myTasks.t1.letter}</div><input className="cyber-input" placeholder="Írd be..." value={myAnswers.t1} onChange={e=>setMyAnswers({...myAnswers, t1: e.target.value})} /></div>
            
            <div className="glass-card"><div className="task-label">2. KÍN-PAD (Vallomás)</div><div style={{marginBottom:'10px'}}>{myTasks.t2.text}</div><div style={{color:'#ffdd00', fontSize:'0.8rem', fontWeight:'bold'}}>KEZDŐBETŰ: {myTasks.t2.letter}</div><input className="cyber-input" placeholder="Válasz..." value={myAnswers.t2} onChange={e=>setMyAnswers({...myAnswers, t2: e.target.value})} /></div>
            
            <div className="glass-card"><div className="task-label">3. SZTORIGYÁR (Alkoss mondatot!)</div><div className="story-row"><div className="celeb-static">{myTasks.t3.subject} ...</div><input className="cyber-input" style={{marginTop:0}} placeholder="mit csinált?" value={myAnswers.t3_1} onChange={e=>setMyAnswers({...myAnswers, t3_1: e.target.value})} /></div><div className="story-row"><div className="celeb-static">... {myTasks.t3.target}-vel/val,</div><input className="cyber-input" style={{marginTop:0}} placeholder="és mi történt a végén?" value={myAnswers.t3_2} onChange={e=>setMyAnswers({...myAnswers, t3_2: e.target.value})} /></div></div>
            
            <div className="glass-card">
               <div className="task-label">4. ASSZOCIÁCIÓ</div>
               <div style={{textAlign:'center', marginBottom:'15px'}}><div style={{color:'#aaa', fontSize:'0.9rem'}}>Mi jut eszedbe erről:</div><div className="celeb-static" style={{fontSize:'1.5rem', margin:'10px 0', color:'#ffdd00'}}>{myTasks.t4.topic}</div></div>
               <div className="assoc-row"><span className="assoc-letter">{myTasks.t4.letters[0]}</span> <input className="cyber-input" value={myAnswers.t4_1} onChange={e=>setMyAnswers({...myAnswers, t4_1: e.target.value})} /></div>
               <div className="assoc-row"><span className="assoc-letter">{myTasks.t4.letters[1]}</span> <input className="cyber-input" value={myAnswers.t4_2} onChange={e=>setMyAnswers({...myAnswers, t4_2: e.target.value})} /></div>
               <div className="assoc-row"><span className="assoc-letter">{myTasks.t4.letters[2]}</span> <input className="cyber-input" value={myAnswers.t4_3} onChange={e=>setMyAnswers({...myAnswers, t4_3: e.target.value})} /></div>
            </div>

            <div className="btn-container"><button className="btn-action" onClick={submitMyAnswers}>KÉSZ VAGYOK</button></div>
          </div>
        )}

        {view === 'WAITING' && (<div className="menu"><h2>VÁRJUK A TÖBBIEKET...</h2><div style={{color:'#00f3ff', marginBottom:'20px'}}>{players.filter(p=>p.answers).length} / {players.length} játékos kész</div><div style={{fontSize:'3rem', margin:'20px'}}>⏳</div>{role === 'HOST' && <button className="btn-action btn-secondary" style={{width:'auto', position:'relative'}} onClick={()=>startVotingPhase(players)}>KÉNYSZERÍTÉS (SKIP)</button>}</div>)}
        
        {view === 'WAITING_NEXT_VOTE' && (<div className="menu"><h2>KÖVETKEZŐ EMBER...</h2></div>)}

        {/* --- PONTOZÁS --- */}
        {view === 'VOTING' && votingData && (
          <div className="container">
            <h2 style={{textAlign:'center', color:'#ff00de', marginBottom:'10px'}}>MOST PONTOZZUK:</h2><h1 style={{textAlign:'center', fontSize:'3rem', margin:0, color:'white', textShadow:'0 0 10px white'}}>{votingData.name}</h1>
            
            <div className="glass-card">
               <div className="task-label">1. SZITUÁCIÓ</div>
               <div style={{fontSize:'0.8rem', color:'#aaa'}} dangerouslySetInnerHTML={{__html: votingData.tasks?.t1.text}} />
               <div className="cyber-input" style={{background:'black', color:'#ffdd00', border:'none'}}>{votingData.answers?.t1 || "-"}</div>
               <div className="vote-slider-container"><div className="vote-label"><span>VICCES?</span> <span className="score-badge">{votes.t1}</span></div><input type="range" min="1" max="10" value={votes.t1} onChange={e=>setVotes({...votes, t1: e.target.value})} /></div>
            </div>

            <div className="glass-card">
               <div className="task-label">2. KÍN-PAD</div>
               <div style={{fontSize:'0.8rem', color:'#aaa'}}>{votingData.tasks?.t2.text}</div>
               <div className="cyber-input" style={{background:'black', color:'#ffdd00', border:'none'}}>{votingData.answers?.t2 || "-"}</div>
               <div className="vote-slider-container"><div className="vote-label"><span>VICCES?</span> <span className="score-badge">{votes.t2}</span></div><input type="range" min="1" max="10" value={votes.t2} onChange={e=>setVotes({...votes, t2: e.target.value})} /></div>
            </div>

            <div className="glass-card">
               <div className="task-label">3. SZTORI</div>
               <div style={{background:'black', padding:'15px', borderRadius:'8px', color:'#00f3ff', lineHeight:'1.5', fontSize:'1.2rem'}}>
                 <span style={{color:'#ff00de', fontWeight:'bold'}}>{votingData.tasks?.t3.subject}</span> {" "}{votingData.answers?.t3_1}{" "} <span style={{color:'#fff', fontWeight:'bold'}}>{votingData.tasks?.t3.target}-vel/val</span>, {" "}{votingData.answers?.t3_2}
               </div>
               <div className="vote-slider-container"><div className="vote-label"><span>VICCES?</span> <span className="score-badge">{votes.t3}</span></div><input type="range" min="1" max="10" value={votes.t3} onChange={e=>setVotes({...votes, t3: e.target.value})} /></div>
            </div>

            <div className="glass-card">
               <div className="task-label">4. ASSZOCIÁCIÓ</div>
               <div style={{marginBottom:'10px', fontWeight:'bold'}}>{votingData.tasks?.t4.topic}:</div>
               <ul style={{listStyle:'none', padding:0}}>
                  <li style={{background:'black', padding:'10px', margin:'5px 0', borderLeft:'3px solid #ff00de'}}><span style={{color:'#ffdd00'}}>{votingData.tasks?.t4.letters[0]}</span> - {votingData.answers?.t4_1 || "-"}</li>
                  <li style={{background:'black', padding:'10px', margin:'5px 0', borderLeft:'3px solid #ff00de'}}><span style={{color:'#ffdd00'}}>{votingData.tasks?.t4.letters[1]}</span> - {votingData.answers?.t4_2 || "-"}</li>
                  <li style={{background:'black', padding:'10px', margin:'5px 0', borderLeft:'3px solid #ff00de'}}><span style={{color:'#ffdd00'}}>{votingData.tasks?.t4.letters[2]}</span> - {votingData.answers?.t4_3 || "-"}</li>
               </ul>
               <div className="vote-slider-container"><div className="vote-label"><span>VICCES?</span> <span className="score-badge">{votes.t4}</span></div><input type="range" min="1" max="10" value={votes.t4} onChange={e=>setVotes({...votes, t4: e.target.value})} /></div>
            </div>

            <div className="btn-container"><button className="btn-action" onClick={submitVote}>SZAVAZATOK BEKÜLDÉSE</button></div>
          </div>
        )}

        {/* RESULTS */}
        {view === 'LEADERBOARD' && (
           <div className="container"><h1 className="glitch-title" style={{textAlign:'center'}}>EREDMÉNY</h1><div className="lobby-list" style={{flexDirection:'column'}}>{players.sort((a,b) => b.score - a.score).map((p, i) => (<div key={p.id} className="glass-card" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'15px'}}><div style={{fontSize:'1.5rem', fontWeight:'bold'}}>#{i+1} {p.name}</div><div style={{fontSize:'2rem', color:'#00f3ff'}}>{p.score}</div></div>))}</div>{role === 'HOST' && <div className="btn-container"><button className="btn-action" onClick={startGameHost}>ÚJ KÖR</button></div>}</div>
        )}
      </div>
    </>
  );
}