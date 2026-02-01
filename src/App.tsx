import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// === KONFIGURÁCIÓ ===
const API_URL = "https://your-worker.workers.dev"; // CSERÉLD LE!
const POLL_INTERVAL = 500; // Milyen gyakran kérjünk frissítést (ms)

// === 3D BOMBA ===
function CyberBomb({ urgency, isExploded }) {
  const meshRef = useRef(null);
  
  const color = new THREE.Color().lerpColors(
    new THREE.Color('#00ff88'), 
    new THREE.Color('#ff0055'), 
    urgency
  );

  useFrame((state) => {
    if (isExploded || !meshRef.current) return;
    const speed = 2 + (urgency * 15); 
    const scale = 1.6 + Math.sin(state.clock.elapsedTime * speed) * (0.05 + urgency * 0.3);
    meshRef.current.scale.set(scale, scale, scale);
    meshRef.current.rotation.y += 0.01 + urgency * 0.05;
  });

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]}>
      <MeshDistortMaterial 
        color={isExploded ? '#111' : color} 
        emissive={isExploded ? '#ff2200' : color}
        emissiveIntensity={isExploded ? 5 : 0.5 + urgency * 2}
        distort={0.3 + urgency * 0.6} 
        speed={2 + urgency * 4} 
      />
    </Sphere>
  );
}

// === API HÍVÁSOK ===
async function createRoom(playerName) {
  const res = await fetch(`${API_URL}/create-room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName })
  });
  return res.json();
}

async function joinRoom(roomId, playerName) {
  const res = await fetch(`${API_URL}/join-room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, playerName })
  });
  return res.json();
}

async function getRoom(roomId, playerName) {
  const res = await fetch(`${API_URL}/get-room?roomId=${roomId}&playerName=${playerName}`);
  return res.json();
}

async function toggleReady(roomId, playerName) {
  const res = await fetch(`${API_URL}/toggle-ready`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, playerName })
  });
  return res.json();
}

async function startGame(roomId, playerName) {
  const res = await fetch(`${API_URL}/start-game`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, playerName })
  });
  return res.json();
}

async function submitAnswer(roomId, playerName, answer) {
  const res = await fetch(`${API_URL}/submit-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, playerName, answer })
  });
  return res.json();
}

async function restartGame(roomId, playerName) {
  const res = await fetch(`${API_URL}/restart-game`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, playerName })
  });
  return res.json();
}

async function leaveRoom(roomId, playerName) {
  const res = await fetch(`${API_URL}/leave-room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, playerName })
  });
  return res.json();
}

