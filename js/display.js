class Display {
    constructor(target) {
        this.mode = "div";
        this._display = target;

        this.mode == "div" ? this.init_html() : this.init_canvas();
    }
    init_html() {
        this._display.style.setProperty("--w-px", DISPLAY_WIDTH);
        this._display.style.setProperty("--h-px", DISPLAY_HEIGHT);
        let html = "";
        for (var y = 0; y < DISPLAY_HEIGHT; y++) {
            for (var x = 0; x < DISPLAY_WIDTH; x++) {
                html += `<div class="px c${x}-${y}" x="${x}" y="${y}"></div>`;
            }
        }
        this._display.innerHTML = html;
    }
    init_canvas() {
        this.frameBuffer = this._createFrameBuffer()
        this.screen = this._display;
        this.multiplier = 12
        this.screen.width = DISPLAY_WIDTH * this.multiplier
        this.screen.height = DISPLAY_HEIGHT * this.multiplier
        this.context = this.screen.getContext('2d')
        this.context.fillStyle = 'black'
        this.context.fillRect(0, 0, this.screen.width, this.screen.height)
    }
    set(x, y, n) {
        return this.mode == "div"
            ? this.div_switch(x, y, n)
            : this.drawPixel(x, y, n);
        //n > 0 ? this.on(x, y) : this.off(x, y);
    }
    div_switch(x, y, value) {
        let px = this._display.querySelector("div.c" + x + "-" + y + "");
        var px_value = px.classList.contains("on") ? 1 : 0;
        const collision = px_value & value;
        const b = px_value ^ value;
        b ? px.classList.add("on") : px.classList.remove("on");
        return collision;
    }


    drawPixel(x, y, value) {
        // If collision, will return true
        const collision = this.frameBuffer[y][x] & value
        // Will XOR value to position x, y
        this.frameBuffer[y][x] ^= value

        if (this.frameBuffer[y][x]) {
            this.context.fillStyle = "green"
            this.context.fillRect(
                x * this.multiplier,
                y * this.multiplier,
                this.multiplier,
                this.multiplier
            )
        } else {
            this.context.fillStyle = 'black'
            this.context.fillRect(
                x * this.multiplier,
                y * this.multiplier,
                this.multiplier,
                this.multiplier
            )
        }

        return collision
    }

    clear() {
        this.mode == "div" ? (() => {
            let pxs = this._display.querySelectorAll("div");
            for (let px of pxs) {
                px.classList.remove("on");
            }
        })() : this.clearDisplay();
    }

    _createFrameBuffer() {
        let frameBuffer = []

        for (let i = 0; i < DISPLAY_WIDTH; i++) {
            frameBuffer.push([])
            for (let j = 0; j < DISPLAY_HEIGHT; j++) {
                frameBuffer[i].push(0)
            }
        }

        return frameBuffer
    }
    clearDisplay() {
        this.frameBuffer = this._createFrameBuffer()
        this.context.fillStyle = 'black'
        this.context.fillRect(0, 0, this.screen.width, this.screen.height)
    }
}

