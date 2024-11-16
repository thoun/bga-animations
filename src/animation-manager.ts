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
    private _boundingRectIgnoresZoom;

    /**
     * @param game the BGA game class, usually it will be `this`
     * @param settings: a `AnimationManagerSettings` object
     */
    constructor(public game: Game, private settings?: AnimationManagerSettings) {
        this.zoomManager = settings?.zoomManager;

        const el = document.createElement("div");
        el.style.cssText = 'top : -1000px; left: -1000px; zoom: 0.5; width: 100px; height: 100px; position: absolute';
        document.body.appendChild(el);
        const calculatedWidth = el.getBoundingClientRect().width;
        this._boundingRectIgnoresZoom = (calculatedWidth > 75); // Chrome 128+ return 50, Safari 15 return 100
        document.body.removeChild(el);

        if (!game) {
            throw new Error('You must set your game as the first parameter of AnimationManager');
        }
    }

    public getZoomManager(): IZoomManager {
        return this.zoomManager;
    }

    /**
     * Set the zoom manager, to get the scale of the current game.
     * 
     * @param zoomManager the zoom manager
     */
    public setZoomManager(zoomManager: IZoomManager): void {
        this.zoomManager = zoomManager;
    }

    public getSettings(): AnimationManagerSettings | null | undefined {
        return this.settings;
    }
    
    /**
     * Returns if the animations are active. Animation aren't active when the window is not visible (`document.visibilityState === 'hidden'`), or `game.instantaneousMode` is true.
     * 
     * @returns if the animations are active.
     */
    public animationsActive(): boolean {
        return document.visibilityState !== 'hidden' && !(this.game as any).instantaneousMode;
    }

    /**
     * Plays an animation if the animations are active. Animation aren't active when the window is not visible (`document.visibilityState === 'hidden'`), or `game.instantaneousMode` is true.
     * 
     * @param animation the animation to play
     * @returns the animation promise.
     */
    async play(animation: BgaAnimation<BgaAnimationSettings>): Promise<BgaAnimation<BgaAnimationSettings>> {
        animation.played = animation.playWhenNoAnimation || this.animationsActive();
        if (animation.played) {
            const settings = animation.settings;

            settings.animationStart?.(animation);
            settings.element?.classList.add(settings.animationClass ?? 'bga-animations_animated');

            animation.settings = {
                duration: animation.settings?.duration ?? this.settings?.duration ?? 500,
                scale: animation.settings?.scale ?? this.zoomManager?.zoom ?? undefined,
                ...animation.settings,
            };
            animation.result = await animation.animationFunction(this, animation);

            animation.settings.animationEnd?.(animation);
            settings.element?.classList.remove(settings.animationClass ?? 'bga-animations_animated');
        } else {
            return Promise.resolve(animation);
        }
    }

    /**
     * Plays multiple animations in parallel.
     * 
     * @param animations the animations to play
     * @returns a promise for all animations.
     */
    async playParallel(animations: BgaAnimation<BgaAnimationSettings>[]): Promise<BgaAnimation<BgaAnimationSettings>[]> {
        return Promise.all(animations.map(animation => this.play(animation)));
    }

    /**
     * Plays multiple animations in sequence (the second when the first ends, ...).
     * 
     * @param animations the animations to play
     * @returns a promise for all animations.
     */
    async playSequence(animations: BgaAnimation<BgaAnimationSettings>[]): Promise<BgaAnimation<BgaAnimationSettings>[]> {
        if (animations.length) {
            const result = await this.play(animations[0]);
            const others = await this.playSequence(animations.slice(1));
            return [result, ...others];
        } else {
            return Promise.resolve([]);
        }
    }

    /**
     * Plays multiple animations with a delay between each animation start.
     * 
     * @param animations the animations to play
     * @param delay the delay (in ms)
     * @returns a promise for all animations.
     */
    async playWithDelay(animations: BgaAnimation<BgaAnimationSettings>[], delay: number): Promise<BgaAnimation<BgaAnimationSettings>[]> {
        const promise = new Promise<BgaAnimation<BgaAnimationSettings>[]>((success) => {
            let promises: Promise<BgaAnimation<BgaAnimationSettings>>[] = [];
            for (let i=0; i<animations.length; i++) {
                setTimeout(() => {
                    promises.push(this.play(animations[i]));
                    if (i == animations.length - 1) {
                        Promise.all(promises).then(result => {
                            success(result);
                        });
                    }
                }, i * delay);
            }
        });
    
        return promise;
    }

    /**
     * Attach an element to a parent, then play animation from element's origin to its new position.
     * 
     * @param animation the animation function
     * @param attachElement the destination parent
     * @returns a promise when animation ends
     */
    public attachWithAnimation(animation: BgaAnimation<BgaAnimationSettings>, attachElement: HTMLElement): Promise<BgaAnimation<any>> {
        const attachWithAnimation = new BgaAttachWithAnimation({
            animation,
            attachElement
        });
        return this.play(attachWithAnimation);
    }

    /** Returns the getBoundingClientRect ignoring the possible zoom factor linked to the autoscale.
    * Same behaviour as getBoundingClientRect/dojo.position for old browser, but the result is different for browser using the new CSS property norm (Chrome 128+, Firefox mobile)
    * 
    * @param {*} obj element or id of element
    * @returns the bounding client rect full size
    */
    public getBoundingClientRectIgnoreZoom(element: HTMLElement) : DOMRect {
        var rect = element.getBoundingClientRect();
        if (this._boundingRectIgnoresZoom)
            return rect;
        var zoomCorr = this.calcCurrentCSSZoom(element);
        rect.x /= zoomCorr;
        rect.y /= zoomCorr;
        rect.width /= zoomCorr;
        rect.height /= zoomCorr;
        return rect;
    }

    public calcCurrentCSSZoom(node){
        if (typeof node.currentCSSZoom !== "undefined")
            return node.currentCSSZoom;
        let zoom = 1.0;
        var zoomStr = window.getComputedStyle(node).getPropertyValue("zoom");

        if (zoomStr != "") {
            zoom = parseFloat(zoomStr);
        }
        const parent = node.parentElement; 
        if (parent)
            zoom = zoom * this.calcCurrentCSSZoom(parent);
            return zoom;
    }

}