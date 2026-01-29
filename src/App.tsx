import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';

// --- STÍLUSOK (BELEÉGETVE, HOGY NE ESSEN SZÉT) ---
const styles: any = {
  container: {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    backgroundColor: '#050505', color: 'white', fontFamily: 'Arial, sans-serif',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', zIndex: 9999
  },
  box: {
    backgroundColor: 'rgba(20, 20, 20, 0.9)', padding: '20px', borderRadius: '15px',
    border: '2px solid #00f3ff', textAlign: 'center', width: '85%', maxWidth: '400px',
    display: 'flex', flexDirection: 'column', gap: '15px', zIndex: 10000,
    boxShadow: '0 0 20px rgba(0, 243, 255, 0.3)'
  },
  title: { fontSize: '3rem', margin: 0, color: '#00f3ff', textTransform: 'uppercase', fontWeight: 'bold' },
  text: { fontSize: '1.2rem', margin: 0, color: '#ddd' },
  input: {
    padding: '15px', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid white',
    backgroundColor: '#333', color: 'white', width: '100%', boxSizing: 'border-box', textAlign: 'center'
  },
  btn: {
    padding: '15px', fontSize: '1.2rem', borderRadius: '50px', border: 'none',
    cursor: 'pointer', width: '100%', fontWeight: 'bold', textTransform: 'uppercase'
  },
  btnPrimary: { backgroundColor: '#00f3ff', color: 'black' },
  btnSecondary: { backgroundColor: '#444', color: 'white' },
  debug: { position: 'fixed', bottom: 10, left: 10, fontSize: '10px', color: 'yellow', zIndex: 99999 }
};

// --- EGYSZERŰ 3D GÖMB ---
function SimpleBomb({ active }: { active: boolean }) {
  const ref: any = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.01;
      const scale = active ? 1.5 + Math.sin(state.clock.elapsedTime * 5) * 0.2 : 1.2;
      ref.current.scale.set(scale, scale, scale);
    }
  });
  return (
    <Sphere ref={ref} args={[1, 16, 16]}>
      <meshStandardMaterial color={active ? "red" : "#00f3ff"} wireframe />
    </Sphere>
  );
}

// --- FŐ LOGIKA ---
export default function App() {
  const [view, setView] = useState('MENU'); 
  const [status, setStatus] = useState('Betöltés...');
  const [myId, setMyId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [msg, setMsg] = useState('Várakozás...');
  
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<any>(null);

  // 1. PeerJS INDÍTÁSA (AZONNAL)
  useEffect(() => {
    setStatus("PeerJS inicializálás...");
    try {
      const peer = new Peer();
      
      peer.on('open', (id) => {
        setMyId(id);
        setStatus("Online! ID kész.");
      });

      peer.on('connection', (conn) => {
        connRef.current = conn;
        setView('GAME');
        setMsg("Valaki csatlakozott hozzád!");
        setupConnection(conn);
      });

      peer.on('error', (err) => {
        setStatus("HIBA: " + err.type);
      });

      peerRef.current = peer;
    } catch (e: any) {
      setStatus("KRITIKUS HIBA: " + e.message);
    }
  }, []);

  const setupConnection = (conn: any) => {
    conn.on('data', (data: any) => {
      setMsg("Üzenet jött: " + data);
    });
    conn.on('open', () => {
      setMsg("Kapcsolat él!");
    });
  };

  const connectTo = () => {
    if (!targetId) return;
    setStatus("Csatlakozás ide: " + targetId);
    if (peerRef.current) {
      const conn = peerRef.current.connect(targetId);
      connRef.current = conn;
      setView('GAME');
      setupConnection(conn);
    }
  };

  const sendPing = () => {
    if (connRef.current) {
      connRef.current.send("BUMM!");
      setMsg("Elküldve: BUMM!");
    } else {
      setMsg("Nincs kapcsolat!");
    }
  };

  return (
    <div style={styles.container}>
      
      {/* HÁTTÉR */}
      <div style={{ position: 'absolute', inset: 0, zIndex: -1 }}>
        <Canvas>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <SimpleBomb active={view === 'GAME'} />
        </Canvas>
      </div>

      {/* HIBAKERESŐ NAPLÓ (HOGY LÁSD MI A BAJ) */}
      <div style={styles.debug}>STATUS: {status} | ID: {myId}</div>

      {/* MENÜ NÉZET */}
      {view === 'MENU' && (
        <div style={styles.box}>
          <h1 style={styles.title}>TIK-TAK</h1>
          <p style={styles.text}>A Te kódod:</p>
          <h2 style={{fontSize: '2rem', margin: 0, color: 'yellow', wordBreak: 'break-all'}}>{myId || "Generálás..."}</h2>
          
          <div style={{width: '100%', height: '2px', background: '#555', margin: '10px 0'}}></div>
          
          <input 
            style={styles.input} 
            placeholder="Barát kódja ide" 
            value={targetId} 
            onChange={e => setTargetId(e.target.value)}
          />
          <button style={{...styles.btn, ...styles.btnPrimary}} onClick={connectTo}>
            CSATLAKOZÁS
          </button>
        </div>
      )}

      {/* JÁTÉK NÉZET (TESZT) */}
      {view === 'GAME' && (
        <div style={styles.box}>
          <h1 style={styles.title}>JÁTÉK</h1>
          <p style={{fontSize: '1.5rem', fontWeight: 'bold'}}>{msg}</p>
          <button style={{...styles.btn, ...styles.btnPrimary}} onClick={sendPing}>
            BOMBA KÜLDÉSE 💣
          </button>
          <button style={{...styles.btn, ...styles.btnSecondary}} onClick={() => window.location.reload()}>
            KILÉPÉS
          </button>
        </div>
      )}

    </div>
  );
}