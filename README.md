# Links
[Documentation](https://thoun.github.io/bga-animations/docs/index.html)

[Demo](https://thoun.github.io/bga-animations/demo/index.html)

# Concept
## AnimationManager
The AnimationManager will store the global settings and provide useful animation function.

You don't have to use it, you can call animations functions directly. [See examples](./EXAMPLES.md)

# Integration
## On standard BGA project
Copy bga-animations.js file to the `modules` directory.  
Then you can include the module on your game :

JS file:
```js
define([
   "dojo","dojo/_base/declare",
   "dojo/debounce",
   "ebg/core/gamegui",
   /*...,*/
   g_gamethemeurl + "modules/bga-animations.js",
],
function (dojo, declare, debounce, gamegui, /*...,*/ bgaCards) {
```

See [examples](./EXAMPLES.md) to see how to create a manager or call animations functions.