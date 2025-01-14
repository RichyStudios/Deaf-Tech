class DrawingSystem {
    constructor() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.currentTool = 'pencil';
        this.startX = 0;
        this.startY = 0;
        this.color = '#000000';
        this.lineWidth = 2;
        this.fillEnabled = true;
        this.opacity = 1;
        this.undoStack = [];
        this.redoStack = [];
        this.maxStates = 50; // Maximum number of states to store
        this.strokeWidth = 2;

        // Canvas setup
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.canvas.style.background = 'transparent';

        // Initialize context
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.lineWidth = this.lineWidth;

        // Convert hex color to RGBA
        this.setColorWithOpacity(this.color, this.opacity);

        // Clear with transparency
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Bind events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseup', () => {
            this.saveState();
        });

        // Initialize fill toggle
        const fillToggle = document.querySelector('.fill-toggle');
        const strokeToggle = document.querySelector('.stroke-toggle');

        fillToggle.addEventListener('click', () => {
            this.fillEnabled = true;
            fillToggle.classList.add('active');
            strokeToggle.classList.remove('active');
        });

        strokeToggle.addEventListener('click', () => {
            this.fillEnabled = false;
            strokeToggle.classList.add('active');
            fillToggle.classList.remove('active');
        });

        // Tool selection
        document.querySelectorAll('.tool').forEach(tool => {
            tool.addEventListener('click', (e) => {
                this.setTool(e.currentTarget.dataset.tool);
            });
        });

        // Add color picker listener
        document.getElementById('colorPicker').addEventListener('change', (e) => {
            this.color = e.target.value;
            this.setColorWithOpacity(this.color, this.opacity);
        });

        // Add opacity slider listener
        document.getElementById('opacitySlider').addEventListener('input', (e) => {
            this.opacity = e.target.value / 100;
            this.setColorWithOpacity(this.color, this.opacity);
        });

        // Initialize stroke and opacity controls
        this.initializeControls();

        // Add event listeners for undo/redo buttons
        document.querySelector('[data-tool="undo"]').addEventListener('click', () => this.undo());
        document.querySelector('[data-tool="redo"]').addEventListener('click', () => this.redo());

        this.initializeMoveTool();
    }

    initializeControls() {
        const strokeSlider = document.getElementById('strokeSize');
        const opacitySlider = document.getElementById('opacitySlider');
        
        strokeSlider.addEventListener('input', (e) => {
            this.strokeWidth = parseInt(e.target.value);
            this.ctx.lineWidth = this.strokeWidth;
            this.updateSizePreview(this.strokeWidth);
        });
        
        opacitySlider.addEventListener('input', (e) => {
            this.opacity = e.target.value / 100;
            this.setColorWithOpacity(this.color, this.opacity);
        });
    }

    initializeMoveTool() {
        const moveButton = document.querySelector('[data-tool="move"]');
        this.moveTool = new MoveTool(this.canvas, this.ctx);

        moveButton.addEventListener('click', () => {
            // Clear any active tools
            document.querySelectorAll('.tool').forEach(tool => {
                tool.classList.remove('active');
            });
            
            // Activate move tool
            moveButton.classList.add('active');
            this.currentTool = 'move';
            this.moveTool.activate();

            // Add move tool event listeners
            this.canvas.addEventListener('mousedown', this.moveTool.startSelection.bind(this.moveTool));
            this.canvas.addEventListener('mousemove', this.moveTool.updateSelection.bind(this.moveTool));
            this.canvas.addEventListener('mouseup', this.moveTool.finalizeSelection.bind(this.moveTool));
        });

        // Handle switching to other tools
        document.querySelectorAll('.tool:not([data-tool="move"])').forEach(tool => {
            tool.addEventListener('click', () => {
                this.moveTool.deactivate();
                this.canvas.removeEventListener('mousedown', this.moveTool.startSelection);
                this.canvas.removeEventListener('mousemove', this.moveTool.updateSelection);
                this.canvas.removeEventListener('mouseup', this.moveTool.finalizeSelection);
            });
        });
    }

    updateSizePreview(size) {
        const preview = document.querySelector('.size-preview');
        if (preview) {
            preview.style.width = `${size}px`;
            preview.style.height = `${size}px`;
        }
    }

    saveState() {
        const state = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.undoStack.push(state);
        this.redoStack = []; // Clear redo stack when new action is performed
        
        // Limit stack size
        if (this.undoStack.length > this.maxStates) {
            this.undoStack.shift();
        }
    }

    undo() {
        if (this.undoStack.length > 0) {
            const currentState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            this.redoStack.push(currentState);
            
            const previousState = this.undoStack.pop();
            this.ctx.putImageData(previousState, 0, 0);
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            const currentState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            this.undoStack.push(currentState);
            
            const nextState = this.redoStack.pop();
            this.ctx.putImageData(nextState, 0, 0);
        }
    }

    startDrawing(e) {
        this.isDrawing = true;
        [this.startX, this.startY] = this.getMousePos(e);
        this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    draw(e) {
        if (!this.isDrawing) return;
        const [mouseX, mouseY] = this.getMousePos(e);

        // Set current color with opacity before drawing
        this.setColorWithOpacity(this.color, this.opacity);

        // Your existing drawing code continues here...
        this.ctx.strokeStyle = this.color;
        this.ctx.fillStyle = this.color;

        if (this.currentTool !== 'pencil' && this.currentTool !== 'brush') {
            this.ctx.putImageData(this.snapshot, 0, 0);
        }

        switch(this.currentTool) {
            case 'pencil':
                this.drawPencil(mouseX, mouseY);
                break;
            case 'brush':
                this.ctx.lineWidth = this.lineWidth * 3;
                this.drawPencil(mouseX, mouseY);
                this.ctx.lineWidth = this.lineWidth;
                break;
            case 'circle':
                this.drawCircle(mouseX, mouseY);
                break;
            case 'square':
                this.drawSquare(mouseX, mouseY);
                break;
            case 'triangle':
                this.drawTriangle(mouseX, mouseY);
                break;
            case 'star':
                this.drawStar(mouseX, mouseY);
                break;
            case 'line':
                this.drawLine(mouseX, mouseY);
                break;
            case 'arrow':
                this.drawArrow(mouseX, mouseY);
                break;
            case 'semicircle':
                this.drawSemiCircle(mouseX, mouseY);
                break;
            case 'diamond':
                this.drawDiamond(mouseX, mouseY);
                break;
            case 'heart':
                this.drawHeart(mouseX, mouseY);
                break;
        }
    }

    setColorWithOpacity(hex, opacity) {
        const rgb = this.hexToRgb(hex);
        const rgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
        this.ctx.strokeStyle = rgba;
        this.ctx.fillStyle = rgba;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    setTool(toolName) {
        this.currentTool = toolName;
        document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tool="${toolName}"]`).classList.add('active');
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return [
            e.clientX - rect.left,
            e.clientY - rect.top
        ];
    }

    drawPencil(x, y) {
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        [this.startX, this.startY] = [x, y];
    }

    drawLine(x, y) {
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }

    drawArrow(x, y) {
        const headLength = 20;
        const dx = x - this.startX;
        const dy = y - this.startY;
        const angle = Math.atan2(dy, dx);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(x, y);
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x - headLength * Math.cos(angle - Math.PI/6), y - headLength * Math.sin(angle - Math.PI/6));
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x - headLength * Math.cos(angle + Math.PI/6), y - headLength * Math.sin(angle + Math.PI/6));
        this.ctx.stroke();
    }

    drawSemiCircle(x, y) {
        const radius = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2));
        this.ctx.beginPath();
        this.ctx.arc(this.startX, this.startY, radius, 0, Math.PI);
        if (this.fillEnabled) {
            this.ctx.fill();
        }
        this.ctx.stroke();
    }

    drawDiamond(x, y) {
        const width = x - this.startX;
        const height = y - this.startY;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY - height/2);
        this.ctx.lineTo(this.startX + width/2, this.startY);
        this.ctx.lineTo(this.startX, this.startY + height/2);
        this.ctx.lineTo(this.startX - width/2, this.startY);
        this.ctx.closePath();
        if (this.fillEnabled) {
            this.ctx.fill();
        }
        this.ctx.stroke();
    }

    drawHeart(x, y) {
        const width = Math.abs(x - this.startX);
        const height = Math.abs(y - this.startY);
        const size = Math.min(width, height);

        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY + size/4);
        
        // Left curve
        this.ctx.bezierCurveTo(
            this.startX - size/2, this.startY - size/2,
            this.startX - size, this.startY + size/4,
            this.startX, this.startY + size
        );
        
        // Right curve
        this.ctx.bezierCurveTo(
            this.startX + size, this.startY + size/4,
            this.startX + size/2, this.startY - size/2,
            this.startX, this.startY + size/4
        );
        
        if (this.fillEnabled) {
            this.ctx.fill();
        }
        this.ctx.stroke();
    }

    drawCircle(x, y) {
        const radius = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2));
        this.ctx.beginPath();
        this.ctx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
        if (this.fillEnabled) {
            this.ctx.fill();
        }
        this.ctx.stroke();
    }

    drawTriangle(x, y) {
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(x, y);
        this.ctx.lineTo(this.startX - (x - this.startX), y);
        this.ctx.closePath();
        if (this.fillEnabled) {
            this.ctx.fill();
        }
        this.ctx.stroke();
    }

    drawSquare(x, y) {
        const size = Math.max(Math.abs(x - this.startX), Math.abs(y - this.startY));
        if (this.fillEnabled) {
            this.ctx.fillRect(this.startX, this.startY, size, size);
        }
        this.ctx.strokeRect(this.startX, this.startY, size, size);
    }

    drawStar(x, y) {
        const outerRadius = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2));
        const innerRadius = outerRadius * 0.4;
        const spikes = 5;
        
        this.ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const pointX = this.startX + Math.cos(angle) * radius;
            const pointY = this.startY + Math.sin(angle) * radius;
            i === 0 ? this.ctx.moveTo(pointX, pointY) : this.ctx.lineTo(pointX, pointY);
        }
        this.ctx.closePath();
        if (this.fillEnabled) {
            this.ctx.fill();
        }
        this.ctx.stroke();
    }

    stopDrawing() {
        this.isDrawing = false;
    }
}

// Initialize the drawing system
const drawingSystem = new DrawingSystem();

// File import handling
document.getElementById('importFile').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Get current canvas context
                const ctx = document.getElementById('mainCanvas').getContext('2d');
                // Draw the imported image centered on canvas
                const x = (ctx.canvas.width - img.width) / 2;
                const y = (ctx.canvas.height - img.height) / 2;
                ctx.drawImage(img, x, y);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Add after Canvas initialization
toolbarManager.initializeMoveTool();

window.addEventListener('DOMContentLoaded', () => {
    const layerManager = new LayerManager();
});

// After each shape/element is drawn
window.dispatchEvent(new CustomEvent('elementDrawn', {
    detail: {
        type: currentTool,
        bounds: {x, y, width, height},
        imageData: ctx.getImageData(x, y, width, height)
    }
}));
