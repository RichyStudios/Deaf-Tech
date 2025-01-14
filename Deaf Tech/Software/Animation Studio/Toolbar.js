  class ToolbarManager {
      constructor() {
          this.canvas = document.getElementById('mainCanvas');
          this.ctx = this.canvas.getContext('2d');
          this.currentTool = null;
          this.tools = {
              move: false,
              pencil: false,
              brush: false,
              text: false,
              circle: false,
              triangle: false,
              square: false,
              star: false,
              line: false,
              arrow: false,
              semicircle: false,
              diamond: false,
              heart: false
          };

          this.initializeToolbar();
      }

      initializeToolbar() {
          // Set up tool click handlers
          document.querySelectorAll('.tool').forEach(tool => {
              tool.addEventListener('click', (e) => {
                  const toolName = e.currentTarget.dataset.tool;
                  this.setActiveTool(toolName, e.currentTarget);
                  console.log('Tool activated:', toolName); // Debug
              });
          });
      }

      setActiveTool(toolName, element) {
          // Deactivate all tools first
          Object.keys(this.tools).forEach(tool => {
              this.tools[tool] = false;
          });
          document.querySelectorAll('.tool').forEach(tool => {
              tool.classList.remove('active');
          });

          // Activate selected tool
          this.tools[toolName] = true;
          this.currentTool = toolName;
          element.classList.add('active');

          // Set appropriate cursor
          this.updateCursor(toolName);

          // Handle specific tool activations
          this.handleSpecificTool(toolName);
      }

      updateCursor(toolName) {
          switch(toolName) {
              case 'move':
                  this.canvas.style.cursor = 'move';
                  break;
              case 'text':
                  this.canvas.style.cursor = 'text';
                  break;
              case 'pencil':
              case 'brush':
                  this.canvas.style.cursor = 'crosshair';
                  break;
              default:
                  this.canvas.style.cursor = 'default';
          }
      }

      handleSpecificTool(toolName) {
          // Handle text tool
          if (toolName === 'text') {
              if (window.textTool) {
                  window.textTool.isActive = true;
              }
          } else if (window.textTool) {
              window.textTool.isActive = false;
          }

          // Handle move tool
          if (toolName === 'move') {
              if (window.moveTool) {
                  window.moveTool.activate();
              }
          } else if (window.moveTool) {
              window.moveTool.deactivate();
          }
      }

      getCurrentTool() {
          return this.currentTool;
      }

      isToolActive(toolName) {
          return this.tools[toolName];
      }
  }

  // Initialize toolbar manager
  const toolbarManager = new ToolbarManager();

  // Export for global access
  window.toolbarManager = toolbarManager;