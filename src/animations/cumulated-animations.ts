interface BgaCumulatedAnimationsSettings extends BgaAnimationSettings {
    animations: IBgaAnimation<BgaAnimationSettings>[];
}

/**
 * Just use playSequence from animationManager
 * 
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function cumulatedAnimations(animationManager: AnimationManager, animation: IBgaAnimation<BgaCumulatedAnimationsSettings>): Promise<any> {
    return animationManager.playSequence((animation.settings as any).animations);
}


class BgaCumulatedAnimation<BgaCumulatedAnimationsSettings> extends BgaAnimation<any> {
    constructor(
        settings: BgaCumulatedAnimationsSettings,
    ) {
        super(
            cumulatedAnimations,
            settings,
        );
        this.playWhenNoAnimation = true;
    }
}