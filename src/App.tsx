// ============================================================================
// TRASH UNIVERSE - TELJES SZERVER-KÖZPONTÚ BACKEND
// ============================================================================

const TRASH_CELEBS = [
  "Tóth Gabi", "Alekosz", "Varga Irén", "Berki szelleme", "Győzike", 
  "Orbán Viktor", "Pumped Gabo", "PSG Ogli", "Zámbó Jimmy", "Kiszel Tünde", 
  "G.w.M", "Szabyest", "Deutsch Tamás", "Varga Judit", "Lakatos Brendon", 
  "Gyurcsány Ferenc", "Németh Szilárd", "Whisper Ton", "Bartos Cs. István", "Fekete Pákó"
];

const SITUATIONS = [
  "A Blahán {WHO} éppen ...-t csinál a szökőkútban.",
  "A Parlamentben {WHO} ...-al keni be magát meztelenül az oltár előtt.",
  "A ravatalozóban {WHO} véletlenül elejtett egy ...-t a koporsóba.",
  "Az OnlyFans oldalán {WHO} éppen egy ...-t dugott a fülébe.",
  "A Híradóban bemondták, hogy {WHO} otthonában egy óriási ...-t találtak.",
  "A Sziget fesztiválon {WHO} a toi-toi vécéből ...-t dobált a tömegbe."
];

const QUESTIONS = [
  "Maszturbálás közben véletlenül ezt kiabáltad ki az ablakon:", 
  "A proktológus benyúlt, ezt súgtad oda neki halkan:", 
  "Ezt írnád a saját sírkövedre utolsó üzenetként:",
  "Mit mondanál, ha Orbán Viktor meztelenül kopogna nálad éjfélkor?",
  "Mit súgnál Putyin fülébe, ha te lennél a tolmácsa?"
];

const TASK4_PROMPTS = [
  "Tóth Gabi kedvenc szexjátéka:",
  "Orbán Viktor titkos hobbija:",
  "Alekosz kedvenc étele:",
  "Mit tart Győzike a WC-ben:",
  "Pumped Gabo mit súg a tükörnek:",
  "Varga Irén mit csinál egyedül éjszaka:",
  "Mit súg Berki szelleme füledbe:",
  "PSG Ogli mit dugott a mikróba:",
  "Amit Kiszel Tünde soha nem mondana ki:",
  "Mit kerestek Németh Szilárd fürdőszobájában:"
];

const LETTERS = ["A", "B", "D", "E", "F", "G", "H", "K", "L", "M", "N", "P", "R", "S", "T", "V", "Z"];

// ============================================================================
// SEGÉDFÜGGVÉNYEK
// ============================================================================

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getLetters() {
  return `${rand(LETTERS)} - ${rand(LETTERS)} - ${rand(LETTERS)}`;
}

function generateTasks() {
  return {
    t1: { 
      text: rand(SITUATIONS).replace("{WHO}", rand(TRASH_CELEBS)), 
      letters: getLetters() 
    },
    t2: { 
      text: rand(QUESTIONS), 
      letters: getLetters() 
    },
    t3: { 
      celebs: [rand(TRASH_CELEBS), rand(TRASH_CELEBS), rand(TRASH_CELEBS)] 
    },
    t4: { 
      prompt: rand(TASK4_PROMPTS), 
      letters: getLetters() 
    }
  };
}

function getVotingPlayers(players) {
  if (players.length <= 6) return players;
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 6);
}

