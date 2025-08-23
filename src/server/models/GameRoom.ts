import Player from "./Player";

class GameRoom {
    // private id: string;
    private code: string;
    private players: Player[];
    private dayCount: number;
    private static minPlayers: number = 9;
    private static maxPlayers: number = 19;

    constructor(code: string) {
        // this.id = id;
        this.code = code;
        this.players = [];
        this.dayCount = 0;
    }

    // public getId(): string {
    //     return this.id;
    // }

    public getCode(): string {
        return this.code;
    }

    public getPlayers(): Player[] {
        return this.players;
    }

    public getDayCount(): number {
        return this.dayCount;
    }

    public setCode(code: string): void {
        this.code = code;
    }

    public setDayCount(dayCount: number): void {
        this.dayCount = dayCount;
    }

    public addPlayer(player: Player): void {
        if (this.players.length >= GameRoom.maxPlayers) {
            throw new Error("Max players limit reached");
        }
        this.players.push(player);
    }

    public removePlayer(id: string): void {
        this.players = this.players.filter(player => player.getId() !== id);
    }

    // Override di `toString()`
    toString(): string {
        return `\u001b[92m[DEBUG]\u001b[0m GameRoom: { Lobby ${this.code}: ${this.players.length} players }`;
    }
}

export default GameRoom;