class AnimationManager {
    //private runningAnimations: Animation[] = [];

    private base: BaseAnimationManager = new BaseAnimationManager();

    private animationSettings: AnimationManagerSettings; 

    /**
     * @param game the BGA game class, usually it will be `this`
     * @param animationSettings: a `AnimationManagerSettings` object
     */
    constructor(public game: Game, animationSettings?: AnimationManagerSettings) {
        if (!game) {
            throw new Error('You must set your game as the first parameter of AnimationManager');
        }
        
        // if the player comes from or to hidden tab, no need to finish animation
        //document.addEventListener('visibilitychange', () => this.runningAnimations.forEach(runningAnimation => runningAnimation?.finish()));

        this.animationSettings = {
            duration: 500,
            ... animationSettings
        };
    }

    /**
     * Slide an object to an element.
     */
    public async slideAndAttach(element: HTMLElement, toElement: HTMLElement, animationSettings?: SlideAnimationSettings, insertBefore?: HTMLElement): Promise<any> {
        if (!this.game.bgaAnimationsActive()) {
            this.base.attachToElement(element, toElement, insertBefore);
            return;
        }

        const allAnimationSettings = { ...this.animationSettings, ...animationSettings };

        const finalAnimationSettings: SlideAnimationSettings = {
            ...allAnimationSettings,
            parallelAnimations: [this.base.createBumpAnimation(allAnimationSettings?.bump ?? 1.2), ...allAnimationSettings?.parallelAnimations ?? []],
        }

        const fromElement = element.parentElement;
        const nextSibling = element.nextElementSibling;
        
        const fromMatrix = this.base.getFullMatrix(element);
        this.base.attachToElement(element, toElement, insertBefore);
        const toMatrix = this.base.getFullMatrix(element);
        const wrapper = this.base.wrapOnAnimationSurface(element);
        await Promise.all([
            this.base.addAnimatedSpaceIfNecessary(element, toElement, 'grow', allAnimationSettings, insertBefore),
            this.base.animateOnAnimationSurface(wrapper, fromMatrix, toMatrix, { easing: 'ease-in-out', ...finalAnimationSettings }),
            this.base.addAnimatedSpaceIfNecessary(element, fromElement, 'shrink', allAnimationSettings, nextSibling),
        ])
        .then(results => {
            // add before the filling space if it exists, else before the nextSibling
            this.base.attachToElement(element, toElement, results[0]?.animationWrapper ?? insertBefore);
            results.forEach(result => result?.animationWrapper?.remove());
        });
    }

    /**
     * Slide an object to the screen center then an element.
     */
    public async slideToScreenCenterAndAttach(element: HTMLElement, toElement: HTMLElement, animationSettings?: AnimationSettings | AnimationSettings[], insertBefore?: HTMLElement): Promise<any> {
        if (!this.game.bgaAnimationsActive()) {
            this.base.attachToElement(element, toElement, insertBefore);
            return;
        }

        if (Array.isArray(animationSettings) && animationSettings.length !== 2) {
            throw new Error('slideToScreenCenterAndAttach animationSettings array must be made of 2 elements');
        }

        const firstAnimationSettings = Array.isArray(animationSettings) ? { ...this.animationSettings, ...animationSettings[0] } : { ...this.animationSettings, ...animationSettings };
        const secondAnimationSettings = Array.isArray(animationSettings) ? { ...this.animationSettings, ...animationSettings[1] } : { ...this.animationSettings, ...animationSettings };

        const fromElement = element.parentElement;
        const nextSibling = element.nextElementSibling;
        
        const elementBR = element.getBoundingClientRect();
        const centerScreenMatrix = new DOMMatrix().translateSelf(window.scrollX + (window.innerWidth - elementBR.width) / 2, window.scrollY + (window.innerHeight - elementBR.height) / 2);
        const fromMatrix = this.base.getFullMatrix(element);
        this.base.attachToElement(element, toElement, insertBefore);
        const toMatrix = this.base.getFullMatrix(element);
        const wrapper = this.base.wrapOnAnimationSurface(element);
        const toCenter = await Promise.all([
            this.base.animateOnAnimationSurface(wrapper, fromMatrix, centerScreenMatrix, firstAnimationSettings),
            this.base.addAnimatedSpaceIfNecessary(element, fromElement, 'shrink', firstAnimationSettings, nextSibling),
        ]);
        toCenter[1]?.animationWrapper?.remove();
        
        const results = await Promise.all([
            this.base.addAnimatedSpaceIfNecessary(element, toElement, 'grow', secondAnimationSettings, insertBefore),
            this.base.animateOnAnimationSurface(wrapper, centerScreenMatrix, toMatrix, secondAnimationSettings),
        ]);
        
        // add before the filling space if it exists, else before the nextSibling
        this.base.attachToElement(element, toElement, results[0]?.animationWrapper ?? insertBefore);
        results.forEach(result => result?.animationWrapper?.remove());
    }

