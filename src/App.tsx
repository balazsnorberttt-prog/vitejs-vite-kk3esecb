import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// --- ADATBÁZIS ---
const KATEGORIAK = [
  "Dolog, amit nem mondasz a rendőrnek", "Tárgy a hűtőben", "Ok a szakításra", 
  "Testrész", "Híresség, akitől félnél", "Szó, amit a nagymamád használ",
  "Hely, ahova nem viszel randipartnert", "Étel, ami randin kockázatos",
  "Dolog, amihez elem kell", "Férfi név, ami nem illik babához"
];

// Segédfüggvény: Rövid kód generálása (pl. A4X9)
const generateRoomId = () => Math.random().toString(36).substring(2, 6).toUpperCase();

// --- 3D BOMBA ---
function CyberBomb({ urgency, isExploded }: { urgency: number, isExploded: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  
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

// --- FŐ ALKALMAZÁS ---
export default function App() {
  // Állapotok
  const [gameState, setGameState] = useState('MENU'); // MENU, LOBBY, PLAYING, GAME_OVER
  const [role, setRole] = useState<'HOST' | 'CLIENT' | null>(null);
  const [roomId, setRoomId] = useState('');
  const [joinId, setJoinId] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  
  // Játékadatok (Szinkronizálva)
  const [category, setCategory] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const [maxTime, setMaxTime] = useState(15);
  const [input, setInput] = useState('');

  // Hálózat referenciák
  const peerRef = useRef<Peer>(null!);
  const connRef = useRef<any>(null!); // Hostnál a kapcsolat

  // --- 1. HOST LOGIKA (Szoba létrehozása) ---
  const startHost = () => {
    const id = generateRoomId();
    const peer = new Peer(id); // Saját ID megadása
    
    peer.on('open', (id) => {
      setRoomId(id);
      setRole('HOST');
      setGameState('LOBBY');
      setStatusMsg('Várakozás játékosra...');
    });

    peer.on('connection', (conn) => {
      connRef.current = conn;
      setStatusMsg('Játékos csatlakozott!');
      
      // Figyeljük a klienstől jövő válaszokat
      conn.on('data', (data: any) => {
        if (data.type === 'SUCCESS_ANSWER') {
          handleSuccess(); // Ha a kliens jót válaszolt
        }
      });
    });

    peerRef.current = peer;
  };

  // --- 2. CLIENT LOGIKA (Csatlakozás) ---
  const joinRoom = () => {
    if (joinId.length < 4) return;
    const peer = new Peer();
    
    peer.on('open', () => {
      const conn = peer.connect(joinId.toUpperCase());
      
      conn.on('open', () => {
        setRole('CLIENT');
        setGameState('LOBBY');
        setStatusMsg('Csatlakozva! Várd meg a Hostot.');
        connRef.current = conn;
      });

      // Kliens fogadja az adatokat a Hosttól
      conn.on('data', (data: any) => {
        if (data.type === 'START_GAME') {
          setGameState('PLAYING');
          setCategory(data.category);
          setMaxTime(data.maxTime);
        }
        if (data.type === 'SYNC_TIME') {
          setTimeLeft(data.time);
        }
        if (data.type === 'GAME_OVER') {
          setGameState('GAME_OVER');
          setTimeLeft(0);
        }
        if (data.type === 'NEW_ROUND') {
          setCategory(data.category);
          setInput('');
          document.getElementById('gameInput')?.focus();
        }
      });
    });
    peerRef.current = peer;
  };

  // --- 3. JÁTÉK LOOP (Csak a Host futtatja az időt) ---
  const startGame = () => {
    if (role === 'HOST' && connRef.current) {
      const cat = KATEGORIAK[Math.floor(Math.random() * KATEGORIAK.length)];
      setCategory(cat);
      setGameState('PLAYING');
      setTimeLeft(15);
      setMaxTime(15);
      
      // Üzenet a kliensnek: Indulás!
      connRef.current.send({ type: 'START_GAME', category: cat, maxTime: 15 });
    }
  };

  // Időzítő (Csak Hostnál fut)
  useEffect(() => {
    if (gameState !== 'PLAYING' || role !== 'HOST') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newVal = prev - 0.1;
        
        // Idő szinkronizálása a klienssel (másodpercenként egyszer elég pontosítani, de most küldjük gyakran)
        if (connRef.current && Math.floor(newVal * 10) % 5 === 0) {
           connRef.current.send({ type: 'SYNC_TIME', time: newVal });
        }

        if (newVal <= 0) {
          connRef.current?.send({ type: 'GAME_OVER' });
          setGameState('GAME_OVER');
          return 0;
        }
        return newVal;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [gameState, role]);

  // --- 4. VÁLASZ KEZELÉS ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.length < 2) return;

    if (role === 'HOST') {
      handleSuccess(); // Host megoldotta
    } else {
      // Kliens elküldi a Hostnak, hogy sikerült
      connRef.current.send({ type: 'SUCCESS_ANSWER' });
      handleSuccess(); // Helyi vizuális frissítés
    }
  };

  // Sikeres válasz logika (Host vezérli)
  const handleSuccess = () => {
    if (role === 'HOST') {
      const nextCat = KATEGORIAK[Math.floor(Math.random() * KATEGORIAK.length)];
      const nextTime = Math.max(3, maxTime * 0.95); // Gyorsul
      
      setCategory(nextCat);
      setMaxTime(nextTime);
      setTimeLeft(nextTime);
      setInput('');
      
      // Mindenkinek elküldjük az új kört
      connRef.current?.send({ type: 'NEW_ROUND', category: nextCat });
    } else {
        // Kliens csak törli a mezőt, várja az adatot a Hosttól
        setInput('');
    }
  };

  const urgency = Math.max(0, 1 - (timeLeft / maxTime));

  return (
    <>
      {/* 3D HÁTTÉR */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <Canvas camera={{ position: [0, 0, 6] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#00f3ff" />
          <Stars radius={100} depth={50} count={3000} factor={4} fade />
          <CyberBomb urgency={urgency} isExploded={gameState === 'GAME_OVER'} />
          <OrbitControls enableZoom={false} />
        </Canvas>
      </div>

      {/* UI */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: 'white', textAlign: 'center' }}>
        
        {/* MENÜ */}
        {gameState === 'MENU' && (
          <div style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.8)', padding: '40px', borderRadius: '20px', border: '1px solid #00f3ff' }}>
            <h1 style={{ color: '#00f3ff', margin: '0 0 20px 0' }}>PULZUS ONLINE</h1>
            
            <button onClick={startHost} className="cyber-btn">ÚJ SZOBA LÉTREHOZÁSA</button>
            <div style={{ margin: '20px 0' }}>- VAGY -</div>
            <input 
              placeholder="SZOBAKÓD (pl. A4X9)" 
              value={joinId} 
              onChange={e => setJoinId(e.target.value.toUpperCase())}
              className="cyber-input"
              style={{ width: '200px', marginBottom: '10px' }}
            />
            <br/>
            <button onClick={joinRoom} className="cyber-btn" style={{ background: '#444' }}>CSATLAKOZÁS</button>
          </div>
        )}

        {/* LOBBY */}
        {gameState === 'LOBBY' && (
          <div style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.8)', padding: '30px', borderRadius: '20px' }}>
            <h2>{role === 'HOST' ? 'TE VAGY A HOST' : 'CSATLAKOZVA'}</h2>
            
            {role === 'HOST' && (
              <>
                <p>Oszd meg ezt a kódot a barátoddal:</p>
                <h1 style={{ fontSize: '4rem', color: '#ff0055', margin: '10px 0', letterSpacing: '5px' }}>{roomId}</h1>
                <p style={{ color: '#aaa' }}>{statusMsg}</p>
                {/* Ha van kapcsolat, megjelenik a Start gomb */}
                {connRef.current && (
                    <button onClick={startGame} className="cyber-btn" style={{ marginTop: '20px' }}>JÁTÉK INDÍTÁSA</button>
                )}
              </>
            )}
            
            {role === 'CLIENT' && (
              <>
                <h3 className="shake">VÁRAKOZÁS A HOSTRA...</h3>
                <p>Amint elindítja, kezdődik!</p>
              </>
            )}
          </div>
        )}

        {/* JÁTÉK */}
        {gameState === 'PLAYING' && (
          <div style={{ pointerEvents: 'auto', width: '90%' }}>
            <h3 style={{ color: '#aaa' }}>KATEGÓRIA</h3>
            <h2 style={{ color: '#ffdd00', fontSize: '2rem', textShadow: '0 0 10px orange' }}>{category}</h2>
            
            <div style={{ width: '80%', height: '10px', background: '#333', margin: '20px auto', borderRadius: '5px' }}>
              <div style={{ width: `${(timeLeft/maxTime)*100}%`, height: '100%', background: timeLeft < 3 ? 'red' : '#00f3ff', transition: 'width 0.1s linear' }} />
            </div>

            <form onSubmit={handleSubmit}>
              <input 
                id="gameInput"
                className="cyber-input" 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                autoComplete="off"
                placeholder="ÍRJ BE VALAMIT..."
              />
            </form>
          </div>
        )}

        {/* GAME OVER */}
        {gameState === 'GAME_OVER' && (
          <div style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.9)', padding: '40px', border: '2px solid red', borderRadius: '20px' }}>
            <h1 style={{ color: 'red', fontSize: '4rem' }}>BUMM!</h1>
            <p>Lejárt az idő.</p>
            <button onClick={() => window.location.reload()} className="cyber-btn">MENÜ</button>
          </div>
        )}
      </div>
    </>
  );
}