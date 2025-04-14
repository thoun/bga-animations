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
    getFullMatrix(element, params) {
        var _a, _b, _c, _d, _e;
        let fromRotationAndScaleMatrix = this.getRotationAndScaleMatrix(element, (_a = params === null || params === void 0 ? void 0 : params.includeSelfRotationAndScale) !== null && _a !== void 0 ? _a : true);
        if ((_b = params === null || params === void 0 ? void 0 : params.ignoreScale) !== null && _b !== void 0 ? _b : false) {
            fromRotationAndScaleMatrix = this.removeScaleFromMatrix(fromRotationAndScaleMatrix);
        }
        if ((_c = params === null || params === void 0 ? void 0 : params.ignoreRotation) !== null && _c !== void 0 ? _c : false) {
            fromRotationAndScaleMatrix = this.removeRotationFromMatrix(fromRotationAndScaleMatrix);
        }
        let fromElementRect = element.getBoundingClientRect();
        const horizontalBase = (_d = params === null || params === void 0 ? void 0 : params.horizontalBase) !== null && _d !== void 0 ? _d : 'center';
        const verticalBase = (_e = params === null || params === void 0 ? void 0 : params.verticalBase) !== null && _e !== void 0 ? _e : 'center';
        let x = window.scrollX + fromElementRect.left;
        if (horizontalBase === 'right') {
            x += fromElementRect.width;
        }
        else if (horizontalBase === 'center') {
            x += fromElementRect.width / 2;
        }
        let y = window.scrollY + fromElementRect.top;
        if (verticalBase === 'bottom') {
            y += fromElementRect.height;
        }
        else if (verticalBase === 'center') {
            y += fromElementRect.height / 2;
        }
        const fromMatrix = new DOMMatrix().translateSelf(x, y).multiply(fromRotationAndScaleMatrix);
        return fromMatrix;
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
    wrapOnAnimationSurface(element, positionSettings) {
        var _a, _b;
        // if the element is not yet in the DOM, we add it to the animation surface to be able to compute width/height
        if (!document.contains(element)) {
            this.animationSurface.appendChild(element);
        }
        const animationWrapper = this.createFillingSpace(element);
        animationWrapper.appendChild(element);
        animationWrapper.classList.add('bga-animations_animation-wrapper');
        this.animationSurface.appendChild(animationWrapper);
        const verticalBase = (_a = positionSettings === null || positionSettings === void 0 ? void 0 : positionSettings.verticalBase) !== null && _a !== void 0 ? _a : 'center';
        const horizontalBase = (_b = positionSettings === null || positionSettings === void 0 ? void 0 : positionSettings.horizontalBase) !== null && _b !== void 0 ? _b : 'center';
        const wrapperBR = animationWrapper.getBoundingClientRect();
        let left = 0;
        let top = 0;
        if (horizontalBase === 'right') {
            left = wrapperBR.width;
        }
        else if (horizontalBase === 'center') {
            left = wrapperBR.width / 2;
        }
        if (verticalBase === 'bottom') {
            top = wrapperBR.height;
        }
        else if (verticalBase === 'center') {
            top = wrapperBR.height / 2;
        }
        animationWrapper.style.left = `-${left}px`;
        animationWrapper.style.top = `-${top}px`;
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
        const toMatrix = this.getFullMatrix(element, { ignoreScale: false, ignoreRotation: false, includeSelfRotationAndScale: false });
        let fromMatrix = fromElement ?
            this.getFullMatrix(fromElement, { ignoreScale: fromIgnoreScale, ignoreRotation: fromIgnoreRotation })
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
        const fromMatrix = this.getFullMatrix(element, { ignoreScale: false, ignoreRotation: false, includeSelfRotationAndScale: false });
        let toMatrix = toElement ?
            this.getFullMatrix(toElement, { ignoreScale: fromIgnoreScale, ignoreRotation: fromIgnoreRotation })
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
        const fromMatrix = this.getFullMatrix(element, { ignoreScale: false, ignoreRotation: false, includeSelfRotationAndScale: false });
        this.attachToElement(element, toElement, insertBefore);
        const toMatrix = this.getFullMatrix(element, { ignoreScale: false, ignoreRotation: false, includeSelfRotationAndScale: false });
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
        (_b = attachAnimation.wrappersToRemove) === null || _b === void 0 ? void 0 : _b.forEach(wrapper => this.removeElement(wrapper));
    }
    removeElement(element) {
        if (!element) {
            return;
        }
        element.id = `removed-element-${new Date()}-${Math.random()}`;
        element.remove();
    }
    /**
     * Return a Promise that resolves at the end of a given number of ms.
     *
     * @param {number} delay the time to wait, in milliseconds
     * @returns a promise when the timer ends
     */
    wait(delay) {
        return __awaiter(this, void 0, void 0, function* () {
            if (delay > 0) {
                yield new Promise(resolve => setTimeout(resolve, delay));
            }
            else {
                yield Promise.resolve();
            }
        });
    }
}
class AnimationManager {
    /**
     * @param animationSettings: a `AnimationManagerSettings` object
     */
    constructor(animationSettings) {
        this.base = new BaseAnimationManager();
        this.animationSettings = Object.assign({ duration: 500, animationsActive: true }, animationSettings);
    }
    animationsActive() {
        if (typeof this.animationSettings.animationsActive === 'function') {
            return this.animationSettings.animationsActive();
        }
        else {
            return this.animationSettings.animationsActive;
        }
    }
    /**
     * Slide an object to an element.
     */
    slideAndAttach(element, toElement, animationSettings, insertBefore) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.animationsActive()) {
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
            if (!this.animationsActive()) {
                elements.forEach((element, index) => this.base.attachToElement(element, parents[1 - index], nextSiblings[1 - index]));
                return;
            }
            const allAnimationSettings = Object.assign(Object.assign({}, this.animationSettings), animationSettings);
            const finalAnimationSettings = Object.assign(Object.assign({}, allAnimationSettings), { parallelAnimations: [this.base.createBumpAnimation((_a = allAnimationSettings === null || allAnimationSettings === void 0 ? void 0 : allAnimationSettings.bump) !== null && _a !== void 0 ? _a : 1.2), ...(_b = allAnimationSettings === null || allAnimationSettings === void 0 ? void 0 : allAnimationSettings.parallelAnimations) !== null && _b !== void 0 ? _b : []] });
            const matrixes = elements.map(element => this.base.getFullMatrix(element, { ignoreScale: false, ignoreRotation: false, includeSelfRotationAndScale: false }));
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
                results.forEach(result => this.base.removeElement(result === null || result === void 0 ? void 0 : result.animationWrapper));
            })));
        });
    }
    /**
     * Play a list of animations then attach to an element.
     */
    sequenceAnimationsAttach(element, toElement, animations, animationSettings, insertBefore) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.animationsActive()) {
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
                    this.base.removeElement((_a = results[1]) === null || _a === void 0 ? void 0 : _a.animationWrapper);
                }
                if (index === animations.length - 1) {
                    runningAnimation.toSpaceWrapper = (_b = results[animations.length - 1]) === null || _b === void 0 ? void 0 : _b.animationWrapper;
                    runningAnimation.wrappersToRemove.push(...results.map(result => result === null || result === void 0 ? void 0 : result.animationWrapper));
                }
                runningAnimation = results[0];
                if (currentAnimationSettings.innerPause && index < animations.length - 1) {
                    yield this.base.animateOnAnimationSurface(runningAnimation.wrapper, runningAnimation.fromMatrix, runningAnimation.fromMatrix, { duration: currentAnimationSettings.innerPause });
                }
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
            const overElementMatrix = this.base.getFullMatrix(overElement, { ignoreScale: true, ignoreRotation: true });
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
            if (!this.animationsActive()) {
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
     * Slide an object in. The object must be attached to the destination before.
     */
    slideInFromDelta(element, fromDelta, animationSettings) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.animationsActive()) {
                return;
            }
            const allAnimationSettings = Object.assign(Object.assign({}, this.animationSettings), animationSettings);
            const runningAnimation = this.base.startSlideInAnimation(element, null, (_a = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.ignoreScale) !== null && _a !== void 0 ? _a : true, (_b = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.ignoreRotation) !== null && _b !== void 0 ? _b : true, (_c = allAnimationSettings.preserveScale) !== null && _c !== void 0 ? _c : true);
            const { toParent, toNextSibling, wrapper, toMatrix } = runningAnimation;
            const fromMatrix = runningAnimation.fromMatrix.translate(fromDelta.x, fromDelta.y);
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
            if (!this.animationsActive()) {
                return;
            }
            const allAnimationSettings = Object.assign(Object.assign({}, this.animationSettings), animationSettings);
            const finalAnimationSettings = Object.assign(Object.assign({}, allAnimationSettings), { parallelAnimations: [this.base.createFadeAnimation('in'), ...(_a = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.parallelAnimations) !== null && _a !== void 0 ? _a : []] });
            yield this.slideIn(element, fromElement, finalAnimationSettings);
        });
    }
    /**
     * slide out an object and destroy it. It call be called with a toElement, in that case a slide animation will be triggered.
     */
    slideOutAndDestroy(element, toElement, animationSettings) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.animationsActive()) {
                this.base.removeElement(element);
                return;
            }
            const finalAnimationSettings = Object.assign(Object.assign({}, this.animationSettings), animationSettings);
            const runningAnimation = this.base.startSlideOutAnimation(element, toElement, (_a = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.ignoreScale) !== null && _a !== void 0 ? _a : false, (_b = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.ignoreRotation) !== null && _b !== void 0 ? _b : false, (_c = animationSettings.preserveScale) !== null && _c !== void 0 ? _c : true);
            const { wrapper, fromMatrix, toMatrix } = runningAnimation;
            yield Promise.all([
                this.base.addAnimatedSpaceIfNecessary(element, runningAnimation.fromParent, 'shrink', animationSettings, runningAnimation.fromNextSibling),
                this.base.animateOnAnimationSurface(wrapper, fromMatrix, toMatrix, Object.assign(Object.assign({ easing: 'ease-in' }, this.animationSettings), finalAnimationSettings)),
            ])
                .then(results => {
                this.base.removeElement(element);
                runningAnimation.element = null;
                runningAnimation.wrappersToRemove.push(...results.map(result => result.animationWrapper));
                this.base.endRunningAnimation(runningAnimation);
            });
        });
    }
    /**
     * Fade out an object and destroy it. It call be called with a toElement, in that case a slide animation will be triggered.
     */
    fadeOutAndDestroy(element, toElement, animationSettings) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.animationsActive()) {
                this.base.removeElement(element);
                return;
            }
            const allAnimationSettings = Object.assign(Object.assign({}, this.animationSettings), animationSettings);
            const finalAnimationSettings = Object.assign(Object.assign({}, allAnimationSettings), { parallelAnimations: [this.base.createFadeAnimation('out'), ...(_a = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.parallelAnimations) !== null && _a !== void 0 ? _a : []] });
            yield this.slideOutAndDestroy(element, toElement, finalAnimationSettings);
        });
    }
    getFloatingElementParams(animationSettings, defaultAnimation) {
        var _a, _b;
        if (animationSettings && !animationSettings.fromSettings) {
            animationSettings.fromSettings = {
                ignoreScale: animationSettings.ignoreScale,
                ignoreRotation: animationSettings.ignoreRotation,
            };
        }
        if (animationSettings && !animationSettings.toSettings) {
            animationSettings.toSettings = {
                ignoreScale: animationSettings.ignoreScale,
                ignoreRotation: animationSettings.ignoreRotation,
            };
        }
        const allAnimationSettings = Object.assign(Object.assign({}, this.animationSettings), animationSettings);
        if (defaultAnimation && ((_a = allAnimationSettings.defaultAnimation) !== null && _a !== void 0 ? _a : true)) {
            allAnimationSettings.parallelAnimations = [defaultAnimation, ...((_b = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.parallelAnimations) !== null && _b !== void 0 ? _b : [])];
        }
        return allAnimationSettings;
    }
    /**
     * Add a floating element over another element.
     */
    slideFloatingElement(element, fromElement, toElement, animationSettings) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.animationsActive()) {
                return;
            }
            const allAnimationSettings = this.getFloatingElementParams(animationSettings);
            // before computation, to we able to get clientWidth/clientHeight
            const wrapper = this.base.wrapOnAnimationSurface(element, allAnimationSettings.toSettings);
            const toMatrix = this.base.getFullMatrix(toElement, Object.assign({ ignoreScale: true, ignoreRotation: true, includeSelfRotationAndScale: false }, allAnimationSettings.toSettings));
            const fromMatrix = fromElement ?
                this.base.getFullMatrix(fromElement, Object.assign({ ignoreScale: true, ignoreRotation: true, includeSelfRotationAndScale: false }, allAnimationSettings.fromSettings)) :
                toMatrix;
            if ((_a = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.scale) !== null && _a !== void 0 ? _a : 1 !== 1) {
                toMatrix.scaleSelf(animationSettings.scale, animationSettings.scale);
                fromMatrix.scaleSelf(animationSettings.scale, animationSettings.scale);
            }
            const promises = [
                this.base.animateOnAnimationSurface(wrapper, fromMatrix, toMatrix, Object.assign({ easing: 'ease-out' }, allAnimationSettings)),
            ];
            yield Promise.all(promises)
                .then(results => {
                this.base.removeElement(element);
                results.forEach(result => this.base.removeElement(result === null || result === void 0 ? void 0 : result.animationWrapper));
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
    addDisplayElementAnimationSettings(element, animationSettings) {
        var _a;
        let extraClasses = (_a = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.extraClasses) !== null && _a !== void 0 ? _a : [];
        if (animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.extraClass) {
            extraClasses.push(...animationSettings.extraClass.split(/\s+/));
        }
        element.classList.add(...extraClasses);
    }
    /**
     * Add a floating message over another element.
     */
    displayMessage(toElement, message, color, animationSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            const displayElement = document.createElement('div');
            displayElement.classList.add('bga-animations_floating-message');
            displayElement.innerText = message;
            displayElement.style.setProperty('--color', `#${color}`);
            this.addDisplayElementAnimationSettings(displayElement, animationSettings);
            const zoomInOutAnimation = {
                keyframes: [
                    { transform: 'scale(0) rotate(360deg)', offset: 0 },
                    { transform: 'scale(1)', offset: 0.1 },
                    { transform: 'scale(1)', offset: 0.9 },
                    { transform: 'scale(0) rotate(360deg)', offset: 1 },
                ]
            };
            const finalAnimationSettings = this.getFloatingElementParams(Object.assign({ duration: 2000 }, animationSettings), zoomInOutAnimation);
            yield this.addFloatingElement(displayElement, toElement, finalAnimationSettings);
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
    displayBubble(toElement, message, animationSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            const displayElement = document.createElement('div');
            displayElement.classList.add('bga-animations_discussion-bubble');
            displayElement.innerHTML = message;
            this.addDisplayElementAnimationSettings(displayElement, animationSettings);
            const fadeInOutAnimation = {
                keyframes: [
                    { opacity: 0, offset: 0 },
                    { opacity: 1, offset: 0.1 },
                    { opacity: 1, offset: 0.9 },
                    { opacity: 0, offset: 1 },
                ]
            };
            const finalAnimationSettings = this.getFloatingElementParams(Object.assign({ duration: 2000 }, animationSettings), fadeInOutAnimation);
            if (!finalAnimationSettings.toSettings.verticalBase) {
                finalAnimationSettings.toSettings.verticalBase = 'top';
            }
            if (finalAnimationSettings.toSettings.verticalBase && !finalAnimationSettings.fromSettings.verticalBase) {
                finalAnimationSettings.fromSettings.verticalBase = finalAnimationSettings.toSettings.verticalBase === 'bottom' ? 'top' : 'bottom';
            }
            displayElement.dataset.verticalBase = finalAnimationSettings.toSettings.verticalBase;
            yield this.addFloatingElement(displayElement, toElement, finalAnimationSettings);
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
