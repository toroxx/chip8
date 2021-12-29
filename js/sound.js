class Sound {

    constructor() {
        this.snd = new Audio("beep.wav");
        this.snd.loop = false;
    }

    enableSound() {
        this.snd.play();
    }

    disableSound() {
        this.snd.pause();
        this.snd.currentTime = 0;
    }
}
