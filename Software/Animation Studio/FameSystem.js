                            class FrameSystem {
                                                                constructor() {
                                                                    // Core elements
                                                                    this.mainCanvas = document.getElementById('mainCanvas');
                                                                    this.ctx = this.mainCanvas.getContext('2d');
                                                                    this.framesContainer = document.getElementById('framesContainer');

                                                                    // Animation settings
                                                                    this.frames = [];
                                                                    this.currentFrame = 0;
                                                                    this.fps = 12;
                                                                    this.isPlaying = false;

                                                                    // Initialize system
                                                                    this.bindControls();
                                                                    this.createFirstFrame();
                                                                    this.layerManager = new LayerManager(this);
                                                                    this.updateFramePreviews();

                                                                    this.events = new EventTarget();
                                                                    this.onFrameChange = null; // Add callback property

                                                                    // Add save after drawing
                                                                    this.mainCanvas.addEventListener('mouseup', () => {
                                                                        this.saveCurrentFrame();
                                                                    });

                                                                    // Save on shape creation
                                                                    window.addEventListener('shapeCreated', () => {
                                                                        this.saveCurrentFrame();
                                                                    });

                                                                    document.getElementById('addFrame').onclick = () => this.addNewFrame();

                                                                    // Start auto-save
                                                                    this.startAutoSave();

                                                                    // Add frame navigation controls
                                                                    document.getElementById('nextFrame').onclick = () => this.nextFrame();
                                                                    document.getElementById('prevFrame').onclick = () => this.prevFrame();

                                                                    // Add to constructor
                                                                    this.pageManager = new PageManager(this);

                                                                    // Initialize onion skin after other setup
                                                                    this.onionSkin = new OnionSkin(this);

                                                                    // Add onion skin toggle handler
                                                                    document.getElementById('toggleOnion').onclick = () => {
                                                                        this.onionSkin.toggle();
                                                                        this.loadFrame(this.currentFrame); // Refresh current frame
                                                                    };

                                                                    // Add frame change handler
                                                                    this.addEventListener('frameChanged', () => {
                                                                        if (this.onionSkin && this.onionSkin.enabled) {
                                                                            this.onionSkin.render();
                                                                        }
                                                                    });

                                                                    // New addition
                                                                    this.moveTool = new MoveTool(this);

                                                                    // Add direct move tool activation
                                                                    this.activateMoveTool = () => {
                                                                        this.currentTool = 'move';
                                                                        this.mainCanvas.style.cursor = 'move';
                                                                        if (this.moveTool) {
                                                                            this.moveTool.activate();
                                                                        }
                                                                    };
                                                                }
                                createFirstFrame() {
                                    const firstFrame = {
                                        id: Date.now(),
                                        imageData: this.createBlankFrame(),
                                        layers: [{
                                            id: Date.now(),
                                            name: 'Layer 1',
                                            visible: true,
                                            opacity: 1,
                                            imageData: this.createBlankFrame()
                                        }]
                                    };
                                    this.frames.push(firstFrame);
                                }

                                addNewFrame() {
                                    const blankFrame = {
                                        id: Date.now(),
                                        imageData: this.createBlankFrame(),
                                        layers: [{
                                            id: Date.now(),
                                            name: 'Layer 1',
                                            visible: true,
                                            opacity: 1,
                                            imageData: this.createBlankFrame()
                                        }]
                                    };

                                    this.frames.push(blankFrame);
                                    this.currentFrame = this.frames.length - 1;
                                    this.loadFrame(this.currentFrame);
                                    this.updateFramePreviews();
                                }

                                loadFrame(index) {
                                    this.currentFrame = index;
                                    const frame = this.frames[index];

                                    // Clear canvas
                                    this.ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);

                                    // Render all visible layers
                                    frame.layers.forEach(layer => {
                                        if (layer.visible) {
                                            const img = new Image();
                                            img.onload = () => {
                                                this.ctx.globalAlpha = layer.opacity;
                                                this.ctx.drawImage(img, 0, 0);
                                                this.ctx.globalAlpha = 1;
                                            };
                                            img.src = layer.imageData;
                                        }
                                    });

                                    // Update layer UI
                                    if (this.layerManager) {
                                        this.layerManager.updateLayersList();
                                    }
                                }

                                saveCurrentFrame() {
                                    if (this.frames[this.currentFrame]) {
                                        // Save each layer's state
                                        const frame = this.frames[this.currentFrame];
                                        frame.layers.forEach(layer => {
                                            if (layer.visible) {
                                                layer.imageData = this.mainCanvas.toDataURL();
                                            }
                                        });
                                        this.updateFramePreviews();
                                    }
                                }

                                addEventListener(event, callback) {
                                    this.events.addEventListener(event, callback);
                                }

                                dispatchEvent(eventName) {
                                    this.events.dispatchEvent(new Event(eventName));
                                }

                                bindControls() {
                                    // Frame manipulation
                                    document.getElementById('removeFrame').onclick = () => this.deleteFrame(this.currentFrame);
                                    document.getElementById('duplicateFrame').onclick = () => this.duplicateFrame(this.currentFrame);

                                    // Playback controls
                                    document.getElementById('playAnimation').onclick = () => this.togglePlay();
                                    document.getElementById('stopAnimation').onclick = () => this.stopAnimation();

                                    // Speed control
                                    document.getElementById('speedControl').oninput = (e) => {
                                        this.fps = parseInt(e.target.value);
                                        document.getElementById('speedValue').textContent = this.fps;
                                    };
                                }

                                selectFrame(index) {
                                    this.currentFrame = index;
                                    this.loadFrame(index);

                                    // Update onion skin when frame changes
                                    if (this.onionSkin && this.onionSkin.enabled) {
                                        this.onionSkin.render();
                                    }

                                    this.updateFramePreviews();
                                }

                                createFramePreview(frame, index) {
                                    const preview = document.createElement('div');
                                    preview.className = `frame-preview ${index === this.currentFrame ? 'active' : ''} ${frame.isNew ? 'new-frame' : ''}`;

                                    // Preview canvas
                                    const canvas = document.createElement('canvas');
                                    canvas.width = 150;
                                    canvas.height = 100;
                                    const ctx = canvas.getContext('2d');

                                    // Load frame image
                                    const img = new Image();
                                    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                    img.src = frame.imageData;

                                    preview.appendChild(canvas);
                                    preview.onclick = () => this.selectFrame(index);

                                    return preview;
                                }

                                nextFrame() {
                                    // Save current frame state
                                    this.saveCurrentFrame();

                                    // If at last frame, create new frame
                                    if (this.currentFrame === this.frames.length - 1) {
                                        this.addNewFrame();
                                    } else {
                                        // Move to next existing frame
                                        this.selectFrame(this.currentFrame + 1);
                                    }
                                }

                                prevFrame() {
                                    if (this.currentFrame > 0) {
                                        this.saveCurrentFrame();
                                        this.selectFrame(this.currentFrame - 1);
                                    }
                                }

                                createBlankFrame() {
                                    const blankFrame = {
                                        id: Date.now(),
                                        imageData: this.createTransparentCanvas(),
                                        layers: [{
                                            id: Date.now(),
                                            name: 'Layer 1',
                                            visible: true,
                                            opacity: 1,
                                            imageData: this.createTransparentCanvas()
                                        }]
                                    };
                                    return blankFrame;
                                }

                                createTransparentCanvas() {
                                    const tempCanvas = document.createElement('canvas');
                                    tempCanvas.width = this.mainCanvas.width;
                                    tempCanvas.height = this.mainCanvas.height;
                                    const tempCtx = tempCanvas.getContext('2d', { alpha: true });
        
                                    // Clear with full transparency
                                    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        
                                    return tempCanvas.toDataURL('image/png');
                                }

                                updateFramePreviews() {
                                    this.framesContainer.innerHTML = '';
                                    this.frames.forEach((frame, index) => {
                                        this.framesContainer.appendChild(this.createFramePreview(frame, index));
                                    });
                                }

                                clearCanvas() {
                                    this.ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
                                }

                                playAnimation() {
                                    this.isPlaying = true;
                                    document.getElementById('playAnimation').innerHTML = '<i class="fas fa-pause"></i>';
                                    this.animationInterval = setInterval(() => {
                                        this.currentFrame = (this.currentFrame + 1) % this.frames.length;
                                        this.loadFrame(this.currentFrame);
                                        this.updateFramePreviews();
                                    }, 1000 / this.fps);
                                }

                                stopAnimation() {
                                    this.isPlaying = false;
                                    document.getElementById('playAnimation').innerHTML = '<i class="fas fa-play"></i>';
                                    clearInterval(this.animationInterval);
                                    this.currentFrame = 0;
                                    this.loadFrame(0);
                                    this.updateFramePreviews();
                                }

                                duplicateFrame(index) {
                                    const frameCopy = {
                                        id: Date.now(),
                                        imageData: this.frames[index].imageData,
                                        layers: [...this.frames[index].layers]
                                    };
                                    this.frames.splice(index + 1, 0, frameCopy);
                                    this.currentFrame = index + 1;
                                    this.updateFramePreviews();
                                }

                                deleteFrame(index) {
                                    if (this.frames.length > 1) {
                                        this.frames.splice(index, 1);
                                        this.currentFrame = Math.min(index, this.frames.length - 1);
                                        this.loadFrame(this.currentFrame);
                                        this.updateFramePreviews();
                                    }
                                }

                                togglePlay() {
                                    if (this.isPlaying) {
                                        this.stopAnimation();
                                    } else {
                                        this.playAnimation();
                                    }
                                }

                                redrawCurrentFrame() {
                                    if (this.frames[this.currentFrame]) {
                                        const img = new Image();
                                        img.onload = () => {
                                            this.ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
                                            this.ctx.drawImage(img, 0, 0);

                                            // Render onion skin after frame loads
                                            if (this.onionSkin && this.onionSkin.enabled) {
                                                this.onionSkin.render();
                                            }
                                        };
                                        img.src = this.frames[this.currentFrame].imageData;
                                    }
                                }

                                startAutoSave() {
                                    setInterval(() => {
                                        if (this.frames[this.currentFrame]) {
                                            const frameData = this.mainCanvas.toDataURL();
                                            this.frames[this.currentFrame].imageData = frameData;
                                            this.updateFramePreviews();
                                        }
                                    }, 1000); // 1000ms = 1 second
                                }

                                setActiveContext(context) {
                                    this.ctx = context;
                                }
                            }

                            // Initialize the frame system
                            document.addEventListener('DOMContentLoaded', () => {
                                window.frameSystem = new FrameSystem();
                            });
// Show me how frames are being managed
// How canvas states are stored
