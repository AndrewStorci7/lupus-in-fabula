import React from "react";

/**
 * Type for Button
 * @param onClick - The click event handler for the button
 * @param text - The text to display on the button
 * @param type - The type of the button (e.g., "submit", "button", "reset")
 */
export type Button = {
    // onClick: Function,
    onClick: React.MouseEventHandler<HTMLButtonElement>
    text: string
    type: string
}

/**
 * Type for User
 */
export type User = {
    id: string;
    nickname: string;
    email?: string;
};

export const ROLES: string[] = [ 
    "narrator", 
    "werewolf", 
    "seer",
    "necromancer",
    "villager",
    "guard",
] as const;

export const EVILROLES: string[] = [
    "werewolf"
] as const;

export const DEFAULTROLES: string[] = [
    "narrator",
    "werewolf",
    "villager"
] as const;

export type Role = typeof ROLES[number];

export type Character = {
    id: string;
    // name: ;
    role: Role;
    userId: User[];
    vote: number;
    alive: boolean;
};

export type GameType = {
    id: string;
    code: string;
    nWerewolves: number;
    players: Character[];
    dayCount: number;
}