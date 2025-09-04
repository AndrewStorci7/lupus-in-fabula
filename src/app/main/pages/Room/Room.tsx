'use client';
import React from "react";
import PlayersList from "./PlayersList/PlayerList";
import { GameRules, Footer } from "@pages";
import { useNotification, useRoomSettings, useSocket } from "@providers";
import InfoComment from "@components/InfoComment/InfoComment";
import RoleList from "./RoleList/RoleList";
import List from "@components/List/List";

import "./styles.css";

interface RoomProps {
    roomCode: string;
}

const Room = ({
    roomCode
}: RoomProps) => {

    const { showNotification, hideNotification } = useNotification();
    const { socket, isConnected, exitRoom, startGame } = useSocket();
    const { settings: gameSettings, setSettings: setGameSettings } = useRoomSettings();

    console.log(socket.getCurrentPlayer())

    const handleStartGame = () => {
        // console.log("Game settings: ", gameSettings);
        showNotification({
            title: "Conferma impostazioni partita",
            message: <div>Rivedi le impostazioni della partita: <List items={gameSettings} /></div>,
            purpose: "alert",
            type: "info",
            buttons: [
                { text: "Annulla", type: "cancel", onClick: () => hideNotification() },
                { text: "Conferma", type: "confirm", onClick: () => {
                    startGame(roomCode, gameSettings);
                    hideNotification()
                } },
            ]
        })
    }

    return (
        <div className="room-container">
            <button onClick={() => exitRoom(roomCode)}>← Torna indietro</button>
            
            {socket.getCurrentPlayer()?.host && (
                <div className="game-settings">
                    <form>
                        <div>
                            <label>Durata notte:</label>
                            <input
                                type="number"
                                value={gameSettings.durationNight}
                                onChange={(e) => setGameSettings({ durationNight: Number(e.target.value) })}
                            />
                            <InfoComment>Se lasciato a 0, il turno di notte non avrà durata.</InfoComment>
                        </div>
                        <div>
                            <label>Durata giorno:</label>
                            <input
                                type="number"
                                value={gameSettings.durationDay}
                                onChange={(e) => setGameSettings({ durationDay: Number(e.target.value) })}
                            />
                            <InfoComment>Se lasciato a 0, il turno di giorno non avrà durata.</InfoComment>
                        </div>
                        <div>
                            <RoleList />
                        </div>
                    </form>
                </div>
            )}

            <div className="players-section">
                <PlayersList type="lobby" roomCode={roomCode} />
            </div>

            <div className="game-rules-section">
                <GameRules />
            </div>

            {socket.getCurrentPlayer()?.host && (
                <div className="start-game">
                    <button className="start-button" onClick={handleStartGame}>
                        Start
                    </button>
                </div>

            )}

            <Footer roomCode={roomCode} isConnected={isConnected} />
        </div>
    )
}

export default Room;