    /**
     * Slide an object over an intermediate element then attach to an element.
     */
    public async slideToElementAndAttach(element: HTMLElement, overElement: HTMLElement, toElement: HTMLElement, animationSettings?: AnimationSettings | AnimationSettings[], insertBefore?: HTMLElement): Promise<any> {
        if (!this.game.bgaAnimationsActive()) {
            this.base.attachToElement(element, toElement, insertBefore);
            return;
        }

        if (Array.isArray(animationSettings) && animationSettings.length !== 2) {
            throw new Error('slideToScreenCenterAndAttach animationSettings array must be made of 2 elements');
        }

        const firstAnimationSettings = Array.isArray(animationSettings) ? { ...this.animationSettings, ...animationSettings[0] } : { ...this.animationSettings, ...animationSettings };
        const secondAnimationSettings = Array.isArray(animationSettings) ? { ...this.animationSettings, ...animationSettings[1] } : { ...this.animationSettings, ...animationSettings };

        const fromElement = element.parentElement;
        const nextSibling = element.nextElementSibling;
        
        const fromMatrix = this.base.getFullMatrix(element);
        this.base.attachToElement(element, toElement, insertBefore);
        const toMatrix = this.base.getFullMatrix(element);
        const wrapper = this.base.wrapOnAnimationSurface(element);
        const overElementMatrix = this.base.getFullMatrixFromElementCenter(wrapper, overElement);
        const toCenter = await Promise.all([
            this.base.animateOnAnimationSurface(wrapper, fromMatrix, overElementMatrix, firstAnimationSettings),
            this.base.addAnimatedSpaceIfNecessary(element, fromElement, 'shrink', firstAnimationSettings, nextSibling),
        ]);
        toCenter[1]?.animationWrapper?.remove();
        
        const results = await Promise.all([
            this.base.addAnimatedSpaceIfNecessary(element, toElement, 'grow', secondAnimationSettings, insertBefore),
            this.base.animateOnAnimationSurface(wrapper, overElementMatrix, toMatrix, secondAnimationSettings),
        ]);
        
        // add before the filling space if it exists, else before the nextSibling
        this.base.attachToElement(element, toElement, results[0]?.animationWrapper ?? insertBefore);
        results.forEach(result => result?.animationWrapper?.remove());
    }

    /**
     * Slide an object in. The object must be attached to the destination before.
     */
    public async slideIn(element: HTMLElement, fromElement?: HTMLElement, animationSettings?: FloatingPieceAnimationSettings): Promise<any> {
        if (!this.game.bgaAnimationsActive()) {
            return;
        }

        const allAnimationSettings = { ...this.animationSettings, ...animationSettings };

        const parentElement = element.parentElement;
        const nextSibling = element.nextElementSibling;
        
        const elementMatrix = this.base.getFullMatrix(element);
        const wrapper = this.base.wrapOnAnimationSurface(element);
        
        const fromMatrix = fromElement ? 
            this.base.getFullMatrixFromElementCenter(wrapper, fromElement, animationSettings?.ignoreScale ?? false, animationSettings?.ignoreRotation ?? true)
            : elementMatrix;

        const promises = [
            this.base.addAnimatedSpaceIfNecessary(element, parentElement, 'grow', allAnimationSettings, nextSibling),
            this.base.animateOnAnimationSurface(wrapper, fromMatrix, elementMatrix, { easing: 'ease-out', ...allAnimationSettings }),
        ];

        await Promise.all(promises)
        .then(results => {
            // add before the filling space if it exists, else before the nextSibling
            this.base.attachToElement(element, parentElement, results[0]?.animationWrapper ?? nextSibling);
            results.forEach(result => result?.animationWrapper?.remove());
        });
    }

