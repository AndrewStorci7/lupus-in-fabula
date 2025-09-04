import { Role } from "@types";

export default interface Player {
    id: string;
    avatar?: string | undefined;
    host: boolean;
    name: string;
    role: Role | null;
    alive: boolean;
    votes: number;
    score: number;
}