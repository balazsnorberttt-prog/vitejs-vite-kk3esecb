import { useState, useEffect, useRef, useMemo } from 'react';
import Peer from 'peerjs';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. STÍLUSOK (GLOBAL CSS)
// ==========================================
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@500;700;900&display=swap');
  
  body { margin: 0; background: #000; overflow: hidden; font-family: 'Rajdhani', sans-serif; color: white; }
  .app-layer { position: absolute; inset: 0; display: flex; flex-direction: column; z-index: 10; overflow-y: auto; overflow-x: hidden; }
  
  /* INPUTOK */
  .cyber-input { 
    width: 100%; max-width: 400px; padding: 15px; background: rgba(0,0,0,0.7); border: 2px solid #444;
    color: #ffdd00; font-family: 'Rajdhani'; font-size: 1.2rem; font-weight: bold;
    border-radius: 8px; text-align: center; outline: none; margin-top: 5px; box-sizing: border-box;
    transition: 0.3s; text-transform: uppercase; 
  }
  .cyber-input:focus { border-color: #ffdd00; box-shadow: 0 0 20px rgba(255, 221, 0, 0.4); background: rgba(0,0,0,0.9); }
  
  /* GOMBOK */
  .btn-container { width: 100%; display: flex; justify-content: center; padding: 20px; box-sizing: border-box; margin-top: 20px; padding-bottom: 50px; }
  .btn-action { 
    width: 100%; max-width: 400px; padding: 20px; background: linear-gradient(90deg, #ff00de, #00f3ff); 
    color: white; font-family: 'Black Ops One'; font-size: 1.5rem; border: none; border-radius: 50px; 
    cursor: pointer; text-transform: uppercase; box-shadow: 0 5px 30px rgba(0,0,0,0.5); text-shadow: 2px 2px 0 black; transition: all 0.2s; 
  }
  .btn-action:active { transform: scale(0.95); }
  .btn-secondary { background: #333; color: white; border: 2px solid white; box-shadow: none; font-size: 1.2rem; }
  
  /* KÁRTYÁK */
  .container { padding: 20px; max-width: 650px; margin: 0 auto; width: 100%; box-sizing: border-box; flex: 1; display: flex; flex-direction: column; }
  .glass-card { 
    background: linear-gradient(135deg, rgba(20,20,30,0.9), rgba(10,10,20,0.85)); 
    border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px; margin-bottom: 25px; 
    box-shadow: 0 10px 40px rgba(0,0,0,0.7); position: relative; overflow: hidden; backdrop-filter: blur(10px); 
  }
  
  .task-label { color: #00f3ff; font-weight: 900; letter-spacing: 2px; margin-bottom: 12px; text-transform: uppercase; font-size: 0.9rem; border-bottom: 1px solid #333; padding-bottom: 5px; }
  .highlight { color: #ff00de; font-weight: bold; text-decoration: underline; }
  
  .story-row { display: flex; flex-direction: column; gap: 5px; margin-bottom: 15px; }
  .celeb-static { color: #ff00de; font-weight: 900; font-size: 1.1rem; text-transform: uppercase; text-shadow: 0 0 10px #ff00de; }
  
  .assoc-row { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
  .assoc-letter { font-size: 1.8rem; font-weight: 900; color: #ff00de; min-width: 30px; text-align: center; }
  
  /* UI LAYOUT */
  .top-bar { padding: 15px 20px; background: rgba(0,0,0,0.85); border-bottom: 2px solid #ff00de; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; backdrop-filter: blur(10px); }
  .menu { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 20px; box-sizing: border-box; }
  .glitch-title { font-size: 3.5rem; color: #fff; font-family: 'Black Ops One'; line-height: 0.9; margin-bottom: 30px; text-shadow: 3px 3px 0 #ff00de, -3px -3px 0 #00f3ff; }
  
  /* PONTOZÁS SLIDEREK */
  .vote-slider-container { margin-top: 15px; background: rgba(0,0,0,0.5); padding: 15px; border-radius: 8px; border: 1px dashed #555; }
  .vote-label { font-size: 0.9rem; color: #aaa; display: flex; justify-content: space-between; margin-bottom: 5px; }
  input[type=range] { width: 100%; cursor: pointer; accent-color: #ff00de; height: 25px; }
  .score-badge { color: #ff00de; font-weight: bold; font-size: 1.5rem; }
  
  .lobby-list { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 30px; margin-bottom: 30px; }
  .player-pill { padding: 10px 20px; background: #333; border-radius: 30px; border: 1px solid #555; font-weight: bold; }
`;

// ==========================================
// 2. 3D HÁTTÉR (WARP SPEED)
// ==========================================
function FloatingDebris() {
  const mesh = useRef<any>(null);
  const count = 40;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) temp.push({ 
        x: (Math.random() - 0.5) * 60, y: (Math.random() - 0.5) * 60, z: (Math.random() - 0.5) * 60, 
        rotSpeed: Math.random() * 0.02, scale: 0.5 + Math.random() 
    });
    return temp;
  }, []);
  
  useFrame((state) => {
    if (!mesh.current) return;
    particles.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z); 
      dummy.rotation.x += p.rotSpeed; dummy.rotation.y += p.rotSpeed; 
      dummy.scale.set(p.scale, p.scale, p.scale); 
      dummy.updateMatrix(); 
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true; 
    mesh.current.rotation.y += 0.001;
  });
  
  return <instancedMesh ref={mesh} args={[undefined, undefined, count]}><icosahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#ff00de" wireframe /></instancedMesh>;
}

function Scene3D() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 20]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={2} color="#00f3ff" />
      <pointLight position={[-10, -10, -10]} intensity={2} color="#ff00de" />
      <Stars radius={100} depth={50} count={6000} factor={4} saturation={0} fade speed={2} />
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}><FloatingDebris /></Float>
    </>
  );
}

// ==========================================
// 3. TELJES, VÁGATLAN ADATBÁZIS (100+ ELEM)
// ==========================================
const TRASH_CELEBS = [
  // Legendák & Celebek
  "Tóth Gabi", "Nagy Alekosz", "Varga Irén", "Berki Krisztián szelleme", "Kis Grófo", 
  "Pumped Gabo", "MC Isti", "Bartos Cs. István", "Gáspár Laci", "Fekete Pákó", 
  "Győzike", "Gáspár Bea", "Zimány Linda", "Hajdú Péter", "Mandula Ádám", "PSG Ogli", 
  "Whisper Ton", "Baukó Éva", "Molnár Anikó", "Aurelio", "VV Cristofel", "Szabyest",
  "Lakatos Brendon", "Polgár Jenő hivatala", "Szalai Ádám (a Názáreti)", "Varga Viktor",
  "Kulcsár Edina", "G.w.M", "Tóth Andi", "Nagy Feró", "Korda Gyuri bácsi", "Balázs Klári",
  "Csobot Adél", "Istenes Bence", "Majka", "Curtis", "Azahriah", "Desh", "Dopeman",
  "Cicciolina", "Gerendai Károly", "Schobert Norbi", "Rubint Réka", "A Schobert gyerekek",
  "Köllő Babett", "Tilla", "Sebestyén Balázs", "Vadon Jani", "Gáspár Evelin",
  "VV Merci", "Lady Szomjas", "Forstner Csenge", "Viszkok Fruzsi", "Osváth Zsolti",
  // Politika & Közélet
  "Orbán Viktor", "Gyurcsány Ferenc", "Szájer József", "Németh Szilárd", "Bayer Zsolt", 
  "Soros György", "Mészáros Lőrinc", "Karácsony Gergely", "Márki-Zay Péter", "Novák Katalin", 
  "Varga Judit", "Deutsch Tamás", "Jakab Péter", "Rákay Philip", "Bohár Dániel", "Trombitás Kristóf",
  "Kövér László", "Rogán Antal", "Szijjártó Péter", "Dobrev Klára", "Toroczkai László",
  "Egy Fidesz szavazó", "Egy DK nyugdíjas", "Putyin", "Zelensky", "Trump",
  // Hétköznapi & Abszurd
  "Egy bedrogozott BKV ellenőr", "A GLS futár, aki sosem csönget", "Egy korrupt NAV ellenőr", 
  "A nőgyógyászod", "A szomszéd néni, aki mindent lát", "Egy kanos tinédzser", "Egy OnlyFans modell", 
  "A sarki gyrosos, aki beleköpött a kajádba", "Egy részeg pap", "A postás", 
  "A matektanárod", "A főnököd tangában", "Egy taxis hiéna", "A házmester", 
  "Egy közmunkás", "A kidobóember a Morrison's-ból", "Zacher Gábor", "Csernus doki", 
  "Dancsó Péter", "Fókuszcsoport Ádám", "Pottyondy Edina", "Egy zacskó mákos guba",
  "Tóth Gabi tapétája", "A Szent Korona", "Egy lejárt BKK bérlet", "A Sziget fesztivál toi-toi vécéje"
];

const SITUATIONS = [
  // Publikus helyek
  "A Blaha Lujza téren {WHO} éppen ...-t csinál a szökőkútban.",
  "{WHO} a 4-es 6-oson üvöltözve próbál eladni egy ...-t.",
  "A Parlament közepén {WHO} ...-al keni be a meztelen testét.",
  "A Hősök terén {WHO} egy ...-t áldozott fel a turulmadárnak.",
  "A Nyugati aluljáróban {WHO} ...-t cserélt egy doboz cigiért.",
  "A Margitszigeten {WHO} ...-t dobált a futók után.",
  "A Deák téren {WHO} ...-t árult a turistáknak.",
  // Intim / Kínos
  "Az első randin {WHO} elővett egy ...-t a táskájából és az asztalra tette.",
  "A ravatalozóban {WHO} véletlenül elejtett egy ...-t a koporsó mellett.",
  "{WHO} egy toi-toi vécében ...-t próbál lehúzni, de nem megy.",
  "A templomban {WHO} az oltárra helyezett egy ...-t áldozatul.",
  "A szülői értekezleten {WHO} ...-t rajzolt a táblára a tanár helyett.",
  "{WHO} részegen ...-t tetováltatott a homlokára.",
  "A szülőszobán {WHO} ...-t akart adni az újszülöttnek.",
  "A temetésen {WHO} ...-al dobálta meg a gyászolókat.",
  "A szaunában {WHO} ...-al csapkodta az embereket nyírfavessző helyett.",
  "Az éjféli misén {WHO} ...-t kiabált a papnak.",
  // Média & Internet
  "{WHO} az OnlyFans oldalán ...-t dugott a fülébe egy videóban.",
  "A Híradó élő adásában {WHO} ...-t mutatott a kamerának.",
  "A Való Világ villában {WHO} ...-t csempészett a nyugiszobába.",
  "{WHO} a Tinder profiljára egy ...-ról töltött fel képet.",
  "A Fókusz riportjában {WHO} bevallotta, hogy ...-t tart az ágya alatt.",
  "Egy kiszivárgott hangfelvételen {WHO} éppen ...-t kér a dealerétől.",
  "{WHO} a Facebookon élőben közvetítette, ahogy ...-t eszik.",
  // Hétköznapi pokol
  "A MÁV vonaton {WHO} ...-t dobált az utasokra, mert késett a vonat.",
  "A Lidl kasszájánál {WHO} ...-al akart fizetni pénz helyett.",
  "{WHO} a konditeremben ...-t emelgetett súlyzó helyett.",
  "A NAV ellenőrzésen {WHO} ...-t húzott elő a zsebéből számla helyett.",
  "Az állatkertben {WHO} ...-t próbált etetni a majmokkal.",
  "A McDonald's-ban {WHO} ...-t kért a Happy Meal menübe.",
  "A BKV ellenőrnek {WHO} ...-t mutatott bérlet helyett.",
  "A bíróságon {WHO} ...-t vallott a bírónak védekezésül.",
  // Abszurd
  "{WHO} egy swinger klubban ...-t használt síkosító helyett.",
  "Az orvosi rendelőben {WHO} ...-t vetetett ki a végbeléből.",
  "{WHO} a Sziget VIP-ben felszívott egy csík ...-t.",
  "Egy házibuliban {WHO} ...-t kevert a puncsba.",
  "{WHO} részegen azt hitte, hogy a ... egy mikrofon és énekelni kezdett.",
  "A Balaton Soundon {WHO} ...-t csinált egy gumimatraccal.",
  "{WHO} a Pride felvonuláson ...-nak öltözött.",
  "Egy nyilvános WC-ben {WHO} ...-t írt a falra a saját szarával.",
  "{WHO} a karácsonyi vacsorán ...-t tett a bejglibe.",
  "A rendőrségi fogdában {WHO} ...-t rejtett el a végbélnyílásában.",
  "Az Operában {WHO} ...-t kiabált a tenor helyett.",
  "{WHO} a Balatonban ...-t keresett a víz alatt.", 
  "A választáson {WHO} ...-t rajzolt a szavazólapra."
];

const QUESTIONS = [
  "Maszturbálás közben ezt kiabáltad:", "A proktológusnak ezt súgtad:", "Ha rajtakapnak egy kecskével:", 
  "Szex után ezt mondod:", "Istennek ezt mondanád:", "A bíróságon ezzel védekeznél:", "Sírkövedre ezt írnád:", 
  "Ha a párod meztelen, ezt mondod:", "Ha Tóth Gabi megkérné a kezed:", "Ha a futár látja a szexjátékod:", 
  "Utolsó szavaid a villamosszékben:", "Orgazmus közben ezt ordítod:", "Ha Orbán kopogtatna nálad:", 
  "Tinder bemutatkozásod:", "Neve a nemi szervednek:", "Ha ellenkező nemű lennél:", "Ha hullát találnál nálad:", 
  "Legkínosabb Google keresésed:", "Putyinnak ezt súgnád:", "Kannibálként ezt ennéd:", "Legrosszabb hely hányásra:", 
  "Ha a gyereked meglát szex közben:", "Kinek a bugyiját szagolnád:", "Legbetegebb fétised:", "Részeg SMS az exednek:", 
  "Ha tesók lennétek a pároddal:", "Ha a nőgyógyászod osztálytársad:", "Legdurvább szexhelyszín:", 
  "Láthatatlanként mit tennél:", "Tetoválás a fenekedre:", "Ha a péniszed beszélne:", "Részegen mit tettél:", 
  "Kivel feküdnél le pénzért:", "Ha Varga Irén duettet akarna:", "Hova rejtenél egy fejet:", 
  "Szexeszköz a lakatlan szigetre:", "Ha szüleid rajtakapnak:", "Kit rugdosnál meg:", "Fingod illata:", 
  "Ha a kutya beszélne szex közben:", "Legundorítóbb dolog a szádban:", "Meztelen kép a főnöknek:", 
  "Ló testrész magadon:", "Ha Mészáros Lőrinc lennél:", "Pornófilmed címe:", "Titkos mappa jelszava:", 
  "Anyád halála vagy szex vele:", "Ha a pap az apád:", "Milyen nevet adnál a nemi betegségednek:",
  "Ezt mondanád, ha Gyurcsány masszírozná a lábad:"
];

// 4. FELADAT: ABSZURD SZAVAK ADATBÁZIS
const ABSURD_WORDS = [
  "Hüvelygomba", "Endoplazmatikus retikulum", "Fakanál", "Farhát", "Pacal", "Kádár János szelleme", 
  "Egy vödör takony", "Szilikon mell", "Büdös zokni", "Műfogsor", "Kolbászzsír", "Prosztata", 
  "Aranyér kenőcs", "Szájer ereszcsatornája", "Egy döglött patkány", "Használt óvszer", 
  "Németh Szilárd pacalpörköltje", "Kőbányai sör", "Kannás bor", "Dugóhúzó", "WC kefe", 
  "Szőrös hát", "Pattanás", "Körömgomba", "Vizkőoldó", "Placenta", "Fityma", "Anyajegy", 
  "Szemölcs", "Disznósajt", "Véres hurka", "Szotyi héj", "Egy marék szőr", "Lábvíz", 
  "Combközép", "Mellbimbó", "Végbélkúp", "Katéter", "Beöntés", "Szájpecek", "Bilincs",
  "Egy használt tampon", "Kávézacc", "Macskaalom", "Egy kiló parizer", "Zsíros kenyér",
  "Egy üveg Unicum", "Pálinkásüveg", "Gumicsizma", "Traktor gumi", "Műtrágya"
];

const LETTERS = "ABDEFGHKLMNPRSTVZ"; 
const getLetters = (count: number) => {
  let res = [];
  for(let i=0; i<count; i++) res.push(LETTERS[Math.floor(Math.random() * LETTERS.length)]);
  return res;
};

// Generátor
const generateTasks = () => {
  const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
  const getCeleb = () => getRandom(TRASH_CELEBS);
  const assocLetters = getLetters(3);
  
  return {
    t1: { text: getRandom(SITUATIONS).replace("{WHO}", `<span class="highlight">${getCeleb()}</span>`), letter: getLetters(1)[0] },
    t2: { text: getRandom(QUESTIONS), letter: getLetters(1)[0] },
    t3: { subject: getCeleb(), target: getCeleb() },
    t4: { topic: getRandom(ABSURD_WORDS), letters: assocLetters }
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
  const [myAnswers, setMyAnswers] = useState<any>({ t1: "", t2: "", t3_1: "", t3_2: "", t4_1: "", t4_2: "", t4_3: "" });
  const [votingData, setVotingData] = useState<any>(null);
  
  // Szavazás (4 külön slider érték)
  const [votes, setVotes] = useState<any>({ t1: 5, t2: 5, t3: 5, t4: 5 });

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
      setRoomId(id); setRole('HOST'); setPlayers([{ id: id, name: myName, score: 0, tasks: null, answers: null }]); setView('LOBBY');
    });
    newPeer.on('connection', (conn) => {
      connsRef.current.push(conn); conn.on('data', (data) => handleDataHost(conn, data));
    });
    if(peerRef.current) peerRef.current.destroy(); peerRef.current = newPeer;
  };

  const handleDataHost = (conn: any, data: any) => {
    if (data.type === 'JOIN') {
      setPlayers(prev => {
        const newList = [...prev, { id: conn.peer, name: data.name, score: 0, tasks: null, answers: null }];
        broadcast(newList, 'UPDATE_PLAYERS'); return newList;
      });
    }
    if (data.type === 'SUBMIT_ANSWERS') setPlayers(prev => prev.map(p => p.id === conn.peer ? { ...p, answers: data.answers } : p));
    if (data.type === 'SUBMIT_VOTE') addScoreToCurrent(data.scores);
  };

  const addScoreToCurrent = (scores: any) => {
    const total = parseInt(scores.t1) + parseInt(scores.t2) + parseInt(scores.t3) + parseInt(scores.t4);
    setPlayers(prev => { 
      const newList = [...prev]; 
      if(newList[votingIndex]) newList[votingIndex].score += total; 
      return newList; 
    });
  };

  const broadcast = (payload: any, type: string) => { connsRef.current.forEach(conn => conn.send({ type, payload })); };

  const startGameHost = () => {
    const updatedPlayers = players.map(p => ({ ...p, tasks: generateTasks(), answers: null }));
    setPlayers(updatedPlayers);
    connsRef.current.forEach(conn => {
      const pData = updatedPlayers.find(p => p.id === conn.peer); if (pData) conn.send({ type: 'START_GAME', tasks: pData.tasks });
    });
    const hostData = updatedPlayers.find(p => p.id === roomId); if(hostData) setMyTasks(hostData.tasks);
    setView('PLAYING'); setTimeLeft(180);
  };

  const joinRoom = () => {
    if (!joinCode || !myName) return alert("Név és Kód kell!");
    const conn = peerRef.current.connect(joinCode);
    conn.on('open', () => { setRole('CLIENT'); setRoomId(joinCode); conn.send({ type: 'JOIN', name: myName }); setView('LOBBY'); });
    conn.on('data', (data: any) => {
      if (data.type === 'UPDATE_PLAYERS') setPlayers(data.payload);
      if (data.type === 'START_GAME') { setMyTasks(data.tasks); setView('PLAYING'); setTimeLeft(180); }
      if (data.type === 'VOTE_PHASE') { setVotingData(data.targetPlayer); setView('VOTING'); setVotes({t1:5, t2:5, t3:5, t4:5}); }
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
      setTimeLeft(t => { if (t <= 1) { if (role === 'HOST') startVotingPhase(); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [view, role]);

  const submitMyAnswers = () => {
    if (role === 'HOST') { setPlayers(prev => prev.map(p => p.id === roomId ? { ...p, answers: myAnswers } : p)); setView('WAITING'); } 
    else { sendToHost('SUBMIT_ANSWERS', { answers: myAnswers }); setView('WAITING'); }
  };

  const startVotingPhase = () => { setVotingIndex(0); broadcastVoting(0); };

  const broadcastVoting = (index: number) => {
    if (index >= players.length) { broadcast({ players }, 'SHOW_LEADERBOARD'); setView('LEADERBOARD'); return; }
    
    const target = players[index]; 
    
    // HOSTNAK IS beállítjuk a nézetet (Ez hiányzott!)
    setVotingData(target); 
    setView('VOTING'); 
    setVotes({t1:5, t2:5, t3:5, t4:5}); 
    
    broadcast(target, 'VOTE_PHASE');
  };

  const submitVote = () => {
    if (role === 'HOST') { 
      addScoreToCurrent(votes); 
      const nextIdx = votingIndex + 1; 
      setVotingIndex(nextIdx); 
      setTimeout(() => broadcastVoting(nextIdx), 500); 
    } 
    else { 
      sendToHost('SUBMIT_VOTE', { scores: votes }); 
      setView('WAITING_NEXT_VOTE'); 
    }
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="app-layer">
        <div style={{position:'absolute', inset:0, zIndex:-1}}><Canvas><Scene3D /></Canvas></div>
        
        {/* MENU */}
        {view === 'MENU' && (
          <div className="menu">
            <h1 className="glitch-title">TRASH<br/>UNIVERSE</h1>
            <input className="cyber-input" style={{maxWidth:'350px'}} placeholder="NEVED" value={myName} onChange={e=>setMyName(e.target.value)} />
            <div className="btn-container"><button className="btn-action" onClick={createRoom}>ÚJ SZOBA</button></div>
            <p style={{margin:'20px', color:'#aaa'}}>VAGY</p>
            <input className="cyber-input" style={{maxWidth:'350px'}} placeholder="SZOBA KÓD" value={joinCode} onChange={e=>setJoinCode(e.target.value)} />
            <div className="btn-container"><button className="btn-action btn-secondary" onClick={joinRoom}>CSATLAKOZÁS</button></div>
          </div>
        )}

        {/* LOBBY */}
        {view === 'LOBBY' && (
          <div className="menu">
            <h1 className="glitch-title" style={{fontSize:'3rem'}}>LOBBY</h1>
            <div style={{color:'#aaa'}}>SZOBA KÓD:</div>
            <div className="room-code" style={{fontSize:'4rem'}}>{roomId}</div>
            <div className="lobby-list">{players.map(p => (<div key={p.id} className="player-pill" style={{background: p.id===myId?'#ff00de':'#333'}}>{p.name}</div>))}</div>
            {role === 'HOST' ? (<div className="btn-container"><button className="btn-action" onClick={startGameHost}>JÁTÉK INDÍTÁSA</button></div>) : (<p style={{marginTop:'40px', color:'#00f3ff', animation:'pulse 1s infinite'}}>A Host hamarosan indít...</p>)}
          </div>
        )}

        {/* GAME */}
        {view === 'PLAYING' && myTasks && (
          <div className="container">
            <div className="top-bar"><div style={{fontWeight:'bold', color:'#00f3ff'}}>{myName}</div><div className="room-code" style={{color: timeLeft<10?'red':'white'}}>{timeLeft}</div></div>
            
            <div className="glass-card"><div className="task-label">1. SZITUÁCIÓ (Egészítsd ki!)</div><div style={{marginBottom:'10px'}} dangerouslySetInnerHTML={{__html: myTasks.t1.text.replace("...", "_______")}} /><div style={{color:'#ffdd00', fontSize:'0.8rem', fontWeight:'bold'}}>KEZDŐBETŰ: {myTasks.t1.letter}</div><input className="cyber-input" placeholder="Írd be..." value={myAnswers.t1} onChange={e=>setMyAnswers({...myAnswers, t1: e.target.value})} /></div>
            
            <div className="glass-card"><div className="task-label">2. KÍN-PAD (Vallomás)</div><div style={{marginBottom:'10px'}}>{myTasks.t2.text}</div><div style={{color:'#ffdd00', fontSize:'0.8rem', fontWeight:'bold'}}>KEZDŐBETŰ: {myTasks.t2.letter}</div><input className="cyber-input" placeholder="Válasz..." value={myAnswers.t2} onChange={e=>setMyAnswers({...myAnswers, t2: e.target.value})} /></div>
            
            <div className="glass-card"><div className="task-label">3. SZTORIGYÁR (Alkoss mondatot!)</div><div className="story-row"><div className="celeb-static">{myTasks.t3.subject} ...</div><input className="cyber-input" style={{marginTop:0}} placeholder="mit csinált?" value={myAnswers.t3_1} onChange={e=>setMyAnswers({...myAnswers, t3_1: e.target.value})} /></div><div className="story-row"><div className="celeb-static">... {myTasks.t3.target}-vel/val,</div><input className="cyber-input" style={{marginTop:0}} placeholder="és mi történt a végén?" value={myAnswers.t3_2} onChange={e=>setMyAnswers({...myAnswers, t3_2: e.target.value})} /></div></div>
            
            <div className="glass-card">
               <div className="task-label">4. ASSZOCIÁCIÓ</div>
               <div style={{textAlign:'center', marginBottom:'15px'}}><div style={{color:'#aaa', fontSize:'0.9rem'}}>Mi jut eszedbe erről:</div><div className="celeb-static" style={{fontSize:'1.5rem', margin:'10px 0', color:'#ffdd00'}}>{myTasks.t4.topic}</div></div>
               <div className="assoc-row"><span className="assoc-letter">{myTasks.t4.letters[0]}</span> <input className="cyber-input" value={myAnswers.t4_1} onChange={e=>setMyAnswers({...myAnswers, t4_1: e.target.value})} /></div>
               <div className="assoc-row"><span className="assoc-letter">{myTasks.t4.letters[1]}</span> <input className="cyber-input" value={myAnswers.t4_2} onChange={e=>setMyAnswers({...myAnswers, t4_2: e.target.value})} /></div>
               <div className="assoc-row"><span className="assoc-letter">{myTasks.t4.letters[2]}</span> <input className="cyber-input" value={myAnswers.t4_3} onChange={e=>setMyAnswers({...myAnswers, t4_3: e.target.value})} /></div>
            </div>

            <div className="btn-container"><button className="btn-action" onClick={submitMyAnswers}>KÉSZ VAGYOK</button></div>
          </div>
        )}

        {view === 'WAITING' && (<div className="menu"><h2>VÁRJUK A TÖBBIEKET...</h2><div style={{fontSize:'3rem', margin:'20px'}}>⏳</div>{role === 'HOST' && <button className="btn-action btn-secondary" style={{width:'auto', position:'relative'}} onClick={startVotingPhase}>TOVÁBB (SKIP)</button>}</div>)}
        
        {view === 'WAITING_NEXT_VOTE' && (<div className="menu"><h2>KÖVETKEZŐ EMBER...</h2></div>)}

        {/* --- PONTOZÁS (4 SLIDER) --- */}
        {view === 'VOTING' && votingData && (
          <div className="container">
            <h2 style={{textAlign:'center', color:'#ff00de', marginBottom:'10px'}}>MOST PONTOZZUK:</h2><h1 style={{textAlign:'center', fontSize:'3rem', margin:0, color:'white', textShadow:'0 0 10px white'}}>{votingData.name}</h1>
            
            {/* T1 */}
            <div className="glass-card">
               <div className="task-label">1. SZITUÁCIÓ</div>
               <div style={{fontSize:'0.8rem', color:'#aaa'}} dangerouslySetInnerHTML={{__html: votingData.tasks?.t1.text}} />
               <div className="cyber-input" style={{background:'black', color:'#ffdd00', border:'none'}}>{votingData.answers?.t1 || "-"}</div>
               <div className="vote-slider-container">
                  <div className="vote-label"><span>VICCES?</span> <span className="score-badge">{votes.t1}</span></div>
                  <input type="range" min="1" max="10" value={votes.t1} onChange={e=>setVotes({...votes, t1: e.target.value})} />
               </div>
            </div>

            {/* T2 */}
            <div className="glass-card">
               <div className="task-label">2. KÍN-PAD</div>
               <div style={{fontSize:'0.8rem', color:'#aaa'}}>{votingData.tasks?.t2.text}</div>
               <div className="cyber-input" style={{background:'black', color:'#ffdd00', border:'none'}}>{votingData.answers?.t2 || "-"}</div>
               <div className="vote-slider-container">
                  <div className="vote-label"><span>VICCES?</span> <span className="score-badge">{votes.t2}</span></div>
                  <input type="range" min="1" max="10" value={votes.t2} onChange={e=>setVotes({...votes, t2: e.target.value})} />
               </div>
            </div>

            {/* T3 */}
            <div className="glass-card">
               <div className="task-label">3. SZTORI</div>
               <div style={{background:'black', padding:'15px', borderRadius:'8px', color:'#00f3ff', lineHeight:'1.5', fontSize:'1.2rem'}}>
                 <span style={{color:'#ff00de', fontWeight:'bold'}}>{votingData.tasks?.t3.subject}</span> {" "}{votingData.answers?.t3_1}{" "} <span style={{color:'#fff', fontWeight:'bold'}}>{votingData.tasks?.t3.target}-vel/val</span>, {" "}{votingData.answers?.t3_2}
               </div>
               <div className="vote-slider-container">
                  <div className="vote-label"><span>VICCES?</span> <span className="score-badge">{votes.t3}</span></div>
                  <input type="range" min="1" max="10" value={votes.t3} onChange={e=>setVotes({...votes, t3: e.target.value})} />
               </div>
            </div>

            {/* T4 */}
            <div className="glass-card">
               <div className="task-label">4. ASSZOCIÁCIÓ</div>
               <div style={{marginBottom:'10px', fontWeight:'bold'}}>{votingData.tasks?.t4.topic}:</div>
               <ul style={{listStyle:'none', padding:0}}>
                  <li style={{background:'black', padding:'10px', margin:'5px 0', borderLeft:'3px solid #ff00de'}}><span style={{color:'#ffdd00'}}>{votingData.tasks?.t4.letters[0]}</span> - {votingData.answers?.t4_1 || "-"}</li>
                  <li style={{background:'black', padding:'10px', margin:'5px 0', borderLeft:'3px solid #ff00de'}}><span style={{color:'#ffdd00'}}>{votingData.tasks?.t4.letters[1]}</span> - {votingData.answers?.t4_2 || "-"}</li>
                  <li style={{background:'black', padding:'10px', margin:'5px 0', borderLeft:'3px solid #ff00de'}}><span style={{color:'#ffdd00'}}>{votingData.tasks?.t4.letters[2]}</span> - {votingData.answers?.t4_3 || "-"}</li>
               </ul>
               <div className="vote-slider-container">
                  <div className="vote-label"><span>VICCES?</span> <span className="score-badge">{votes.t4}</span></div>
                  <input type="range" min="1" max="10" value={votes.t4} onChange={e=>setVotes({...votes, t4: e.target.value})} />
               </div>
            </div>

            <div className="btn-container"><button className="btn-action" onClick={submitVote}>SZAVAZATOK BEKÜLDÉSE</button></div>
          </div>
        )}

        {/* RESULTS */}
        {view === 'LEADERBOARD' && (
           <div className="container"><h1 className="glitch-title" style={{textAlign:'center'}}>EREDMÉNY</h1><div className="lobby-list" style={{flexDirection:'column'}}>{players.sort((a,b) => b.score - a.score).map((p, i) => (<div key={p.id} className="glass-card" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'15px'}}><div style={{fontSize:'1.5rem', fontWeight:'bold'}}>#{i+1} {p.name}</div><div style={{fontSize:'2rem', color:'#00f3ff'}}>{p.score}</div></div>))}</div>{role === 'HOST' && <div className="btn-container"><button className="btn-action" onClick={startGameHost}>ÚJ KÖR</button></div>}</div>
        )}
      </div>
    </>
  );
}