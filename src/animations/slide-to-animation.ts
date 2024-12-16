/**
 * Slide of the element from destination to origin.
 * 
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function slideToAnimation(animationManager: AnimationManager, animation: IBgaAnimation<BgaElementAnimationSettings>): Promise<void> {
    let elementAnimation = null;

    const promise = new Promise<void>((success) => {
        const settings = animation.settings;
        const element = settings.element;

        let {x, y} = getDeltaCoordinates(element, settings, animationManager);

        const duration = settings.duration ?? 500;
        const originalZIndex = element.style.zIndex;
        const transitionTimingFunction = settings.transitionTimingFunction ?? 'linear';

        element.style.zIndex = `${settings?.zIndex ?? 10}`;

        elementAnimation = element.animate([
            { transform: settings?.finalTransform ?? '' },
            { transform: `translate(${-x}px, ${-y}px) rotate(${settings?.rotationDelta ?? 0}deg) scale(${settings.scale ?? 1})` },
        ],
        {
          duration: duration,
          iterations: 1,
          easing: transitionTimingFunction,
        });
        
        elementAnimation.finished.then(() => {
            element.style.zIndex = originalZIndex;
            success();
        });
    });

    (promise as any).elementAnimation = elementAnimation;

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
