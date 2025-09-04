'use client';
import React from "react";
import "./styles.css";

const GameRules = () => {
    return (
        <div className="game-rules">
            <h2 style={{ marginBottom: 5 }}>Regole del gioco</h2>
            <section>
                <h4>Il Narratore (o Moderatore)</h4>
                <p>Il narratore è il cuore del gioco: <b>non partecipa come giocatore</b>, ma dirige l'intero svolgimento. È l’unico a conoscere l’identità di ciascun giocatore. Conduce le fasi di <b>“notte”</b> e di <b>“giorno”</b>, dà il via ai diversi ruoli speciali, annuncia le vittime della notte e coordina le votazioni diurne.</p>
            </section>
            <section>
                <h4>Il Lupo (o i Lupi Mannari)</h4>
                <p>
                    Di notte, il narratore <b>“sveglia” i lupi</b>, che aprono gli occhi, si riconoscono (nei giochi standard) e designano segretamente una vittima da sbranare. Se la vittima è protetta, nessuno viene ucciso.<br/>
                    Di giorno, il villaggio discute per individuare i lupi e votare chi eliminare (linciaggio). Se i lupi riescono a raggiungere la parità numerica con gli umani o eliminarli tutti, vincono.
                </p>
            </section>
            <section>
                <h4>Il Veggente</h4>
                <p>
                    Il veggente è un personaggio <b>“buono”</b>. Ogni notte, il narratore lo sveglia: indica un giocatore, e riceve dal narratore una risposta (spesso solo con un cenno) su <b>se il prescelto sia un lupo o no</b>. Può usare questa informazione durante il dibattito diurno per guidare le accuse—ma con cautela, perché i lupi possono fingersi veggenti!
                </p>
            </section>
            <section>
                <h4>La Guardia (Guardia del Corpo)</h4>
                <p>
                    Anche la guardia è un ruolo <b>“buono”</b>. Ogni notte, viene svegliata e <b>sceglie un giocatore da proteggere</b> (non può proteggere sé stessa). Se i lupi scelgono come vittima la persona protetta, questa rimane salva. Tuttavia: <b>se la guardia protegge un lupo, muore lei</b>.
                </p>
            </section>
            <section>
                <h4>Il Necromante</h4>
                <p>
                    Questo ruolo è presente nella <b>Edizione “Luna Piena”</b> (variante più completa di Lupus in Tabula, molto simile a Lupus in fabula esteso). Ogni notte, il necromante può <b>resuscitare un giocatore morto</b>, facendolo tornare in gioco come vivo.<br/>
                    È un ruolo potente e suggestivo, ma disponibile solo in varianti avanzate, non nella versione base.
                </p>
            </section>
        </div>
    );
};

export default GameRules;
