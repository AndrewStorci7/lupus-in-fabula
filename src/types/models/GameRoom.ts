import { Role } from "@types";
import Player from "./Player";
import { RoomSettingsType } from "@app/main/providers/RoomSettingsContext/RoomSettingsType";

export default interface GameRoom {
    code: string;
    players: Player[];
    dayCount: number;
    settings?: RoomSettingsType;
}

// export type GameSettings = {
//     rolesAvailable: Role[];
//     // gameMode: string;
//     nightDuration: number;
//     dayDuration: number;
// } 

// export function isGameSettings(obj: unknown): obj is GameSettings {
//     return (
//         typeof obj === "object" &&
//         obj !== null &&
//         Array.isArray((obj as GameSettings).rolesAvailable) &&
//         (obj as GameSettings).rolesAvailable.every(role => typeof role === "string") &&
//         typeof (obj as GameSettings).nightDuration === "number" &&
//         typeof (obj as GameSettings).dayDuration === "number"
//     );
// }