import express, { Request, Response } from 'express';
import { GameRoom, Player } from '../models';
import { Server, Socket } from "socket.io";
import { createServer } from "http";

class ServerManager {
    private io: Server;
    private server: ReturnType<typeof createServer>;
    private app: express.Application;
    private lobbies: Record<string, GameRoom>;

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

            const newLobby = new GameRoom(lobbyCode);
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
        
        this.io.on("connection", (socket: Socket) => {
            console.log(`👤 Client connected: ${socket.id}`);

            socket.on("disconnect", (reason) => {
                console.log(`👋 Client disconnected: ${socket.id} - Reason: ${reason}`);
                // Rimuovi il giocatore da tutte le lobby
                this.removePlayerFromLobbies(socket.id);
            });

            socket.on('createLobby', (playerName: string, callback?: (success: boolean, err?: string, lobbyCode?: string) => void) => {
                console.log(`🎮 Creating lobby for player: ${playerName}`);
                const player = new Player(socket.id, playerName);
                const { code, lobbyCode, message } = this.createLobby();
                
                if (code === 0 && lobbyCode) {
                    console.log(`✅ Lobby created: ${lobbyCode} by player ${playerName}`);
                    socket.join(lobbyCode);
                    const lobby: GameRoom = this.lobbies[lobbyCode];
                    lobby.addPlayer(player);
                        
                    console.log(lobby.toString());
                    // // Salva associazione socket-player per cleanup
                    // socket.data.playerName = playerName;
                    // socket.data.currentLobby = lobbyCode;
                    
                    this.io.to(lobbyCode).emit('playerJoined', {
                        players: lobby?.getPlayers() || []
                    });
                    callback?.(true, undefined, lobbyCode);
                } else {
                    console.error(`❌ Error creating lobby for player ${playerName}: ${message}`);
                    callback?.(false, message);
                }
            });

            socket.on('joinLobby', (roomCode: string, playerName: string, callback?: (success: boolean, err?: string) => void) => {
                console.log(`🚪 Player ${playerName} trying to join lobby ${roomCode}`);
                const player = new Player(socket.id, playerName);
                const lobby: GameRoom | undefined = this.lobbies[roomCode];
                if (lobby !== undefined) {
                    console.log(lobby.toString());
                    // Controlla se il giocatore è già nella lobby
                    if (lobby.getPlayers().some(p => p.getName() === playerName)) {
                        callback?.(false, `Giocatore ${playerName} è già nella stanza`);
                        return;
                    }
                    
                    socket.join(roomCode);
                    lobby.addPlayer(player);
                    console.log(lobby.toString());

                    // // Salva associazione socket-player per cleanup
                    // socket.data.playerName = playerName;
                    // socket.data.currentLobby = roomCode;
                    
                    console.log(`✅ Player ${playerName} joined lobby ${roomCode}`);
                    console.log(`Current Players: ${lobby?.getPlayers().map(p => p.getName()).join(", ")}`);
                    this.io.to(lobby.getCode()).emit('playerJoined', {
                        players: lobby?.getPlayers() || []
                    });
                    callback?.(true);
                } else {
                    const errorMsg = `Stanza con codice ${roomCode} non esiste`;
                    console.warn(`⚠️ ${errorMsg}`);
                    callback?.(false, errorMsg);
                }
            });

            // socket.on('getPlayers', (roomCode: string, callback?: (success: boolean, players: string[]) => void) => {
            //     const players = this.lobbies[roomCode] || [];
            //     callback?.(true, players);
            // });
        });
    }

    private removePlayerFromLobbies(socketId: string): void {
        Object.entries(this.lobbies).forEach(([lobbyCode, lobby]) => {
            const playersBefore = lobby.getPlayers().length;
            lobby.removePlayer(socketId);
            const playersAfter = lobby.getPlayers().length;
            
            if (playersBefore > playersAfter) {
                console.log(`🚪 Player ${socketId} removed from lobby ${lobbyCode}`);
                this.io.to(lobbyCode).emit('playerLeft', {
                    players: lobby.getPlayers()
                });
                
                if (lobby.getPlayers().length === 0) {
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
