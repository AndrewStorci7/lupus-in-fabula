'use client'
import React, { createContext, useContext, useState, ReactNode } from "react"
import Loader from "@app/main/components/Loader/Loader"

type LoaderContextType = {
    showLoader: (text?: React.ReactNode) => void,
    hideLoader: () => void,
}

const LoaderContext = createContext<LoaderContextType | null>(null);

export const useLoader = () => {
    const context = useContext(LoaderContext);
    if (!context) {
        throw new Error('useLoader must be used within a LoaderProvider');
    }
    return context;
}; 

export const LoaderProvider = ({ children }: { children: ReactNode }) => {

    const [visibility, setVisibility] = useState<boolean>(false);
    const [text, setText] = useState<React.ReactNode | null>(null);

    const showLoader = (text?: React.ReactNode) => {
        console.log("Loader visible");
        setVisibility(true);
        setText(text);
    }

    const hideLoader = () => {
        console.log("Loader hidden");
        setVisibility(false);
        setText(null);
    }

    return (
        <LoaderContext.Provider value={{ showLoader, hideLoader }}>
            {children}
            {visibility && (
                <Loader>{text}</Loader>
            )}
        </LoaderContext.Provider>
    )
}