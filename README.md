# **Frontend / Full-stack**

* **Next.js 14+ (App Router)** – SSR/ISR, API Routes/Route Handlers, middleware.
* **TypeScript** – meno bug, tipi per eventi socket e payload.
* **UI**: Tailwind CSS + shadcn/ui (componenti pronti, zero costo).
* **State client**: **Zustand** (più leggero di Redux) o **Jotai** per stato locale.

**Real-time (WebSocket)**

* Se vuoi tenere tutto “tuo”, con **0€** affidabile:

  * **Cloudflare Workers + Durable Objects** per WebSocket rooms (tier free molto generoso).
  * In alternativa: **Fly.io** o **Render** Free per un micro-server **Socket.IO**.
* Eviterei i WS puri su Vercel: oggi si può (Edge WS), ma per giochi con stanze persistenti i **Durable Objects**/istanze dedicate sono più robusti.

**Database (non relazionale)**

* **MongoDB Atlas M0 (free)**: 512MB, sufficiente per MVP e partite rapide.
* Alternativa zero-ops “document style”: **Cloudflare D1** (SQL) + KV, ma se preferisci documenti, resta su **MongoDB Atlas**.

**Auth (semplice)**

* **NextAuth.js** con **Credentials** (nickname) o **Email magic link** (Resend free tier) — per l’MVP puoi anche fare “guest + pin lobby”.

---

# **Architettura (panoramica)**

```
[Browser Player/Narratore]
        |  (HTTP/HTTPS)
        v
   Next.js (Vercel Free)
   - Pagine UI
   - API REST per setup partita, join, report
        |
        | (Mongo Driver)
        v
  MongoDB Atlas (M0)

Tempo reale (scelta consigliata)
[Browser] <--WS--> Cloudflare Worker (Durable Object "Room")
                           |
                           | (HTTP webhook/REST)
                           v
                       Next.js API
```

* **Autorità dello stato**: il “motore partita” vive nel **Durable Object**/istanza WS della stanza (server-authoritative).
* **Persistenza**: salvi snapshot/cambi di stato su Mongo per ripristino/analytics/replay; non ogni singolo evento (per non saturare M0).

---

# Librerie chiave

* **WebSocket lato server**

  * Cloudflare Workers (WS nativo) + Durable Objects per room state.
  * Oppure **Node + Socket.IO** (se usi Fly/Render).
* **WebSocket lato client**

  * `socket.io-client` *se scegli Socket.IO*; altrimenti **nativo** `WebSocket` (più leggero) per Workers.
* **Schema & Validation**

  * **Zod** (tipi condivisi client/server, valida payload e garantisce compatibilità).
* **Server utils**

  * **tRPC (facoltativo)** per RPC typed per setup/lobby (non per WS se usi Workers nativi), o semplici **Route Handlers** Next.js.
* **Gestione effetti game**

  * **immer** per mutazioni immutabili dello stato della stanza.

---

# Modello dati (MongoDB – collezioni)

```ts
// games
{
  _id: ObjectId,
  code: "ABCD",              // codice lobby
  hostId: string,            // narratore o creatore
  status: "lobby"|"night"|"day"|"ended",
  createdAt, updatedAt,
  options: {
    playersMin: 9,
    wolves: 2,
    roles: { seer:true, guard:true, necromancer:true, ... },
    dayTimerSec?: number,
    nightTimerSec?: number
  },
  snapshot?: { ... }         // snapshot ultimo stato (vedi sotto)
}

// players
{
  _id: ObjectId,
  gameId: ObjectId,
  userId?: string,           // se registrato
  nickname: string,
  isNarrator: boolean,
  connected: boolean,
  joinedAt, leftAt?
}

// roleAssignments
{
  _id: ObjectId,
  gameId: ObjectId,
  playerId: ObjectId,
  role: "wolf"|"villager"|"seer"|"guard"|"necromancer"|"...",
  alive: true
}

// events (append-only per audit/replay)
{
  _id: ObjectId,
  gameId: ObjectId,
  type: "NIGHT_START"|"WOLVES_KILL"|"SEER_PEEK"|"GUARD_PROTECT"|
        "DAY_START"|"VOTE_CAST"|"LYNCH"|"REVEAL"|"GAME_END"|"...",
  payload: {...},
  ts: Date,
  version: number            // per idempotenza
}
```

**Snapshot di stato nel WS (Durable Object)** – non tutto in DB ad ogni tick:

```ts
type RoomState = {
  phase: "lobby"|"night"|"day"|"ended";
  dayCount: number;
  players: Array<{id:string, nick:string, alive:boolean}>;
  rolesHidden: Record<string,"wolf"|"seer"|...>;   // solo lato server
  votes: Record<string,string|undefined>;          // voter -> target
  guardLast?: string;                              // vincolo no target consecutivo
  night: {
    wolvesTarget?: string;
    guardTarget?: string;
    seerTarget?: string;
  }
}
```

---

# Flusso di gioco (server-authoritative, a fasi)

1. **Lobby**: join, ready, assegnazione ruoli random → `phase = night`.
2. **Notte**

   * **Lupi** inviano target (solo i lupi vedono la sub-UI).
   * **Guardia** invia guardiaTarget (blocco: non uguale a guardLast).
   * **Veggente** chiede ruolo di X → risposta “buono/cattivo” (solo al veggente).
   * Risoluzione: se guardiaTarget === wolvesTarget ⇒ salva; altrimenti wolvesTarget muore.
3. **Giorno**

   * Annuncio morti (senza ruoli, a meno di regole diverse).
   * Discussione (timer opzionale).
   * **Votazione** → se maggioranza semplice ⇒ `LYNCH`; **Necromante** riceve “buono/cattivo” della vittima del giorno precedente.
