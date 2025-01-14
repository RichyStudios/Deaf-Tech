class FrameSaver {
    constructor(frameSystem) {
        this.frameSystem = frameSystem;
        this.initializeSaveControls();
        this.autoSaveInterval = 5000; // Save every 5 seconds
        this.startAutoSave();

        // Add drawing event listeners
        this.frameSystem.mainCanvas.addEventListener('mouseup', () => {
            this.saveProject(); // Save after each drawing action
        });

        // Save on any shape creation
        window.addEventListener('shapeCreated', () => {
            this.saveProject();
        });

        // Save on image import
        window.addEventListener('imageImported', () => {
            this.saveProject();
        });
    }

    initializeSaveControls() {
        document.getElementById('saveProject').addEventListener('click', () => this.saveProject());
        window.addEventListener('load', () => this.loadSavedFrames());
        
        // Save before unload
        window.addEventListener('beforeunload', () => this.saveProject());
    }

    saveProject() {
        const projectData = {
            frames: this.frameSystem.frames.map(frame => ({
                id: frame.id,
                imageData: frame.imageData,
                layers: frame.layers
            })),
            currentFrame: this.frameSystem.currentFrame,
            fps: this.frameSystem.fps
        };
        
        localStorage.setItem('animationProject', JSON.stringify(projectData));
        console.log('Project saved successfully');
    }

    loadSavedFrames() {
        const savedProject = localStorage.getItem('animationProject');
        
        if (savedProject) {
            const projectData = JSON.parse(savedProject);
            this.frameSystem.frames = projectData.frames;
            this.frameSystem.currentFrame = projectData.currentFrame;
            this.frameSystem.fps = projectData.fps;
            
            this.frameSystem.updateFramePreviews();
            this.frameSystem.loadFrame(this.frameSystem.currentFrame);
        }
    }

    startAutoSave() {
        setInterval(() => this.saveProject(), this.autoSaveInterval);
    }
}// Export functionality
class AnimationExporter {
    constructor(frameSystem) {
        this.frameSystem = frameSystem;
        
        document.querySelectorAll('.export-dropdown div').forEach(option => {
            option.addEventListener('click', (e) => {
                const format = e.target.dataset.format;
                this.exportAnimation(format);
            });
        });
    }

    async exportAnimation(format) {
        const frames = this.frameSystem.frames;
        const fps = this.frameSystem.fps;

        switch(format) {
            case 'gif':
                const gif = new GIF({
                    workers: 4,
                    quality: 10,
                    width: this.frameSystem.mainCanvas.width,
                    height: this.frameSystem.mainCanvas.height
                });

                for (let frame of frames) {
                    const canvas = await this.createFrameCanvas(frame);
                    gif.addFrame(canvas, {delay: 1000 / fps});
                }

                gif.on('finished', (blob) => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'animation.gif';
                    link.click();
                    URL.revokeObjectURL(url);
                });

                gif.render();
                break;
        }
    }

    async createFrameCanvas(frameData) {
        const canvas = document.createElement('canvas');
        canvas.width = this.frameSystem.mainCanvas.width;
        canvas.height = this.frameSystem.mainCanvas.height;
        const ctx = canvas.getContext('2d');

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                resolve(canvas);
            };
            img.src = frameData.imageData;
        });
    }
}

// Initialize both managers
const projectManager = new ProjectManager(frameSystem);
const animationExporter = new AnimationExporter(frameSystem);
