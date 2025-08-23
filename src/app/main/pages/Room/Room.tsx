import React from "react";

interface RoomProps {
    roomId: string;
}

const Room = ({
    roomId
}: RoomProps) => {

    

    return (
        <div>
            <h1>Room ID: {roomId}</h1>
        </div>
    )
}

export default Room;