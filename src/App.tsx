import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. A TARTALOM (ADATBÁZIS)
// ==========================================

// "A" Lista: Alanyok (Kik?)
const ALANYOK = [
  "Politikus", "Tanár", "Ex-barátnő", "Szomszéd", "Kutya", 
  "BKV ellenőr", "Kocsmáros", "Influenszer", "Nagymama", 
  "A főnököd", "Egy részeg turista", "Taxis", "Valóságshow szereplő"
];

// "B" Lista: Szituációk (Mit csinál?)
const SZITUACIOK = [
  "aki lopott a boltból", "aki részegen énekel", "aki bepisilt", 
  "aki megnyerte a lottót", "aki téged üldöz", "aki meztelenül fut", 
  "aki sírva fakad", "aki nem tud számolni", "aki elfelejtette a nevét",
  "aki rossz buszra szállt", "aki a szőnyegre hányt"
];

// "C" Lista: Fix, Kész Kategóriák (Magyar Valóság & Kínos)
const FIX_KATEGORIAK = [
  "Dolog, ami elromlik a MÁV-on",
  "Amit a nagymamád mond, ha nem eszel",
  "Híresség, akit látni a Balaton Soundon",
  "A legolcsóbb étel a menzán",
  "Amit a szomszéd fúr vasárnap reggel",
  "Ok, amiért szakítasz SMS-ben",
  "Dolog, amit nem akarsz hallani a nőgyógyásznál",
  "Ajándék, amit azonnal továbbadnál",
  "Keresési előzmény, amit törölnél, ha meghalnál",
  "Hely, ahova nem viszel randipartnert",
  "Tárgy, amivel ölni lehetne (de nem fegyver)",
  "Testrész, ami csak a férfiakon vicces",
  "Állat, ami nem tud úszni",
  "Szó, ami 'Ly'-ra végződik",
  "Mondat, amit nem mondasz rendőrnek",
  "Dolog, ami büdös, de finom",
  "Híresség, akivel NEM ragadnál be a liftbe"
];

// ==========================================
// 2. A GENERÁTOR LOGIKA
// ==========================================

const generateUniqueCategory = (usedSet: Set<string>) => {
  let newCat = "";
  let attempts = 0;

  // Próbálunk olyat generálni, ami még nem volt
  while (attempts < 50) {
    const r = Math.random();
    
    if (r > 0.4) {
      // 60% esély: FIX kategória
      newCat = FIX_KATEGORIAK[Math.floor(Math.random() * FIX_KATEGORIAK.length)];
    } else {
      // 40% esély: REMIX (Alany + Szituáció)
      const alany = ALANYOK[Math.floor(Math.random() * ALANYOK.length)];
      const szitu = SZITUACIOK[Math.floor(Math.random() * SZITUACIOK.length)];
      newCat = `${alany}, ${szitu}`;
    }

    if (!usedSet.has(newCat)) {
      usedSet.add(newCat);
      return newCat;
    }
    attempts++;
  }
  return "Minden kategória elfogyott! (Indítsd újra)";
};

const generateRoomId = () => Math.floor(1000 + Math.random() * 9000).toString();

// ==========================================
// 3. 3D GRAFIKA (LOW POLY - MOBILBARÁT)
// ==========================================
function CyberBomb({ urgency, isExploded }: any) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const color = new THREE.Color().lerpColors(new THREE.Color('#00ff88'), new THREE.Color('#ff0055'), urgency);

  useFrame((state) => {
    if (isExploded || !meshRef.current) return;
    const speed = 1 + (urgency * 12); 
    const scale = 1.5 + Math.sin(state.clock.elapsedTime * speed) * (0.05 + urgency * 0.25);
    meshRef.current.scale.set(scale, scale, scale);
    meshRef.current.rotation.y += 0.01;
  });

  return (
    <Sphere ref={meshRef} args={[1.3, 32, 32]}>
      <MeshDistortMaterial 
        color={isExploded ? '#111' : color} 
        emissive={isExploded ? '#ff0000' : color}
        emissiveIntensity={isExploded ? 8 : 0.6 + urgency}
        distort={0.3 + urgency * 0.5} 
        speed={2 + urgency * 4} 
      />
    </Sphere>
  );
}

