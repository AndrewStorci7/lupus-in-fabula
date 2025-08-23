"use client";

import { SocketProvider, useSocket } from "@app/main/providers";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";

const RoomPageContent = ({ roomCode }: { roomCode: string }) => {

    const router = useRouter();
    const { socket, currentPlayers, joinRoom } = useSocket();

    useEffect(() => {
        // // appena entro nella room, mi unisco alla lobby
        // joinRoom(roomCode, "PlayerName");
        
        return () => {
            // cleanup quando esco dalla pagina
            socket.disconnect();
        };
    }, [roomCode]);
    
    const renderPlayers = () => {
        // console.log(currentPlayers);
        // const players = currentPlayers();
        return currentPlayers.map((player) => (
            <div key={player}>
                {player}
            </div>
        ));
    }

    return (
        <div>
            <button onClick={() => router.back()}>Go back</button>
            <div>
                <h1>Lista dei giocatori:</h1>
            </div>
            <div>
                {renderPlayers()}
            </div>
        </div>
    );
}

export default function RoomPage() {

    const params = useParams<{ room: string }>();
    const roomCode = params.room;
    
    return (
        <SocketProvider>
            <RoomPageContent roomCode={roomCode} />
        </SocketProvider>
    );
}
