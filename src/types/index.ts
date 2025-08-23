/**
 * Type for User
 */
export type User = {
    id: string;
    nickname: string;
    email?: string;
};

/**
 * ## Mappa dei ruoli (key, value)
 * - Chiave (key): **nome ruolo**
 * - Valore (value): **buono**(`true`)/**cattivo**(`false`)
 */
export const ROLES: Record<string, boolean> = { 
    "narrator": true, 
    "werewolf": false, 
    "seer": true, 
    "necromancer": true, 
    "villager": true, 
    "guard": true 
} as const;
export type Role = (typeof ROLES)[number];
export type Character = {
    id: string;
    // name: ;
    role: Role;
    userId: User[];
    vote: number;
    alive: boolean;
    // addVote: () => void;
    // killUser: (user: User) => void;
    // addUser: (user: User) => void;
};

export type GameType = {
    id: string;
    code: string;
    nWerewolves: number;
    players: Character[];
    dayCount: number;
    // startDay: () => void;
}
