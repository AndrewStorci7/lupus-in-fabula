import React from "react";
import "./styles.css";

const InfoComment = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="info-container-comment">
            <div className="info-icon" />
            {children}
        </div>
    );
};

export default InfoComment;