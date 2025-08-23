'use client'
import React, { useState } from "react";
import "./style.css";
import { useSocket } from "@providers";

const MainPage = () => {

    const [roomCodeToJoin, setRoomCodeToJoin] = useState<string>('');
    const [playerName, setPlayerName] = useState<string>('');
    const { createRoom, joinRoom } = useSocket();

    const handleCreateRoom = () => {
        if (!playerName || playerName === "") {
            alert("Devi inserire un nickname valido");
        } else {
            createRoom(playerName);
        }
    }

    const handleJoinRoom = () => {
        if (!roomCodeToJoin || roomCodeToJoin === "") {
            alert("Devi inserire un codice stanza valido");
        } else if (!playerName || playerName === "") {
            alert("Devi inserire un nickname valido");
        } else {
            joinRoom(roomCodeToJoin, playerName);
        }
    };

    return (
        <div className="center main-page">
            <h1>Lupus</h1>
            <div>
                <input type="text" placeholder="Nickname" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
            </div>
            <section className="section">
                <h3>Crea una partita</h3>
                <p>Il numero massimo di giocatori è 8</p>
                <button type="button" onClick={handleCreateRoom}>Crea</button>
            </section>
            <section className="section">
                <h3>Entra in una partita</h3>
                <p>Inserisci il codice della partita per entrare a far parte del villaggio</p>
                <input type="text" placeholder="ID partita" value={roomCodeToJoin} onChange={(e) => setRoomCodeToJoin(e.target.value)} />
                <button type="button" onClick={handleJoinRoom}>Entra</button>
            </section>
        </div>
    )
}

export default MainPage;