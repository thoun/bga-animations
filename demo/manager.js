let zoomManager;
let animationManager;

const animationSettings = /*undefined;*/ {
    duration: 1000,
};

/**
 * Simulate the game class.
 */
let game = {
    instantaneousMode: false,

    bgaAnimationsActive: function() {
        return document.visibilityState !== 'hidden' && !this.instantaneousMode;
    },
    wait: function(delay) {
        if (delay > 0 && this.bgaAnimationsActive()) {
            return new Promise(resolve => setTimeout(resolve, delay));
        } else {
            return Promise.resolve();
        }
    },
};

/**
 * Different transformations for each block, to test matrix transformations.
 */
const lines = [
    {
        title: 'Basic'
    },
    {
        title: 'Rotations (CSS transform)',
        'transform-rotate-from': -45,
        'transform-rotate-to': 90,
    },
    {
        title: 'Rotations (CSS rotate)',
        'rotate-from': -45,
        'rotate-to': 90,
    },
    {
        title: 'Scales (CSS transform)',
        'transform-scale-from': 0.5,
        'transform-scale-to': 2,
    },
    {
        title: 'Scales (CSS zoom)',
        'zoom-from': 0.5,
        'zoom-to': 2,
    },
    {
        title: 'Translates (CSS transform)',
        'translate-x-from': -20,
        'translate-y-to': 20,
    },
    {
        title: 'Translates (left/top, relative)',
        'relative-left-from': -20,
        'relative-top-to': 20,
    },
    {
        title: 'Translates (left/top, absolute)',
        'absolute-left-from': 20,
        'absolute-top-from': 20,
        'absolute-left-to': 250,
        'absolute-top-to': 50,
    },
    {
        title: 'Rotations (CSS rotate) + rotated piece',
        'rotate-from': -45,
        'rotate-to': 90,
        'rotate-piece': 60,
    },
];

function applyTransformationsToDiv(div, line, side) {
    if (line[`transform-rotate-${side}`]) {
        div.style.setProperty('--rotation', `${line[`transform-rotate-${side}`]}deg`);
    }
    if (line[`rotate-${side}`]) {
        div.style.rotate = `${line[`rotate-${side}`]}deg`;
    }
    if (line[`transform-scale-${side}`]) {
        div.style.setProperty('--scale', `${line[`transform-scale-${side}`]}`);
    }
    if (line[`zoom-${side}`]) {
        div.style.zoom = `${line[`zoom-${side}`]}`;
    }
    if (line[`translate-x-${side}`]) {
        div.style.setProperty('--translate-x', `${line[`translate-x-${side}`]}px`);
    }
    if (line[`translate-y-${side}`]) {
        div.style.setProperty('--translate-y', `${line[`translate-y-${side}`]}px`);
    }
    if (line[`relative-left-${side}`]) {
        div.style.position = 'relative';
        div.style.left = `${line[`relative-left-${side}`]}px`;
    }
    if (line[`relative-top-${side}`]) {
        div.style.position = 'relative';
        div.style.top = `${line[`relative-top-${side}`]}px`;
    }
    if (line[`absolute-left-${side}`]) {
        div.style.position = 'absolute';
        div.style.left = `${line[`absolute-left-${side}`]}px`;
    }
    if (line[`absolute-top-${side}`]) {
        div.style.position = 'absolute';
        div.style.top = `${line[`absolute-top-${side}`]}px`;
    }
    return div;
}

function createContainer(i, line, side) {
    const div = document.createElement('div');
    div.id = `${side}${i}`;
    div.classList.add('container');
    applyTransformationsToDiv(div, line, side);
    div.insertAdjacentHTML('beforeend', `<div class="piece">A</div><div class="piece">B</div>`);
    return div;
}

function createMovingPiece(i, line) {
    const div = document.createElement('div');
    div.id = `moved-piece${i}`;
    div.classList.add('piece');
    div.innerText = 'Moving';
    applyTransformationsToDiv(div, line, 'piece');
    return div;
}

/**
 * Initiate the demo page.
 */
function initManager() {
    zoomManager = new ZoomManager({
        element: document.getElementById('game-table'),
        localStorageZoomKey: 'bga-animations-demo',
    });

    animationManager = new AnimationManager(game, {
        zoomManager
    });

    lines.forEach((line, i) => {
        const mainDiv = document.createElement('div');
        mainDiv.classList.add('main-div');
        mainDiv.insertAdjacentHTML('afterbegin', `<div class="title">${line.title}</div>`);
        const fromDiv = createContainer(i, line, 'from');
        const toDiv = createContainer(i, line, 'to');
        const movingPiece = createMovingPiece(i, line);
        fromDiv.appendChild(movingPiece);
        mainDiv.appendChild(fromDiv);
        mainDiv.appendChild(toDiv);
        document.querySelector('.examples').appendChild(mainDiv);
    });
}

