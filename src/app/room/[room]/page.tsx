"use client";
import Room from "@app/main/pages/Room/Room";
import { LoaderProvider, RoomSettingsProvider } from "@providers";
import { useParams } from "next/navigation";

export default function RoomPage() {
    const params = useParams<{ room: string }>();
    const roomCode = params.room;

    return (
        <LoaderProvider>
            <RoomSettingsProvider>
                <Room roomCode={roomCode} />
            </RoomSettingsProvider>
        </LoaderProvider>
    );
}