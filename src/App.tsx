import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import * as THREE from 'three';

// === SZERVER KONFIGURÁCIÓ ===
const BACKEND_URL = "https://trash-backend.balazsnorberttt.workers.dev";

// === 1. GLOBÁLIS STÍLUSOK ===
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

// === 3. ADATBÁZIS & SEGÉDFÜGGVÉNYEK ===
const TRASH_CELEBS = ["Tóth Gabi", "Alekosz", "Varga Irén", "Berki szelleme", "Győzike", "Orbán Viktor", "Pumped Gabo", "PSG Ogli", "Zámbó Jimmy", "Kiszel Tünde", "G.w.M", "Szabyest", "Deutsch Tamás", "Varga Judit", "Lakatos Brendon", "Gyurcsány Ferenc", "Németh Szilárd", "Whisper Ton", "Bartos Cs. István", "Fekete Pákó"];
const SITUATIONS = [
  "A Blahán {WHO} éppen ezt csinálta:",
  "A Parlamentben {WHO} a pulpituson állva ezt kiabálta:",
  "A ravatalozóban {WHO} ezt a tárgyat ejtette a koporsóba:",
  "Az OnlyFans oldalán {WHO} ezt a szolgáltatást hirdette meg:",
  "A Híradóban bemondták, hogy {WHO} táskájában ezt találták:"
];
const QUESTIONS = [
  "Maszturbálás közben véletlenül ezt kiabáltad ki az ablakon:", 
  "A proktológus benyúlt, ezt súgtad oda neki halkan:", 
  "Ezt írnád a saját sírkövedre utolsó üzenetként:",
  "Mit mondanál, ha Orbán Viktor meztelenül kopogna nálad éjfélkor?",
  "Mit súgnál Putyin fülébe, ha te lennél a tolmácsa?"
];
const ROLES = ["Aki titokban lábképeket árul az interneten", "Aki titokban szerelmes Németh Szilárdba", "Akinek a böngészési előzményeiért börtön járna", "Aki biztosan sírva fakad szex közben", "Aki simán lefeküdne egy állattal pénzért"];
const LETTERS = ["A", "B", "Cs", "D", "E", "F", "G", "Gy", "H", "K", "L", "M", "N", "Ny", "P", "R", "S", "Sz", "T", "V", "Z", "Zs"];

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === SZINKRONIZÁCIÓ ===
  useEffect(() => {
    if (!roomId || view === 'MENU') return;
    
    let isActive = true;
    
    const syncInterval = setInterval(async () => {
      if (!isActive) return;
      
      try {
        const res = await fetch(`${BACKEND_URL}?roomId=${roomId}`);
        
        if (!res.ok) {
          if (res.status === 404 && view !== 'LOBBY') {
             // 404 hiba kezelése
          }
          return;
        }
        
        const data = await res.json();
        
        if (data && data.error && data.error === "Nincs szoba" && view !== 'MENU' && view !== 'LOBBY') {
            setError("A szoba lejárt");
            setView('MENU');
            return;
        }
        
        if (isActive && data && !data.error) {
          setState(data);
          setError(null);
          
          if (data.currentPhase && data.currentPhase !== view) {
            setView(data.currentPhase);
            // Ha visszakerülünk PLAYING-be (új kör), reseteljük a válaszokat
            if (data.currentPhase === 'PLAYING') {
                setAnswers({ t1: "", t2: "", t3_1: "", t3_2: "", t4: null });
            }
          }
          
          if (data.votingIndex !== undefined) {
            setVotingIndex(data.votingIndex);
          }
        }
      } catch (e) {
        console.error("Sync error", e);
      }
    }, 2000);
    
    return () => {
      isActive = false;
      clearInterval(syncInterval);
    };
  }, [roomId, view]);

  // === JAVÍTOTT POST UPDATE ===
  const postUpdate = async (update: any, customRoomId?: string) => {
    setLoading(true);
    setError(null);
    const targetId = customRoomId || roomId;

    try {
      const payload = { roomId: targetId, ...update };
      const response = await fetch(`${BACKEND_URL}?roomId=${targetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      if (data && !data.error) setState(prev => ({ ...prev, ...data }));
      return data;
    } catch (error: any) {
      console.error("Update hiba:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // === CREATE ROOM ===
  const createRoom = async () => {
    if (!myName.trim()) { alert("Add meg a neved!"); return; }
    setLoading(true);
    try {
      const id = Math.floor(1000 + Math.random() * 9000).toString();
      const initialState = {
        players: [{ name: myName, score: 0, answers: null, tasks: null, ready: false, isHost: true }],
        currentPhase: 'LOBBY',
        roomId: id,
        votingIndex: 0,
        round: 1, // --- JAVÍTÁS: Körszámláló kezdése ---
        createdAt: new Date().toISOString()
      };
      const result = await postUpdate(initialState, id);
      if (result && !result.error) {
        setRoomId(id);
        setRole('HOST');
        setState(initialState);
        setView('LOBBY');
      }
    } catch (error: any) { setError("Hiba: " + error.message); } 
    finally { setLoading(false); }
  };

  // === JOIN ROOM ===
  const joinRoom = async () => {
    if (!roomId.trim() || !myName.trim()) { alert("Adatok hiányoznak!"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}?roomId=${roomId}`);
      if (!res.ok) throw new Error("Hiba a csatlakozásnál");
      const data = await res.json();
      
      if (data.error) { alert("Nincs ilyen szoba!"); return; }
      if (data.players.some((p: any) => p.name === myName)) { alert("Név foglalt!"); return; }
      
      const updatedPlayers = [...(data.players || []), { name: myName, score: 0, answers: null, tasks: null, ready: false, isHost: false }];
      const updateResult = await postUpdate({ players: updatedPlayers });
      if (updateResult && !updateResult.error) { setRole('CLIENT'); setView('LOBBY'); }
    } catch (error: any) { alert(error.message); } 
    finally { setLoading(false); }
  };

  // === START ROUND (ELSŐ KÖR) ===
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
        round: 1, // Biztosítjuk, hogy az 1. kör indul
        roundStarted: new Date().toISOString()
      });
      setAnswers({ t1: "", t2: "", t3_1: "", t3_2: "", t4: null });
    } catch (error) { console.error(error); }
  };

  // === SUBMIT ANSWERS ===
  const submitAnswers = async () => {
    if (!state || !myName) return;
    try {
      const updatedPlayers = state.players.map((player: any) => {
        if (player.name === myName) {
          return { ...player, answers: answers, ready: true };
        }
        return player;
      });
      
      const allReady = updatedPlayers.every((p: any) => p.ready);
      
      // Ha mindenki kész, reseteljük a ready állapotot a szavazáshoz
      const playersForNextPhase = allReady 
        ? updatedPlayers.map((p: any) => ({ ...p, ready: false })) 
        : updatedPlayers;

      await postUpdate({ 
        players: playersForNextPhase, 
        currentPhase: allReady ? 'VOTING' : 'PLAYING',
        votingIndex: 0
      });
      setView('WAITING');
    } catch (error) { console.error(error); }
  };

  // === JAVÍTOTT SUBMIT VOTE (KÖRÖK KEZELÉSE + SAJÁT SZAVAZÁS JAVÍTÁSA) ===
  const submitVote = async () => {
    if (!state || votingIndex >= state.players.length) return;
    
    try {
      const targetPlayer = state.players[votingIndex];
      const MAX_ROUNDS = 3; // Összesen hány kör legyen

      const updatedPlayers = state.players.map((player: any) => {
        const updated = { ...player };
        
        // Pont hozzáadása a célpontnak
        if (player.name === targetPlayer.name) {
          updated.score = (updated.score || 0) + myVote;
        }
        
        // A szavazó (én) kész vagyok
        if (player.name === myName) {
          updated.ready = true;
        }
        
        return updated;
      });
      
      // --- JAVÍTÁS: Ellenőrizzük, hogy mindenki szavazott-e, KIVÉVE a célpontot ---
      // A célpontnak nem kell szavaznia magára, ezért őt nem számoljuk bele a "ready" checkbe
      const voters = updatedPlayers.filter((p: any) => p.name !== targetPlayer.name);
      const allVoted = voters.every((p: any) => p.ready);
      
      if (allVoted) {
        const nextIndex = votingIndex + 1;
        const isVotingOver = nextIndex >= state.players.length;
        
        // Reset ready állapotok a következő fázishoz
        const resetPlayers = updatedPlayers.map((p: any) => ({ ...p, ready: false }));
        
        if (isVotingOver) {
          // --- JAVÍTÁS: KÖR VÁLTÁS LOGIKA ---
          const currentRound = state.round || 1;
          
          if (currentRound < MAX_ROUNDS) {
            // HA VAN MÉG KÖR -> Új feladatok, új kör
            const playersWithNewTasks = resetPlayers.map((player: any) => ({
                ...player,
                tasks: generateTasks(),
                answers: null,
                ready: false
            }));

            await postUpdate({
                players: playersWithNewTasks,
                currentPhase: 'PLAYING',
                votingIndex: 0,
                round: currentRound + 1
            });
            // A view automatikusan frissül majd a useEffect-ben
          } else {
            // HA NINCS TÖBB KÖR -> EREDMÉNYHIRDETÉS
            await postUpdate({ 
              players: resetPlayers, 
              currentPhase: 'LEADERBOARD',
              votingIndex: 0 
            });
            setView('LEADERBOARD');
          }

        } else {
          // JÖN A KÖVETKEZŐ JÁTÉKOS ÉRTÉKELÉSE
          await postUpdate({ 
            players: resetPlayers, 
            currentPhase: 'VOTING', 
            votingIndex: nextIndex 
          });
          setVotingIndex(nextIndex);
          setMyVote(5);
          setView('VOTING');
        }
      } else {
        // MÉG VÁRUNK VALAKIRE EBBEN A SZAVAZÁSBAN
        await postUpdate({ 
          players: updatedPlayers, 
          currentPhase: 'VOTING',
          votingIndex: votingIndex
        });
        setView('WAITING_VOTE');
      }
    } catch (error) { console.error("Szavazási hiba:", error); }
  };

  const myPlayer = state?.players?.find((p: any) => p.name === myName);
  const targetPlayer = state?.players?.[votingIndex];

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="app-layer">
        <div style={{position:'absolute', inset:0, zIndex:-1}}>
          <Canvas>
            <Stars count={5000} factor={4} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10,10,10]} color="#00f3ff" intensity={2} />
            <Float><FloatingDebris /></Float>
          </Canvas>
        </div>

        {error && (
          <div style={{position:'fixed', top:'10px', left:'50%', transform:'translateX(-50%)', background:'red', color:'white', padding:'10px 20px', borderRadius:'10px', zIndex:1000}}>
            {error} <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {view === 'MENU' && (
          <div className="container" style={{justifyContent:'center'}}>
            <h1 style={{fontFamily:'Black Ops One', fontSize:'3.5rem', textAlign:'center', textShadow:'0 0 20px #ff00de'}}>TRASH UNIVERSE</h1>
            <div className="glass-card">
              <input className="cyber-input" placeholder="NEVED" value={myName} onChange={e => setMyName(e.target.value)} disabled={loading} />
              <button className="btn-action" onClick={createRoom} disabled={loading}>{loading ? '...' : 'ÚJ JÁTÉK'}</button>
              <div style={{height:'1px', background:'#444', margin:'20px 0'}} />
              <input className="cyber-input" placeholder="SZOBA KÓD" value={roomId} onChange={e => setRoomId(e.target.value)} disabled={loading} />
              <button className="btn-action" style={{background:'#222'}} onClick={joinRoom} disabled={loading}>{loading ? '...' : 'CSATLAKOZÁS'}</button>
            </div>
          </div>
        )}

        {view === 'LOBBY' && state && (
          <div className="container">
            <h1 style={{fontSize:'3rem', textAlign:'center', color:'#00f3ff'}}>SZOBA: {roomId}</h1>
            <div className="glass-card">
              <div style={{display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'10px'}}>
                {state.players?.map((p: any, i: number) => (
                  <div key={i} className="player-pill" style={{background: p.name === myName ? '#ff00de' : '#111'}}>
                    {p.name} {p.name === myName && '(TE)'}
                  </div>
                ))}
              </div>
              {state.players?.length < 2 && <p style={{textAlign:'center', marginTop:'10px'}}>Várj még játékost!</p>}
            </div>
            {role === 'HOST' && state.players?.length >= 2 && (
              <button className="btn-action" onClick={startRound} disabled={loading}>JÁTÉK INDÍTÁSA</button>
            )}
            {role === 'CLIENT' && <p style={{textAlign:'center', color:'#888'}}>Várakozás a hostra...</p>}
            <button className="btn-action" style={{background:'#222', marginTop:'10px'}} onClick={() => { setView('MENU'); setRole(null); }}>KILÉPÉS</button>
          </div>
        )}

        {view === 'PLAYING' && myPlayer?.tasks && (
          <div className="container">
            <div style={{padding:'15px', background:'rgba(0,0,0,0.9)', borderBottom:'2px solid #ff00de', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:100}}>
              <span>{myName}</span>
              <span style={{fontFamily:'Black Ops One'}}>KÖR: {state.round || 1}/3</span>
            </div>
            
            {/* 1. FELADAT: BETŰS JÁTÉK */}
            <div className="glass-card">
              <div className="task-label">1. RÖVIDÍTÉS (MOZAIKSZÓ)</div>
              <div style={{marginBottom:'10px', fontSize:'0.9rem', color:'#aaa'}}>
                Mit jelentenek ezek a betűk ebben a szituációban?
              </div>
              <div 
                style={{fontSize:'1.1rem', marginBottom:'15px'}} 
                dangerouslySetInnerHTML={{__html: myPlayer.tasks.t1.text}} 
              />
              <div style={{textAlign:'center', fontSize:'2rem', fontWeight:'900', color:'#ffdd00', textShadow:'0 0 10px #ffdd00', margin:'10px 0'}}>
                {myPlayer.tasks.t1.letters}
              </div>
              <input 
                className="cyber-input" 
                placeholder="Pl: Aladár Béla Cecília" 
                value={answers.t1} 
                onChange={e => setAnswers({...answers, t1: e.target.value})}
              />
            </div>

            <div className="glass-card">
              <div className="task-label">2. KÍN-PAD (Felelj!)</div>
              <div style={{fontSize:'1.2rem', marginBottom:'15px'}}>{myPlayer.tasks.t2.text}</div>
              <input className="cyber-input" placeholder="Válasz..." value={answers.t2} onChange={e => setAnswers({...answers, t2: e.target.value})} />
            </div>

            <div className="glass-card">
              <div className="task-label">3. SZTORILÁNC</div>
              <div className="celeb-badge">{myPlayer.tasks.t3.celebs[0]}</div>
              <input className="cyber-input" placeholder="Mit tett?" value={answers.t3_1} onChange={e => setAnswers({...answers, t3_1: e.target.value})} />
              <div className="celeb-badge" style={{background:'#00f3ff', color:'black'}}>{myPlayer.tasks.t3.celebs[1]}</div>
              <input className="cyber-input" placeholder="Mi lett a vége?" value={answers.t3_2} onChange={e => setAnswers({...answers, t3_2: e.target.value})} />
              <div className="celeb-badge" style={{background:'#ffdd00', color:'black'}}>{myPlayer.tasks.t3.celebs[2]}</div>
            </div>

            <div className="glass-card">
              <div className="task-label">4. CASTING (Ki illik a szerepre?)</div>
              <div style={{marginBottom:'10px', color:'#00f3ff', fontWeight:'bold', fontSize:'1.1rem'}}>"{myPlayer.tasks.t4.role}"</div>
              <div className="casting-grid">
                {myPlayer.tasks.t4.options.map((opt: string, i: number) => (
                  <button key={i} className={`cast-btn ${answers.t4 === i ? 'selected' : ''}`} onClick={() => setAnswers({...answers, t4: i})}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              className="btn-action" 
              onClick={submitAnswers}
              disabled={loading || !answers.t1.trim() || !answers.t2.trim() || !answers.t3_1.trim() || !answers.t3_2.trim() || answers.t4 === null}
              style={{opacity: (!answers.t1.trim() || !answers.t2.trim() || !answers.t3_1.trim() || !answers.t3_2.trim() || answers.t4 === null) ? 0.6 : 1}}
            >
              {loading ? '...' : 'BEKÜLDÉS'}
            </button>
          </div>
        )}

        {view === 'VOTING' && targetPlayer && (
          <div className="container">
            <h1 style={{textAlign:'center', color:'#ff00de', fontSize:'2.5rem'}}>{targetPlayer.name}</h1>
            
            <div className="glass-card">
              <div className="task-label">RÖVIDÍTÉS ({targetPlayer.tasks?.t1.letters}):</div>
              <div style={{color:'#ffdd00', fontSize:'1.3rem', padding:'10px'}}>{targetPlayer.answers?.t1 || "---"}</div>
            </div>
            
            <div className="glass-card">
              <div className="task-label">VALLOMÁS:</div>
              <div style={{color:'#00f3ff', fontSize:'1.3rem', padding:'10px'}}>{targetPlayer.answers?.t2 || "---"}</div>
            </div>
            
            {targetPlayer.name !== myName ? (
              <div className="rating-box">
                <div style={{textAlign:'center', fontWeight:'bold', color:'#00f3ff', fontSize:'1.5rem'}}>PONT: {myVote}</div>
                <input type="range" min="1" max="10" value={myVote} onChange={e => setMyVote(parseInt(e.target.value))} />
                <button className="btn-action" style={{marginTop:'15px'}} onClick={submitVote} disabled={loading}>SZAVAZOK</button>
              </div>
            ) : (
              <div className="glass-card" style={{textAlign:'center'}}>
                <h2 style={{color:'#ffdd00'}}>TÉGED ÉRTÉKELNEK...</h2>
                <p style={{color:'#aaa'}}>A többiek épp a szavazatukat adják le.</p>
                <div style={{fontSize:'3rem', animation:'pulse 1s infinite'}}>👀</div>
              </div>
            )}
          </div>
        )}

        {(view === 'WAITING' || view === 'WAITING_VOTE') && (
          <div className="container" style={{justifyContent:'center', alignItems:'center'}}>
            <div style={{fontSize:'5rem', animation:'pulse 1.5s infinite'}}>⏳</div>
            <h2 style={{textAlign:'center'}}>{view === 'WAITING' ? 'MÁSOK ÍRNAK...' : 'SZAVAZATOK BEKÜLDÉSE...'}</h2>
          </div>
        )}

        {view === 'LEADERBOARD' && state && (
          <div className="container">
            <h1 style={{textAlign:'center', fontSize:'3.5rem', color:'#ff00de'}}>VÉGEREDMÉNY</h1>
            {state.players?.sort((a: any, b: any) => (b.score || 0) - (a.score || 0)).map((p: any, i: number) => (
              <div key={p.name} className="glass-card" style={{display:'flex', justifyContent:'space-between', alignItems:'center', background: p.name === myName ? 'rgba(255, 0, 222, 0.2)' : 'rgba(15, 10, 25, 0.9)'}}>
                <div style={{fontSize:'1.3rem'}}>#{i + 1} {p.name} {p.name === myName && '(TE)'}</div>
                <div style={{fontSize:'2rem', color:'#00f3ff', fontWeight:'bold'}}>{p.score || 0}</div>
              </div>
            ))}
            {role === 'HOST' && <button className="btn-action" onClick={startRound} disabled={loading}>ÚJ JÁTÉK INDÍTÁSA</button>}
            <button className="btn-action" style={{background:'#222', marginTop:'10px'}} onClick={() => { setView('MENU'); setRole(null); setRoomId(''); setState(null); }}>VISSZA</button>
          </div>
        )}
      </div>
    </>
  );
}