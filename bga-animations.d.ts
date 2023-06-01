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
    fromDelta?: {
        x: number;
        y: number;
    };
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
declare class BgaAnimation<T extends BgaAnimationSettings> implements IBgaAnimation<BgaAnimationSettings> {
    animationFunction: BgaAnimationFunction;
    settings: T;
    played: boolean | null;
    result: any | null;
    playWhenNoAnimation: boolean;
    constructor(animationFunction: BgaAnimationFunction, settings: T);
}
declare function shouldAnimate(settings?: BgaAnimationSettings): boolean;
/**
 * Return the x and y delta, based on the animation settings;
 *
 * @param settings an `AnimationSettings` object
 * @returns a promise when animation ends
 */
declare function getDeltaCoordinates(element: HTMLElement, settings: BgaAnimationWithOriginSettings): {
    x: number;
    y: number;
};
declare function logAnimation(animationManager: AnimationManager, animation: IBgaAnimation<BgaCumulatedAnimationsSettings>): Promise<any>;
/**
 * Slide of the element from origin to destination.
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
declare function slideAnimation(animationManager: AnimationManager, animation: IBgaAnimation<BgaElementAnimationSettings>): Promise<void>;
declare class BgaSlideAnimation<BgaAnimationWithAttachAndOriginSettings> extends BgaAnimation<any> {
    constructor(settings: BgaAnimationWithAttachAndOriginSettings);
}
/**
 * Slide of the element from destination to origin.
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
declare function slideToAnimation(animationManager: AnimationManager, animation: IBgaAnimation<BgaElementAnimationSettings>): Promise<void>;
declare class BgaSlideToAnimation<BgaAnimationWithAttachAndOriginSettings> extends BgaAnimation<any> {
    constructor(settings: BgaAnimationWithAttachAndOriginSettings);
}
/**
 * Show the element at the center of the screen
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
declare function showScreenCenterAnimation(animationManager: AnimationManager, animation: IBgaAnimation<BgaElementAnimationSettings>): Promise<void>;
declare class BgaShowScreenCenterAnimation<BgaAnimation> extends BgaAnimation<any> {
    constructor(settings: BgaAnimation);
}
/**
 * Just does nothing for the duration
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
declare function pauseAnimation(animationManager: AnimationManager, animation: IBgaAnimation<BgaAnimationSettings>): Promise<void>;
declare class BgaPauseAnimation<BgaAnimation> extends BgaAnimation<any> {
    constructor(settings: BgaAnimation);
}
interface BgaAttachWithAnimationSettings extends BgaElementAnimationSettings {
    animation: BgaAnimation<BgaAnimationWithOriginSettings>;
    /**
     * The target to attach the element to.
     */
    attachElement: HTMLElement;
    /**
     * A function called after attaching the element.
     */
    afterAttach?: (element: HTMLElement, attachElement: HTMLElement) => void;
}
/**
 * Just use playSequence from animationManager
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
declare function attachWithAnimation(animationManager: AnimationManager, animation: IBgaAnimation<BgaAttachWithAnimationSettings>): Promise<any>;
declare class BgaAttachWithAnimation<BgaAnimationWithAttachAndOriginSettings> extends BgaAnimation<any> {
    constructor(settings: BgaAnimationWithAttachAndOriginSettings);
}
interface BgaCumulatedAnimationsSettings extends BgaAnimationSettings {
    animations: IBgaAnimation<BgaAnimationSettings>[];
}
/**
 * Just use playSequence from animationManager
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
declare function cumulatedAnimations(animationManager: AnimationManager, animation: IBgaAnimation<BgaCumulatedAnimationsSettings>): Promise<any>;
declare class BgaCumulatedAnimation<BgaCumulatedAnimationsSettings> extends BgaAnimation<any> {
    constructor(settings: BgaCumulatedAnimationsSettings);
}
interface IZoomManager {
    /**
     * Returns the zoom level
     */
    zoom: number;
}
interface AnimationManagerSettings {
    /**
     * The default animation duration, in ms (default: 500).
     */
    duration?: number;
    /**
     * The zoom manager, providing the current scale.
     */
    zoomManager?: IZoomManager;
}
declare class AnimationManager {
    game: Game;
    private settings?;
    /**
     * The zoom manager, providing the current scale.
     */
    private zoomManager?;
    /**
     * @param game the BGA game class, usually it will be `this`
     * @param settings: a `AnimationManagerSettings` object
     */
    constructor(game: Game, settings?: AnimationManagerSettings);
    getZoomManager(): IZoomManager;
    /**
     * Set the zoom manager, to get the scale of the current game.
     *
     * @param zoomManager the zoom manager
     */
    setZoomManager(zoomManager: IZoomManager): void;
    getSettings(): AnimationManagerSettings | null | undefined;
    /**
     * Returns if the animations are active. Animation aren't active when the window is not visible (`document.visibilityState === 'hidden'`), or `game.instantaneousMode` is true.
     *
     * @returns if the animations are active.
     */
    animationsActive(): boolean;
    /**
     * Plays an animation if the animations are active. Animation aren't active when the window is not visible (`document.visibilityState === 'hidden'`), or `game.instantaneousMode` is true.
     *
     * @param animation the animation to play
     * @returns the animation promise.
     */
    play(animation: BgaAnimation<BgaAnimationSettings>): Promise<BgaAnimation<BgaAnimationSettings>>;
    /**
     * Plays multiple animations in parallel.
     *
     * @param animations the animations to play
     * @returns a promise for all animations.
     */
    playParallel(animations: BgaAnimation<BgaAnimationSettings>[]): Promise<BgaAnimation<BgaAnimationSettings>[]>;
    /**
     * Plays multiple animations in sequence (the second when the first ends, ...).
     *
     * @param animations the animations to play
     * @returns a promise for all animations.
     */
    playSequence(animations: BgaAnimation<BgaAnimationSettings>[]): Promise<BgaAnimation<BgaAnimationSettings>[]>;
    /**
     * Plays multiple animations with a delay between each animation start.
     *
     * @param animations the animations to play
     * @param delay the delay (in ms)
     * @returns a promise for all animations.
     */
    playWithDelay(animations: BgaAnimation<BgaAnimationSettings>[], delay: number): Promise<BgaAnimation<BgaAnimationSettings>[]>;
    /**
     * Attach an element to a parent, then play animation from element's origin to its new position.
     *
     * @param animation the animation function
     * @param attachElement the destination parent
     * @returns a promise when animation ends
     */
    attachWithAnimation(animation: BgaAnimation<BgaAnimationSettings>, attachElement: HTMLElement): Promise<BgaAnimation<any>>;
}
declare const define: any;
