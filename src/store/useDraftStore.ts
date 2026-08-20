import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DraftState {
    content: {
        topic: string;
        tone: string;
        audience: string;
        channelStyle: string;
        uniqueAngle: string;
    };
    script: {
        topic: string;
        duration: string;
        style: string;
        audience: string;
        channelStyle: string;
        uniqueAngle: string;
    };
    keywords: {
        keyword: string;
    };
    vision: {
        title: string;
    };
    setContentDraft: (data: Partial<DraftState['content']>) => void;
    setScriptDraft: (data: Partial<DraftState['script']>) => void;
    setKeywordsDraft: (data: Partial<DraftState['keywords']>) => void;
    setVisionDraft: (data: Partial<DraftState['vision']>) => void;
}

export const useDraftStore = create<DraftState>()(
    persist(
        (set) => ({
            content: {
                topic: "",
                tone: "professional",
                audience: "",
                channelStyle: "",
                uniqueAngle: "",
            },
            script: {
                topic: "",
                duration: "10",
                style: "educational",
                audience: "",
                channelStyle: "",
                uniqueAngle: "",
            },
            keywords: {
                keyword: "",
            },
            vision: {
                title: "",
            },
            setContentDraft: (data) => 
                set((state) => ({ content: { ...state.content, ...data } })),
            setScriptDraft: (data) => 
                set((state) => ({ script: { ...state.script, ...data } })),
            setKeywordsDraft: (data) => 
                set((state) => ({ keywords: { ...state.keywords, ...data } })),
            setVisionDraft: (data) => 
                set((state) => ({ vision: { ...state.vision, ...data } })),
        }),
        {
            name: 'tubepulse-draft-storage', // key in localStorage
        }
    )
);
