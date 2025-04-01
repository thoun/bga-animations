var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class BaseAnimationManager {
    constructor() {
        this.createAnimationSurface();
    }
    /**
     * Create the animation surface, an unselectable div starting at the top of the screen where the animated element will be attached.
     */
    createAnimationSurface() {
        this.animationSurface = document.createElement('div');
        this.animationSurface.classList.add('bga-animations_animation-surface');
        document.body.appendChild(this.animationSurface);
    }
    /**
     * Get the translate X & Y for the element, from the top of the page.
     */
    getTopPageOffset(element) {
        let elementRect = element.getBoundingClientRect();
        // Compute position of the element center from top-left of the page, ignoring rotation/scale changing the BR width/height
        let x = elementRect.left + elementRect.width / 2 + window.scrollX;
        let y = elementRect.top + elementRect.height / 2 + window.scrollY;
        return new DOMMatrix().translateSelf(x, y);
    }
    /**
     * Get rotation & scale matrix for an element, relative to the parent.
     */
    getRotationAndScaleMatrixForElement(element) {
        const style = window.getComputedStyle(element);
        // Get transform matrix, ignoring translation
        let transformMatrix = style.transform === "none" ? new DOMMatrix() : new DOMMatrix(style.transform);
        transformMatrix.e = 0;
        transformMatrix.f = 0;
        // Get rotate and convert to matrix
        let rotateValue = style.rotate !== "none" ? parseFloat(style.rotate) : 0;
        let rotateMatrix = new DOMMatrix();
        rotateMatrix.rotateSelf(0, 0, rotateValue);
        // Get zoom (non-standard)
        let zoomValue = style.zoom ? parseFloat(style.zoom) : 1;
        let zoomMatrix = new DOMMatrix();
        zoomMatrix.scaleSelf(zoomValue, zoomValue);
        // Final matrix = zoom * transform * rotate
        let finalMatrix = zoomMatrix.multiply(transformMatrix).multiply(rotateMatrix);
        return finalMatrix;
    }
    /**
     * Get rotation & scale matrix for an element, relative to the top of the page.
     */
    getRotationAndScaleMatrix(element, includeSelf = false) {
        let matrix = new DOMMatrix();
        let currentElement = includeSelf ? element : element.parentElement;
        while (currentElement && currentElement !== document.documentElement) {
            matrix = this.getRotationAndScaleMatrixForElement(currentElement).multiply(matrix);
            currentElement = currentElement.parentElement;
        }
        return matrix;
    }
    /**
     * Get translation, rotation & scale matrix for an element, relative to the top of the page.
     */
    getFullMatrix(element) {
        const rotationAndScaleMatrix = this.getRotationAndScaleMatrix(element);
        const topPageOffset = this.getTopPageOffset(element);
        return topPageOffset.multiply(rotationAndScaleMatrix);
    }
    /**
     * Remove the scale part of a matrix.
     */
    removeScaleFromMatrix(matrix) {
        let scaleX = Math.hypot(matrix.a, matrix.b); // Compute the scale from a & b
        let scaleY = Math.hypot(matrix.c, matrix.d); // Compute the scale from c & d
        return new DOMMatrix([
            matrix.a / scaleX, matrix.b / scaleX,
            matrix.c / scaleY, matrix.d / scaleY,
            matrix.e, matrix.f // Preserve translation
        ]);
    }
    /**
     * Remove the rotation part of a matrix.
     */
    removeRotationFromMatrix(matrix) {
        let scaleX = Math.hypot(matrix.a, matrix.b); // Compute scaleX
        let scaleY = Math.hypot(matrix.c, matrix.d); // Compute scaleY
        return new DOMMatrix([
            scaleX, 0,
            0, scaleY,
            matrix.e, matrix.f // Preserve translation
        ]);
    }
    /**
     * Remove the translation part of a matrix.
     */
    removeTranslationFromMatrix(matrix) {
        return new DOMMatrix([
            matrix.a, matrix.b,
            matrix.c, matrix.d,
            0, 0 // Remove translation
        ]);
    }
    /**
     * Get the matrix of an element, to place it at the center of a parent element.
     */
    getFullMatrixFromElementCenter(parentElement, ignoreScale = true, ignoreRotation = true) {
        let fromRotationAndScaleMatrix = this.getRotationAndScaleMatrix(parentElement, true);
        if (ignoreScale) {
            fromRotationAndScaleMatrix = this.removeScaleFromMatrix(fromRotationAndScaleMatrix);
        }
        if (ignoreRotation) {
            fromRotationAndScaleMatrix = this.removeRotationFromMatrix(fromRotationAndScaleMatrix);
        }
        let fromElementRect = parentElement.getBoundingClientRect();
        const fromMatrix = new DOMMatrix().translateSelf(window.scrollX + fromElementRect.left + fromElementRect.width / 2, window.scrollY + fromElementRect.top + fromElementRect.height / 2).multiply(fromRotationAndScaleMatrix);
        return fromMatrix;
    }
    /**
     * Create a temp div of the same size as the element.
     */
    createFillingSpace(elem) {
        const div = document.createElement('div');
        div.style.width = elem.offsetWidth + 'px';
        div.style.height = elem.offsetHeight + 'px';
        return div;
    }
    /**
     * Make an empty space grow or shrink to replace where a moved object was or will be.
     * Ignore the animation settings, prefer addAnimatedSpaceIfNecessary.
     */
    addFixedSpace(element, parent, insertBefore) {
        const space = this.createFillingSpace(element);
        space.classList.add('bga-animations_filling-space');
        this.attachToElement(space, parent, insertBefore);
        return space;
    }
    /**
     * Make an empty space grow or shrink to replace where a moved object was or will be.
     * Ignore the animation settings, prefer addAnimatedSpaceIfNecessary.
     */
    addAnimatedSpace(element, parent, type, animationSettings, insertBefore) {
        const space = this.addFixedSpace(element, parent, insertBefore);
        space.classList.add('bga-animations_filling-space-' + type);
        const promise = space.animate([
            {
                width: 0,
                height: 0,
                offset: type === 'grow' ? 0 : 1,
            },
        ], Object.assign(Object.assign({ duration: 500, easing: 'ease-in-out' }, animationSettings), { iterations: 1 })).finished.then(animation => ({
            animation,
            animationWrapper: space,
        }));
        return promise;
    }
    /**
     * Make an empty space grow or shrink to replace where a moved object was or will be.
     * Only if the animation settings says so.
     */
    addAnimatedSpaceIfNecessary(element, parent, type, animationSettings, insertBefore) {
        var _a, _b;
        if ((['all', 'from'].includes((_a = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.fillingSpaces) !== null && _a !== void 0 ? _a : 'all') && type === 'shrink') ||
            (['all', 'to'].includes((_b = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.fillingSpaces) !== null && _b !== void 0 ? _b : 'all') && type === 'grow')) {
            return this.addAnimatedSpace(element, parent, type, animationSettings, insertBefore);
        }
        else {
            return Promise.resolve(null);
        }
    }
    /**
     * Returns the average of 2 matrixes.
     */
    averageDOMMatrix(matrix1, matrix2) {
        // Extract scale, rotation, and translation from both matrices
        const scaleX1 = Math.hypot(matrix1.a, matrix1.b);
        const scaleY1 = Math.hypot(matrix1.c, matrix1.d);
        const rotation1 = Math.atan2(matrix1.b, matrix1.a);
        const scaleX2 = Math.hypot(matrix2.a, matrix2.b);
        const scaleY2 = Math.hypot(matrix2.c, matrix2.d);
        const rotation2 = Math.atan2(matrix2.b, matrix2.a);
        const translateX1 = matrix1.e;
        const translateY1 = matrix1.f;
        const translateX2 = matrix2.e;
        const translateY2 = matrix2.f;
        // Average each component separately
        const avgScaleX = (scaleX1 + scaleX2) / 2;
        const avgScaleY = (scaleY1 + scaleY2) / 2;
        const avgRotation = (rotation1 + rotation2) / 2;
        const avgTranslateX = (translateX1 + translateX2) / 2;
        const avgTranslateY = (translateY1 + translateY2) / 2;
        // Construct the new averaged matrix
        const averagedMatrix = new DOMMatrix();
        averagedMatrix.a = avgScaleX * Math.cos(avgRotation);
        averagedMatrix.b = avgScaleX * Math.sin(avgRotation);
        averagedMatrix.c = -avgScaleY * Math.sin(avgRotation);
        averagedMatrix.d = avgScaleY * Math.cos(avgRotation);
        averagedMatrix.e = avgTranslateX;
        averagedMatrix.f = avgTranslateY;
        return averagedMatrix;
    }
    applyMatrixScale(matrix, scaleMatrix) {
        matrix.a = scaleMatrix.a; // Scale X
        matrix.d = scaleMatrix.d; // Scale Y
        return matrix;
    }
    /**
     * Add a wrapper around an element, and add the elment on that wrapper.
     * Needed before doing animations on the surface
     */
    wrapOnAnimationSurface(element) {
        // if the element is not yet in the DOM, we add it to the animation surface to be able to compute width/height
        if (!document.contains(element)) {
            this.animationSurface.appendChild(element);
        }
        const animationWrapper = this.createFillingSpace(element);
        animationWrapper.appendChild(element);
        animationWrapper.classList.add('bga-animations_animation-wrapper');
        this.animationSurface.appendChild(animationWrapper);
        const wrapperBR = animationWrapper.getBoundingClientRect();
        animationWrapper.style.left = `-${wrapperBR.width / 2}px`;
        animationWrapper.style.top = `-${wrapperBR.height / 2}px`;
        return animationWrapper;
    }
    /**
     * Add a wrapper layer.
     * Needed before doing sub-animations without messing to the animation on the main wrapper
     */
    addWrapperLayer(baseWrapper) {
        let element = this.getElementInWrapper(baseWrapper);
        const parent = element.parentElement;
        const animationWrapper = this.createFillingSpace(element);
        animationWrapper.appendChild(element);
        animationWrapper.classList.add('bga-animations_animation-wrapper');
        parent.appendChild(animationWrapper);
        return animationWrapper;
    }
    /**
     * Find the animated element in a possibly multi-layer wrapper.
     */
    getElementInWrapper(wrapper) {
        let element = wrapper;
        while (element.firstElementChild && element.classList.contains('bga-animations_animation-wrapper')) {
            element = element.firstElementChild;
        }
        return element;
    }
    /**
     * Creates a bump animation, that simulates a physical item being lifted from one place to another.
     */
    createBumpAnimation(bump) {
        if (bump === null || bump === 1) {
            return null;
        }
        return {
            keyframes: [
                { transform: `translate(0, -30px) scale(${bump !== null && bump !== void 0 ? bump : 1.2})`, offset: 0.5 },
            ]
        };
    }
    /**
     * Creates a fade animation, 'in' for appearing and 'out' for disappearing.
     */
    createFadeAnimation(type) {
        return {
            keyframes: [
                { opacity: type === 'in' ? 0 : 1 },
                { opacity: type === 'in' ? 1 : 0 },
            ]
        };
    }
    /**
     * Animate an object on the animation surface, from a matrix to a matrix.
     */
    animateOnAnimationSurface(animationWrapper, fromMatrix, toMatrix, animationSettings) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const finalSettings = Object.assign(Object.assign({ duration: 500, easing: 'ease-in-out' }, animationSettings), { iterations: 1 });
            let keyframes = [
                { transform: fromMatrix.toString() },
                { transform: toMatrix.toString() },
            ];
            const promises = [
                animationWrapper.animate(keyframes, finalSettings).finished
            ];
            (_a = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.parallelAnimations) === null || _a === void 0 ? void 0 : _a.forEach(parallelAnimation => {
                let parallelAnimationElement = parallelAnimation.applyToElement;
                if (!parallelAnimationElement) {
                    const applyTo = parallelAnimation.applyTo || 'intermediate';
                    parallelAnimationElement = applyTo === 'wrapper' ? animationWrapper : this.getElementInWrapper(animationWrapper);
                    if (applyTo === 'intermediate') {
                        parallelAnimationElement = this.addWrapperLayer(animationWrapper);
                    }
                }
                promises.push(parallelAnimationElement.firstElementChild.animate(parallelAnimation.keyframes, finalSettings).finished);
            });
            return yield Promise.all(promises).then(animations => ({
                animation: animations[0], animationWrapper,
                fromMatrix,
                toMatrix,
            }));
        });
    }
    /**
     * Attach an element to a new parent.
     */
    attachToElement(element, toElement, insertBefore) {
        if (insertBefore) {
            toElement.insertBefore(element, insertBefore);
        }
        else {
            toElement.appendChild(element);
            insertBefore;
        }
    }
    startSlideInAnimation(element, fromElement, fromIgnoreScale = true, fromIgnoreRotation = true, preserveScale = true) {
        const toParent = element.parentElement;
        const toNextSibling = element.nextElementSibling;
        const toMatrix = this.getFullMatrix(element);
        let fromMatrix = fromElement ?
            this.getFullMatrixFromElementCenter(fromElement, fromIgnoreScale, fromIgnoreRotation)
            : toMatrix;
        if (preserveScale) {
            fromMatrix = this.applyMatrixScale(fromMatrix, toMatrix);
        }
        const wrapper = this.wrapOnAnimationSurface(element);
        return {
            element,
            fromParent: fromElement,
            toParent,
            toNextSibling,
            wrapper,
            fromMatrix,
            toMatrix,
            wrappersToRemove: [wrapper],
        };
    }
    startSlideOutAnimation(element, toElement, fromIgnoreScale = true, fromIgnoreRotation = true, preserveScale = true) {
        const fromParent = element.parentElement;
        const fromNextSibling = element.nextElementSibling;
        const fromMatrix = this.getFullMatrix(element);
        let toMatrix = toElement ?
            this.getFullMatrixFromElementCenter(toElement, fromIgnoreScale, fromIgnoreRotation)
            : fromMatrix;
        if (preserveScale) {
            toMatrix = this.applyMatrixScale(toMatrix, fromMatrix);
        }
        const wrapper = this.wrapOnAnimationSurface(element);
        return {
            element,
            fromParent,
            fromNextSibling,
            toParent: toElement,
            wrapper,
            fromMatrix,
            toMatrix,
            wrappersToRemove: [wrapper],
        };
    }
    startAttachAnimation(element, toElement, insertBefore) {
        const fromParent = element.parentElement;
        const fromNextSibling = element.nextElementSibling;
        const fromMatrix = this.getFullMatrix(element);
        this.attachToElement(element, toElement, insertBefore);
        const toMatrix = this.getFullMatrix(element);
        const wrapper = this.wrapOnAnimationSurface(element);
        return {
            element,
            fromParent,
            fromNextSibling,
            toParent: toElement,
            toNextSibling: insertBefore,
            wrapper,
            fromMatrix,
            toMatrix,
            wrappersToRemove: [wrapper],
        };
    }
    endRunningAnimation(attachAnimation) {
        var _a, _b;
        if (attachAnimation.element) {
            // add before the filling space if it exists, else before the nextSibling
            this.attachToElement(attachAnimation.element, attachAnimation.toParent, (_a = attachAnimation.toSpaceWrapper) !== null && _a !== void 0 ? _a : attachAnimation.toNextSibling);
        }
        (_b = attachAnimation.wrappersToRemove) === null || _b === void 0 ? void 0 : _b.forEach(result => result === null || result === void 0 ? void 0 : result.remove());
    }
}
class AnimationManager {
    /**
     * @param game the BGA game class, usually it will be `this`
     * @param animationSettings: a `AnimationManagerSettings` object
     */
    constructor(game, animationSettings) {
        this.game = game;
        //private runningAnimations: Animation[] = [];
        this.base = new BaseAnimationManager();
        if (!game) {
            throw new Error('You must set your game as the first parameter of AnimationManager');
        }
        // if the player comes from or to hidden tab, no need to finish animation
        //document.addEventListener('visibilitychange', () => this.runningAnimations.forEach(runningAnimation => runningAnimation?.finish()));
        this.animationSettings = Object.assign({ duration: 500 }, animationSettings);
    }
    /**
     * Slide an object to an element.
     */
    slideAndAttach(element, toElement, animationSettings, insertBefore) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.game.bgaAnimationsActive()) {
                this.base.attachToElement(element, toElement, insertBefore);
                return null;
            }
            const runningAnimation = this.base.startAttachAnimation(element, toElement, insertBefore);
            const { fromParent, fromNextSibling, wrapper, fromMatrix, toMatrix } = runningAnimation;
            const allAnimationSettings = Object.assign(Object.assign({}, this.animationSettings), animationSettings);
            const finalAnimationSettings = Object.assign(Object.assign({}, allAnimationSettings), { parallelAnimations: [this.base.createBumpAnimation((_a = allAnimationSettings === null || allAnimationSettings === void 0 ? void 0 : allAnimationSettings.bump) !== null && _a !== void 0 ? _a : 1.2), ...(_b = allAnimationSettings === null || allAnimationSettings === void 0 ? void 0 : allAnimationSettings.parallelAnimations) !== null && _b !== void 0 ? _b : []] });
            yield Promise.all([
                this.base.addAnimatedSpaceIfNecessary(element, toElement, 'grow', allAnimationSettings, insertBefore),
                this.base.animateOnAnimationSurface(wrapper, fromMatrix, toMatrix, Object.assign({ easing: 'ease-in-out' }, finalAnimationSettings)),
                this.base.addAnimatedSpaceIfNecessary(element, fromParent, 'shrink', allAnimationSettings, fromNextSibling),
            ])
                .then(results => {
                var _a;
                runningAnimation.toSpaceWrapper = (_a = results[0]) === null || _a === void 0 ? void 0 : _a.animationWrapper;
                runningAnimation.wrappersToRemove.push(...results.map(result => result === null || result === void 0 ? void 0 : result.animationWrapper));
                this.base.endRunningAnimation(runningAnimation);
            });
        });
    }
    /**
     * Swap two elements.
     */
    swap(elements, animationSettings) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (elements.length !== 2) {
                throw new Error('AnimationManager.swap must be called with exactly 2 elements.');
            }
            const parents = elements.map(element => element.parentElement);
            const nextSiblings = elements.map(element => element.nextElementSibling);
            if (!this.game.bgaAnimationsActive()) {
                elements.forEach((element, index) => this.base.attachToElement(element, parents[1 - index], nextSiblings[1 - index]));
                return;
            }
            const allAnimationSettings = Object.assign(Object.assign({}, this.animationSettings), animationSettings);
            const finalAnimationSettings = Object.assign(Object.assign({}, allAnimationSettings), { parallelAnimations: [this.base.createBumpAnimation((_a = allAnimationSettings === null || allAnimationSettings === void 0 ? void 0 : allAnimationSettings.bump) !== null && _a !== void 0 ? _a : 1.2), ...(_b = allAnimationSettings === null || allAnimationSettings === void 0 ? void 0 : allAnimationSettings.parallelAnimations) !== null && _b !== void 0 ? _b : []] });
            const matrixes = elements.map(element => this.base.getFullMatrix(element));
            const wrappers = elements.map(element => this.base.wrapOnAnimationSurface(element));
            yield Promise.all(elements.map((element, index) => Promise.all([
                { animationWrapper: this.base.addFixedSpace(element, parents[1 - index], nextSiblings[1 - index]) },
                this.base.animateOnAnimationSurface(wrappers[index], matrixes[index], matrixes[1 - index], Object.assign({ easing: 'ease-in-out' }, finalAnimationSettings)),
                //this.base.addAnimatedSpaceIfNecessary(element, fromElement, 'shrink', allAnimationSettings, nextSibling),
            ])
                .then(results => {
                var _a, _b;
                // add before the filling space if it exists, else before the nextSibling
                this.base.attachToElement(element, parents[1 - index], (_b = (_a = results[0]) === null || _a === void 0 ? void 0 : _a.animationWrapper) !== null && _b !== void 0 ? _b : nextSiblings[1 - index]);
                results.forEach(result => { var _a; return (_a = result === null || result === void 0 ? void 0 : result.animationWrapper) === null || _a === void 0 ? void 0 : _a.remove(); });
            })));
        });
    }
    /**
     * Play a list of animations then attach to an element.
     */
    sequenceAnimationsAttach(element, toElement, animations, animationSettings, insertBefore) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.game.bgaAnimationsActive()) {
                this.base.attachToElement(element, toElement, insertBefore);
                return null;
            }
            let runningAnimation = this.base.startAttachAnimation(element, toElement, insertBefore);
            if (Array.isArray(animationSettings) && animationSettings.length !== animations.length) {
                throw new Error('slideToScreenCenterAndAttach animationSettings array must be made of as many elements as animations');
            }
            for (let index = 0; index < animations.length; index++) {
                const currentAnimation = animations[index];
                const currentAnimationSettings = Array.isArray(animationSettings) ? Object.assign(Object.assign({}, this.animationSettings), animationSettings[index]) : Object.assign(Object.assign({}, this.animationSettings), animationSettings);
                const promises = [
                    currentAnimation(runningAnimation, currentAnimationSettings),
                ];
                if (index === 0) { // shrinking animation
                    promises.push(this.base.addAnimatedSpaceIfNecessary(element, runningAnimation.fromParent, 'shrink', currentAnimationSettings, runningAnimation.fromNextSibling));
                }
                if (index === animations.length - 1) {
                    promises.push(this.base.addAnimatedSpaceIfNecessary(element, toElement, 'grow', currentAnimationSettings, insertBefore));
                }
                const results = yield Promise.all(promises);
                if (index === 0) { // remove shrinking animation
                    (_b = (_a = results[1]) === null || _a === void 0 ? void 0 : _a.animationWrapper) === null || _b === void 0 ? void 0 : _b.remove();
                }
                if (index === animations.length - 1) {
                    runningAnimation.toSpaceWrapper = (_c = results[animations.length - 1]) === null || _c === void 0 ? void 0 : _c.animationWrapper;
                    runningAnimation.wrappersToRemove.push(...results.map(result => result === null || result === void 0 ? void 0 : result.animationWrapper));
                }
                runningAnimation = results[0];
            }
            this.base.endRunningAnimation(runningAnimation);
        });
    }
    /**
     * Slide an object to the screen center then an element.
     */
    slideToScreenCenterAndAttach(element, toElement, animationSettings, insertBefore) {
        return __awaiter(this, void 0, void 0, function* () {
            const elementBR = element.getBoundingClientRect();
            const centerScreenMatrix = new DOMMatrix().translateSelf(window.scrollX + (window.innerWidth - elementBR.width) / 2, window.scrollY + (window.innerHeight - elementBR.height) / 2);
            const toCenterScreen = (runningAnimation, animationSettings) => __awaiter(this, void 0, void 0, function* () {
                yield this.base.animateOnAnimationSurface(runningAnimation.wrapper, runningAnimation.fromMatrix, centerScreenMatrix, animationSettings);
                runningAnimation.fromMatrix = centerScreenMatrix;
                return runningAnimation;
            });
            const toFinalPlace = (runningAnimation, animationSettings) => __awaiter(this, void 0, void 0, function* () {
                yield this.base.animateOnAnimationSurface(runningAnimation.wrapper, runningAnimation.fromMatrix, runningAnimation.toMatrix, animationSettings);
                return runningAnimation;
            });
            return yield this.sequenceAnimationsAttach(element, toElement, [
                toCenterScreen,
                toFinalPlace,
            ], animationSettings, insertBefore);
        });
    }
    /**
     * Slide an object over an intermediate element then attach to an element.
     */
    slideToElementAndAttach(element, overElement, toElement, animationSettings, insertBefore) {
        return __awaiter(this, void 0, void 0, function* () {
            const overElementMatrix = this.base.getFullMatrixFromElementCenter(overElement);
            const toCenterScreen = (runningAnimation, animationSettings) => __awaiter(this, void 0, void 0, function* () {
                yield this.base.animateOnAnimationSurface(runningAnimation.wrapper, runningAnimation.fromMatrix, overElementMatrix, animationSettings);
                runningAnimation.fromMatrix = overElementMatrix;
                return runningAnimation;
            });
            const toFinalPlace = (runningAnimation, animationSettings) => __awaiter(this, void 0, void 0, function* () {
                yield this.base.animateOnAnimationSurface(runningAnimation.wrapper, runningAnimation.fromMatrix, runningAnimation.toMatrix, animationSettings);
                return runningAnimation;
            });
            return yield this.sequenceAnimationsAttach(element, toElement, [
                toCenterScreen,
                toFinalPlace,
            ], animationSettings, insertBefore);
        });
    }
    /**
     * Slide an object in. The object must be attached to the destination before.
     */
    slideIn(element, fromElement, animationSettings) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.game.bgaAnimationsActive()) {
                return;
            }
            const allAnimationSettings = Object.assign(Object.assign({}, this.animationSettings), animationSettings);
            const runningAnimation = this.base.startSlideInAnimation(element, fromElement, (_a = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.ignoreScale) !== null && _a !== void 0 ? _a : true, (_b = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.ignoreRotation) !== null && _b !== void 0 ? _b : true, (_c = allAnimationSettings.preserveScale) !== null && _c !== void 0 ? _c : true);
            const { toParent, toNextSibling, wrapper, fromMatrix, toMatrix } = runningAnimation;
            const promises = [
                this.base.addAnimatedSpaceIfNecessary(element, toParent, 'grow', allAnimationSettings, toNextSibling),
                this.base.animateOnAnimationSurface(wrapper, fromMatrix, toMatrix, Object.assign({ easing: 'ease-out' }, allAnimationSettings)),
            ];
            yield Promise.all(promises)
                .then(results => {
                var _a;
                runningAnimation.toSpaceWrapper = (_a = results[0]) === null || _a === void 0 ? void 0 : _a.animationWrapper;
                runningAnimation.wrappersToRemove.push(...results.map(result => result === null || result === void 0 ? void 0 : result.animationWrapper));
                this.base.endRunningAnimation(runningAnimation);
            });
        });
    }
    /**
     * Fade an object in. The object must be attached to the destination before.
     */
    fadeIn(element, fromElement, animationSettings) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.game.bgaAnimationsActive()) {
                return;
            }
            const allAnimationSettings = Object.assign(Object.assign({}, this.animationSettings), animationSettings);
            const finalAnimationSettings = Object.assign(Object.assign({}, allAnimationSettings), { parallelAnimations: [this.base.createFadeAnimation('in'), ...(_a = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.parallelAnimations) !== null && _a !== void 0 ? _a : []] });
            yield this.slideIn(element, fromElement, finalAnimationSettings);
        });
    }
    /**
     * Fade out an object and destroy it. It call be called with a toElement, in that case a slide animation will be triggered.
     */
    fadeOutAndDestroy(element, toElement, animationSettings) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.game.bgaAnimationsActive()) {
                element.remove();
                return;
            }
            const allAnimationSettings = Object.assign(Object.assign({}, this.animationSettings), animationSettings);
            const finalAnimationSettings = Object.assign(Object.assign({}, allAnimationSettings), { parallelAnimations: [this.base.createFadeAnimation('out'), ...(_a = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.parallelAnimations) !== null && _a !== void 0 ? _a : []] });
            const runningAnimation = this.base.startSlideOutAnimation(element, toElement, (_b = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.ignoreScale) !== null && _b !== void 0 ? _b : false, (_c = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.ignoreRotation) !== null && _c !== void 0 ? _c : false, (_d = animationSettings.preserveScale) !== null && _d !== void 0 ? _d : true);
            const { wrapper, fromMatrix, toMatrix } = runningAnimation;
            yield Promise.all([
                this.base.addAnimatedSpaceIfNecessary(element, runningAnimation.fromParent, 'shrink', animationSettings, runningAnimation.fromNextSibling),
                this.base.animateOnAnimationSurface(wrapper, fromMatrix, toMatrix, Object.assign(Object.assign({ easing: 'ease-in' }, this.animationSettings), finalAnimationSettings)),
            ])
                .then(results => {
                element.remove();
                runningAnimation.element = null;
                runningAnimation.wrappersToRemove.push(...results.map(result => result.animationWrapper));
                this.base.endRunningAnimation(runningAnimation);
            });
        });
    }
    /**
     * Add a floating element over another element.
     */
    slideFloatingElement(element, fromElement, toElement, animationSettings) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.game.bgaAnimationsActive()) {
                return;
            }
            const allAnimationSettings = Object.assign(Object.assign({}, this.animationSettings), animationSettings);
            // before computation, to we able to get clientWidth/clientHeight
            const wrapper = this.base.wrapOnAnimationSurface(element);
            const toMatrix = this.base.getFullMatrixFromElementCenter(toElement, (_a = allAnimationSettings.ignoreScale) !== null && _a !== void 0 ? _a : true, (_b = allAnimationSettings.ignoreRotation) !== null && _b !== void 0 ? _b : true);
            const fromMatrix = fromElement ?
                this.base.getFullMatrixFromElementCenter(fromElement, (_c = allAnimationSettings.ignoreScale) !== null && _c !== void 0 ? _c : true, (_d = allAnimationSettings.ignoreRotation) !== null && _d !== void 0 ? _d : true) :
                toMatrix;
            if ((_e = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.scale) !== null && _e !== void 0 ? _e : 1 !== 1) {
                toMatrix.scaleSelf(animationSettings.scale, animationSettings.scale);
                fromMatrix.scaleSelf(animationSettings.scale, animationSettings.scale);
            }
            const promises = [
                this.base.animateOnAnimationSurface(wrapper, fromMatrix, toMatrix, Object.assign({ easing: 'ease-out' }, allAnimationSettings)),
            ];
            yield Promise.all(promises)
                .then(results => {
                element.remove();
                results.forEach(result => { var _a; return (_a = result === null || result === void 0 ? void 0 : result.animationWrapper) === null || _a === void 0 ? void 0 : _a.remove(); });
            });
        });
    }
    /**
     * Add a floating element over another element.
     */
    addFloatingElement(element, toElement, animationSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.slideFloatingElement(element, null, toElement, Object.assign({ bump: null }, animationSettings));
        });
    }
    /**
     * Add a floating message over another element.
     */
    displayMessage(toElement, message, color, animationSettings) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const scoreElement = document.createElement('div');
            scoreElement.classList.add('bga-animations_floating-message');
            scoreElement.innerText = message;
            scoreElement.style.setProperty('--color', `#${color}`);
            const zoomInOutAnimation = {
                keyframes: [
                    { transform: 'scale(0) rotate(360deg)', offset: 0 },
                    { transform: 'scale(1)', offset: 0.1 },
                    { transform: 'scale(1)', offset: 0.9 },
                    { transform: 'scale(0) rotate(360deg)', offset: 1 },
                ]
            };
            yield this.addFloatingElement(scoreElement, toElement, Object.assign(Object.assign({ duration: 2000 }, animationSettings), { parallelAnimations: [zoomInOutAnimation, ...((_a = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.parallelAnimations) !== null && _a !== void 0 ? _a : [])] }));
        });
    }
    /**
     * Add a floating number over another element.
     * It will be prefixed by '+' if positive, and '-' if negative.
     */
    displayScoring(toElement, score, color, animationSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = `${score > 0 ? '+' : ''}${score}`;
            yield this.displayMessage(toElement, message, color, animationSettings);
        });
    }
    /**
     * Play multiple animations a the same time.
     *
     * @param animations functions generating an animation, returning a Promise.
     * @returns promise when all animations ends
     */
    playParallel(animations) {
        return Promise.all(animations.map((animation, index) => animation(index)));
    }
    /**
     * Play multiple animations one after the other.
     *
     * @param animations functions generating an animation, returning a Promise.
     * @returns promise when all animations ends
     */
    playSequentially(animations) {
        return animations.reduce((prevPromise, animation) => prevPromise.then(() => animation()), Promise.resolve());
    }
    /**
     * Play multiple animations with a fixed interval between each animation.
     *
     * @param animations functions generating an animation, returning a Promise.
     * @returns promise when all animations ends
     */
    playInterval(animations, interval = this.animationSettings.duration / 4) {
        return new Promise((resolve) => {
            if (animations.length === 0) {
                resolve();
                return;
            }
            let index = 0;
            const promises = [
                animations[index](index),
            ];
            index++;
            const intervalId = setInterval(() => {
                if (index >= animations.length) {
                    clearInterval(intervalId);
                    Promise.all(promises).then(() => resolve());
                    return;
                }
                promises.push(animations[index](index));
                index++;
            }, interval);
        });
    }
}
