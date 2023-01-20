let animationManager;

const cardWidth = 100;
const cardHeight = 150;

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
    applyToMovedSquares(element => animationManager.attachWithSlideAnimation(
        element,
        toElement
    ));
}

function slideToScreenCenterThen(toElement) {    
    applyToMovedSquares(element => animationManager.attachWithShowToScreenAnimation(
        element,
        toElement
    ), 1);
}

function slideToScreenCenter() {
    applyToMovedSquares(element => 
        showScreenCenterAnimation(
            element,
            {
                game
            }
        )
    );
}
