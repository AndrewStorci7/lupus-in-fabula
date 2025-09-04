import { io, Socket } from 'socket.io-client';
import Player from '@models/Player';
import { RoomSettingsType } from '@app/main/providers';
import Cookies from 'js-cookie';

/**
 * Gestisce la connessione client a un server Socket.IO per la gestione di lobby di gioco multiplayer.
 * 
 * La classe `SocketIOClient` fornisce metodi per:
 * - Creare e unirsi a lobby di gioco.
 * - Gestire la connessione/disconnessione al server.
 * - Recuperare e aggiornare la lista dei giocatori nella stanza.
 * - Avviare una partita e gestire eventi socket comuni.
 * 
 * Caratteristiche principali:
 * - Prevenzione di inizializzazioni multiple.
 * - Supporto per debug tramite log dettagliati.
 * - Gestione automatica della riconnessione e listener per eventi di connessione.
 * 
 * @example
 * ```typescript
 * const client = new SocketIOClient('http://localhost', 3000);
 * client.createLobby('Mario', (roomCode, err) => {
 *   if (roomCode) {
 *     console.log('Lobby creata con codice:', roomCode);
 *   }
 * });
 * ```
 * 
 * @remarks
 * Assicurarsi che il server Socket.IO sia configurato per accettare le connessioni e gestire gli eventi previsti.
 * 
 * @see {@link https://socket.io/docs/v4/client-api/ | Socket.IO Client API}
 */
class SocketIOClient {
    private port: number;
    private socket: Socket;
    private host: string;
    private roomCode: string;
    private isConnected: boolean = false;
    private currentPlayer: Player | null = null;
    private narrator: Player | null = null;
    private roomPlayers: Player[] = [];
    private isInitialized: boolean = false;
    private debug: boolean = false;

