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
interface AnimationWithAttachAndOriginSettings extends AnimationWithOriginSettings {
    /**
     * A function called after attaching the element.
     */
    afterAttach?: (element: any, toElement: any) => void;
}
/**
 * Animation function signature. Will return a promise after animation is ended. True, if animation played, false, if it didn't.
 */
declare type AnimationFunction = (element: HTMLElement, settings: AnimationSettings) => Promise<boolean>;
declare function shouldAnimate(settings?: AnimationSettings): boolean;
/**
 * Return the x and y delta, based on the animation settings;
 *
 * @param settings an `AnimationSettings` object
 * @returns a promise when animation ends
 */
declare function getDeltaCoordinates(element: HTMLElement, settings: AnimationWithOriginSettings): {
    x: number;
    y: number;
};
declare function logAnimation(element: HTMLElement, settings: AnimationSettings): Promise<boolean>;
/**
 * Linear slide of the card from origin to destination.
 *
 * @param element the element to animate. The element should be attached to the destination element before the animation starts.
 * @param settings an `AnimationSettings` object
 * @returns a promise when animation ends
 */
declare function slideAnimation(element: HTMLElement, settings: AnimationWithOriginSettings): Promise<boolean>;
/**
 * Show the element at the center of the screen
 *
 * @param element the element to animate
 * @param settings an `AnimationSettings` object
 * @returns a promise when animation ends
 */
declare function showScreenCenterAnimation(element: HTMLElement, settings: AnimationSettings): Promise<boolean>;
/**
 * Show the element at the center of the screen
 *
 * @param element the element to animate
 * @param settings an `AnimationSettings` object
 * @returns a promise when animation ends
 */
declare function pauseAnimation(element: HTMLElement, settings: AnimationSettings): Promise<boolean>;
/**
 * Linear slide of the card from origin to destination.
 *
 * @param element the element to animate. The element should be attached to the destination element before the animation starts.
 * @param settings an `AnimationSettings` object
 * @returns a promise when animation ends
 */
declare function cumulatedAnimations(element: HTMLElement, animations: AnimationFunction[], settingsOrSettingsArray?: AnimationSettings | AnimationSettings[]): Promise<boolean>;
interface AnimationManagerSettings {
    /**
     * The default animation duration, in ms (default: 500).
     */
    duration?: number;
}
declare class AnimationManager {
    game: Game;
    private settings?;
    /**
     * @param game the BGA game class, usually it will be `this`
     * @param settings: a `AnimationManagerSettings` object
     */
    constructor(game: Game, settings?: AnimationManagerSettings);
    /**
     * Attach an element to a parent, then play animation from element's origin to its new position.
     *
     * @param element the element to animate
     * @param toElement the destination parent
     * @param fn the animation function
     * @param settings the animation settings
     * @returns a promise when animation ends
     */
    attachWithAnimation(element: HTMLElement, toElement: HTMLElement, fn: AnimationFunction, settings?: AnimationWithAttachAndOriginSettings): Promise<boolean>;
    /**
     * Attach an element to a parent with a slide animation.
     *
     * @param card the card informations
     */
    attachWithSlideAnimation(element: HTMLElement, toElement: HTMLElement, settings?: AnimationWithAttachAndOriginSettings): Promise<boolean>;
    /**
     * Attach an element to a parent with a slide animation.
     *
     * @param card the card informations
     */
    attachWithShowToScreenAnimation(element: HTMLElement, toElement: HTMLElement, settingsOrSettingsArray?: AnimationSettings | AnimationSettings[]): Promise<boolean>;
    /**
     * Slide from an element.
     *
     * @param element the element to animate
     * @param fromElement the origin element
     * @param settings the animation settings
     * @returns a promise when animation ends
     */
    slideFromElement(element: HTMLElement, fromElement: HTMLElement, settings?: AnimationSettings): Promise<boolean>;
}
declare const define: any;
