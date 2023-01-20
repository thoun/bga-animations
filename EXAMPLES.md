# Code example
## Example of integration using the manager

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
        this.cardsManager = new AnimationManager(this);

        // ...
      },

    moveElement: function(element, toElement) {
        // move an element to a destination elmeent and attach it
        animationManager.attachWithSlideAnimation(
            element,
            toElement
        );
    }
```

## Example of integration without the manager

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
      },

    showElement: function(element) {
        // move an element to a destination elmeent and attach it
        showScreenCenterAnimation(
            element,
            {
                game
            }
        )
    }
```