// === FŐ ALKALMAZÁS ===
export default function App() {
  const [screen, setScreen] = useState('MENU'); // MENU, LOBBY, PLAYING, GAME_OVER
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  
  const pollingRef = useRef(null);

  // Polling - automatikus frissítés
  useEffect(() => {
    if (!roomId || !playerName || screen === 'MENU') {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      return;
    }

    const poll = async () => {
      try {
        const data = await getRoom(roomId, playerName);
        if (data.success) {
          setRoomData(data.roomData);
          
          // Automatikus screen váltás
          if (data.roomData.phase === 'LOBBY' && screen !== 'LOBBY') {
            setScreen('LOBBY');
          }
          if (data.roomData.phase === 'PLAYING' && screen !== 'PLAYING') {
            setScreen('PLAYING');
            setInput('');
            setTimeout(() => {
              document.getElementById('gameInput')?.focus();
            }, 100);
          }
          if (data.roomData.phase === 'GAME_OVER' && screen !== 'GAME_OVER') {
            setScreen('GAME_OVER');
          }
        } else {
          setError(data.error || 'Ismeretlen hiba');
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
  }, [roomId, playerName, screen]);

  // Időszámláló (playing közben)
  useEffect(() => {
    if (screen !== 'PLAYING' || !roomData || !roomData.startTime) return;

    const updateTime = () => {
      const elapsed = (Date.now() - roomData.startTime) / 1000;
      const remaining = Math.max(0, roomData.maxTime - elapsed);
      setTimeLeft(remaining);
    };

    updateTime();
    const timer = setInterval(updateTime, 100);

    return () => clearInterval(timer);
  }, [screen, roomData]);

  // === MENÜ AKCIÓK ===
  const handleCreateRoom = async () => {
    if (playerName.trim().length < 2) {
      setError('Add meg a neved (min 2 karakter)');
      return;
    }
    
    setError('');
    try {
      const data = await createRoom(playerName.trim());
      if (data.success) {
        setRoomId(data.roomId);
        setRoomData(data.roomData);
        setScreen('LOBBY');
      } else {
        setError(data.error || 'Hiba történt');
      }
    } catch (err) {
      setError('Nem sikerült kapcsolódni a szerverhez');
    }
  };

  const handleJoinRoom = async () => {
    if (playerName.trim().length < 2) {
      setError('Add meg a neved (min 2 karakter)');
      return;
    }
    if (joinCode.trim().length !== 4) {
      setError('A szobakód 4 számjegyű');
      return;
    }

    setError('');
    try {
      const data = await joinRoom(joinCode.trim(), playerName.trim());
      if (data.success) {
        setRoomId(joinCode.trim());
        setRoomData(data.roomData);
        setScreen('LOBBY');
      } else {
        setError(data.error || 'Hiba történt');
      }
    } catch (err) {
      setError('Nem sikerült csatlakozni');
    }
  };

  // === LOBBY AKCIÓK ===
  const handleToggleReady = async () => {
    try {
      const data = await toggleReady(roomId, playerName);
      if (data.success) {
        setRoomData(data.roomData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartGame = async () => {
    try {
      const data = await startGame(roomId, playerName);
      if (data.success) {
        setRoomData(data.roomData);
        setScreen('PLAYING');
        setInput('');
        setTimeout(() => {
          document.getElementById('gameInput')?.focus();
        }, 100);
      } else {
        setError(data.error || 'Nem sikerült indítani');
      }
    } catch (err) {
      setError('Hiba a játék indításánál');
    }
  };

  // === JÁTÉK AKCIÓK ===
  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (input.trim().length < 2) return;

    try {
      const data = await submitAnswer(roomId, playerName, input.trim());
      
      if (data.gameOver) {
        setRoomData(data.roomData);
        setScreen('GAME_OVER');
      } else if (data.newRound) {
        setRoomData(data.roomData);
        setInput('');
        setTimeout(() => {
          document.getElementById('gameInput')?.focus();
        }, 50);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // === GAME OVER AKCIÓK ===
  const handleRestart = async () => {
    try {
      const data = await restartGame(roomId, playerName);
      if (data.success) {
        setRoomData(data.roomData);
        setScreen('LOBBY');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeave = async () => {
    try {
      await leaveRoom(roomId, playerName);
      setScreen('MENU');
      setRoomId('');
      setRoomData(null);
      setPlayerName('');
      setJoinCode('');
    } catch (err) {
      console.error(err);
    }
  };

  // === SEGÉD VÁLTOZÓK ===
  const myPlayer = roomData?.players?.find(p => p.name === playerName);
  const isHost = myPlayer?.isHost || false;
  const allReady = roomData?.players?.every(p => p.ready) || false;
  const urgency = roomData?.maxTime ? Math.max(0, 1 - (timeLeft / roomData.maxTime)) : 0;

  return (
    <>
      {/* 3D HÁTTÉR */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <Canvas camera={{ position: [0, 0, 6] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#00f3ff" />
          <Stars radius={100} depth={50} count={3000} factor={4} fade />
          <CyberBomb urgency={urgency} isExploded={screen === 'GAME_OVER'} />
          <OrbitControls enableZoom={false} />
        </Canvas>
      </div>

      {/* UI */}
      <div style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        pointerEvents: 'none', 
        color: 'white', 
        textAlign: 'center',
        fontFamily: 'monospace'
      }}>
        
        {/* ==================== MENÜ ==================== */}
        {screen === 'MENU' && (
          <div style={{ 
            pointerEvents: 'auto', 
            background: 'rgba(0,0,0,0.85)', 
            padding: '40px', 
            borderRadius: '20px', 
            border: '2px solid #00f3ff',
            boxShadow: '0 0 30px rgba(0,243,255,0.5)'
          }}>
            <h1 style={{ 
              color: '#00f3ff', 
              margin: '0 0 30px 0', 
              fontSize: '3rem',
              textShadow: '0 0 20px #00f3ff'
            }}>
              PULZUS ONLINE
            </h1>
            
            <input 
              placeholder="NEVED" 
              value={playerName} 
              onChange={e => setPlayerName(e.target.value)}
              className="cyber-input"
              style={{ 
                width: '250px', 
                marginBottom: '20px',
                padding: '12px',
                fontSize: '1rem',
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid #00f3ff',
                borderRadius: '5px',
                color: 'white',
                outline: 'none'
              }}
              maxLength={20}
            />
            
            <div>
              <button 
                onClick={handleCreateRoom} 
                className="cyber-btn"
                style={{
                  padding: '12px 30px',
                  fontSize: '1rem',
                  background: '#00f3ff',
                  color: '#000',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  marginBottom: '10px'
                }}
              >
                ÚJ SZOBA LÉTREHOZÁSA
              </button>
            </div>
            
            <div style={{ margin: '20px 0', color: '#888' }}>- VAGY -</div>
            
            <input 
              placeholder="SZOBAKÓD (pl. 1234)" 
              value={joinCode} 
              onChange={e => setJoinCode(e.target.value)}
              className="cyber-input"
              style={{ 
                width: '200px', 
                marginBottom: '10px',
                padding: '12px',
                fontSize: '1rem',
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid #888',
                borderRadius: '5px',
                color: 'white',
                outline: 'none',
                textAlign: 'center'
              }}
              maxLength={4}
            />
            
            <div>
              <button 
                onClick={handleJoinRoom} 
                className="cyber-btn"
                style={{
                  padding: '12px 30px',
                  fontSize: '1rem',
                  background: '#444',
                  color: 'white',
                  border: '1px solid #888',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                CSATLAKOZÁS
              </button>
            </div>

            {error && (
              <div style={{ 
                marginTop: '20px', 
                color: '#ff0055', 
                background: 'rgba(255,0,85,0.1)',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ff0055'
              }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* ==================== LOBBY ==================== */}
        {screen === 'LOBBY' && roomData && (
          <div style={{ 
            pointerEvents: 'auto', 
            background: 'rgba(0,0,0,0.85)', 
            padding: '40px', 
            borderRadius: '20px',
            border: '2px solid #00f3ff',
            minWidth: '400px'
          }}>
            <h2 style={{ color: '#00f3ff', marginTop: 0 }}>
              {isHost ? '🎮 TE VAGY A HOST' : '🎮 SZOBA'}
            </h2>
            
            <div style={{ 
              fontSize: '3rem', 
              color: '#ff0055', 
              margin: '20px 0',
              letterSpacing: '10px',
              textShadow: '0 0 20px #ff0055'
            }}>
              {roomId}
            </div>

            <div style={{ marginBottom: '20px', color: '#aaa' }}>
              Játékosok ({roomData.players.length}/10):
            </div>

            <div style={{ marginBottom: '20px' }}>
              {roomData.players.map((player, i) => (
                <div 
                  key={i} 
                  style={{ 
                    padding: '8px', 
                    margin: '5px 0',
                    background: player.name === playerName ? 'rgba(0,243,255,0.2)' : 'rgba(255,255,255,0.05)',
                    borderRadius: '5px',
                    border: `1px solid ${player.ready ? '#00ff88' : '#444'}`
                  }}
                >
                  {player.isHost && '👑 '}
                  {player.name}
                  {player.ready && ' ✓'}
                </div>
              ))}
            </div>

            <button 
              onClick={handleToggleReady}
              style={{
                padding: '12px 30px',
                fontSize: '1rem',
                background: myPlayer?.ready ? '#00ff88' : '#444',
                color: myPlayer?.ready ? '#000' : 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                marginBottom: '10px',
                width: '100%'
              }}
            >
              {myPlayer?.ready ? '✓ READY' : 'NEM READY'}
            </button>

            {isHost && (
              <button 
                onClick={handleStartGame}
                disabled={!allReady || roomData.players.length < 1}
                style={{
                  padding: '12px 30px',
                  fontSize: '1rem',
                  background: allReady ? '#ff0055' : '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: allReady ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                  width: '100%',
                  opacity: allReady ? 1 : 0.5
                }}
              >
                JÁTÉK INDÍTÁSA
              </button>
            )}

            {!isHost && !allReady && (
              <div style={{ color: '#888', fontSize: '0.9rem', marginTop: '10px' }}>
                Várd meg, hogy mindenki ready legyen...
              </div>
            )}

            <button 
              onClick={handleLeave}
              style={{
                marginTop: '20px',
                padding: '8px 20px',
                fontSize: '0.9rem',
                background: 'transparent',
                color: '#888',
                border: '1px solid #444',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              KILÉPÉS
            </button>
          </div>
        )}

        {/* ==================== PLAYING ==================== */}
        {screen === 'PLAYING' && roomData && (
          <div style={{ pointerEvents: 'auto', width: '90%', maxWidth: '600px' }}>
            <div style={{ marginBottom: '10px', color: '#888' }}>
              Kör: {roomData.currentRound} | Te: {myPlayer?.score || 0} pont
            </div>

            <h3 style={{ color: '#aaa', fontSize: '1rem', margin: '10px 0' }}>
              KATEGÓRIA
            </h3>
            <h2 style={{ 
              color: '#ffdd00', 
              fontSize: '2rem', 
              textShadow: '0 0 20px orange',
              margin: '10px 0 20px 0'
            }}>
              {roomData.category}
            </h2>
            
            <div style={{ 
              width: '100%', 
              height: '12px', 
              background: '#222', 
              margin: '20px 0', 
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid #444'
            }}>
              <div style={{ 
                width: `${(timeLeft / roomData.maxTime) * 100}%`, 
                height: '100%', 
                background: timeLeft < 3 ? '#ff0055' : '#00f3ff',
                transition: 'width 0.1s linear',
                boxShadow: timeLeft < 3 ? '0 0 20px #ff0055' : '0 0 20px #00f3ff'
              }} />
            </div>

            <div style={{ 
              fontSize: '2rem', 
              color: timeLeft < 3 ? '#ff0055' : '#00f3ff',
              marginBottom: '20px',
              fontWeight: 'bold'
            }}>
              {timeLeft.toFixed(1)}s
            </div>

            <form onSubmit={handleSubmitAnswer}>
              <input 
                id="gameInput"
                value={input} 
                onChange={e => setInput(e.target.value)} 
                autoComplete="off"
                placeholder="ÍRJ BE VALAMIT..."
                style={{
                  width: '100%',
                  padding: '15px',
                  fontSize: '1.2rem',
                  background: 'rgba(0,0,0,0.8)',
                  border: '2px solid #00f3ff',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none',
                  textAlign: 'center',
                  boxShadow: '0 0 20px rgba(0,243,255,0.3)'
                }}
              />
            </form>

            {/* Scoreboard */}
            <div style={{ 
              marginTop: '30px', 
              padding: '15px',
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '10px',
              border: '1px solid #333'
            }}>
              <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '10px' }}>
                PONTOK:
              </div>
              {roomData.players
                .sort((a, b) => b.score - a.score)
                .map((player, i) => (
                  <div 
                    key={i}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      padding: '5px 10px',
                      background: player.name === playerName ? 'rgba(0,243,255,0.1)' : 'transparent'
                    }}
                  >
                    <span>{i + 1}. {player.name}</span>
                    <span style={{ color: '#00ff88', fontWeight: 'bold' }}>
                      {player.score}
                    </span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ==================== GAME OVER ==================== */}
        {screen === 'GAME_OVER' && roomData && (
          <div style={{ 
            pointerEvents: 'auto', 
            background: 'rgba(0,0,0,0.9)', 
            padding: '40px', 
            border: '3px solid #ff0055', 
            borderRadius: '20px',
            boxShadow: '0 0 50px rgba(255,0,85,0.8)'
          }}>
            <h1 style={{ 
              color: '#ff0055', 
              fontSize: '4rem', 
              margin: '0 0 20px 0',
              textShadow: '0 0 30px #ff0055'
            }}>
              💥 BUMM!
            </h1>
            
            <p style={{ fontSize: '1.2rem', color: '#aaa', marginBottom: '30px' }}>
              Lejárt az idő a {roomData.currentRound}. körben!
            </p>

            <div style={{ 
              background: 'rgba(0,0,0,0.5)',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '30px'
            }}>
              <h3 style={{ color: '#00f3ff', margin: '0 0 15px 0' }}>
                🏆 VÉGEREDMÉNY
              </h3>
              {roomData.players
                .sort((a, b) => b.score - a.score)
                .map((player, i) => (
                  <div 
                    key={i}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      padding: '10px 15px',
                      margin: '5px 0',
                      background: i === 0 ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)',
                      borderRadius: '5px',
                      fontSize: '1.1rem'
                    }}
                  >
                    <span>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} 
                      {' '}{player.name}
                    </span>
                    <span style={{ 
                      color: i === 0 ? '#ffd700' : '#00ff88', 
                      fontWeight: 'bold' 
                    }}>
                      {player.score} pont
                    </span>
                  </div>
                ))
              }
            </div>

            {isHost && (
              <button 
                onClick={handleRestart}
                style={{
                  padding: '15px 40px',
                  fontSize: '1.1rem',
                  background: '#00f3ff',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  marginRight: '10px'
                }}
              >
                ÚJ JÁTÉK
              </button>
            )}

            <button 
              onClick={handleLeave}
              style={{
                padding: '15px 40px',
                fontSize: '1.1rem',
                background: '#444',
                color: 'white',
                border: '1px solid #666',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              KILÉPÉS
            </button>
          </div>
        )}
      </div>
    </>
  );
}