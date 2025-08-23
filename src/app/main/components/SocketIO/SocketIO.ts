import { io, Socket } from 'socket.io-client';

class SocketIOClient {
    private port: number;
    private socket: Socket;
    private host: string;
    private isConnected: boolean = false;
    private roomPlayers: string[] = [];

    constructor(host: string, port: number) {
        this.host = host || process.env.SOCKET_IO_HOST || 'http://localhost';
        this.port = port || Number(process.env.SOCKET_IO_PORT) || 3000;
        
        // Costruisci l'URL correttamente
        const serverUrl = this.host.startsWith('http') ? `${this.host}:${this.port}` : `http://${this.host}:${this.port}`;
        
        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling'], // Aggiungi polling come fallback
            reconnectionAttempts: 5,
            timeout: 10000,
            autoConnect: true, // Connetti automaticamente
            forceNew: false
        });

        this.roomPlayers = [];
        this.registerDefaultListeners();
    }

    private registerDefaultListeners() {
        this.socket.on("connect", () => {
            console.log("✅ Connesso al server:", this.socket.id);
            this.isConnected = true;
        });

        this.socket.on("connect_error", (err) => {
            console.error("❌ Errore di connessione:", err.message);
            this.isConnected = false;
        });

        this.socket.on("disconnect", (reason) => {
            console.warn("⚠️ Disconnesso:", reason);
            this.isConnected = false;
        });

        // Listener per errori durante il join
        this.socket.on('errorMessageDuringJoining', (message: string) => {
            console.error("❌ Errore durante il join:", message);
        });

        // Listener per aggiornamenti lobby
        this.socket.on('playerJoined', (players: string[]) => {
            console.log("🔄 Lobby aggiornata:", players);
            this.roomPlayers = players;
        });
    }

    public createLobby(player: string, callback?: (err?: string, roomCode?: string) => void): void {
        if (!this.isConnected) {
            callback?.("Socket non connesso");
            return;
        }

        this.socket.emit('createLobby', player, (success: boolean, err?: string, lobbyCode?: string) => {
            if (!success) {
                console.error("❌ Errore nella creazione lobby:", err);
                callback?.(err);
            } else {
                console.log("✅ Lobby creata:", lobbyCode);
                callback?.(undefined, lobbyCode);
            }
        });
    }

    public joinLobby(roomCode: string, playerName: string, callback?: (err?: string) => void): void {
        if (!this.isConnected) {
            callback?.("Socket non connesso");
            return;
        }

        this.socket.emit('joinLobby', roomCode, playerName, (success: boolean, err?: string) => {
            if (!success) {
                console.error("❌ Errore nell'ingresso alla lobby:", err);
                callback?.(err);
            } else {
                console.log("✅ Entrato nella lobby:", roomCode);
                callback?.();
            }
        });
    }

    public getRoomPlayers(roomCode: string, callback?: (success: boolean, e: string[] | string) => void): void {
        if (!this.isConnected) {
            callback?.(false, "Socket non connesso");
            return;
        }

        this.socket.emit('getPlayers', roomCode, (success: boolean, players: string[]) => {
            if (success && players) {
                console.log("🔄 Giocatori nella lobby:", players);
                callback?.(true, players);
            } else {
                console.error("❌ Errore nel recupero dei giocatori");
                callback?.(false, "Errore nel recupero dei giocatori");
            }
        })
    }

    public getSocket(): Socket {
        return this.socket;
    }

    public isSocketConnected(): boolean {
        return this.isConnected && this.socket.connected;
    }

    public disconnect(): void {
        this.socket.disconnect();
    }
}

export default SocketIOClient;