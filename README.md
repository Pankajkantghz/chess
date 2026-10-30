# ♟️ Chess

### Real-Time Chess. Live Opponents. Instant Moves.

A real-time multiplayer chess application built using React, TypeScript, Node.js, WebSockets, and chess.js.

The application allows two players to compete online through automatic matchmaking, synchronized chess moves, individual game clocks, and real-time game state updates.

The backend uses WebSockets to maintain persistent connections between players and a centralized game manager to coordinate matchmaking and active games.

---

## 🚀 Live Application

| Component | URL |
|---|---|
| Frontend | [chess-beta-sandy.vercel.app](https://chess-beta-sandy.vercel.app/) |
| Backend | [chess-backend-3wti.onrender.com](https://chess-backend-3wti.onrender.com) |
| Health Check | [Backend Health](https://chess-backend-3wti.onrender.com/health) |
| Repository | [GitHub Repository](https://github.com/Pankajkantghz/chess) |

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript |
| Frontend Build Tool | Vite |
| Styling | Tailwind CSS |
| Chessboard | React Chessboard |
| Backend Runtime | Node.js |
| Backend Language | TypeScript |
| Real-Time Communication | WebSocket (`ws`) |
| Chess Engine | chess.js |
| HTTP Server | Node.js HTTP |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Version Control | Git, GitHub |

---

## ✨ Features

### ♟️ Multiplayer Gameplay

- Real-time multiplayer chess.
- Automatic player matchmaking.
- Match players based on selected time controls.
- Automatic assignment of White and Black.
- Unique game ID for every match.

### ⚡ Real-Time Communication

- Persistent WebSocket connections.
- Instant move synchronization between players.
- Live game state updates.
- Real-time clock synchronization.
- WebSocket connection and disconnection handling.

### ⏱️ Game Time Controls

Supported time controls:

- 1 minute
- 3 minutes
- 5 minutes
- 10 minutes
- 25 minutes

Each player has an independent clock. The server manages time calculations and detects timeouts.

### 🧠 Chess Engine and Game Rules

Powered by `chess.js`:

- Legal move validation.
- Checkmate detection.
- Stalemate detection.
- Draw detection.
- Resignation handling.
- Timeout handling.
- Move history.
- FEN and PGN generation.

### 🔌 Connection Management

- Tracks connected players.
- Maintains pending matchmaking requests.
- Manages active game instances.
- Detects player disconnections.
- Finishes active games when a player disconnects.
- Removes completed games from active memory.

### 🔐 WebSocket Origin Validation

- Allows connections from the deployed frontend.
- Supports local development origins when configured.
- Rejects WebSocket handshakes from unapproved browser origins.

> Origin validation is not a replacement for authentication. Stronger protection against non-browser clients requires additional authentication and rate limiting.

---

## 🏗️ System Architecture

The application follows a client-server architecture with persistent WebSocket connections.

### High-Level Architecture

```text
                 CLIENT LAYER
        +---------------------------+
        |                           |
        |       White Player        |
        |       Black Player        |
        |                           |
        |    React + TypeScript     |
        +-------------+-------------+
                      |
                      |
               WebSocket (WSS)
                      |
                      |
        +-------------v-------------+
        |       BACKEND LAYER       |
        |                           |
        |       Node.js Server      |
        |                           |
        |      WebSocket Server     |
        |                           |
        +-------------+-------------+
                      |
                      |
        +-------------v-------------+
        |      GAME MANAGER         |
        |                           |
        |    Player Management      |
        |    Matchmaking Queue      |
        |    Active Games           |
        |    Message Routing        |
        |                           |
        +-------------+-------------+
                      |
                      |
        +-------------v-------------+
        |       GAME ENGINE         |
        |                           |
        |        Game.ts            |
        |                           |
        |        chess.js           |
        |                           |
        |   Move Validation         |
        |   Game State              |
        |   Clock Management        |
        |   Game Result             |
        |                           |
        +-------------+-------------+
                      |
                      |
        +-------------v-------------+
        |       GAME STATE          |
        |                           |
        |     In-Memory Games       |
        |     Move History          |
        |     FEN / PGN             |
        |     Player Clocks         |
        |                           |
        +---------------------------+
```

### Layer Responsibilities

| Layer | Responsibility | Technology |
|---|---|---|
| Client | Chessboard UI and player interactions | React, TypeScript |
| Communication | Persistent real-time connections | WebSocket |
| HTTP Server | Health check and HTTP requests | Node.js HTTP |
| Game Manager | Matchmaking and game lifecycle | TypeScript |
| Game Engine | Chess rules and move validation | chess.js |
| Game State | Active games and move history | In-memory storage |
| Hosting | Application deployment | Vercel, Render |

---

## 📂 Project Structure

```text
chess/
│
├── backend/
│   │
│   ├── src/
│   │   ├── game/
│   │   │   └── Game.ts
│   │   │
│   │   ├── managers/
│   │   │   └── GameManager.ts
│   │   │
│   │   ├── types/
│   │   │   └── type.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── ...
│   │
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

*The frontend subdirectories above illustrate the organizational layout; adjust them to match the actual repository structure.*

### Backend Core Components

#### 1. GameManager.ts

Responsible for managing players and matchmaking.

Responsibilities:

- Accept new WebSocket connections.
- Add players to the matchmaking queue.
- Match players using their selected time control.
- Create new Game instances.
- Route incoming messages to the appropriate game.
- Handle player disconnections.
- Remove completed games.

#### 2. Game.ts

Responsible for the complete lifecycle of an individual chess game.

Responsibilities:

- Initialize the chessboard.
- Assign players their respective colors.
- Validate and execute moves.
- Maintain move history.
- Generate FEN and PGN.
- Manage White and Black clocks.
- Detect checkmate, stalemate, and draws.
- Handle resignation and timeout.
- Broadcast game updates to both players.

#### 3. index.ts

The main backend entry point.

Responsibilities:

- Create the HTTP server.
- Expose the health-check endpoint.
- Initialize the WebSocket server.
- Validate allowed WebSocket origins.
- Initialize the GameManager.
- Handle connection and disconnection events.

---

## 🔄 WebSocket Communication Protocol

The frontend and backend communicate through JSON messages over WebSockets.

### Connection URL

Production:

```text
wss://chess-backend-3wti.onrender.com
```

Local development:

```text
ws://localhost:8080
```

### Client-to-Server Messages

#### 1. Join Game

Players send a matchmaking request with their selected time control.

```json
{
  "type": "JOIN_GAME",
  "timeControl": 5
}
```

Supported values: `1`, `3`, `5`, `10`, `25`.

#### 2. Make a Move

```json
{
  "type": "MOVE",
  "move": {
    "from": "e2",
    "to": "e4"
  }
}
```

#### 3. Resign

```json
{
  "type": "RESIGN"
}
```

### Server-to-Client Messages

| Message | Description |
|---|---|
| `WAITING_FOR_PLAYER` | Player is waiting for an opponent |
| `INIT_GAME` | Initializes a new game |
| `MOVE` | Broadcasts an executed move |
| `CLOCK` | Updates both player clocks |
| `INVALID_MOVE` | Indicates an invalid move |
| `GAME_OVER` | Announces the game result |
| `ERROR` | Reports an invalid request or server error |

### Game Initialization Example

```json
{
  "type": "INIT_GAME",
  "gameId": "unique-game-id",
  "color": "white",
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "pgn": "",
  "whiteTime": 300000,
  "blackTime": 300000
}
```

### Move Update Example

```json
{
  "type": "MOVE",
  "gameId": "unique-game-id",
  "move": {
    "from": "e2",
    "to": "e4"
  },
  "fen": "updated-fen-position",
  "pgn": "1. e4",
  "whiteTime": 299000,
  "blackTime": 300000,
  "moves": [
    {
      "from": "e2",
      "to": "e4"
    }
  ]
}
```

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have installed:

- Node.js (LTS recommended)
- npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Pankajkantghz/chess.git

cd chess
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=8080
```

Start the development server:

```bash
npm run dev
```

The backend will run at:

```text
http://localhost:8080
```

Check the server health:

```bash
curl http://localhost:8080/health
```

Expected response:

```json
{
  "status": "ok"
}
```

Build the backend:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

### 3. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
VITE_WS_URL=ws://localhost:8080
```

Start the development server:

```bash
npm run dev
```

Open the local application:

```text
http://localhost:5173
```

> The local frontend can connect to the deployed Render backend by setting `VITE_WS_URL` to the production WebSocket URL instead.

---

## 🔐 Environment Variables

### Backend

Create `backend/.env`:

```env
PORT=8080
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP and WebSocket server port | `8080` |

### Frontend

Create `frontend/.env`:

```env
VITE_WS_URL=ws://localhost:8080
```

Production environment:

```env
VITE_WS_URL=wss://chess-backend-3wti.onrender.com
```

| Variable | Description |
|---|---|
| `VITE_WS_URL` | WebSocket server URL |

> Never commit environment files containing private credentials. Vite variables prefixed with `VITE_` are exposed in the browser bundle and must not contain secrets.

---

## 🌐 Deployment

The project uses separate hosting services for the frontend and backend.

### Backend Deployment — Render

Backend URL:

https://chess-backend-3wti.onrender.com

Configuration:

**Build Command**

```bash
npm install && npm run build
```

**Start Command**

```bash
npm start
```

The backend uses a single HTTP server shared with the WebSocket server.

The health endpoint is:

```text
GET /health
```

### Frontend Deployment — Vercel

Frontend URL:

https://chess-beta-sandy.vercel.app/

Configuration:

| Setting | Value |
|---|---|
| Framework | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Production environment variable:

```env
VITE_WS_URL=wss://chess-backend-3wti.onrender.com
```

### WebSocket Origin Validation

The backend maintains an allowlist of permitted browser origins.

Currently configured production origin:

```text
https://chess-beta-sandy.vercel.app
```

Local development origins can also be added when required.

---

## 🧪 Testing

### Backend Health Check

```bash
curl -i https://chess-backend-3wti.onrender.com/health
```

### WebSocket Connection Test

Install and run:

```bash
npx wscat -c wss://chess-backend-3wti.onrender.com
```

### Matchmaking Test

Connect two WebSocket clients and send the following message from both:

```json
{
  "type": "JOIN_GAME",
  "timeControl": 5
}
```

The first client should receive:

```json
{
  "type": "WAITING_FOR_PLAYER"
}
```

When the second client joins, both clients should receive `INIT_GAME` with their assigned colors.

### Move Synchronization Test

White:

```json
{
  "type": "MOVE",
  "move": {
    "from": "e2",
    "to": "e4"
  }
}
```

Black:

```json
{
  "type": "MOVE",
  "move": {
    "from": "e7",
    "to": "e5"
  }
}
```

Both players should receive synchronized move updates.

---

## 🗺️ Roadmap: Persistence, Recovery & Scalability

The current implementation maintains active games in server memory. The following improvements are planned to make the system more reliable and scalable.

### Phase 1: Database Persistence

**Planned technologies:** PostgreSQL, Prisma ORM.

Objectives:

- Create a `Game` table to store game information.
- Generate a unique ID for every game.
- Store game information when a new game starts.
- Create a `Move` table with a foreign key referencing the game.
- Persist every successfully validated move.
- Store game status, players, time control, and game information.

Proposed data model:

```text
Game
 ├── id
 ├── player1
 ├── player2
 ├── timeControl
 ├── status
 ├── fen
 ├── pgn
 ├── createdAt
 └── updatedAt

Move
 ├── id
 ├── gameId (Foreign Key)
 ├── from
 ├── to
 ├── promotion
 └── createdAt
```

### Phase 2: Game Recovery Mechanism

Objectives:

1. Validate every incoming move against the current chess state.
2. Persist successfully validated moves to PostgreSQL.
3. Recover the latest game state from the database after a server restart or lost connection.
4. Reconstruct the game using the stored moves.
5. Allow players to rejoin an existing game using its unique game ID.

Proposed recovery flow:

```text
       Player Reconnects
              |
              v
       Find Game in Memory
              |
        +-----+-----+
        |           |
       Found       Missing
        |           |
        v           v
    Continue    Fetch from DB
                    |
                    v
              Load Game Moves
                    |
                    v
              Reconstruct State
                    |
                    v
               Restore Game
                    |
                    v
                Continue
```

### Phase 3: Redis-Based Move Processing

**Planned technology:** Redis.

Objectives:

- Introduce a Redis queue for move-processing workflows.
- Validate moves against the authoritative game state before persistence.
- Persist validated moves to PostgreSQL.
- Broadcast accepted moves to the opponent.
- Use Redis Pub/Sub for communication between WebSocket servers.

Proposed move-processing flow:

```text
       Player Move
            |
            v
       WebSocket Server
            |
            v
       Move Validation
            |
            v
        Redis Queue
            |
            v
      Persist to PostgreSQL
            |
            v
     Broadcast to Opponent
```

The exact queue and persistence consistency strategy will be defined during implementation.

### Phase 4: Horizontal WebSocket Scaling

**Planned technologies:** Redis Pub/Sub, multiple Node.js WebSocket servers.

Objectives:

- Run multiple WebSocket server instances.
- Distribute incoming connections across servers.
- Track active games and player-server associations.
- Route messages between servers.
- Support communication between players connected to different servers.

Proposed architecture:

```text
                   CLIENTS
                      |
                      v
                LOAD BALANCER
                      |
          +-----------+-----------+
          |           |           |
          v           v           v
       WS Server  WS Server  WS Server
           1          2          3
          |           |           |
          +-----------+-----------+
                      |
                      v
                 REDIS PUB/SUB
                      |
             +--------+--------+
             |                 |
             v                 v
         PostgreSQL          Redis
         Game Storage      Shared State
```

### Phase 5: Spectator Support

Objectives:

- Allow spectators to join existing games.
- Associate spectators with the appropriate game.
- Route spectator connections to the server hosting the game.
- Broadcast game updates to all subscribed spectators.
- Support large numbers of spectators through distributed WebSocket servers.

The long-term goal is to support large-scale multiplayer games and spectator sessions without requiring every participant to connect to the same WebSocket server.

---

## 📈 Engineering Principles

The project follows these design principles:

- **Server-authoritative gameplay:** The backend validates and executes chess moves.
- **Separation of responsibilities:** Matchmaking, game management, and chess logic are separated into dedicated components.
- **Real-time communication:** Persistent WebSocket connections provide low-latency updates.
- **Incremental scalability:** Persistence and distributed infrastructure are introduced after the core application is stable.
- **Maintainability:** TypeScript and modular backend organization improve code clarity and maintainability.

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement your changes.
4. Commit your changes.
5. Push your branch.
6. Open a Pull Request.

---

## 📄 License

No license has been specified yet. Add a `LICENSE` file to define the terms under which others can use, modify, and distribute this project.

---

## 👨‍💻 Author

**Pankaj Yadav**

- GitHub: [@Pankajkantghz](https://github.com/Pankajkantghz)

---

<p align="center">
  Built with ♟️ using React, TypeScript, Node.js, WebSockets, and chess.js.
</p>