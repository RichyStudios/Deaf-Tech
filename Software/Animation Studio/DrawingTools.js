  class DrawingTools {
      constructor() {
          this.canvas = document.getElementById('mainCanvas');
          this.ctx = this.canvas.getContext('2d');
          this.isDrawing = false;
          this.drawnObjects = [];
        
          // Drawing properties
          this.color = '#000000';
          this.lineWidth = 2;
          this.fontSize = 20;
          this.fontFamily = 'Arial';
          this.fillStyle = true;

          // Current positions
          this.startX = 0;
          this.startY = 0;
          this.currentX = 0;
          this.currentY = 0;

          this.initializeTools();
      }

      initializeTools() {
          // Shape tools
          const shapeTools = ['circle', 'square', 'triangle', 'star', 'line', 'arrow', 'semicircle', 'diamond', 'heart'];
          shapeTools.forEach(shape => {
              document.querySelector(`[data-tool="${shape}"]`).onclick = () => {
                  this.currentTool = shape;
              };
          });

          // Drawing tools
          document.querySelector('[data-tool="pencil"]').onclick = () => this.currentTool = 'pencil';
          document.querySelector('[data-tool="brush"]').onclick = () => this.currentTool = 'brush';

          // Canvas events
          this.canvas.onmousedown = (e) => this.startDrawing(e);
          this.canvas.onmousemove = (e) => this.draw(e);
          this.canvas.onmouseup = () => this.stopDrawing();
      }

      startDrawing(e) {
          this.isDrawing = true;
          [this.startX, this.startY] = this.getMousePos(e);
          [this.currentX, this.currentY] = [this.startX, this.startY];

          if (this.currentTool === 'pencil' || this.currentTool === 'brush') {
              this.ctx.beginPath();
              this.ctx.moveTo(this.startX, this.startY);
          }
      }

      draw(e) {
          if (!this.isDrawing) return;

          [this.currentX, this.currentY] = this.getMousePos(e);

          switch(this.currentTool) {
              case 'pencil':
                  this.drawPencil();
                  break;
              case 'brush':
                  this.drawBrush();
                  break;
              case 'circle':
                  this.drawCircle();
                  break;
              case 'square':
                  this.drawSquare();
                  break;
              case 'triangle':
                  this.drawTriangle();
                  break;
              // Add other shape drawing methods
          }
      }

      drawPencil() {
          this.ctx.lineWidth = this.lineWidth;
          this.ctx.lineCap = 'round';
          this.ctx.strokeStyle = this.color;
        
          this.ctx.lineTo(this.currentX, this.currentY);
          this.ctx.stroke();
      }

      drawBrush() {
          this.ctx.lineWidth = this.lineWidth * 3;
          this.ctx.lineCap = 'round';
          this.ctx.strokeStyle = this.color;
        
          this.ctx.lineTo(this.currentX, this.currentY);
          this.ctx.stroke();
      }

      drawCircle() {
          const radius = Math.sqrt(
              Math.pow(this.currentX - this.startX, 2) + 
              Math.pow(this.currentY - this.startY, 2)
          );

          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.ctx.beginPath();
          this.ctx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
        
          if (this.fillStyle) {
              this.ctx.fill();
          }
          this.ctx.stroke();
      }

      drawSquare() {
          const width = this.currentX - this.startX;
          const height = this.currentY - this.startY;

          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          if (this.fillStyle) {
              this.ctx.fillRect(this.startX, this.startY, width, height);
          }
          this.ctx.strokeRect(this.startX, this.startY, width, height);
      }

      drawTriangle() {
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.ctx.beginPath();
          this.ctx.moveTo(this.startX, this.startY);
          this.ctx.lineTo(this.currentX, this.currentY);
          this.ctx.lineTo(this.startX - (this.currentX - this.startX), this.currentY);
          this.ctx.closePath();
        
          if (this.fillStyle) {
              this.ctx.fill();
          }
          this.ctx.stroke();
      }

      addText(text, x, y) {
          this.ctx.font = `${this.fontSize}px ${this.fontFamily}`;
          this.ctx.fillStyle = this.color;
          this.ctx.fillText(text, x, y);
      }

      stopDrawing() {
          if (!this.isDrawing) return;
          this.isDrawing = false;

          // Store the drawn object
          const drawnObject = {
              type: this.currentTool,
              bounds: {
                  x: Math.min(this.startX, this.currentX),
                  y: Math.min(this.startY, this.currentY),
                  width: Math.abs(this.currentX - this.startX),
                  height: Math.abs(this.currentY - this.startY)
              },
              imageData: this.ctx.getImageData(
                  Math.min(this.startX, this.currentX),
                  Math.min(this.startY, this.currentY),
                  Math.abs(this.currentX - this.startX),
                  Math.abs(this.currentY - this.startY)
              )
          };

          this.drawnObjects.push(drawnObject);
      }

      getMousePos(e) {
          const rect = this.canvas.getBoundingClientRect();
          return [
              e.clientX - rect.left,
              e.clientY - rect.top
          ];
      }
  }

  // Initialize
  const drawingTools = new DrawingTools();
  class TextTool {
      constructor() {
          this.canvas = document.getElementById('mainCanvas');
          this.ctx = this.canvas.getContext('2d');
          this.isActive = false;
        
          // Text properties
          this.fontSize = 20;
          this.fontFamily = 'Arial';
          this.color = '#000000';
        
          // Create text input
          this.createTextInput();
          // Initialize events
          this.initEvents();
      }

      createTextInput() {
          // Create input element
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'canvas-text-input';
          input.style.cssText = `
              position: fixed;
              background: white;
              border: 1px solid #2196F3;
              padding: 8px;
              font-size: ${this.fontSize}px;
              font-family: ${this.fontFamily};
              min-width: 200px;
              display: none;
              z-index: 10000;
          `;
          document.body.appendChild(input);
          this.textInput = input;
      }

      initEvents() {
          // Text tool button
          const textBtn = document.querySelector('[data-tool="text"]');
          textBtn.addEventListener('click', () => {
              this.isActive = !this.isActive;
              textBtn.classList.toggle('active');
              this.canvas.style.cursor = this.isActive ? 'text' : 'default';
          });

          // Canvas click
          this.canvas.addEventListener('click', (e) => {
              if (!this.isActive) return;
            
              const rect = this.canvas.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
            
              // Show input at click position
              this.textInput.style.left = `${e.clientX}px`;
              this.textInput.style.top = `${e.clientY}px`;
              this.textInput.style.display = 'block';
              this.textInput.focus();
            
              // Store canvas position
              this.textInput.dataset.x = x;
              this.textInput.dataset.y = y;
          });

          // Input events
          this.textInput.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                  this.drawText();
              }
          });

          this.textInput.addEventListener('blur', () => {
              this.drawText();
          });
      }

      drawText() {
          const text = this.textInput.value;
          if (!text) {
              this.textInput.style.display = 'none';
              return;
          }

          const x = parseFloat(this.textInput.dataset.x);
          const y = parseFloat(this.textInput.dataset.y);

          // Draw text on canvas
          this.ctx.font = `${this.fontSize}px ${this.fontFamily}`;
          this.ctx.fillStyle = this.color;
          this.ctx.fillText(text, x, y);

          // Reset input
          this.textInput.style.display = 'none';
          this.textInput.value = '';
      }
  }

  // Initialize
  const textTool = new TextTool();
  window.textTool = textTool;