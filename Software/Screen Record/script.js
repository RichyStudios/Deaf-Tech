  let webcamStream;
  let screenStream;
  let mediaRecorder;
  let recordedChunks = [];
  let isRecording = false;

  const webcamPreview = document.getElementById('webcamPreview');
  const screenPreview = document.getElementById('screenPreview');
  const startWebcamBtn = document.getElementById('startWebcam');
  const startScreenBtn = document.getElementById('startScreen');
  const startRecordingBtn = document.getElementById('startRecording');
  const stopRecordingBtn = document.getElementById('stopRecording');
  const recordingsList = document.getElementById('recordingsList');
    // Webcam handling
    const webcamConstraints = {
        video: {
            width: { exact: 646.4 },
            height: { exact: 365 },
            aspectRatio: 646.4/365
        },
        audio: true
    };
    // Effect settings with default values
    const effects = {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hue: 0
    };

    // Start webcam with effects
    async function startWebcam() {
        try {
            webcamStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 646.4, height: 365 }
            });
            
            const video = document.getElementById('webcamPreview');
            video.srcObject = webcamStream;
            video.onloadedmetadata = () => {
                video.play();
            };
            
        } catch (err) {
            console.error('Webcam error:', err);
        }
    }

    // Remove any existing canvas
    const oldCanvas = document.getElementById('effectCanvas');
    if (oldCanvas) {
        oldCanvas.remove();
    }

    // Add effect control listeners
    document.querySelectorAll('.effect-control').forEach(control => {
        control.addEventListener('input', (e) => {
            effects[e.target.id] = parseFloat(e.target.value);
        });
    });

    // Start webcam when page loads
    document.addEventListener('DOMContentLoaded', startWebcam);
    // Screen capture handling
  startScreenBtn.addEventListener('click', async () => {
      try {
          screenStream = await navigator.mediaDevices.getDisplayMedia({
              video: {
                  cursor: "always"
              },
              audio: true
          });
          screenPreview.srcObject = screenStream;
          startScreenBtn.disabled = true;
      } catch (err) {
          console.error('Error capturing screen:', err);
      }
  });

  // Screen recording functionality
  async function startScreenRecording() {
      try {
          // Get screen stream with audio
          screenStream = await navigator.mediaDevices.getDisplayMedia({
              video: {
                  cursor: "always",
                  displaySurface: "monitor"
              },
              audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  sampleRate: 44100
              }
          });

          // Get audio stream from microphone
          const audioStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  sampleRate: 44100
              }
          });

          // Combine all tracks
          const tracks = [
              ...screenStream.getTracks(),
              ...audioStream.getTracks()
          ];

          const combinedStream = new MediaStream(tracks);

          // Show preview
          screenPreview.srcObject = screenStream;
        
          // Initialize MediaRecorder with combined stream
          mediaRecorder = new MediaRecorder(combinedStream, {
              mimeType: 'video/webm;codecs=vp8,opus'
          });

          // Handle data available event
          mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                  recordedChunks.push(event.data);
              }
          };

          // Handle recording stop
          mediaRecorder.onstop = () => {
              const blob = new Blob(recordedChunks, {
                  type: 'video/webm'
              });
              const url = URL.createObjectURL(blob);
              addRecordingToList(url);
            
              // Reset recording state
              isRecording = false;
              startRecordingBtn.disabled = false;
              stopRecordingBtn.disabled = true;
              recordedChunks = [];
          };

          // Start recording
          mediaRecorder.start();
          isRecording = true;
          startRecordingBtn.disabled = true;
          stopRecordingBtn.disabled = false;

      } catch (error) {
          console.log('Error during recording:', error);
      }
  }

  // Update the event listeners
  startRecordingBtn.addEventListener('click', startScreenRecording);

  stopRecordingBtn.addEventListener('click', () => {
      if (mediaRecorder && isRecording) {
          mediaRecorder.stop();
          screenStream.getTracks().forEach(track => track.stop());
      }
  });
      function addRecordingToList(url) {
      const recordingItem = document.createElement('div');
      recordingItem.className = 'recording-item';
    
      const timestamp = new Date().toLocaleString();
      const video = document.createElement('video');
      video.src = url;
      video.controls = true;
    
      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'download-btn';
      downloadBtn.innerHTML = `<i class="fas fa-download"></i> Download Recording (${timestamp})`;
    
      downloadBtn.addEventListener('click', () => {
          const a = document.createElement('a');
          a.href = url;
          a.download = `screen-recording-${Date.now()}.webm`;
          a.click();
          
          // Add success animation
          downloadBtn.classList.add('success');
          setTimeout(() => {
              downloadBtn.classList.remove('success');
          }, 1000);
      });
    
      recordingItem.appendChild(video);
      recordingItem.appendChild(downloadBtn);
      recordingsList.prepend(recordingItem);
  }

  // Cleanup function
  window.addEventListener('beforeunload', () => {
      if (screenStream) {
          screenStream.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorder && isRecording) {
          mediaRecorder.stop();
      }
  });

  // Cleanup on page unload
  window.onbeforeunload = () => {
      if (webcamStream) {
          webcamStream.getTracks().forEach(track => track.stop());
      }
      if (screenStream) {
          screenStream.getTracks().forEach(track => track.stop());
      }
  };

  // Enhanced PiP implementation
  async function enablePictureInPicture() {
      try {
          // Ensure webcam stream is active
          if (!webcamStream) {
              webcamStream = await navigator.mediaDevices.getUserMedia({
                  video: {
                      width: 1280,
                      height: 720
                  },
                  audio: true
              });
              webcamPreview.srcObject = webcamStream;
          }

          // Create a dedicated video element for PiP
          const pipVideo = document.createElement('video');
          pipVideo.srcObject = webcamStream;
          pipVideo.autoplay = true;
        
          // Important: Add the video element to the DOM temporarily
          pipVideo.style.display = 'none';
          document.body.appendChild(pipVideo);
        
          // Wait for the video to have enough data
          await new Promise((resolve) => {
              pipVideo.addEventListener('loadedmetadata', () => {
                  resolve();
              });
          });
        
          await pipVideo.play();
          await pipVideo.requestPictureInPicture();
        
          // Clean up: remove the temporary video element
          pipVideo.addEventListener('leavepictureinpicture', () => {
              document.body.removeChild(pipVideo);
          });
        
      } catch (error) {
          console.log('PiP Error:', error);
          // Fallback to floating window if PiP fails
          createFloatingWindow();
      }
  }

  // Fallback floating window implementation
  function createFloatingWindow() {
      const width = 320;
      const height = 240;
      const features = `
          width=${width},
          height=${height},
          top=${screen.height - height - 100},
          left=${screen.width - width - 100},
          resizable=yes,
          alwaysOnTop=yes
      `;
    
      const floatingWindow = window.open('', 'Webcam View', features);
      if (floatingWindow) {
          floatingWindow.document.write(`
              <html>
                  <head>
                      <title>Webcam View</title>
                      <style>
                          body { margin: 0; background: #000; }
                          video { width: 100%; height: 100%; object-fit: cover; }
                      </style>
                  </head>
                  <body>
                      <video autoplay playsinline></video>
                  </body>
              </html>
          `);
        
          const video = floatingWindow.document.querySelector('video');
          video.srcObject = webcamStream;
          video.play();
      }
  }

  // Update the button click handler
  document.getElementById('pipButton').addEventListener('click', async () => {
      if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
      } else {
          await enablePictureInPicture();
      }
  });

// Add theme switcher functionality
function initializeTheme() {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    const themeLabel = document.querySelector('.theme-label');
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update label text
    themeLabel.textContent = newTheme === 'dark' ? 'Dark Mode' : 'Light Mode';
}
// Initialize theme on load
initializeTheme();

document.getElementById('themeToggle').addEventListener('click', toggleTheme);
