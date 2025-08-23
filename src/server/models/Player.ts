import { Role } from "@types";

class Player {
    private id: string;
    private name: string;
    private role: Role | null;
    private alive: boolean;
    private votes: number;
    private score: number;

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
        this.role = null;
        this.alive = true;
        this.votes = 0;
        this.score = 0;
    }

    public getId(): string {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public getRole(): Role | null {
        return this.role;
    }

    public isAlive(): boolean {
        return this.alive;
    }

    public getVotes(): number {
        return this.votes;
    }

    public setName(name: string): void {
        this.name = name;
    }

    public setRole(role: Role): void {
        this.role = role;
    }

    public setAlive(alive: boolean): void {
        this.alive = alive;
    }

    public setVotes(votes: number): void {
        this.votes = votes;
    }
}

export default Player;