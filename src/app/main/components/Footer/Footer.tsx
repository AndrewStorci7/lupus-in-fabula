import React from "react";
import "./style.css";

const Footer = () => {

    const currentYear = new Date().getFullYear();

    return (
        <footer className="center footer">
            <p><span>Salamaleku production (Andrea Storci)</span><br />©{currentYear} Lupus. Tutti i diritti riservati.</p>
        </footer>
    )
}

export default Footer;