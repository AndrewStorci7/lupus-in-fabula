import React from "react";
import "./styles.css"

const Underline = ({ children }: { children: React.ReactNode }) => {
    return (
        <span className="relative" >
            <span className="styled-underline"/>
            {children}
        </span>
    );
}

export default Underline;