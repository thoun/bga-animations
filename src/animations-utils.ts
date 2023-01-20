function shouldAnimate(settings?: AnimationSettings): boolean {
    return document.visibilityState !== 'hidden' && !settings?.game?.instantaneousMode;
}

/**
 * Return the x and y delta, based on the animation settings;
 * 
 * @param settings an `AnimationSettings` object
 * @returns a promise when animation ends
 */
function getDeltaCoordinates(element: HTMLElement, settings: AnimationWithOriginSettings): {x: number, y: number} {
    if (!settings.fromDelta && !settings.fromRect && !settings.fromElement) {
        throw new Error(`[bga-animation] fromDelta, fromRect or fromElement need to be set`);
    }

    let x = 0;
    let y = 0;

    if (settings.fromDelta) {
        x = settings.fromDelta.x;
        y = settings.fromDelta.y;
    } else {
        const originBR = settings.fromRect ?? settings.fromElement.getBoundingClientRect();

        // TODO make it an option ?
        const originalTransform = element.style.transform;
        element.style.transform = '';
        const destinationBR = element.getBoundingClientRect();
        element.style.transform = originalTransform;

        x = (destinationBR.left + destinationBR.right)/2 - (originBR.left + originBR.right)/2;
        y = (destinationBR.top + destinationBR.bottom)/2 - (originBR.top+ originBR.bottom)/2;
    }

    if (settings.scale) {
        x /= settings.scale;
        y /= settings.scale;
    }

    return {x, y};
}

function logAnimation(element: HTMLElement, settings: AnimationSettings) {
    console.log(element, element.getBoundingClientRect(), element.style.transform, settings);
    return Promise.resolve(false);
}