import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function POST() {
    const code = randomBytes(3).toString("hex").toUpperCase();

    return NextResponse.json({
        code: 0,
        message: "Lobby created successfully",
        data: {
            gameCode: code
        }
    })
}