import { useState, useEffect, useRef, useMemo } from 'react';
import Peer from 'peerjs';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. STÍLUSOK (MOBIL- ÉS NETLIFY-BARÁT)
// ==========================================
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@500;700;900&display=swap');
  
  body { margin: 0; background: #000; overflow: hidden; font-family: 'Rajdhani', sans-serif; color: white; }
  .app-layer { position: absolute; inset: 0; display: flex; flex-direction: column; z-index: 10; overflow-y: auto; overflow-x: hidden; }
  
  /* INPUTOK */
  .cyber-input {
    width: 100%; max-width: 400px; padding: 15px; background: rgba(0,0,0,0.7); border: 2px solid #444;
    color: #ffdd00; font-family: 'Rajdhani'; font-size: 1.2rem; font-weight: bold;
    border-radius: 8px; text-align: center; outline: none; margin-top: 10px; box-sizing: border-box;
    transition: 0.3s; text-transform: uppercase;
  }
  .cyber-input:focus { border-color: #ffdd00; box-shadow: 0 0 20px rgba(255, 221, 0, 0.4); background: rgba(0,0,0,0.9); }

  /* GOMBOK */
  .btn-container {
    width: 100%; display: flex; justify-content: center; padding: 20px; 
    box-sizing: border-box; margin-top: 20px;
  }

  .btn-action {
    width: 100%; max-width: 400px; padding: 20px; background: linear-gradient(90deg, #ff00de, #00f3ff); 
    color: white; font-family: 'Black Ops One'; font-size: 1.5rem; border: none; 
    border-radius: 50px; cursor: pointer; text-transform: uppercase; 
    box-shadow: 0 5px 30px rgba(0,0,0,0.5); text-shadow: 2px 2px 0 black;
    transition: all 0.2s;
  }
  .btn-action:active { transform: scale(0.95); }
  .btn-secondary { background: #333; color: white; border: 2px solid white; box-shadow: none; font-size: 1.2rem; }

  /* KÁRTYÁK */
  .container { 
    padding: 20px; max-width: 650px; margin: 0 auto; width: 100%; 
    box-sizing: border-box; flex: 1; display: flex; flex-direction: column; 
  }
  
  .glass-card {
    background: linear-gradient(135deg, rgba(20,20,30,0.9), rgba(10,10,20,0.8));
    border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px; margin-bottom: 25px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.7); position: relative; overflow: hidden; backdrop-filter: blur(10px);
  }
  .task-label { color: #00f3ff; font-weight: 900; letter-spacing: 2px; margin-bottom: 12px; text-transform: uppercase; font-size: 0.9rem; }
  .highlight { color: #ff00de; font-weight: bold; text-decoration: underline; }

  /* UI ELEMEK */
  .top-bar { padding: 15px 20px; background: rgba(0,0,0,0.85); border-bottom: 2px solid #ff00de; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; backdrop-filter: blur(10px); }
  .menu { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 20px; box-sizing: border-box; }
  .glitch-title { font-size: 3.5rem; color: #fff; font-family: 'Black Ops One'; line-height: 0.9; margin-bottom: 30px; text-shadow: 3px 3px 0 #ff00de, -3px -3px 0 #00f3ff; }
  
  .story-container { display: flex; flex-direction: column; gap: 10px; }
  .story-line { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .celeb-badge { background: #ff00de; color: white; padding: 8px 12px; border-radius: 6px; font-weight: 900; font-size: 0.9rem; white-space: nowrap; box-shadow: 0 0 10px #ff00de; text-transform: uppercase; }
  .connector { font-size: 0.9rem; color: #aaa; font-style: italic; }
  
  .casting-grid { display: flex; flex-direction: column; gap: 10px; margin-top: 15px; }
  .cast-btn { width: 100%; padding: 15px; background: rgba(255,255,255,0.05); border: 1px solid #444; color: #ccc; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1rem; transition: 0.2s; text-align: center; text-transform: uppercase; }
  .cast-btn.selected { background: #00f3ff; color: black; border-color: #00f3ff; box-shadow: 0 0 20px #00f3ff; transform: scale(1.02); font-weight: 900; }
  
  .rating-box { margin-top: 15px; background: rgba(0,0,0,0.4); padding: 10px; border-radius: 8px; border: 1px dashed #555; }
  input[type=range] { width: 100%; cursor: pointer; accent-color: #00f3ff; }
  .lobby-list { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 30px; margin-bottom: 30px; }
  .player-pill { padding: 10px 20px; background: #333; border-radius: 30px; border: 1px solid #555; font-weight: bold; }
`;

// ==========================================
// 2. 3D HÁTTÉR (WARP)
// ==========================================
function FloatingDebris() {
  const mesh = useRef<any>(null); // JAVÍTVA: Itt volt a hiba, a (null) kötelező!
  const count = 40;
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 60, y: (Math.random() - 0.5) * 60, z: (Math.random() - 0.5) * 60,
        rotSpeed: Math.random() * 0.02, scale: 0.5 + Math.random()
      });
    }
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

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#ff00de" wireframe />
    </instancedMesh>
  );
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
// 3. ÓRIÁS ADATBÁZIS (BŐVÍTETT)
// ==========================================
const TRASH_CELEBS = [
  "Tóth Gabi", "Nagy Alekosz", "Varga Irén", "Berki Krisztián szelleme", "Kis Grófo", 
  "Pumped Gabo", "MC Isti", "Bartos Cs. István", "Gáspár Laci", "Fekete Pákó", 
  "Győzike", "Gáspár Bea", "Zimány Linda", "Hajdú Péter", "Mandula Ádám", "PSG Ogli", 
  "Whisper Ton", "Baukó Éva", "Molnár Anikó", "Aurelio", "VV Cristofel", "Szabyest",
  "Lakatos Brendon", "Polgár Jenő", "Szalai Ádám", "Varga Viktor", "Kulcsár Edina", 
  "G.w.M", "Tóth Andi", "Nagy Feró", "Korda Gyuri bácsi", "Balázs Klári", "Csobot Adél", 
  "Istenes Bence", "Majka", "Curtis", "Azahriah", "Desh", "Dopeman", "Cicciolina", 
  "Schobert Norbi", "Rubint Réka", "Orbán Viktor", "Gyurcsány Ferenc", "Szájer József", 
  "Németh Szilárd", "Bayer Zsolt", "Soros György", "Mészáros Lőrinc", "Karácsony Gergely", 
  "Márki-Zay Péter", "Novák Katalin", "Varga Judit", "Deutsch Tamás", "Jakab Péter", 
  "Rákay Philip", "Bohár Dániel", "Trombitás Kristóf", "Egy bedrogozott BKV ellenőr", 
  "A GLS futár", "Egy korrupt NAV ellenőr", "A nőgyógyászod", "A szomszéd néni", 
  "Egy kanos tinédzser", "Egy OnlyFans modell", "A sarki gyrosos", "Egy részeg pap", 
  "A postás", "A matektanárod", "A főnököd", "Egy taxis hiéna", "Zacher Gábor", 
  "Csernus doki", "Dancsó Péter", "Fókuszcsoport Ádám", "Pottyondy Edina"
];

const SITUATION_TEMPLATES = [
  "A Blaha Lujza téren {WHO} éppen ...-t csinál a szökőkútban.",
  "{WHO} a 4-es 6-oson üvöltözve próbál eladni egy ...-t.",
  "A Parlament közepén {WHO} ...-al keni be a meztelen testét.",
  "A Hősök terén {WHO} egy ...-t áldozott fel a turulmadárnak.",
  "A Nyugati aluljáróban {WHO} ...-t cserélt egy doboz cigiért.",
  "A Margitszigeten {WHO} ...-t dobált a futók után.",
  "Az első randin {WHO} elővett egy ...-t a táskájából.",
  "A ravatalozóban {WHO} véletlenül elejtett egy ...-t.",
  "{WHO} egy toi-toi vécében ...-t próbál lehúzni.",
  "A templomban {WHO} az oltárra helyezett egy ...-t.",
  "A szülői értekezleten {WHO} ...-t rajzolt a táblára.",
  "{WHO} részegen ...-t tetováltatott a homlokára.",
  "A szülőszobán {WHO} ...-t akart adni az újszülöttnek.",
  "A temetésen {WHO} ...-al dobálta meg a gyászolókat.",
  "A szaunában {WHO} ...-al csapkodta az embereket.",
  "Az éjféli misén {WHO} ...-t kiabált a papnak.",
  "{WHO} az OnlyFans oldalán ...-t dugott a fülébe.",
  "A Híradó élő adásában {WHO} ...-t mutatott a kamerának.",
  "A Való Világ villában {WHO} ...-t csempészett a nyugiszobába.",
  "{WHO} a Tinder profiljára egy ...-ról töltött fel képet.",
  "A Fókusz riportjában {WHO} bevallotta, hogy ...-t tart az ágya alatt.",
  "Egy kiszivárgott hangfelvételen {WHO} éppen ...-t kér a dealerétől.",
  "A MÁV vonaton {WHO} ...-t dobált az utasokra.",
  "A Lidl kasszájánál {WHO} ...-al akart fizetni.",
  "{WHO} a konditeremben ...-t emelgetett súlyzó helyett.",
  "A NAV ellenőrzésen {WHO} ...-t húzott elő a zsebéből.",
  "Az állatkertben {WHO} ...-t próbált etetni a majmokkal.",
  "A BKV ellenőrnek {WHO} ...-t mutatott bérlet helyett.",
  "A bíróságon {WHO} ...-t vallott a bírónak.",
  "{WHO} egy swinger klubban ...-t használt síkosító helyett.",
  "Az orvosi rendelőben {WHO} ...-t vetetett ki a végbeléből.",
  "{WHO} a Sziget VIP-ben felszívott egy csík ...-t.",
  "Egy házibuliban {WHO} ...-t kevert a puncsba.",
  "{WHO} részegen azt hitte, hogy a ... egy mikrofon.",
  "A Balaton Soundon {WHO} ...-t csinált egy gumimatraccal.",
  "{WHO} a Pride felvonuláson ...-nak öltözött.",
  "Egy nyilvános WC-ben {WHO} ...-t írt a falra.",
  "{WHO} a karácsonyi vacsorán ...-t tett a bejglibe.",
  "A rendőrségi fogdában {WHO} ...-t rejtett el a zsebében."
];

const QUESTIONS = [
  "Maszturbálás közben véletlenül ezt kiabáltad:",
  "Amikor a proktológus benyúlt, ezt súgtad neki:",
  "Ezt mondanád, ha rajtakapnának egy kecskével:",
  "Szex után ezt mondod mindig a párodnak:",
  "Ha találkoznál Istennel, ez lenne az első szavad:",
  "A bíróságon ezzel védekeznél a gyilkosság után:",
  "Ezt írnád a sírkövedre:",
  "Amikor megláttad a párod meztelenül, ez csúszott ki a szádon:",
  "Ezt mondanád, ha Tóth Gabi megkérné a kezed:",
  "Mit mondasz, ha a futár meglátja a szexjátékodat:",
  "Az utolsó szavaid a villamosszékben:",
  "Ezt kiabálod orgazmus közben:",
  "Mit mondanál, ha Orbán Viktor meztelenül kopogna nálad:",
  "A Tinder bemutatkozásod ez lenne:",
  "Ezt a nevet adnád a nemi szervednek:",
  "Ha egy napig az ellenkező nemű lennél, ez lenne az első dolgod:",
  "Ezt mondanád a rendőrnek, ha hullát találna nálad:",
  "A legkínosabb dolog, amit a Google-ben kerestél:",
  "Ezt suttognád Putyin fülébe:",
  "Ha kannibál lennél, melyik testrészt ennéd meg először:",
  "A legrosszabb hely, ahova valaha hánytál:",
  "Ezt mondanád, ha a gyereked meglátna szex közben:",
  "Ha választhatnál, kinek a bugyiját szagolnád meg:",
  "A legbetegebb fétised, amit senki sem tud:",
  "Ezt írnád az exednek részegen hajnali 3-kor:",
  "Mit tennél, ha kiderülne, hogy testvérek vagytok a pároddal:",
  "Ezt mondanád, ha a nőgyógyászod a volt osztálytársad lenne:",
  "A legdurvább hely, ahol valaha szexeltél:",
  "Mit csinálnál, ha láthatatlan lennél a női öltözőben:",
  "Ezt a mondatot tetováltatnád a fenekedre:",
  "Ha a péniszed/melled tudna beszélni, mit mondana most:",
  "A legrosszabb dolog, amit részegen csináltál:",
  "Kivel feküdnél le a jelenlévők közül pénzért:",
  "Ezt mondanád, ha Varga Irén duettet akarna veled:",
  "Hova rejtenél el egy levágott fejet a lakásodban:",
  "Milyen szexuális segédeszközt vinnél magaddal egy lakatlan szigetre:",
  "Mit mondanál, ha rajtakapnád a szüleidet szex közben:",
  "Melyik hírességet rugdosnád meg szívesen:",
  "Ha a fingodnak illata lenne, milyen illatot választanál:",
  "Mit tennél, ha a kutyád elkezdene beszélni miközben vered:",
  "A legundorítóbb dolog, amit valaha a szádba vettél:",
  "Ezt mondanád, ha véletlenül a főnöködnek küldenél meztelen képet:",
  "Melyik testrészedet cserélnéd le egy lóéra:",
  "Mit csinálnál, ha egy napra te lennél Mészáros Lőrinc:",
  "Ezt a nevet adnád a pornófilmednek:",
  "Mi a jelszava a titkos mappádnak a gépen:",
  "Ha választani kell: anyád meghal vagy szexeltek egyet. Mit teszel:",
  "Ezt mondanád, ha kiderülne, hogy a papod az apád:"
];

const ROLES = [
  "Aki először halna meg egy zombiapokalipszisben", "Aki titokban lábképeket árul az interneten", "Akinek a legbüdösebb a lába",
  "Aki a saját anyját is eladná egy iPhone-ért", "Aki valószínűleg idegen lény, csak álcázza magát", "Aki titokban szerelmes Németh Szilárdba",
  "Aki biztosan börtönbe kerül 5 éven belül", "Akinek a böngészési előzményeiért börtön járna", "Aki részegen mindig sírva fakad",
  "Aki a legrosszabbul csókol", "Aki sosem mossa meg a kezét WC után", "Akire ráférne egy alapos pszichiátriai kezelés",
  "Aki titokban Fidesz-tagkönyvet tart a párnája alatt", "Aki elhinné, hogy a Föld lapos", "Aki képes lenne megenni egy nyers galambot",
  "Aki a saját fingját szagolgatja", "Aki valószínűleg szűzen hal meg", "Aki a legtöbb nemi betegséget hordozza",
  "Aki lopott már a Tescóból", "Aki simán lefeküdne egy állattal pénzért", "Aki szerint Varga Irén tehetséges",
  "Aki a zuhany alatt is zokniban fürdik", "Aki titokban a saját unokatestvérére izgul", "Aki biztosan volt már detoxikálóban",
  "Aki úgy néz ki, mint aki most szabadult", "Aki eladná a lelkét egy kis hírnévért", "Akinek a legkisebb az IQ-ja a társaságban",
  "Aki titokban női ruhákat hord otthon", "Aki mindig elfelejti lehúzni a WC-t", "Aki képes lenne megölni valakit egy parkolóhelyért",
  "Aki valószínűleg csatlakozna egy szektához", "Aki a legbénább az ágyban", "Aki még mindig az anyjával élne 40 évesen",
  "Aki biztosan sírva fakad szex közben", "Aki a legvalószínűbben lesz csöves", "Aki titokban plüssállatokkal beszélget"
];

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
// 4. JÁTÉK LOGIKA (HOST/CLIENT)
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
          <div className="menu">
            <h1 className="glitch-title">TRASH<br/>UNIVERSE</h1>
            <input className="cyber-input" style={{maxWidth:'350px'}} placeholder="NEVED" value={myName} onChange={e=>setMyName(e.target.value)} />
            <div className="btn-container">
               <button className="btn-action" onClick={createRoom}>ÚJ SZOBA</button>
            </div>
            <p style={{margin:'20px', color:'#aaa'}}>VAGY</p>
            <input className="cyber-input" style={{maxWidth:'350px'}} placeholder="SZOBA KÓD" value={joinCode} onChange={e=>setJoinCode(e.target.value)} />
            <div className="btn-container">
               <button className="btn-action btn-secondary" onClick={joinRoom}>CSATLAKOZÁS</button>
            </div>
          </div>
        )}

        {/* --- LOBBY --- */}
        {view === 'LOBBY' && (
          <div className="menu">
            <h1 className="glitch-title" style={{fontSize:'3rem'}}>LOBBY</h1>
            <div style={{color:'#aaa'}}>SZOBA KÓD:</div>
            <div className="room-code" style={{fontSize:'4rem'}}>{roomId}</div>
            
            <div className="lobby-list">
              {players.map(p => (
                <div key={p.id} className="player-pill" style={{background: p.id===myId?'#ff00de':'#333'}}>{p.name}</div>
              ))}
            </div>

            {role === 'HOST' ? (
              <div className="btn-container">
                 <button className="btn-action" onClick={startGameHost}>JÁTÉK INDÍTÁSA</button>
              </div>
            ) : (
              <p style={{marginTop:'40px', color:'#00f3ff', animation:'pulse 1s infinite'}}>A Host hamarosan indít...</p>
            )}
          </div>
        )}

        {/* --- JÁTÉK --- */}
        {view === 'PLAYING' && myTasks && (
          <div className="container">
            <div className="top-bar">
               <div style={{fontWeight:'bold', color:'#00f3ff'}}>{myName}</div>
               <div className="room-code" style={{color: timeLeft<10?'red':'white'}}>{timeLeft}</div>
            </div>

            <div className="glass-card">
              <div className="task-label">1. SZITUÁCIÓ (Egészítsd ki!)</div>
              <div style={{marginBottom:'10px'}} dangerouslySetInnerHTML={{__html: myTasks.t1.text.replace("...", "_______")}} />
              <div style={{color:'#ffdd00', fontSize:'0.8rem', fontWeight:'bold'}}>BETŰK: {myTasks.t1.letters}</div>
              <input className="cyber-input" placeholder="Írd be..." value={myAnswers.t1} onChange={e=>setMyAnswers({...myAnswers, t1: e.target.value})} />
            </div>

            <div className="glass-card">
              <div className="task-label">2. KÍN-PAD (Vallomás)</div>
              <div style={{marginBottom:'10px'}}>{myTasks.t2.text}</div>
              <div style={{color:'#ffdd00', fontSize:'0.8rem', fontWeight:'bold'}}>BETŰK: {myTasks.t2.letters}</div>
              <input className="cyber-input" placeholder="Válasz..." value={myAnswers.t2} onChange={e=>setMyAnswers({...myAnswers, t2: e.target.value})} />
            </div>

            <div className="glass-card">
              <div className="task-label">3. SZTORILÁNC (Kösd össze!)</div>
              <div className="story-container">
                 <div className="story-line">
                    <div className="celeb-badge">{myTasks.t3.celebs[0]}</div>
                    <span className="connector">...mit csinált vele?</span>
                 </div>
                 <input className="cyber-input" style={{marginTop:0}} placeholder="..." value={myAnswers.t3_1} onChange={e=>setMyAnswers({...myAnswers, t3_1: e.target.value})} />
                 
                 <div className="story-line">
                    <div className="celeb-badge" style={{background:'#00f3ff', color:'black'}}>{myTasks.t3.celebs[1]}</div>
                    <span className="connector">...erre ő mit reagált?</span>
                 </div>
                 <input className="cyber-input" style={{marginTop:0}} placeholder="..." value={myAnswers.t3_2} onChange={e=>setMyAnswers({...myAnswers, t3_2: e.target.value})} />
                 
                 <div className="celeb-badge" style={{background:'#ffdd00', color:'black', alignSelf:'flex-start'}}>{myTasks.t3.celebs[2]}</div>
              </div>
            </div>

            <div className="glass-card">
              <div className="task-label">4. CASTING (Kire illik?)</div>
              <div style={{marginBottom:'15px', fontStyle:'italic', fontSize:'1.1rem'}}>"{myTasks.t4.role}"</div>
              <div className="casting-grid">
                {myTasks.t4.options.map((opt: string, idx: number) => (
                  <div key={idx} 
                       className={`cast-btn ${myAnswers.t4 === idx ? 'selected' : ''}`}
                       onClick={() => setMyAnswers({...myAnswers, t4: idx})}>
                    {opt}
                  </div>
                ))}
              </div>
            </div>

            <div className="btn-container">
               <button className="btn-action" onClick={submitMyAnswers}>BEKÜLDÉS</button>
            </div>
          </div>
        )}

        {view === 'WAITING' && (
           <div className="menu">
             <h2>VÁRJUK A TÖBBIEKET...</h2>
             <div style={{fontSize:'3rem', margin:'20px'}}>⏳</div>
             {role === 'HOST' && <button className="btn-action btn-secondary" style={{width:'auto', position:'relative'}} onClick={startVotingPhase}>KÉNYSZERÍTÉS (SKIP)</button>}
           </div>
        )}

        {view === 'WAITING_NEXT_VOTE' && (
           <div className="menu"><h2>KÖVETKEZŐ EMBER...</h2></div>
        )}

        {view === 'VOTING' && votingData && (
          <div className="container">
            <h2 style={{textAlign:'center', color:'#ff00de', marginBottom:'10px'}}>MOST PONTOZZUK:</h2>
            <h1 style={{textAlign:'center', fontSize:'3rem', margin:0, color:'white', textShadow:'0 0 10px white'}}>{votingData.name}</h1>
            
            <div className="glass-card">
               <div className="task-label">1. SZITUÁCIÓ</div>
               <div style={{fontSize:'0.8rem', color:'#aaa'}} dangerouslySetInnerHTML={{__html: votingData.tasks?.t1.text}} />
               <div className="cyber-input" style={{background:'black', color:'#ffdd00', border:'none'}}>{votingData.answers?.t1 || "-(Nincs válasz)-"}</div>
            </div>

            <div className="glass-card">
               <div className="task-label">2. KÍN-PAD</div>
               <div style={{fontSize:'0.8rem', color:'#aaa'}}>{votingData.tasks?.t2.text}</div>
               <div className="cyber-input" style={{background:'black', color:'#ffdd00', border:'none'}}>{votingData.answers?.t2 || "-(Nincs válasz)-"}</div>
            </div>

            <div className="glass-card">
               <div className="task-label">3. SZTORI</div>
               <div style={{background:'black', padding:'15px', borderRadius:'8px', color:'#00f3ff', lineHeight:'1.5'}}>
                 <span style={{color:'#ff00de', fontWeight:'bold'}}>{votingData.tasks?.t3.celebs[0]}</span> 
                 {" -> "} {votingData.answers?.t3_1} {" -> "} 
                 <span style={{color:'#fff', fontWeight:'bold'}}>{votingData.tasks?.t3.celebs[1]}</span> 
                 {" -> "} {votingData.answers?.t3_2} {" -> "} 
                 <span style={{color:'#ffdd00', fontWeight:'bold'}}>{votingData.tasks?.t3.celebs[2]}</span>
               </div>
            </div>

            <div className="glass-card">
               <div className="task-label">4. VÁLASZTÁS</div>
               <div style={{fontSize:'0.9rem', color:'#aaa'}}>"{votingData.tasks?.t4.role}"</div>
               <div style={{marginTop:'10px', fontWeight:'bold', fontSize:'1.5rem', color:'#00f3ff', textAlign:'center'}}>
                  {votingData.answers?.t4 !== null ? votingData.tasks?.t4.options[votingData.answers?.t4] : "-"}
               </div>
            </div>

            <div className="rating-box" style={{background:'#220022', padding:'20px', marginBottom:'30px'}}>
               <div style={{textAlign:'center', marginBottom:'10px', fontWeight:'bold'}}>MENNYIRE TRASH? (1-10)</div>
               <input type="range" min="1" max="10" style={{width:'100%', accentColor:'#ff00de', height:'20px'}} value={myVote} onChange={e=>setMyVote(parseInt(e.target.value))} />
               <div style={{textAlign:'center', fontSize:'3rem', fontWeight:'bold', color:'#ff00de'}}>{myVote}</div>
            </div>

            <div className="btn-container">
               <button className="btn-action" onClick={submitVote}>SZAVAZOK!</button>
            </div>
          </div>
        )}

        {view === 'LEADERBOARD' && (
           <div className="container">
             <h1 className="glitch-title" style={{textAlign:'center'}}>EREDMÉNY</h1>
             <div className="lobby-list" style={{flexDirection:'column'}}>
                {players.sort((a,b) => b.score - a.score).map((p, i) => (
                  <div key={p.id} className="glass-card" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'15px'}}>
                     <div style={{fontSize:'1.5rem', fontWeight:'bold'}}>#{i+1} {p.name}</div>
                     <div style={{fontSize:'2rem', color:'#00f3ff'}}>{p.score}</div>
                  </div>
                ))}
             </div>
             {role === 'HOST' && 
                <div className="btn-container">
                   <button className="btn-action" onClick={startGameHost}>ÚJ KÖR</button>
                </div>
             }
           </div>
        )}

      </div>
    </>
  );
}