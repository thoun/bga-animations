/**
 * Show the element at the center of the screen
 * 
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function showScreenCenterAnimation(animationManager: AnimationManager, animation: IBgaAnimation<BgaElementAnimationSettings>): Promise<void> {
    let elementAnimation = null;

    const promise = new Promise<void>((success) => {
        const settings = animation.settings;
        const element = settings.element;

        const elementBR = animationManager.game.getBoundingClientRectIgnoreZoom(element);

        const xCenter = (elementBR.left + elementBR.right)/2;
        const yCenter = (elementBR.top + elementBR.bottom)/2;

        const x = xCenter - (window.innerWidth / 2);
        const y = yCenter - (window.innerHeight / 2);

        const duration = settings?.duration ?? 500;
        const originalZIndex = element.style.zIndex;
        const transitionTimingFunction = settings.transitionTimingFunction ?? 'linear';

        element.style.zIndex = `${settings?.zIndex ?? 10}`;

        const finalTransform = `translate(${-x}px, ${-y}px) rotate(${settings?.rotationDelta ?? 0}deg)`;

        elementAnimation = element.animate([
            { transform: settings?.finalTransform ?? '' },
            { transform: finalTransform },
        ],
        {
          duration: duration,
          iterations: 1,
          easing: transitionTimingFunction,
        });
        
        elementAnimation.finished.then(() => {
            element.style.zIndex = originalZIndex;
            element.style.transform = finalTransform;
            success();
        });
    });

    (promise as any).elementAnimation = elementAnimation;

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

