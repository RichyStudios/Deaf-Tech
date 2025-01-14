class OnionSkin {
    constructor(frameSystem) {
        this.frameSystem = frameSystem;
        this.enabled = false;
        this.opacity = 0.3;
        
        // Create onion skin canvas with exact same dimensions and position as main canvas
        this.onionCanvas = document.createElement('canvas');
        this.onionCanvas.width = frameSystem.mainCanvas.width;
        this.onionCanvas.height = frameSystem.mainCanvas.height;
        
        // Match main canvas position exactly
        const mainCanvas = frameSystem.mainCanvas;
        const rect = mainCanvas.getBoundingClientRect();
        
        // Set precise positioning
        this.onionCanvas.style.position = 'absolute';
        this.onionCanvas.style.left = `${rect.left}px`;
        this.onionCanvas.style.top = `${rect.top}px`;
        this.onionCanvas.style.width = `${rect.width}px`;
        this.onionCanvas.style.height = `${rect.height}px`;
        this.onionCanvas.style.pointerEvents = 'none';
        this.onionCanvas.style.zIndex = '2'; // Place above main canvas
        
        this.onionCtx = this.onionCanvas.getContext('2d');
        
        // Insert directly into canvas container
        const canvasContainer = frameSystem.mainCanvas.parentElement;
        canvasContainer.insertBefore(this.onionCanvas, mainCanvas.nextSibling);

        // Bind toggle with direct rendering
        document.getElementById('toggleOnion').onclick = () => {
            this.enabled = !this.enabled;
            document.getElementById('toggleOnion').classList.toggle('active');
            
            if (this.enabled) {
                this.onionCanvas.style.display = 'block';
                this.renderOnionSkin();
            } else {
                this.onionCanvas.style.display = 'none';
                this.clear();
            }
        };
    }

    renderOnionSkin() {
        if (!this.enabled || this.frameSystem.currentFrame <= 0) return;

        const prevFrame = this.frameSystem.frames[this.frameSystem.currentFrame - 1];
        if (!prevFrame) return;

        const img = new Image();
        img.onload = () => {
            // Clear and set properties
            this.clear();
            this.onionCtx.globalAlpha = this.opacity;
            
            // Draw with color tint
            this.onionCtx.drawImage(img, 0, 0);
            this.onionCtx.fillStyle = 'rgba(0, 0, 255, 0.2)';
            this.onionCtx.fillRect(0, 0, this.onionCanvas.width, this.onionCanvas.height);
            
            // Reset alpha
            this.onionCtx.globalAlpha = 1;
        };
        img.src = prevFrame.imageData;
    }

    clear() {
        this.onionCtx.clearRect(0, 0, this.onionCanvas.width, this.onionCanvas.height);
    }
}
window.addEventListener('load', () => {
    if (window.frameSystem) {
        window.onionSkin = new OnionSkin(window.frameSystem);
        console.log('Onion skin initialized'); // Debug log
    }
});