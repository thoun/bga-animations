class AnimationManager {
    //private runningAnimations: Animation[] = [];

    public base: BaseAnimationManager = new BaseAnimationManager();

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
            return null;
        }
        const runningAnimation = this.base.startAttachAnimation(element, toElement, insertBefore);
        const { fromParent, fromNextSibling, wrapper, fromMatrix, toMatrix } = runningAnimation;

        const allAnimationSettings = { ...this.animationSettings, ...animationSettings };

        const finalAnimationSettings: SlideAnimationSettings = {
            ...allAnimationSettings,
            parallelAnimations: [this.base.createBumpAnimation(allAnimationSettings?.bump ?? 1.2), ...allAnimationSettings?.parallelAnimations ?? []],
        }
        
        await Promise.all([
            this.base.addAnimatedSpaceIfNecessary(element, toElement, 'grow', allAnimationSettings, insertBefore),
            this.base.animateOnAnimationSurface(wrapper, fromMatrix, toMatrix, { easing: 'ease-in-out', ...finalAnimationSettings }),
            this.base.addAnimatedSpaceIfNecessary(element, fromParent, 'shrink', allAnimationSettings, fromNextSibling),
        ])
        .then(results => {
            runningAnimation.toSpaceWrapper = results[0].animationWrapper;
            runningAnimation.wrappersToRemove.push(...results.map(result => result.animationWrapper));
            this.base.endRunningAnimation(runningAnimation);
        });
    }


    /**
     * Swap two elements.
     */
    public async swap(elements: HTMLElement[], animationSettings?: SlideAnimationSettings): Promise<any> {
        if (elements.length !== 2) {
            throw new Error('AnimationManager.swap must be called with exactly 2 elements.');
        }

        const parents = elements.map(element => element.parentElement);
        const nextSiblings = elements.map(element => element.nextElementSibling);

        if (!this.game.bgaAnimationsActive()) {
            elements.forEach((element, index) => this.base.attachToElement(element, parents[1 - index], nextSiblings[1 - index]));
            return;
        }

        const allAnimationSettings = { ...this.animationSettings, ...animationSettings };

        const finalAnimationSettings: SlideAnimationSettings = {
            ...allAnimationSettings,
            parallelAnimations: [this.base.createBumpAnimation(allAnimationSettings?.bump ?? 1.2), ...allAnimationSettings?.parallelAnimations ?? []],
        }

        const matrixes = elements.map(element => this.base.getFullMatrix(element));
        const wrappers = elements.map(element => this.base.wrapOnAnimationSurface(element));
        
        await Promise.all(elements.map((element, index) => Promise.all([
            { animationWrapper: this.base.addFixedSpace(element, parents[1 - index], nextSiblings[1 - index]) } as SurfaceAnimationResult,
            this.base.animateOnAnimationSurface(wrappers[index], matrixes[index], matrixes[1 - index], { easing: 'ease-in-out', ...finalAnimationSettings }),
            //this.base.addAnimatedSpaceIfNecessary(element, fromElement, 'shrink', allAnimationSettings, nextSibling),
        ])
        .then(results => {
            // add before the filling space if it exists, else before the nextSibling
            this.base.attachToElement(element, parents[1 - index], results[0]?.animationWrapper ?? nextSiblings[1 - index]);
            results.forEach(result => result?.animationWrapper?.remove());
        })));
    }
    
    /**
     * Play a list of animations then attach to an element.
     */
    public async sequenceAnimationsAttach(element: HTMLElement, toElement: HTMLElement, animations: ((runningAnimation: RunningAnimation, animationSettings?: AnimationSettings) => Promise<RunningAnimation>)[], animationSettings?: AnimationSettings | AnimationSettings[], insertBefore?: HTMLElement): Promise<any> {
        if (!this.game.bgaAnimationsActive()) {
            this.base.attachToElement(element, toElement, insertBefore);
            return null;
        }
        let runningAnimation = this.base.startAttachAnimation(element, toElement, insertBefore);

        if (Array.isArray(animationSettings) && animationSettings.length !== animations.length) {
            throw new Error('slideToScreenCenterAndAttach animationSettings array must be made of as many elements as animations');
        }

        for (let index = 0; index < animations.length; index++) {
            const currentAnimation = animations[index];
            const currentAnimationSettings = Array.isArray(animationSettings) ? { ...this.animationSettings, ...animationSettings[index] } : { ...this.animationSettings, ...animationSettings };
            
            const promises: Promise<any>[] = [
                currentAnimation(runningAnimation, currentAnimationSettings),
            ];            
            if (index === 0) { // shrinking animation
                promises.push(this.base.addAnimatedSpaceIfNecessary(element, runningAnimation.fromParent, 'shrink', currentAnimationSettings, runningAnimation.fromNextSibling));
            }
            if (index === animations.length - 1) {
                promises.push(this.base.addAnimatedSpaceIfNecessary(element, toElement, 'grow', currentAnimationSettings, insertBefore));
            }

            const results = await Promise.all(promises);

            if (index === 0) { // remove shrinking animation
                results[1]?.animationWrapper?.remove();
            }
            if (index === animations.length - 1) {
                runningAnimation.toSpaceWrapper = results[animations.length - 1]?.animationWrapper;
                runningAnimation.wrappersToRemove.push(...results.map(result => result.animationWrapper));
            }
            
            runningAnimation = results[0];
        }
        this.base.endRunningAnimation(runningAnimation);
    }

    /**
     * Slide an object to the screen center then an element.
     */
    public async slideToScreenCenterAndAttach(element: HTMLElement, toElement: HTMLElement, animationSettings?: AnimationSettings | AnimationSettings[], insertBefore?: HTMLElement): Promise<any> {
        const elementBR = element.getBoundingClientRect();
        const centerScreenMatrix = new DOMMatrix().translateSelf(window.scrollX + (window.innerWidth - elementBR.width) / 2, window.scrollY + (window.innerHeight - elementBR.height) / 2);

        const toCenterScreen = async (runningAnimation: RunningAnimation, animationSettings?: AnimationSettings) => {
            await this.base.animateOnAnimationSurface(runningAnimation.wrapper, runningAnimation.fromMatrix, centerScreenMatrix, animationSettings);
            runningAnimation.fromMatrix = centerScreenMatrix;
            return runningAnimation;
        };

        const toFinalPlace = async (runningAnimation: RunningAnimation, animationSettings?: AnimationSettings) => {
            await this.base.animateOnAnimationSurface(runningAnimation.wrapper, runningAnimation.fromMatrix, runningAnimation.toMatrix, animationSettings);
            return runningAnimation;
        };

        return await this.sequenceAnimationsAttach(element, toElement, [
            toCenterScreen, 
            toFinalPlace, 
        ], animationSettings, insertBefore);
    }

    /**
     * Slide an object over an intermediate element then attach to an element.
     */
    public async slideToElementAndAttach(element: HTMLElement, overElement: HTMLElement, toElement: HTMLElement, animationSettings?: AnimationSettings | AnimationSettings[], insertBefore?: HTMLElement): Promise<any> {
        const overElementMatrix = this.base.getFullMatrixFromElementCenter(overElement);

        const toCenterScreen = async (runningAnimation: RunningAnimation, animationSettings?: AnimationSettings) => {
            await this.base.animateOnAnimationSurface(runningAnimation.wrapper, runningAnimation.fromMatrix, overElementMatrix, animationSettings);
            runningAnimation.fromMatrix = overElementMatrix;
            return runningAnimation;
        };

        const toFinalPlace = async (runningAnimation: RunningAnimation, animationSettings?: AnimationSettings) => {
            await this.base.animateOnAnimationSurface(runningAnimation.wrapper, runningAnimation.fromMatrix, runningAnimation.toMatrix, animationSettings);
            return runningAnimation;
        };

        return await this.sequenceAnimationsAttach(element, toElement, [
            toCenterScreen, 
            toFinalPlace, 
        ], animationSettings, insertBefore);
    }

    /**
     * Slide an object in. The object must be attached to the destination before.
     */
    public async slideIn(element: HTMLElement, fromElement?: HTMLElement, animationSettings?: FloatingPieceAnimationSettings): Promise<any> {
        if (!this.game.bgaAnimationsActive()) {
            return;
        }

        const runningAnimation = this.base.startSlideInAnimation(element, fromElement, animationSettings?.ignoreScale ?? true, animationSettings?.ignoreRotation ?? true);
        const { toParent, toNextSibling, wrapper, fromMatrix, toMatrix } = runningAnimation;

        const allAnimationSettings = { ...this.animationSettings, ...animationSettings };

        const promises = [
            this.base.addAnimatedSpaceIfNecessary(element, toParent, 'grow', allAnimationSettings, toNextSibling),
            this.base.animateOnAnimationSurface(wrapper, fromMatrix, toMatrix, { easing: 'ease-out', ...allAnimationSettings }),
        ];

        await Promise.all(promises)
        .then(results => {
            runningAnimation.toSpaceWrapper = results[0].animationWrapper;
            runningAnimation.wrappersToRemove.push(...results.map(result => result.animationWrapper));
            this.base.endRunningAnimation(runningAnimation);
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

        const runningAnimation = this.base.startSlideOutAnimation(element, toElement, false, false);
        const { wrapper, fromMatrix, toMatrix } = runningAnimation;

        await Promise.all([
            this.base.addAnimatedSpaceIfNecessary(element, runningAnimation.fromParent, 'shrink', animationSettings, runningAnimation.fromNextSibling),
            this.base.animateOnAnimationSurface(wrapper, fromMatrix, toMatrix, { easing: 'ease-in', ...this.animationSettings, ...finalAnimationSettings }),
        ])
        .then(results => {
            element.remove();
            runningAnimation.element = null;
            runningAnimation.wrappersToRemove.push(...results.map(result => result.animationWrapper));
            this.base.endRunningAnimation(runningAnimation);
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

        const toMatrix = this.base.getFullMatrixFromElementCenter(toElement, allAnimationSettings.ignoreScale ?? true, allAnimationSettings.ignoreRotation ?? true);
        const fromMatrix = fromElement ?
            this.base.getFullMatrixFromElementCenter(fromElement, allAnimationSettings.ignoreScale ?? true, allAnimationSettings.ignoreRotation ?? true) :
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

    /**
     * Play multiple animations a the same time.
     * 
     * @param animations functions generating an animation, returning a Promise.
     * @returns promise when all animations ends
     */
    public playParallel(animations: ((index: number) => Promise<any>)[]): Promise<any> {
        return Promise.all(
            animations.map((animation, index) => animation(index))
        );
    }

    /**
     * Play multiple animations one after the other.
     * 
     * @param animations functions generating an animation, returning a Promise.
     * @returns promise when all animations ends
     */
    public playSequentially(animations: (() => Promise<any>)[]): Promise<any> {
        return animations.reduce(
          (prevPromise, animation) => prevPromise.then(() => animation()),
          Promise.resolve()
        );
    }

    /**
     * Play multiple animations with a fixed interval between each animation.
     * 
     * @param animations functions generating an animation, returning a Promise.
     * @returns promise when all animations ends
     */
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