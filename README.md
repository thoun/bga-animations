# Links
[Documentation](https://thoun.github.io/bga-animations/docs/index.html)

[Demo](https://thoun.github.io/bga-animations/demo/index.html)

# Concept
## AnimationManager
The AnimationManager will store the global settings and offer various types of animations.
The BaseAnimationManager (animationManager.base) has smaller functions, allowing to build custom animations.

# Integration
## On standard BGA project
Copy bga-animations.js file to the `modules` directory.  
Then you can include the module on your game :

JS file:
```js
loadBgaGameLib('bga-animations', '0.x');

/* ... */

    constructor: function() {

        // create the animation manager
        this.animationManager = new AnimationManager(this);

        // ...
    },
```

See [examples](./EXAMPLES.md) to see how to create a manager to call animations functions.