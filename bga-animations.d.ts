declare class BaseAnimationManager {
    private animationSurface;
    constructor();
    /**
     * Create the animation surface, an unselectable div starting at the top of the screen where the animated element will be attached.
     */
    private createAnimationSurface;
    /**
     * Get the translate X & Y for the element, from the top of the page.
     */
    private getTopPageOffset;
    /**
     * Get rotation & scale matrix for an element, relative to the parent.
     */
    private getRotationAndScaleMatrixForElement;
    /**
     * Get rotation & scale matrix for an element, relative to the top of the page.
     */
    getRotationAndScaleMatrix(element: HTMLElement, includeSelf?: boolean): DOMMatrix;
    /**
     * Get translation, rotation & scale matrix for an element, relative to the top of the page.
     */
    getFullMatrix(element: HTMLElement, params?: PositionSettings): DOMMatrix;
    /**
     * Remove the scale part of a matrix.
     */
    removeScaleFromMatrix(matrix: DOMMatrix): DOMMatrix;
    /**
     * Remove the rotation part of a matrix.
     */
    removeRotationFromMatrix(matrix: DOMMatrix): DOMMatrix;
    /**
     * Remove the translation part of a matrix.
     */
    removeTranslationFromMatrix(matrix: DOMMatrix): DOMMatrix;
    /**
     * Create a temp div of the same size as the element.
     */
    createFillingSpace(elem: HTMLElement): HTMLElement;
    /**
     * Make an empty space grow or shrink to replace where a moved object was or will be.
     * Ignore the animation settings, prefer addAnimatedSpaceIfNecessary.
     */
    addFixedSpace(element: HTMLElement, parent: HTMLElement, insertBefore?: Element): HTMLElement;
    /**
     * Make an empty space grow or shrink to replace where a moved object was or will be.
     * Ignore the animation settings, prefer addAnimatedSpaceIfNecessary.
     */
    addAnimatedSpace(element: HTMLElement, parent: HTMLElement, type: 'grow' | 'shrink', animationSettings: AnimationSettings, insertBefore?: Element): Promise<AnimationResult>;
    /**
     * Make an empty space grow or shrink to replace where a moved object was or will be.
     * Only if the animation settings says so.
     */
    addAnimatedSpaceIfNecessary(element: HTMLElement, parent: HTMLElement, type: 'grow' | 'shrink', animationSettings: AnimationSettings, insertBefore?: Element): Promise<AnimationResult>;
    /**
     * Returns the average of 2 matrixes.
     */
    private averageDOMMatrix;
    private applyMatrixScale;
    /**
     * Add a wrapper around an element, and add the elment on that wrapper.
     * Needed before doing animations on the surface
     */
    wrapOnAnimationSurface(element: HTMLElement, positionSettings?: PositionSettings): HTMLElement;
    /**
     * Add a wrapper layer.
     * Needed before doing sub-animations without messing to the animation on the main wrapper
     */
    addWrapperLayer(baseWrapper: HTMLElement): HTMLElement;
    /**
     * Find the animated element in a possibly multi-layer wrapper.
     */
    private getElementInWrapper;
    /**
     * Creates a bump animation, that simulates a physical item being lifted from one place to another.
     */
    createBumpAnimation(bump: number | null | undefined): ParallelAnimation | null;
    /**
     * Creates a fade animation, 'in' for appearing and 'out' for disappearing.
     */
    createFadeAnimation(type: 'in' | 'out'): ParallelAnimation;
    /**
     * Animate an object on the animation surface, from a matrix to a matrix.
     */
    animateOnAnimationSurface(animationWrapper: HTMLElement, fromMatrix: DOMMatrix, toMatrix: DOMMatrix, animationSettings: AnimationSettings): Promise<SurfaceAnimationResult>;
    /**
     * Attach an element to a new parent.
     */
    attachToElement(element: HTMLElement, toElement: HTMLElement, insertBefore?: Element): void;
    startSlideInAnimation(element: HTMLElement, fromElement?: HTMLElement, fromIgnoreScale?: boolean, fromIgnoreRotation?: boolean, preserveScale?: boolean): RunningAnimation | null;
    startSlideOutAnimation(element: HTMLElement, toElement?: HTMLElement, fromIgnoreScale?: boolean, fromIgnoreRotation?: boolean, preserveScale?: boolean): RunningAnimation | null;
    startAttachAnimation(element: HTMLElement, toElement: HTMLElement, insertBefore?: HTMLElement): RunningAnimation | null;
    endRunningAnimation(attachAnimation: RunningAnimation): void;
    removeElement(element: HTMLElement | undefined | null): void;
}
declare class AnimationManager {
    game: Game;
    base: BaseAnimationManager;
    private animationSettings;
    /**
     * @param game the BGA game class, usually it will be `this`
     * @param animationSettings: a `AnimationManagerSettings` object
     */
    constructor(game: Game, animationSettings?: AnimationManagerSettings);
    /**
     * Slide an object to an element.
     */
    slideAndAttach(element: HTMLElement, toElement: HTMLElement, animationSettings?: SlideAnimationSettings, insertBefore?: HTMLElement): Promise<any>;
    /**
     * Swap two elements.
     */
    swap(elements: HTMLElement[], animationSettings?: SlideAnimationSettings): Promise<any>;
    /**
     * Play a list of animations then attach to an element.
     */
    sequenceAnimationsAttach(element: HTMLElement, toElement: HTMLElement, animations: ((runningAnimation: RunningAnimation, animationSettings?: AnimationSettings) => Promise<RunningAnimation>)[], animationSettings?: AnimationSettings | AnimationSettings[], insertBefore?: HTMLElement): Promise<any>;
    /**
     * Slide an object to the screen center then an element.
     */
    slideToScreenCenterAndAttach(element: HTMLElement, toElement: HTMLElement, animationSettings?: AnimationSettings | AnimationSettings[], insertBefore?: HTMLElement): Promise<any>;
    /**
     * Slide an object over an intermediate element then attach to an element.
     */
    slideToElementAndAttach(element: HTMLElement, overElement: HTMLElement, toElement: HTMLElement, animationSettings?: AnimationSettings | AnimationSettings[], insertBefore?: HTMLElement): Promise<any>;
    /**
     * Slide an object in. The object must be attached to the destination before.
     */
    slideIn(element: HTMLElement, fromElement?: HTMLElement, animationSettings?: FloatingElementAnimationSettings): Promise<any>;
    /**
     * Fade an object in. The object must be attached to the destination before.
     */
    fadeIn(element: HTMLElement, fromElement?: HTMLElement, animationSettings?: FloatingElementAnimationSettings): Promise<any>;
    /**
     * slide out an object and destroy it. It call be called with a toElement, in that case a slide animation will be triggered.
     */
    slideOutAndDestroy(element: HTMLElement, toElement?: HTMLElement, animationSettings?: FloatingElementAnimationSettings): Promise<any>;
    /**
     * Fade out an object and destroy it. It call be called with a toElement, in that case a slide animation will be triggered.
     */
    fadeOutAndDestroy(element: HTMLElement, toElement?: HTMLElement, animationSettings?: FloatingElementAnimationSettings): Promise<any>;
    getFloatingElementParams(animationSettings?: FloatingElementAnimationSettings, parallelAnimations?: ParallelAnimation[]): {
        fromSettings?: PositionSettings;
        toSettings?: PositionSettings;
        ignoreScale?: boolean;
        ignoreRotation?: boolean;
        scale?: number;
        bump?: number;
        parallelAnimations?: ParallelAnimation[];
        preserveScale?: boolean;
        duration?: number;
        easing?: string;
        fillingSpaces?: "all" | "none" | "from" | "to";
    };
    /**
     * Add a floating element over another element.
     */
    slideFloatingElement(element: HTMLElement, fromElement: HTMLElement | null | undefined, toElement: HTMLElement, animationSettings?: FloatingElementAnimationSettings): Promise<any>;
    /**
     * Add a floating element over another element.
     */
    addFloatingElement(element: HTMLElement, toElement: HTMLElement, animationSettings?: FloatingElementAnimationSettings): Promise<any>;
    /**
     * Add a floating message over another element.
     */
    displayMessage(toElement: HTMLElement, message: string, color: string, animationSettings?: FloatingElementAnimationSettings): Promise<void>;
    /**
     * Add a floating number over another element.
     * It will be prefixed by '+' if positive, and '-' if negative.
     */
    displayScoring(toElement: HTMLElement, score: number, color: string, animationSettings?: FloatingElementAnimationSettings): Promise<void>;
    displayBubble(toElement: HTMLElement, message: string, animationSettings?: FloatingElementAnimationSettings): Promise<void>;
    /**
     * Play multiple animations a the same time.
     *
     * @param animations functions generating an animation, returning a Promise.
     * @returns promise when all animations ends
     */
    playParallel(animations: ((index: number) => Promise<any>)[]): Promise<any>;
    /**
     * Play multiple animations one after the other.
     *
     * @param animations functions generating an animation, returning a Promise.
     * @returns promise when all animations ends
     */
    playSequentially(animations: (() => Promise<any>)[]): Promise<any>;
    /**
     * Play multiple animations with a fixed interval between each animation.
     *
     * @param animations functions generating an animation, returning a Promise.
     * @returns promise when all animations ends
     */
    playInterval(animations: ((index: number) => Promise<any>)[], interval?: number): Promise<void>;
}
