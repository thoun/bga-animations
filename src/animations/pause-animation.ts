/**
 * Show the element at the center of the screen
 * 
 * @param element the element to animate
 * @param settings an `AnimationSettings` object
 * @returns a promise when animation ends
 */
function pauseAnimation(element: HTMLElement, settings: AnimationSettings): Promise<boolean> {
    const promise = new Promise<boolean>((success) => {
        // should be checked at the beginning of every animation
        if (!shouldAnimate(settings)) {
            success(false);
            return promise;
        }

        const duration = settings?.duration ?? 500;
        
        setTimeout(() => success(true), duration);
    });
    return promise;
}
