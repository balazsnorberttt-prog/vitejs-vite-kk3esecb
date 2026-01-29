import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// --- ADATOK ---
const KATEGORIAK = [
  "Dolog a hűtőben", "Indok késésre", "Amit nem mondasz rendőrnek",
  "Híresség", "Testrész", "Tárgy a táskádban", "Étel amit utálsz"
];

const generateRoomId = () => Math.floor(1000 + Math.random() * 9000).toString();

// --- 3D GÖMB ---
function CyberBomb({ urgency }: { urgency: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const color = new THREE.Color().lerpColors(new THREE.Color('#00f3ff'), new THREE.Color('#ff0055'), urgency);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const s = 1.5 + Math.sin(state.clock.elapsedTime * (2 + urgency * 10)) * (0.05 + urgency * 0.2);
    meshRef.current.scale.set(s, s, s);
  });

  return (
    <Sphere ref={meshRef} args={[1.5, 32, 32]}>
      <MeshDistortMaterial color={color} emissive={color} emissiveIntensity={0.5 + urgency} distort={0.4} speed={3} />
    </Sphere>
  );
}

// --- APP ---
export default function App() {
  const [view, setView] = useState('MENU'); // MENU, LOBBY, GAME, OVER
  const [role, setRole] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  
  const [category, setCategory] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [turn, setTurn] = useState('HOST');
  const [lastWord, setLastWord] = useState('');
  const [input, setInput] = useState('');

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<any>(null);

  // --- HÁLÓZAT ---
  const startHost = () => {
    const id = generateRoomId();
    const peer = new Peer(id);
    peer.on('open', (id) => { setRoomId(id); setRole('HOST'); setView('LOBBY'); });
    peer.on('connection', (conn) => {
      connRef.current = conn;
      conn.on('data', handleData);
      setTimeout(() => startGame('HOST'), 1000);
    });
    peerRef.current = peer;
  };

  const joinGame = () => {
    if (joinCode.length < 4) return;
    const peer = new Peer();
    peer.on('open', () => {
      const conn = peer.connect(joinCode);
      connRef.current = conn;
      setRole('CLIENT'); setView('LOBBY');
      conn.on('data', handleData);
    });
    peerRef.current = peer;
  };

  const handleData = (data: any) => {
    if (data.type === 'UPDATE') {
      setView(data.view); setCategory(data.cat); setTimeLeft(data.time);
      setTurn(data.turn); setLastWord(data.word);
    }
  };

  const startGame = (myRole: string) => {
    if (myRole === 'HOST') {
      const cat = KATEGORIAK[Math.floor(Math.random() * KATEGORIAK.length)];
      broadcast(cat, 30, 'HOST', 'GAME', '');
    }
  };

  const broadcast = (cat: string, time: number, trn: string, vw: string, word: string) => {
    setCategory(cat); setTimeLeft(time); setTurn(trn); setView(vw); setLastWord(word);
    if (connRef.current) {
      connRef.current.send({ type: 'UPDATE', cat, time, turn: trn, view: vw, word });
    }
  };

  // --- IDŐZÍTŐ ---
  useEffect(() => {
    if (role === 'HOST' && view === 'GAME') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0) { broadcast(category, 0, turn, 'OVER', lastWord); return 0; }
          if (Math.floor(prev*10)%10 === 0) broadcast(category, prev - 0.1, turn, 'GAME', lastWord);
          return prev - 0.1;
        });
      }, 100);
      return () => clearInterval(timer);
    }
  }, [role, view, turn, category, lastWord]);

  const submit = (e: any) => {
    e.preventDefault();
    if (role === 'HOST') broadcast(category, timeLeft, 'CLIENT', 'GAME', input);
    else connRef.current.send({ type: 'ACTION', word: input }); // Host majd kezeli
    setInput('');
  };

  const urgency = Math.max(0, 1 - (timeLeft / 30));

  return (
    <>
      {/* 3D HÁTTÉR */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <Stars />
          <CyberBomb urgency={urgency} />
        </Canvas>
      </div>

      {/* KEZELŐFELÜLET (UI) */}
      <div className="ui-layer">
        
        {view === 'MENU' && (
          <div className="interactive">
            <h1 className="title-main">TIK-TAK<br/>BUMM</h1>
            <button className="btn btn-start" onClick={startHost}>ÚJ SZOBA</button>
            <p>- VAGY -</p>
            <input className="game-input" placeholder="KÓD" value={joinCode} onChange={e=>setJoinCode(e.target.value)} />
            <button className="btn btn-join" onClick={joinGame}>CSATLAKOZÁS</button>
          </div>
        )}

        {view === 'LOBBY' && (
          <div className="interactive">
            <h2>KÓD: <span style={{color:'#ffdd00', fontSize:'2rem'}}>{roomId || joinCode}</span></h2>
            <p>Várakozás...</p>
          </div>
        )}

        {view === 'GAME' && (
          <div className="interactive">
            <p style={{color:'#aaa'}}>TÉMA:</p>
            <h2 style={{color:'#00f3ff'}}>{category}</h2>
            
            {role === turn ? (
              <div style={{width:'100%'}}>
                <h2 style={{color:'#ff0055', margin:'10px 0'}}>TE JÖSSZ!</h2>
                <form onSubmit={submit}>
                  <input autoFocus className="game-input" value={input} onChange={e=>setInput(e.target.value)} />
                  <button className="btn btn-submit">KÜLDÉS</button>
                </form>
              </div>
            ) : (
              <div style={{margin:'20px 0'}}>
                <h2>VÁRJ...</h2>
                <p>A másik ír: {lastWord}</p>
              </div>
            )}

            <div className="timer-bar">
              <div className="timer-fill" style={{width: `${(timeLeft/30)*100}%`, background: timeLeft<5?'red':'#00f3ff'}} />
            </div>
          </div>
        )}

        {view === 'OVER' && (
          <div className="interactive" style={{borderColor:'red'}}>
            <h1 style={{color:'red', fontSize:'3rem'}}>BUMM!</h1>
            <button className="btn btn-start" onClick={() => window.location.reload()}>ÚJRA</button>
          </div>
        )}

      </div>
    </>
  );
}