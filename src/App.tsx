import { useState, useEffect, useRef, useMemo } from 'react';
import Peer from 'peerjs';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. STÍLUSOK (DARK & DIRTY)
// ==========================================
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@500;700;900&display=swap');
  
  body { margin: 0; background: #000; overflow: hidden; font-family: 'Rajdhani', sans-serif; color: white; }
  .app-layer { position: absolute; inset: 0; display: flex; flex-direction: column; z-index: 10; overflow-y: auto; overflow-x: hidden; }
  
  .cyber-input { width: 100%; max-width: 400px; padding: 15px; background: rgba(0,0,0,0.9); border: 2px solid #ff0055; color: #ffdd00; font-family: 'Rajdhani'; font-size: 1.2rem; font-weight: bold; border-radius: 8px; text-align: center; outline: none; margin-top: 5px; box-sizing: border-box; transition: 0.3s; text-transform: uppercase; }
  .cyber-input:focus { border-color: #ffdd00; box-shadow: 0 0 20px rgba(255, 0, 85, 0.6); }
  
  .btn-container { width: 100%; display: flex; justify-content: center; padding: 20px; box-sizing: border-box; margin-top: 20px; padding-bottom: 50px; }
  .btn-action { width: 100%; max-width: 400px; padding: 20px; background: linear-gradient(90deg, #ff0055, #6600cc); color: white; font-family: 'Black Ops One'; font-size: 1.5rem; border: none; border-radius: 50px; cursor: pointer; text-transform: uppercase; box-shadow: 0 5px 30px rgba(255,0,85,0.4); text-shadow: 2px 2px 0 black; transition: all 0.2s; }
  .btn-action:active { transform: scale(0.95); }
  .btn-secondary { background: #222; color: white; border: 2px solid #555; box-shadow: none; font-size: 1.2rem; }
  
  .container { padding: 20px; max-width: 650px; margin: 0 auto; width: 100%; box-sizing: border-box; flex: 1; display: flex; flex-direction: column; }
  .glass-card { background: linear-gradient(135deg, rgba(20,5,5,0.95), rgba(10,5,20,0.95)); border: 1px solid rgba(255,0,85,0.3); border-radius: 16px; padding: 20px; margin-bottom: 25px; box-shadow: 0 10px 40px rgba(0,0,0,0.9); backdrop-filter: blur(10px); }
  
  .task-label { color: #ff0055; font-weight: 900; letter-spacing: 2px; margin-bottom: 12px; text-transform: uppercase; font-size: 0.9rem; border-bottom: 1px solid #333; padding-bottom: 5px; }
  .highlight { color: #ffdd00; font-weight: bold; text-decoration: underline; }
  
  .story-row { display: flex; flex-direction: column; gap: 5px; margin-bottom: 15px; }
  .celeb-static { color: #ff00de; font-weight: 900; font-size: 1.1rem; text-transform: uppercase; text-shadow: 0 0 10px #ff00de; }
  
  .assoc-row { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
  .assoc-letter { font-size: 1.8rem; font-weight: 900; color: #ff0055; min-width: 30px; text-align: center; }
  
  .top-bar { padding: 15px 20px; background: rgba(0,0,0,0.95); border-bottom: 2px solid #ff0055; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; }
  .menu { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 20px; box-sizing: border-box; }
  .glitch-title { font-size: 3.5rem; color: #fff; font-family: 'Black Ops One'; line-height: 0.9; margin-bottom: 30px; text-shadow: 3px 3px 0 #ff0055, -3px -3px 0 #6600cc; }
  
  .vote-slider-container { margin-top: 15px; background: rgba(0,0,0,0.6); padding: 15px; border-radius: 8px; border: 1px dashed #555; }
  .vote-label { font-size: 0.9rem; color: #aaa; display: flex; justify-content: space-between; margin-bottom: 5px; }
  input[type=range] { width: 100%; cursor: pointer; accent-color: #ff0055; height: 25px; }
  .score-badge { color: #ff0055; font-weight: bold; font-size: 1.5rem; }
  
  .lobby-list { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 30px; margin-bottom: 30px; }
  .player-pill { padding: 10px 20px; background: #333; border-radius: 30px; border: 1px solid #555; font-weight: bold; }
`;

// ==========================================
// 2. 3D HÁTTÉR
// ==========================================
function FloatingDebris() {
  const mesh = useRef<any>(null);
  const count = 50;
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
    mesh.current.rotation.y += 0.002;
  });
  
  return <instancedMesh ref={mesh} args={[undefined, undefined, count]}><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#ff0055" wireframe /></instancedMesh>;
}

function Scene3D() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 20]} />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#ff0055" />
      <pointLight position={[-10, -10, -10]} intensity={1.5} color="#4400aa" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}><FloatingDebris /></Float>
    </>
  );
}

// ==========================================
// 3. ADATBÁZIS (FULL TRASH)
// ==========================================
const TRASH_CELEBS = [
  "Tóth Gabi", "Alekosz", "Varga Irén", "Berki szelleme", "Kis Grófo", "Pumped Gabo", "MC Isti", "Bartos Cs.", 
  "Győzike", "Bea asszony", "Mandula Ádám", "PSG Ogli", "Baukó Éva", "Aurelio", "Szabyest", "Lakatos Brendon", 
  "Polgár Jenő", "G.w.M", "Tóth Andi", "Nagy Feró", "Korda Gyuri", "Majka", "Curtis", "Azahriah", "Cicciolina", 
  "Schobert Norbi", "Rubint Réka", "Orbán Viktor", "Gyurcsány", "Szájer József", "Németh Szilárd", "Soros György", 
  "Mészáros Lőrinc", "Deutsch Tamás", "Jakab Péter", "Egy bedrogozott BKV ellenőr", "A GLS futár", "Egy korrupt NAV ellenőr", 
  "A nőgyógyászod", "A szomszéd néni", "Egy kanos tinédzser", "Egy OnlyFans modell", "A sarki gyrosos", "Egy részeg pap", 
  "A postás", "A matektanárod", "A főnököd", "Egy taxis hiéna", "Zacher Gábor", "Csernus doki", "Dancsó Péter", 
  "VV Merci", "Köllő Babett", "Egy zacskó mákos guba", "A Sziget Fesztivál toi-toi wc-je", "Zámbó Jimmy", 
  "A Rezsidémon", "Egy kannásbor", "Szalacsi Sándor", "Vágó István szemüvege", "Matolcsy jobb szeme", "Kiszel Tünde naptára",
  "Egy használt óvszer", "A Magyar Forint", "Egy adag pacal", "Dopeman", "Fekete Pákó", "Kozso tincse"
];

const SITUATIONS = [
  "A Blaha Lujza téren {WHO} éppen ...-t csinál a szökőkútban.",
  "A Parlament közepén {WHO} ...-al keni be a meztelen testét.",
  "A ravatalozóban {WHO} véletlenül elejtett egy ...-t a koporsóba.",
  "{WHO} egy toi-toi vécében ...-t próbál lehúzni.",
  "A templomban {WHO} az oltárra helyezett egy ...-t.",
  "A szülői értekezleten {WHO} ...-t rajzolt a táblára.",
  "{WHO} részegen ...-t tetováltatott a homlokára.",
  "A szülőszobán {WHO} ...-t akart adni az újszülöttnek.",
  "A temetésen {WHO} ...-al dobálta meg a gyászolókat.",
  "Az éjféli misén {WHO} ...-t kiabált a papnak.",
  "{WHO} az OnlyFans oldalán ...-t dugott a fülébe.",
  "A Híradó élő adásában {WHO} ...-t ver a kamerának.",
  "A Való Világ villában {WHO} ...-t csempészett a seggében.",
  "{WHO} a Tinder profiljára egy ...-ról töltött fel képet.",
  "A Fókusz riportjában {WHO} bevallotta, hogy ...-t tart az ágya alatt.",
  "Egy kiszivárgott hangfelvételen {WHO} éppen ...-t kér a dealerétől.",
  "A MÁV vonaton {WHO} ...-t dobált az utasokra.",
  "A Lidl kasszájánál {WHO} ...-al akart fizetni.",
  "{WHO} a konditeremben ...-t emelgetett a f@szával.",
  "A NAV ellenőrzésen {WHO} ...-t húzott elő a zsebéből.",
  "Az állatkertben {WHO} ...-t próbált etetni a majmokkal.",
  "A bíróságon {WHO} ...-t vallott a bírónak.",
  "{WHO} egy swinger klubban ...-t használt síkosító helyett.",
  "Az orvosi rendelőben {WHO} ...-t vetetett ki a végbeléből.",
  "{WHO} a Sziget VIP-ben felszívott egy csík ...-t.",
  "Egy házibuliban {WHO} ...-t kevert a puncsba.",
  "{WHO} részegen azt hitte, hogy a ... egy mikrofon.",
  "A Balaton Soundon {WHO} ...-t csinált egy gumimatraccal.",
  "{WHO} a Pride felvonuláson ...-nak öltözött.",
  "Egy nyilvános WC-ben {WHO} ...-t írt a falra szarral.",
  "{WHO} a karácsonyi vacsorán ...-t tett a bejglibe."
];

const QUESTIONS = [
  "Maszturbálás közben véletlenül ezt kiabáltad:", "A proktológus benyúlt, ezt súgtad neki:", 
  "Ha rajtakapnak egy kecskével:", "Szex után ezt mondod mindig a párodnak:", 
  "Ha találkoznál az Ördöggel, ez lenne az első szavad:", "A bíróságon ezzel védekeznél a nemi erőszak vád ellen:", 
  "Ezt írnád a sírkövedre:", "Amikor megláttad a párod meztelenül, ez csúszott ki a szádon:", 
  "Ezt mondanád, ha Tóth Gabi megkérné a kezed:", "Mit mondasz, ha a futár meglátja a szexjátékodat:", 
  "Az utolsó szavaid a villamosszékben:", "Ezt kiabálod orgazmus közben:", 
  "Mit mondanál, ha Orbán Viktor meztelenül kopogna nálad:", "A Tinder bemutatkozásod ez lenne:", 
  "Ezt a nevet adnád a nemi szervednek:", "Ha egy napig az ellenkező nemű lennél:", 
  "Ezt mondanád a rendőrnek, ha hullát találna nálad:", "A legkínosabb dolog, amit a Google-ben kerestél:", 
  "Ezt suttognád Putyin fülébe:", "Ha kannibál lennél, melyik testrészt ennéd meg először:", 
  "A legrosszabb hely, ahova valaha hánytál:", "Ezt mondanád, ha a gyereked meglátna szex közben:", 
  "Ha választhatnál, kinek a bugyiját szagolnád meg:", "A legbetegebb fétised:", 
  "Ezt írnád az exednek részegen hajnali 3-kor:", "Mit tennél, ha kiderülne, hogy testvérek vagytok a pároddal:", 
  "Ezt mondanád, ha a nőgyógyászod a volt osztálytársad lenne:", "A legdurvább hely, ahol valaha szexeltél:", 
  "Mit csinálnál, ha láthatatlan lennél a női öltözőben:", "Ezt a mondatot tetováltatnád a fenekedre:", 
  "Ha a péniszed/melled tudna beszélni, mit mondana most:", "A legrosszabb dolog, amit részegen csináltál:", 
  "Kivel feküdnél le a jelenlévők közül pénzért:", "Ezt mondanád, ha Varga Irén duettet akarna veled:", 
  "Hova rejtenél el egy levágott fejet a lakásodban:", "Milyen szexuális segédeszközt vinnél magaddal egy lakatlan szigetre:", 
  "Mit mondanál, ha rajtakapnád a szüleidet szex közben:", "Melyik hírességet rugdosnád meg szívesen:", 
  "Ha a fingodnak illata lenne, milyen illatot választanál:", "Mit tennél, ha a kutyád elkezdene beszélni miközben vered:", 
  "A legundorítóbb dolog, amit valaha a szádba vettél:", "Ezt mondanád, ha véletlenül a főnöködnek küldenél meztelen képet:", 
  "Melyik testrészedet cserélnéd le egy lóéra:", "Mit csinálnál, ha egy napra te lennél Mészáros Lőrinc:", 
  "Ezt a nevet adnád a pornófilmednek:", "Mi a jelszava a titkos mappádnak a gépen:", 
  "Ha választani kell: anyád meghal vagy szexeltek egyet. Mit teszel:", "Ezt mondanád, ha kiderülne, hogy a papod az apád:"
];

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
// 4. JÁTÉK LOGIKA (KÖRBE-ÉRTÉKELÉS V7.0)
// ==========================================
export default function App() {
  const [view, setView] = useState('MENU');
  const [role, setRole] = useState<'HOST' | 'CLIENT' | null>(null);
  const [myId, setMyId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [myName, setMyName] = useState('');
  const [players, setPlayers] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [myTasks, setMyTasks] = useState<any>(null);
  
  const [myAnswers, setMyAnswers] = useState<any>({ t1: "", t2: "", t3_1: "", t3_2: "", t4_1: "", t4_2: "", t4_3: "" });
  
  // Szavazás (t1, t2, t3, t4 külön)
  const [votes, setVotes] = useState<any>({ t1: 5, t2: 5, t3: 5, t4: 5 });
  const [hasVoted, setHasVoted] = useState(false);

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

  // --- HOST FIGYELŐ (SZAVAZÁS START & VÉGE) ---
  useEffect(() => {
    if (role === 'HOST' && players.length > 0) {
        
        // 1. HA JÁTÉK VAN: Ellenőrizzük, mindenki beküldte-e a választ
        if (view === 'PLAYING' || view === 'WAITING') {
            const allAnswersIn = players.every(p => p.answers !== null);
            if (allAnswersIn) {
                console.log("VÁLASZOK BEÉRKEZTEK -> SZAVAZÁS INDUL");
                startSimultaneousVoting(players);
            }
        }

        // 2. HA SZAVAZÁS VAN: Ellenőrizzük, mindenki szavazott-e
        if (view === 'VOTING_WAIT') {
            const allVotesIn = players.every(p => p.voted === true);
            if (allVotesIn) {
                console.log("SZAVAZATOK BEÉRKEZTEK -> RANGLISTA");
                broadcast({ players }, 'SHOW_LEADERBOARD');
                setPlayers(players); // Host update
                setView('LEADERBOARD');
            }
        }
    }
  }, [players, role, view]);

  const createRoom = () => {
    if (!myName) return alert("Írj be egy nevet!");
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const newPeer = new Peer(code);
    newPeer.on('open', (id) => {
      setRoomId(id); setRole('HOST'); setPlayers([{ id: id, name: myName, score: 0, tasks: null, answers: null, voted: false }]); setView('LOBBY');
    });
    newPeer.on('connection', (conn) => {
      connsRef.current.push(conn); conn.on('data', (data) => handleDataHost(conn, data));
    });
    if(peerRef.current) peerRef.current.destroy(); peerRef.current = newPeer;
  };

  const handleDataHost = (conn: any, data: any) => {
    if (data.type === 'JOIN') {
      setPlayers(prev => {
        const newList = [...prev, { id: conn.peer, name: data.name, score: 0, tasks: null, answers: null, voted: false }];
        broadcast(newList, 'UPDATE_PLAYERS'); return newList;
      });
    }
    // Válaszok fogadása
    if (data.type === 'SUBMIT_ANSWERS') {
        setPlayers(prev => prev.map(p => p.id === conn.peer ? { ...p, answers: data.answers } : p));
    }
    // Szavazatok fogadása
    if (data.type === 'SUBMIT_VOTE') {
        setPlayers(prev => {
            const newList = [...prev];
            // 1. Megkeressük, kire szavazott
            const targetIndex = newList.findIndex(p => p.id === data.targetId);
            if(targetIndex !== -1) {
                const points = parseInt(data.scores.t1)+parseInt(data.scores.t2)+parseInt(data.scores.t3)+parseInt(data.scores.t4);
                newList[targetIndex].score += points;
            }
            // 2. Bejelöljük, hogy a szavazó végzett
            const voterIndex = newList.findIndex(p => p.id === conn.peer);
            if(voterIndex !== -1) newList[voterIndex].voted = true;
            
            return newList;
        });
    }
  };

  const broadcast = (payload: any, type: string) => { connsRef.current.forEach(conn => conn.send({ type, payload })); };

  // --- JÁTÉK INDÍTÁSA (RESET) ---
  const startGameHost = () => {
    // RESET MINDENKINEK
    const updatedPlayers = players.map(p => ({ 
        ...p, 
        tasks: generateTasks(), 
        answers: null,
        voted: false 
    }));
    
    setPlayers(updatedPlayers); 
    
    // Klienseknek
    connsRef.current.forEach(conn => {
      const pData = updatedPlayers.find(p => p.id === conn.peer); 
      if (pData) conn.send({ type: 'START_GAME', tasks: pData.tasks, allPlayers: updatedPlayers });
    });
    
    // Hostnak
    const hostData = updatedPlayers.find(p => p.id === roomId); 
    if(hostData) setMyTasks(hostData.tasks);
    
    setMyAnswers({ t1: "", t2: "", t3_1: "", t3_2: "", t4_1: "", t4_2: "", t4_3: "" }); 
    setHasVoted(false);
    setView('PLAYING'); 
    setTimeLeft(180);
  };

  const joinRoom = () => {
    if (!joinCode || !myName) return alert("Név és Kód kell!");
    const conn = peerRef.current.connect(joinCode);
    conn.on('open', () => { setRole('CLIENT'); setRoomId(joinCode); conn.send({ type: 'JOIN', name: myName }); setView('LOBBY'); });
    conn.on('data', (data: any) => {
      if (data.type === 'UPDATE_PLAYERS') setPlayers(data.payload);
      if (data.type === 'START_GAME') { 
          setPlayers(data.allPlayers); // Fontos a szinkron miatt
          setMyTasks(data.tasks); 
          setMyAnswers({ t1: "", t2: "", t3_1: "", t3_2: "", t4_1: "", t4_2: "", t4_3: "" }); 
          setHasVoted(false);
          setView('PLAYING'); 
          setTimeLeft(180); 
      }
      if (data.type === 'START_VOTE') { 
          setPlayers(data.players); // Friss játékos lista (válaszokkal)
          setView('VOTING'); 
          setVotes({t1:5, t2:5, t3:5, t4:5}); 
      }
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
      setTimeLeft(t => { if (t <= 1) { return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [view]);

  const submitMyAnswers = () => {
    if (role === 'HOST') { 
        setPlayers(prev => prev.map(p => p.id === roomId ? { ...p, answers: myAnswers } : p)); 
        setView('WAITING'); 
    } else { 
        sendToHost('SUBMIT_ANSWERS', { answers: myAnswers }); 
        setView('WAITING'); 
    }
  };

  // --- KÖRBE ÉRTÉKELÉS LOGIKA ---
  const startSimultaneousVoting = (currentPlayersList: any[]) => {
      broadcast({ players: currentPlayersList }, 'START_VOTE');
      setView('VOTING');
      setVotes({t1:5, t2:5, t3:5, t4:5}); 
  };

  // Kiszámoljuk, kire kell szavaznom (NEXT PLAYER)
  const getMyTarget = () => {
      if(players.length < 2) return null;
      // Sorba rendezzük ID alapján, hogy mindenkinél ugyanaz legyen a sorrend
      const sortedPlayers = [...players].sort((a,b) => a.id.localeCompare(b.id));
      const myIndex = sortedPlayers.findIndex(p => p.id === myId);
      if(myIndex === -1) return null;
      
      // A következő embert kapom (ha én vagyok az utolsó, akkor az elsőt)
      const targetIndex = (myIndex + 1) % sortedPlayers.length;
      return sortedPlayers[targetIndex];
  };

  const submitVote = () => {
    const target = getMyTarget();
    if(!target) return;

    if (role === 'HOST') { 
      // Host szavazata
      setPlayers(prev => {
          const newList = [...prev];
          const tIdx = newList.findIndex(p => p.id === target.id);
          if(tIdx !== -1) {
             const points = parseInt(votes.t1)+parseInt(votes.t2)+parseInt(votes.t3)+parseInt(votes.t4);
             newList[tIdx].score += points;
          }
          const hostIdx = newList.findIndex(p => p.id === myId);
          if(hostIdx !== -1) newList[hostIdx].voted = true;
          return newList;
      });
      setView('VOTING_WAIT'); // Host is vár
    } 
    else { 
      sendToHost('SUBMIT_VOTE', { targetId: target.id, scores: votes }); 
      setView('VOTING_WAIT'); 
    }
  };

  // Rendereléshez
  const targetPlayer = view === 'VOTING' ? getMyTarget() : null;

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
            <div className="lobby-list">{players.map(p => (<div key={p.id} className="player-pill" style={{background: p.id===myId?'#ff0055':'#333'}}>{p.name}</div>))}</div>
            {role === 'HOST' ? (<div className="btn-container"><button className="btn-action" onClick={startGameHost}>JÁTÉK INDÍTÁSA</button></div>) : (<p style={{marginTop:'40px', color:'#ff0055', animation:'pulse 1s infinite'}}>A Host hamarosan indít...</p>)}
          </div>
        )}

        {/* GAME */}
        {view === 'PLAYING' && (
          !myTasks ? <div className="menu"><h1>TÖLTÉS...</h1></div> : (
          <div className="container">
            <div className="top-bar"><div style={{fontWeight:'bold', color:'#ff0055'}}>{myName}</div><div className="room-code" style={{color: timeLeft<10?'red':'white'}}>{timeLeft}</div></div>
            <div className="glass-card"><div className="task-label">1. SZITUÁCIÓ (Egészítsd ki!)</div><div style={{marginBottom:'10px'}} dangerouslySetInnerHTML={{__html: myTasks.t1.text.replace("...", "_______")}} /><div style={{color:'#ffdd00', fontSize:'0.8rem', fontWeight:'bold'}}>KEZDŐBETŰ: {myTasks.t1.letter}</div><input className="cyber-input" placeholder="Írd be..." value={myAnswers.t1} onChange={e=>setMyAnswers({...myAnswers, t1: e.target.value})} /></div>
            <div className="glass-card"><div className="task-label">2. KÍN-PAD (Vallomás)</div><div style={{marginBottom:'10px'}}>{myTasks.t2.text}</div><div style={{color:'#ffdd00', fontSize:'0.8rem', fontWeight:'bold'}}>KEZDŐBETŰ: {myTasks.t2.letter}</div><input className="cyber-input" placeholder="Válasz..." value={myAnswers.t2} onChange={e=>setMyAnswers({...myAnswers, t2: e.target.value})} /></div>
            <div className="glass-card"><div className="task-label">3. SZTORIGYÁR (Alkoss mondatot!)</div><div className="story-row"><div className="celeb-static">{myTasks.t3.subject} ...</div><input className="cyber-input" style={{marginTop:0}} placeholder="mit csinált?" value={myAnswers.t3_1} onChange={e=>setMyAnswers({...myAnswers, t3_1: e.target.value})} /></div><div className="story-row"><div className="celeb-static">... {myTasks.t3.target}-vel/val,</div><input className="cyber-input" style={{marginTop:0}} placeholder="és mi történt a végén?" value={myAnswers.t3_2} onChange={e=>setMyAnswers({...myAnswers, t3_2: e.target.value})} /></div></div>
            <div className="glass-card"><div className="task-label">4. ASSZOCIÁCIÓ</div><div style={{textAlign:'center', marginBottom:'15px'}}><div style={{color:'#aaa', fontSize:'0.9rem'}}>Mi jut eszedbe erről:</div><div className="celeb-static" style={{fontSize:'1.5rem', margin:'10px 0', color:'#ffdd00'}}>{myTasks.t4.topic}</div></div><div className="assoc-row"><span className="assoc-letter">{myTasks.t4.letters[0]}</span> <input className="cyber-input" value={myAnswers.t4_1} onChange={e=>setMyAnswers({...myAnswers, t4_1: e.target.value})} /></div><div className="assoc-row"><span className="assoc-letter">{myTasks.t4.letters[1]}</span> <input className="cyber-input" value={myAnswers.t4_2} onChange={e=>setMyAnswers({...myAnswers, t4_2: e.target.value})} /></div><div className="assoc-row"><span className="assoc-letter">{myTasks.t4.letters[2]}</span> <input className="cyber-input" value={myAnswers.t4_3} onChange={e=>setMyAnswers({...myAnswers, t4_3: e.target.value})} /></div></div>
            <div className="btn-container"><button className="btn-action" onClick={submitMyAnswers}>KÉSZ VAGYOK</button></div>
          </div>
          )
        )}

        {view === 'WAITING' && (<div className="menu"><h2>VÁRJUK A TÖBBIEKET...</h2><div style={{color:'#ff0055', marginBottom:'20px'}}>{players.filter(p=>p.answers).length} / {players.length} játékos kész</div><div style={{fontSize:'3rem', margin:'20px'}}>⏳</div></div>)}
        
        {view === 'VOTING_WAIT' && (<div className="menu"><h2>VÁRJUK, HOGY MINDENKI SZAVAZZON...</h2><div style={{fontSize:'3rem', margin:'20px'}}>🗳️</div></div>)}

        {/* --- PONTOZÁS (PEER-TO-PEER) --- */}
        {view === 'VOTING' && targetPlayer && (
          <div className="container">
            <h2 style={{textAlign:'center', color:'#ff0055', marginBottom:'5px'}}>TE MOST ŐT ÉRTÉKELED:</h2>
            <h1 style={{textAlign:'center', fontSize:'3rem', margin:0, color:'white', textShadow:'0 0 10px white'}}>{targetPlayer.name}</h1>
            
            {/* T1 */}
            <div className="glass-card">
               <div className="task-label">1. SZITUÁCIÓ</div>
               <div style={{fontSize:'0.8rem', color:'#aaa'}} dangerouslySetInnerHTML={{__html: targetPlayer.tasks?.t1.text}} />
               <div className="cyber-input" style={{background:'black', color:'#ffdd00', border:'none'}}>{targetPlayer.answers?.t1 || "-"}</div>
               <div className="vote-slider-container"><div className="vote-label"><span>VICCES?</span> <span className="score-badge">{votes.t1}</span></div><input type="range" min="1" max="10" value={votes.t1} onChange={e=>setVotes({...votes, t1: e.target.value})} /></div>
            </div>

            {/* T2 */}
            <div className="glass-card">
               <div className="task-label">2. KÍN-PAD</div>
               <div style={{fontSize:'0.8rem', color:'#aaa'}}>{targetPlayer.tasks?.t2.text}</div>
               <div className="cyber-input" style={{background:'black', color:'#ffdd00', border:'none'}}>{targetPlayer.answers?.t2 || "-"}</div>
               <div className="vote-slider-container"><div className="vote-label"><span>VICCES?</span> <span className="score-badge">{votes.t2}</span></div><input type="range" min="1" max="10" value={votes.t2} onChange={e=>setVotes({...votes, t2: e.target.value})} /></div>
            </div>

            {/* T3 */}
            <div className="glass-card">
               <div className="task-label">3. SZTORI</div>
               <div style={{background:'black', padding:'15px', borderRadius:'8px', color:'#00f3ff', lineHeight:'1.5', fontSize:'1.2rem'}}>
                 <span style={{color:'#ff00de', fontWeight:'bold'}}>{targetPlayer.tasks?.t3.subject}</span> {" "}{targetPlayer.answers?.t3_1}{" "} <span style={{color:'#fff', fontWeight:'bold'}}>{targetPlayer.tasks?.t3.target}-vel/val</span>, {" "}{targetPlayer.answers?.t3_2}
               </div>
               <div className="vote-slider-container"><div className="vote-label"><span>VICCES?</span> <span className="score-badge">{votes.t3}</span></div><input type="range" min="1" max="10" value={votes.t3} onChange={e=>setVotes({...votes, t3: e.target.value})} /></div>
            </div>

            {/* T4 */}
            <div className="glass-card">
               <div className="task-label">4. ASSZOCIÁCIÓ</div>
               <div style={{marginBottom:'10px', fontWeight:'bold'}}>{targetPlayer.tasks?.t4.topic}:</div>
               <ul style={{listStyle:'none', padding:0}}>
                  <li style={{background:'black', padding:'10px', margin:'5px 0', borderLeft:'3px solid #ff00de'}}><span style={{color:'#ffdd00'}}>{targetPlayer.tasks?.t4.letters[0]}</span> - {targetPlayer.answers?.t4_1 || "-"}</li>
                  <li style={{background:'black', padding:'10px', margin:'5px 0', borderLeft:'3px solid #ff00de'}}><span style={{color:'#ffdd00'}}>{targetPlayer.tasks?.t4.letters[1]}</span> - {targetPlayer.answers?.t4_2 || "-"}</li>
                  <li style={{background:'black', padding:'10px', margin:'5px 0', borderLeft:'3px solid #ff00de'}}><span style={{color:'#ffdd00'}}>{targetPlayer.tasks?.t4.letters[2]}</span> - {targetPlayer.answers?.t4_3 || "-"}</li>
               </ul>
               <div className="vote-slider-container"><div className="vote-label"><span>VICCES?</span> <span className="score-badge">{votes.t4}</span></div><input type="range" min="1" max="10" value={votes.t4} onChange={e=>setVotes({...votes, t4: e.target.value})} /></div>
            </div>

            <div className="btn-container"><button className="btn-action" onClick={submitVote}>SZAVAZATOK BEKÜLDÉSE</button></div>
          </div>
        )}

        {/* BIZTONSÁGI VÁRAKOZÓ HA NINCS TARGET (pár percig lehet ilyen) */}
        {view === 'VOTING' && !targetPlayer && <div className="menu">TÖLTÉS...</div>}

        {/* RESULTS */}
        {view === 'LEADERBOARD' && (
           <div className="container"><h1 className="glitch-title" style={{textAlign:'center'}}>EREDMÉNY</h1><div className="lobby-list" style={{flexDirection:'column'}}>{players.sort((a,b) => b.score - a.score).map((p, i) => (<div key={p.id} className="glass-card" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'15px'}}><div style={{fontSize:'1.5rem', fontWeight:'bold'}}>#{i+1} {p.name}</div><div style={{fontSize:'2rem', color:'#00f3ff'}}>{p.score}</div></div>))}</div>{role === 'HOST' && <div className="btn-container"><button className="btn-action" onClick={startGameHost}>ÚJ KÖR</button></div>}</div>
        )}
      </div>
    </>
  );
}