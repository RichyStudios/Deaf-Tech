  // Add to constructor
  this.pageManager = new PageManager(this);

  // Add to saveCurrentFrame method
  saveCurrentFrame() 
      if (this.frames[this.currentFrame]) {
          this.frames[this.currentFrame].imageData = this.mainCanvas.toDataURL();
          this.updateFramePreviews();
          // Save to current page
          this.pageManager.pages[this.pageManager.currentPage].frames = [...this.frames];
      }
  
    class PageManager {
        constructor(frameSystem) {
            this.frameSystem = frameSystem;
            this.pages = [{
                id: Date.now(),
                frames: frameSystem.frames,
                name: 'Page 1'
            }];
            this.currentPage = 0;
        
            this.initializePageControls();
            this.renderPages();
        }

        initializePageControls() {
            // Add page button
            document.getElementById('addPage').addEventListener('click', () => this.addPage());
    
            // Initialize page container if not exists
            if (!document.querySelector('.pages-container')) {
                const container = document.createElement('div');
                container.className = 'pages-container';
                document.querySelector('.frame-controls').insertAdjacentElement('beforebegin', container);
            }
        }

        switchToPage(pageIndex) {
            // Store current frames in current page
            this.pages[this.currentPage].frames = [...this.frameSystem.frames];
        
            // Switch to new page
            this.currentPage = pageIndex;
            this.frameSystem.frames = [...this.pages[pageIndex].frames];
            this.frameSystem.currentFrame = 0;
            this.frameSystem.loadFrame(0);
            this.frameSystem.updateFramePreviews();
        
            this.renderPages();
        }

        addPage() {
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

            const newPage = {
                id: Date.now(),
                frames: [blankFrame],
                name: `Page ${this.pages.length + 1}`
            };

            this.pages.push(newPage);
            this.switchToPage(this.pages.length - 1);
            this.renderPages();
        }

        createTransparentCanvas() {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.frameSystem.mainCanvas.width;
            tempCanvas.height = this.frameSystem.mainCanvas.height;
            const tempCtx = tempCanvas.getContext('2d', { alpha: true });
            
            // Clear with full transparency
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            return tempCanvas.toDataURL('image/png');
        }

        addNewFrame() {
            const blankFrame = {
                id: Date.now(),
                imageData: this.createTransparentCanvas(),
                layers: [{
                    id: Date.now(),
                    visible: true,
                    name: 'Layer 1'
                }]
            };
        
            this.frameSystem.frames.push(blankFrame);
            this.frameSystem.currentFrame = this.frameSystem.frames.length - 1;
            this.frameSystem.loadFrame(this.frameSystem.currentFrame);
            this.frameSystem.updateFramePreviews();
        }

        createBlankFrame() {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.frameSystem.mainCanvas.width;
            tempCanvas.height = this.frameSystem.mainCanvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.fillStyle = '#ffffff';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            return tempCanvas.toDataURL();
        }

        deletePage(pageIndex) {
            if (this.pages.length > 1) {
                this.pages.splice(pageIndex, 1);
                this.currentPage = Math.min(this.currentPage, this.pages.length - 1);
                this.switchToPage(this.currentPage);
            }
        }

        renderPages() {
            const container = document.querySelector('.pages-container');
            container.innerHTML = '';
    
            this.pages.forEach((page, index) => {
                const pageElement = document.createElement('div');
                pageElement.className = `page-preview ${index === this.currentPage ? 'active' : ''}`;
                pageElement.innerHTML = `
                    <span class="page-number">${page.name}</span>
                    ${this.pages.length > 1 ? `
                        <button class="delete-page">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                `;
        
                // Add click handlers
                pageElement.addEventListener('click', () => this.switchToPage(index));
                const deleteBtn = pageElement.querySelector('.delete-page');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.deletePage(index);
                    });
                }
        
                container.appendChild(pageElement);
            });
        }
    }
  