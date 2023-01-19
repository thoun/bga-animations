interface AnimationManagerSettings {
    /**
     * The default animation duration, in ms (default: 500).
     */
    duration?: number;
}


class AnimationManager {

    /**
     * @param game the BGA game class, usually it will be `this`
     * @param settings: a `AnimationManagerSettings` object
     */
    constructor(public game: Game, private settings: AnimationManagerSettings) {
    }

    /**
     * Attach an element to a parent, then play animation from element's origin to its new position.
     * 
     * @param element the element to animate
     * @param toElement the destination parent
     * @param fn the animation function
     * @param settings the animation settings
     * @returns a promise when animation ends
     */
    public attachWithAnimation(element: HTMLElement, toElement: HTMLElement, fn: AnimationFunction, settings?: AnimationWithOriginSettings): Promise<boolean> {
        const fromRect = element.getBoundingClientRect();
        toElement.appendChild(element);
        return fn(element, <AnimationWithOriginSettings>{
            duration: this.settings?.duration ?? 500,

            ...settings ?? {},

            game: this.game,
            fromRect
        }) ?? Promise.resolve(false);
    }

    /**
     * Attach an element to a parent with a slide animation.
     * 
     * @param card the card informations
     */
    public attachWithSlideAnimation(element: HTMLElement, toElement: HTMLElement, settings?: AnimationWithOriginSettings): Promise<boolean> {
        return this.attachWithAnimation(element, toElement, slideAnimation, settings);
    }
}