/**
 * Get the moved box.
 */
function getElement(i) {
    return document.getElementById(`moved-piece${i}`);
}

/**
 * Get the container to place the moved box to.
 */
function getToElement(i) {
    const element = getElement(i);
    const from = document.getElementById(`from${i}`);
    const to = document.getElementById(`to${i}`);
    const toElement = to.contains(element) ? from : to;
    return toElement;
}

/**
 * Slide the moved element to the opposite container.
 * Apply a parallel animation if some has been specified in the Select.
 */
function slideAll() {
    const effect = document.getElementById('slideAll-effect').value;
    const parallelAnimations = [];
    if (effect === 'blink') {
        parallelAnimations.push({
            keyframes: [
                { filter: 'brightness(1.5)', offset: 0.25 },
                { filter: 'brightness(0.75)', offset: 0.5 },
                { filter: 'brightness(1.5)', offset: 0.75 },
            ]
        })
    } else if (effect === 'rotateAndBump') {
        parallelAnimations.push({
            keyframes: [
                { transform: 'scale(1) rotate(0deg)' },
                { transform: 'scale(1.5) rotate(360deg)' },
                { transform: 'scale(1) rotate(720deg)' },
            ]
        })
    }
    lines.forEach((lines, index) => {
        const element = getElement(index);
        const toElement = getToElement(index);
        animationManager.slideAndAttach(element, toElement, { ...animationSettings, parallelAnimations }, toElement.id.includes('to') ? toElement.lastChild : undefined);
    });
}

/**
 * Slide the moved element to the screen center, and then to the opposite container.
 */
function slideAllScreenCenter() {
    lines.forEach((lines, index) => { 
        const element = getElement(index);
        const toElement = getToElement(index);
        animationManager.slideToScreenCenterAndAttach(element, toElement, animationSettings, toElement.id.includes('to') ? toElement.lastChild : undefined);
    });
}

/**
 * Slide the moved element oven the void, and then to the opposite container.
 */
function slideAllVoid() {
    const voidDiv = document.getElementById('the-void');

    lines.forEach((lines, index) => { 
        const element = getElement(index);
        const toElement = getToElement(index);
        animationManager.slideToElementAndAttach(element, voidDiv, toElement, animationSettings, toElement.id.includes('to') ? toElement.lastChild : undefined);
    });
}

/**
 * Slide the moved element to the screen center, and then to the opposite container.
 */
function slideAllCustomFunction() {
    lines.forEach((lines, index) => { 
        const element = getElement(index);
        const toElement = getToElement(index);
        slideToEachScreenCornerAndAttach(element, toElement, animationSettings, toElement.id.includes('to') ? toElement.lastChild : undefined);
    });
}

function swap() {
    lines.forEach((lines, index) => {
        const elements = ['from', 'to'].map(side => document.getElementById(`${side}${index}`).firstElementChild);
        animationManager.swap(elements, animationSettings);
    });
}

/**
 * Add the moved element with a fade in effect.
 */
function fadeIn() {
    lines.forEach(async (line, index) => { 
        // delete the piece from the dom
        const element = getElement(index);

        animationManager.fadeIn(element, null, animationSettings);
    });
}

/**
 * Add the moved element with a fade in effect, starting from the center a a defined div.
 */
function fadeInFrom() {
    const voidDiv = document.getElementById('the-void');

    lines.forEach(async (line, index) => { 
        // delete the piece from the dom
        const element = getElement(index);
        animationManager.fadeIn(element, voidDiv, animationSettings);
    });
}

/**
 * Add the moved element with a slide in effect, starting from the center a a defined div (same as fadeInFrom, without the fade effect).
 */
function slideInFrom() {
    const voidDiv = document.getElementById('the-void');

    lines.forEach(async (line, index) => { 
        // delete the piece from the dom
        const element = getElement(index);
        animationManager.slideIn(element, voidDiv, animationSettings);
    });
}

/**
 * Remove the moved element with a fade out effect.
 */
function fadeOutAndDestroy() {
    lines.forEach(async (line, index) => { 
        const element = getElement(index);
        await animationManager.fadeOutAndDestroy(element, null, animationSettings);

        // recreate the piece
        await game.wait(1500);
        const toElement = getToElement(index);
        const movingPiece = createMovingPiece(index, line);
        toElement.appendChild(movingPiece);
    });
}

/**
 * Remove the moved element with a fade out effect, going from the center a a defined div.
 */
function fadeOutAndDestroyTo() {
    const voidDiv = document.getElementById('the-void');

    lines.forEach(async (line, index) => { 
        const element = getElement(index);
        await animationManager.fadeOutAndDestroy(element, voidDiv, animationSettings);

        // recreate the piece
        await game.wait(1500);
        const toElement = getToElement(index);
        const movingPiece = createMovingPiece(index, line);
        toElement.appendChild(movingPiece);
    });
}

