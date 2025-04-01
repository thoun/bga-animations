class BaseAnimationManager {
    private animationSurface: HTMLDivElement;

    constructor() {
        this.createAnimationSurface();
    }

    /**
     * Create the animation surface, an unselectable div starting at the top of the screen where the animated element will be attached.
     */
    private createAnimationSurface(): void {
        this.animationSurface = document.createElement('div');
        this.animationSurface.classList.add('bga-animations_animation-surface');
        document.body.appendChild(this.animationSurface);
    }

    /**
     * Get the translate X & Y for the element, from the top of the page.
     */
    private getTopPageOffset(element: HTMLElement): DOMMatrix {
        let elementRect = element.getBoundingClientRect();
    
        // Compute position of the element center from top-left of the page, ignoring rotation/scale changing the BR width/height
        let x = elementRect.left + elementRect.width / 2 + window.scrollX;
        let y = elementRect.top + elementRect.height / 2 + window.scrollY;
    
        return new DOMMatrix().translateSelf(x, y);
    }

    /**
     * Get rotation & scale matrix for an element, relative to the parent.
     */
    private getRotationAndScaleMatrixForElement(element: HTMLElement): DOMMatrix {
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
        let zoomValue = (style as any).zoom ? parseFloat((style as any).zoom) : 1;
        let zoomMatrix = new DOMMatrix();
        zoomMatrix.scaleSelf(zoomValue, zoomValue);
    
        // Final matrix = zoom * transform * rotate
        let finalMatrix = zoomMatrix.multiply(transformMatrix).multiply(rotateMatrix);
    
        return finalMatrix;
    }

    /**
     * Get rotation & scale matrix for an element, relative to the top of the page.
     */
    public getRotationAndScaleMatrix(element: HTMLElement, includeSelf: boolean = false): DOMMatrix {
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
    public getFullMatrix(element: HTMLElement): DOMMatrix {
        const rotationAndScaleMatrix = this.getRotationAndScaleMatrix(element);
        const topPageOffset = this.getTopPageOffset(element);
        return topPageOffset.multiply(rotationAndScaleMatrix);
    }

    /**
     * Remove the scale part of a matrix.
     */
    public removeScaleFromMatrix(matrix: DOMMatrix): DOMMatrix {
        let scaleX = Math.hypot(matrix.a, matrix.b); // Compute the scale from a & b
        let scaleY = Math.hypot(matrix.c, matrix.d); // Compute the scale from c & d
        
        return new DOMMatrix([
            matrix.a / scaleX, matrix.b / scaleX,  // Normalize X
            matrix.c / scaleY, matrix.d / scaleY,  // Normalize Y
            matrix.e, matrix.f  // Preserve translation
        ]);
    }
    
    /**
     * Remove the rotation part of a matrix.
     */
    public removeRotationFromMatrix(matrix: DOMMatrix): DOMMatrix {
        let scaleX = Math.hypot(matrix.a, matrix.b); // Compute scaleX
        let scaleY = Math.hypot(matrix.c, matrix.d); // Compute scaleY
    
        return new DOMMatrix([
            scaleX, 0,     // Remove rotation from X
            0, scaleY,     // Remove rotation from Y
            matrix.e, matrix.f  // Preserve translation
        ]);
    }

    /**
     * Remove the translation part of a matrix.
     */
    public removeTranslationFromMatrix(matrix: DOMMatrix): DOMMatrix {
        return new DOMMatrix([
            matrix.a, matrix.b,  // Keep scale & rotation
            matrix.c, matrix.d,  // Keep skew
            0, 0                 // Remove translation
        ]);
    }

    /**
     * Get the matrix of an element, to place it at the center of a parent element.
     */
    public getFullMatrixFromElementCenter(parentElement: HTMLElement, ignoreScale: boolean = true, ignoreRotation: boolean = true): DOMMatrix {            
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
    public createFillingSpace(elem: HTMLElement): HTMLElement {
        const div = document.createElement('div');
        div.style.width = elem.offsetWidth + 'px';
        div.style.height = elem.offsetHeight + 'px';

        return div;
    }

    /**
     * Make an empty space grow or shrink to replace where a moved object was or will be.
     * Ignore the animation settings, prefer addAnimatedSpaceIfNecessary.
     */
    public addFixedSpace(element: HTMLElement, parent: HTMLElement, insertBefore?: Element): HTMLElement {
        const space = this.createFillingSpace(element);
        space.classList.add('bga-animations_filling-space');
        this.attachToElement(space, parent, insertBefore);
        return space;
    }

    /**
     * Make an empty space grow or shrink to replace where a moved object was or will be.
     * Ignore the animation settings, prefer addAnimatedSpaceIfNecessary.
     */
    public addAnimatedSpace(element: HTMLElement, parent: HTMLElement, type: 'grow' | 'shrink', animationSettings: AnimationSettings, insertBefore?: Element): Promise<AnimationResult> {
        const space = this.addFixedSpace(element, parent, insertBefore);
        space.classList.add('bga-animations_filling-space-'+type);

        const promise = space.animate([
            { 
                width: 0, 
                height: 0, 
                offset: type === 'grow' ? 0 : 1, 
            },
        ],
        {
            duration: 500,
            easing: 'ease-in-out',
            ...animationSettings,
            iterations: 1,
        }).finished.then(animation => ({
            animation,
            animationWrapper: space,
        }));
        return promise;
    }

    /**
     * Make an empty space grow or shrink to replace where a moved object was or will be.
     * Only if the animation settings says so.
     */
    public addAnimatedSpaceIfNecessary(element: HTMLElement, parent: HTMLElement, type: 'grow' | 'shrink', animationSettings: AnimationSettings, insertBefore?: Element): Promise<AnimationResult> {
        if (
            (['all', 'from'].includes(animationSettings?.fillingSpaces ?? 'all') && type === 'shrink') ||
            (['all', 'to'].includes(animationSettings?.fillingSpaces ?? 'all') && type === 'grow')
        ) {
            return this.addAnimatedSpace(element, parent, type, animationSettings, insertBefore);
        } else {
            return Promise.resolve(null);
        }
    }

    /**
     * Returns the average of 2 matrixes.
     */
    private averageDOMMatrix(matrix1: DOMMatrix, matrix2: DOMMatrix): DOMMatrix {    
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

    private applyMatrixScale(matrix: DOMMatrix, scaleMatrix: DOMMatrix): DOMMatrix {
        matrix.a = scaleMatrix.a; // Scale X
        matrix.d = scaleMatrix.d; // Scale Y
        return matrix;
    }
    /**
     * Add a wrapper around an element, and add the elment on that wrapper.
     * Needed before doing animations on the surface
     */
    public wrapOnAnimationSurface(element: HTMLElement): HTMLElement {
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
    public addWrapperLayer(baseWrapper: HTMLElement): HTMLElement {
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
    private getElementInWrapper(wrapper: HTMLElement): HTMLElement {
        let element = wrapper;
        while (element.firstElementChild && element.classList.contains('bga-animations_animation-wrapper')) {
            element = element.firstElementChild as HTMLElement;
        }

        return element;
    }

    /**
     * Creates a bump animation, that simulates a physical item being lifted from one place to another.
     */
    public createBumpAnimation(bump: number | null | undefined): ParallelAnimation | null {
        if (bump === null || bump === 1) {
            return null;
        }
        return {
            keyframes: [
                { transform: `translate(0, -30px) scale(${bump ?? 1.2})`, offset: 0.5 },
            ]
        };
    }

    /**
     * Creates a fade animation, 'in' for appearing and 'out' for disappearing.
     */
    public createFadeAnimation(type: 'in' | 'out'): ParallelAnimation {
        return  {
            keyframes: [
                { opacity: type === 'in' ? 0 : 1 },
                { opacity: type === 'in' ? 1 : 0 },
            ]
        };
    }

    /**
     * Animate an object on the animation surface, from a matrix to a matrix.
     */
    public async animateOnAnimationSurface(animationWrapper: HTMLElement, fromMatrix: DOMMatrix, toMatrix: DOMMatrix, animationSettings: AnimationSettings): Promise<SurfaceAnimationResult> {
        const finalSettings = {
            duration: 500,
            easing: 'ease-in-out',
            ...animationSettings,
            iterations: 1,
        };

        let keyframes: Keyframe[] = [
            { transform: fromMatrix.toString() },
            { transform: toMatrix.toString() },
        ];
        const promises = [
            animationWrapper.animate(
                keyframes,
                finalSettings,
            ).finished
        ];

        animationSettings?.parallelAnimations?.forEach(parallelAnimation => {
            let parallelAnimationElement = parallelAnimation.applyToElement;
            if (!parallelAnimationElement) {
                const applyTo = parallelAnimation.applyTo || 'intermediate';
                parallelAnimationElement = applyTo === 'wrapper' ? animationWrapper : this.getElementInWrapper(animationWrapper);
                if (applyTo === 'intermediate') {
                    parallelAnimationElement = this.addWrapperLayer(animationWrapper);
                }
            }
            promises.push(parallelAnimationElement.firstElementChild.animate(
                parallelAnimation.keyframes,
                finalSettings,
            ).finished);
        });
        
        return await Promise.all(promises).then(animations => (<SurfaceAnimationResult>{
            animation: animations[0], animationWrapper,
            fromMatrix,
            toMatrix,
        }));
    }

    /**
     * Attach an element to a new parent.
     */
    public attachToElement(element: HTMLElement, toElement: HTMLElement, insertBefore?: Element) {
        if (insertBefore) {
            toElement.insertBefore(element, insertBefore);
        } else {
            toElement.appendChild(element);insertBefore
        }
    }

    public startSlideInAnimation(element: HTMLElement, fromElement?: HTMLElement, fromIgnoreScale: boolean = true, fromIgnoreRotation: boolean = true, preserveScale: boolean = true): RunningAnimation | null {
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

        return <RunningAnimation>{
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

    public startSlideOutAnimation(element: HTMLElement, toElement?: HTMLElement, fromIgnoreScale: boolean = true, fromIgnoreRotation: boolean = true, preserveScale: boolean = true): RunningAnimation | null {
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

        return <RunningAnimation>{
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

    public startAttachAnimation(element: HTMLElement, toElement: HTMLElement, insertBefore?: HTMLElement): RunningAnimation | null {
        const fromParent = element.parentElement;
        const fromNextSibling = element.nextElementSibling;        
        const fromMatrix = this.getFullMatrix(element);
        this.attachToElement(element, toElement, insertBefore);
        const toMatrix = this.getFullMatrix(element);
        const wrapper = this.wrapOnAnimationSurface(element);

        return <RunningAnimation>{
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

    public endRunningAnimation(attachAnimation: RunningAnimation): void {
        if (attachAnimation.element) {
            // add before the filling space if it exists, else before the nextSibling
            this.attachToElement(attachAnimation.element, attachAnimation.toParent, attachAnimation.toSpaceWrapper ?? attachAnimation.toNextSibling);
        }
        attachAnimation.wrappersToRemove?.forEach(result => result?.remove());
    }
}
