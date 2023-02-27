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


class AnimationManager {
    /**
     * The zoom manager, providing the current scale.
     */
    private zoomManager?: IZoomManager;

    /**
     * @param game the BGA game class, usually it will be `this`
     * @param settings: a `AnimationManagerSettings` object
     */
    constructor(public game: Game, private settings?: AnimationManagerSettings) {
        this.zoomManager = settings?.zoomManager;
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
    public attachWithAnimation(element: HTMLElement, toElement: HTMLElement, fn: AnimationFunction, settings?: AnimationWithAttachAndOriginSettings): Promise<boolean> {
        const fromRect = element.getBoundingClientRect();
        toElement.appendChild(element);
        settings?.afterAttach?.(element, toElement);
        return fn(element, <AnimationWithOriginSettings>{
            duration: this.settings?.duration ?? 500,
            scale: this.zoomManager?.zoom ?? undefined,

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
    public attachWithSlideAnimation(element: HTMLElement, toElement: HTMLElement, settings?: AnimationWithAttachAndOriginSettings): Promise<boolean> {
        return this.attachWithAnimation(element, toElement, slideAnimation, settings);
    }

    /**
     * Attach an element to a parent with a slide animation.
     * 
     * @param card the card informations
     */
    public attachWithShowToScreenAnimation(element: HTMLElement, toElement: HTMLElement, settingsOrSettingsArray?: AnimationSettings | AnimationSettings[]): Promise<boolean> {
        const cumulatedAnimation: AnimationFunction = (element: HTMLElement, settings: AnimationSettings) => cumulatedAnimations(
            element,
            [
                showScreenCenterAnimation,
                pauseAnimation,
                (element) => this.attachWithSlideAnimation(
                    element,
                    toElement
                ),
            ],
            settingsOrSettingsArray,
        );

        return this.attachWithAnimation(element, toElement, cumulatedAnimation, null);
    }

    /**
     * Slide from an element.
     * 
     * @param element the element to animate
     * @param fromElement the origin element
     * @param settings the animation settings
     * @returns a promise when animation ends
     */
    public slideFromElement(element: HTMLElement, fromElement: HTMLElement, settings?: AnimationSettings): Promise<boolean> {
        return slideAnimation(element, <AnimationWithOriginSettings>{
            duration: this.settings?.duration ?? 500,
            scale: this.zoomManager?.zoom ?? undefined,

            ...settings ?? {},

            game: this.game,
            fromElement
        }) ?? Promise.resolve(false);
    }

    /**
     * Set the zoom manager, to get the scale of the current game.
     * 
     * @param zoomManager the zoom manager
     */
    public setZoomManager(zoomManager: IZoomManager): void {
        this.zoomManager = zoomManager;
    }

}