/**
 * Show the element at the center of the screen
 * 
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function showScreenCenterAnimation(animationManager: AnimationManager, animation: IBgaAnimation<BgaElementAnimationSettings>): Promise<void> {
    const promise = new Promise<void>((success) => {
        const settings = animation.settings;
        const element = settings.element;

        const elementBR = element.getBoundingClientRect();

        const xCenter = (elementBR.left + elementBR.right)/2;
        const yCenter = (elementBR.top + elementBR.bottom)/2;

        const x = xCenter - (window.innerWidth / 2);
        const y = yCenter - (window.innerHeight / 2);

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
            element.offsetHeight;
            element.style.transform = settings?.finalTransform ?? null;
            element.offsetHeight;
            cleanOnTransitionEnd();
        }

        element.addEventListener('transitioncancel', cleanOnTransitionEnd);
        element.addEventListener('transitionend', cleanOnTransitionEnd);
        document.addEventListener('visibilitychange', cleanOnTransitionCancel);

        element.offsetHeight;
        element.style.transition = `transform ${duration}ms ${transitionTimingFunction}`;
        element.offsetHeight;
        element.style.transform = `translate(${-x}px, ${-y}px) rotate(${settings?.rotationDelta ?? 0}deg)`;
        // safety in case transitionend and transitioncancel are not called
        timeoutId = setTimeout(cleanOnTransitionEnd, duration + 100);
    });
    return promise;
}

class BgaShowScreenCenterAnimation<BgaAnimation> extends BgaAnimation<any> {
    constructor(
        settings: BgaAnimation,
    ) {
        super(
            showScreenCenterAnimation,
            settings,
        );
    }
}