// ==========================================
// 4. FŐ ALKALMAZÁS
// ==========================================
export default function App() {
  const [gameState, setGameState] = useState('MENU'); 
  const [role, setRole] = useState<'HOST' | 'CLIENT' | null>(null);
  const [roomId, setRoomId] = useState('');
  const [joinId, setJoinId] = useState('');
  
  // Játékadatok
  const [category, setCategory] = useState('');
  const [lastWord, setLastWord] = useState('');
  const [turn, setTurn] = useState<'HOST' | 'CLIENT'>('HOST');
  const [timeLeft, setTimeLeft] = useState(30);
  const [maxTime, setMaxTime] = useState(30);
  const [input, setInput] = useState('');
  const [loser, setLoser] = useState('');
  
  // Memória a használt kategóriáknak
  const usedCategories = useRef(new Set<string>());

  const peerRef = useRef<Peer>(null!);
  const connRef = useRef<any>(null!);

  // --- HÁLÓZAT ---
  const startHost = () => {
    const id = generateRoomId();
    const peer = new Peer(id);
    peer.on('open', (id) => {
      setRoomId(id); setRole('HOST'); setGameState('LOBBY');
      usedCategories.current.clear(); // Új szoba, tiszta pakli
    });
    peer.on('connection', (conn) => {
      connRef.current = conn;
      conn.on('data', handleData);
      setTimeout(hostStartGame, 1000);
    });
    peerRef.current = peer;
  };

  const joinRoom = () => {
    if (joinId.length < 4) return;
    const peer = new Peer();
    peer.on('open', () => {
      const conn = peer.connect(joinId);
      connRef.current = conn;
      setRole('CLIENT'); setGameState('LOBBY');
      conn.on('data', handleData);
    });
    peerRef.current = peer;
  };

  const handleData = (data: any) => {
    if (data.type === 'STATE_UPDATE') {
      setGameState(data.state);
      setCategory(data.category);
      setTimeLeft(data.time);
      setTurn(data.turn);
      setMaxTime(data.maxTime);
      setLastWord(data.lastWord);
    }
    if (data.type === 'ACTION_SUBMIT') {
      if (role === 'HOST') handleTurnChange(data.word); 
    }
    if (data.type === 'ACTION_VETO') {
      if (role === 'HOST') handleVeto();
    }
    if (data.type === 'GAME_OVER') {
      setGameState('GAME_OVER');
      setLoser(data.loser);
    }
  };

  // --- LOGIKA (HOST) ---
  const hostStartGame = () => {
    // GENERÁTOR HÍVÁSA!
    const cat = generateUniqueCategory(usedCategories.current);
    
    setCategory(cat);
    setGameState('PLAYING');
    setTurn('HOST');
    setTimeLeft(30);
    setMaxTime(30);
    setLastWord('');
    broadcast(cat, 30, 'HOST', 'PLAYING', '');
  };

  const handleTurnChange = (word: string) => {
    const nextTurn = turn === 'HOST' ? 'CLIENT' : 'HOST';
    const newMax = Math.max(5, maxTime - 1); // Gyorsul
    setMaxTime(newMax);
    setTurn(nextTurn);
    setLastWord(word);
    broadcast(category, timeLeft, nextTurn, 'PLAYING', word);
  };

  const handleVeto = () => {
    const prevTurn = turn === 'HOST' ? 'CLIENT' : 'HOST';
    setTurn(prevTurn);
    // Büntetés: nem kap időt vissza!
    broadcast(category, timeLeft, prevTurn, 'PLAYING', "⛔ KAMU! (VISSZA) ⛔");
  };

  const broadcast = (cat: string, time: number, trn: string, state: string, word: string) => {
    if (connRef.current) {
      connRef.current.send({
        type: 'STATE_UPDATE',
        category: cat, time, turn: trn, maxTime: maxTime, state, lastWord: word
      });
    }
  };

  useEffect(() => {
    if (role !== 'HOST' || gameState !== 'PLAYING') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newVal = prev - 0.1;
        if (Math.floor(newVal * 10) % 10 === 0) {
           broadcast(category, newVal, turn, 'PLAYING', lastWord);
        }
        if (newVal <= 0) {
          const lsr = turn;
          setLoser(lsr);
          setGameState('GAME_OVER');
          connRef.current.send({ type: 'GAME_OVER', loser: lsr });
          return 0;
        }
        return newVal;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [gameState, role, turn, category, lastWord]);

  // --- UI INPUT ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.length < 2) return;
    if (role === 'HOST') handleTurnChange(input);
    else connRef.current.send({ type: 'ACTION_SUBMIT', word: input });
    setInput('');
  };

  const sendVeto = () => {
    if (role === 'HOST') handleVeto();
    else connRef.current.send({ type: 'ACTION_VETO' });
  };

  const isMyTurn = role === turn;
  const urgency = Math.max(0, 1 - (timeLeft / maxTime));

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[5, 5, 5]} intensity={0.8} />
          <Stars count={1500} fade />
          <CyberBomb urgency={urgency} isExploded={gameState === 'GAME_OVER'} />
          <OrbitControls enableZoom={false} enableRotate={false} />
        </Canvas>
      </div>

      <div className="ui-layer">
        {gameState === 'MENU' && (
          <div className="interactive menu-box">
            <h1 className="title-main">TIK-TAK<br/>BUMM</h1>
            <p style={{color:'#00ff88', marginBottom:'20px'}}>MAGYAR VALÓSÁG EDITION</p>
            <button onClick={startHost} className="btn btn-start">ÚJ SZOBA</button>
            <p className="or-text">vagy</p>
            <input className="game-input" placeholder="KÓD" value={joinId} onChange={e=>setJoinId(e.target.value)} />
            <button onClick={joinRoom} className="btn btn-join">CSATLAKOZÁS</button>
          </div>
        )}

        {gameState === 'LOBBY' && (
          <div className="interactive">
            <p>SZOBA KÓDJA:</p>
            <h1 className="room-code">{roomId || joinId}</h1>
            <p className="pulse">{role === 'HOST' ? 'Várakozás játékosra...' : 'Csatlakozva! Host indít...'}</p>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="interactive game-container">
            <div className="category-box">
              <span className="label">FELADAT:</span>
              <h2 className="category-text">{category}</h2>
            </div>

            {!isMyTurn && (
              <div className="opponent-box">
                <span className="label">ELLENFÉL VÁLASZA:</span>
                <div className="last-word">{lastWord || "..."}</div>
                {lastWord && !lastWord.includes("⛔") && (
                   <button onClick={sendVeto} className="btn btn-veto">EZ KAMU! 🚨</button>
                )}
              </div>
            )}

            {isMyTurn ? (
              <div className="my-turn-box shake">
                <p className="urgent-text">TE JÖSSZ!</p>
                <form onSubmit={handleSubmit}>
                  <input autoFocus className="game-input" value={input} onChange={e=>setInput(e.target.value)} placeholder="ÍRJ VALAMIT!" />
                  <button type="submit" className="btn btn-submit">KÜLDÉS 🚀</button>
                </form>
              </div>
            ) : (
               <div className="waiting-box">
                 <h2>VÁRJ...</h2>
               </div>
            )}

            <div className="timer-bar-container">
              <div className="timer-bar" style={{ 
                width: `${(timeLeft/maxTime)*100}%`, 
                background: timeLeft < 5 ? '#ff0000' : '#00ff88'
              }} />
            </div>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="interactive game-over-box">
            <h1 className="bumm-text">BUMM!</h1>
            <h2>{loser === role ? "FELROBBANTÁL! ☠️" : "MEGÚSZTAD! 🏆"}</h2>
            {role === 'HOST' && <button onClick={hostStartGame} className="btn btn-restart">KÖVETKEZŐ KÖR</button>}
            {role === 'CLIENT' && <p>A Host indítja az újat...</p>}
          </div>
        )}
      </div>
    </>
  );
}