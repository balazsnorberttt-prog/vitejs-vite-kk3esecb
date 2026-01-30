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

// === 3. ADATBÁZIS ===
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

// === 4. FŐ ALKALMAZÁS - JAVÍTOTT ===
export default function App() {
  const [view, setView] = useState('MENU');
  const [role, setRole] = useState<'HOST' | 'CLIENT' | null>(null);
  const [roomId, setRoomId] = useState('');
  const [myName, setMyName] = useState('');
  const [state, setState] = useState<any>(null);
  const [answers, setAnswers] = useState<any>({ t1: "", t2: "", t3_1: "", t3_2: "", t4: null });
  const [myVote, setMyVote] = useState(5);
  const [votingIndex, setVotingIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === JAVÍTOTT SZINKRONIZÁCIÓ - FIX 404 KEZELÉS ===
  useEffect(() => {
    if (!roomId || view === 'MENU') return;
    
    let isActive = true;
    
    const syncInterval = setInterval(async () => {
      if (!isActive) return;
      
      try {
        const res = await fetch(`${BACKEND_URL}?roomId=${roomId}`);
        
        // ⚠️ FIX: Először ellenőrizzük a HTTP státuszt
        if (!res.ok) {
          // 404-es hiba esetén a szoba nem létezik
          if (res.status === 404) {
            console.log("Szoba nem található (404)");
            // NE dobjunk hibát LOBBY-ban, mert ott lehet hogy épp most jött létre
            if (view !== 'LOBBY') {
              try {
                const errorData = await res.json();
                if (errorData?.error === "Nincs szoba") {
                  setError("A szoba lejárt vagy törölve lett");
                  setView('MENU');
                }
              } catch (e) {
                // JSON parse hiba esetén csak logoljuk
                console.log("Nem sikerült parse-olni a 404 választ");
              }
            }
          }
          return;
        }
        
        const data = await res.json();
        
        // SZERVER SPECIFIKUS FIX: Ha a szerver { error: "Nincs szoba" } formátumot ad vissza
        if (data && data.error) {
          console.log("Szerver error:", data.error);
          if (data.error === "Nincs szoba" && view !== 'MENU' && view !== 'LOBBY') {
            setError("A szoba lejárt vagy törölve lett");
            setView('MENU');
          }
          return;
        }
        
        if (isActive && data && !data.error) {
          setState(data);
          setError(null);
          
          // Automatikus nézet váltás, ha a szerver állapota más
          if (data.currentPhase && data.currentPhase !== view) {
            console.log("Auto-changing view to:", data.currentPhase);
            setView(data.currentPhase);
          }
          
          if (data.votingIndex !== undefined) {
            setVotingIndex(data.votingIndex);
          }
        }
      } catch (e) {
        console.error("Szinkronizációs hiba:", e);
        // Ne zavarjuk a felhasználót ha csak egy sync hiba van
      }
    }, 2000); // 2 másodperces intervallum (csökkentve a server load miatt)
    
    return () => {
      isActive = false;
      clearInterval(syncInterval);
    };
  }, [roomId, view]);

  // === JAVÍTOTT POST UPDATE ===
  const postUpdate = async (update: any) => {
    setLoading(true);
    setError(null);
    
    try {
      // Mindig küldjük a roomId-t a body-ban is
      const payload = {
        roomId: roomId,
        ...update
      };
      
      const response = await fetch(`${BACKEND_URL}?roomId=${roomId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Frissítjük a lokális állapotot is
      if (data && !data.error) {
        setState(prev => ({ ...prev, ...data }));
      }
      
      return data;
    } catch (error: any) {
      console.error("Update hiba:", error);
      setError(error.message || "Ismeretlen hiba");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // === JAVÍTOTT CREATE ROOM ===
  const createRoom = async () => {
    if (!myName.trim()) {
      alert("Add meg a neved!");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const id = Math.floor(1000 + Math.random() * 9000).toString();
      const newPlayer = {
        name: myName,
        score: 0,
        answers: null,
        tasks: null,
        ready: false,
        isHost: true
      };
      
      const initialState = {
        players: [newPlayer],
        currentPhase: 'LOBBY',
        roomId: id,
        votingIndex: 0,
        createdAt: new Date().toISOString()
      };
      
      // Először POST kérés a szervernek
      const result = await postUpdate(initialState);
      
      if (result && !result.error) {
        setRoomId(id);
        setRole('HOST');
        setState(initialState);
        setView('LOBBY');
      } else {
        setError("Nem sikerült létrehozni a szobát");
      }
    } catch (error) {
      console.error("Szoba létrehozási hiba:", error);
      setError("Hiba a szoba létrehozásakor");
    } finally {
      setLoading(false);
    }
  };

  // === JAVÍTOTT JOIN ROOM ===
  const joinRoom = async () => {
    if (!roomId.trim() || !myName.trim()) {
      alert("Add meg a szoba kódot és a neved!");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Lekérjük a jelenlegi állapotot
      const res = await fetch(`${BACKEND_URL}?roomId=${roomId}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      // 2. Ellenőrizzük, hogy van-e error
      if (data && data.error) {
        alert("Nincs ilyen szoba!");
        return;
      }
      
      // 3. Ellenőrizzük, hogy a név már foglalt-e
      if (data.players && data.players.some((p: any) => p.name === myName)) {
        alert("Ez a név már foglalt ebben a szobában!");
        return;
      }
      
      // 4. Hozzáadjuk az új játékost
      const newPlayer = {
        name: myName,
        score: 0,
        answers: null,
        tasks: null,
        ready: false,
        isHost: false
      };
      
      const updatedPlayers = [
        ...(data.players || []),
        newPlayer
      ];
      
      // 5. Frissítjük a szervert
      const updateResult = await postUpdate({ players: updatedPlayers });
      
      if (updateResult && !updateResult.error) {
        setRole('CLIENT');
        setView('LOBBY');
      }
    } catch (error: any) {
      console.error("Csatlakozási hiba:", error);
      alert(`Hiba a csatlakozásnál: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // === JAVÍTOTT START ROUND ===
  const startRound = async () => {
    if (!state || role !== 'HOST') return;
    
    try {
      const updatedPlayers = state.players.map((player: any) => ({
        ...player,
        tasks: generateTasks(),
        answers: null,
        ready: false
      }));
      
      await postUpdate({ 
        players: updatedPlayers, 
        currentPhase: 'PLAYING', 
        votingIndex: 0,
        roundStarted: new Date().toISOString()
      });
      
      // Reset answers
      setAnswers({ t1: "", t2: "", t3_1: "", t3_2: "", t4: null });
    } catch (error) {
      console.error("Kör indítási hiba:", error);
    }
  };

  // === JAVÍTOTT SUBMIT ANSWERS ===
  const submitAnswers = async () => {
    if (!state || !myName) return;
    
    try {
      const updatedPlayers = state.players.map((player: any) => {
        if (player.name === myName) {
          return {
            ...player,
            answers: answers,
            ready: true,
            submittedAt: new Date().toISOString()
          };
        }
        return player;
      });
      
      const allReady = updatedPlayers.every((p: any) => p.ready);
      
      await postUpdate({ 
        players: updatedPlayers, 
        currentPhase: allReady ? 'VOTING' : 'PLAYING',
        votingIndex: 0
      });
      
      setView('WAITING');
    } catch (error) {
      console.error("Válasz beküldési hiba:", error);
    }
  };

  // === JAVÍTOTT SUBMIT VOTE ===
  const submitVote = async () => {
    if (!state || votingIndex >= state.players.length) return;
    
    try {
      const targetPlayer = state.players[votingIndex];
      
      const updatedPlayers = state.players.map((player: any) => {
        const updated = { ...player };
        
        // Pont hozzáadása
        if (player.name === targetPlayer.name) {
          updated.score = (updated.score || 0) + myVote;
        }
        
        // Ready állapot frissítése
        if (player.name === myName) {
          updated.ready = true;
        }
        
        return updated;
      });
      
      const allVoted = updatedPlayers.every((p: any) => p.ready);
      
      if (allVoted) {
        const nextIndex = votingIndex + 1;
        const isOver = nextIndex >= state.players.length;
        
        // Reset ready állapotok
        const resetPlayers = updatedPlayers.map(p => ({ ...p, ready: false }));
        
        await postUpdate({ 
          players: resetPlayers, 
          currentPhase: isOver ? 'LEADERBOARD' : 'VOTING', 
          votingIndex: isOver ? 0 : nextIndex 
        });
        
        if (isOver) {
          setView('LEADERBOARD');
        } else {
          setVotingIndex(nextIndex);
          setMyVote(5);
          setView('VOTING');
        }
      } else {
        await postUpdate({ 
          players: updatedPlayers, 
          currentPhase: 'VOTING',
          votingIndex: votingIndex
        });
        
        setView('WAITING_VOTE');
      }
    } catch (error) {
      console.error("Szavazási hiba:", error);
    }
  };

  const myPlayer = state?.players?.find((p: any) => p.name === myName);
  const targetPlayer = state?.players?.[votingIndex];

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="app-layer">
        {/* 3D HÁTTÉR */}
        <div style={{position:'absolute', inset:0, zIndex:-1}}>
          <Canvas>
            <Stars count={5000} factor={4} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10,10,10]} color="#00f3ff" intensity={2} />
            <Float>
              <FloatingDebris />
            </Float>
          </Canvas>
        </div>

        {/* HIBA ÜZENET */}
        {error && (
          <div style={{
            position: 'fixed',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 0, 0, 0.9)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '10px',
            zIndex: 1000,
            textAlign: 'center'
          }}>
            {error}
            <button 
              onClick={() => setError(null)}
              style={{
                marginLeft: '10px',
                background: 'white',
                color: 'red',
                border: 'none',
                borderRadius: '5px',
                padding: '2px 8px'
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* MENÜ */}
        {view === 'MENU' && (
          <div className="container" style={{justifyContent:'center'}}>
            <h1 style={{fontFamily:'Black Ops One', fontSize:'3.5rem', textAlign:'center', textShadow:'0 0 20px #ff00de'}}>
              TRASH UNIVERSE
            </h1>
            
            <div className="glass-card">
              <input 
                className="cyber-input" 
                placeholder="NEVED" 
                value={myName} 
                onChange={e => setMyName(e.target.value)}
                disabled={loading}
              />
              
              <button 
                className="btn-action" 
                onClick={createRoom}
                disabled={loading}
              >
                {loading ? 'FELDOLGOZÁS...' : 'ÚJ JÁTÉK'}
              </button>
              
              <div style={{height:'1px', background:'#444', margin:'20px 0'}} />
              
              <input 
                className="cyber-input" 
                placeholder="SZOBA KÓD (4 szám)" 
                value={roomId} 
                onChange={e => setRoomId(e.target.value)}
                disabled={loading}
              />
              
              <button 
                className="btn-action" 
                style={{background:'#222'}} 
                onClick={joinRoom}
                disabled={loading}
              >
                {loading ? 'CSATLAKOZÁS...' : 'CSATLAKOZÁS'}
              </button>
            </div>
            
            {roomId && (
              <p style={{textAlign:'center', color:'#888', marginTop:'20px'}}>
                Aktuális szoba: {roomId}
              </p>
            )}
          </div>
        )}

        {/* LOBBY */}
        {view === 'LOBBY' && state && (
          <div className="container">
            <h1 style={{fontSize:'3rem', textAlign:'center', color:'#00f3ff'}}>
              SZOBA: {roomId}
            </h1>
            
            <div className="glass-card">
              <div style={{display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'10px'}}>
                {state.players?.map((p: any, i: number) => (
                  <div 
                    key={i} 
                    className="player-pill"
                    style={{
                      background: p.name === myName ? 'linear-gradient(135deg, #ff00de, #9900cc)' : '#111',
                      borderColor: p.name === myName ? '#ff00de' : '#555'
                    }}
                  >
                    {p.name} {p.name === myName && '(TE)'}
                  </div>
                ))}
              </div>
              
              {(!state.players || state.players.length < 2) && (
                <div style={{
                  textAlign: 'center',
                  marginTop: '15px',
                  padding: '10px',
                  background: 'rgba(255, 0, 222, 0.1)',
                  borderRadius: '8px',
                  border: '1px dashed #ff00de'
                }}>
                  ⚠️ Várj még {2 - (state.players?.length || 0)} játékost a játék indításához!
                </div>
              )}
            </div>
            
            {role === 'HOST' && state.players && state.players.length >= 2 && (
              <button 
                className="btn-action" 
                onClick={startRound}
                disabled={loading}
              >
                {loading ? 'INDÍTÁS...' : `JÁTÉK INDÍTÁSA (${state.players.length} JÁTÉKOS)`}
              </button>
            )}
            
            {role === 'CLIENT' && (
              <div style={{textAlign:'center', color:'#888', marginTop:'20px'}}>
                Várakozás a host játék indítására...
              </div>
            )}
            
            <button 
              className="btn-action" 
              style={{background:'#222', marginTop:'10px'}}
              onClick={() => {
                setView('MENU');
                setRole(null);
              }}
            >
              VISSZA A MENÜBE
            </button>
          </div>
        )}

        {/* PLAYING */}
        {view === 'PLAYING' && myPlayer?.tasks && (
          <div className="container">
            <div style={{
              padding: '15px 20px',
              background: 'rgba(0,0,0,0.9)',
              borderBottom: '2px solid #ff00de',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              zIndex: 100
            }}>
              <span style={{fontWeight:'bold'}}>{myName}</span>
              <span style={{fontFamily:'Black Ops One'}}>KÓD: {roomId}</span>
            </div>
            
            <div className="glass-card">
              <div className="task-label">1. SZITUÁCIÓ (Betűk: {myPlayer.tasks.t1.letters})</div>
              <div 
                style={{fontSize:'1.2rem', marginBottom:'15px'}} 
                dangerouslySetInnerHTML={{__html: myPlayer.tasks.t1.text.replace("...", "_______")}} 
              />
              <input 
                className="cyber-input" 
                placeholder="Ide a választ..." 
                value={answers.t1} 
                onChange={e => setAnswers({...answers, t1: e.target.value})}
              />
            </div>

            <div className="glass-card">
              <div className="task-label">2. KÍN-PAD (Betűk: {myPlayer.tasks.t2.letters})</div>
              <div style={{fontSize:'1.2rem', marginBottom:'15px'}}>
                {myPlayer.tasks.t2.text}
              </div>
              <input 
                className="cyber-input" 
                placeholder="Vallomásod..." 
                value={answers.t2} 
                onChange={e => setAnswers({...answers, t2: e.target.value})}
              />
            </div>

            <div className="glass-card">
              <div className="task-label">3. SZTORILÁNC (Kösd össze!)</div>
              <div className="celeb-badge">{myPlayer.tasks.t3.celebs[0]}</div>
              <input 
                className="cyber-input" 
                placeholder="Mit tett vele?" 
                value={answers.t3_1} 
                onChange={e => setAnswers({...answers, t3_1: e.target.value})}
              />
              <div className="celeb-badge" style={{background:'#00f3ff', color:'black'}}>
                {myPlayer.tasks.t3.celebs[1]}
              </div>
              <input 
                className="cyber-input" 
                placeholder="És aztán?" 
                value={answers.t3_2} 
                onChange={e => setAnswers({...answers, t3_2: e.target.value})}
              />
              <div className="celeb-badge" style={{background:'#ffdd00', color:'black'}}>
                {myPlayer.tasks.t3.celebs[2]}
              </div>
            </div>

            <div className="glass-card">
              <div className="task-label">4. CASTING: {myPlayer.tasks.t4.role}</div>
              <div className="casting-grid">
                {myPlayer.tasks.t4.options.map((opt: string, i: number) => (
                  <button 
                    key={i} 
                    className={`cast-btn ${answers.t4 === i ? 'selected' : ''}`}
                    onClick={() => setAnswers({...answers, t4: i})}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              className="btn-action" 
              onClick={submitAnswers}
              disabled={loading || !answers.t1.trim() || !answers.t2.trim() || !answers.t3_1.trim() || !answers.t3_2.trim() || answers.t4 === null}
              style={{
                opacity: (!answers.t1.trim() || !answers.t2.trim() || !answers.t3_1.trim() || !answers.t3_2.trim() || answers.t4 === null) ? 0.6 : 1
              }}
            >
              {loading ? 'BEKÜLDÉS...' : 'KÉSZ VAGYOK!'}
            </button>
          </div>
        )}

        {/* VOTING */}
        {view === 'VOTING' && targetPlayer && (
          <div className="container">
            <h1 style={{textAlign:'center', color:'#ff00de', fontSize:'2.5rem'}}>
              {targetPlayer.name}
            </h1>
            
            <div className="glass-card">
              <div className="task-label">SZITUÁCIÓ:</div>
              <div style={{color:'#ffdd00', fontSize:'1.3rem', padding:'10px', minHeight:'80px'}}>
                {targetPlayer.answers?.t1 || "Nem válaszolt"}
              </div>
            </div>
            
            <div className="glass-card">
              <div className="task-label">VALLOMÁS:</div>
              <div style={{color:'#00f3ff', fontSize:'1.3rem', padding:'10px', minHeight:'80px'}}>
                {targetPlayer.answers?.t2 || "Nem válaszolt"}
              </div>
            </div>
            
            {targetPlayer.name !== myName ? (
              <div className="rating-box">
                <div style={{textAlign:'center', fontWeight:'bold', color:'#00f3ff', fontSize:'1.5rem'}}>
                  PONT: {myVote}
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={myVote} 
                  onChange={e => setMyVote(parseInt(e.target.value))}
                />
                <button 
                  className="btn-action" 
                  style={{marginTop:'15px'}}
                  onClick={submitVote}
                  disabled={loading}
                >
                  {loading ? 'SZAVAZÁS...' : 'SZAVAZOK'}
                </button>
              </div>
            ) : (
              <div className="glass-card" style={{textAlign:'center'}}>
                <h2 style={{color:'#ffdd00'}}>Most a többiek téged pontoznak...</h2>
                <p style={{color:'#aaa'}}>Várakozás a szavazatokra</p>
              </div>
            )}
          </div>
        )}

        {/* WAITING */}
        {(view === 'WAITING' || view === 'WAITING_VOTE') && (
          <div className="container" style={{justifyContent:'center', alignItems:'center'}}>
            <div style={{fontSize:'5rem', animation:'pulse 1.5s infinite', textAlign:'center'}}>
              ⏳
            </div>
            <h2 style={{textAlign:'center'}}>
              {view === 'WAITING' ? 'VÁRAKOZÁS A TÖBBI JÁTÉKOSOKRA...' : 'SZAVAZATOK ÖSSZESÍTÉSE...'}
            </h2>
            <p style={{textAlign:'center', color:'#888', maxWidth:'400px'}}>
              A játék automatikusan folytatódik, amint mindenki kész
            </p>
          </div>
        )}

        {/* LEADERBOARD */}
        {view === 'LEADERBOARD' && state && (
          <div className="container">
            <h1 style={{textAlign:'center', fontSize:'3.5rem', color:'#ff00de'}}>
              EREDMÉNYEK
            </h1>
            
            {state.players
              ?.sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
              .map((p: any, i: number) => (
                <div 
                  key={p.name} 
                  className="glass-card" 
                  style={{
                    display:'flex', 
                    justifyContent:'space-between', 
                    alignItems:'center',
                    background: p.name === myName ? 'rgba(255, 0, 222, 0.2)' : 'rgba(15, 10, 25, 0.9)'
                  }}
                >
                  <div style={{fontSize:'1.3rem'}}>
                    #{i + 1} {p.name} {p.name === myName && '(TE)'}
                  </div>
                  <div style={{fontSize:'2rem', color:'#00f3ff', fontWeight:'bold'}}>
                    {p.score || 0}
                  </div>
                </div>
              ))}
            
            {role === 'HOST' && (
              <button 
                className="btn-action" 
                onClick={startRound}
                disabled={loading}
              >
                {loading ? 'FELDOLGOZÁS...' : 'ÚJ KÖR'}
              </button>
            )}
            
            <button 
              className="btn-action" 
              style={{background:'#222', marginTop:'10px'}}
              onClick={() => {
                setView('MENU');
                setRole(null);
                setRoomId('');
                setState(null);
              }}
            >
              VISSZA A FŐMENÜBE
            </button>
          </div>
        )}
      </div>
    </>
  );
}