    /**
     * Fade an object in. The object must be attached to the destination before.
     */
    public async fadeIn(element: HTMLElement, fromElement?: HTMLElement, animationSettings?: AnimationSettings): Promise<any> {
        if (!this.game.bgaAnimationsActive()) {
            return;
        }

        const allAnimationSettings = { ...this.animationSettings, ...animationSettings };
        const finalAnimationSettings: SlideAnimationSettings = {
            ...allAnimationSettings,
            parallelAnimations: [this.base.createFadeAnimation('in'), ...animationSettings?.parallelAnimations ?? []],
        }

        await this.slideIn(element, fromElement, finalAnimationSettings);
    }

    /**
     * Fade out an object and destroy it. It call be called with a toElment, in that case a slide animation will be triggered.
     */
    public async fadeOutAndDestroy(element: HTMLElement, toElement?: HTMLElement, animationSettings?: AnimationSettings): Promise<any> {
        if (!this.game.bgaAnimationsActive()) {
            element.remove();
            return;
        }

        const allAnimationSettings = { ...this.animationSettings, ...animationSettings };
        const finalAnimationSettings: SlideAnimationSettings = {
            ...allAnimationSettings,
            parallelAnimations: [this.base.createFadeAnimation('out'), ...animationSettings?.parallelAnimations ?? []],
        }

        const fromElement = element.parentElement;
        const nextSibling = element.nextElementSibling;
        
        const fromMatrix = this.base.getFullMatrix(element);
        const wrapper = this.base.wrapOnAnimationSurface(element);
        wrapper.style.transform = fromMatrix.toString();

        const toMatrix = toElement ? this.base.getFullMatrix(toElement) : fromMatrix;

        await Promise.all([
            this.base.addAnimatedSpaceIfNecessary(element, fromElement, 'shrink', animationSettings, nextSibling),
            this.base.animateOnAnimationSurface(wrapper, fromMatrix, toMatrix, { easing: 'ease-in', ...this.animationSettings, ...finalAnimationSettings }),
        ])
        .then(results => {
            element.remove();
            results.forEach(result => result?.animationWrapper?.remove());
        });
    }

    /**
     * Add a floating element over another element.
     */
    public async slideFloatingElement(element: HTMLElement, fromElement: HTMLElement | null | undefined, toElement: HTMLElement, animationSettings?: FloatingPieceAnimationSettings): Promise<any> {
        if (!this.game.bgaAnimationsActive()) {
            return;
        }

        const allAnimationSettings = { ...this.animationSettings, ...animationSettings };

        // before computation, to we able to get clientWidth/clientHeight
        const wrapper = this.base.wrapOnAnimationSurface(element);

        const toMatrix = this.base.getFullMatrixFromElementCenter(wrapper, toElement, allAnimationSettings.ignoreScale ?? true, allAnimationSettings.ignoreRotation ?? true);
        const fromMatrix = fromElement ?
            this.base.getFullMatrixFromElementCenter(wrapper, fromElement, allAnimationSettings.ignoreScale ?? true, allAnimationSettings.ignoreRotation ?? true) :
            toMatrix;
        
        const promises = [
            this.base.animateOnAnimationSurface(wrapper, fromMatrix, toMatrix, { easing: 'ease-out', ...allAnimationSettings }),
        ];

        await Promise.all(promises)
        .then(results => {
            element.remove();
            results.forEach(result => result?.animationWrapper?.remove());
        });
    }

    /**
     * Add a floating element over another element.
     */
    public async addFloatingElement(element: HTMLElement, toElement: HTMLElement, animationSettings?: FloatingPieceAnimationSettings): Promise<any> {
        return this.slideFloatingElement(element, null, toElement, { bump: null, ...animationSettings });
    }

    public playParallel(animations: ((index: number) => Promise<any>)[]): Promise<any> {
        return Promise.all(
            animations.map((animation, index) => animation(index))
        );
    }

    public playSequentially(animations: (() => Promise<any>)[]): Promise<any> {
        return animations.reduce(
          (prevPromise, animation) => prevPromise.then(() => animation()),
          Promise.resolve()
        );
    }

    public playInterval(animations: ((index: number) => Promise<any>)[], interval: number = this.animationSettings.duration / 4): Promise<void> {
        return new Promise((resolve) => {
            if (animations.length === 0) {
                resolve();
                return;
            }
        
            let index = 0;
            const promises: Promise<any>[] = [
                animations[index](index),
            ];
            index++;
        
            const intervalId = setInterval(() => {
                if (index >= animations.length) {
                    clearInterval(intervalId);
                    Promise.all(promises).then(() => resolve());
                    return;
                }
            
                promises.push(animations[index](index));
                index++;
            }, interval);
        });
    }
}