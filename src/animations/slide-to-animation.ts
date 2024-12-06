/**
 * Slide of the element from destination to origin.
 * 
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function slideToAnimation(animationManager: AnimationManager, animation: IBgaAnimation<BgaElementAnimationSettings>): Promise<void> {
    const promise = new Promise<void>((success) => {
        const settings = animation.settings;
        const element = settings.element;

        let {x, y} = getDeltaCoordinates(element, settings, animationManager);

        const duration = settings?.duration ?? 500;
        const originalZIndex = element.style.zIndex;
        const originalTransition = element.style.transition;
        const transitionTimingFunction = settings.transitionTimingFunction ?? 'linear';

        element.style.zIndex = `${settings?.zIndex ?? 10}`;

        let timeoutId = null;

        const cleanOnTransitionEnd = () => {
            element.style.zIndex = originalZIndex;
            element.style.transition = originalTransition;
            success();
            element.removeEventListener('transitioncancel', cleanOnTransitionEnd);
            element.removeEventListener('transitionend', cleanOnTransitionEnd);
            document.removeEventListener('visibilitychange', cleanOnTransitionEnd);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };

        const cleanOnTransitionCancel = () => {
            element.style.transition = ``;
            element.style.transform = settings?.finalTransform ?? null;
            cleanOnTransitionEnd();
        }

        element.addEventListener('transitioncancel', cleanOnTransitionEnd);
        element.addEventListener('transitionend', cleanOnTransitionEnd);
        document.addEventListener('visibilitychange', cleanOnTransitionCancel);

        element.style.transition = `transform ${duration}ms ${transitionTimingFunction}`;
        element.style.transform = `translate(${-x}px, ${-y}px) rotate(${settings?.rotationDelta ?? 0}deg) scale(${settings.scale ?? 1})`;
        // safety in case transitionend and transitioncancel are not called
        timeoutId = setTimeout(cleanOnTransitionEnd, duration + 100);
    });
    return promise;
}

class BgaSlideToAnimation<BgaAnimationWithAttachAndOriginSettings> extends BgaAnimation<any> {
    constructor(
        settings: BgaAnimationWithAttachAndOriginSettings,
    ) {
        super(
            slideToAnimation,
            settings,
        );
    }
}
