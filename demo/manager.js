let animationManager;

let game = {
    instantaneousMode: false,
};

function initManager() {
    animationManager = new AnimationManager(game);
}

function applyToMovedSquares(fn, max = 4) {
    for (i=1; i<=max; i++) {
        const element = document.getElementById(`moved-square-${i}`);
        setTimeout(() => fn(element), 200 * (i - 1));
    } 
}

function slideTo(toElement) {
    applyToMovedSquares(element => animationManager.attachWithAnimation(
        new BgaSlideAnimation({ element }),
        toElement
    ));
}

function slideToScreenCenterThen(toElement) {    
    applyToMovedSquares(element => animationManager.play(
        new BgaCumulatedAnimation({ animations: [
            new BgaShowScreenCenterAnimation({ element, transitionTimingFunction: 'ease-in', }),
            new BgaPauseAnimation({ element }),
            new BgaAttachWithAnimation({
                animation: new BgaSlideAnimation({ element, transitionTimingFunction: 'ease-out' }),
                attachElement: toElement
            })
        ]})
    ), 1);
}

function slideToScreenCenter() {
    applyToMovedSquares(element => animationManager.attachWithAnimation(
        new BgaShowScreenCenterAnimation({ element }),
        toElement
    ));
}

function slideFromTitle(element) {
    animationManager.play(
        new BgaSlideAnimation({
            element,
            fromElement: document.getElementById('instantaneousMode')
        })
    );
}

function slideToHereThenDelete(toElement) {
    applyToMovedSquares(element => animationManager.play(
        new BgaSlideAnimation({
            element,
            fromElement: toElement, scale: 1
        })
    ).then(() => element.remove()), 1);
}