/**
 * Create a coin div to animate as a temporary piece (for example for scoring animation).
 */
function createCoin() {
    const div = document.createElement('div');
    div.innerHTML = `<p>3</p>`;
    div.classList.add('coin');
    div.style.pointerEvents = 'all';
    return div;
}

/**
 * Add a temporary element displayed on top of a moving box.
 * Apply a parallel animation if some has been specified in the Select.
 */
function addFloatingPiece(ignoreScale, ignoreRotation) {
    const effect = document.getElementById('addFloatingPiece-effect').value;
    const parallelAnimations = [];
    if (effect === 'slideUpAndFadeOut') {
        parallelAnimations.push({
            keyframes: [
                { transform: 'translate(0, -10px)', opacity: 1, offset: 0.5 },
                { transform: 'translate(0, -150px)', opacity: 0, offset: 1 },
            ]
        });
    } else if (effect === 'rotateAndScaleDown') {
        parallelAnimations.push({
            keyframes: [
                { transform: 'scale(1) rotate(0deg)' },
                { transform: 'scale(0) rotate(720deg)' },
            ]
        });
    }

    lines.forEach(async (line, index) => { 
        const coin = createCoin();
        const toElement = getElement(index);
        await animationManager.addFloatingElement(coin, toElement, { ...animationSettings, 
            ignoreScale,
            ignoreRotation,
            duration: 2000,
            parallelAnimations,
        });
    });
}

/**
 * Add a temporary element, that slides between the 2 containers..
 */
function slideFloatingElement(ignoreScale, ignoreRotation) {
    lines.forEach(async (line, index) => { 
        const coin = createCoin();
        const fromElement = document.getElementById(`to${index}`).lastElementChild;
        const toElement = getElement(index);
        await animationManager.slideFloatingElement(coin, fromElement, toElement, { ...animationSettings, 
            ignoreScale,
            ignoreRotation,
            duration: 2000,
        });
    });
}

/**
 * Add multiple temporary elements, that slides between the 2 containers.
 * Apply the animation ordering specified in the Select.
 */
function slideFloatingElements() {
    const spacing = document.getElementById('slideFloatingElements-spacing').value;

    lines.forEach(async (line, index) => {
        const fromElement = document.getElementById(`to${index}`).lastElementChild;
        const toElement = getElement(index);

        const animations = new Array(5).fill(0).map(index => (() => animationManager.slideFloatingElement(createCoin(), fromElement, toElement, animationSettings)));

        if (spacing === 'interval') {
            await animationManager.playInterval(animations/*, 150*/);
        } else if (spacing === 'parallel') {
            await animationManager.playParallel(animations);
        } else if (spacing === 'sequentially') {
            await animationManager.playSequentially(animations);
        }
    });
}

/**
 * Displays the bounding rect of an element.
 */
function displayBR(element) {
    const elementRect = element.getBoundingClientRect();

    const brDiv = document.createElement('div');
    brDiv.style.position = 'absolute';
    animationManager.base.animationSurface.appendChild(brDiv);
    brDiv.style.outline = '1px solid orange';
    brDiv.style.top = window.scrollY + elementRect.top+'px';
    brDiv.style.left = window.scrollX + elementRect.left+'px';
    brDiv.style.width = elementRect.width+'px';
    brDiv.style.height = elementRect.height+'px';
}

async function slideToEachScreenCornerAndAttach(element, toElement, animationSettings, insertBefore) {
    const matrixes = [
        new DOMMatrix().translateSelf(window.scrollX, window.scrollY),
        new DOMMatrix().translateSelf(window.scrollX + window.innerWidth, window.scrollY),
        new DOMMatrix().translateSelf(window.scrollX + window.innerWidth, window.scrollY + window.innerHeight),
        new DOMMatrix().translateSelf(window.scrollX, window.scrollY + window.innerHeight),
    ];

    const animationFunctions = matrixes.map(matrix => async (runningAnimation, animationSettings) => {
        await animationManager.base.animateOnAnimationSurface(runningAnimation.wrapper, runningAnimation.fromMatrix, matrix, animationSettings);
        runningAnimation.fromMatrix = matrix;
        return runningAnimation;
    });

    const toFinalPlace = async (runningAnimation, animationSettings) => {
        await animationManager.base.animateOnAnimationSurface(runningAnimation.wrapper, runningAnimation.fromMatrix, runningAnimation.toMatrix, animationSettings);
        return runningAnimation;
    };

    return await animationManager.sequenceAnimationsAttach(element, toElement, [
        ...animationFunctions, 
        toFinalPlace, 
    ], animationSettings, insertBefore);
}