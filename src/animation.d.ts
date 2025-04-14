type HorizontalBase = 'left' | 'center' | 'right';
type VerticalBase = 'top' | 'center' | 'bottom';

interface PositionSettings {
    includeSelfRotationAndScale?: boolean;
    ignoreScale?: boolean;
    ignoreRotation?: boolean;
    horizontalBase?: HorizontalBase;
    verticalBase?: VerticalBase;
}

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

    /**
     * A function returning a boolean, or a boolean, to know if animations are active.
     */
    animationsActive?: (() => boolean) | boolean;
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
    /**
     * Animations to play at the same time as the main animation
     */
    parallelAnimations?: ParallelAnimation[];

    /**
     * Preserve the scale of the object when sliding in or out.
     */
    preserveScale?: boolean;
}

interface SlideAnimationSettings extends AnimationSettings {
    /**
     * The scale bump to use in the middle of a slide animation, to fake an item grabbed from one place to the other. Default 1.2
     */
    bump?: number;
}

interface SequenceAnimationsSettings extends AnimationSettings {
    /**
     * A pause between the animations, in ms (default undefined/0).
     * If set in an inner animation settings, will apply after the animation, except if the animation is the last one.
     */
    innerPause?: number;
}

interface FloatingElementAnimationSettings extends SlideAnimationSettings {
    fromSettings?: PositionSettings;
    toSettings?: PositionSettings;

    /**
     * Ignore the scale of the from and to element when doing the animation (default true).
     */
    ignoreScale?: boolean;

    /**
     * Ignore the rotation of the from and to element when doing the animation (default true).
     */
    ignoreRotation?: boolean;

    /**
     * A scale to apply to the floating element.
     */
    scale?: number;
}

interface DisplayElementAnimationSettings extends FloatingElementAnimationSettings {
    /**
     * If the display animation has a default animation, indicates if it should be played (default true).
     */
    defaultAnimation?: boolean;

    /**
     * Extra class to add to add to the animated element.
     */
    extraClass?: string;

    /**
     * Extra classes to add to add to the animated element.
     */
    extraClasses?: string[];
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