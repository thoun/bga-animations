/**
 * Just does nothing for the duration
 * 
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function pauseAnimation(animationManager: AnimationManager, animation: IBgaAnimation<BgaAnimationSettings>): Promise<void> {
    const promise = new Promise<void>((success) => {
        const settings = animation.settings;

        const duration = settings?.duration ?? 500;
        
        setTimeout(() => success(), duration);
    });
    return promise;
}

class BgaPauseAnimation<BgaAnimation> extends BgaAnimation<any> {
    constructor(
        settings: BgaAnimation,
    ) {
        super(
            pauseAnimation,
            settings,
        );
    }
}
