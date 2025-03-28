var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var BaseAnimationManager = /** @class */ (function () {
    function BaseAnimationManager() {
        this.createAnimationSurface();
    }
    /**
     * Create the animation surface, an unselectable div starting at the top of the screen where the animated element will be attached.
     */
    BaseAnimationManager.prototype.createAnimationSurface = function () {
        this.animationSurface = document.createElement('div');
        this.animationSurface.classList.add('bga-animations_animation-surface');
        document.body.appendChild(this.animationSurface);
    };
    /**
     * Get the translate X & Y for the element, from the top of the page.
     */
    BaseAnimationManager.prototype.getTopPageOffset = function (element) {
        var elementRect = element.getBoundingClientRect();
        // Compute position of the element center from top-left of the page, ignoring rotation/scale changing the BR width/height
        var x = elementRect.left + elementRect.width / 2 + window.scrollX;
        var y = elementRect.top + elementRect.height / 2 + window.scrollY;
        return new DOMMatrix().translateSelf(x, y);
    };
    /**
     * Get rotation & scale matrix for an element, relative to the parent.
     */
    BaseAnimationManager.prototype.getRotationAndScaleMatrixForElement = function (element) {
        var style = window.getComputedStyle(element);
        // Get transform matrix, ignoring translation
        var transformMatrix = style.transform === "none" ? new DOMMatrix() : new DOMMatrix(style.transform);
        transformMatrix.e = 0;
        transformMatrix.f = 0;
        // Get rotate and convert to matrix
        var rotateValue = style.rotate !== "none" ? parseFloat(style.rotate) : 0;
        var rotateMatrix = new DOMMatrix();
        rotateMatrix.rotateSelf(0, 0, rotateValue);
        // Get zoom (non-standard)
        var zoomValue = style.zoom ? parseFloat(style.zoom) : 1;
        var zoomMatrix = new DOMMatrix();
        zoomMatrix.scaleSelf(zoomValue, zoomValue);
        // Final matrix = zoom * transform * rotate
        var finalMatrix = zoomMatrix.multiply(transformMatrix).multiply(rotateMatrix);
        return finalMatrix;
    };
    /**
     * Get rotation & scale matrix for an element, relative to the top of the page.
     */
    BaseAnimationManager.prototype.getRotationAndScaleMatrix = function (element, includeSelf) {
        if (includeSelf === void 0) { includeSelf = false; }
        var matrix = new DOMMatrix();
        var currentElement = includeSelf ? element : element.parentElement;
        while (currentElement && currentElement !== document.documentElement) {
            matrix = this.getRotationAndScaleMatrixForElement(currentElement).multiply(matrix);
            currentElement = currentElement.parentElement;
        }
        return matrix;
    };
    /**
     * Get translation, rotation & scale matrix for an element, relative to the top of the page.
     */
    BaseAnimationManager.prototype.getFullMatrix = function (element) {
        var rotationAndScaleMatrix = this.getRotationAndScaleMatrix(element);
        var topPageOffset = this.getTopPageOffset(element);
        return topPageOffset.multiply(rotationAndScaleMatrix);
    };
    /**
     * Remove the scale part of a matrix.
     */
    BaseAnimationManager.prototype.removeScaleFromMatrix = function (matrix) {
        var scaleX = Math.hypot(matrix.a, matrix.b); // Compute the scale from a & b
        var scaleY = Math.hypot(matrix.c, matrix.d); // Compute the scale from c & d
        return new DOMMatrix([
            matrix.a / scaleX, matrix.b / scaleX,
            matrix.c / scaleY, matrix.d / scaleY,
            matrix.e, matrix.f // Preserve translation
        ]);
    };
    /**
     * Remove the rotation part of a matrix.
     */
    BaseAnimationManager.prototype.removeRotationFromMatrix = function (matrix) {
        var scaleX = Math.hypot(matrix.a, matrix.b); // Compute scaleX
        var scaleY = Math.hypot(matrix.c, matrix.d); // Compute scaleY
        return new DOMMatrix([
            scaleX, 0,
            0, scaleY,
            matrix.e, matrix.f // Preserve translation
        ]);
    };
    /**
     * Remove the translation part of a matrix.
     */
    BaseAnimationManager.prototype.removeTranslationFromMatrix = function (matrix) {
        return new DOMMatrix([
            matrix.a, matrix.b,
            matrix.c, matrix.d,
            0, 0 // Remove translation
        ]);
    };
    /**
     * Get the matrix of an element, to place it at the center of a parent element.
     */
    BaseAnimationManager.prototype.getFullMatrixFromElementCenter = function (parentElement, ignoreScale, ignoreRotation) {
        if (ignoreScale === void 0) { ignoreScale = true; }
        if (ignoreRotation === void 0) { ignoreRotation = true; }
        var fromRotationAndScaleMatrix = this.getRotationAndScaleMatrix(parentElement, true);
        if (ignoreScale) {
            fromRotationAndScaleMatrix = this.removeScaleFromMatrix(fromRotationAndScaleMatrix);
        }
        if (ignoreRotation) {
            fromRotationAndScaleMatrix = this.removeRotationFromMatrix(fromRotationAndScaleMatrix);
        }
        var fromElementRect = parentElement.getBoundingClientRect();
        var fromMatrix = new DOMMatrix().translateSelf(window.scrollX + fromElementRect.left + fromElementRect.width / 2, window.scrollY + fromElementRect.top + fromElementRect.height / 2).multiply(fromRotationAndScaleMatrix);
        return fromMatrix;
    };
    /**
     * Create a temp div of the same size as the element.
     */
    BaseAnimationManager.prototype.createFillingSpace = function (elem) {
        var div = document.createElement('div');
        div.style.width = elem.offsetWidth + 'px';
        div.style.height = elem.offsetHeight + 'px';
        return div;
    };
    /**
     * Make an empty space grow or shrink to replace where a moved object was or will be.
     * Ignore the animation settings, prefer addAnimatedSpaceIfNecessary.
     */
    BaseAnimationManager.prototype.addFixedSpace = function (element, parent, insertBefore) {
        var space = this.createFillingSpace(element);
        space.classList.add('bga-animations_filling-space');
        this.attachToElement(space, parent, insertBefore);
        return space;
    };
    /**
     * Make an empty space grow or shrink to replace where a moved object was or will be.
     * Ignore the animation settings, prefer addAnimatedSpaceIfNecessary.
     */
    BaseAnimationManager.prototype.addAnimatedSpace = function (element, parent, type, animationSettings, insertBefore) {
        var space = this.addFixedSpace(element, parent, insertBefore);
        space.classList.add('bga-animations_filling-space-' + type);
        var promise = space.animate([
            {
                width: 0,
                height: 0,
                offset: type === 'grow' ? 0 : 1,
            },
        ], __assign(__assign({ duration: 500, easing: 'ease-in-out' }, animationSettings), { iterations: 1 })).finished.then(function (animation) { return ({
            animation: animation,
            animationWrapper: space,
        }); });
        return promise;
    };
    /**
     * Make an empty space grow or shrink to replace where a moved object was or will be.
     * Only if the animation settings says so.
     */
    BaseAnimationManager.prototype.addAnimatedSpaceIfNecessary = function (element, parent, type, animationSettings, insertBefore) {
        var _a, _b;
        if ((['all', 'from'].includes((_a = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.fillingSpaces) !== null && _a !== void 0 ? _a : 'all') && type === 'shrink') ||
            (['all', 'to'].includes((_b = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.fillingSpaces) !== null && _b !== void 0 ? _b : 'all') && type === 'grow')) {
            return this.addAnimatedSpace(element, parent, type, animationSettings, insertBefore);
        }
    };
    /**
     * Returns the average of 2 matrixes.
     */
    BaseAnimationManager.prototype.averageDOMMatrix = function (matrix1, matrix2) {
        // Extract scale, rotation, and translation from both matrices
        var scaleX1 = Math.hypot(matrix1.a, matrix1.b);
        var scaleY1 = Math.hypot(matrix1.c, matrix1.d);
        var rotation1 = Math.atan2(matrix1.b, matrix1.a);
        var scaleX2 = Math.hypot(matrix2.a, matrix2.b);
        var scaleY2 = Math.hypot(matrix2.c, matrix2.d);
        var rotation2 = Math.atan2(matrix2.b, matrix2.a);
        var translateX1 = matrix1.e;
        var translateY1 = matrix1.f;
        var translateX2 = matrix2.e;
        var translateY2 = matrix2.f;
        // Average each component separately
        var avgScaleX = (scaleX1 + scaleX2) / 2;
        var avgScaleY = (scaleY1 + scaleY2) / 2;
        var avgRotation = (rotation1 + rotation2) / 2;
        var avgTranslateX = (translateX1 + translateX2) / 2;
        var avgTranslateY = (translateY1 + translateY2) / 2;
        // Construct the new averaged matrix
        var averagedMatrix = new DOMMatrix();
        averagedMatrix.a = avgScaleX * Math.cos(avgRotation);
        averagedMatrix.b = avgScaleX * Math.sin(avgRotation);
        averagedMatrix.c = -avgScaleY * Math.sin(avgRotation);
        averagedMatrix.d = avgScaleY * Math.cos(avgRotation);
        averagedMatrix.e = avgTranslateX;
        averagedMatrix.f = avgTranslateY;
        return averagedMatrix;
    };
    /**
     * Add a wrapper around an element, and add the elment on that wrapper.
     * Needed before doing animations on the surface
     */
    BaseAnimationManager.prototype.wrapOnAnimationSurface = function (element) {
        // if the element is not yet in the DOM, we add it to the animation surface to be able to compute width/height
        if (!document.contains(element)) {
            this.animationSurface.appendChild(element);
        }
        var animationWrapper = this.createFillingSpace(element);
        animationWrapper.appendChild(element);
        animationWrapper.classList.add('bga-animations_animation-wrapper');
        this.animationSurface.appendChild(animationWrapper);
        var wrapperBR = animationWrapper.getBoundingClientRect();
        animationWrapper.style.left = "-".concat(wrapperBR.width / 2, "px");
        animationWrapper.style.top = "-".concat(wrapperBR.height / 2, "px");
        return animationWrapper;
    };
    /**
     * Add a wrapper layer.
     * Needed before doing sub-animations without messing to the animation on the main wrapper
     */
    BaseAnimationManager.prototype.addWrapperLayer = function (baseWrapper) {
        var element = this.getElementInWrapper(baseWrapper);
        var parent = element.parentElement;
        var animationWrapper = this.createFillingSpace(element);
        animationWrapper.appendChild(element);
        animationWrapper.classList.add('bga-animations_animation-wrapper');
        parent.appendChild(animationWrapper);
        return animationWrapper;
    };
    /**
     * Find the animated element in a possibly multi-layer wrapper.
     */
    BaseAnimationManager.prototype.getElementInWrapper = function (wrapper) {
        var element = wrapper;
        while (element.firstElementChild && element.classList.contains('bga-animations_animation-wrapper')) {
            element = element.firstElementChild;
        }
        return element;
    };
    /**
     * Creates a bump animation, that simulates a piece being lifted from one place to another.
     */
    BaseAnimationManager.prototype.createBumpAnimation = function (bump) {
        if (bump === null || bump === 1) {
            return null;
        }
        return {
            keyframes: [
                { transform: "translate(0, -30px) scale(".concat(bump !== null && bump !== void 0 ? bump : 1.2, ")"), offset: 0.5 },
            ]
        };
    };
    /**
     * Creates a fade animation, 'in' for appearing and 'out' for disappearing.
     */
    BaseAnimationManager.prototype.createFadeAnimation = function (type) {
        return {
            keyframes: [
                { opacity: type === 'in' ? 0 : 1 },
                { opacity: type === 'in' ? 1 : 0 },
            ]
        };
    };
    /**
     * Animate an object on the animation surface, from a matrix to a matrix.
     */
    BaseAnimationManager.prototype.animateOnAnimationSurface = function (animationWrapper, fromMatrix, toMatrix, animationSettings) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var finalSettings, keyframes, promises;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        finalSettings = __assign(__assign({ duration: 500, easing: 'ease-in-out' }, animationSettings), { iterations: 1 });
                        keyframes = [
                            { transform: fromMatrix.toString() },
                            { transform: toMatrix.toString() },
                        ];
                        promises = [
                            animationWrapper.animate(keyframes, finalSettings).finished
                        ];
                        (_a = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.parallelAnimations) === null || _a === void 0 ? void 0 : _a.forEach(function (parallelAnimation) {
                            var parallelAnimationElement = parallelAnimation.applyToElement;
                            if (!parallelAnimationElement) {
                                var applyTo = parallelAnimation.applyTo || 'intermediate';
                                parallelAnimationElement = applyTo === 'wrapper' ? animationWrapper : _this.getElementInWrapper(animationWrapper);
                                if (applyTo === 'intermediate') {
                                    parallelAnimationElement = _this.addWrapperLayer(animationWrapper);
                                }
                            }
                            promises.push(parallelAnimationElement.firstElementChild.animate(parallelAnimation.keyframes, finalSettings).finished);
                        });
                        return [4 /*yield*/, Promise.all(promises).then(function (animations) { return ({
                                animation: animations[0],
                                animationWrapper: animationWrapper,
                                fromMatrix: fromMatrix,
                                toMatrix: toMatrix,
                            }); })];
                    case 1: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    /**
     * Attach an element to a new parent.
     */
    BaseAnimationManager.prototype.attachToElement = function (element, toElement, insertBefore) {
        if (insertBefore) {
            toElement.insertBefore(element, insertBefore);
        }
        else {
            toElement.appendChild(element);
            insertBefore;
        }
    };
    BaseAnimationManager.prototype.startSlideInAnimation = function (element, fromElement, fromIgnoreScale, fromIgnoreRotation) {
        if (fromIgnoreScale === void 0) { fromIgnoreScale = true; }
        if (fromIgnoreRotation === void 0) { fromIgnoreRotation = true; }
        var toParent = element.parentElement;
        var toNextSibling = element.nextElementSibling;
        var toMatrix = this.getFullMatrix(element);
        var fromMatrix = fromElement ?
            this.getFullMatrixFromElementCenter(fromElement, fromIgnoreScale, fromIgnoreRotation)
            : toMatrix;
        var wrapper = this.wrapOnAnimationSurface(element);
        return {
            element: element,
            fromParent: fromElement,
            toParent: toParent,
            toNextSibling: toNextSibling,
            wrapper: wrapper,
            fromMatrix: fromMatrix,
            toMatrix: toMatrix,
            wrappersToRemove: [wrapper],
        };
    };
    BaseAnimationManager.prototype.startSlideOutAnimation = function (element, toElement, fromIgnoreScale, fromIgnoreRotation) {
        if (fromIgnoreScale === void 0) { fromIgnoreScale = true; }
        if (fromIgnoreRotation === void 0) { fromIgnoreRotation = true; }
        var fromParent = element.parentElement;
        var fromNextSibling = element.nextElementSibling;
        var fromMatrix = this.getFullMatrix(element);
        var toMatrix = toElement ?
            this.getFullMatrixFromElementCenter(toElement, fromIgnoreScale, fromIgnoreRotation)
            : fromMatrix;
        var wrapper = this.wrapOnAnimationSurface(element);
        return {
            element: element,
            fromParent: fromParent,
            fromNextSibling: fromNextSibling,
            toParent: toElement,
            wrapper: wrapper,
            fromMatrix: fromMatrix,
            toMatrix: toMatrix,
            wrappersToRemove: [wrapper],
        };
    };
    BaseAnimationManager.prototype.startAttachAnimation = function (element, toElement, insertBefore) {
        var fromParent = element.parentElement;
        var fromNextSibling = element.nextElementSibling;
        var fromMatrix = this.getFullMatrix(element);
        this.attachToElement(element, toElement, insertBefore);
        var toMatrix = this.getFullMatrix(element);
        var wrapper = this.wrapOnAnimationSurface(element);
        return {
            element: element,
            fromParent: fromParent,
            fromNextSibling: fromNextSibling,
            toParent: toElement,
            toNextSibling: insertBefore,
            wrapper: wrapper,
            fromMatrix: fromMatrix,
            toMatrix: toMatrix,
            wrappersToRemove: [wrapper],
        };
    };
    BaseAnimationManager.prototype.endRunningAnimation = function (attachAnimation) {
        var _a, _b;
        if (attachAnimation.element) {
            // add before the filling space if it exists, else before the nextSibling
            this.attachToElement(attachAnimation.element, attachAnimation.toParent, (_a = attachAnimation.toSpaceWrapper) !== null && _a !== void 0 ? _a : attachAnimation.toNextSibling);
        }
        (_b = attachAnimation.wrappersToRemove) === null || _b === void 0 ? void 0 : _b.forEach(function (result) { return result === null || result === void 0 ? void 0 : result.remove(); });
    };
    return BaseAnimationManager;
}());
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var AnimationManager = /** @class */ (function () {
    /**
     * @param game the BGA game class, usually it will be `this`
     * @param animationSettings: a `AnimationManagerSettings` object
     */
    function AnimationManager(game, animationSettings) {
        this.game = game;
        //private runningAnimations: Animation[] = [];
        this.base = new BaseAnimationManager();
        if (!game) {
            throw new Error('You must set your game as the first parameter of AnimationManager');
        }
        // if the player comes from or to hidden tab, no need to finish animation
        //document.addEventListener('visibilitychange', () => this.runningAnimations.forEach(runningAnimation => runningAnimation?.finish()));
        this.animationSettings = __assign({ duration: 500 }, animationSettings);
    }
    /**
     * Slide an object to an element.
     */
    AnimationManager.prototype.slideAndAttach = function (element, toElement, animationSettings, insertBefore) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var runningAnimation, fromParent, fromNextSibling, wrapper, fromMatrix, toMatrix, allAnimationSettings, finalAnimationSettings;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.game.bgaAnimationsActive()) {
                            this.base.attachToElement(element, toElement, insertBefore);
                            return [2 /*return*/, null];
                        }
                        runningAnimation = this.base.startAttachAnimation(element, toElement, insertBefore);
                        fromParent = runningAnimation.fromParent, fromNextSibling = runningAnimation.fromNextSibling, wrapper = runningAnimation.wrapper, fromMatrix = runningAnimation.fromMatrix, toMatrix = runningAnimation.toMatrix;
                        allAnimationSettings = __assign(__assign({}, this.animationSettings), animationSettings);
                        finalAnimationSettings = __assign(__assign({}, allAnimationSettings), { parallelAnimations: __spreadArray([this.base.createBumpAnimation((_a = allAnimationSettings === null || allAnimationSettings === void 0 ? void 0 : allAnimationSettings.bump) !== null && _a !== void 0 ? _a : 1.2)], (_b = allAnimationSettings === null || allAnimationSettings === void 0 ? void 0 : allAnimationSettings.parallelAnimations) !== null && _b !== void 0 ? _b : [], true) });
                        return [4 /*yield*/, Promise.all([
                                this.base.addAnimatedSpaceIfNecessary(element, toElement, 'grow', allAnimationSettings, insertBefore),
                                this.base.animateOnAnimationSurface(wrapper, fromMatrix, toMatrix, __assign({ easing: 'ease-in-out' }, finalAnimationSettings)),
                                this.base.addAnimatedSpaceIfNecessary(element, fromParent, 'shrink', allAnimationSettings, fromNextSibling),
                            ])
                                .then(function (results) {
                                var _a;
                                runningAnimation.toSpaceWrapper = results[0].animationWrapper;
                                (_a = runningAnimation.wrappersToRemove).push.apply(_a, results.map(function (result) { return result.animationWrapper; }));
                                _this.base.endRunningAnimation(runningAnimation);
                            })];
                    case 1:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Swap two elements.
     */
    AnimationManager.prototype.swap = function (elements, animationSettings) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var parents, nextSiblings, allAnimationSettings, finalAnimationSettings, matrixes, wrappers;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (elements.length !== 2) {
                            throw new Error('AnimationManager.swap must be called with exactly 2 elements.');
                        }
                        parents = elements.map(function (element) { return element.parentElement; });
                        nextSiblings = elements.map(function (element) { return element.nextElementSibling; });
                        if (!this.game.bgaAnimationsActive()) {
                            elements.forEach(function (element, index) { return _this.base.attachToElement(element, parents[1 - index], nextSiblings[1 - index]); });
                            return [2 /*return*/];
                        }
                        allAnimationSettings = __assign(__assign({}, this.animationSettings), animationSettings);
                        finalAnimationSettings = __assign(__assign({}, allAnimationSettings), { parallelAnimations: __spreadArray([this.base.createBumpAnimation((_a = allAnimationSettings === null || allAnimationSettings === void 0 ? void 0 : allAnimationSettings.bump) !== null && _a !== void 0 ? _a : 1.2)], (_b = allAnimationSettings === null || allAnimationSettings === void 0 ? void 0 : allAnimationSettings.parallelAnimations) !== null && _b !== void 0 ? _b : [], true) });
                        matrixes = elements.map(function (element) { return _this.base.getFullMatrix(element); });
                        wrappers = elements.map(function (element) { return _this.base.wrapOnAnimationSurface(element); });
                        return [4 /*yield*/, Promise.all(elements.map(function (element, index) { return Promise.all([
                                { animationWrapper: _this.base.addFixedSpace(element, parents[1 - index], nextSiblings[1 - index]) },
                                _this.base.animateOnAnimationSurface(wrappers[index], matrixes[index], matrixes[1 - index], __assign({ easing: 'ease-in-out' }, finalAnimationSettings)),
                                //this.base.addAnimatedSpaceIfNecessary(element, fromElement, 'shrink', allAnimationSettings, nextSibling),
                            ])
                                .then(function (results) {
                                var _a, _b;
                                // add before the filling space if it exists, else before the nextSibling
                                _this.base.attachToElement(element, parents[1 - index], (_b = (_a = results[0]) === null || _a === void 0 ? void 0 : _a.animationWrapper) !== null && _b !== void 0 ? _b : nextSiblings[1 - index]);
                                results.forEach(function (result) { var _a; return (_a = result === null || result === void 0 ? void 0 : result.animationWrapper) === null || _a === void 0 ? void 0 : _a.remove(); });
                            }); }))];
                    case 1:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Play a list of animations then attach to an element.
     */
    AnimationManager.prototype.sequenceAnimationsAttach = function (element, toElement, animations, animationSettings, insertBefore) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function () {
            var runningAnimation, index, currentAnimation, currentAnimationSettings, promises, results;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!this.game.bgaAnimationsActive()) {
                            this.base.attachToElement(element, toElement, insertBefore);
                            return [2 /*return*/, null];
                        }
                        runningAnimation = this.base.startAttachAnimation(element, toElement, insertBefore);
                        if (Array.isArray(animationSettings) && animationSettings.length !== animations.length) {
                            throw new Error('slideToScreenCenterAndAttach animationSettings array must be made of as many elements as animations');
                        }
                        index = 0;
                        _e.label = 1;
                    case 1:
                        if (!(index < animations.length)) return [3 /*break*/, 4];
                        currentAnimation = animations[index];
                        currentAnimationSettings = Array.isArray(animationSettings) ? __assign(__assign({}, this.animationSettings), animationSettings[index]) : __assign(__assign({}, this.animationSettings), animationSettings);
                        promises = [
                            currentAnimation(runningAnimation, currentAnimationSettings),
                        ];
                        if (index === 0) { // shrinking animation
                            promises.push(this.base.addAnimatedSpaceIfNecessary(element, runningAnimation.fromParent, 'shrink', currentAnimationSettings, runningAnimation.fromNextSibling));
                        }
                        if (index === animations.length - 1) {
                            promises.push(this.base.addAnimatedSpaceIfNecessary(element, toElement, 'grow', currentAnimationSettings, insertBefore));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 2:
                        results = _e.sent();
                        if (index === 0) { // remove shrinking animation
                            (_b = (_a = results[1]) === null || _a === void 0 ? void 0 : _a.animationWrapper) === null || _b === void 0 ? void 0 : _b.remove();
                        }
                        if (index === animations.length - 1) {
                            runningAnimation.toSpaceWrapper = (_c = results[animations.length - 1]) === null || _c === void 0 ? void 0 : _c.animationWrapper;
                            (_d = runningAnimation.wrappersToRemove).push.apply(_d, results.map(function (result) { return result.animationWrapper; }));
                        }
                        runningAnimation = results[0];
                        _e.label = 3;
                    case 3:
                        index++;
                        return [3 /*break*/, 1];
                    case 4:
                        this.base.endRunningAnimation(runningAnimation);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Slide an object to the screen center then an element.
     */
    AnimationManager.prototype.slideToScreenCenterAndAttach = function (element, toElement, animationSettings, insertBefore) {
        return __awaiter(this, void 0, void 0, function () {
            var elementBR, centerScreenMatrix, toCenterScreen, toFinalPlace;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        elementBR = element.getBoundingClientRect();
                        centerScreenMatrix = new DOMMatrix().translateSelf(window.scrollX + (window.innerWidth - elementBR.width) / 2, window.scrollY + (window.innerHeight - elementBR.height) / 2);
                        toCenterScreen = function (runningAnimation, animationSettings) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.base.animateOnAnimationSurface(runningAnimation.wrapper, runningAnimation.fromMatrix, centerScreenMatrix, animationSettings)];
                                    case 1:
                                        _a.sent();
                                        runningAnimation.fromMatrix = centerScreenMatrix;
                                        return [2 /*return*/, runningAnimation];
                                }
                            });
                        }); };
                        toFinalPlace = function (runningAnimation, animationSettings) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.base.animateOnAnimationSurface(runningAnimation.wrapper, runningAnimation.fromMatrix, runningAnimation.toMatrix, animationSettings)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/, runningAnimation];
                                }
                            });
                        }); };
                        return [4 /*yield*/, this.sequenceAnimationsAttach(element, toElement, [
                                toCenterScreen,
                                toFinalPlace,
                            ], animationSettings, insertBefore)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Slide an object over an intermediate element then attach to an element.
     */
    AnimationManager.prototype.slideToElementAndAttach = function (element, overElement, toElement, animationSettings, insertBefore) {
        return __awaiter(this, void 0, void 0, function () {
            var overElementMatrix, toCenterScreen, toFinalPlace;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        overElementMatrix = this.base.getFullMatrixFromElementCenter(overElement);
                        toCenterScreen = function (runningAnimation, animationSettings) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.base.animateOnAnimationSurface(runningAnimation.wrapper, runningAnimation.fromMatrix, overElementMatrix, animationSettings)];
                                    case 1:
                                        _a.sent();
                                        runningAnimation.fromMatrix = overElementMatrix;
                                        return [2 /*return*/, runningAnimation];
                                }
                            });
                        }); };
                        toFinalPlace = function (runningAnimation, animationSettings) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.base.animateOnAnimationSurface(runningAnimation.wrapper, runningAnimation.fromMatrix, runningAnimation.toMatrix, animationSettings)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/, runningAnimation];
                                }
                            });
                        }); };
                        return [4 /*yield*/, this.sequenceAnimationsAttach(element, toElement, [
                                toCenterScreen,
                                toFinalPlace,
                            ], animationSettings, insertBefore)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Slide an object in. The object must be attached to the destination before.
     */
    AnimationManager.prototype.slideIn = function (element, fromElement, animationSettings) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var runningAnimation, toParent, toNextSibling, wrapper, fromMatrix, toMatrix, allAnimationSettings, promises;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.game.bgaAnimationsActive()) {
                            return [2 /*return*/];
                        }
                        runningAnimation = this.base.startSlideInAnimation(element, fromElement, (_a = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.ignoreScale) !== null && _a !== void 0 ? _a : true, (_b = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.ignoreRotation) !== null && _b !== void 0 ? _b : true);
                        toParent = runningAnimation.toParent, toNextSibling = runningAnimation.toNextSibling, wrapper = runningAnimation.wrapper, fromMatrix = runningAnimation.fromMatrix, toMatrix = runningAnimation.toMatrix;
                        allAnimationSettings = __assign(__assign({}, this.animationSettings), animationSettings);
                        promises = [
                            this.base.addAnimatedSpaceIfNecessary(element, toParent, 'grow', allAnimationSettings, toNextSibling),
                            this.base.animateOnAnimationSurface(wrapper, fromMatrix, toMatrix, __assign({ easing: 'ease-out' }, allAnimationSettings)),
                        ];
                        return [4 /*yield*/, Promise.all(promises)
                                .then(function (results) {
                                var _a;
                                runningAnimation.toSpaceWrapper = results[0].animationWrapper;
                                (_a = runningAnimation.wrappersToRemove).push.apply(_a, results.map(function (result) { return result.animationWrapper; }));
                                _this.base.endRunningAnimation(runningAnimation);
                            })];
                    case 1:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fade an object in. The object must be attached to the destination before.
     */
    AnimationManager.prototype.fadeIn = function (element, fromElement, animationSettings) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var allAnimationSettings, finalAnimationSettings;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.game.bgaAnimationsActive()) {
                            return [2 /*return*/];
                        }
                        allAnimationSettings = __assign(__assign({}, this.animationSettings), animationSettings);
                        finalAnimationSettings = __assign(__assign({}, allAnimationSettings), { parallelAnimations: __spreadArray([this.base.createFadeAnimation('in')], (_a = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.parallelAnimations) !== null && _a !== void 0 ? _a : [], true) });
                        return [4 /*yield*/, this.slideIn(element, fromElement, finalAnimationSettings)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fade out an object and destroy it. It call be called with a toElment, in that case a slide animation will be triggered.
     */
    AnimationManager.prototype.fadeOutAndDestroy = function (element, toElement, animationSettings) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var allAnimationSettings, finalAnimationSettings, runningAnimation, wrapper, fromMatrix, toMatrix;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.game.bgaAnimationsActive()) {
                            element.remove();
                            return [2 /*return*/];
                        }
                        allAnimationSettings = __assign(__assign({}, this.animationSettings), animationSettings);
                        finalAnimationSettings = __assign(__assign({}, allAnimationSettings), { parallelAnimations: __spreadArray([this.base.createFadeAnimation('out')], (_a = animationSettings === null || animationSettings === void 0 ? void 0 : animationSettings.parallelAnimations) !== null && _a !== void 0 ? _a : [], true) });
                        runningAnimation = this.base.startSlideOutAnimation(element, toElement, false, false);
                        wrapper = runningAnimation.wrapper, fromMatrix = runningAnimation.fromMatrix, toMatrix = runningAnimation.toMatrix;
                        return [4 /*yield*/, Promise.all([
                                this.base.addAnimatedSpaceIfNecessary(element, runningAnimation.fromParent, 'shrink', animationSettings, runningAnimation.fromNextSibling),
                                this.base.animateOnAnimationSurface(wrapper, fromMatrix, toMatrix, __assign(__assign({ easing: 'ease-in' }, this.animationSettings), finalAnimationSettings)),
                            ])
                                .then(function (results) {
                                var _a;
                                element.remove();
                                runningAnimation.element = null;
                                (_a = runningAnimation.wrappersToRemove).push.apply(_a, results.map(function (result) { return result.animationWrapper; }));
                                _this.base.endRunningAnimation(runningAnimation);
                            })];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Add a floating element over another element.
     */
    AnimationManager.prototype.slideFloatingElement = function (element, fromElement, toElement, animationSettings) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function () {
            var allAnimationSettings, wrapper, toMatrix, fromMatrix, promises;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!this.game.bgaAnimationsActive()) {
                            return [2 /*return*/];
                        }
                        allAnimationSettings = __assign(__assign({}, this.animationSettings), animationSettings);
                        wrapper = this.base.wrapOnAnimationSurface(element);
                        toMatrix = this.base.getFullMatrixFromElementCenter(toElement, (_a = allAnimationSettings.ignoreScale) !== null && _a !== void 0 ? _a : true, (_b = allAnimationSettings.ignoreRotation) !== null && _b !== void 0 ? _b : true);
                        fromMatrix = fromElement ?
                            this.base.getFullMatrixFromElementCenter(fromElement, (_c = allAnimationSettings.ignoreScale) !== null && _c !== void 0 ? _c : true, (_d = allAnimationSettings.ignoreRotation) !== null && _d !== void 0 ? _d : true) :
                            toMatrix;
                        promises = [
                            this.base.animateOnAnimationSurface(wrapper, fromMatrix, toMatrix, __assign({ easing: 'ease-out' }, allAnimationSettings)),
                        ];
                        return [4 /*yield*/, Promise.all(promises)
                                .then(function (results) {
                                element.remove();
                                results.forEach(function (result) { var _a; return (_a = result === null || result === void 0 ? void 0 : result.animationWrapper) === null || _a === void 0 ? void 0 : _a.remove(); });
                            })];
                    case 1:
                        _e.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Add a floating element over another element.
     */
    AnimationManager.prototype.addFloatingElement = function (element, toElement, animationSettings) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.slideFloatingElement(element, null, toElement, __assign({ bump: null }, animationSettings))];
            });
        });
    };
    /**
     * Play multiple animations a the same time.
     *
     * @param animations functions generating an animation, returning a Promise.
     * @returns promise when all animations ends
     */
    AnimationManager.prototype.playParallel = function (animations) {
        return Promise.all(animations.map(function (animation, index) { return animation(index); }));
    };
    /**
     * Play multiple animations one after the other.
     *
     * @param animations functions generating an animation, returning a Promise.
     * @returns promise when all animations ends
     */
    AnimationManager.prototype.playSequentially = function (animations) {
        return animations.reduce(function (prevPromise, animation) { return prevPromise.then(function () { return animation(); }); }, Promise.resolve());
    };
    /**
     * Play multiple animations with a fixed interval between each animation.
     *
     * @param animations functions generating an animation, returning a Promise.
     * @returns promise when all animations ends
     */
    AnimationManager.prototype.playInterval = function (animations, interval) {
        if (interval === void 0) { interval = this.animationSettings.duration / 4; }
        return new Promise(function (resolve) {
            if (animations.length === 0) {
                resolve();
                return;
            }
            var index = 0;
            var promises = [
                animations[index](index),
            ];
            index++;
            var intervalId = setInterval(function () {
                if (index >= animations.length) {
                    clearInterval(intervalId);
                    Promise.all(promises).then(function () { return resolve(); });
                    return;
                }
                promises.push(animations[index](index));
                index++;
            }, interval);
        });
    };
    return AnimationManager;
}());
