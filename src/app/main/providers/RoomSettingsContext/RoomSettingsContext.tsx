'use client'
import React, { createContext, useContext, useState, ReactNode } from "react";
import { RoomSettingsType, RoomSettingsTypeContext, useNotification } from "@providers";
import Player from "@models/Player";

const RoomSettingsContext = createContext<RoomSettingsTypeContext | null>(null);

export const useRoomSettings = () => {
    const context = useContext(RoomSettingsContext);
    if (!context) {
        throw new Error('useRoomSettings must be used within a RoomSettingsProvider');
    }
    return context;
};

export const RoomSettingsProvider = ({ children }: { children: ReactNode }) => {

    const { showNotification } = useNotification();
    const [settings, setSettingsWrapper] = useState<RoomSettingsType>({
        nWolfs: 2,
        durationDay: 0, // no limite
        durationNight: 0, // no limite
        roles: [
            { "name": "villager", "good": true, "selected": true },
            { "name": "narrator", "good": true, "selected": true },
            { "name": "necromancer", "good": true, "selected": true },
            { "name": "werewolf", "good": false, "selected": true },
            { "name": "seer", "good": true, "selected": true },
            { "name": "guard", "good": true, "selected": true },
        ]
    });
    const [narrator, setNarratorPlayer] = useState<Player | null>(null);

    const setSettings = (newVal: Partial<RoomSettingsType>) => {
        setSettingsWrapper((prevSettings) => ({
            ...prevSettings,
            ...newVal
        }));
    }

    const refreshSettings = () => {
        setSettings({
            nWolfs: 2,
            durationDay: 0, // no limite
            durationNight: 0, // no limite
            roles: [
                { "name": "villager", "good": true, "selected": true },
                { "name": "narrator", "good": true, "selected": true },
                { "name": "necromancer", "good": true, "selected": true },
                { "name": "werewolf", "good": false, "selected": true },
                { "name": "seer", "good": true, "selected": true },
                { "name": "guard", "good": true, "selected": true },
            ]
        });
        showNotification({
            title: "Impostazioni resettate correttamente",
            message: "Le impostazioni della stanza sono state ripristinate ai valori predefiniti.",
            purpose: "notification",
            type: "info",
            duration: 5000
        })
    }

    const setNarrator = (newNarrator: Player | null) => {
        setNarratorPlayer(newNarrator);
    }

    const value: RoomSettingsTypeContext = {
        settings,
        setSettings,
        refreshSettings,
        narrator,
        setNarrator
    };

    return (
        <RoomSettingsContext.Provider value={value}>
            {children}
        </RoomSettingsContext.Provider>
    );
}