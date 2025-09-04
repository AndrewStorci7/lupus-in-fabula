'use client';
import React from "react";
import "./styles.css";

const Footer = ({
    roomCode,
    isConnected
}: {
    roomCode: string,
    isConnected: boolean
}) => {

    return (
        <div className="footer-connection-check center">
            <p>{roomCode} - {isConnected ? '🟢 Connesso' : '🔴 Disconnesso'}</p>
        </div>
    )
}

export default Footer;