interface AnimationSettings {    
    /**
     * The game class. Used to know if the game is in instantaneous mode (replay) becausewe don't want animations in this case.
     */
    game?: Game;

    /**
     * The animation duration, in ms (default: 500).
     */
    duration?: number;

    /**
     * The cumulated scale of the element to animate (default: 1).
     */
    scale?: number;

    /**
     * The zIndex to apply during animation (default: 10).
     */
    zIndex?: number;

    /**
     * The transform property to set after the animation.
     */
    finalTransform?: string;

    /**
     * A function called when animation starts (for example to add a 'animated' class).
     */
    animationStart?: (element: HTMLElement) => any;

    /**
     * A function called when animation ends (for example to add a 'animated' class).
     */
    animationEnd?: (element: HTMLElement) => any;

    /**
     * If the card is rotated at the start of animation.
     */
    rotationDelta?: number;
}

interface AnimationWithOriginSettings extends AnimationSettings {

    /**
     * A delta coordinates (object with x and y properties).
     */
    fromDelta?: {x: number, y: number};

    /**
     * An initial Rect position. Can be the moved object BoundingClientRect itself, before being attached.
     */
    fromRect?: DOMRect;

    /**
     * The element to move the card from.
     */
    fromElement?: HTMLElement;
}

interface AnimationWithAttachAndOriginSettings extends AnimationWithOriginSettings {
    /**
     * A function called after attaching the element.
     */
    afterAttach?: (element, toElement) => void;
}

/**
 * Animation function signature. Will return a promise after animation is ended. True, if animation played, false, if it didn't.
 */
type AnimationFunction = (element: HTMLElement, settings: AnimationSettings) => Promise<boolean>;
