  class AnimationExporter {
      constructor(frameSystem) {
          this.frameSystem = frameSystem;
          this.initializeExportControls();
      }

      initializeExportControls() {
          document.querySelectorAll('.export-dropdown div').forEach(button => {
              button.addEventListener('click', (e) => {
                  const format = e.target.dataset.format;
                  this.exportAnimation(format);
              });
          });
      }

      async exportAnimation(format) {
          const frames = this.frameSystem.frames;
          const fps = this.frameSystem.fps;
          const width = this.frameSystem.mainCanvas.width;
          const height = this.frameSystem.mainCanvas.height;

          // Create temporary canvas for rendering
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext('2d');

          switch(format) {
              case 'gif':
                  const gif = new GIF({
                      workers: 4,
                      quality: 10,
                      width: width,
                      height: height,
                      workerScript: 'gif.worker.js'
                  });

                  for (let frame of frames) {
                      await this.renderFrame(frame, tempCanvas, tempCtx);
                      gif.addFrame(tempCanvas, {delay: 1000 / fps});
                  }

                  gif.on('finished', (blob) => {
                      this.downloadFile(blob, 'animation.gif');
                  });

                  gif.render();
                  break;

              case 'mp4':
              case 'ogg':
                  const mimeType = format === 'mp4' ? 'video/mp4' : 'video/ogg';
                  const stream = tempCanvas.captureStream(fps);
                  const recorder = new MediaRecorder(stream, {
                      mimeType: mimeType,
                      videoBitsPerSecond: 5000000
                  });

                  const chunks = [];
                  recorder.ondataavailable = e => chunks.push(e.data);
                  recorder.onstop = () => {
                      const blob = new Blob(chunks, {type: mimeType});
                      this.downloadFile(blob, `animation.${format}`);
                  };

                  recorder.start();

                  // Render each frame with correct timing
                  for (let frame of frames) {
                      await this.renderFrame(frame, tempCanvas, tempCtx);
                      await new Promise(resolve => setTimeout(resolve, 1000 / fps));
                  }

                  recorder.stop();
                  break;
          }
      }

      async renderFrame(frame, canvas, ctx) {
          return new Promise((resolve) => {
              const img = new Image();
              img.onload = () => {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0);
                  resolve();
              };
              img.src = frame.imageData;
          });
      }

      downloadFile(blob, filename) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          URL.revokeObjectURL(url);
      }
  }