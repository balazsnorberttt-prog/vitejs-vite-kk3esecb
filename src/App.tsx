import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import * as THREE from 'three';

// === SZERVER KONFIGURÁCIÓ ===
const BACKEND_URL = "https://trash-backend.balazsnorberttt.workers.dev";

// === EGYSZERŰ STYLE ===
const GLOBAL_CSS = `
  body { margin: 0; background: #000; color: white; font-family: sans-serif; }
  .app { position: absolute; inset: 0; display: flex; flex-direction: column; z-index: 10; }
  .container { width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; }
  .input { width: 100%; padding: 15px; margin: 10px 0; background: #111; border: 2px solid #f0f; color: yellow; text-align: center; }
  .button { width: 100%; padding: 20px; background: linear-gradient(90deg, #f0f, #0ff); color: white; border: none; margin: 10px 0; font-size: 1.5rem; }
`;

// === 3D HÁTTÉR ===
function FloatingDebris() {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const count = 30;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => Array.from({ length: count }, () => ({
    pos: [(Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50],
    rotSpeed: Math.random() * 0.02,
    scale: 0.5 + Math.random()
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
    mesh.current.rotation.y = state.clock.elapsedTime * 0.05;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#ff00ff" wireframe />
    </instancedMesh>
  );
}

// === FŐ APP ===
export default function App() {
  const [view, setView] = useState('MENU');
  const [roomId, setRoomId] = useState('');
  const [myName, setMyName] = useState('');
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // === SZERVER KAPCSOLAT ===
  const fetchRoom = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}?roomId=${id}`);
      const data = await res.json();
      if (!data.error) {
        setState(data);
        return data;
      }
    } catch (e) {
      console.error("Hiba:", e);
    }
    return null;
  };

  const saveRoom = async (data: any) => {
    try {
      const res = await fetch(`${BACKEND_URL}?roomId=${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) {
      console.error("Mentés hiba:", e);
    }
  };

  // === CREATE ROOM ===
  const createRoom = async () => {
    if (!myName) return alert("Írd be a neved!");
    setLoading(true);
    
    const id = Math.floor(1000 + Math.random() * 9000).toString();
    const newState = {
      players: [{ name: myName, score: 0, ready: false, isHost: true }],
      currentPhase: 'LOBBY',
      roomId: id
    };
    
    const result = await saveRoom(newState);
    if (result && result.success) {
      setRoomId(id);
      setState(newState);
      setView('LOBBY');
    }
    setLoading(false);
  };

  // === JOIN ROOM ===
  const joinRoom = async () => {
    if (!roomId || !myName) return alert("Kód és név kell!");
    setLoading(true);
    
    const existing = await fetchRoom(roomId);
    if (!existing || existing.error) {
      alert("Nincs ilyen szoba!");
      setLoading(false);
      return;
    }
    
    const updatedPlayers = [
      ...(existing.players || []),
      { name: myName, score: 0, ready: false, isHost: false }
    ];
    
    const updatedState = {
      ...existing,
      players: updatedPlayers
    };
    
    const result = await saveRoom(updatedState);
    if (result && result.success) {
      setState(updatedState);
      setView('LOBBY');
    }
    setLoading(false);
  };

  // === START GAME ===
  const startGame = async () => {
    const newState = {
      ...state,
      currentPhase: 'PLAYING',
      roundStarted: Date.now()
    };
    
    const result = await saveRoom(newState);
    if (result) {
      setState(newState);
      setView('PLAYING');
    }
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      
      {/* 3D BACKGROUND */}
      <div style={{position:'fixed', inset:0, zIndex:-1}}>
        <Canvas>
          <Stars radius={100} depth={50} count={2000} factor={4} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10,10,10]} color="#00ffff" intensity={1.5} />
          <Float>
            <FloatingDebris />
          </Float>
        </Canvas>
      </div>

      {/* UI */}
      <div className="app">
        
        {/* MENU */}
        {view === 'MENU' && (
          <div className="container" style={{justifyContent:'center', textAlign:'center'}}>
            <h1 style={{fontSize:'4rem', color:'#ff00ff', textShadow:'0 0 20px #ff00ff'}}>
              TRASH GAME
            </h1>
            
            <div style={{background:'rgba(0,0,0,0.8)', padding:'30px', borderRadius:'20px', margin:'20px 0'}}>
              <input
                className="input"
                placeholder="NEVED"
                value={myName}
                onChange={e => setMyName(e.target.value)}
              />
              
              <button 
                className="button"
                onClick={createRoom}
                disabled={loading}
              >
                {loading ? 'KÉREK...' : 'ÚJ JÁTÉK'}
              </button>
              
              <hr style={{borderColor:'#444', margin:'20px 0'}} />
              
              <input
                className="input"
                placeholder="SZOBA KÓD (4 szám)"
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
              />
              
              <button 
                className="button"
                onClick={joinRoom}
                disabled={loading}
                style={{background:'#333'}}
              >
                {loading ? 'CSATLAKOZÁS...' : 'CSATLAKOZÁS'}
              </button>
            </div>
            
            <p style={{color:'#888'}}>
              Szerver: {BACKEND_URL}
            </p>
          </div>
        )}
        
        {/* LOBBY */}
        {view === 'LOBBY' && state && (
          <div className="container">
            <h1 style={{textAlign:'center', color:'#00ffff'}}>
              SZOBA: {roomId}
            </h1>
            
            <div style={{background:'rgba(0,0,0,0.8)', padding:'20px', borderRadius:'15px', margin:'20px 0'}}>
              <h3>Játékosok:</h3>
              <div style={{display:'flex', flexWrap:'wrap', gap:'10px', margin:'15px 0'}}>
                {state.players?.map((p: any, i: number) => (
                  <div key={i} style={{
                    padding:'10px 15px',
                    background:p.name === myName ? '#ff00ff' : '#333',
                    borderRadius:'20px'
                  }}>
                    {p.name} {p.isHost && '⭐'}
                  </div>
                ))}
              </div>
              
              {state.players?.some((p: any) => p.isHost && p.name === myName) && (
                <button 
                  className="button"
                  onClick={startGame}
                  style={{marginTop:'20px'}}
                >
                  JÁTÉK INDÍTÁSA
                </button>
              )}
              
              {!state.players?.some((p: any) => p.isHost && p.name === myName) && (
                <p style={{textAlign:'center', color:'#888'}}>
                  Várakozás a host indítására...
                </p>
              )}
            </div>
            
            <button 
              className="button"
              onClick={() => setView('MENU')}
              style={{background:'#222'}}
            >
              VISSZA
            </button>
          </div>
        )}
        
        {/* PLAYING */}
        {view === 'PLAYING' && (
          <div className="container">
            <h1 style={{textAlign:'center', color:'yellow'}}>
              JÁTÉK FOLYIK...
            </h1>
            <div style={{textAlign:'center', margin:'50px 0'}}>
              <div style={{fontSize:'5rem'}}>🎮</div>
              <p>Itt lesz a játék...</p>
            </div>
          </div>
        )}
        
      </div>
    </>
  );
}