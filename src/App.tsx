import { useState, useEffect, useRef, useMemo } from 'react'; // JAVÍTVA: React import kivéve a hiba miatt!
import Peer from 'peerjs';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. BRUTÁL NEON & GLITCH CSS
// ==========================================
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@500;700;900&display=swap');
  
  body { margin: 0; background: #000; overflow: hidden; font-family: 'Rajdhani', sans-serif; color: white; }
  
  .app-layer { position: absolute; inset: 0; display: flex; flex-direction: column; z-index: 10; overflow-y: auto; }
  
  /* GLITCH CÍM ANIMÁCIÓ */
  @keyframes glitch {
    0% { transform: translate(0); }
    20% { transform: translate(-2px, 2px); }
    40% { transform: translate(-2px, -2px); }
    60% { transform: translate(2px, 2px); }
    80% { transform: translate(2px, -2px); }
    100% { transform: translate(0); }
  }
  
  .glitch-title {
    font-family: 'Black Ops One'; font-size: 5rem; 
    color: #fff; text-transform: uppercase;
    text-shadow: 2px 2px 0px #ff00de, -2px -2px 0px #00f3ff;
    animation: glitch 1s infinite alternate-reverse;
    margin-bottom: 30px; line-height: 0.9;
  }

  /* MENÜ GOMBOK */
  .btn-neon {
    padding: 20px 40px; font-family: 'Black Ops One'; font-size: 1.5rem; text-transform: uppercase;
    background: transparent; color: #fff; border: 2px solid #ff00de;
    box-shadow: 0 0 15px #ff00de, inset 0 0 15px #ff00de;
    cursor: pointer; transition: 0.2s; width: 100%; max-width: 350px; margin-top: 20px;
    text-shadow: 0 0 10px #ff00de; position: relative; overflow: hidden;
  }
  .btn-neon:hover {
    background: #ff00de; color: black; box-shadow: 0 0 50px #ff00de;
  }
  
  .btn-cyan {
    border-color: #00f3ff; box-shadow: 0 0 15px #00f3ff, inset 0 0 15px #00f3ff;
    text-shadow: 0 0 10px #00f3ff;
  }
  .btn-cyan:hover {
    background: #00f3ff; color: black; box-shadow: 0 0 50px #00f3ff;
  }

  /* UI ELEMEK */
  .glass-panel {
    background: rgba(10, 10, 20, 0.7); backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 15px;
    padding: 20px; margin: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.8);
  }

  .cyber-input {
    width: 100%; padding: 15px; background: rgba(0,0,0,0.8); 
    border: 2px solid #555; color: #00f3ff; font-family: 'Rajdhani'; 
    font-size: 1.2rem; font-weight: bold; text-align: center; text-transform: uppercase;
    outline: none; margin-bottom: 20px; transition: 0.3s;
  }
  .cyber-input:focus { border-color: #00f3ff; box-shadow: 0 0 20px #00f3ff; }

  /* SCORE BAR */
  .top-hud {
    display: flex; justify-content: space-between; align-items: center;
    padding: 15px 30px; background: rgba(0,0,0,0.8); border-bottom: 2px solid #00f3ff;
    box-shadow: 0 0 20px rgba(0,243,255,0.2);
  }
  .hud-score { font-size: 2rem; font-weight: 900; }
  .p1-color { color: #00f3ff; text-shadow: 0 0 10px #00f3ff; }
  .p2-color { color: #ff00de; text-shadow: 0 0 10px #ff00de; }

  /* KÖZÉPRE IGAZÍTÁS */
  .center-screen {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 20px;
  }
`;

// ==========================================
// 2. IGAZI 3D VILÁG (MOZGÓ TRASH)
// ==========================================
function FloatingTrash() {
  const mesh = useRef<any>();
  // Véletlenszerű formák generálása
  const count = 50;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);
      
      dummy.position.set(
        (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      );
      dummy.scale.set(s, s, s);
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    // Forgassuk az egész világot lassan
    mesh.current.rotation.y += 0.002;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <octahedronGeometry args={[1, 0]} />
      <meshPhongMaterial color="#ff00de" wireframe />
    </instancedMesh>
  );
}

function Scene3D() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 30]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[20, 20, 20]} color="#00f3ff" intensity={2} />
      <pointLight position={[-20, -20, -20]} color="#ff00de" intensity={2} />
      
      {/* Csillagok a háttérben, gyorsan mozognak (Warp hatás) */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={3} />
      
      {/* Lebegő trash elemek */}
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
         <FloatingTrash />
      </Float>
    </>
  );
}

// ==========================================
// 3. ÓRIÁS ADATBÁZIS (50+ ELEM)
// ==========================================
const TRASH_CELEBS = ["Tóth Gabi", "Alekosz", "Varga Irén", "Berki szelleme", "Kis Grófo", "Pumped Gabo", "MC Isti", "Bartos Cs.", "Gáspár Laci", "Fekete Pákó", "Győzike", "Bea asszony", "Zimány Linda", "Hajdú Péter", "Mandula Ádám", "PSG Ogli", "Whisper Ton", "Baukó Éva", "Molnár Anikó", "Aurelio", "VV Cristofel", "Szabyest", "Lakatos Brendon", "Polgár Jenő", "Szalai Ádám", "Varga Viktor", "Kulcsár Edina", "G.w.M", "Tóth Andi", "Nagy Feró", "Korda Gyuri", "Balázs Klári", "Majka", "Curtis", "Azahriah", "Desh", "Dopeman", "Cicciolina", "Schobert Norbi", "Rubint Réka", "Orbán Viktor", "Gyurcsány", "Szájer József", "Németh Szilárd", "Bayer Zsolt", "Soros György", "Mészáros Lőrinc", "Karácsony Gergely", "Márki-Zay Péter", "Novák Katalin", "Varga Judit", "Deutsch Tamás", "Jakab Péter", "Egy bedrogozott BKV ellenőr", "A GLS futár", "Egy korrupt NAV ellenőr", "A nőgyógyászod", "A szomszéd néni", "Egy kanos tinédzser", "Egy OnlyFans modell", "A sarki gyrosos", "Egy részeg pap", "A postás", "A matektanárod", "A főnököd", "Egy taxis hiéna", "Zacher Gábor", "Csernus doki", "Dancsó Péter"];

const SITUATION_TEMPLATES = ["A Blaha Lujza téren {WHO} éppen ...-t csinál a szökőkútban.", "{WHO} a 4-es 6-oson üvöltözve próbál eladni egy ...-t.", "A Parlament közepén {WHO} ...-al keni be a meztelen testét.", "A Hősök terén {WHO} egy ...-t áldozott fel a turulmadárnak.", "A Nyugati aluljáróban {WHO} ...-t cserélt egy doboz cigiért.", "Az első randin {WHO} elővett egy ...-t a táskájából.", "A ravatalozóban {WHO} véletlenül elejtett egy ...-t.", "{WHO} egy toi-toi vécében ...-t próbál lehúzni.", "A templomban {WHO} az oltárra helyezett egy ...-t.", "A szülői értekezleten {WHO} ...-t rajzolt a táblára.", "{WHO} részegen ...-t tetováltatott a homlokára.", "A szülőszobán {WHO} ...-t akart adni az újszülöttnek.", "A temetésen {WHO} ...-al dobálta meg a gyászolókat.", "A szaunában {WHO} ...-al csapkodta az embereket.", "Az éjféli misén {WHO} ...-t kiabált a papnak.", "{WHO} az OnlyFans oldalán ...-t dugott a fülébe.", "A Híradó élő adásában {WHO} ...-t mutatott a kamerának.", "A Való Világ villában {WHO} ...-t csempészett a nyugiszobába.", "{WHO} a Tinder profiljára egy ...-ról töltött fel képet.", "A Fókusz riportjában {WHO} bevallotta, hogy ...-t tart az ágya alatt.", "Egy kiszivárgott hangfelvételen {WHO} éppen ...-t kér a dealerétől.", "A MÁV vonaton {WHO} ...-t dobált az utasokra.", "A Lidl kasszájánál {WHO} ...-al akart fizetni.", "{WHO} a konditeremben ...-t emelgetett súlyzó helyett.", "A NAV ellenőrzésen {WHO} ...-t húzott elő a zsebéből.", "Az állatkertben {WHO} ...-t próbált etetni a majmokkal.", "A BKV ellenőrnek {WHO} ...-t mutatott bérlet helyett.", "A bíróságon {WHO} ...-t vallott a bírónak.", "{WHO} egy swinger klubban ...-t használt síkosító helyett.", "Az orvosi rendelőben {WHO} ...-t vetetett ki a végbeléből.", "{WHO} a Sziget VIP-ben felszívott egy csík ...-t.", "Egy házibuliban {WHO} ...-t kevert a puncsba.", "{WHO} részegen azt hitte, hogy a ... egy mikrofon.", "A Balaton Soundon {WHO} ...-t csinált egy gumimatraccal."];

const QUESTIONS = ["Maszturbálás közben véletlenül ezt kiabáltad:", "Amikor a proktológus benyúlt, ezt súgtad neki:", "Ezt mondanád, ha rajtakapnának egy kecskével:", "Szex után ezt mondod mindig a párodnak:", "Ha találkoznál Istennel, ez lenne az első szavad:", "A bíróságon ezzel védekeznél a gyilkosság után:", "Ezt írnád a sírkövedre:", "Amikor megláttad a párod meztelenül, ez csúszott ki a szádon:", "Ezt mondanád, ha Tóth Gabi megkérné a kezed:", "Mit mondasz, ha a futár meglátja a szexjátékodat:", "Az utolsó szavaid a villamosszékben:", "Ezt kiabálod orgazmus közben:", "Mit mondanál, ha Orbán Viktor meztelenül kopogna nálad:", "A Tinder bemutatkozásod ez lenne:", "Ezt a nevet adnád a nemi szervednek:", "Ha egy napig az ellenkező nemű lennél, ez lenne az első dolgod:", "Ezt mondanád a rendőrnek, ha hullát találna nálad:", "A legkínosabb dolog, amit a Google-ben kerestél:", "Ezt suttognád Putyin fülébe:", "Ha kannibál lennél, melyik testrészt ennéd meg először:", "A legrosszabb hely, ahova valaha hánytál:", "Ezt mondanád, ha a gyereked meglátna szex közben:", "Ha választhatnál, kinek a bugyiját szagolnád meg:", "A legbetegebb fétised, amit senki sem tud:", "Ezt írnád az exednek részegen hajnali 3-kor:", "Mit tennél, ha kiderülne, hogy testvérek vagytok a pároddal:", "Ezt mondanád, ha a nőgyógyászod a volt osztálytársad lenne:", "A legdurvább hely, ahol valaha szexeltél:", "Mit csinálnál, ha láthatatlan lennél a női öltözőben:", "Ezt a mondatot tetováltatnád a fenekedre:", "Ha a péniszed/melled tudna beszélni, mit mondana most:", "A legrosszabb dolog, amit részegen csináltál:", "Kivel feküdnél le a jelenlévők közül pénzért:", "Ezt mondanád, ha Varga Irén duettet akarna veled:", "Hova rejtenél el egy levágott fejet a lakásodban:", "Milyen szexuális segédeszközt vinnél magaddal egy lakatlan szigetre:"];

const ROLES = ["Aki először halna meg egy zombiapokalipszisben", "Aki titokban lábképeket árul az interneten", "Akinek a legbüdösebb a lába", "Aki a saját anyját is eladná egy iPhone-ért", "Aki valószínűleg idegen lény, csak álcázza magát", "Aki titokban szerelmes Németh Szilárdba", "Aki biztosan börtönbe kerül 5 éven belül", "Akinek a böngészési előzményeiért börtön járna", "Aki részegen mindig sírva fakad", "Aki a legrosszabbul csókol", "Aki sosem mossa meg a kezét WC után", "Akire ráférne egy alapos pszichiátriai kezelés", "Aki titokban Fidesz-tagkönyvet tart a párnája alatt", "Aki elhinné, hogy a Föld lapos", "Aki képes lenne megenni egy nyers galambot", "Aki a saját fingját szagolgatja", "Aki valószínűleg szűzen hal meg", "Aki a legtöbb nemi betegséget hordozza", "Aki lopott már a Tescóból", "Aki simán lefeküdne egy állattal pénzért", "Aki szerint Varga Irén tehetséges", "Aki a zuhany alatt is zokniban fürdik", "Aki titokban a saját unokatestvérére izgul", "Aki biztosan volt már detoxikálóban", "Aki úgy néz ki, mint aki most szabadult", "Aki eladná a lelkét egy kis hírnévért", "Akinek a legkisebb az IQ-ja a társaságban", "Aki titokban női ruhákat hord otthon", "Aki mindig elfelejti lehúzni a WC-t", "Aki képes lenne megölni valakit egy parkolóhelyért", "Aki valószínűleg csatlakozna egy szektához", "Aki a legbénább az ágyban", "Aki még mindig az anyjával élne 40 évesen", "Aki biztosan sírva fakad szex közben", "Aki a legvalószínűbben lesz csöves", "Aki titokban plüssállatokkal beszélget"];

const LETTERS = "ABDEFGHKLMNPRSTVZ";
const getLetters = () => {
  let res = "";
  for(let i=0; i<3; i++) res += LETTERS[Math.floor(Math.random() * LETTERS.length)] + " ";
  return res.trim().replace(/ /g, " - ");
};

const generateTasks = () => {
  const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
  const celeb = getRandom(TRASH_CELEBS);
  const t1_text = getRandom(SITUATION_TEMPLATES).replace("{WHO}", `<span class="highlight">${celeb}</span>`);
  
  const t3_celebs = [getRandom(TRASH_CELEBS), getRandom(TRASH_CELEBS), getRandom(TRASH_CELEBS)];
  const role = getRandom(ROLES);
  const cast_options = [getRandom(TRASH_CELEBS), getRandom(TRASH_CELEBS), getRandom(TRASH_CELEBS)];

  return {
    t1: { text: t1_text, letters: getLetters() },
    t2: { text: getRandom(QUESTIONS), letters: getLetters() },
    t3: { celebs: t3_celebs },
    t4: { role: role, options: cast_options }
  };
};

// ==========================================
// 4. JÁTÉK LOGIKA
// ==========================================
export default function App() {
  const [view, setView] = useState('MENU');
  const [role, setRole] = useState<'HOST' | 'CLIENT' | null>(null);
  const [myId, setMyId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [myName, setMyName] = useState('');
  
  const [players, setPlayers] = useState<any[]>([]);
  const [votingIndex, setVotingIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const [myTasks, setMyTasks] = useState<any>(null);
  const [myAnswers, setMyAnswers] = useState<any>({ t1: "", t2: "", t3_1: "", t3_2: "", t4: null });
  const [votingData, setVotingData] = useState<any>(null);
  const [myVote, setMyVote] = useState(5);

  const peerRef = useRef<Peer>(null!);
  const connsRef = useRef<any[]>([]);

  useEffect(() => {
    const peer = new Peer();
    peer.on('open', (id) => setMyId(id));
    peer.on('connection', (conn) => {
      conn.on('data', (data: any) => handleDataHost(conn, data));
      connsRef.current.push(conn);
    });
    peerRef.current = peer;
    return () => peer.destroy();
  }, []);

  const createRoom = () => {
    if (!myName) return alert("Írj be egy nevet!");
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const newPeer = new Peer(code);
    newPeer.on('open', (id) => {
      setRoomId(id); setRole('HOST');
      setPlayers([{ id: id, name: myName, score: 0, tasks: null, answers: null }]);
      setView('LOBBY');
    });
    newPeer.on('connection', (conn) => {
      connsRef.current.push(conn);
      conn.on('data', (data) => handleDataHost(conn, data));
    });
    if(peerRef.current) peerRef.current.destroy();
    peerRef.current = newPeer;
  };

  const handleDataHost = (conn: any, data: any) => {
    if (data.type === 'JOIN') {
      setPlayers(prev => {
        const newList = [...prev, { id: conn.peer, name: data.name, score: 0, tasks: null, answers: null }];
        broadcast(newList, 'UPDATE_PLAYERS');
        return newList;
      });
    }
    if (data.type === 'SUBMIT_ANSWERS') {
      setPlayers(prev => prev.map(p => p.id === conn.peer ? { ...p, answers: data.answers } : p));
    }
    if (data.type === 'SUBMIT_VOTE') addScoreToCurrent(data.value);
  };

  const addScoreToCurrent = (points: number) => {
    setPlayers(prev => {
      const newList = [...prev];
      if(newList[votingIndex]) newList[votingIndex].score += points;
      return newList;
    });
  };

  const broadcast = (payload: any, type: string) => {
    connsRef.current.forEach(conn => conn.send({ type, payload }));
  };

  const startGameHost = () => {
    const updatedPlayers = players.map(p => ({ ...p, tasks: generateTasks(), answers: null }));
    setPlayers(updatedPlayers);
    connsRef.current.forEach(conn => {
      const pData = updatedPlayers.find(p => p.id === conn.peer);
      if (pData) conn.send({ type: 'START_GAME', tasks: pData.tasks });
    });
    const hostData = updatedPlayers.find(p => p.id === roomId);
    if(hostData) setMyTasks(hostData.tasks);
    setView('PLAYING');
    setTimeLeft(180);
  };

  const joinRoom = () => {
    if (!joinCode || !myName) return alert("Név és Kód kell!");
    const conn = peerRef.current.connect(joinCode);
    conn.on('open', () => {
      setRole('CLIENT'); setRoomId(joinCode);
      conn.send({ type: 'JOIN', name: myName });
      setView('LOBBY');
    });
    conn.on('data', (data: any) => {
      if (data.type === 'UPDATE_PLAYERS') setPlayers(data.payload);
      if (data.type === 'START_GAME') { setMyTasks(data.tasks); setView('PLAYING'); setTimeLeft(180); }
      if (data.type === 'VOTE_PHASE') { setVotingData(data.targetPlayer); setView('VOTING'); setMyVote(5); }
      if (data.type === 'SHOW_LEADERBOARD') { setPlayers(data.players); setView('LEADERBOARD'); }
    });
    // @ts-ignore
    connsRef.current = [conn];
  };

  const sendToHost = (type: string, payload?: any) => {
    // @ts-ignore
    connsRef.current[0].send({ type, ...payload });
  };

  useEffect(() => {
    if (view !== 'PLAYING') return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { 
          if (role === 'HOST') startVotingPhase();
          return 0; 
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [view, role]);

  const submitMyAnswers = () => {
    if (role === 'HOST') {
      setPlayers(prev => prev.map(p => p.id === roomId ? { ...p, answers: myAnswers } : p));
      setView('WAITING');
    } else {
      sendToHost('SUBMIT_ANSWERS', { answers: myAnswers });
      setView('WAITING');
    }
  };

  const startVotingPhase = () => {
    setVotingIndex(0);
    broadcastVoting(0);
  };

  const broadcastVoting = (index: number) => {
    if (index >= players.length) {
      broadcast({ players }, 'SHOW_LEADERBOARD');
      setView('LEADERBOARD');
      return;
    }
    const target = players[index];
    setVotingData(target);
    setView('VOTING');
    setMyVote(5);
    broadcast(target, 'VOTE_PHASE');
  };

  const submitVote = () => {
    if (role === 'HOST') {
      addScoreToCurrent(parseInt(String(myVote)));
      const nextIdx = votingIndex + 1;
      setVotingIndex(nextIdx);
      setTimeout(() => broadcastVoting(nextIdx), 500);
    } else {
      sendToHost('SUBMIT_VOTE', { value: parseInt(String(myVote)) });
      setView('WAITING_NEXT_VOTE');
    }
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="app-layer">
        
        {/* 3D HÁTTÉR */}
        <div style={{position:'absolute', inset:0, zIndex:-1}}>
           <Canvas>
             <Scene3D />
           </Canvas>
        </div>

        {/* --- MENU --- */}
        {view === 'MENU' && (
          <div className="center-screen">
            <h1 className="glitch-title">TRASH<br/>UNIVERSE</h1>
            <input className="cyber-input" style={{maxWidth:'350px'}} placeholder="JÁTÉKOS NÉV" value={myName} onChange={e=>setMyName(e.target.value)} />
            <button className="btn-neon btn-cyan" onClick={createRoom}>ÚJ SZOBA</button>
            <p style={{margin:'20px', color:'#aaa'}}>vagy</p>
            <input className="cyber-input" style={{maxWidth:'350px'}} placeholder="SZOBA KÓD" value={joinCode} onChange={e=>setJoinCode(e.target.value)} />
            <button className="btn-neon" onClick={joinRoom}>CSATLAKOZÁS</button>
          </div>
        )}

        {/* --- LOBBY --- */}
        {view === 'LOBBY' && (
          <div className="center-screen">
            <h1 className="glitch-title" style={{fontSize:'3rem'}}>LOBBY</h1>
            <div style={{color:'#aaa'}}>SZOBA KÓD:</div>
            <div style={{fontSize:'4rem', color:'#ffdd00', fontFamily:'Black Ops One'}}>{roomId}</div>
            
            <div style={{display:'flex', gap:'10px', flexWrap:'wrap', justifyContent:'center', margin:'30px'}}>
              {players.map(p => (
                <div key={p.id} style={{padding:'10px 20px', background: p.id===myId?'#ff00de':'#333', borderRadius:'20px', fontWeight:'bold', border:'1px solid white'}}>
                  {p.name}
                </div>
              ))}
            </div>

            {role === 'HOST' ? (
              <button className="btn-neon btn-cyan" onClick={startGameHost}>JÁTÉK INDÍTÁSA</button>
            ) : (
              <p style={{marginTop:'30px', animation:'pulse 1s infinite'}}>A Host hamarosan indít...</p>
            )}
          </div>
        )}

        {/* --- JÁTÉK --- */}
        {view === 'PLAYING' && myTasks && (
          <div className="app-layer">
            <div className="top-hud">
               <div>{myName}</div>
               <div className="hud-score" style={{color: timeLeft<10?'red':'white'}}>{timeLeft}</div>
            </div>

            <div className="glass-panel">
              <div className="task-label">1. SZITUÁCIÓ (Egészítsd ki!)</div>
              <div style={{marginBottom:'10px'}} dangerouslySetInnerHTML={{__html: myTasks.t1.text.replace("...", "_______")}} />
              <div style={{color:'#ffdd00', fontSize:'0.9rem', fontWeight:'bold', marginBottom:'10px'}}>BETŰK: {myTasks.t1.letters}</div>
              <input className="cyber-input" placeholder="Írd be..." value={myAnswers.t1} onChange={e=>setMyAnswers({...myAnswers, t1: e.target.value})} />
            </div>

            <div className="glass-panel">
              <div className="task-label">2. KÍN-PAD (Vallomás)</div>
              <div style={{marginBottom:'10px'}}>{myTasks.t2.text}</div>
              <div style={{color:'#ffdd00', fontSize:'0.9rem', fontWeight:'bold', marginBottom:'10px'}}>BETŰK: {myTasks.t2.letters}</div>
              <input className="cyber-input" placeholder="Válasz..." value={myAnswers.t2} onChange={e=>setMyAnswers({...myAnswers, t2: e.target.value})} />
            </div>

            <div className="glass-panel">
              <div className="task-label">3. SZTORILÁNC</div>
              <div className="chain-step"><div className="pill">{myTasks.t3.celebs[0]}</div> <span>mit csinált vele?</span></div>
              <input className="cyber-input" style={{marginBottom:'10px'}} placeholder="..." value={myAnswers.t3_1} onChange={e=>setMyAnswers({...myAnswers, t3_1: e.target.value})} />
              
              <div className="chain-step"><div className="pill" style={{background:'#00f3ff', color:'black'}}>{myTasks.t3.celebs[1]}</div> <span>erre mit reagált?</span></div>
              <input className="cyber-input" style={{marginBottom:'10px'}} placeholder="..." value={myAnswers.t3_2} onChange={e=>setMyAnswers({...myAnswers, t3_2: e.target.value})} />
              
              <div className="chain-step"><div className="pill" style={{background:'#ffdd00', color:'black'}}>{myTasks.t3.celebs[2]}</div></div>
            </div>

            <div className="glass-panel">
              <div className="task-label">4. CASTING (Kire illik?)</div>
              <div style={{marginBottom:'15px', fontStyle:'italic', fontSize:'1.1rem'}}>"{myTasks.t4.role}"</div>
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                {myTasks.t4.options.map((opt: string, idx: number) => (
                  <div key={idx} 
                       style={{padding:'15px', background: myAnswers.t4 === idx ? '#00f3ff' : '#222', color: myAnswers.t4 === idx ? 'black' : '#aaa', textAlign:'center', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}
                       onClick={() => setMyAnswers({...myAnswers, t4: idx})}>
                    {opt}
                  </div>
                ))}
              </div>
            </div>

            <div style={{padding:'20px', textAlign:'center'}}>
               <button className="btn-neon btn-cyan" onClick={submitMyAnswers}>BEKÜLDÉS</button>
            </div>
          </div>
        )}

        {view === 'WAITING' && (
           <div className="center-screen">
             <h2>VÁRAKOZÁS A TÖBBIEKRE...</h2>
             <div style={{fontSize:'3rem', marginTop:'20px'}}>⏳</div>
             {role === 'HOST' && <button className="btn-neon" style={{fontSize:'1rem'}} onClick={startVotingPhase}>KÉNYSZERÍTÉS (SKIP)</button>}
           </div>
        )}

        {/* --- SZAVAZÁS --- */}
        {view === 'VOTING' && votingData && (
          <div className="app-layer">
            <div className="center-screen" style={{paddingTop:'50px'}}>
               <h2 style={{color:'#ff00de', margin:0}}>MOST PONTOZZUK:</h2>
               <h1 style={{fontSize:'3rem', margin:'10px 0', textShadow:'0 0 15px white'}}>{votingData.name}</h1>
            </div>
            
            <div style={{padding:'20px'}}>
                <div className="glass-panel">
                   <div className="task-label">1. SZITUÁCIÓ</div>
                   <div style={{fontSize:'0.8rem', color:'#aaa'}} dangerouslySetInnerHTML={{__html: votingData.tasks?.t1.text}} />
                   <div className="cyber-input" style={{background:'black', color:'#ffdd00', border:'none', marginTop:'10px'}}>{votingData.answers?.t1 || "-"}</div>
                </div>

                <div className="glass-panel">
                   <div className="task-label">2. KÍN-PAD</div>
                   <div style={{fontSize:'0.8rem', color:'#aaa'}}>{votingData.tasks?.t2.text}</div>
                   <div className="cyber-input" style={{background:'black', color:'#ffdd00', border:'none', marginTop:'10px'}}>{votingData.answers?.t2 || "-"}</div>
                </div>

                <div className="glass-panel">
                   <div className="task-label">3. SZTORI</div>
                   <div style={{background:'black', padding:'15px', borderRadius:'8px', color:'#00f3ff', lineHeight:'1.6'}}>
                     <span style={{color:'#ff00de', fontWeight:'bold'}}>{votingData.tasks?.t3.celebs[0]}</span> 
                     {" -> "} {votingData.answers?.t3_1} {" -> "} 
                     <span style={{color:'#fff', fontWeight:'bold'}}>{votingData.tasks?.t3.celebs[1]}</span> 
                     {" -> "} {votingData.answers?.t3_2} {" -> "} 
                     <span style={{color:'#ffdd00', fontWeight:'bold'}}>{votingData.tasks?.t3.celebs[2]}</span>
                   </div>
                </div>

                <div className="glass-panel">
                   <div className="task-label">4. VÁLASZTÁS</div>
                   <div style={{fontSize:'0.9rem', color:'#aaa', fontStyle:'italic'}}>"{votingData.tasks?.t4.role}"</div>
                   <div style={{marginTop:'15px', textAlign:'center', fontSize:'1.5rem', fontWeight:'bold', color:'#00f3ff'}}>
                      {votingData.answers?.t4 !== null ? votingData.tasks?.t4.options[votingData.answers?.t4] : "-"}
                   </div>
                </div>

                <div style={{marginTop:'30px', background:'rgba(0,0,0,0.8)', padding:'20px', borderRadius:'15px', border:'2px solid #ff00de'}}>
                   <div style={{textAlign:'center', marginBottom:'15px', fontWeight:'bold', fontSize:'1.2rem'}}>MENNYIRE TRASH? (1-10)</div>
                   <input type="range" min="1" max="10" value={myVote} onChange={e=>setMyVote(parseInt(e.target.value))} style={{width:'100%', accentColor:'#ff00de', height:'20px', cursor:'pointer'}} />
                   <div style={{textAlign:'center', fontSize:'3rem', fontWeight:'bold', color:'#ff00de', marginTop:'10px'}}>{myVote}</div>
                </div>

                <div style={{textAlign:'center', marginTop:'20px', paddingBottom:'50px'}}>
                   <button className="btn-neon" onClick={submitVote}>SZAVAZOK!</button>
                </div>
            </div>
          </div>
        )}

        {/* --- RANGLISTA --- */}
        {view === 'LEADERBOARD' && (
           <div className="center-screen">
             <h1 className="glitch-title">EREDMÉNY</h1>
             <div style={{display:'flex', flexDirection:'column', gap:'15px', width:'100%', maxWidth:'500px'}}>
                {players.sort((a,b) => b.score - a.score).map((p, i) => (
                  <div key={p.id} style={{display:'flex', justifyContent:'space-between', padding:'20px', background:'rgba(255,255,255,0.1)', borderRadius:'10px', alignItems:'center'}}>
                     <div style={{fontSize:'1.5rem', fontWeight:'bold'}}>#{i+1} {p.name}</div>
                     <div style={{fontSize:'2rem', color:'#00f3ff', textShadow:'0 0 10px #00f3ff'}}>{p.score}</div>
                  </div>
                ))}
             </div>
             {role === 'HOST' && <button className="btn-neon btn-cyan" onClick={startGameHost}>ÚJ KÖR</button>}
           </div>
        )}

      </div>
    </>
  );
}