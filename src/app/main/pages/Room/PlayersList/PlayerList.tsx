import { useSocket, useLoader } from "@providers";
import Player from "@models/Player";
import React from "react";
import "./styles.css";

interface PlayerListInterface {
    showAlert?: (message: string) => void;
    roomCode: string;
    type: "lobby" | "game";
    handler?: () => boolean | void;
}

const colors: Map<string, string> = new Map([
    ["#C9F9FF", "#272727"],
    ["#5DFDCB", "#272727"],
    ["#90D7FF", "#272727"],
    ["#B8B3BE", "#272727"],
    ["#EFF2C0", "#272727"],
    ["#A52422", "#D8D8D8"],
    ["#870058", "#D8D8D8"],
    ["#F2D0A4", "#272727"],
]);

export default function PlayersList({ 
    showAlert, 
    roomCode,
    type,
    handler
}: PlayerListInterface) {

    const { showLoader, hideLoader } = useLoader();
    const { socket, currentNarrator, currentPlayers, getCurrentPlayers, chooseNarrator } = useSocket();
    const [highlightedPlayerId, setHighlightedPlayerId] = React.useState<string | null>(null);
    const [narratorId, setNarratorId] = React.useState<string | null>(currentNarrator?.id ?? null);

    React.useEffect(() => {
        if (roomCode) {
            getCurrentPlayers(roomCode);
        }
    }, [roomCode, getCurrentPlayers]);

    React.useEffect(() => {
        if (type === "game") {
            chooseTheNarrator();
        }
    }, [socket, type]);

    const chooseTheNarrator = async () => {
        if (currentPlayers.length === 0) return;
        showLoader("Scelta del narratore in corso...");
        let iterations = 39;
        let time = 100;
        for ( let i = 0; i <= iterations; ++i ) {
            setTimeout(() => {
                const randomIndex = Math.floor(Math.random() * currentPlayers.length);
                const playerId = currentPlayers[randomIndex].id;
                setHighlightedPlayerId(playerId);

                if (i === iterations) {
                    if (socket.getCurrentPlayer()?.host) chooseNarrator(currentPlayers[randomIndex])
                    setNarratorId(playerId);
                    setHighlightedPlayerId(null);
                    handler?.();
                    hideLoader();
                }
            }, Math.pow(time, 2))
        }
    }

    const renderNoAvatar = (player: Player) => {
        const entries = Array.from(colors.entries());
        const randomEntry = entries[Math.floor(Math.random() * entries.length)];
        const [key, value] = randomEntry;
        if (type === "lobby") {
            return (
                <div className="player-avatar center" style={{ backgroundColor: key, color: value }}>
                    {player?.avatar ? (
                        <img src={player.avatar} alt={`${player.name}'s avatar`} />
                    ) : (
                        <div className="placeholder-avatar">
                            <span>{player.name.charAt(0).toUpperCase()}</span>
                        </div>
                    )}
                </div>
            )
        } else if (type === "game") {
            return (
                <div className="player-card-avatar center" style={{ backgroundColor: key, color: value }}>
                    {player?.avatar ? (
                        <img className="" src={player.avatar} alt={`${player.name}'s avatar`} />
                    ) : (
                        <div className="placeholder-avatar">
                            <span>{player.name.charAt(0).toUpperCase()}</span>
                        </div>
                    )}
                </div>
            )

        }
    }

    const renderPlayerList = () => {
        if (currentPlayers.length === 0) {
            return <div>Nessun giocatore presente</div>;
        } else {
            if (type === "game") {
                return currentPlayers.map(player => {
                    const isHighlighted = player.id === highlightedPlayerId;
                    const isNarrator = player.id === currentNarrator?.id;
                    return (
                        <div className={`player-card-game ${isHighlighted ? "highlight" : ""} ${isNarrator ? "highlight" : ""}`} key={player.id}>
                            {renderNoAvatar(player)}
                            <p className="truncate">{player.name}</p>
                        </div>
                    )
                });
            } else if (type === "lobby") {
                return currentPlayers.map(player => (
                    <div className="player center" key={player.id}>
                        {renderNoAvatar(player)}
                        <span className="player-name">{player.name}</span>
                        {/* <span className="player-status">{" "}{player.alive ? "vivo" : "morto"}</span> */}
                    </div>
                ))
            }
        }
    }

    return (
        <div className="players-list-container">
            {type === "lobby" && <h3>Giocatori nella stanza:</h3>}
            <div className="players-list">{renderPlayerList()}</div>
        </div>
    );
}
