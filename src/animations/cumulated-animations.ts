/**
 * Linear slide of the card from origin to destination.
 * 
 * @param element the element to animate. The element should be attached to the destination element before the animation starts. 
 * @param settings an `AnimationSettings` object
 * @returns a promise when animation ends
 */
function cumulatedAnimations(element: HTMLElement, animations: AnimationFunction[], settingsOrSettingsArray?: AnimationSettings | AnimationSettings[]): Promise<boolean> {
    const settings = Array.isArray(settingsOrSettingsArray) ? settingsOrSettingsArray[0] : settingsOrSettingsArray;
    if (!animations.length) {
        throw new Error(`[bga-animation] animations of cumulatedAnimations cannot be empty`);
    } else if (animations.length == 1) {
        return animations[0](element, settings);
    } else {
        // multiple animations, we play the first then we resursively call the next ones
        return animations[0](element, settings).then(() => 
            cumulatedAnimations(element, animations.slice(1), Array.isArray(settingsOrSettingsArray) ? settingsOrSettingsArray.slice(1) : settingsOrSettingsArray)
        );
    }
}
