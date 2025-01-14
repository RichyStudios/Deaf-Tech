  class LayerManager {
      constructor(frameSystem) {
          this.frameSystem = frameSystem;
          this.mainCanvas = document.getElementById('mainCanvas');
          this.ctx = this.mainCanvas.getContext('2d');
          this.activeLayerIndex = 0;
      
          // Create drawing canvas
          this.drawingCanvas = document.createElement('canvas');
          this.drawingCanvas.width = this.mainCanvas.width;
          this.drawingCanvas.height = this.mainCanvas.height;
          this.drawingCtx = this.drawingCanvas.getContext('2d');
      
          this.initializeLayers();
          this.bindEvents();
        
          // Add layer editing canvases
          this.layerCanvases = new Map(); // Store individual canvases for each layer
          this.initializeLayerCanvases();
      }

      initializeLayers() {
          const currentFrame = this.frameSystem.frames[this.frameSystem.currentFrame];
          if (!currentFrame.layers) {
              currentFrame.layers = [{
                  id: Date.now(),
                  name: 'Layer 1',
                  visible: true,
                  opacity: 1,
                  content: this.createBlankLayer()
              }];
          }
          this.updateLayersList();
      }

      initializeLayerCanvases() {
          const currentFrame = this.frameSystem.frames[this.frameSystem.currentFrame];
          currentFrame.layers.forEach(layer => {
              this.createLayerCanvas(layer.id);
          });
      }

      createLayerCanvas(layerId) {
          const canvas = document.createElement('canvas');
          canvas.width = this.mainCanvas.width;
          canvas.height = this.mainCanvas.height;
          const ctx = canvas.getContext('2d', { alpha: true });
        
          this.layerCanvases.set(layerId, {
              canvas: canvas,
              ctx: ctx
          });
      }

      createBlankLayer() {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = this.mainCanvas.width;
          tempCanvas.height = this.mainCanvas.height;
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
          return tempCanvas.toDataURL();
      }

      updateLayersList() {
          const layersList = document.getElementById('layersList');
          layersList.innerHTML = '';
      
          const currentFrame = this.frameSystem.frames[this.frameSystem.currentFrame];
          currentFrame.layers.forEach((layer, index) => {
              const layerElem = this.createLayerElement(layer, index);
              layersList.appendChild(layerElem);
          });
      }

      createLayerElement(layer, index) {
          const elem = document.createElement('div');
          elem.className = `layer-item ${index === this.activeLayerIndex ? 'active' : ''}`;
          elem.setAttribute('draggable', 'true');
          elem.setAttribute('data-layer-index', index);
      
          // Add drag and drop event listeners
          elem.addEventListener('dragstart', (e) => this.handleDragStart(e, index));
          elem.addEventListener('dragover', (e) => this.handleDragOver(e));
          elem.addEventListener('dragenter', (e) => this.handleDragEnter(e));
          elem.addEventListener('dragleave', (e) => this.handleDragLeave(e));
          elem.addEventListener('drop', (e) => this.handleDrop(e, index));
          elem.addEventListener('dragend', () => this.handleDragEnd());

          // Enhanced layer structure with right-aligned controls
          elem.innerHTML = `
              <div class="layer-content">
                  <div class="layer-info">
                      <span class="layer-name">${layer.name}</span>
                  </div>
                  <div class="layer-controls">
                      <button class="visibility-btn">
                          <i class="fas ${layer.visible ? 'fa-eye' : 'fa-eye-slash'}"></i>
                      </button>
                      <input type="range" class="opacity-slider" 
                          min="0" max="100" value="${layer.opacity * 100}">
                      <div class="stack-controls">
                          <button class="layer-arrow up" ${index === 0 ? 'disabled' : ''}>
                              <i class="fas fa-chevron-up"></i>
                          </button>
                          <button class="layer-arrow down" ${index === this.frameSystem.frames[this.frameSystem.currentFrame].layers.length - 1 ? 'disabled' : ''}>
                              <i class="fas fa-chevron-down"></i>
                          </button>
                      </div>
                  </div>
              </div>
          `;

          // Bind events
          elem.querySelector('.visibility-btn').onclick = (e) => {
              e.stopPropagation();
              this.toggleLayerVisibility(index);
          };

          elem.querySelector('.opacity-slider').oninput = (e) => {
              e.stopPropagation();
              this.setLayerOpacity(index, e.target.value / 100);
          };

          // Bind arrow controls
          const upArrow = elem.querySelector('.layer-arrow.up');
          const downArrow = elem.querySelector('.layer-arrow.down');

          upArrow.onclick = (e) => {
              e.stopPropagation();
              this.sendBackward(index);
          };

          downArrow.onclick = (e) => {
              e.stopPropagation();
              this.bringForward(index);
          };

          elem.onclick = () => this.setActiveLayer(index);

          return elem;
      }

      handleDragStart(e, index) {
          this.dragState.isDragging = true;
          this.dragState.draggedLayer = this.frameSystem.frames[this.frameSystem.currentFrame].layers[index];
          this.dragState.draggedIndex = index;
      
          e.currentTarget.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
      }

      handleDragOver(e) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
      }

      handleDragEnter(e) {
          e.preventDefault();
          const layerElement = e.currentTarget;
      
          // Add visual indicator for drop target
          layerElement.classList.add('drop-target');
      }

      handleDragLeave(e) {
          e.currentTarget.classList.remove('drop-target');
      }

      handleDrop(e, targetIndex) {
          e.preventDefault();
          e.currentTarget.classList.remove('drop-target');
      
          if (this.dragState.draggedIndex !== targetIndex) {
              const currentFrame = this.frameSystem.frames[this.frameSystem.currentFrame];
              const layers = currentFrame.layers;
          
              // Remove layer from original position
              const [movedLayer] = layers.splice(this.dragState.draggedIndex, 1);
          
              // Insert at new position
              layers.splice(targetIndex, 0, movedLayer);
          
              // Update active layer index if needed
              if (this.activeLayerIndex === this.dragState.draggedIndex) {
                  this.activeLayerIndex = targetIndex;
              }
          
              // Update UI and render
              this.updateLayersList();
              this.renderComposite();
          }
      }

      handleDragEnd() {
          this.dragState.isDragging = false;
          this.dragState.draggedLayer = null;
          this.dragState.draggedIndex = null;
      
          // Remove any remaining visual indicators
          document.querySelectorAll('.layer-item').forEach(elem => {
              elem.classList.remove('dragging', 'drop-target');
          });
      }

      bringForward(index) {
          const currentFrame = this.frameSystem.frames[this.frameSystem.currentFrame];
          if (index < currentFrame.layers.length - 1) {
              // Store complete layers
              const layers = currentFrame.layers;
            
              // Perform the swap
              [layers[index], layers[index + 1]] = [layers[index + 1], layers[index]];
            
              // Update active layer to follow the moved layer
              this.activeLayerIndex = index + 1;
            
              // Force synchronous rendering
              this.updateLayersList();
              requestAnimationFrame(() => {
                  this.renderComposite(true); // true flag for forced update
              });
          }
      }

      sendBackward(index) {
          const currentFrame = this.frameSystem.frames[this.frameSystem.currentFrame];
          if (index > 0) {
              // Store complete layers
              const layers = currentFrame.layers;
            
              // Perform the swap
              [layers[index], layers[index - 1]] = [layers[index - 1], layers[index]];
            
              // Update active layer to follow the moved layer
              this.activeLayerIndex = index - 1;
            
              // Force synchronous rendering
              this.updateLayersList();
              requestAnimationFrame(() => {
                  this.renderComposite(true); // true flag for forced update
              });
          }
      }

      renderComposite() {
          // Clear main canvas
          this.ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        
          const currentFrame = this.frameSystem.frames[this.frameSystem.currentFrame];
        
          // Render each layer from bottom to top
          currentFrame.layers.forEach(layer => {
              if (layer.visible) {
                  const layerCanvas = this.layerCanvases.get(layer.id);
                  this.ctx.globalAlpha = layer.opacity;
                  this.ctx.drawImage(layerCanvas.canvas, 0, 0);
                  this.ctx.globalAlpha = 1;
              }
          });
      }

      toggleLayerVisibility(index) {
          const currentFrame = this.frameSystem.frames[this.frameSystem.currentFrame];
          currentFrame.layers[index].visible = !currentFrame.layers[index].visible;
          this.updateLayersList();
          this.renderComposite();
      }

      setLayerOpacity(index, opacity) {
          const currentFrame = this.frameSystem.frames[this.frameSystem.currentFrame];
          currentFrame.layers[index].opacity = opacity;
          this.renderComposite();
      }
      setActiveLayer(index) {
          const currentFrame = this.frameSystem.frames[this.frameSystem.currentFrame];
        
          // Store current layer state
          const currentLayer = currentFrame.layers[this.activeLayerIndex];
          const currentCanvas = this.layerCanvases.get(currentLayer.id);
          currentCanvas.ctx.drawImage(this.mainCanvas, 0, 0);
          currentLayer.content = currentCanvas.canvas.toDataURL();

          // Set new active layer
          this.activeLayerIndex = index;
          const targetLayer = currentFrame.layers[index];
          const targetCanvas = this.layerCanvases.get(targetLayer.id);

          // Clear main canvas
          this.ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);

          // Load target layer content to main canvas
          if (targetLayer.content) {
              const img = new Image();
              img.onload = () => {
                  this.ctx.drawImage(img, 0, 0);
              };
              img.src = targetLayer.content;
          }

          // Set main context to draw on target layer
          this.frameSystem.setActiveContext(targetCanvas.ctx);

          // Update UI
          this.updateLayersList();
          this.renderComposite();
    }
    addNewLayer() {
        const currentFrame = this.frameSystem.frames[this.frameSystem.currentFrame];
        
        // 1. Save current main canvas content to active layer
        const mainCanvasContent = this.mainCanvas.toDataURL();
        const currentLayer = currentFrame.layers[this.activeLayerIndex];
        const currentLayerCanvas = this.layerCanvases.get(currentLayer.id);
        
        // Load content into current layer's canvas
        const img = new Image();
        img.onload = () => {
            currentLayerCanvas.ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
            currentLayerCanvas.ctx.drawImage(img, 0, 0);
            currentLayer.content = currentLayerCanvas.canvas.toDataURL();
            
            // After saving current layer, create new layer
            this.createNewLayerAfterSaving();
        };
        img.src = mainCanvasContent;
    }

    createNewLayerAfterSaving() {
        const currentFrame = this.frameSystem.frames[this.frameSystem.currentFrame];
        
        // Create new layer data
        const newLayer = {
            id: Date.now(),
            name: `Layer ${currentFrame.layers.length + 1}`,
            visible: true,
            opacity: 1,
            content: null
        };

        // Create fresh canvas
        const newCanvas = document.createElement('canvas');
        newCanvas.width = this.mainCanvas.width;
        newCanvas.height = this.mainCanvas.height;
        
        // Store new canvas
        this.layerCanvases.set(newLayer.id, {
            canvas: newCanvas,
            ctx: newCanvas.getContext('2d')
        });

        // Add to layer stack and update active index
        currentFrame.layers.unshift(newLayer);
        this.activeLayerIndex = 0;

        // Clear main canvas
        this.ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);

        // Update UI
        this.updateLayersList();
        this.renderComposite();
    }
      bindEvents() {
          document.getElementById('addLayer').onclick = () => this.addNewLayer();
  
          // Save layer content after drawing
          this.mainCanvas.addEventListener('mouseup', () => {
              this.saveLayerContent(this.activeLayerIndex);
          });
  
          this.mainCanvas.addEventListener('mousemove', () => {
              if (this.frameSystem.isDrawing) {
                  this.autoSaveLayer();
              }
          });
      }

      saveLayerContent(index) {
          const currentFrame = this.frameSystem.frames[this.frameSystem.currentFrame];
          const layer = currentFrame.layers[index];
          const layerCanvas = this.layerCanvases.get(layer.id);
          layer.content = layerCanvas.canvas.toDataURL();
      }

      autoSaveLayer() {
          if (this.activeLayerIndex !== null) {
              const currentFrame = this.frameSystem.frames[this.frameSystem.currentFrame];
              const layer = currentFrame.layers[this.activeLayerIndex];
              const layerCanvas = this.layerCanvases.get(layer.id);
              layer.content = layerCanvas.canvas.toDataURL();
          }
      }
  }