import { useState, useEffect, useRef } from 'react';

// This is a browser-only feature.
// Speech recognition instance
interface ISpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onend: () => void;
    onresult: (event: any) => void;
    start: () => void;
    stop: () => void;
    onerror: (event: any) => void;
}

// Speech recognition constructor
interface SpeechRecognitionStatic {
    new(): ISpeechRecognition;
}

// Augment the window object
interface IWindow extends Window {
    SpeechRecognition?: SpeechRecognitionStatic;
    webkitSpeechRecognition?: SpeechRecognitionStatic;
}

export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<ISpeechRecognition | null>(null);

    const start = () => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const stop = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const w = window as IWindow;
        const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported by this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'fr-FR';

        recognition.onresult = (event: any) => {
            let fullTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                fullTranscript += event.results[i][0].transcript;
            }
            setTranscript(fullTranscript);
        };

        recognition.onend = () => {
            setIsListening(false);
        };
        
        recognition.onerror = (event: any) => {
             console.error('Speech recognition error', event.error);
             setIsListening(false);
        }

        recognitionRef.current = recognition;

        return () => {
            recognitionRef.current?.stop();
        };
    }, []);

    return { isListening, transcript, start, stop, setTranscript };
};