function generateRoomId() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// ============================================================================
// FŐ HANDLER
// ============================================================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    const headers = { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", 
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    // KV storage ellenőrzés
    if (!env.TRASH_STORAGE) {
      return new Response(JSON.stringify({
        error: "KV storage nincs konfigurálva"
      }), { status: 500, headers });
    }

    try {
      // ========================================================================
      // HEALTH CHECK
      // ========================================================================
      if (path === "/" && request.method === "GET") {
        return new Response(JSON.stringify({
          status: "online",
          service: "Trash Universe Backend",
          version: "3.0",
          timestamp: new Date().toISOString()
        }), { status: 200, headers });
      }

      // ========================================================================
      // 1. SZOBA LÉTREHOZÁSA
      // ========================================================================
      if (path === "/create-room" && request.method === "POST") {
        const { playerName } = await request.json();
        
        if (!playerName || playerName.trim().length < 2) {
          return new Response(JSON.stringify({
            error: "Érvénytelen játékos név"
          }), { status: 400, headers });
        }

        const roomId = generateRoomId();
        
        const roomData = {
          roomId,
          players: [{
            name: playerName.trim(),
            isHost: true,
            ready: false,
            score: 0,
            tasks: null,
            answers: null,
            lastSeen: Date.now()
          }],
          currentPhase: "LOBBY",
          currentRound: 0,
          totalRounds: 3,
          votingIndex: 0,
          votingPlayers: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        await env.TRASH_STORAGE.put(
          roomId, 
          JSON.stringify(roomData),
          { expirationTtl: 7200 }
        );

        return new Response(JSON.stringify({
          success: true,
          roomId,
          roomData
        }), { status: 200, headers });
      }

      // ========================================================================
      // 2. CSATLAKOZÁS SZOBÁHOZ
      // ========================================================================
      if (path === "/join-room" && request.method === "POST") {
        const { roomId, playerName } = await request.json();
        
        if (!roomId || !playerName) {
          return new Response(JSON.stringify({
            error: "RoomId és playerName kötelező"
          }), { status: 400, headers });
        }

        const rawData = await env.TRASH_STORAGE.get(roomId);
        
        if (!rawData) {
          return new Response(JSON.stringify({
            error: "Szoba nem található"
          }), { status: 404, headers });
        }

        const roomData = JSON.parse(rawData);

        // Név ellenőrzés
        const existingPlayer = roomData.players.find(p => p.name === playerName.trim());
        
        if (existingPlayer) {
          // Reconnect
          existingPlayer.lastSeen = Date.now();
        } else {
          // Új játékos
          if (roomData.players.length >= 10) {
            return new Response(JSON.stringify({
              error: "A szoba megtelt (max 10 játékos)"
            }), { status: 400, headers });
          }

          roomData.players.push({
            name: playerName.trim(),
            isHost: false,
            ready: false,
            score: 0,
            tasks: null,
            answers: null,
            lastSeen: Date.now()
          });
        }

        roomData.updatedAt = Date.now();

        await env.TRASH_STORAGE.put(
          roomId, 
          JSON.stringify(roomData),
          { expirationTtl: 7200 }
        );

        return new Response(JSON.stringify({
          success: true,
          roomData
        }), { status: 200, headers });
      }

      // ========================================================================
      // 3. SZOBA ÁLLAPOT LEKÉRÉSE
      // ========================================================================
      if (path === "/get-room" && request.method === "GET") {
        const roomId = url.searchParams.get("roomId");
        const playerName = url.searchParams.get("playerName");
        
        if (!roomId) {
          return new Response(JSON.stringify({
            error: "RoomId kötelező"
          }), { status: 400, headers });
        }

        const rawData = await env.TRASH_STORAGE.get(roomId);
        
        if (!rawData) {
          return new Response(JSON.stringify({
            error: "Szoba nem található"
          }), { status: 404, headers });
        }

        const roomData = JSON.parse(rawData);

        // LastSeen frissítés
        if (playerName) {
          const player = roomData.players.find(p => p.name === playerName);
          if (player) {
            player.lastSeen = Date.now();
            roomData.updatedAt = Date.now();
            
            await env.TRASH_STORAGE.put(
              roomId, 
              JSON.stringify(roomData),
              { expirationTtl: 7200 }
            );
          }
        }

        return new Response(JSON.stringify({
          success: true,
          roomData
        }), { status: 200, headers });
      }

      // ========================================================================
      // 4. KÖR INDÍTÁSA
      // ========================================================================
      if (path === "/start-round" && request.method === "POST") {
        const { roomId, playerName } = await request.json();
        
        const rawData = await env.TRASH_STORAGE.get(roomId);
        if (!rawData) {
          return new Response(JSON.stringify({
            error: "Szoba nem található"
          }), { status: 404, headers });
        }

        const roomData = JSON.parse(rawData);
        
        // Csak host indíthat
        const player = roomData.players.find(p => p.name === playerName);
        if (!player || !player.isHost) {
          return new Response(JSON.stringify({
            error: "Csak a host indíthatja a játékot"
          }), { status: 403, headers });
        }

        // Min 2 játékos
        if (roomData.players.length < 2) {
          return new Response(JSON.stringify({
            error: "Legalább 2 játékos kell"
          }), { status: 400, headers });
        }

        // Feladatok generálása mindenkinek
        roomData.players = roomData.players.map(p => ({
          ...p,
          tasks: generateTasks(),
          answers: null,
          ready: false,
          lastSeen: Date.now()
        }));

        roomData.currentPhase = "PLAYING";
        roomData.currentRound = (roomData.currentRound || 0) + 1;
        roomData.votingIndex = 0;
        roomData.votingPlayers = getVotingPlayers(roomData.players);
        roomData.updatedAt = Date.now();

        await env.TRASH_STORAGE.put(
          roomId, 
          JSON.stringify(roomData),
          { expirationTtl: 7200 }
        );

        return new Response(JSON.stringify({
          success: true,
          roomData
        }), { status: 200, headers });
      }

      // ========================================================================
      // 5. VÁLASZOK BEKÜLDÉSE
      // ========================================================================
      if (path === "/submit-answers" && request.method === "POST") {
        const { roomId, playerName, answers } = await request.json();
        
        if (!answers) {
          return new Response(JSON.stringify({
            error: "Válaszok hiányoznak"
          }), { status: 400, headers });
        }

        const rawData = await env.TRASH_STORAGE.get(roomId);
        if (!rawData) {
          return new Response(JSON.stringify({
            error: "Szoba nem található"
          }), { status: 404, headers });
        }

        const roomData = JSON.parse(rawData);

        // Ellenőrzés
        if (roomData.currentPhase !== "PLAYING") {
          return new Response(JSON.stringify({
            error: "Nincs aktív játék"
          }), { status: 400, headers });
        }

        // Válaszok mentése + ready flag
        roomData.players = roomData.players.map(p => {
          if (p.name === playerName) {
            return { 
              ...p, 
              answers: answers, 
              ready: true,
              lastSeen: Date.now()
            };
          }
          return p;
        });

        // Mindenki kész?
        const allReady = roomData.players.every(p => p.ready);

        if (allReady) {
          // ✅ VOTING INDÍTÁSA
          roomData.currentPhase = "VOTING";
          roomData.votingIndex = 0;
          roomData.players = roomData.players.map(p => ({ ...p, ready: false }));
        }

        roomData.updatedAt = Date.now();

        await env.TRASH_STORAGE.put(
          roomId, 
          JSON.stringify(roomData),
          { expirationTtl: 7200 }
        );

        return new Response(JSON.stringify({
          success: true,
          allReady,
          roomData
        }), { status: 200, headers });
      }

      // ========================================================================
      // 6. SZAVAZÁS
      // ========================================================================
      if (path === "/submit-vote" && request.method === "POST") {
        const { roomId, playerName, vote } = await request.json();
        
        if (vote === undefined || vote < 1 || vote > 10) {
          return new Response(JSON.stringify({
            error: "Érvénytelen szavazat (1-10)"
          }), { status: 400, headers });
        }

        const rawData = await env.TRASH_STORAGE.get(roomId);
        if (!rawData) {
          return new Response(JSON.stringify({
            error: "Szoba nem található"
          }), { status: 404, headers });
        }

        const roomData = JSON.parse(rawData);

        if (roomData.currentPhase !== "VOTING") {
          return new Response(JSON.stringify({
            error: "Nincs aktív szavazás"
          }), { status: 400, headers });
        }

        const targetPlayer = roomData.votingPlayers[roomData.votingIndex];
        if (!targetPlayer) {
          return new Response(JSON.stringify({
            error: "Érvénytelen voting index"
          }), { status: 400, headers });
        }

        // Dupla súly ellenőrzés
        const isDoubleWeighted = 
          roomData.votingPlayers.length % 2 === 1 && 
          roomData.votingIndex === roomData.votingPlayers.length - 1;
        
        const actualPoints = isDoubleWeighted ? vote * 2 : vote;

        // Pontok hozzáadása + ready flag
        roomData.players = roomData.players.map(p => {
          if (p.name === targetPlayer.name) {
            return { ...p, score: (p.score || 0) + actualPoints };
          }
          if (p.name === playerName) {
            return { ...p, ready: true, lastSeen: Date.now() };
          }
          return p;
        });

        // Mindenki szavazott?
        const allVoted = roomData.players.every(p => p.ready);

        if (allVoted) {
          const nextIndex = roomData.votingIndex + 1;
          const votingComplete = nextIndex >= roomData.votingPlayers.length;

          if (votingComplete) {
            // VOTING VÉGE
            const isGameOver = roomData.currentRound >= roomData.totalRounds;

            if (isGameOver) {
              // 🏆 JÁTÉK VÉGE
              roomData.currentPhase = "LEADERBOARD";
              roomData.players = roomData.players.map(p => ({ ...p, ready: false }));
            } else {
              // 🔄 ÚJ KÖR
              roomData.players = roomData.players.map(p => ({
                ...p,
                tasks: generateTasks(),
                answers: null,
                ready: false
              }));
              roomData.currentPhase = "PLAYING";
              roomData.currentRound += 1;
              roomData.votingIndex = 0;
              roomData.votingPlayers = getVotingPlayers(roomData.players);
            }
          } else {
            // KÖVETKEZŐ JÁTÉKOS
            roomData.votingIndex = nextIndex;
            roomData.players = roomData.players.map(p => ({ ...p, ready: false }));
          }
        }

        roomData.updatedAt = Date.now();

        await env.TRASH_STORAGE.put(
          roomId, 
          JSON.stringify(roomData),
          { expirationTtl: 7200 }
        );

        return new Response(JSON.stringify({
          success: true,
          allVoted,
          roomData
        }), { status: 200, headers });
      }

      // ========================================================================
      // 7. KILÉPÉS
      // ========================================================================
      if (path === "/leave-room" && request.method === "POST") {
        const { roomId, playerName } = await request.json();
        
        const rawData = await env.TRASH_STORAGE.get(roomId);
        if (!rawData) {
          return new Response(JSON.stringify({
            success: true,
            roomDeleted: true
          }), { status: 200, headers });
        }

        const roomData = JSON.parse(rawData);
        
        roomData.players = roomData.players.filter(p => p.name !== playerName);
        
        // Ha nincs több játékos, töröljük
        if (roomData.players.length === 0) {
          await env.TRASH_STORAGE.delete(roomId);
          return new Response(JSON.stringify({
            success: true,
            roomDeleted: true
          }), { status: 200, headers });
        }

        // Ha host lépett ki, új host
        const hasHost = roomData.players.some(p => p.isHost);
        if (!hasHost && roomData.players.length > 0) {
          roomData.players[0].isHost = true;
        }

        roomData.updatedAt = Date.now();

        await env.TRASH_STORAGE.put(
          roomId, 
          JSON.stringify(roomData),
          { expirationTtl: 7200 }
        );

        return new Response(JSON.stringify({
          success: true,
          roomData
        }), { status: 200, headers });
      }

      // ========================================================================
      // NEM LÉTEZŐ ENDPOINT
      // ========================================================================
      return new Response(JSON.stringify({
        error: "Endpoint nem található"
      }), { status: 404, headers });

    } catch (error) {
      console.error("Server error:", error);
      return new Response(JSON.stringify({
        error: "Szerver hiba",
        message: error.message,
        stack: error.stack
      }), { status: 500, headers });
    }
  }
};