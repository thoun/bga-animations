/**
 * Global settings to apply as a default to all animations. Can be overriden in each animation.
 */
interface AnimationManagerSettings {
    /**
     * The default animation duration, in ms (default: 500).
     */
    duration?: number;

    /**
     * The CSS easing function, default 'ease-in-out'.
     */
    easing?: string;

    /**
     * Add shrinking/growing filling spaces where the element is removed/added to animate the size of the container div. Default 'all'.
     */
    fillingSpaces?: 'all' | 'none' | 'from' | 'to';
}

/**
 * Extra animation to apply to another element while main animation is played. Will have the same duration.
 */
interface ParallelAnimation {
    /**
     * Element to apply the animation to. If not set, will use `applyTo`.
     */
    applyToElement?: HTMLElement;

    /**
     * Element to apply the animation to, if `applyToElement` is not set. Default to 'intermediate'.
     * 'wrapper': will apply the animation directly on the wrapper.
     * 'intermediate': will apply the animation on a new wrapper inserted between the main wrapper and the element.
     * 'element': will apply the animation directly on the animated element.
     */
    applyTo?: 'wrapper' | 'intermediate' | 'element';

    /**
     * Keyframes of the animation.
     */
    keyframes: Keyframe[];
}

/**
 * Settings to apply to an animation. Other animations can be run in parallel, using the same duration.
 */
interface AnimationSettings extends AnimationManagerSettings {
    parallelAnimations?: ParallelAnimation[];
}

interface SlideAnimationSettings extends AnimationSettings {
    /**
     * The scale bump to use in the middle of a slide animation, to fake an item grabbed from one place to the other. Default 1.2
     */
    bump?: number;
}

interface FloatingPieceAnimationSettings extends SlideAnimationSettings {
    /**
     * Ignore the scale of the from and to element when doing the animation (default true).
     */
    ignoreScale?: boolean;

    /**
     * Ignore the rotation of the from and to element when doing the animation (default true).
     */
    ignoreRotation?: boolean;
}

interface AnimationResult {
    animation: Animation;
    element?: HTMLElement;
    animationWrapper?: HTMLElement;
}

interface SurfaceAnimationResult extends AnimationResult {
    toMatrix: DOMMatrix | null;
}

interface RunningAnimation {
    element?: HTMLElement;
    wrapper?: HTMLElement;
    fromParent?: HTMLElement;
    fromNextSibling?: HTMLElement;
    toParent?: HTMLElement;
    toNextSibling?: HTMLElement;
    fromMatrix: DOMMatrix | null;
    toMatrix: DOMMatrix | null;
    toSpaceWrapper?: HTMLElement;
    wrappersToRemove?: HTMLElement[];
}