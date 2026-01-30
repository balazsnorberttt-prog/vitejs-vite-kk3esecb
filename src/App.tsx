import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import * as THREE from 'three';

// === SZERVER KONFIGURÁCIÓ ===
const BACKEND_URL = "https://trash-backend.balazsnorberttt.workers.dev";

// ==========================================
// 1. GLOBÁLIS STÍLUSOK - OPTIMALIZÁLT & MOBIL BARÁT
// ==========================================
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@500;700;900&display=swap');
  
  * {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  
  body {
    margin: 0;
    padding: 0;
    background: #000;
    overflow: hidden;
    font-family: 'Rajdhani', sans-serif;
    color: white;
    height: 100vh;
    width: 100vw;
  }
  
  #root {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  
  .app-layer {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    z-index: 10;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }
  
  .container {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px 15px;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    flex-shrink: 0;
  }
  
  .cyber-input {
    width: 100%;
    padding: 16px;
    background: rgba(0, 0, 0, 0.85);
    border: 2px solid #ff00de;
    color: #ffdd00;
    font-family: 'Rajdhani', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    border-radius: 10px;
    text-align: center;
    outline: none;
    margin: 12px 0;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  .cyber-input:focus {
    border-color: #00f3ff;
    box-shadow: 0 0 25px rgba(0, 243, 255, 0.6);
    transform: translateY(-2px);
  }
  
  .btn-action {
    width: 100%;
    padding: 20px;
    background: linear-gradient(135deg, #ff00de 0%, #00f3ff 100%);
    background-size: 200% 200%;
    color: white;
    font-family: 'Black Ops One', cursive;
    font-size: 1.4rem;
    font-weight: 400;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    text-transform: uppercase;
    box-shadow: 0 6px 30px rgba(255, 0, 222, 0.5),
                0 0 20px rgba(0, 243, 255, 0.3);
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    margin: 15px 0;
    transition: all 0.25s ease;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }
  
  .btn-action::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: 0.5s;
  }
  
  .btn-action:hover::before {
    left: 100%;
  }
  
  .btn-action:active {
    transform: scale(0.95);
    box-shadow: 0 3px 15px rgba(255, 0, 222, 0.3);
  }
  
  .btn-secondary {
    background: linear-gradient(135deg, #333 0%, #111 100%);
    border: 2px solid #555;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
    font-size: 1.2rem;
  }
  
  .glass-card {
    background: rgba(15, 10, 25, 0.92);
    border: 1px solid rgba(255, 0, 222, 0.3);
    border-radius: 18px;
    padding: 22px;
    margin-bottom: 22px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.9),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(15px) saturate(180%);
    -webkit-backdrop-filter: blur(15px) saturate(180%);
  }
  
  .task-label {
    color: #00f3ff;
    font-weight: 900;
    letter-spacing: 3px;
    margin-bottom: 15px;
    text-transform: uppercase;
    font-size: 0.95rem;
    border-bottom: 2px solid rgba(255, 0, 222, 0.3);
    padding-bottom: 8px;
    text-shadow: 0 0 10px rgba(0, 243, 255, 0.5);
  }
  
  .celeb-badge {
    background: linear-gradient(135deg, #ff00de 0%, #cc00b3 100%);
    color: white;
    padding: 10px 16px;
    border-radius: 8px;
    font-weight: 900;
    font-size: 0.95rem;
    box-shadow: 0 0 15px rgba(255, 0, 222, 0.6),
                inset 0 1px 0 rgba(255, 255, 255, 0.3);
    text-transform: uppercase;
    display: inline-block;
    margin: 8px 0;
    letter-spacing: 1px;
  }
  
  .highlight {
    color: #ff00de;
    font-weight: 900;
    text-shadow: 0 0 15px rgba(255, 0, 222, 0.7);
    background: rgba(255, 0, 222, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
  }
  
  .player-pill {
    padding: 10px 18px;
    background: rgba(17, 17, 17, 0.9);
    border-radius: 25px;
    border: 1px solid #ff00de;
    font-weight: bold;
    margin: 6px;
    font-size: 0.95rem;
    box-shadow: 0 4px 10px rgba(255, 0, 222, 0.2);
    transition: all 0.3s ease;
  }
  
  .player-pill:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(255, 0, 222, 0.4);
  }
  
  .casting-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 15px;
  }
  
  .cast-btn {
    width: 100%;
    padding: 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(68, 68, 68, 0.8);
    color: #ccc;
    border-radius: 10px;
    cursor: pointer;
    font-weight: bold;
    font-size: 1rem;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  .cast-btn.selected {
    background: linear-gradient(135deg, #00f3ff 0%, #00a8cc 100%);
    color: black;
    border-color: #00f3ff;
    box-shadow: 0 0 25px rgba(0, 243, 255, 0.7);
    font-weight: 900;
    transform: scale(1.02);
  }
  
  .rating-box {
    margin-top: 20px;
    background: rgba(0, 0, 0, 0.7);
    padding: 20px;
    border-radius: 15px;
    border: 2px dashed #ff00de;
    box-shadow: 0 0 20px rgba(255, 0, 222, 0.2);
  }
  
  input[type="range"] {
    width: 100%;
    height: 35px;
    -webkit-appearance: none;
    appearance: none;
    background: linear-gradient(90deg, #ff00de, #00f3ff);
    border-radius: 10px;
    outline: none;
    margin: 15px 0;
    cursor: pointer;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 40px;
    height: 40px;
    background: white;
    border-radius: 50%;
    border: 3px solid #ff00de;
    box-shadow: 0 0 15px rgba(255, 0, 222, 0.8);
    cursor: pointer;
  }
  
  .top-bar {
    padding: 18px 20px;
    background: rgba(0, 0, 0, 0.95);
    border-bottom: 3px solid #ff00de;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 1000;
    box-shadow: 0 5px 30px rgba(0, 0, 0, 0.8);
  }
  
  .glitch-title {
    font-size: clamp(2.5rem, 8vw, 4rem);
    font-family: 'Black Ops One', cursive;
    line-height: 1;
    margin-bottom: 25px;
    text-align: center;
    text-transform: uppercase;
    animation: glitch 3s infinite;
    background: linear-gradient(45deg, #ff00de, #00f3ff, #ffdd00);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  @keyframes glitch {
    0%, 100% { transform: translate(0); }
    20% { transform: translate(-2px, 2px); }
    40% { transform: translate(-2px, -2px); }
    60% { transform: translate(2px, 2px); }
    80% { transform: translate(2px, -2px); }
  }
  
  @keyframes pulse {
    0% { opacity: 0.6; transform: scale(0.95); }
    50% { opacity: 1; transform: scale(1); }
    100% { opacity: 0.6; transform: scale(0.95); }
  }
  
  .waiting-anim {
    font-size: clamp(3rem, 10vw, 5rem);
    animation: pulse 2s infinite ease-in-out;
    text-align: center;
    margin: 30px 0;
    color: #00f3ff;
  }
  
  /* Mobile optimizations */
  @media (max-width: 768px) {
    .container {
      padding: 15px 12px;
    }
    
    .btn-action {
      padding: 18px;
      font-size: 1.3rem;
    }
    
    .glass-card {
      padding: 18px;
      margin-bottom: 18px;
    }
    
    .cyber-input {
      padding: 14px;
      font-size: 1rem;
    }
  }
  
  @media (max-height: 700px) {
    .container {
      padding: 12px 10px;
    }
    
    .glass-card {
      padding: 16px;
      margin-bottom: 16px;
    }
  }
`;

// ==========================================
// 2. 3D VISUALS - OPTIMALIZÁLT FLOATING DEBRIS
// ==========================================
function FloatingDebris() {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const count = 40; // Csökkentve a teljesítmény érdekében
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      pos: [(Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80],
      rotSpeed: Math.random() * 0.02,
      scale: 0.3 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2
    }));
  }, []);

  useFrame((state) => {
    if (!mesh.current) return;
    
    const time = state.clock.elapsedTime;
    
    particles.forEach((p, i) => {
      const offsetY = Math.sin(time * 0.5 + p.phase) * 2;
      dummy.position.set(p.pos[0], p.pos[1] + offsetY, p.pos[2]);
      dummy.rotation.x = time * p.rotSpeed;
      dummy.rotation.y = time * p.rotSpeed * 0.7;
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <octahedronGeometry args={[1.2, 0]} />
      <meshBasicMaterial 
        color="#ff00de" 
        wireframe 
        transparent 
        opacity={0.7}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

// ==========================================
// 3. ADATBÁZIS - BŐVÍTVE ÉS OPTIMALIZÁLVA
// ==========================================
const TRASH_CELEBS = [
  "Tóth Gabi", "Alekosz", "Varga Irén", "Berki szelleme", "Győzike",
  "Orbán Viktor", "Pumped Gabo", "PSG Ogli", "Zámbó Jimmy", "Kiszel Tünde",
  "G.w.M", "Szabyest", "Deutsch Tamás", "Varga Judit", "Lakatos Brendon",
  "Gyurcsány Ferenc", "Németh Szilárd", "Whisper Ton", "Bartos Cs. István",
  "Fekete Pákó", "Hajós András", "Szabó P. Szilveszter", "Csobot Adél",
  "Krasznai Cinti", "Kulka János", "Gálvölgyi János", "Nagy Feró","Cicciolina", "Kelemen Anna", "Molnár Anikó", "Hódi Pamela", "Nádai Anikó", "VV Fanni szelleme", "VV Cristofel", "VV Aurelio", "VV Béci", "Mandi szelleme", "Kovi", "Sanyi a hős szerelmes", "Tuvic Alexandra", "Kőgazdag Metta", "Kőgazdag Csabi", "Voksán Virág", "Dukai Regina", "Zimány Linda", "Bódi Sylvi", "Hargitai Bea", "Horváth Éva", "Sarka Kata", "Rogán Cecília", "Vajna Tímea", "Schobert Lara", "Gáspár Győző meztelenül", "Zámbó Árpy", "Fekete Pákó gumicsizmában", "Lakatos Márk", "Kajdi Csaba", "ByeAlex", "Manuel", "L.L. Junior OnlyFans verzió", "Pápai Joci", "Tóth Gabi matyó hímzéses tangában", "Varga Irén 'Mahiana Roszallo' ruhában", "PSG Ogli 7-es buszon", "Alekosz a görög félisten", "Pumped Gabo a kondiban", "Berki Krisztián vasalt herével", "Kiszel Tünde naptárdíva", "Zalatnay Cini börtönkosztümben", "Baukó Éva kapatos állapotban", "Sáfrány Emese", "Aleska Diamond", "VV Seherezádé", "VV Dyana", "G.w.M bőrkabátban és alsógatyában", "Szabyest sírva", "Whisper Ton selyemköntösben",
,"Damu Roland szelleme", "Molnár Krisztián", "Mc Isti", "Váradi Olasz", "Baukó Éva", "L.L. Junior", "Kozso", "Schobert Norbi", "Rubint Réka", "Zalatnay Cini", "Puzsér Róbert", "Majka", "Curtis", "Tóth Andi", "Marics Peti", "Valkusz Milán", "Azahriah", "Gáspár Bea", "Gáspár Evelin", "Zámbó Krisztián", "Bunyós Pityu", "Nótár Mary", "Kis Grófo", "Bódi Guszti", "Lagzi Lajcsi", "Galambos Lajos szelleme", "Ambrus Attila", "Repülős Gizi", "Stohl András", "Gesztesi Károly szelleme", "Hajdú Péter", "Sarka Kata", "Mészáros Lőrinc", "Várkonyi Andrea", "Dzsudzsák Balázs", "Szijjártó Péter", "Kósa Lajos", "Németh Sándor", "Papp Gergő Pimaszúr", "Sebestyén Balázs", "Istenes Bence", "Fluor Tomi", "Dopeman", "Ganxsta Zolee", "Havas Henrik", "Anettka", "Terry Black szelleme", "Zana József", "Paudits Béla", "Soma Mamagesa"
];

const SITUATION_TEMPLATES = [
  "A Blahán {WHO} éppen ...-t csinál a szökőkútban.",
  "A Parlamentben {WHO} ...-al keni be magát meztelenül az oltár előtt.",
  "A ravatalozóban {WHO} véletlenül elejtett egy ...-t a koporsóba.",
  "Az OnlyFans oldalán {WHO} éppen egy ...-t dugott a fülébe.",
  "A Híradóban bemondták, hogy {WHO} otthonában egy óriási ...-t találtak.",
  "A Sziget fesztiválon {WHO} a toi-toi vécéből ...-t dobált a tömegbe.",
  "A szaunában {WHO} egy szál ...-ban próbálta elcsábítani a recepcióst.",
  "A Lidl parkolóban {WHO} ...-t próbált eladni a kutyasétáltatóknak.",
  "A Való Világban {WHO} ...-t evett élő adásban a nézők előtt.",
  "A reptéren {WHO} ...-t próbált besmuggolni a farzsebében.",
  "A swingerszex közben {WHO} hirtelen előrántott egy ...-t.",
"A sötétszobában {WHO} véletlenül egy ...-t kezdett el kényeztetni.",
"Az ágy alatt rejtőzve {WHO} látta, ahogy a párja egy ...-al csalja meg.",
"A pornóforgatáson {WHO} kijelentette, hogy csak egy ...-al hajlandó folytatni.",
"A szexshopban {WHO} ...-t kért a próbakabinba.",
"A guminőben {WHO} egy elrejtett ...-t talált.",
"Az anális kényeztetés közben {WHO} hirtelen egy ...-t tüsszentett ki.",
"A vibrátorba {WHO} elem helyett egy ...-t próbált belegyömöszölni.",
"A nyilvános vécében {WHO} ...-al próbált dicsőség-lyukat (glory hole) fabrikálni.",
"A bondage közben {WHO} kötél helyett ...-al kötözte ki a partnerét.",
"A hármasszex közben {WHO} hirtelen elkezdett egy ...-t rágcsálni.",
"A masszázsolaj helyett {WHO} véletlenül ...-al kente be a golyóit.",
"A szado-mazo pincében {WHO} korbács helyett egy ...-al kapott ki.",
"Az orgia közepén {WHO} felállt és elindult egy ...-ért.",
"A hálószobában {WHO} jelmez helyett egy szál ...-ba öltözött.",
"A fétispartin {WHO} a legnépszerűbb vendég volt a ...-ával.",
"A síkosító helyett {WHO} ...-t használt, ami azonnal rákötött.",
"A golyóstoppoló közben {WHO} szájából egy ... került elő.",
"A peep-show-ban {WHO} a paraván mögött egy ...-t pörgetett.",
"A szexuális segédeszközök között {WHO} talált egy gyanús ...-t.",
"A maszturbálás hevében {WHO} leverte a ...-t az éjjeliszekrényről.",
"A sztriptíz közben {WHO} utolsó ruhadarabként egy ...-t vett le.",
"A kanapén {WHO} ...-al próbálta feldobni az előjátékot.",
"A kamionos pihenőben {WHO} ...-ért kínált szexuális szolgáltatást.",
"A webkamerás lány vécéjében {WHO} egy ...-t pillantott meg a háttérben.",
"A bilincs helyett {WHO} ...-al láncolta magát az ágyhoz.",
"A szerepjáték közben {WHO} hordárnak öltözve hozott egy ...-t.",
"A franciaágyban {WHO} és a partnere között egy ... feküdt.",
"A kézimunka közben {WHO} hirtelen egy ...-ra gondolt és elélvezett.",
"A szexuális felvilágosításon {WHO} ...-t mutatott be szemléltető eszközként.",
"A nudista strandon {WHO} egy ...-al takarta el a legnemesebb szervét.",
"A vágyfokozó kapszula helyett {WHO} egy ...-t nyelt le véletlenül.",
"A latex ruha alá {WHO} titokban egy ...-t rejtett el.",
"A kukkolás közben {WHO} látta, amint a szomszéd egy ...-al játszik.",
"A gumi óvszer helyett {WHO} ...-al próbált védekezni.",
"A telefonos szex közben {WHO} hirtelen horkolni kezdett egy ...-al a kezében.",
"A reggeli merevedését {WHO} egy ...-al próbálta lelohasztani.",
"A zuhany alatt {WHO} ...-al kényeztette magát.",
"A szexuális fantáziájában {WHO} egy óriási ...-al szerepelt.",
"A domina utasítására {WHO} meg kellett nyalnia egy ...-t.",
"A bordélyházban {WHO} az 'extra' szolgáltatásként ...-t kapott.",
"A nászéjszakán {WHO} hirtelen előszedett a bőröndből egy ...-t.",
"A kocsiban {WHO} szex közben véletlenül rákönyökölt a ...-ra.",
"A tangájába {WHO} hímzés helyett egy ...-t varratott.",
"A péniszpumpa helyett {WHO} ...-al próbálkozott, sikertelenül.",
"A szexuális étvágyát {WHO} csak egy ... tudta csillapítani.",
"A nedves póló versenyen {WHO} póló helyett egy ...-t viselt.",
"A hűtőmágnesekkel {WHO} ...-t formázott a partnerének.",
"A szexuális zaklatásért {WHO} egy ...-al ütötte le a támadóját.",
"A vágyai netovábbja {WHO} számára egy rózsaszín ... volt.",
"A templomi perselybe {WHO} éppen egy ...-t gyömöszöl bele.",
"A Tescós önkiszolgáló kasszánál {WHO} le akart húzni egy ...-t.",
"A tüdőszűrőn {WHO} ...-al a szájában jelent meg.",
"Az állatkertben {WHO} a kecskéknek ...-t mutogatott.",
"A békemeneten {WHO} egy óriási ...-t lóbált a magasba.",
"A luxusfeleségek partiján {WHO} ...-t szolgált fel tálcán.",
"A börtön látogatói szobájában {WHO} ...-t dugott át a rácson.",
"A nemzeti dohánybolt előtt {WHO} ...-t kéregetett a járókelőktől.",
"A jachton {WHO} ...-al kente be a lányok hátát.",
"A Hősök terén {WHO} egy szál ...-ban kezdett el jógázni.",
"A metrópótlón {WHO} ...-al próbált jegyet váltani.",
"A közgyűlésen {WHO} az asztal alatt egy ...-t simogatott.",
"A temetésen {WHO} halkan egy ...-t rejtett el a koszorúba.",
"A konditeremben {WHO} ...-al próbált guggolni.",
"A fogorvosnál {WHO} ...-t találtak a fülében.",
"A lottózóban {WHO} ...-al próbálta lekaparni a sorsjegyet.",
"A tévészékház előtt {WHO} ...-al fenyegette a biztonsági őrt.",
"A horgásztónál {WHO} csali helyett ...-t rakott a horogra.",
"A falunapon {WHO} ...-evő versenyt hirdetett.",
"A masszázsszalonban {WHO} kérte, hogy ...-al kenjék be a talpát.",
"A bíróságon {WHO} ...-al a kezében esküdött fel az igazmondásra.",
"A pszichiátrián {WHO} azt hitte, hogy ő egy ... .",
"A McDonald's vécéjében {WHO} éppen ...-t próbált elcserélni.",
"A panelház liftjében {WHO} ...-al ijesztgette a szomszéd nénit.",
"A buszmegállóban {WHO} ...-ból próbált jósolni.",
"A lángososnál {WHO} extrának ...-t kért a tetejére.",
"A szülői értekezleten {WHO} hirtelen előkapott egy ...-t.",
"A kaszinóban {WHO} az összes pénzét egy ...-ra tette fel.",
"A múzeumban {WHO} véletlenül rátüsszentett egy ...-t a festményre.",
"A postán {WHO} ...-t akart ajánlott levélként feladni.",
"A lomtalanításon {WHO} egy használt ...-t talált és megnyalta.",
"A kínaiban {WHO} ...-t talált a tavaszi tekercsében.",
"A fodrásznál {WHO} kérte, hogy ...-al mossák meg a haját.",
"A vadászaton {WHO} véletlenül egy ...-t lőtt le fácán helyett.",
"A kempingben {WHO} ...-al verte be a sátorcöveket.",
"A strandon {WHO} a víz alatt egy ...-t tapogatott.",
"A piacon {WHO} ...-t árult őstermelői kistermelőként.",
"A polgármesteri hivatalban {WHO} ...-al akarta megvesztegetni az ügyintézőt.",
"A diszkóban {WHO} a táncparkett közepén egy ...-t pörgetett.",
"A zálogházban {WHO} a nagyi ...-át akarta beváltani.",
"A gumiszervizben {WHO} téli gumi helyett ...-t akart felrakatni.",
"A kocsmában {WHO} ...-al fizetett a pálinkáért.",
"A cirkuszban {WHO} a bohóctól ellopott egy ...-t.",
"A wellnessben {WHO} a jakuzziba egy ...-t dobott bele.",
"A tanyán {WHO} a tyúkok elől elszaladt egy ...-al.",
"A reptéri ellenőrzésnél {WHO} cipőjéből egy ... került elő.",
"A villamoson {WHO} hangosan ...-ról kezdett prédikálni.",
"A szépségversenyen {WHO} ...-t mutatott be a tehetségkutató részben.",
"A barkácsboltban {WHO} ...-al akarta megjavítani a vécét.",
"A sarki fűszeresnél {WHO} ...-t kért a parizer mellé."
];

const QUESTIONS = [
  "Maszturbálás közben véletlenül ezt kiabáltad ki az ablakon:", 
  "A proktológus benyúlt, ezt súgtad oda neki halkan:", 
  "Ezt írnád a saját sírkövedre utolsó üzenetként:",
  "Mit mondanál, ha Orbán Viktor meztelenül kopogna nálad éjfélkor?",
  "Mit súgnál Putyin fülébe, ha te lennél a tolmácsa?",
  "Mit mondanál a gyerekednek, ha rajtakapna a kecskével?",
  "Mit válaszolnál, ha a mamád azt kérdezné: 'Miért vagy ilyen?'",
  "Mit csinálnál, ha az összes szomszédod meztelenül vacsorára hívna?",
  "Mit tennél, ha egy időgép visszavinné 1990-be és Hitlerrel kéne vacsoráznod?",
  "Mit vennél fel, ha a világ utolsó bulijára hívnának?",
  "Mit súgnál a fülembe szex közben, amitől azonnal elmenne a kedvem?",
"Milyen fétisedet titkolod még a saját anyád elől is?",
"Mit mondanál, ha rajtakapnának, hogy a szomszéd kutyájának OnlyFans oldalt csinálsz?",
"Mi volt a legbizarrabb tárgy, amit valaha feldugtál magadnak?",
"Mit válaszolnál, ha kiderülne, hogy a párod valójában egy szilikonbábu?",
"Mit súgnál egy vadidegennek a sötét moziban, miközben a sliccedet húzogatod?",
"Mit tennél, ha felébrednél és látnád, hogy PSG Ogli nyalja a talpadat?",
"Milyen nevet adnál a saját hímvessződnek/vunidnak, ha celeb lenne?",
"Mit mondanál a sürgősségin, amikor megkérdezik, hogy került oda az a flakon?",
"Mi lenne az utolsó kívánságod egy orgián, mielőtt elájulnál?",
"Mit tennél, ha kiderülne, hogy az összes szexvideód fent van a családi csoportban?",
"Mit súgnál a proktológusnak, ha izgalomba jönnél a vizsgálat alatt?",
"Mit mondanál, ha kiderülne, hogy a vibrátorod valójában egy kormányzati lehallgatókészülék?",
"Hány parizerért feküdnél le Alekosz-szal?",
"Mit válaszolnál, ha a párod azt kérné, öltözz be Varga Irénnek szex közben?",
"Mit súgnál a liftben egy idegennek: 'Tudod, mi van a nadrágomban?'",
"Mit tennél, ha a szexuális segédeszközöd hirtelen elkezdené Gyurcsány hangján mondani a beszédet?",
"Mit mondanál, ha rajtakapnának a parkban, amint egy fát próbálsz elcsábítani?",
"Melyik magyar celebbel élnél át egy édeshármast, ha az életed múlna rajta?",
"Mit súgnál a papnak a gyóntatószékben a maszturbációs szokásaidról?",
"Mit válaszolnál, ha megkérdeznék: 'Miért van rajtad csak egy bőrszíj a boltban?'",
"Mit tennél, ha kiderülne, hogy a lábképeidből gazdagodott meg a voltod?",
"Mit mondanál szex után, ami garantáltan véget vetne a kapcsolatnak?",
"Mit súgnál a masszőrnek, amikor eléri a 'boldog végkifejlet' pontot?",
"Mit válaszolnál, ha a gyereked megkérdezné: 'Miért sikoltozik anyu a hálószobában?'",
"Melyik testrészedet biztosítanád le 1 milliárd forintra és miért?",
"Mit mondanál a sztriptíztáncosnak, ha kiderülne, hogy ő az általános iskolai tanárod?",
"Milyen szexuális segédeszközt vinnél magaddal egy lakatlan szigetre?",
"Mit tennél, ha a guminőd/gumididid hirtelen életre kelne és enni kérne?",
"Mit mondanál a sürgősségin: 'Hát tudja doktor úr, én csak ráestem a...'",
"Melyik politikusnak küldenél titokban meztelen fotót?",
"Mit súgnál a szaunában a melletted ülőnek, miközben ránézel a lába közé?",
"Mit tennél, ha kiderülne, hogy a szomszédod webkamerás lány/fiú és te vagy a legnagyobb donora?",
"Milyen hangot adnál ki, ha elélveznél egy szelet rántott hústól?",
"Mit mondanál a menyasszonyodnak: 'Drágám, a nászéjszakán Alekosz is velünk alszik'?",
"Mit súgnál a buszon melletted ülőnek: 'Nincs rajtam alsónemű'?",
"Milyen tárgyat nem dugnál fel magadnak még 10 millió forintért sem?",
"Mit tennél, ha a telefonod élőben közvetítené az ágybeli teljesítményedet a mamádnak?",
"Mit mondanál, ha rajtakapnának a templomban, amint a gyóntatószékben maszturbálsz?",
"Mit súgnál a párod fülébe: 'Képzeld, ma Németh Szilárddal álmodtam szexi dolgokat'?",
"Hány centiméter az ideális, és miért pont 30?",
"Milyen illata van a vágyaidnak (trash kiadás)?",
"Mit válaszolnál, ha a Halál azt mondaná: 'Csak akkor élhetsz, ha lefekszel egy kecskével'?",
"Mit tennél, ha egy reggel arra ébrednél, hogy Whisper Ton nyalogatja a füledet?",
"Mit mondanál a rendőrnek: 'Biztos úr, ez nem egy dildó, ez egy sebváltó kar'?",
"Melyik hírességgel forgatnál szívesen egy filmet, de csak hátulról?",
"Mit súgnál a fülébe: 'Szeretem, ha parizer szagod van'?",
"Mit tennél, ha kiderülne, hogy a szüleid swingerszex közben fogantak meg téged?",
"Milyen szexuális fétised van, amihez szükséged van egy gumicsizmára és tejfölre?",
"Mit írnál a guminőd sírkövére?",
"Mit mondanál a rendőrnek, ha megállítana és egy hullát találna a csomagtartóban?",
"Mit súgnál a papnak a gyóntatószékben, hogy azonnal sokkot kapjon?",
"Mit válaszolnál a főnöködnek, ha rajtakapna, hogy az irodai nyomtatón a fenekedet fénymásolod?",
"Mit kiabálnál egy süllyedő hajón, miközben az utolsó mentőmellényt próbálod elvenni egy gyerektől?",
"Mit mondanál a volt szerelmednek, ha kiderülne, hogy a kutyájával csalt meg?",
"Mit válaszolnál az ENSZ közgyűlésén, ha megkérdeznék: 'Miért indítottál atomháborút?'",
"Mit tennél, ha felébrednél és látnád, hogy PSG Ogli tetoválta az arcodat éjszaka?",
"Mit mondanál a Mikulásnak, ha látnád, hogy a mamád ágyában fekszik?",
"Mit súgnál a liftben egy idegennek, közvetlenül azután, hogy elszellented magad?",
"Mit válaszolnál, ha a párod megkérdezné: 'Szerinted anyám vonzó?'",
"Mit tennél, ha kiderülne, hogy valójában Győzike eltitkolt gyereke vagy?",
"Mit mondanál, ha a vécécsésze hirtelen megszólalna: 'Ugye nem akarod ezt megint?'",
"Mit írnál egy Tinder profilba, ha csak sorozatgyilkosokat akarnál bevonzani?",
"Mit válaszolnál, ha a NAV ellenőr megkérdezné, miből van az aranyozott vécékeféd?",
"Mit súgnál a nagymamád fülébe a 90. születésnapján, amitől azonnal kitagadna?",
"Mit mondanál a Marslakóknak, hogy ne pusztítsák el a Földet, de te maradj életben?",
"Mit tennél, ha egy reggel arra ébrednél, hogy Orbán Viktor a kispárnád?",
"Mit válaszolnál, ha egy idegen megkérdezné az utcán: 'Megkóstolhatom a füledet?'",
"Mit kiabálnál a szaunában, amikor mindenki meztelen, hogy azonnal kiürüljön a terem?",
"Mit mondanál a tetoválóművésznek, ha véletlenül egy horogkeresztet rajzolt a homlokodra?",
"Mit tennél, ha kiderülne, hogy a kutyád valójában egy beépített ügynök?",
"Mit válaszolnál, ha a sarki zöldséges házassági ajánlatot tenne egy kiló rohadt krumpliért?",
"Mit mondanál a temetéseden, ha hirtelen felülnél a koporsóban?",
"Mit súgnál a proktológusnak, amikor már bent van az ujja?",
"Mit tennél, ha egy lakatlan szigeten kötnél ki Alekosz és egy hordó vazelin társaságában?",
"Mit mondanál a vizsgán, ha semmit nem tudsz, de le akarod fektetni a tanárt?",
"Mit válaszolnál, ha a gyereked megkérdezné: 'Apa, mi az a fétis?'",
"Mit tennél, ha egy varázsló átváltoztatna egy használt guminővé?",
"Mit mondanál a menyasszonyodnak az oltár előtt: 'Nem, mert valójában...'",
"Mit súgnál a jegyellenőrnek, ha nincs jegyed, de nagyon kell pisilned?",
"Mit válaszolnál, ha a sors azt mondaná: 'Mától te vagy Varga Irén hangszála'?",
"Mit tennél, ha találnál egy táska pénzt, de rá lenne írva: 'Lakatos Brendon uzsorapénze'?",
"Mit mondanál a tévében élő adásban, ha éppen a világbékéről kérdeznének?",
"Mit súgnál a buszon melletted alvó bácsi fülébe?",
"Mit tennél, ha kiderülne, hogy az internetedet a kormány figyeli és látták az OnlyFans előfizetésedet?",
"Mit válaszolnál, ha a halál kopogna és azt mondaná: 'Csak egy viccet kell mondanál, hogy életben maradj'?",
"Mit mondanál egy vegánnak, miközben egy nyers marhahúst harapsz ketté?",
"Mit tennél, ha a tükörképed hirtelen elkezdene nevetni rajtad?",
"Mit mondanál a kocsmában a legnagyobb darab embernek, hogy verekedés legyen?",
"Mit súgnál egy esküvőn a vőlegénynek: 'Tudom, mit csináltál a...'",
"Mit tennél, ha a telefonod elküldené az összes privát fotódat a főnöködnek?",
"Mit válaszolnál, ha a mamád megkérdezné: 'Fiam, miért van korbács az ágyad alatt?'",
"Mit mondanál a bankrablás közben, ha te lennél a túsz és élveznéd?",
"Mit súgnál a repülőn a melletted ülőnek felszálláskor: 'Ne aggódj, ez az első alkalom, hogy...'",
"Mit tennél, ha kiderülne, hogy a macskád valójában egy miniatűr ember jelmezben?",
"Mit mondanál, ha rajtakapnának a templomban, amint a szenteltvízben mosod a lábad?",
"Mit súgnál a fogorvosnak, miközben fúrja a fogad?",
"Mit tennél, ha egy napra te lennél a miniszterelnök?",
"Mit mondanál a gyerekednek, ha megkérdezné: 'Hogy készül a kisbaba?' (trash verzió)",
"Mit írnál a búcsúleveledbe, ha csak egy szitokszót használhatnál?"
];

const ROLES = [
  "Aki titokban lábképeket árul az interneten",
  "Aki titokban szerelmes Németh Szilárdba",
  "Akinek a böngészési előzményeiért börtön járna",
  "Aki biztosan sírva fakad szex közben",
  "Aki simán lefeküdne egy állattal pénzért",
  "Aki valószínűleg egy szekta tagja",
  "Aki otthon Tarzan módjára járkál",
  "Aki titokban rongyokat gyűjt",
  "Aki minden reggel a saját verítékével keni be a kenyert",
  "Aki megeszi a saját körmét és elteszi a fiókba",
  "Aki titokban lábképeket vesz Lakatos Brendontól",
"Aki szerint a szexuális felvilágosítás valójában oktatófilm",
"Aki titokban szerelmes Alekosz zoknijaiba",
"Aki szerint az OnlyFans előfizetés fontosabb, mint a lakbér",
"Aki otthon guminőkkel tart teapartit",
"Aki éjszaka lopakodik, hogy lefotózza a szomszéd tangáját a szárítón",
"Aki szerint a maszturbálás valójában spirituális tisztulás",
"Aki titokban kutyaruhában jár a hálószobában",
"Aki szerint a parizer illata vágyfokozó hatású",
"Aki otthon vibrátorokból épít magának karácsonyfát",
"Aki éjszaka dildókkal dobálja a kóbor macskákat",
"Aki szerint a szex közbeni sírás a legmagasabb szintű élvezet",
"Aki titokban szerelmes a vécécsészéjébe",
"Aki szerint a latex ruha valójában második bőr",
"Aki otthon használt óvszereket gyűjt egy albumba",
"Aki éjszaka az erdőben fákhoz dörgölőzik meztelenül",
"Aki szerint a közszeméremsértés valójában művészeti teljesítmény",
"Aki titokban Whisper Ton lábkrémeit használja síkosítónak",
"Aki szerint a herék vasalása alapvető higiénia",
"Aki otthon korbáccsal neveli a szobanövényeit",
"Aki éjszaka a sötétben dildó-kardozik a tükörképe ellen",
"Aki szerint a swingerszex valójában családi esemény",
"Aki titokban hisz abban, hogy a vibrátora beszél hozzá",
"Aki szerint a tanga viselése férfiként a szabadság szimbóluma",
"Aki otthon selyemkötéllel tanítja a macskáját a bondage-re",
"Aki éjszaka az utcán villant és várja a tapsot",
"Aki szerint a szexuális fétise valójában egy vallás",
"Aki titokban lábképeket árul magáról, de csak a kislábujját mutatja",
"Aki szerint a dildó valójában konyhai eszköz (pl. sodrófa)",
"Aki otthon meztelenül főz és várja a gázóra-leolvasót",
"Aki éjszaka pornográf rajzokat firkál a szomszéd kerítésére",
"Aki szerint a szex közbeni káromkodás valójában költészet",
"Aki titokban szerelmes egy szilikon dildóba, és elvitte moziba",
"Aki szerint a guminővel való házasság legális kellene, hogy legyen",
"Aki otthon minden este eljátssza a 'rossz kislány és a tanár bácsi' jelenetet a párnájával",
"Aki éjszaka lopakodik, hogy beleszagoljon a szomszéd szennyesébe",
"Aki szerint a síkosító valójában arcápoló krém",
"Aki titokban Whisper Ton videóira maszturbál",
"Aki szerint a herék borotválása az igazi bátorság jele",
"Aki otthon latex maszkban fogadja a futárt",
"Aki éjszaka a sötétben meztelenül táncol a Holdhoz imádkozva",
"Aki szerint a szexuális vágyát csak a parizer látványa tudja kielégíteni",
"Aki titokban gyűjti a használt fehérneműket az eBay-ről",
"Aki szerint a dildó-gyűjteménye valójában befektetés",
"Aki otthon minden este korbácsolja a plüssmaciját",
"Aki éjszaka lopakodik, hogy megnézze a szomszédot zuhanyozás közben",
"Aki szerint a szex közbeni fingás valójában az őszinteség jele",
"Aki titokban szerelmes Németh Szilárd pocakjába",
"Aki szerint az anális szex valójában méregtelenítés",
"Aki otthon a vibrátorát nevezi el a volt szerelmének",
"Aki titokban gyűjti a használt rágógumikat az asztal alól",
"Aki minden este beleszagol a szomszéd cipőjébe",
"Aki szerint a laposföld-hívők túl okosak",
"Aki titokban Berki Krisztián szellemével sakkozik",
"Aki elteszi a vágott körmét egy befőttesüvegbe",
"Aki szerint a vécépapír luxuscikk, ezért újságot használ",
"Aki éjszaka macskának képzeli magát és a tetőn nyávog",
"Aki titokban szerelmes a helyi plébánosba",
"Aki szerint a szappanozás a gyengék sportja",
"Aki minden reggel megméri a saját vizelete hőmérsékletét",
"Aki titokban lábméret-fetisiszta és a villamoson bámul",
"Aki szerint a fogmosás csak a kormány agymosása",
"Aki otthon egy szál bőrszíjban nézi a Barátok közt ismétlést",
"Aki elhiszi, hogy Varga Irén valójában egy világsztár",
"Aki titokban parizer-szobrokat farag a hűtőben",
"Aki szerint a zuhanyzás csak az eső elpazarlása",
"Aki minden héten ír egy szerelmes levelet Gyurcsánynak",
"Aki titokban visszajár a szomszéd kertjébe pisilni",
"Aki szerint a szemétgyűjtés valójában ingyen bevásárlás",
"Aki otthon zacskókból készít magának fehérneműt",
"Aki titokban a saját fülzsírjával keni a zsanérokat",
"Aki szerint a kutyatáp valójában ízletes csemege",
"Aki éjszaka lopakodik, hogy leolvassa mások vízóráját",
"Aki titokban Alekosz minden mondatát lejegyzeteli",
"Aki szerint a ruhamosás csak a ruha elvékonyítása",
"Aki minden családi ebédnél megpróbálja ellopni az ezüstkanalat",
"Aki titokban hisz a gyíkemberekben és a hűtőben alszik",
"Aki szerint a hónaljszag az igazi férfi parfüm",
"Aki otthon a falakat ketchuppal dekorálja",
"Aki titokban a munkahelyi kávégépbe sót rak",
"Aki szerint a zokni viselése a sátán műve",
"Aki minden reggel a tükör előtt Varga Irén dalokat énekel",
"Aki titokban gyűjti mások hajszálait a fodrásznál",
"Aki szerint a Nap valójában egy óriási lámpa",
"Aki otthon kartondobozokból épít magának várat",
"Aki titokban a sarki boltban megeszi a szőlőt fizetés nélkül",
"Aki szerint az oltásban valójában folyékony csipsz van",
"Aki minden este elmond egy imát a parizerhez",
"Aki titokban a liftbe fingik és megvárja, ki száll be",
"Aki szerint a kopaszság valójában aerodinamikai előny",
"Aki otthon a macskájával vitatja meg a világpolitikát",
"Aki titokban gyűjti a használt teafiltereket",
"Aki szerint a fogkrém valójában édes krém",
"Aki minden vasárnap meztelenül táncol a nappaliban",
"Aki titokban a szomszéd kutyáját tanítja káromkodni",
"Aki szerint a zöldségeknek is vannak érzéseik, ezért csak húst eszik",
"Aki otthon a saját szakállát fonja bele a pulóverébe",
"Aki titokban a buszon mindenkit elképzel meztelenül",
"Aki szerint a holdra szállás csak egy tévéstúdióban történt",
"Aki minden éjszaka elássa a hűtőben a maradékot"
];

const LETTERS = ["A", "B", "D", "E", "F", "G", "H", "K", "L", "M", "N", "P", "R", "S", "T", "V", "Z"];

// ==========================================
// 4. SEGÉDFÜGGVÉNYEK - OPTIMALIZÁLVA
// ==========================================
const getRandomItem = <T,>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

const generateTasks = () => {
  const getLetters = () => `${getRandomItem(LETTERS)} - ${getRandomItem(LETTERS)} - ${getRandomItem(LETTERS)}`;
  
  return {
    t1: { 
      text: getRandomItem(SITUATION_TEMPLATES).replace("{WHO}", `<span class="highlight">${getRandomItem(TRASH_CELEBS)}</span>`), 
      letters: getLetters() 
    },
    t2: { 
      text: getRandomItem(QUESTIONS), 
      letters: getLetters() 
    },
    t3: { 
      celebs: [getRandomItem(TRASH_CELEBS), getRandomItem(TRASH_CELEBS), getRandomItem(TRASH_CELEBS)] 
    },
    t4: { 
      role: getRandomItem(ROLES), 
      options: [getRandomItem(TRASH_CELEBS), getRandomItem(TRASH_CELEBS), getRandomItem(TRASH_CELEBS)] 
    }
  };
};

// ==========================================
// 5. FŐ KOMPONENS - TELJESEN ÚJRAÍRVA (JAVÍTOTT)
// ==========================================
export default function App() {
  // Állapotok
  const [view, setView] = useState<'MENU' | 'LOBBY' | 'PLAYING' | 'VOTING' | 'WAITING' | 'WAITING_VOTE' | 'LEADERBOARD'>('MENU');
  const [role, setRole] = useState<'HOST' | 'CLIENT' | null>(null);
  const [roomId, setRoomId] = useState('');
  const [myName, setMyName] = useState('');
  const [state, setState] = useState<any>(null);
  const [answers, setAnswers] = useState({
    t1: "",
    t2: "",
    t3_1: "",
    t3_2: "",
    t4: null as number | null
  });
  const [myVote, setMyVote] = useState(7);
  const [votingIndex, setVotingIndex] = useState(0);
  const [lastSync, setLastSync] = useState(0);

  // ==========================================
  // SZINKRONIZÁCIÓ - OPTIMALIZÁLVA (WebSocket szimuláció)
  // ==========================================
  useEffect(() => {
    if (!roomId || view === 'MENU') return;
    
    let mounted = true;
    let syncTimeout: number | undefined;
    
    const syncWithServer = async () => {
      if (!mounted) return;
      
      try {
        const now = Date.now();
        if (now - lastSync < 500) return; // Rate limiting
        
        const res = await fetch(`${BACKEND_URL}?roomId=${roomId}&t=${now}`);
        if (!res.ok) throw new Error('Szerver hiba');
        
        const data = await res.json();
        
        if (mounted && data && !data.error) {
          setState(data);
          setLastSync(now);
          
          // Nézet váltás, ha szükséges
          if (data.currentPhase && data.currentPhase !== view) {
            setView(data.currentPhase);
          }
          
          // Voting index frissítés
          if (data.votingIndex !== undefined && data.votingIndex !== votingIndex) {
            setVotingIndex(data.votingIndex);
          }
          
          // Válaszok reset, ha új kör kezdődik
          if (data.currentPhase === 'PLAYING' && data.players) {
            const myPlayer = data.players.find((p: any) => p.name === myName);
            if (myPlayer && !myPlayer.tasks && answers.t1 !== "") {
              setAnswers({ t1: "", t2: "", t3_1: "", t3_2: "", t4: null });
            }
          }
        }
      } catch (error) {
        console.error("Szinkronizációs hiba:", error);
      } finally {
        if (mounted) {
          syncTimeout = window.setTimeout(syncWithServer, view === 'VOTING' ? 800 : 1500);
        }
      }
    };
    
    syncWithServer();
    
    return () => {
      mounted = false;
      if (syncTimeout) clearTimeout(syncTimeout);
    };
  }, [roomId, view, lastSync, myName, answers, votingIndex]);

  // ==========================================
  // SZERVER KÖZLEMÉNYEK - OPTIMALIZÁLVA
  // ==========================================
  const postUpdate = useCallback(async (update: any) => {
    try {
      const payload = {
        ...update,
        timestamp: Date.now(),
        roomId: roomId
      };
      
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(payload)
      });
      
      return await response.json();
    } catch (error) {
      console.error("Update hiba:", error);
      throw error;
    }
  }, [roomId]);

  // ==========================================
  // ESEMÉNYKEZELŐK - JAVÍTVA
  // ==========================================
  const createRoom = async () => {
    if (!myName.trim()) {
      alert("Add meg a neved!");
      return;
    }
    
    const id = Math.floor(1000 + Math.random() * 9000).toString();
    const initData = {
      roomId: id,
      players: [{
        name: myName,
        score: 0,
        answers: null,
        tasks: null,
        ready: false,
        id: Date.now().toString()
      }],
      currentPhase: 'LOBBY',
      createdAt: Date.now()
    };
    
    setRoomId(id);
    setRole('HOST');
    
    try {
      await postUpdate(initData);
      setView('LOBBY');
    } catch (error) {
      alert("Hiba a szoba létrehozásakor!");
    }
  };

  const joinRoom = async () => {
    if (!roomId.trim() || !myName.trim()) {
      alert("Add meg a szoba kódot és a neved!");
      return;
    }
    
    try {
      const res = await fetch(`${BACKEND_URL}?roomId=${roomId}`);
      const data = await res.json();
      
      if (data.error || !data.players) {
        alert("Nem létező szoba!");
        return;
      }
      
      // Ellenőrizzük, hogy a név már foglalt-e
      if (data.players.some((p: any) => p.name === myName)) {
        alert("Ez a név már foglalt ebben a szobában!");
        return;
      }
      
      const newPlayer = {
        name: myName,
        score: 0,
        answers: null,
        tasks: null,
        ready: false,
        id: Date.now().toString()
      };
      
      const updatedPlayers = [...data.players, newPlayer];
      
      setRole('CLIENT');
      await postUpdate({ 
        players: updatedPlayers,
        roomId: roomId
      });
      
      setView('LOBBY');
    } catch (error) {
      alert("Hiba a csatlakozásnál!");
    }
  };

  const startRound = async () => {
    if (!state || role !== 'HOST') return;
    
    const updatedPlayers = state.players.map((player: any) => ({
      ...player,
      tasks: generateTasks(),
      answers: null,
      ready: false
    }));
    
    await postUpdate({
      players: updatedPlayers,
      currentPhase: 'PLAYING',
      votingIndex: 0,
      roundStarted: Date.now()
    });
  };

  const submitAnswers = async () => {
    if (!state || !myName) return;
    
    const updatedPlayers = state.players.map((player: any) => {
      if (player.name === myName) {
        return {
          ...player,
          answers: answers,
          ready: true,
          submittedAt: Date.now()
        };
      }
      return player;
    });
    
    const allReady = updatedPlayers.every((p: any) => p.ready);
    
    await postUpdate({
      players: updatedPlayers,
      currentPhase: allReady ? 'VOTING' : 'PLAYING',
      votingIndex: 0
    });
    
    setView('WAITING');
  };

  const submitVote = async () => {
    if (!state || votingIndex >= state.players.length) return;
    
    const targetPlayer = state.players[votingIndex];
    
    const updatedPlayers = state.players.map((player: any) => {
      const updated = { ...player };
      
      // Pont hozzáadása a cél játékoshoz
      if (player.name === targetPlayer.name) {
        updated.score = (updated.score || 0) + myVote;
      }
      
      // Ready állapot beállítása a szavazónak
      if (player.name === myName) {
        updated.ready = true;
      }
      
      return updated;
    });
    
    const allVoted = updatedPlayers.every((p: any) => p.ready);
    
    if (allVoted) {
      const nextIndex = votingIndex + 1;
      const isOver = nextIndex >= state.players.length;
      
      // Reset ready állapotok
      const resetPlayers = updatedPlayers.map((p: any) => ({
        ...p,
        ready: false
      }));
      
      await postUpdate({
        players: resetPlayers,
        currentPhase: isOver ? 'LEADERBOARD' : 'VOTING',
        votingIndex: isOver ? 0 : nextIndex
      });
      
      if (isOver) {
        setView('LEADERBOARD');
      } else {
        setVotingIndex(nextIndex);
        setMyVote(7);
        setView('VOTING');
      }
    } else {
      await postUpdate({
        players: updatedPlayers,
        currentPhase: 'VOTING',
        votingIndex: votingIndex
      });
      
      setView('WAITING_VOTE');
    }
  };

  const startNewRound = async () => {
    if (role !== 'HOST') return;
    
    const updatedPlayers = state.players.map((player: any) => ({
      ...player,
      tasks: generateTasks(),
      answers: null,
      ready: false
    }));
    
    await postUpdate({
      players: updatedPlayers,
      currentPhase: 'PLAYING',
      votingIndex: 0,
      roundNumber: (state.roundNumber || 0) + 1
    });
    
    setAnswers({ t1: "", t2: "", t3_1: "", t3_2: "", t4: null });
    setView('PLAYING');
  };

  // ==========================================
  // SZÁMÍTOTT ÉRTÉKEK
  // ==========================================
  const myPlayer = state?.players?.find((p: any) => p.name === myName);
  const targetPlayer = state?.players?.[votingIndex];
  const playersCount = state?.players?.length || 0;
  
  // ==========================================
  // RENDERELÉS
  // ==========================================
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      
      {/* 3D HÁTTÉR */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none'
      }}>
        <Canvas
          camera={{ position: [0, 0, 25], fov: 75 }}
          performance={{ min: 0.5 }}
          dpr={[1, 2]}
        >
          <color attach="background" args={['#000']} />
          <Stars radius={150} depth={60} count={4000} factor={4} saturation={0} fade speed={1} />
          <ambientLight intensity={0.4} />
          <pointLight position={[20, 20, 20]} color="#ff00de" intensity={1.5} />
          <pointLight position={[-20, -20, -20]} color="#00f3ff" intensity={1} />
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <FloatingDebris />
          </Float>
        </Canvas>
      </div>
      
      {/* FŐ ALKALMAZÁS */}
      <div className="app-layer">
        
        {/* MENÜ NÉZET */}
        {view === 'MENU' && (
          <div className="container" style={{ justifyContent: 'center', paddingTop: '40px' }}>
            <h1 className="glitch-title">TRASH<br />UNIVERSE</h1>
            
            <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
              <input
                className="cyber-input"
                placeholder="BEJELENTKEZÉSI NÉV"
                value={myName}
                onChange={(e) => setMyName(e.target.value.slice(0, 20))}
                maxLength={20}
                autoComplete="off"
              />
              
              <button 
                className="btn-action"
                onClick={createRoom}
                style={{ marginTop: '20px' }}
              >
                ÚJ JÁTÉK SZOBÁT NYIT
              </button>
              
              <div style={{
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #ff00de, #00f3ff, transparent)',
                margin: '25px 0',
                borderRadius: '1px'
              }} />
              
              <div style={{ textAlign: 'center', marginBottom: '15px', color: '#aaa', fontSize: '0.9rem' }}>
                VAGY CSATLAKOZZ MEGLÉVŐHEZ
              </div>
              
              <input
                className="cyber-input"
                placeholder="SZOBA KÓD (4 számjegy)"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                inputMode="numeric"
              />
              
              <button 
                className="btn-action btn-secondary"
                onClick={joinRoom}
              >
                CSATLAKOZÁS
              </button>
            </div>
            
            <div style={{
              textAlign: 'center',
              marginTop: '30px',
              color: '#666',
              fontSize: '0.8rem',
              padding: '0 20px'
            }}>
              A játék szerveren fut, nincs P2P késés. Max 8 játékos.
            </div>
          </div>
        )}
        
        {/* LOBBY NÉZET */}
        {view === 'LOBBY' && state && (
          <div className="container">
            <div className="top-bar">
              <div style={{ fontWeight: 'bold', color: '#ff00de' }}>
                {role === 'HOST' ? '⭐ HOST' : '👤 JÁTÉKOS'}
              </div>
              <div style={{ fontFamily: 'Black Ops One', letterSpacing: '2px' }}>
                SZOBA: <span style={{ color: '#00f3ff' }}>{roomId}</span>
              </div>
              <div style={{ color: '#aaa', fontSize: '0.9rem' }}>
                {playersCount} JÁTÉKOS
              </div>
            </div>
            
            <h1 className="glitch-title" style={{ fontSize: '2.8rem', marginTop: '10px' }}>
              VÁRAKOZÓ SZOBA
            </h1>
            
            <div className="glass-card">
              <div className="task-label">CSATLAKOZOTT JÁTÉKOSOK</div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '15px'
              }}>
                {state.players.map((player: any, index: number) => (
                  <div 
                    key={player.name || index} 
                    className="player-pill"
                    style={{
                      background: player.name === myName 
                        ? 'linear-gradient(135deg, #ff00de, #9900cc)' 
                        : undefined,
                      borderColor: player.name === myName ? '#ff00de' : '#555'
                    }}
                  >
                    {player.name} {player.name === myName && '(TE)'}
                  </div>
                ))}
              </div>
              
              {playersCount < 2 && (
                <div style={{
                  textAlign: 'center',
                  marginTop: '20px',
                  padding: '15px',
                  background: 'rgba(255, 0, 222, 0.1)',
                  borderRadius: '10px',
                  border: '1px dashed #ff00de'
                }}>
                  ⚠️ Várj még legalább {2 - playersCount} játékost a játék indításához!
                </div>
              )}
            </div>
            
            {role === 'HOST' && playersCount >= 2 && (
              <button 
                className="btn-action"
                onClick={startRound}
                style={{ marginTop: '10px' }}
              >
                JÁTÉK INDÍTÁSA ({playersCount} JÁTÉKOS)
              </button>
            )}
            
            {role === 'CLIENT' && (
              <div className="glass-card" style={{ textAlign: 'center' }}>
                <div className="waiting-anim" style={{ fontSize: '3rem' }}>⌛</div>
                <div style={{ color: '#00f3ff', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  VÁRJ A HOST JÁTÉK INDÍTÁSÁRA
                </div>
                <div style={{ color: '#888', marginTop: '10px' }}>
                  A játék automatikusan elindul, amint a host megnyomja a gombot
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* JÁTÉK NÉZET */}
        {view === 'PLAYING' && myPlayer?.tasks && (
          <div className="container">
            <div className="top-bar">
              <div style={{ fontWeight: 'bold', color: '#ffdd00' }}>
                {myName}
              </div>
              <div style={{ fontFamily: 'Black Ops One', letterSpacing: '1px' }}>
                KÓD: <span style={{ color: '#00f3ff' }}>{roomId}</span>
              </div>
              <div style={{ color: '#ff00de', fontSize: '0.9rem' }}>
                IDŐ: {Math.floor((Date.now() - (state?.roundStarted || Date.now())) / 1000)}s
              </div>
            </div>
            
            <div className="glass-card">
              <div className="task-label">
                1. SZITUÁCIÓ · BETŰK: <span style={{ color: '#ffdd00' }}>{myPlayer.tasks.t1.letters}</span>
              </div>
              <div 
                style={{ 
                  fontSize: '1.3rem', 
                  marginBottom: '20px',
                  lineHeight: '1.5',
                  padding: '10px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px'
                }} 
                dangerouslySetInnerHTML={{ __html: myPlayer.tasks.t1.text.replace("...", "_______") }}
              />
              <input
                className="cyber-input"
                placeholder="Írd ide a választ..."
                value={answers.t1}
                onChange={(e) => setAnswers({ ...answers, t1: e.target.value.slice(0, 100) })}
                maxLength={100}
              />
            </div>
            
            <div className="glass-card">
              <div className="task-label">
                2. KÍN-PAD · BETŰK: <span style={{ color: '#ffdd00' }}>{myPlayer.tasks.t2.letters}</span>
              </div>
              <div style={{ 
                fontSize: '1.3rem', 
                marginBottom: '20px',
                padding: '15px',
                background: 'rgba(255, 0, 222, 0.05)',
                borderLeft: '4px solid #ff00de',
                borderRadius: '5px'
              }}>
                {myPlayer.tasks.t2.text}
              </div>
              <input
                className="cyber-input"
                placeholder="Írd ide a vallomásod..."
                value={answers.t2}
                onChange={(e) => setAnswers({ ...answers, t2: e.target.value.slice(0, 100) })}
                maxLength={100}
              />
            </div>
            
            <div className="glass-card">
              <div className="task-label">3. SZTORILÁNC · KÖSD ÖSSZE!</div>
              
              <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', gap: '15px' }}>
                <div className="celeb-badge" style={{ width: '100%', textAlign: 'center' }}>
                  {myPlayer.tasks.t3.celebs[0]}
                </div>
                
                <div style={{ color: '#aaa', fontSize: '1.5rem' }}>↓</div>
                
                <input
                  className="cyber-input"
                  placeholder="Mit tett vele?"
                  value={answers.t3_1}
                  onChange={(e) => setAnswers({ ...answers, t3_1: e.target.value.slice(0, 80) })}
                  maxLength={80}
                />
                
                <div className="celeb-badge" style={{ 
                  background: 'linear-gradient(135deg, #00f3ff 0%, #0088aa 100%)', 
                  color: 'black',
                  width: '100%',
                  textAlign: 'center'
                }}>
                  {myPlayer.tasks.t3.celebs[1]}
                </div>
                
                <div style={{ color: '#aaa', fontSize: '1.5rem' }}>↓</div>
                
                <input
                  className="cyber-input"
                  placeholder="És aztán mi történt?"
                  value={answers.t3_2}
                  onChange={(e) => setAnswers({ ...answers, t3_2: e.target.value.slice(0, 80) })}
                  maxLength={80}
                />
                
                <div className="celeb-badge" style={{ 
                  background: 'linear-gradient(135deg, #ffdd00 0%, #ccaa00 100%)', 
                  color: 'black',
                  width: '100%',
                  textAlign: 'center'
                }}>
                  {myPlayer.tasks.t3.celebs[2]}
                </div>
              </div>
            </div>
            
            <div className="glass-card">
              <div className="task-label">
                4. CASTING: <span style={{ color: '#ff00de' }}>{myPlayer.tasks.t4.role}</span>
              </div>
              <div style={{ color: '#aaa', marginBottom: '15px', fontSize: '0.9rem' }}>
                Válaszd ki, hogy melyik celeb felel meg leginkább a szerepre:
              </div>
              
              <div className="casting-grid">
                {myPlayer.tasks.t4.options.map((option: string, index: number) => (
                  <button
                    key={index}
                    className={`cast-btn ${answers.t4 === index ? 'selected' : ''}`}
                    onClick={() => setAnswers({ ...answers, t4: index })}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              className="btn-action"
              onClick={submitAnswers}
              disabled={!answers.t1.trim() || !answers.t2.trim() || !answers.t3_1.trim() || !answers.t3_2.trim() || answers.t4 === null}
              style={{
                opacity: (!answers.t1.trim() || !answers.t2.trim() || !answers.t3_1.trim() || !answers.t3_2.trim() || answers.t4 === null) ? 0.6 : 1,
                marginTop: '10px',
                marginBottom: '30px'
              }}
            >
              {(!answers.t1.trim() || !answers.t2.trim() || !answers.t3_1.trim() || !answers.t3_2.trim() || answers.t4 === null) 
                ? 'TÖLTSD KI MINDEN MEZŐT!' 
                : 'KÉSZ VAGYOK! BEKÜLDÖM'}
            </button>
          </div>
        )}
        
        {/* SZAVAZÁS NÉZET */}
        {view === 'VOTING' && targetPlayer && (
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h1 style={{ 
                color: '#ff00de', 
                fontSize: 'clamp(2rem, 6vw, 3rem)',
                fontFamily: 'Black Ops One',
                textShadow: '0 0 20px rgba(255, 0, 222, 0.5)'
              }}>
                {targetPlayer.name}
              </h1>
              <div style={{ color: '#00f3ff', fontSize: '1.2rem' }}>
                {votingIndex + 1}. játékos ({votingIndex + 1}/{playersCount})
              </div>
            </div>
            
            <div className="glass-card">
              <div className="task-label">SZITUÁCIÓ VÁLASZA</div>
              <div style={{
                color: '#ffdd00',
                fontSize: '1.4rem',
                padding: '20px',
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '12px',
                border: '2px solid rgba(255, 221, 0, 0.3)',
                minHeight: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}>
                {targetPlayer.answers?.t1 || "❌ NEM VÁLASZOLT"}
              </div>
            </div>
            
            <div className="glass-card">
              <div className="task-label">VALLOMÁS</div>
              <div style={{
                color: '#00f3ff',
                fontSize: '1.3rem',
                padding: '20px',
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '12px',
                border: '2px solid rgba(0, 243, 255, 0.3)',
                minHeight: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}>
                {targetPlayer.answers?.t2 || "❌ NEM VÁLASZOLT"}
              </div>
            </div>
            
            {targetPlayer.name !== myName ? (
              <div className="rating-box">
                <div style={{
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '1.8rem',
                  marginBottom: '20px',
                  background: 'linear-gradient(45deg, #ff00de, #00f3ff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  TRASH SZINT: {myVote}/10
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: '#ff00de' }}>1 - SZAR</span>
                  <span style={{ color: '#00f3ff' }}>10 - LEGENDÁS</span>
                </div>
                
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={myVote}
                  onChange={(e) => setMyVote(parseInt(e.target.value))}
                />
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '5px',
                  fontSize: '0.9rem',
                  color: '#888'
                }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <span key={num}>{num}</span>
                  ))}
                </div>
                
                <button 
                  className="btn-action"
                  onClick={submitVote}
                  style={{ marginTop: '25px' }}
                >
                  SZAVAZOK! ({myVote} PONT)
                </button>
              </div>
            ) : (
              <div className="glass-card" style={{ textAlign: 'center', padding: '30px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>👑</div>
                <h2 style={{ color: '#ffdd00' }}>TE VAGY A SZEMÉTLÁDA!</h2>
                <p style={{ color: '#aaa', marginTop: '10px' }}>
                  Most a többiek téged pontoznak. Várakozás a szavazatokra...
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* VÁRAKOZÁS NÉZETEK */}
        {(view === 'WAITING' || view === 'WAITING_VOTE') && (
          <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div className="waiting-anim">
              {view === 'WAITING' ? '✍️' : '🗳️'}
            </div>
            
            <h1 style={{ 
              textAlign: 'center', 
              fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
              marginBottom: '15px',
              background: 'linear-gradient(45deg, #ff00de, #00f3ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {view === 'WAITING' ? 'VÁLASZOK FELDOLGOZÁSA...' : 'SZAVAZATOK ÖSSZESÍTÉSE...'}
            </h1>
            
            <div style={{
              textAlign: 'center',
              color: '#aaa',
              maxWidth: '400px',
              lineHeight: '1.6',
              padding: '0 20px'
            }}>
              {view === 'WAITING' 
                ? 'Várakozás a többi játékos válaszára. A játék automatikusan folytatódik, ha mindenki kész.'
                : 'Szavazatok feldolgozása. A következő játékosra váltás hamarosan...'}
            </div>
            
            <div style={{
              marginTop: '30px',
              width: '200px',
              height: '4px',
              background: 'linear-gradient(90deg, #ff00de, #00f3ff)',
              borderRadius: '2px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '60%',
                background: 'white',
                borderRadius: '2px',
                animation: 'pulse 1.5s infinite'
              }} />
            </div>
          </div>
        )}
        
        {/* EREDMÉNY NÉZET */}
        {view === 'LEADERBOARD' && state && (
          <div className="container">
            <h1 className="glitch-title" style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)' }}>
              TRASH<br />RANGLIGA
            </h1>
            
            <div className="glass-card">
              <div className="task-label">VÉGEREDMÉNY</div>
              
              {state.players
                .sort((a: any, b: any) => b.score - a.score)
                .map((player: any, index: number) => (
                  <div
                    key={player.name}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '18px 15px',
                      marginBottom: '15px',
                      background: player.name === myName
                        ? 'linear-gradient(90deg, rgba(255, 0, 222, 0.2), rgba(0, 243, 255, 0.1))'
                        : 'rgba(0, 0, 0, 0.3)',
                      border: player.name === myName
                        ? '2px solid #ff00de'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '15px',
                      boxShadow: index < 3 ? '0 8px 25px rgba(255, 0, 222, 0.3)' : 'none',
                      transform: index < 3 ? 'translateY(-5px)' : 'none',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: index === 0 
                          ? 'linear-gradient(135deg, #ffdd00, #ffaa00)'
                          : index === 1
                          ? 'linear-gradient(135deg, #c0c0c0, #999)'
                          : index === 2
                          ? 'linear-gradient(135deg, #cd7f32, #8b4513)'
                          : 'linear-gradient(135deg, #333, #111)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'Black Ops One',
                        fontSize: index < 3 ? '1.5rem' : '1.2rem',
                        color: index < 3 ? 'black' : 'white'
                      }}>
                        {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      
                      <div>
                        <div style={{
                          fontSize: '1.4rem',
                          fontWeight: 'bold',
                          color: player.name === myName ? '#ff00de' : 'white'
                        }}>
                          {player.name} {player.name === myName && <span style={{ fontSize: '0.8rem', color: '#00f3ff' }}>(TE)</span>}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#aaa' }}>
                          {player.score} trash pont
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      fontSize: '2.5rem',
                      fontFamily: 'Black Ops One',
                      color: index === 0 ? '#ffdd00' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#00f3ff'
                    }}>
                      {player.score}
                    </div>
                  </div>
                ))}
            </div>
            
            {role === 'HOST' && (
              <button
                className="btn-action"
                onClick={startNewRound}
                style={{ marginBottom: '15px' }}
              >
                ÚJ KÖR INDÍTÁSA
              </button>
            )}
            
            <button
              className="btn-action btn-secondary"
              onClick={() => {
                setView('MENU');
                setRoomId('');
                setRole(null);
                setState(null);
              }}
            >
              VISSZA A FŐKÉPERNYŐRE
            </button>
          </div>
        )}
      </div>
    </>
  );
}