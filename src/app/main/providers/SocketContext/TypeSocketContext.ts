import { RoomSettingsType } from "../RoomSettingsContext/RoomSettingsType";
import SocketIOClient from "@components/SocketIO/SocketIO";
import Player from "@models/Player";

type SocketContextType = {
    socket: SocketIOClient;
    isConnected: boolean;
    connectionError: string | null;
    createRoom: (player: string) => void;
    joinRoom: (room: string, player: string) => void;
    currentLobby: string | null;
    currentPlayers: Player[];
    currentNarrator: Player | null;
    // getCurrentPlayers: (roomCode: string) => string[] | undefined;
    getCurrentPlayers: (roomCode: string) => Player[] | null;
    exitRoom: (roomCode: string) => void;
    startGame: (roomCode: string, gameSettings: RoomSettingsType) => void;
    chooseNarrator: (narrator: Player) => void;
    chooseRoles: (gameSettings: RoomSettingsType) => void;
}

export default SocketContextType;