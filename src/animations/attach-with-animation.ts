interface BgaAttachWithAnimationSettings extends BgaElementAnimationSettings {
    animation: BgaAnimation<BgaAnimationWithOriginSettings>;

    /**
     * The target to attach the element to.
     */
    attachElement: HTMLElement;

    /**
     * A function called after attaching the element.
     */
    afterAttach?: (element: HTMLElement, attachElement: HTMLElement) => void;
}

/**
 * Just use playSequence from animationManager
 * 
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function attachWithAnimation(animationManager: AnimationManager, animation: IBgaAnimation<BgaAttachWithAnimationSettings>): Promise<any> {
    const settings = animation.settings as BgaAttachWithAnimationSettings;
    const element = settings.animation.settings.element;

    const fromRect = element.getBoundingClientRect();
    settings.animation.settings.fromRect = fromRect;
    settings.attachElement.appendChild(element);
    settings.afterAttach?.(element, settings.attachElement);
    return animationManager.play(settings.animation);
}


class BgaAttachWithAnimation<BgaAnimationWithAttachAndOriginSettings> extends BgaAnimation<any> {
    constructor(
        settings: BgaAnimationWithAttachAndOriginSettings,
    ) {
        super(
            attachWithAnimation,
            settings,
        );
        this.playWhenNoAnimation = true;
    }
}