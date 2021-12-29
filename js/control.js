class Control {
    constructor(target) {
        const keyMap = ['1', '2', '3', '4', 'q', 'w', 'e', 'r', 'a', 's', 'd', 'f', 'z', 'x', 'c', 'v'];


        this._resetKeys()

        target.addEventListener('keydown', (e) => {
            const keyIndex = keyMap.indexOf(e.key)

            if (keyIndex > -1) {
                this._setKeys(keyIndex)
            }
        });
        target.addEventListener('keyup', (e) => {
            this._resetKeys()
        });
    }

    _setKeys(keyIndex) {
        let keyMask = 1 << keyIndex
        //console.log(keyIndex, keyMask.toString(16), (this.keys).toString(16), (this.keys | keyMask).toString(16));
        this.keys = this.keys | keyMask
        this.keyPressed = keyIndex
    }
    _resetKeys() {
        this.keys = 0
        this.keyPressed = undefined;
    }
    getKeys() {
        return this.keys
    }
    waitKey() {
        const keyPressed = this.keyPressed
        this.keyPressed = undefined

        return keyPressed
    }
}
