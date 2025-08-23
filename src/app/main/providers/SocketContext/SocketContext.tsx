'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { SocketIOClient } from "@components"; // Assicurati che il path sia corretto
import { useRouter } from "next/navigation";

type SocketContextType = {
    socket: SocketIOClient;
    isConnected: boolean;
    connectionError: string | null;
    createRoom: (player: string) => void;
    joinRoom: (room: string, player: string) => void;
    currentLobby: string | null;
    // currentPlayers: () => string[];
    currentPlayers: string[];
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
}

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    // Configurazione del server
    const host = process.env.NEXT_PUBLIC_SERVER_HOST || 'localhost';
    const port = Number(process.env.NEXT_PUBLIC_SERVER_PORT) || 3070;
    
    const router = useRouter();
    const [socket] = useState<SocketIOClient>(() => new SocketIOClient(host, port));
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [currentLobby, setCurrentLobby] = useState<string | null>(null);
    const [currentPlayers, setCurrentPlayers] = useState<string[]>([]);

    useEffect(() => {
        const checkConnection = () => {
            const connected = socket.isSocketConnected();
            setIsConnected(connected);
            if (!connected) {
                setConnectionError("Connessione al server persa");
            } else {
                setConnectionError(null);
            }
        };

        // Controlla la connessione ogni 2 secondi
        const interval = setInterval(checkConnection, 2000);
        
        // Setup listeners per aggiornamenti lobby
        const socketInstance = socket.getSocket();
        
        // socketInstance.on('lobbyUpdate', (players: string[]) => {
        //     console.log('Aggiornamento lobby ricevuto:', players);
        //     setCurrentPlayers(players);
        // });

        socketInstance.on('playerJoined', (players: string[]) => {
            console.log('Giocatori nella lobby:', players);
            setCurrentPlayers(players);
        });

        socketInstance.on('connect', () => {
            console.log('Socket connesso');
            setIsConnected(true);
            setConnectionError(null);
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket disconnesso');
            setIsConnected(false);
            setConnectionError("Disconnesso dal server");
        });

        socketInstance.on('connect_error', (error: any) => {
            console.error('Errore di connessione:', error);
            setIsConnected(false);
            setConnectionError(`Errore di connessione: ${error.message}`);
        });

        // Cleanup
        return () => {
            clearInterval(interval);
            socketInstance.off('lobbyUpdate');
            socketInstance.off('connect');
            socketInstance.off('disconnect');
            socketInstance.off('connect_error');
        };
    }, []);

    const showAlert = useCallback((err?: string | undefined, room?: string | undefined) => {
        if (err) {
            alert(`Errore: ${err}`);
            setConnectionError(err);
        } else {
            alert(`Operazione completata con successo! Stanza: ${room}`);
            setCurrentLobby(room || null);
            setConnectionError(null);
        }
    }, []);

    const joinRoom = useCallback((room: string, player: string) => {
        if (!isConnected) {
            showAlert("Socket non connesso. Riprova tra qualche secondo.");
            return;
        }

        console.log(`Tentativo di entrare nella stanza: ${room} con giocatore: ${player}`);
        socket.joinLobby(room, player, (err) => {
            if (err) {
                showAlert(err);
            } else {
                showAlert(undefined, room);
                router.push(`/room/${room}`);
            }
        });
    }, [isConnected, socket, showAlert]);

    const createRoom = useCallback((player: string) => {
        if (!isConnected) {
            showAlert("Socket non connesso. Riprova tra qualche secondo.");
            return;
        }

        console.log(`Creazione stanza per giocatore: ${player}`);
        socket.createLobby(player, (err, roomCode) => {
            if (err) {
                showAlert(err);
            } else {
                showAlert(undefined, roomCode);
                router.push(`/room/${roomCode}`);
            }
        });
    }, [isConnected, socket, showAlert]);

    // const currentPlayers = (): string[] => {
    //     let players: string[] = [];
    //     socket.getRoomPlayers(String(currentLobby), (success, players) => {
    //         if (success) {
    //             console.log(players);
    //             players = players;
    //         } else {
    //             console.error("❌ Errore nel recupero dei giocatori");
    //         }
    //     });
    //     return players;
    // }

    useEffect(() => {
        return () => {
            socket.disconnect();
        };
    }, [socket]);

    const value: SocketContextType = {
        socket,
        isConnected,
        connectionError,
        createRoom,
        joinRoom,
        currentLobby,
        currentPlayers
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};