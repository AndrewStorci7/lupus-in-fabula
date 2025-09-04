'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import SocketIOClient from "@components/SocketIO/SocketIO";
import SocketContextType from "./TypeSocketContext";
import { RoomSettingsType, useNotification } from "@providers";
import { useRouter } from "next/navigation";
import Player from "@models/Player";

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
}

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();

    const { showNotification, hideNotification } = useNotification(); // Notifica

    const socketRef = useRef<SocketIOClient | null>(null);
    const isInitialized = useRef(false);
    
    const debug: boolean = process.env.NEXT_PUBLIC_DEBUG == "true" || false;
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [currentLobby, setCurrentLobby] = useState<string | null>(socketRef.current?.getRoomCode());
    const [currentPlayers, setCurrentPlayers] = useState<Player[]>([]);
    const [currentNarrator, setCurrentNarrator] = useState<Player | null>(null);

    if (!socketRef.current && !isInitialized.current) {
        const host = process.env.NEXT_PUBLIC_SERVER_HOST || 'localhost';
        const port = Number(process.env.NEXT_PUBLIC_SERVER_PORT) || 3070;
        
        debug && console.log('🔌 Inizializzazione socket...', { host, port });
        socketRef.current = new SocketIOClient(host, port);
        isInitialized.current = true;
        debug && console.log(socketRef)
    }

    useEffect(() => {
        if (!socketRef.current) return;
        
        const socket = socketRef.current;
        const socketInstance = socket.getSocket();

        debug && console.log('🔄 Setup listeners socket...');

        const handleConnect = () => {
            console.log('✅ Socket connesso');
            setIsConnected(true);
            setConnectionError(null);
        };

        const handleDisconnect = (reason: string) => {
            debug && console.log('❌ Socket disconnesso:', reason);
            setIsConnected(false);
            setConnectionError(`Disconnesso dal server: ${reason}`);
        };

        const handleConnectError = (error: any) => {
            console.error('💥 Errore di connessione:', error);
            setIsConnected(false);
            setConnectionError(`Errore di connessione: ${error.message}`);
        };

        const handlePlayerChanged = (players: Player[]) => {
            debug && console.log('👥 Giocatori nella lobby:', players);
            setCurrentPlayers(players);
        };

        const handleGameStarted = () => {
            debug && console.log('🎮 Gioco avviato');
            router.push(`/room/${currentLobby}/game`);
        };

        const handleChosenNarrator = (narrator: Player) => {
            debug && console.log('🎤 Narratore scelto:', narrator.name);
            socketRef.current?.updateSessionData({ narrator }, (success: boolean) => {
                if (!success) {
                    showNotification({
                        title: "Errore nel salvataggio dei dati",
                        message: <p>Si e' presentato un errore durante il salvataggio dei dati.</p>,
                        purpose: "alert",
                        type: "error",
                        buttons: [
                            { text: "Ritorna alla home", type: "default", onClick: () => {
                                hideNotification();
                                router.push(`/`);
                            }},
                        ]
                    });
                }
            });
            setCurrentNarrator(narrator);
            showNotification({
                title: "Narratore scelto",
                message: <p>Il narratore è ora <b>{narrator.name}</b></p>,
                purpose: "alert",
                type: "info",
                buttons: [
                    { text: "Salamaleku", type: "default", onClick: () => hideNotification() },
                ]
            });
        }

        socketInstance.off('connect', handleConnect);
        socketInstance.off('disconnect', handleDisconnect);
        socketInstance.off('connect_error', handleConnectError);
        socketInstance.off('playerJoined', handlePlayerChanged);
        socketInstance.off('playerLeft', handlePlayerChanged);
        socketInstance.off('gameStarted', handleGameStarted);
        socketInstance.off('narratorChosen', handleChosenNarrator);

        socketInstance.on('connect', handleConnect);
        socketInstance.on('disconnect', handleDisconnect);
        socketInstance.on('connect_error', handleConnectError);
        socketInstance.on('playerJoined', handlePlayerChanged);
        socketInstance.on('playerLeft', handlePlayerChanged);
        socketInstance.on('gameStarted', handleGameStarted);
        socketInstance.on('narratorChosen', handleChosenNarrator);

        if (socketInstance.connected) {
            setIsConnected(true);
            setConnectionError(null);
        }

        return () => {
            debug && console.log('🧹 Cleanup listeners...');
            socketInstance.off('connect', handleConnect);
            socketInstance.off('disconnect', handleDisconnect);
            socketInstance.off('connect_error', handleConnectError);
            socketInstance.off('playerJoined', handlePlayerChanged);
            socketInstance.off('playerLeft', handlePlayerChanged);
            socketInstance.off('gameStarted', handleGameStarted);
            socketInstance.off('narratorChosen', handleChosenNarrator);
        };
    }, [currentLobby, socketRef.current]);

    const showAlert = useCallback((err?: string | React.ReactNode | undefined, room?: string | undefined) => {
        if (err) {
            showNotification({
                purpose: "alert",
                title: "Errore",
                message: err,
                buttons: [
                    { text: "Salamaleku", type: "default", onClick: () => hideNotification() },
                ],
                type: "error",
            })
            // alert(`Errore: ${err}`);
            setConnectionError(String(err));
        } else {
            // alert(`Operazione completata con successo! Stanza: ${room}`);
            setCurrentLobby(room || socketRef.current?.getRoomCode());
            setConnectionError(null);
        }
    }, []);

    const joinRoom = useCallback((room: string, player: string) => {
        if (!isConnected || !socketRef.current) {
            showAlert("Socket non connesso. Riprova tra qualche secondo.");
            return;
        }

        debug && console.log(`🚪 Tentativo di entrare nella stanza: ${room} con giocatore: ${player}`);
        socketRef.current.joinLobby(room, player, (err) => {
            if (err) {
                showAlert(err);
            } else {
                showAlert(undefined, room);
                setCurrentLobby(room || socketRef.current?.getRoomCode());
                router.push(`/room/${room}`);
            }
        });
    }, [isConnected]);

    const createRoom = useCallback((player: string) => {
        if (!isConnected || !socketRef.current) {
            showAlert(<p>Socket non connesso. Premi <b>"Refresh"</b> per ritentare la connessione.</p>);
            return;
        }

        debug && console.log(`🎮 Creazione stanza per giocatore: ${player}`);
        socketRef.current.createLobby(player, (roomCode: string, err?: string) => {
            if (err) {
                showAlert(err);
            } else {
                // showAlert("info", roomCode);
                setCurrentLobby(roomCode || socketRef.current?.getRoomCode());
                router.push(`/room/${roomCode}`);
            }
        });
    }, [isConnected]);

    const exitRoom = useCallback((roomCode: string) => {
        if (!isConnected || !socketRef.current) {
            showAlert("Socket non connesso. Riprova tra qualche secondo.");
            return;
        }

        socketRef.current.exitRoom(roomCode, (success: boolean) => {
            if (!success) {
                showAlert("Stanza non esistente");
                router.push("/")
            } else {
                setCurrentLobby(null);
                setCurrentPlayers([]);
                router.push("/")
            }
        })
    }, [isConnected, showAlert, router])

    const getCurrentPlayers = useCallback((roomCode: string) => {
        if (!isConnected || !socketRef.current) {
            showAlert("Socket non connesso. Riprova tra qualche secondo.");
            return null;
        }

        socketRef.current.getRoomPlayers(roomCode, (success: boolean, players: Player[]) => {
            if (success) {
                debug && console.log(`👥 Giocatori nella stanza ${roomCode}:`, players);
                if (Array.isArray(players)) {
                    debug && console.log(`Giocatori attuali: ${players.map(p => p.name).join(", ")}`);
                    setCurrentPlayers(players);
                }
                return players;
            } else {
                showAlert("Errore nel recupero dei giocatori.");
                return null;
            }
        });
    }, [isConnected]);

    const startGame = useCallback((roomCode: string, gameSettings: RoomSettingsType) => {
        if (!isConnected || !socketRef.current) {
            showAlert("Socket non connesso. Riprova tra qualche secondo.");
            return;
        }

        debug && console.log(`🎮 Avvio gioco con impostazioni ${roomCode}:`, gameSettings);
        // setCurrentLobby(roomCode);
        socketRef.current.startGame(roomCode, gameSettings, (success: boolean, err?: string) => {
            if (success) {
                debug && console.log("🎮 Gioco avviato con successo");
            } else {
                showAlert(err || "Errore nell'avvio del gioco.");
            }
        });
    }, [isConnected])

    const chooseNarrator = (narrator: Player) => {
        if (!isConnected || !socketRef.current) {
            showAlert("Socket non connesso. Riprova tra qualche secondo.");
            return;
        }

        debug && console.log(`🎤 Scelta del narratore:`, narrator);
        socketRef.current.chooseNarrator(narrator, (success: boolean, narrator?: Player, err?: string) => {
            if (success) {
                debug && console.log("✅ Narratore scelto con successo:", narrator);
                setCurrentNarrator(narrator);
            } else {
                showAlert(err || "Errore nella scelta del narratore.");
            }
        });
    }

    const chooseRoles = (gameSettings: RoomSettingsType) => {
        if (!isConnected || !socketRef.current) {
            showAlert("Socket non connesso. Riprova tra qualche secondo.");
            return;
        }
        
        if (!currentNarrator) {
            showAlert("Narratore non selezionato. Impossibile scegliere i ruoli.");
            return;
        }

        if (currentNarrator.id === socketRef.current.getCurrentPlayer()?.id) {
            debug && console.log(`🎭 Scelta dei ruoli in corso...`);
            socketRef.current.chooseRoles((success: boolean, err?: string) => {
                if (success) {
                    debug && console.log("✅ Ruoli scelti con successo");
                } else {
                    showAlert(err || "Errore nella scelta dei ruoli.");
                }
            });
        } else {
            return;
        }
    }

    useEffect(() => {
        return () => {
            if (socketRef.current) {
                debug && console.log('🔌 Disconnessione socket al cleanup finale...');
                socketRef.current.disconnect();
                socketRef.current = null;
                isInitialized.current = false;
            }
        };
    }, []);

    const value: SocketContextType = {
        socket: socketRef.current!,
        isConnected,
        connectionError,
        createRoom,
        joinRoom,
        currentLobby,
        currentPlayers,
        currentNarrator,
        getCurrentPlayers,
        exitRoom,
        startGame,
        chooseNarrator,
        chooseRoles
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};