# Code example
## Example of integration

```js
define([
   "dojo","dojo/_base/declare",
   "dojo/debounce",
   "ebg/core/gamegui",
   /*...,*/
   g_gamethemeurl + "modules/bga-animations.js",
],
function (dojo, declare, debounce, gamegui, /*...,*/ bgaAnimations) {
   return declare("bgagame.mygame", gamegui, {
      constructor: function() {

        // create the animation manager
        this.animationManager = new AnimationManager(this);

        // ...
      },

    moveElement: function(element, toElement) {
        // move an element to a destination. It's only visual, the element is still linked to its parent.
        animationManager.play(
            new BgaSlideAnimation({ element }),
        );
    },

    attachElementWithSlide: function(element, toElement) {
        // move an element to a destination element and attach it.
        animationManager.attachWithAnimation(
            new BgaSlideAnimation({ element }),
            toElement
        );
    }
```
