'use client'
import { NotificationPurpose, NotificationsTypes } from "@components/Notification/types";
import React, { useCallback, useState } from "react";
import { useNotification, useSocket } from "@providers";
import "./style.css";

const MainPage = () => {

    const { showNotification, hideNotification } = useNotification();
    const [roomCodeToJoin, setRoomCodeToJoin] = useState<string>('');
    const [playerName, setPlayerName] = useState<string>('');
    const { createRoom, joinRoom } = useSocket();

    const showAlert = useCallback((message: React.ReactNode | string, type?: NotificationsTypes, purpose?: NotificationPurpose) => {
        showNotification({
            purpose: purpose || "alert",
            title: "Attenzione",
            message,
            buttons: [
                { text: "OK", type: "default", onClick: () => hideNotification() },
            ],
            type: type || "error",
            duration: 3000
        });
    }, [showNotification, hideNotification]);

    const handleCreateRoom = () => {
        if (!playerName || playerName === "") {
            showAlert("Devi inserire un nickname valido", "error", "notification");
        } else {
            createRoom(playerName);
        }
    }

    const handleJoinRoom = () => {
        if (!roomCodeToJoin || roomCodeToJoin === "") {
            showAlert("Devi inserire un codice stanza valido", "error", "notification");
        } else if (!playerName || playerName === "") {
            showAlert("Devi inserire un nickname valido", "error", "notification");
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