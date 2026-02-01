// ============================================================================
// TRASH UNIVERSE - SZERVER-KÖZPONTÚ FRONTEND
// ============================================================================

import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// ============================================================================
// KONFIGURÁCIÓ
// ============================================================================
const BACKEND_URL = "https://trash-backend.balazsnorberttt.workers.dev"; // CSERÉLD LE!
const POLL_INTERVAL = 1000; // 1 másodperc

// ============================================================================
// GLOBÁLIS STÍLUSOK
// ============================================================================
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@500;700;900&display=swap');
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body { margin: 0; background: #000; overflow: hidden; font-family: 'Rajdhani', sans-serif; color: white; touch-action: manipulation; }
  .app-layer { position: absolute; inset: 0; display: flex; flex-direction: column; z-index: 10; overflow-y: auto; overflow-x: hidden; width: 100vw; }
  .container { width: 100%; max-width: 600px; margin: 0 auto; padding: 15px; display: flex; flex-direction: column; min-height: 100vh; }
  .cyber-input { width: 100%; padding: 15px; background: rgba(0,0,0,0.8); border: 2px solid #ff00de; color: #ffdd00; font-family: 'Rajdhani'; font-size: 1.2rem; font-weight: bold; border-radius: 8px; text-align: center; outline: none; margin: 10px 0; text-transform: uppercase; }
  .btn-action { width: 100%; padding: 20px; background: linear-gradient(90deg, #ff00de, #00f3ff); color: white; font-family: 'Black Ops One'; font-size: 1.5rem; border: none; border-radius: 50px; cursor: pointer; text-transform: uppercase; box-shadow: 0 5px 30px rgba(255,0,222,0.4); text-shadow: 2px 2px 0 black; margin: 10px 0; transition: 0.2s; }
  .btn-action:active { transform: scale(0.95); }
  .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }
  .glass-card { background: rgba(15, 10, 25, 0.9); border: 1px solid rgba(255, 0, 222, 0.4); border-radius: 16px; padding: 20px; margin-bottom: 20px; backdrop-filter: blur(10px); box-shadow: 0 10px 40px rgba(0,0,0,0.8); }
  .task-label { color: #00f3ff; font-weight: 900; letter-spacing: 2px; margin-bottom: 12px; text-transform: uppercase; font-size: 0.9rem; border-bottom: 1px solid #444; padding-bottom: 5px; }
  .celeb-badge { background: #ff00de; color: white; padding: 8px 12px; border-radius: 6px; font-weight: 900; font-size: 0.9rem; box-shadow: 0 0 10px #ff00de; text-transform: uppercase; display: inline-block; margin: 5px 0; }
  .highlight { color: #ff00de; font-weight: 900; text-shadow: 0 0 10px #ff00de; }
  .player-pill { padding: 8px 15px; background: #111; border-radius: 20px; border: 1px solid #ff00de; font-weight: bold; margin: 5px; display: inline-block; }
  .rating-box { margin-top: 10px; background: rgba(0,0,0,0.6); padding: 15px; border-radius: 12px; border: 1px dashed #ff00de; }
  input[type=range] { width: 100%; cursor: pointer; accent-color: #ff00de; height: 30px; }
  @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }
  .error-banner { position: fixed; top: 10px; left: 50%; transform: translateX(-50%); background: rgba(255, 0, 0, 0.95); color: white; padding: 15px 30px; border-radius: 10px; z-index: 1000; box-shadow: 0 5px 20px rgba(255,0,0,0.5); }
`;

// ============================================================================
// 3D KOMPONENSEK
// ============================================================================
function CyberSphere({ position }) {
  const meshRef = useRef(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[2, 32, 32]} />
        <MeshDistortMaterial
          color="#ff00de"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

function FloatingDebris() {
  const mesh = useRef(null);
  const count = 80;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => Array.from({ length: count }, () => ({
    pos: [(Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80],
    rotSpeed: Math.random() * 0.02,
    scale: 0.3 + Math.random() * 0.8
  })), []);
  
  useFrame((state) => {
    if (!mesh.current) return;
    particles.forEach((p, i) => {
      dummy.position.set(p.pos[0], p.pos[1], p.pos[2]);
      dummy.rotation.x += p.rotSpeed;
      dummy.rotation.y += p.rotSpeed;
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.rotation.y = state.clock.elapsedTime * 0.03;
  });
  
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#00f3ff" wireframe />
    </instancedMesh>
  );
}

// ============================================================================
// API HÍVÁSOK
// ============================================================================
async function createRoom(playerName) {
  const res = await fetch(`${BACKEND_URL}/create-room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName })
  });
  return res.json();
}

async function joinRoom(roomId, playerName) {
  const res = await fetch(`${BACKEND_URL}/join-room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, playerName })
  });
  return res.json();
}

async function getRoom(roomId, playerName) {
  const res = await fetch(`${BACKEND_URL}/get-room?roomId=${roomId}&playerName=${encodeURIComponent(playerName)}`);
  return res.json();
}

async function startRound(roomId, playerName) {
  const res = await fetch(`${BACKEND_URL}/start-round`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, playerName })
  });
  return res.json();
}

async function submitAnswers(roomId, playerName, answers) {
  const res = await fetch(`${BACKEND_URL}/submit-answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, playerName, answers })
  });
  return res.json();
}

