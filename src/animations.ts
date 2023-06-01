interface BgaAnimationSettings {
    /**
     * The element to animate.
     */
    element?: HTMLElement;

    /**
     * The game class. Used to know if the game is in instantaneous mode (replay) becausewe don't want animations in this case.
     */
    game?: Game;

    /**
     * The animation duration, in ms (default: 500).
     */
    duration?: number;

    /**
     * The animation CSS timing function, 'linear', 'ease-in-out' (default: linear).
     */
    transitionTimingFunction?: string;

    /**
     * The cumulated scale of the element to animate (default: 1).
     */
    scale?: number;

    /**
     * The class to add to the animated element.
     */
    animationClass?: string;

    /**
     * A function called when animation starts (for example to add a zoom effect on a card during a reveal animation).
     */
    animationStart?: (animation: IBgaAnimation<BgaAnimationSettings>) => any;

    /**
     * A function called when animation ends.
     */
    animationEnd?: (animation: IBgaAnimation<BgaAnimationSettings>) => any;
}

interface BgaElementAnimationSettings extends BgaAnimationSettings {  
    /**
     * The element to animate.
     */
    element: HTMLElement;

    /**
     * The zIndex to apply during animation (default: 10).
     */
    zIndex?: number;

    /**
     * The transform property to set after the animation.
     */
    finalTransform?: string;

    /**
     * If the card is rotated at the start of animation.
     */
    rotationDelta?: number;
}

interface BgaAnimationWithOriginSettings extends BgaElementAnimationSettings {

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

interface IBgaAnimation<T extends BgaAnimationSettings> {
    settings: T;
    played: boolean | null;
    result: any | null;

    playWhenNoAnimation: boolean;
}

/**
 * Animation function signature. Will return a promise after animation is ended. The promise returns the result of the animation, if any
 */
type BgaAnimationFunction = (animationManager: AnimationManager, animation: IBgaAnimation<BgaAnimationSettings>) => Promise<any>;

class BgaAnimation<T extends BgaAnimationSettings> implements IBgaAnimation<BgaAnimationSettings> {
    public played: boolean | null = null;
    public result: any | null = null;

    public playWhenNoAnimation: boolean = false;

    constructor(
        public animationFunction: BgaAnimationFunction,
        public settings: T,
    ) {}
}