/**
 * Show the element at the center of the screen
 * 
 * @param element the element to animate
 * @param settings an `AnimationSettings` object
 * @returns a promise when animation ends
 */
function showScreenCenterAnimation(element: HTMLElement, settings: AnimationSettings): Promise<boolean> {
    const promise = new Promise<boolean>((success) => {
        // should be checked at the beginning of every animation
        if (!shouldAnimate(settings)) {
            success(false);
            return promise;
        }

        const elementBR = element.getBoundingClientRect();

        const xCenter = (elementBR.left + elementBR.right)/2;
        const yCenter = (elementBR.top + elementBR.bottom)/2;

        const x = xCenter - (window.innerWidth / 2);
        const y = yCenter - (window.innerHeight / 2);

        const duration = settings?.duration ?? 500;
        const originalZIndex = element.style.zIndex;
        const originalTransition = element.style.transition;

        element.style.zIndex = `${settings?.zIndex ?? 10}`;

        settings?.animationStart?.(element);

        let timeoutId = null;

        const cleanOnTransitionEnd = () => {
            element.style.zIndex = originalZIndex;
            element.style.transition = originalTransition;
            settings?.animationEnd?.(element);
            success(true);
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
        element.style.transition = `transform ${duration}ms linear`;
        element.offsetHeight;
        element.style.transform = `translate(${-x}px, ${-y}px) rotate(${settings?.rotationDelta ?? 0}deg)`;
        // safety in case transitionend and transitioncancel are not called
        timeoutId = setTimeout(cleanOnTransitionEnd, duration + 100);
    });
    return promise;
}