async function submitVote(roomId, playerName, vote) {
  const res = await fetch(`${BACKEND_URL}/submit-vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, playerName, vote })
  });
  return res.json();
}

async function leaveRoom(roomId, playerName) {
  const res = await fetch(`${BACKEND_URL}/leave-room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, playerName })
  });
  return res.json();
}

// ============================================================================
// FŐ KOMPONENS
// ============================================================================
export default function App() {
  const [screen, setScreen] = useState('MENU');
  const [roomId, setRoomId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [myName, setMyName] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [answers, setAnswers] = useState({ t1: "", t2: "", t3_1: "", t3_2: "", t4: "" });
  const [myVote, setMyVote] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pollingRef = useRef(null);

  // ========================================================================
  // POLLING - AUTOMATIKUS SZINKRONIZÁLÁS
  // ========================================================================
  useEffect(() => {
    if (!roomId || !myName || screen === 'MENU') {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      return;
    }

    const poll = async () => {
      try {
        const data = await getRoom(roomId, myName);
        
        if (data.success && data.roomData) {
          setRoomData(data.roomData);
          setError(null);

          // AUTOMATIKUS SCREEN VÁLTÁS
          const serverPhase = data.roomData.currentPhase;
          
          if (serverPhase === 'LOBBY' && screen !== 'LOBBY') {
            setScreen('LOBBY');
          } else if (serverPhase === 'PLAYING' && screen !== 'PLAYING' && screen !== 'WAITING') {
            setScreen('PLAYING');
            setAnswers({ t1: "", t2: "", t3_1: "", t3_2: "", t4: "" });
          } else if (serverPhase === 'VOTING' && screen !== 'VOTING' && screen !== 'WAITING_VOTE') {
            setScreen('VOTING');
            setMyVote(5);
          } else if (serverPhase === 'LEADERBOARD' && screen !== 'LEADERBOARD') {
            setScreen('LEADERBOARD');
          }
        } else if (data.error) {
          setError(data.error);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    poll(); // Azonnal
    pollingRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [roomId, myName, screen]);

  // ========================================================================
  // MENU AKCIÓK
  // ========================================================================
  const handleCreateRoom = async () => {
    if (!myName.trim() || myName.trim().length < 2) {
      setError('Add meg a neved (min 2 karakter)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await createRoom(myName.trim());
      
      if (data.success) {
        setRoomId(data.roomId);
        setRoomData(data.roomData);
        setScreen('LOBBY');
      } else {
        setError(data.error || 'Hiba történt');
      }
    } catch (err) {
      setError('Nem sikerült kapcsolódni a szerverhez');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!myName.trim() || myName.trim().length < 2) {
      setError('Add meg a neved (min 2 karakter)');
      return;
    }
    if (!joinCode.trim() || joinCode.trim().length !== 4) {
      setError('A szobakód 4 számjegyű');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await joinRoom(joinCode.trim(), myName.trim());
      
      if (data.success) {
        setRoomId(joinCode.trim());
        setRoomData(data.roomData);
        setScreen('LOBBY');
      } else {
        setError(data.error || 'Hiba történt');
      }
    } catch (err) {
      setError('Nem sikerült csatlakozni');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // LOBBY AKCIÓK
  // ========================================================================
  const handleStartRound = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await startRound(roomId, myName);
      
      if (data.success) {
        setRoomData(data.roomData);
        setScreen('PLAYING');
        setAnswers({ t1: "", t2: "", t3_1: "", t3_2: "", t4: "" });
      } else {
        setError(data.error || 'Nem sikerült indítani');
      }
    } catch (err) {
      setError('Hiba a játék indításánál');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // PLAYING AKCIÓK
  // ========================================================================
  const handleSubmitAnswers = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await submitAnswers(roomId, myName, answers);
      
      if (data.success) {
        setRoomData(data.roomData);
        
        if (data.allReady) {
          setScreen('VOTING');
          setMyVote(5);
        } else {
          setScreen('WAITING');
        }
      } else {
        setError(data.error || 'Hiba történt');
      }
    } catch (err) {
      setError('Hiba a válaszok küldésekor');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // VOTING AKCIÓK
  // ========================================================================
  const handleSubmitVote = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await submitVote(roomId, myName, myVote);
      
      if (data.success) {
        setRoomData(data.roomData);
        
        if (data.allVoted) {
          // Automatikusan váltani fog a polling
        } else {
          setScreen('WAITING_VOTE');
        }
      } else {
        setError(data.error || 'Hiba történt');
      }
    } catch (err) {
      setError('Hiba a szavazásnál');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // KILÉPÉS
  // ========================================================================
  const handleLeave = async () => {
    try {
      await leaveRoom(roomId, myName);
    } catch (err) {
      console.error('Leave error:', err);
    }
    
    setScreen('MENU');
    setRoomId('');
    setRoomData(null);
    setMyName('');
    setJoinCode('');
  };

  // ========================================================================
  // SEGÉD VÁLTOZÓK
  // ========================================================================
  const myPlayer = roomData?.players?.find(p => p.name === myName);
  const isHost = myPlayer?.isHost || false;
  const targetPlayer = roomData?.votingPlayers?.[roomData?.votingIndex];
  const isDoubleWeighted = 
    roomData?.votingPlayers && 
    roomData.votingPlayers.length % 2 === 1 && 
    roomData.votingIndex === roomData.votingPlayers.length - 1;

  const canSubmitAnswers = 
    answers.t1.trim() && 
    answers.t2.trim() && 
    answers.t3_1.trim() && 
    answers.t3_2.trim() && 
    answers.t4.trim();

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      
      <div className="app-layer">
        {/* 3D HÁTTÉR */}
        <div style={{ position: 'absolute', inset: 0, zIndex: -1 }}>
          <Canvas camera={{ position: [0, 0, 20], fov: 75 }}>
            <Stars count={8000} factor={6} saturation={0.5} fade speed={1} />
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} color="#00f3ff" intensity={3} />
            <pointLight position={[-10, -10, -10]} color="#ff00de" intensity={2} />
            <CyberSphere position={[5, 2, -5]} />
            <CyberSphere position={[-5, -2, -8]} />
            <Float>
              <FloatingDebris />
            </Float>
          </Canvas>
        </div>

        {/* HIBA BANNER */}
        {error && (
          <div className="error-banner">
            {error}
            <button 
              onClick={() => setError(null)} 
              style={{
                marginLeft: '15px',
                background: 'white',
                color: 'red',
                border: 'none',
                borderRadius: '5px',
                padding: '5px 10px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ====== MENU SCREEN ====== */}
        {screen === 'MENU' && (
          <div className="container" style={{ justifyContent: 'center' }}>
            <h1 style={{
              fontFamily: 'Black Ops One',
              fontSize: '3.5rem',
              textAlign: 'center',
              textShadow: '0 0 20px #ff00de',
              marginBottom: '30px'
            }}>
              TRASH UNIVERSE
            </h1>

            <div className="glass-card">
              <input
                className="cyber-input"
                placeholder="NEVED"
                value={myName}
                onChange={e => setMyName(e.target.value)}
                disabled={loading}
                maxLength={20}
              />

              <button
                className="btn-action"
                onClick={handleCreateRoom}
                disabled={loading}
              >
                {loading ? 'LÉTREHOZÁS...' : 'ÚJ JÁTÉK'}
              </button>

              <div style={{ height: '1px', background: '#444', margin: '20px 0' }} />

              <input
                className="cyber-input"
                placeholder="SZOBA KÓD (4 szám)"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                disabled={loading}
                maxLength={4}
              />

              <button
                className="btn-action"
                style={{ background: '#222' }}
                onClick={handleJoinRoom}
                disabled={loading}
              >
                {loading ? 'CSATLAKOZÁS...' : 'CSATLAKOZÁS'}
              </button>
            </div>
          </div>
        )}

        {/* ====== LOBBY SCREEN ====== */}
        {screen === 'LOBBY' && roomData && (
          <div className="container">
            <h1 style={{
              fontSize: '3rem',
              textAlign: 'center',
              color: '#00f3ff',
              marginBottom: '20px'
            }}>
              SZOBA: {roomId}
            </h1>

            <div className="glass-card">
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '10px'
              }}>
                {roomData.players?.map((p, i) => (
                  <div
                    key={i}
                    className="player-pill"
                    style={{
                      background: p.name === myName 
                        ? 'linear-gradient(135deg, #ff00de, #9900cc)' 
                        : '#111',
                      borderColor: p.name === myName ? '#ff00de' : '#555'
                    }}
                  >
                    {p.isHost && '👑 '}
                    {p.name}
                    {p.name === myName && ' (TE)'}
                  </div>
                ))}
              </div>

              {roomData.players && roomData.players.length < 2 && (
                <div style={{
                  textAlign: 'center',
                  marginTop: '15px',
                  padding: '10px',
                  background: 'rgba(255,0,222,0.1)',
                  borderRadius: '8px',
                  border: '1px dashed #ff00de'
                }}>
                  ⚠️ Várj még {2 - roomData.players.length} játékost!
                </div>
              )}
            </div>

            {isHost && roomData.players && roomData.players.length >= 2 && (
              <button
                className="btn-action"
                onClick={handleStartRound}
                disabled={loading}
              >
                {loading ? 'INDÍTÁS...' : `JÁTÉK INDÍTÁSA (${roomData.players.length} JÁTÉKOS)`}
              </button>
            )}

            {!isHost && (
              <div style={{
                textAlign: 'center',
                color: '#888',
                marginTop: '20px'
              }}>
                Várakozás a host-ra...
              </div>
            )}

            <button
              className="btn-action"
              style={{ background: '#222', marginTop: '10px' }}
              onClick={handleLeave}
            >
              VISSZA
            </button>
          </div>
        )}

        {/* ====== PLAYING SCREEN ====== */}
        {screen === 'PLAYING' && myPlayer?.tasks && (
          <div className="container">
            {/* Header */}
            <div style={{
              padding: '15px 20px',
              background: 'rgba(0,0,0,0.9)',
              borderBottom: '2px solid #ff00de',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              zIndex: 100,
              marginBottom: '20px'
            }}>
              <span style={{ fontWeight: 'bold' }}>{myName}</span>
              <span style={{ fontFamily: 'Black Ops One', color: '#ff00de' }}>
                KÖR: {roomData.currentRound}/{roomData.totalRounds}
              </span>
            </div>

            {/* Task 1 */}
            <div className="glass-card">
              <div className="task-label">
                1. SZITUÁCIÓ (Betűk: {myPlayer.tasks.t1.letters})
              </div>
              <div
                style={{ fontSize: '1.2rem', marginBottom: '15px' }}
                dangerouslySetInnerHTML={{
                  __html: myPlayer.tasks.t1.text.replace("...", "_______")
                }}
              />
              <input
                className="cyber-input"
                placeholder="Ide a választ..."
                value={answers.t1}
                onChange={e => setAnswers({ ...answers, t1: e.target.value })}
              />
            </div>

            {/* Task 2 */}
            <div className="glass-card">
              <div className="task-label">
                2. KÍN-PAD (Betűk: {myPlayer.tasks.t2.letters})
              </div>
              <div style={{ fontSize: '1.2rem', marginBottom: '15px' }}>
                {myPlayer.tasks.t2.text}
              </div>
              <input
                className="cyber-input"
                placeholder="Vallomásod..."
                value={answers.t2}
                onChange={e => setAnswers({ ...answers, t2: e.target.value })}
              />
            </div>

            {/* Task 3 */}
            <div className="glass-card">
              <div className="task-label">3. SZTORILÁNC</div>
              <div className="celeb-badge">{myPlayer.tasks.t3.celebs[0]}</div>
              <input
                className="cyber-input"
                placeholder="Mit tett vele?"
                value={answers.t3_1}
                onChange={e => setAnswers({ ...answers, t3_1: e.target.value })}
              />
              <div className="celeb-badge" style={{ background: '#00f3ff', color: 'black' }}>
                {myPlayer.tasks.t3.celebs[1]}
              </div>
              <input
                className="cyber-input"
                placeholder="És aztán?"
                value={answers.t3_2}
                onChange={e => setAnswers({ ...answers, t3_2: e.target.value })}
              />
              <div className="celeb-badge" style={{ background: '#ffdd00', color: 'black' }}>
                {myPlayer.tasks.t3.celebs[2]}
              </div>
            </div>

            {/* Task 4 */}
            <div className="glass-card">
              <div className="task-label">4. TRASH SZÓTÁR</div>
              <div style={{
                fontSize: '1.2rem',
                marginBottom: '10px',
                color: '#ff00de'
              }}>
                {myPlayer.tasks.t4.prompt}
              </div>
              <div style={{
                fontSize: '2rem',
                textAlign: 'center',
                color: '#00f3ff',
                fontWeight: 'bold',
                marginBottom: '15px',
                letterSpacing: '10px'
              }}>
                {myPlayer.tasks.t4.letters}
              </div>
              <input
                className="cyber-input"
                placeholder="Pl: Barna Rakott Cici"
                value={answers.t4}
                onChange={e => setAnswers({ ...answers, t4: e.target.value })}
              />
            </div>

            <button
              className="btn-action"
              onClick={handleSubmitAnswers}
              disabled={loading || !canSubmitAnswers}
            >
              {loading ? 'BEKÜLDÉS...' : 'KÉSZ VAGYOK!'}
            </button>
          </div>
        )}

        {/* ====== VOTING SCREEN ====== */}
        {screen === 'VOTING' && targetPlayer && (
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ color: '#888', fontSize: '0.9rem' }}>
                KÖR {roomData.currentRound}/{roomData.totalRounds}
              </div>
              <h1 style={{
                color: '#ff00de',
                fontSize: '2.5rem',
                margin: '10px 0'
              }}>
                {targetPlayer.name}
              </h1>
              <div style={{ color: '#888' }}>
                {roomData.votingIndex + 1} / {roomData.votingPlayers.length} játékos értékelve
              </div>
              {isDoubleWeighted && (
                <div style={{
                  color: '#ffdd00',
                  fontWeight: 'bold',
                  marginTop: '5px'
                }}>
                  ⚠️ DUPLA SÚLY!
                </div>
              )}
            </div>

            <div className="glass-card">
              <div className="task-label">SZITUÁCIÓ:</div>
              <div style={{
                color: '#ffdd00',
                fontSize: '1.3rem',
                padding: '10px',
                minHeight: '80px'
              }}>
                {targetPlayer.answers?.t1 || "Nem válaszolt"}
              </div>
            </div>

            <div className="glass-card">
              <div className="task-label">VALLOMÁS:</div>
              <div style={{
                color: '#00f3ff',
                fontSize: '1.3rem',
                padding: '10px',
                minHeight: '80px'
              }}>
                {targetPlayer.answers?.t2 || "Nem válaszolt"}
              </div>
            </div>

            <div className="glass-card">
              <div className="task-label">TRASH SZÓTÁR:</div>
              <div style={{
                color: '#ff00de',
                fontSize: '1.1rem',
                padding: '10px',
                minHeight: '60px'
              }}>
                {targetPlayer.answers?.t4 || "Nem válaszolt"}
              </div>
            </div>

            {targetPlayer.name !== myName ? (
              <div className="rating-box">
                <div style={{
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#00f3ff',
                  fontSize: '1.5rem'
                }}>
                  PONT: {myVote} {isDoubleWeighted && `× 2 = ${myVote * 2}`}
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
                  style={{ marginTop: '15px' }}
                  onClick={handleSubmitVote}
                  disabled={loading}
                >
                  {loading ? 'SZAVAZÁS...' : 'SZAVAZOK'}
                </button>
              </div>
            ) : (
              <div className="glass-card" style={{ textAlign: 'center' }}>
                <h2 style={{ color: '#ffdd00' }}>
                  Most a többiek téged pontoznak...
                </h2>
                <p style={{ color: '#aaa' }}>Várakozás a szavazatokra</p>
              </div>
            )}
          </div>
        )}

        {/* ====== WAITING SCREENS ====== */}
        {(screen === 'WAITING' || screen === 'WAITING_VOTE') && (
          <div className="container" style={{
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{
              fontSize: '5rem',
              animation: 'pulse 1.5s infinite',
              textAlign: 'center'
            }}>
              ⏳
            </div>
            <h2 style={{ textAlign: 'center' }}>
              {screen === 'WAITING' 
                ? 'VÁRAKOZÁS A TÖBBI JÁTÉKOSOKRA...' 
                : 'SZAVAZATOK ÖSSZESÍTÉSE...'}
            </h2>
            <p style={{
              textAlign: 'center',
              color: '#888',
              maxWidth: '400px'
            }}>
              A játék automatikusan folytatódik, amint mindenki kész
            </p>
          </div>
        )}

        {/* ====== LEADERBOARD SCREEN ====== */}
        {screen === 'LEADERBOARD' && roomData && (
          <div className="container">
            <h1 style={{
              textAlign: 'center',
              fontSize: '3.5rem',
              color: '#ff00de',
              marginBottom: '30px'
            }}>
              VÉGEREDMÉNY
            </h1>

            {roomData.players
              ?.sort((a, b) => (b.score || 0) - (a.score || 0))
              .map((p, i) => (
                <div
                  key={p.name}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: p.name === myName 
                      ? 'rgba(255, 0, 222, 0.2)' 
                      : 'rgba(15, 10, 25, 0.9)',
                    border: i === 0 ? '2px solid #ffdd00' : undefined
                  }}
                >
                  <div style={{ fontSize: '1.3rem' }}>
                    {i === 0 && '🏆 '}
                    #{i + 1} {p.name}
                    {p.name === myName && ' (TE)'}
                  </div>
                  <div style={{
                    fontSize: '2rem',
                    color: '#00f3ff',
                    fontWeight: 'bold'
                  }}>
                    {p.score || 0}
                  </div>
                </div>
              ))
            }

            {isHost && (
              <button
                className="btn-action"
                onClick={handleStartRound}
                disabled={loading}
              >
                {loading ? 'FELDOLGOZÁS...' : 'ÚJ JÁTÉK INDÍTÁSA'}
              </button>
            )}

            <button
              className="btn-action"
              style={{ background: '#222', marginTop: '10px' }}
              onClick={handleLeave}
            >
              VISSZA A FŐMENÜBE
            </button>
          </div>
        )}
      </div>
    </>
  );
}