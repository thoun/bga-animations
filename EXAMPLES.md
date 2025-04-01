# Code example
## Example of integration

```js
loadBgaGameLib('bga-animations', '0.x');

/* ... */

    constructor: function() {

        // create the animation manager
        this.animationManager = new AnimationManager(this);

        // ...
    },

    movePawn: async function(pawnDiv, fromElement) {
        // move an element to a destination, starting the animation over the fromElement.
        await this.animationManager.slideIn(pawnDiv, fromElement);
    },

    attachPawn: async function(pawnDiv, toElement) {
        // move an element to a destination element and attach it.
        await this.animationManager.slideAndAttach(pawnDiv, toElement);
    }

    showScore: async function(pawnDiv, playerId, score) {
        // Show the score of a pawn
        await this.animationManager.displayScoring(pawnDiv, score, this.gamedatas.players[playerId].color);
    }

    attachAndShowScore: async function(pawnDiv, toElement, playerId, score) {
        await this.animationManager.playSequentially([
            () => this.attachPawn(pawnDiv, toElement),
            () => this.showScore(pawnDiv, playerId, score),
        ]);
    }
```
