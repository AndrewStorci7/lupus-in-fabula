import express, { Request, Response } from 'express';
import { Server, Socket } from "socket.io";
import { createServer } from "http";

import Player from "@models/Player";
import GameRoom from "@models/GameRoom";
import { RoomSettingsType } from '@app/main/providers';

class ServerManager {
    private io: Server;
    private server: ReturnType<typeof createServer>;
    private app: express.Application;
    private lobbies: Record<string, GameRoom>;
    private debug: boolean;

    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: false
            },
            allowEIO3: true // Compatibilità con versioni precedenti
        });
        this.lobbies = {};
        this.setupMiddleware();
        this.debug = process.env.NEXT_PUBLIC_DEBUG == "true" || false;
    }

    private setupMiddleware(): void {
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            next();
        });

        // Endpoint di health check
        this.app.get('/health', (req: Request, res: Response) => {
            res.json({ status: 'ok', lobbies: Object.keys(this.lobbies).length });
        });
    }

    private generateCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
        let code = '';
        for (let i = 0; i < 6; ++i) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    public createLobby(): { code: number; lobbyCode?: string; message?: string } {
        try {
            let lobbyCode = this.generateCode();
            // Assicurati che il codice sia unico
            while (this.lobbies[lobbyCode]) {
                lobbyCode = this.generateCode();
            }

            const newLobby: GameRoom = { code: lobbyCode, players: [], dayCount: 0 };
            if (process.env.DEBUG === 'true') {
                console.log(newLobby.toString());
            }
            this.lobbies[lobbyCode] = newLobby;

            return { code: 0, lobbyCode };
        } catch (err: unknown) {
            if (err instanceof Error) {
                return { code: -1, message: err?.message };
            } else {
                return { code: -1, message: "Errore sconosciuto" };
            }
        }
    }

    public start(port: number): void {
        this.server.listen(port, () => {
            console.log(`🚀 Socket.IO server running on port ${port}`);
            console.log(`📊 Health check available at http://localhost:${port}/health`);
        });

        this.io.use((socket: Socket, next) => {
            const clientId = socket.handshake.auth.clientId;
            if (clientId) {
                socket.clientId = clientId;
            } else {
                socket.clientId = Math.random().toString(36).substring(7);
            }
            next();
        });

        this.io.on("connection", (socket: Socket) => {
            console.log(`👤 Client connected: ${socket.clientId}`);

            socket.on("disconnect", (reason) => {
                console.log(`👋 Client disconnected: ${socket.clientId} - Reason: ${reason}`);
                this.removePlayerFromLobbies(socket.clientId);
            });

            socket.on('createLobby', (playerName: string, callback?: (success: boolean, player?: Player, lobbyCode?: string, err?: string) => void) => {
                
                console.log(`🎮 Creating lobby for player: ${playerName}`);
                const player: Player = { id: socket.clientId, host: true, name: playerName, role: null, alive: true, votes: 0, score: 0 };
                const { code, lobbyCode, message } = this.createLobby();
                
                if (code === 0 && lobbyCode) {
                    console.log(`✅ Lobby created: ${lobbyCode} by player ${playerName}`);
                    socket.join(lobbyCode);
                    const lobby: GameRoom = this.lobbies[lobbyCode];
                    lobby.players.push(player);
                    
                    this.io.to(lobbyCode).emit('playerJoined', lobby.players || []);
                    callback?.(true, player, lobbyCode);
                } else {
                    console.error(`❌ Error creating lobby for player ${playerName}: ${message}`);
                    callback?.(false, null, null, message);
                }
            });

            socket.on('joinLobby', (roomCode: string, playerName: string, callback?: (success: boolean, player: Player, err?: string) => void) => {
                
                console.log(`🚪 Player ${playerName} trying to join lobby ${roomCode}`);
                const player: Player = { id: socket.clientId, host: false, name: playerName, role: null, alive: true, votes: 0, score: 0 };
                const lobby: GameRoom | undefined = this.lobbies[roomCode];
                
                if (lobby !== undefined) {
                    console.log(lobby.toString());
                    // Controlla se il giocatore è già nella lobby
                    if (lobby.players.some(p => p.name === playerName)) {
                        callback?.(false, null, `Giocatore ${playerName} è già nella stanza`);
                        return;
                    }
                    
                    socket.join(roomCode);
                    lobby.players.push(player);
                    
                    console.log(`✅ Player ${playerName} joined lobby ${roomCode}`);
                    console.log(`Current Players: ${lobby.players.map(p => p.name).join(", ")}`);
                    this.io.to(lobby.code).emit('playerJoined', lobby.players);
                    callback?.(true, player);
                } else {
                    const errorMsg = `Stanza con codice ${roomCode} non esiste`;
                    console.warn(`⚠️ ${errorMsg}`);
                    callback?.(false, null, errorMsg);
                }
            });

            socket.on("rejoinPlayer", ({ 
                clientId,
                roomCode, 
                player 
            }: { 
                clientId: string,
                roomCode: string, 
                player: Player 
            }, callback?: (success: boolean, err?: string) => void) => {
                
                console.log(`🔄 Player ${player.name} trying to rejoin lobby ${roomCode}`);
                const lobby: GameRoom | undefined = this.lobbies[roomCode];

                if (lobby) {
                    socket.join(roomCode);
                    if (!lobby.players.some(p => p.id === player.id)) {
                        lobby.players.push(player);
                    }
                    this.io.to(roomCode).emit('playerJoined', lobby.players);
                    callback?.(true);
                } else {
                    console.warn(`⚠️ Lobby ${roomCode} non esiste`);
                    callback?.(false, `⚠️ Lobby ${roomCode} non esiste`);
                }
            });

            socket.on("exitRoom", (roomCode: string, playerId: string, callback?: (success: boolean, players: Player[]) => void) => {
                
                const lobby: GameRoom = this.lobbies[roomCode];

                if (lobby) {
                    lobby.players = lobby.players.filter(player => player.id !== playerId);
                    this.lobbies[roomCode] = lobby;
                    console.log(`Player ${playerId} left the room ${roomCode}`);
                    // console.log(`Current Players: ${this.lobbies[roomCode].players.map(p => p.name).join(", ")}`);
                    this.io.to(roomCode).emit('playerLeft', lobby.players);
                    callback?.(true, lobby.players);
                } else {
                    callback?.(false, []);
                }
            })

            socket.on('getPlayers', (roomCode: string, callback?: (success: boolean, players: Player[]) => void) => {
                const players: Player[] | undefined = this.lobbies[roomCode]?.players || [];
                callback?.(true, players);
            });

            socket.on("gameStart", (roomCode: string, settings: RoomSettingsType, callback?: (success: boolean, msg: string) => void) => {

                const lobby: GameRoom = this.lobbies[roomCode];
                lobby.settings = settings;
                const players: Player[] | undefined = this.lobbies[roomCode]?.players || [];
                
                if (players.length > 0) {
                    console.log(`🎮 Starting game in room ${roomCode} with players: ${players.map(p => p.name).join(", ")}`);
                    this.io.to(roomCode).emit("gameStarted", players);
                    callback?.(true, "Game started successfully");
                } else {
                    const errorMsg = `Not enough players in room ${roomCode}`;
                    console.warn(`⚠️ ${errorMsg}`);
                    callback?.(false, errorMsg);
                }
            });

            socket.on("chooseNarrator", (lobbyCode: string, narrator: Player, callback?: (success: boolean, err?: string) => void) => {

                const lobby: GameRoom = this.lobbies[lobbyCode];

                if (lobby) {
                    const player = lobby.players.find(p => p.id === narrator.id);
                    if (player) {
                        this.debug && console.log(`🎤 Narratore scelto: ${narrator.name}`);
                        this.io.to(lobbyCode).emit("narratorChosen", narrator);
                        callback?.(true);
                    } else {
                        callback?.(false, `Player con ID ${narrator.id} non trovato nella lobby ${lobbyCode}`);
                    }
                } else {
                    this.debug && console.error(`⚠️ Lobby ${lobbyCode} non esiste`);
                    callback?.(false, `Lobby ${lobbyCode} non esiste`);
                }
            });
        });
    }

    private removePlayerFromLobbies(socketId: string): void {
        Object.entries(this.lobbies).forEach(([lobbyCode, lobby]) => {
            const playersBefore = lobby.players.length;
            lobby.players = lobby.players.filter(p => p.id !== socketId);
            const playersAfter = lobby.players.length;

            if (playersBefore > playersAfter) {
                console.log(`🚪 Player ${socketId} removed from lobby ${lobbyCode}`);
                this.io.to(lobbyCode).emit('playerLeft', lobby.players);

                if (lobby.players.length === 0) {
                    console.log(`🗑️ Removing empty lobby: ${lobbyCode}`);
                    delete this.lobbies[lobbyCode];
                }
            }
        });
    }

    public getIO(): Server {
        return this.io;
    }

    public getLobbies(): GameRoom[] {
        return Object.values(this.lobbies);
    }
}

export default ServerManager;
