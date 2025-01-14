class MoveTool {
    constructor() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Create temporary canvas for selection
        this.tempCanvas = document.createElement('canvas');
        this.tempCanvas.width = this.canvas.width;
        this.tempCanvas.height = this.canvas.height;
        this.tempCtx = this.tempCanvas.getContext('2d');
        
        this.isActive = false;
        this.isDragging = false;
        this.selectionArea = null;
        this.originalCanvasState = null;
        
        this.initializeEvents();
    }

    initializeEvents() {
        const moveButton = document.querySelector('[data-tool="move"]');
        moveButton.addEventListener('click', () => {
            this.isActive = !this.isActive;
            moveButton.classList.toggle('active');
            this.canvas.style.cursor = this.isActive ? 'move' : 'default';
            
            if (this.isActive) {
                // Store current canvas state
                this.originalCanvasState = this.ctx.getImageData(
                    0, 0, this.canvas.width, this.canvas.height
                );
            }
        });

        this.canvas.addEventListener('mousedown', (e) => this.startSelection(e));
        this.canvas.addEventListener('mousemove', (e) => this.moveSelection(e));
        this.canvas.addEventListener('mouseup', () => this.endSelection());
    }

    startSelection(e) {
        if (!this.isActive) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicked on content
        const pixel = this.ctx.getImageData(x, y, 1, 1).data;
        if (pixel[3] > 0) { // If pixel is not transparent
            this.isDragging = true;
            this.selectionArea = {
                startX: x,
                startY: y,
                offsetX: x,
                offsetY: y,
                width: 0,
                height: 0
            };

            // Find content bounds
            const bounds = this.findContentBounds(x, y);
            if (bounds) {
                this.selectionArea = {
                    ...bounds,
                    offsetX: x - bounds.startX,
                    offsetY: y - bounds.startY
                };

                // Store selection in temp canvas
                this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
                this.tempCtx.drawImage(this.canvas, 
                    bounds.startX, bounds.startY, bounds.width, bounds.height,
                    bounds.startX, bounds.startY, bounds.width, bounds.height
                );

                // Clear selection from main canvas
                this.ctx.clearRect(bounds.startX, bounds.startY, bounds.width, bounds.height);
            }
        }
    }

    findContentBounds(startX, startY) {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        let minX = this.canvas.width;
        let minY = this.canvas.height;
        let maxX = 0;
        let maxY = 0;
        let found = false;

        // Scan for content boundaries
        for (let y = 0; y < this.canvas.height; y++) {
            for (let x = 0; x < this.canvas.width; x++) {
                const i = (y * this.canvas.width + x) * 4;
                if (data[i + 3] > 0) { // If pixel has opacity
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                    found = true;
                }
            }
        }

        return found ? {
            startX: minX,
            startY: minY,
            width: maxX - minX,
            height: maxY - minY
        } : null;
    }

    moveSelection(e) {
        if (!this.isDragging || !this.selectionArea) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate new position
        const newX = x - this.selectionArea.offsetX;
        const newY = y - this.selectionArea.offsetY;

        // Redraw canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.originalCanvasState) {
            this.ctx.putImageData(this.originalCanvasState, 0, 0);
        }

        // Draw selection at new position
        this.ctx.drawImage(this.tempCanvas, 
            this.selectionArea.startX, this.selectionArea.startY, 
            this.selectionArea.width, this.selectionArea.height,
            newX, newY, 
            this.selectionArea.width, this.selectionArea.height
        );

        // Draw selection outline
        this.ctx.strokeStyle = '#0095ff';
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(newX, newY, this.selectionArea.width, this.selectionArea.height);
    }

    endSelection() {
        this.isDragging = false;
        this.selectionArea = null;
        this.originalCanvasState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
}

// Initialize
const moveTool = new MoveTool();