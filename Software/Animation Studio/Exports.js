
class ExportManager {
    constructor(frameSystem) {
        this.frameSystem = frameSystem;
        
        this.exportFormats = {
            gif: this.exportGIF.bind(this),
            mp4: this.exportMP4.bind(this),
            ogg: this.exportOGG.bind(this)
        };
    }

    async exportGIF() {
        const gif = new GIF({
            workers: 2,
            quality: 10,
            width: this.frameSystem.canvasManager.width,
            height: this.frameSystem.canvasManager.height
        });

        this.frameSystem.frames.forEach(frame => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.frameSystem.canvasManager.width;
            tempCanvas.height = this.frameSystem.canvasManager.height;
            const ctx = tempCanvas.getContext('2d');
            const img = new Image();
            img.src = frame[0]; // Assuming single layer for simplicity
            img.onload = () => ctx.drawImage(img, 0, 0);
            gif.addFrame(tempCanvas, {delay: 1000 / this.frameSystem.fps});
        });

        gif.render();
    }
}