4. **Controllo vittoria**

   * Lupi = 0 ⇒ Villaggio vince.
   * Lupi ≥ Villagers vivi ⇒ Lupi vincono.
   * Altrimenti loop al **Night** successivo.

---

# Eventi WS (indicativi)

**Client → Server**

* `room/join { gameCode, nickname }`
* `room/leave`
* `action/wolves_target { targetId }`
* `action/seer_peek { targetId }`
* `action/guard_protect { targetId }`
* `action/vote { targetId }`
* `narrator/advancePhase` (solo narratore)
* `narrator/assignRoles` (inizializza)

**Server → Client**

* `state/full { roomStateForClient }` (filtrato per ruolo!)
* `state/patch { diff }`
* `chat/moderation` (se aggiungi chat)
* `toast/info | error`
* `private/peek_result { good|evil }` (solo al veggente)
* `private/necromancer_result { good|evil }` (solo al necromante)

> Nota: invia **versioni**/vector clocks o un `stateVersion` incrementale per idempotenza; i client ignorano update vecchi.

---

# Sicurezza & Anti-cheat (minimo indispensabile)

* **Filtraggio server-side**: mai inviare ruoli al client non autorizzato; genera **RoomState filtrato per player**.
* **Riconnessione**: token di sessione temporaneo e **rejoin by playerId**.
* **Rate limiting** su API/WS (Cloudflare ha built-in primitives).
* **Validazione** Zod su ogni payload.
* **Timer lato server** per fasi (non fidarti dei timer client).

---

# Hosting 0€ (combo consigliate)

**Opzione A (molto semplice & robusta)**

* **Next.js** su **Vercel Free** (UI + API + auth).
* **MongoDB Atlas M0** (DB).
* **Cloudflare Workers + Durable Objects** (WS + state delle room).

  * Vantaggi: WS affidabili, latenza bassa, zero manutenzione.

**Opzione B (tutto Node)**

* **Next.js** su **Render Free** o **Fly.io** (puoi far girare Socket.IO nello stesso processo).
* **MongoDB Atlas M0** (DB).
* Vantaggi: un solo runtime. Svantaggi: cold start/free tier può dormire.

---

# Struttura progetto (monorepo semplice)

```
apps/
  web/            # Next.js (app router)
    app/
    components/
    lib/
    pages/api/    # o app/api/route.ts (solo per REST)
    ws-client/    # wrapper client WS
  worker-ws/      # Cloudflare Worker (Hono/itty-router + DO rooms)
packages/
  shared/
    types/        # zod schemas + types sharati
    utils/
```

---

# Snippet mini (scheletri, concisi)

**Zod tipi eventi (shared):**

```ts
// packages/shared/types/events.ts
import { z } from "zod";

export const VoteEvent = z.object({ targetId: z.string().uuid() });
export type VoteEvent = z.infer<typeof VoteEvent>;

export const PeekResult = z.union([z.literal("good"), z.literal("evil")]);
```

**Client WS wrapper (React + Zustand):**

```ts
// apps/web/ws-client/useRoom.ts
import { create } from "zustand";

type ClientState = {
  connected: boolean;
  me?: { id: string; role?: string };
  phase: "lobby"|"night"|"day"|"ended";
  players: Array<{id:string; nick:string; alive:boolean}>;
  vote?: string;
  connect: (url:string, token:string) => void;
};

export const useRoom = create<ClientState>((set, get) => ({
  connected: false,
  phase: "lobby",
  players: [],
  connect: (url, token) => {
    const ws = new WebSocket(`${url}?t=${token}`);
    ws.onopen = () => set({ connected: true });
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "state/full") set({ ...msg.payload });
      if (msg.type === "state/patch") set((s) => ({ ...s, ...msg.payload }));
    };
    ws.onclose = () => set({ connected: false });
  }
}));
```

**Route Handler Next.js per creare partita:**

```ts
// apps/web/app/api/games/route.ts
import { NextResponse } from "next/server";
import { mongo } from "@/lib/mongo";
import { randomBytes } from "crypto";

export async function POST() {
  const code = randomBytes(3).toString("hex").toUpperCase(); // es. "A1B2C3"
  const game = await mongo.db().collection("games").insertOne({
    code, status: "lobby", createdAt: new Date(), updatedAt: new Date(),
    options: { playersMin: 9, wolves: 2, roles: { seer:true, guard:true, necromancer:true } }
  });
  return NextResponse.json({ code, id: game.insertedId.toString() });
}
```

*(Solo schemi: non sono “drop-in”, ma mostrano l’impostazione.)*

---

# Roadmap pratica (in 5 step)

1. **MVP Lobby**

   * Creazione partita, codice invito, join come narratore/giocatore, lista giocatori live (WS).
2. **Assegnazione ruoli + Notte**

   * Chiamate sequenziali per ruoli; UI del narratore che “chiama” i ruoli; WS privati.
3. **Giorno + Votazione**

   * Timer, voti, linciaggio, notifica necromante.
4. **Condizioni di vittoria + Restart**

   * Contatori, fine partita, restart con stesso gruppo.
5. **Polish**

   * Reconnessone, mobile-first, moderazione base, log eventi in DB, pannello admin replay.

---

# Perché questa scelta

* **Next.js + Vercel**: deployment 1-click, ottimo DX e gratuito.
* **MongoDB Atlas**: documenti perfetti per snapshot eventi/ruoli; M0 basta e avanza per test.
* **Cloudflare Workers DO**: WebSocket stabili, **stato per stanza** senza dover mantenere server 24/7, zero costi nel dev.

Se vuoi, nel prossimo messaggio posso:

* darti un **diagramma delle fasi** più completo,
* buttare giù **contratti WS** (tutti i messaggi e payload),
* impacchettare un **template** (Next.js + Worker) pronto da clonare.
