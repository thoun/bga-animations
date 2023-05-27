/**
 * Framework interfaces
 */

interface Game {
    // instantaneousMode?: boolean; // cannot add it here, else TS build will say Game interface isn't fulfilled
    
    setup: (gamedatas: any) => void;
    onEnteringState: (stateName: string, args: any) => void;
    onLeavingState: (stateName: string ) => void;
    onUpdateActionButtons: (stateName: string, args: any) => void;
    setupNotifications: () => void;
    //format_string_recursive: (log: string, args: any) => void;
}

interface Notif<T> {
    args: T;
    log: string;
    move_id: number;
    table_id: string;
    time: number;
    type: string;
    uid: string;
}

type Gamestate = {
    active_player?: string;
    args: any;
    id: string;
    name: string;
    description?: string;
    descriptionmyturn?: string;
    private_state?: Gamestate;
};

interface Player {
    beginner: boolean;
    color: string;
    color_back: any | null;
    eliminated: number;
    id: string;
    is_ai: string;
    name: string;
    score: string;
    zombie: number;
}