import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';

// ==========================================
// 1. STÍLUSOK (BELEÉGETVE A BIZTONSÁGÉRT)
// ==========================================
const S: any = {
  // Konténerek
  wrapper: {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    backgroundColor: '#050505', color: 'white', fontFamily: 'Arial, sans-serif',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', zIndex: 9999
  },
  card: {
    backgroundColor: 'rgba(10, 10, 10, 0.85)', padding: '25px', borderRadius: '20px',
    border: '2px solid #00f3ff', textAlign: 'center', width: '90%', maxWidth: '450px',
    display: 'flex', flexDirection: 'column', gap: '15px', backdropFilter: 'blur(10px)',
    boxShadow: '0 0 30px rgba(0, 243, 255, 0.2)'
  },
  // Szövegek
  h1: { fontSize: '3rem', margin: 0, color: '#00f3ff', textTransform: 'uppercase', fontWeight: '900', lineHeight: 1 },
  h2: { fontSize: '1.5rem', margin: '10px 0', color: '#ffdd00', textTransform: 'uppercase' },
  p: { fontSize: '1rem', color: '#ccc', margin: 0 },
  code: { fontSize: '2.5rem', color: '#ffdd00', fontWeight: 'bold', letterSpacing: '5px', margin: '10px 0' },
  word: { fontSize: '2rem', color: '#fff', fontWeight: 'bold', margin: '10px 0', wordBreak: 'break-word' },
  
  // Inputok és Gombok
  input: {
    padding: '15px', fontSize: '1.2rem', borderRadius: '10px', border: '2px solid #555',
    backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', width: '100%', 
    boxSizing: 'border-box', textAlign: 'center', fontWeight: 'bold', outline: 'none'
  },
  btn: {
    padding: '18px', fontSize: '1.2rem', borderRadius: '50px', border: 'none',
    cursor: 'pointer', width: '100%', fontWeight: 'bold', textTransform: 'uppercase',
    marginTop: '10px', transition: 'transform 0.1s'
  },
  // Színes gombok
  btnBlue: { backgroundColor: '#00f3ff', color: 'black', boxShadow: '0 0 15px #00f3ff' },
  btnGray: { backgroundColor: '#333', color: 'white', border: '1px solid #555' },
  btnRed: { backgroundColor: '#ff0055', color: 'white', boxShadow: '0 0 15px #ff0055', animation: 'pulse 1s infinite' },
  
  // Állapotjelzők
  barContainer: { width: '100%', height: '12px', background: '#333', borderRadius: '6px', overflow: 'hidden', marginTop: '15px' },
  debug: { position: 'fixed', bottom: 5, left: 5, fontSize: '10px', color: '#555' }
};

// ==========================================
// 2. TARTALOM (MAGYAR VALÓSÁG)
// ==========================================
const ALANYOK = ["Politikus", "Tanár", "Ex-barátnő", "Szomszéd", "Kutya", "Ellenőr", "Kocsmáros", "Influenszer", "Nagymama", "Postás", "Futár", "Biztonsági őr"];
const SZITUACIOK = ["aki lopott", "aki részegen énekel", "aki bepisilt", "aki lottót nyert", "aki meztelenül fut", "aki sír", "aki nem tud számolni", "aki elfelejtette a nevét"];
const FIX = ["Dolog a hűtőben", "Indok késésre", "Amit nem mondasz rendőrnek", "Híresség", "Testrész", "Tárgy a táskádban", "Étel amit utálsz", "Hely ahova nem mész", "Amit a szomszéd fúr"];

const generateCategory = () => {
  if (Math.random() > 0.5) return FIX[Math.floor(Math.random() * FIX.length)];
  return `${ALANYOK[Math.floor(Math.random()*ALANYOK.length)]}, ${SZITUACIOK[Math.floor(Math.random()*SZITUACIOK.length)]}`;
};
const genId = () => Math.floor(1000 + Math.random() * 9000).toString();

// ==========================================
// 3. 3D GÖMB (EGYSZERŰ)
// ==========================================
function SimpleBomb({ urgency }: { urgency: number }) {
  const ref: any = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.01;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * (2 + urgency * 10)) * (0.05 + urgency * 0.2);
      const scale = 1.4 * pulse;
      ref.current.scale.set(scale, scale, scale);
    }
  });
  return (
    <Sphere ref={ref} args={[1, 32, 32]}>
      <meshStandardMaterial color={urgency > 0.7 ? "#ff0055" : "#00f3ff"} wireframe={false} roughness={0.4} metalness={0.6} />
    </Sphere>
  );
}

