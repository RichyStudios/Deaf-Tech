                  class Canvas {
                      constructor() {
                          this.canvas = document.getElementById('mainCanvas');
                          // Enable alpha channel and optimize for frequent pixel manipulation
                          this.ctx = this.canvas.getContext('2d', { 
                              alpha: true,
                              willReadFrequently: true 
                          });

                          // Set fixed dimensions
                          this.canvas.width = 800;
                          this.canvas.height = 600;

                          this.setupTransparentCanvas();
                          this.bindEvents();
                      }

                      setupTransparentCanvas() {
                          // Clear canvas with full transparency
                          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

                          // Set canvas background to transparent
                          this.canvas.style.backgroundColor = 'transparent';

                          // Add checkerboard pattern to container for visibility
                          const container = this.canvas.parentElement;
                          container.style.background = `
                              repeating-conic-gradient(
                                  #e0e0e0 0% 25%,
                                  #ffffff 0% 50%
                              ) 50% / 20px 20px
                          `;

                          // Enable high quality rendering
                          this.ctx.imageSmoothingEnabled = true;
                          this.ctx.imageSmoothingQuality = 'high';
                      }

                      // Method to check if a point is transparent
                      isTransparent(x, y) {
                          const pixel = this.ctx.getImageData(x, y, 1, 1);
                          return pixel.data[3] === 0;
                      }

                      // Method to export with transparency
                      exportTransparent() {
                          return this.canvas.toDataURL('image/png');
                      }

                      bindEvents() {
                          window.addEventListener('resize', () => {
                              this.maintainAspectRatio();
                          });
                      }

                      maintainAspectRatio() {
                          const container = this.canvas.parentElement;
                          const containerStyle = window.getComputedStyle(container);
                          const maxWidth = parseInt(containerStyle.width) - 40;
                          const maxHeight = parseInt(containerStyle.height) - 40;

                          const ratio = Math.min(
                              maxWidth / this.canvas.width,
                              maxHeight / this.canvas.height
                          );

                          this.canvas.style.width = `${this.canvas.width * ratio}px`;
                          this.canvas.style.height = `${this.canvas.height * ratio}px`;
                      }
                  }

                  // Initialize canvas
                  const canvasManager = new Canvas();

                  // Update MoveTool class
                  class MoveTool {
                      constructor(canvas, ctx) {
                          this.canvas = canvas;
                          this.ctx = ctx;
                          this.isActive = false;
                          this.selection = null;
                          this.isDragging = false;
                          this.startPos = { x: 0, y: 0 };
                          this.lastPos = { x: 0, y: 0 };
                          this.handleSize = 10;
                      }

                      activate() {
                          this.isActive = true;
                      }

                      deactivate() {
                          this.isActive = false;
                          this.selection = null;
                          this.isDragging = false;
                      }

                      handleMouseDown(e) {
                          if (!this.isActive) return;

                          const pos = this.getMousePos(e);
                          this.isDragging = true;
                          this.startPos = pos;
                          this.lastPos = pos;

                          if (!this.selection) {
                              this.selection = {
                                  x: pos.x,
                                  y: pos.y,
                                  width: 0,
                                  height: 0
                              };
                          }

                          // Store the initial canvas state
                          this.initialState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                      }

                      handleMouseMove(e) {
                          if (!this.isDragging || !this.isActive) return;

                          const pos = this.getMousePos(e);
                          const dx = pos.x - this.lastPos.x;
                          const dy = pos.y - this.lastPos.y;

                          if (this.selection) {
                              // Restore the initial state
                              this.ctx.putImageData(this.initialState, 0, 0);

                              // Update selection position
                              this.selection.x += dx;
                              this.selection.y += dy;

                              // Draw selection outline
                              this.drawSelectionBox();
                          }

                          this.lastPos = pos;
                      }

                      handleMouseUp() {
                          this.isDragging = false;
                      }

                      getMousePos(e) {
                          const rect = this.canvas.getBoundingClientRect();
                          return {
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top
                          };
                      }

                      drawSelectionBox() {
                          this.ctx.strokeStyle = '#0095ff';
                          this.ctx.setLineDash([5, 5]);
                          this.ctx.strokeRect(
                              this.selection.x,
                              this.selection.y,
                              this.selection.width,
                              this.selection.height
                          );
                          this.ctx.setLineDash([]);
                      }

                      drawHandle(x, y, type) {
                          this.ctx.fillStyle = '#fff';
                          this.ctx.strokeStyle = '#0095ff';
                          this.ctx.setLineDash([]);

                          this.ctx.beginPath();
                          this.ctx.arc(x, y, this.handleSize/2, 0, Math.PI * 2);
                          this.ctx.fill();
                          this.ctx.stroke();
                      }

                      getHandleAtPosition(pos) {
                          const handles = [
                              { x: this.selection.x, y: this.selection.y, type: 'resize' },
                              { x: this.selection.x + this.selection.width, y: this.selection.y, type: 'resize' },
                              { x: this.selection.x, y: this.selection.y + this.selection.height, type: 'resize' },
                              { x: this.selection.x + this.selection.width, y: this.selection.y + this.selection.height, type: 'resize' },
                              { x: this.selection.x + this.selection.width/2, y: this.selection.y - 20, type: 'rotate' }
                          ];

                          return handles.find(handle => 
                              Math.hypot(pos.x - handle.x, pos.y - handle.y) < this.handleSize
                          );
                      }

                      isInsideSelection(pos) {
                          return pos.x >= this.selection.x &&
                              pos.x <= this.selection.x + this.selection.width &&
                              pos.y >= this.selection.y &&
                              pos.y <= this.selection.y + this.selection.height;
                      }

                      finalizeSelection() {
                          this.mode = null;
                          this.startPos = null;
                          if (this.selection) {
                              this.selection.imageData = this.ctx.getImageData(
                                  this.selection.x,
                                  this.selection.y,
                                  this.selection.width,
                                  this.selection.height
                              );
                          }
                      }

                      updateSelectionSize(pos) {
                          this.selection.width = pos.x - this.selection.x;
                          this.selection.height = pos.y - this.selection.y;
                      }
                  }