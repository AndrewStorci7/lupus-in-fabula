import React from "react";
import "./styles.css";

const Loader = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="loader-container">
            <div className="spinner-outer">
                <div className="spinner-inner">
                    <div className="planet" />
                </div>
            </div>
            <div className="text-loader">{children}</div>
        </div>
    );
}

export default Loader;