    constructor(host?: string, port?: number) {

        // Previeni inizializzazioni multiple
        if (this.isInitialized) {
            console.warn('⚠️ SocketIOClient già inizializzato');
            return;
        }

        const cookies = JSON.parse(Cookies.get("lupus-session") || '{}'); // controllo se e' gia' presente una sessione 
        // console.log(cookies)
        this.host = host || process.env.NEXT_PUBLIC_SERVER_HOST || 'http://localhost';
        this.port = port || Number(process.env.NEXT_PUBLIC_SERVER_PORT) || 3000;
        const serverUrl = this.host.startsWith('http') 
            ? `${this.host}:${this.port}` 
            : `http://${this.host}:${this.port}`;

        this.debug = process.env.NEXT_PUBLIC_DEBUG == "true" || false;
        this.currentPlayer = null;
        this.roomPlayers = [];
        this.roomCode = "";
        this.narrator = null;
        let clientId = Math.random().toString(36).substring(7);

        if (Object.keys(cookies).length > 0) {
            this.currentPlayer = cookies.player;
            this.roomCode = cookies.roomCode;
            this.roomPlayers = cookies.roomPlayers;
            this.narrator = cookies.narrator;
            // this.isConnected = this.socket.connected;
            clientId = cookies.socketId;
            console.log(this.currentPlayer)
        } else {
            this.updateSessionData({ socketId: clientId }, (success: boolean, err?: string) => {
                if (!success) {
                    console.error("❌ Errore durante l'aggiornamento della sessione:", err);
                }
            });
        }

        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            // timeout: 10000,
            autoConnect: true,
            forceNew: false,
            // query: {
            //     clientId
            // }
            auth: {
                clientId
            }
        });

        console.log(this.socket)

        this.registerDefaultListeners();
        this.isInitialized = true;
    }

    private registerDefaultListeners() {
        // Rimuovi eventuali listener precedenti per evitare duplicati
        this.socket.removeAllListeners();

        this.socket.on("connect", () => {
            let cookies = Cookies.get("lupus-session") ? JSON.parse(Cookies.get("lupus-session") || '{}') : {};
            if (cookies.roomCode && cookies.player) {
                this.socket.emit("rejoinPlayer", {
                    clientId: cookies.clientId,
                    roomCode: cookies.roomCode,
                    player: cookies.player
                });
                this.debug && console.log("✅ Connesso al server:", this.socket.id);
                this.isConnected = true;
            } else {
                this.debug && console.log("⚠️ Cookie non trovati, connessione non riuscita");
                this.debug && console.log("✅ Connesso al server:", this.socket.id);
                this.isConnected = true;
            }
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

        // Listener per i giocatori che si uniscono
        this.socket.on('playerJoined', (data: { players: Player[] } | Player[]) => {
            const players = Array.isArray(data) ? data : data.players;
            this.debug && console.log("🔄 Lobby aggiornata:", players);
            this.roomPlayers = players;
        });

        // Debug listener per vedere tutti gli eventi
        if (this.debug) {
            this.socket.onAny((event, ...args) => {
                console.log('📡 Socket event ricevuto:', event, args);
            });
        }
    }

    /**
     * Aggiorna i dati di sessione dell'utente nel cookie "lupus-session".
     *
     * Questo metodo aggiorna le informazioni di sessione salvate nel cookie, tra cui il socket attuale,
     * il giocatore corrente, il codice della stanza e la lista dei giocatori nella stanza. I parametri
     * forniti sovrascrivono i valori esistenti; se un parametro non viene passato, viene mantenuto il valore corrente.
     *
     * @param params - Oggetto contenente i dati da aggiornare nella sessione.
     * @param params.socket - (Opzionale) Istanza del socket da salvare nella sessione.
     * @param params.player - (Opzionale) Giocatore corrente da salvare nella sessione.
     * @param params.roomCode - (Opzionale) Codice della stanza da salvare nella sessione.
     * @param params.roomPlayers - (Opzionale) Lista dei giocatori della stanza da salvare nella sessione.
     *
     * @remarks
     * - I dati vengono serializzati in formato JSON e salvati nel cookie "lupus-session".
     * - Se un parametro non viene fornito, viene mantenuto il valore già presente nella sessione.
     * - Utile per mantenere la persistenza dello stato tra refresh della pagina o riavvii dell'applicazione.
     *
     * @example
     * ```typescript
     * socketIOClient.updateSessionData({
     *   player: nuovoGiocatore,
     *   roomCode: "ABC123"
     * });
     * ```
     */
    public updateSessionData({ 
        socketId, 
        player, 
        roomCode, 
        roomPlayers,
        narrator
    }: { 
        socketId?: string, 
        player?: Player | null, 
        roomCode?: string, 
        roomPlayers?: Player[],
        narrator?: Player | null
    }, 
    callback: (success: boolean, err?: string) => void) {
        try {
            Cookies.set("lupus-session", JSON.stringify({
                socketId: socketId || this.socket.id,
                player: player || this.currentPlayer,
                roomCode: roomCode || this.roomCode,
                roomPlayers: roomPlayers || this.roomPlayers,
                narrator: narrator || this.narrator
            }));
            callback(true);
        } catch (err) {
            callback(false, err.message);
        }
    }

    private removeSessionData(callback: (success: boolean) => void) {
        try {
            Cookies.remove("lupus-session");
            callback(true);
        } catch {
            callback(false);
        }
    }

    public createLobby(player: string, callback?: (roomCode?: string, err?: string) => void): void {
        if (!this.isConnected) {
            console.error("❌ Socket non connesso per createLobby");
            callback?.(undefined, "Socket non connesso");
            return;
        }

        console.log("🎮 Creazione lobby per:", player);
        
        this.socket.emit('createLobby', player, (success: boolean, player?: Player, lobbyCode?: string, err?: string) => {
            if (!success) {
                console.error("❌ Errore nella creazione lobby:", err);
                callback?.(undefined, err);
            } else {
                this.currentPlayer = player;
                this.roomCode = lobbyCode;
                this.updateSessionData({ player, roomCode: lobbyCode }, (success: boolean, err?: string) => {
                    if (!success) {
                        callback?.(undefined, err);
                        return;
                    }
                });
                callback?.(lobbyCode);
                this.debug && console.log("✅ Lobby creata:", lobbyCode);
            }
        });
    }

    public joinLobby(roomCode: string, playerName: string, callback?: (err?: string) => void): void {
        if (!this.isConnected) {
            console.error("❌ Socket non connesso per joinLobby");
            callback?.("Socket non connesso");
            return;
        }

        console.log("🚪 Join lobby:", roomCode, "player:", playerName);
        
        this.socket.emit('joinLobby', roomCode, playerName, (success: boolean, player: Player, err?: string) => {
            if (!success) {
                console.error("❌ Errore nell'ingresso alla lobby:", err);
                callback?.(err);
            } else {
                this.roomCode = roomCode;
                this.currentPlayer = player;
                this.updateSessionData({ player, roomCode: roomCode }, (success: boolean, err?: string) => {
                    if (!success) {
                        callback?.(err);
                        return;
                    }
                });
                this.debug && console.log("✅ Entrato nella lobby:", roomCode);
                callback?.();
            }
        });
    }

    public exitRoom(roomCode: string, callback?: (success: boolean, players: Player[] | string) => void): void {
        if (!this.isConnected) {
            callback?.(false, "Socket non connesso");
            return;
        }

        this.socket.emit("exitRoom", roomCode, this.socket.id, (success: boolean, players: Player[]) => {
            this.debug && console.log("🚪 Uscito dalla stanza:", this.socket.id);
            if (success) {
                this.roomPlayers = [];
                this.roomCode = "";
                this.updateSessionData({ roomPlayers: [], roomCode: "" }, (success: boolean, err?: string) => {
                    if (!success) {
                        callback?.(false, err);
                        return;
                    }
                });
                this.debug && console.log("✅ Uscito dalla stanza:", roomCode);
                callback?.(true, players);
            } else {
                console.error("❌ Errore nell'uscita dalla stanza:", players);
                callback?.(false, "Errore nell'uscita dalla stanza");
            }
        })
    }

    /**
     * Retrieves the list of players currently present in a specified room.
     *
     * This method emits a `getPlayers` event via the socket connection, passing the provided `roomCode`.
     * The server is expected to respond with a list of players in the room. The result is then handled
     * by the provided callback function, if any.
     *
     * @param roomCode - The unique code identifying the room whose players are to be retrieved.
     * @param callback - (Optional) A function to be called upon completion of the request.
     *                   - If the operation is successful, the callback is invoked with `true` and an array of `Player` objects.
     *                   - If the operation fails, the callback is invoked with `false` and an error message string.
     *
     * @remarks
     * - If the socket is not connected, the callback is immediately invoked with an error.
     * - On success, the internal `roomPlayers` property is updated with the retrieved players.
     * - Debug information is logged to the console if debugging is enabled.
     *
     * @example
     * ```typescript
     * socketIOInstance.getRoomPlayers('ROOM123', (success, playersOrError) => {
     *   if (success) {
     *     console.log('Players in room:', playersOrError);
     *   } else {
     *     console.error('Failed to get players:', playersOrError);
     *   }
     * });
     * ```
     */
    public getRoomPlayers(roomCode: string, callback?: (success: boolean, players: Player[] | string) => void): void {
        if (!this.isConnected) {
            callback?.(false, "Socket non connesso");
            return;
        }

        this.socket.emit('getPlayers', roomCode, (success: boolean, players: Player[]) => {
            if (success && players) {
                this.debug && console.log("🔄 Giocatori nella lobby:", players);
                // console.log(typeof players, players[0] instanceof Player);
                this.roomPlayers = players;
                this.updateSessionData({ roomPlayers: players }, (success: boolean, err?: string) => {
                    if (!success) {
                        callback?.(false, err);
                        return;
                    }
                });
                callback?.(true, players);
            } else {
                console.error("❌ Errore nel recupero dei giocatori");
                callback?.(false, "Errore nel recupero dei giocatori");
            }
        });
    }

    /**
     * Avvia una nuova partita inviando le impostazioni specificate al server tramite Socket.IO.
     *
     * @param settings - Oggetto contenente le impostazioni della partita da avviare.
     * @param callback - (Opzionale) Funzione di callback invocata al termine dell'operazione.
     *                   Riceve un booleano che indica il successo e, in caso di errore, una stringa con il messaggio di errore.
     *
     * @remarks
     * Se il socket non è connesso, la funzione richiama immediatamente la callback con successo `false` e un messaggio di errore.
     * In caso di successo, viene stampato un messaggio di debug (se abilitato).
     * In caso di errore, viene stampato un messaggio di errore sulla console.
     */
    public startGame(roomCode: string, settings: RoomSettingsType, callback?: (success: boolean, err?: string) => void): void {
        if (!this.isConnected) {
            callback?.(false, "Socket non connesso");
            return;
        }
        if (roomCode === "") {
            callback?.(false, "Codice stanza non valido");
            return;
        }

        this.socket.emit('gameStart', roomCode, settings, (success: boolean, err?: string) => {
            if (success) {
                this.debug && console.log("🎮 Gioco avviato con successo");
            } else {
                console.error("❌ Errore nell'avvio del gioco:", err);
            }
            callback?.(success, err);
        });
    }

    public chooseNarrator(narrator: Player, callback?: (success: boolean, narrator?: Player, err?: string) => void): void {
        if (!this.isConnected) {
            callback?.(false, undefined, "Socket non connesso");
            return;
        }
        if (this.roomCode === "") {
            callback?.(false, undefined, "Codice stanza non valido");
            return;
        }

        this.socket.emit('chooseNarrator', this.roomCode, narrator, (success: boolean, err?: string) => {
            if (success) {
                this.debug && console.log("🎤 Narratore scelto con successo:", narrator);
                this.narrator = narrator;
                console.log(narrator)
                this.updateSessionData({ narrator }, (success: boolean, err?: string) => {
                    if (!success) {
                        callback?.(false, undefined, err);
                        return;
                    }
                });
            } else {
                console.error("❌ Errore nella scelta del narratore:", err);
                callback?.(false, undefined, `❌ Errore nella scelta del narratore: ${err}`);
            }
            callback?.(success, this.narrator);
        });
    }

    public chooseRoles(callback?: (success: boolean, err?: string) => void): void {
        if (!this.isConnected) {
            callback?.(false, "Socket non connesso");
            return;
        }
        if (this.roomCode === "") {
            callback?.(false, "Codice stanza non valido");
            return;
        }

        this.socket.emit('chooseRoles', this.roomCode, (success: boolean, err?: string) => {
            if (success) {
                this.debug && console.log("🎭 Ruoli scelti con successo");
            } else {
                console.error("❌ Errore nella scelta dei ruoli:", err);
            }
            callback?.(success, err);
        });
    }

    public getRoomCode(): string {
        return this.roomCode;
    }

    public getCurrentPlayer(): Player | null {
        return this.currentPlayer;
    }

    public getSocket(): Socket {
        return this.socket;
    }

    public isSocketConnected(): boolean {
        return this.isConnected && this.socket.connected;
    }

    public disconnect(): void {
        if (this.socket) {
            this.debug && console.log("🔌 Disconnessione socket...");
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.isConnected = false;
            this.removeSessionData((success: boolean) => {
                if (!success) {
                    console.error("❌ Errore nella rimozione dei dati di sessione");
                }
            });
        }
    }

    // Metodo per forzare la riconnessione se necessario
    public reconnect(): void {
        if (!this.socket.connected) {
            this.debug && console.log("🔄 Riconnessione socket...");
            this.socket.connect();
        }
    }
}

export default SocketIOClient;