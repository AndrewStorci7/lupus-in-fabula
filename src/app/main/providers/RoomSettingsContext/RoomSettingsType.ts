import Player from "@models/Player"

export interface RoomSettingsTypeContext {
    settings: RoomSettingsType
    setSettings: (settings: RoomSettingsType) => void
    refreshSettings: () => void
    narrator: Player | null
    setNarrator: (narrator: Player | null) => void
}

export interface SelectedRoles {
    name: string;
    good: boolean;
    selected: boolean;
}

export interface RoomSettingsType {
    nWolfs?: number;
    durationDay?: number;
    durationNight?: number;
    roles?: SelectedRoles[];
}

export function isRoomSettingsType(obj: unknown): obj is RoomSettingsType {
    if (typeof obj !== "object" || obj === null) return false;

    const settings = obj as RoomSettingsType;

    return (
        typeof settings.nWolfs === "number" &&
        typeof settings.durationDay === "number" &&
        typeof settings.durationNight === "number" &&
        Array.isArray(settings.roles) &&
        settings.roles.every(
            (role) =>
                typeof role === "object" &&
                role !== null &&
                typeof role.name === "string" &&
                typeof role.good === "boolean" &&
                typeof role.selected === "boolean"
        )
    );
}