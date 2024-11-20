let zoomManager;
let animationManager;
const FAKE_MOBILE_ZOOM = 0.75;

let game = {
    instantaneousMode: false,

    getBoundingClientRectIgnoreZoom: (element) => {
        var rect = element.getBoundingClientRect();
        var zoomCorr = FAKE_MOBILE_ZOOM;
        rect.x /= zoomCorr;
        rect.y /= zoomCorr;
        rect.width /= zoomCorr;
        rect.height /= zoomCorr;
        return rect;
    }
};

function initManager() {
    document.getElementById('game_area_wrap').style.zoom = `${FAKE_MOBILE_ZOOM}`;

    zoomManager = new ZoomManager({
        element: document.getElementById('game-table'),
        localStorageZoomKey: 'bga-animations-demo',
    });

    animationManager = new AnimationManager(game, {
        zoomManager
    });
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
