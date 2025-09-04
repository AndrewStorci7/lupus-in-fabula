'use client'
import React, { useEffect } from "react";
import { LoaderProvider, useNotification, useSocket } from "@providers";
import PlayersList from "@app/main/pages/Room/PlayersList/PlayerList";

export default function Page() {

    const { showNotification, hideNotification } = useNotification();
    const { currentLobby } = useSocket();
    const [chooseRoles, setChooseRoles] = React.useState<boolean>(false);

    useEffect(() => {
        if (chooseRoles) {
            console.log("✅ Ruoli scelti");
        }
    }, [chooseRoles])

    return (
        <LoaderProvider>
            <div>
                <div className="center">
                    <h1>Lupus</h1>
                </div>
                <div className="players-section">
                    <PlayersList type="game" roomCode={currentLobby} handler={() => setChooseRoles(true)} />
                </div>
            </div>
        </LoaderProvider>
    );
}