// ==========================================
// 4. FŐ LOGIKA
// ==========================================
export default function App() {
  // Állapotok
  const [view, setView] = useState('MENU'); // MENU, LOBBY, GAME, OVER
  const [role, setRole] = useState('');     // HOST, CLIENT
  const [myId, setMyId] = useState('');
  const [targetId, setTargetId] = useState('');
  
  // Játékmenet
  const [category, setCategory] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [maxTime, setMaxTime] = useState(30);
  const [turn, setTurn] = useState('HOST');
  const [lastWord, setLastWord] = useState('');
  const [input, setInput] = useState('');
  const [loser, setLoser] = useState('');

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<any>(null);

  // --- PEERJS START ---
  useEffect(() => {
    const peer = new Peer();
    peer.on('open', (id) => setMyId(id)); // Ha nem adunk ID-t, generál egy hosszút, de mi felülírjuk majd a Hostnál
    peer.on('connection', (conn) => {
      connRef.current = conn;
      setupConn(conn);
    });
    peerRef.current = peer;
  }, []);

  const setupConn = (conn: any) => {
    conn.on('data', (data: any) => {
      // HOST és CLIENT is kaphat adatot
      if (data.type === 'STATE') {
        setView(data.view); setCategory(data.cat); setTimeLeft(data.time);
        setTurn(data.turn); setMaxTime(data.max); setLastWord(data.word);
      }
      if (data.type === 'ACTION_WORD') {
        // Csak HOST kezeli
        if (role === 'HOST') handleTurnChange(data.word);
      }
      if (data.type === 'ACTION_VETO') {
        // Csak HOST kezeli
        if (role === 'HOST') handleVeto();
      }
      if (data.type === 'GAME_OVER') {
         setView('OVER'); setLoser(data.loser);
      }
    });
  };

  // --- HOST LÉTREHOZÁS ---
  const createRoom = () => {
    if (peerRef.current) peerRef.current.destroy(); // Töröljük a régit
    const shortId = genId();
    const peer = new Peer(shortId); // Saját rövid ID
    peer.on('open', (id) => {
      setMyId(id); setRole('HOST'); setView('LOBBY');
    });
    peer.on('connection', (conn) => {
      connRef.current = conn;
      setupConn(conn);
      // Ha csatlakoztak, 1mp múlva indul
      setTimeout(startGameHost, 1000);
    });
    peerRef.current = peer;
  };

  // --- CSATLAKOZÁS ---
  const joinRoom = () => {
    if (targetId.length < 4) return;
    const peer = new Peer();
    peer.on('open', () => {
      const conn = peer.connect(targetId);
      connRef.current = conn;
      setRole('CLIENT'); setView('LOBBY');
      setupConn(conn);
    });
    peerRef.current = peer;
  };

  // --- JÁTÉK MOTOR (CSAK HOST) ---
  const startGameHost = () => {
    const cat = generateCategory();
    broadcast(cat, 30, 30, 'HOST', 'GAME', '');
  };

  const handleTurnChange = (word: string) => {
    const nextTurn = turn === 'HOST' ? 'CLIENT' : 'HOST';
    const newMax = Math.max(5, maxTime - 1); // Gyorsul
    broadcast(category, newMax, newMax, nextTurn, 'GAME', word);
  };

  const handleVeto = () => {
    const prevTurn = turn === 'HOST' ? 'CLIENT' : 'HOST'; // Vissza az előzőnek
    broadcast(category, timeLeft, maxTime, prevTurn, 'GAME', "⛔ KAMU! ⛔");
  };

  const broadcast = (cat: string, time: number, max: number, trn: string, vw: string, word: string) => {
    // Helyi frissítés
    setCategory(cat); setTimeLeft(time); setMaxTime(max); setTurn(trn); setView(vw); setLastWord(word);
    // Küldés
    if (connRef.current) {
      connRef.current.send({ type: 'STATE', cat, time, max, turn: trn, view: vw, word });
    }
  };

  // --- IDŐZÍTŐ ---
  useEffect(() => {
    if (role === 'HOST' && view === 'GAME') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          const newVal = prev - 0.1;
          if (newVal <= 0) {
            const lsr = turn;
            setLoser(lsr); setView('OVER');
            connRef.current.send({ type: 'GAME_OVER', loser: lsr });
            return 0;
          }
          // Szinkronizálás (másodpercenként)
          if (Math.floor(newVal * 10) % 10 === 0) {
             connRef.current.send({ type: 'STATE', cat: category, time: newVal, max: maxTime, turn, view: 'GAME', word: lastWord });
          }
          return newVal;
        });
      }, 100);
      return () => clearInterval(timer);
    }
  }, [role, view, turn, category, lastWord, maxTime]);

  // --- INPUT ---
  const submit = (e: any) => {
    e.preventDefault();
    if (input.length < 2) return;
    if (role === 'HOST') handleTurnChange(input);
    else connRef.current.send({ type: 'ACTION_WORD', word: input });
    setInput('');
  };

  const sendVeto = () => {
    if (role === 'HOST') handleVeto();
    else connRef.current.send({ type: 'ACTION_VETO' });
  };

  const urgency = Math.max(0, 1 - (timeLeft / maxTime));

  return (
    <div style={S.wrapper}>
      {/* 3D Háttér */}
      <div style={{position: 'absolute', inset: 0, zIndex: -1}}>
        <Canvas>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <SimpleBomb urgency={urgency} />
        </Canvas>
      </div>

      <div style={S.debug}>ID: {myId}</div>

      {/* MENÜ */}
      {view === 'MENU' && (
        <div style={S.card}>
          <h1 style={S.h1}>TIK-TAK<br/>BUMM</h1>
          <p style={S.p}>Magyar Valóság Edition</p>
          
          <button style={{...S.btn, ...S.btnBlue}} onClick={createRoom}>ÚJ SZOBA</button>
          <p style={{margin: '10px 0'}}>vagy</p>
          <input style={S.input} placeholder="ÍRD BE A KÓDOT" value={targetId} onChange={e=>setTargetId(e.target.value)} />
          <button style={{...S.btn, ...S.btnGray}} onClick={joinRoom}>CSATLAKOZÁS</button>
        </div>
      )}

      {/* LOBBY */}
      {view === 'LOBBY' && (
        <div style={S.card}>
          <p style={S.p}>A SZOBA KÓDJA:</p>
          <div style={S.code}>{myId || targetId}</div>
          <p style={{color: '#00f3ff', animation: 'pulse 1s infinite'}}>
            {role === 'HOST' ? 'Várakozás játékosra...' : 'Csatlakozva! Host indít...'}
          </p>
        </div>
      )}

      {/* JÁTÉK */}
      {view === 'GAME' && (
        <div style={S.card}>
          <div style={{borderBottom: '1px solid #444', paddingBottom: '10px'}}>
            <p style={{fontSize: '0.8rem', color: '#888', letterSpacing: '2px'}}>A FELADAT:</p>
            <h2 style={S.h2}>{category}</h2>
          </div>

          {turn === role ? (
            <div style={{animation: 'shake 0.5s infinite'}}>
              <h2 style={{color: '#ff0055'}}>TE JÖSSZ!</h2>
              <p style={{color: 'red', fontSize: '0.8rem', marginBottom: '5px'}}>
                {lastWord === "⛔ KAMU! ⛔" ? "VISSZAKAPTAD! (KAMU VOLT)" : ""}
              </p>
              <form onSubmit={submit}>
                <input autoFocus style={S.input} value={input} onChange={e=>setInput(e.target.value)} placeholder="ÍRJ VALAMIT!" />
                <button style={{...S.btn, ...S.btnBlue}}>KÜLDÉS 🚀</button>
              </form>
            </div>
          ) : (
            <div>
              <p style={S.p}>A másik válasza:</p>
              <div style={S.word}>{lastWord || "..."}</div>
              {lastWord && !lastWord.includes("⛔") && (
                 <button style={{...S.btn, ...S.btnRed, padding: '10px', fontSize: '1rem'}} onClick={sendVeto}>EZ KAMU! 🚨</button>
              )}
              <p style={{marginTop: '15px', fontStyle: 'italic', opacity: 0.6}}>A másik gondolkodik...</p>
            </div>
          )}

          <div style={S.barContainer}>
            <div style={{
              width: `${(timeLeft/maxTime)*100}%`, height: '100%', 
              background: timeLeft < 5 ? '#ff0055' : '#00f3ff', transition: 'width 0.1s linear'
            }} />
          </div>
        </div>
      )}

      {/* GAME OVER */}
      {view === 'OVER' && (
        <div style={{...S.card, borderColor: 'red'}}>
          <h1 style={{...S.h1, color: 'red'}}>BUMM!</h1>
          <h2 style={{fontSize: '2rem'}}>
            {loser === role ? "VESZTETTÉL! ☠️" : "NYERTÉL! 🏆"}
          </h2>
          {role === 'HOST' && (
            <button style={{...S.btn, ...S.btnBlue}} onClick={startGameHost}>KÖVETKEZŐ KÖR</button>
          )}
          {role === 'CLIENT' && <p>A Host indítja az újat...</p>}
        </div>
      )}
    </div>
  );
}