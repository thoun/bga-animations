/**
 * Linear slide of the card from origin to destination.
 * 
 * @param element the element to animate. The element should be attached to the destination element before the animation starts. 
 * @param settings an `AnimationSettings` object
 * @returns a promise when animation ends
 */
function slideAnimation(element: HTMLElement, settings: AnimationWithOriginSettings): Promise<boolean> {
    const promise = new Promise<boolean>((success) => {
        // should be checked at the beginning of every animation
        if (!shouldAnimate(settings)) {
            success(false);
            return promise;
        }

        let {x, y} = getDeltaCoordinates(element, settings);

        const duration = settings?.duration ?? 500;
        const originalZIndex = element.style.zIndex;
        const originalTransition = element.style.transition;

        element.style.zIndex = `${settings?.zIndex ?? 10}`;
        element.style.transition = null;
        element.offsetHeight;
        element.style.transform = `translate(${-x}px, ${-y}px) rotate(${settings?.rotationDelta ?? 0}deg)`;

        settings.animationStart?.(element);

        let timeoutId = null;

        const cleanOnTransitionEnd = () => {
            element.style.zIndex = originalZIndex;
            element.style.transition = originalTransition;
            settings.animationEnd?.(element);
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

        element.addEventListener('transitioncancel', cleanOnTransitionCancel);
        element.addEventListener('transitionend', cleanOnTransitionEnd);
        document.addEventListener('visibilitychange', cleanOnTransitionCancel);

        element.offsetHeight;
        element.style.transition = `transform ${duration}ms linear`;
        element.offsetHeight;
        element.style.transform = settings?.finalTransform ?? null;
        // safety in case transitionend and transitioncancel are not called
        timeoutId = setTimeout(cleanOnTransitionEnd, duration + 100);
    });
    return promise;
}
