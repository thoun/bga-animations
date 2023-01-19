let animationManager;

const cardWidth = 100;
const cardHeight = 150;

let game = {
    instantaneousMode: false,
};

function initManager() {
    animationManager = new AnimationManager(game);
}

function applyToMovedSquares(fn) {
    for (i=1; i<=4; i++) {
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
    applyToMovedSquares(element => 
        cumulatedAnimations(
            element,
            [
                showScreenCenterAnimation,
                /*(element) => {
                    element.transform = '';
                    return Promise.resolve(true);
                },*/
                (element) => animationManager.attachWithSlideAnimation(
                    element,
                    toElement
                ),
            ]
        )
    );
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
