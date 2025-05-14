const dropArea = document.getElementById('drop-area');
  const target = document.getElementById('target-box');
  const videoPlayer = document.getElementById('local-video');
  const cubes = [];
  let currentURL = null;

  class Cube {
    constructor(videoURL) {
      this.videoURL = videoURL;
      this.el = document.createElement('div');
      this.el.className = 'cube';

      this.width = 200;
      this.height = 200;
      this.posX = Math.random() * (window.innerWidth - this.width);
      this.posY = 100;
      this.velX = 0;
      this.velY = 0;
      this.rot = 0;
      this.rotSpeed = 0;
      this.dragging = false;

      this.offsetX = 0;
      this.offsetY = 0;

      this.el.style.left = this.posX + 'px';
      this.el.style.top = this.posY + 'px';

      this.el.addEventListener('mousedown', (e) => this.startDrag(e));
      document.addEventListener('mousemove', (e) => this.onDrag(e));
      document.addEventListener('mouseup', () => this.stopDrag());

      document.body.appendChild(this.el);

      this.createThumbnail(videoURL);
    }

    createThumbnail(url) {
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.currentTime = 0.1;

      video.addEventListener('loadeddata', () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, 200, 200);
        this.el.style.backgroundImage = `url(${canvas.toDataURL()})`;
      });
    }

    startDrag(e) {
      this.dragging = true;
      this.offsetX = e.clientX - this.el.offsetLeft;
      this.offsetY = e.clientY - this.el.offsetTop;
    }

    onDrag(e) {
      if (this.dragging) {
        this.posX = e.clientX - this.offsetX;
        this.posY = e.clientY - this.offsetY;
        this.velX = 0;
        this.velY = 0;
        this.rotSpeed = 0;
        this.updatePosition();
      }
    }

    stopDrag() {
      this.dragging = false;
    }

    update() {
      const gravity = 0.5;
      const bounce = 0.6;
      const friction = 0.98;

      if (!this.dragging) {
        this.velY += gravity;
        this.velX *= friction;
        this.velY *= friction;

        this.posX += this.velX;
        this.posY += this.velY;
      }

      const box = target.getBoundingClientRect();
      const cubeCenterX = this.posX + this.width / 2;
      const cubeCenterY = this.posY + this.height / 2;

      const insideBox =
        cubeCenterX > box.left &&
        cubeCenterX < box.right &&
        cubeCenterY > box.top &&
        cubeCenterY < box.bottom;

      if (insideBox) {
        if (this.posX < box.left) {
          this.posX = box.left;
          this.velX *= -bounce;
        } else if (this.posX + this.width > box.right) {
          this.posX = box.right - this.width;
          this.velX *= -bounce;
        }

        if (this.posY < box.top) {
          this.posY = box.top;
          this.velY *= -bounce;
        } else if (this.posY + this.height > box.bottom) {
          this.posY = box.bottom - this.height;
          this.velY *= -bounce;
        }
      } else {
        if (this.posX < 0 || this.posX + this.width > window.innerWidth) {
          this.velX *= -bounce;
          this.posX = Math.max(0, Math.min(this.posX, window.innerWidth - this.width));
        }

        if (this.posY < 0 || this.posY + this.height > window.innerHeight) {
          this.velY *= -bounce;
          this.posY = Math.max(0, Math.min(this.posY, window.innerHeight - this.height));
        }
      }

      if (insideBox) {
        if (currentURL !== this.videoURL) {
          videoPlayer.src = this.videoURL;
          videoPlayer.play();
          videoPlayer.style.display = "block";
          currentURL = this.videoURL;
        }
      } else {
        if (currentURL === this.videoURL) {
          videoPlayer.pause();
          videoPlayer.style.display = "none";
          currentURL = null;
        }
      }

      this.rot += this.rotSpeed;
      this.rotSpeed *= 0.95;

      this.updatePosition();
    }

    updatePosition() {
      this.el.style.left = this.posX + 'px';
      this.el.style.top = this.posY + 'px';
      this.el.style.transform = `rotateZ(${this.rot}deg)`;
    }
  }

  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.style.background = '#eee';
  });

  dropArea.addEventListener('dragleave', () => {
    dropArea.style.background = '#f9f9f9';
  });

  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.style.background = '#f9f9f9';

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      const cube = new Cube(url);
      cubes.push(cube);
    } else {
      alert('Por favor, solte um vídeo válido.');
    }
  });

  function isColliding(a, b) {
    return !(
      a.posX + a.width < b.posX ||
      a.posX > b.posX + b.width ||
      a.posY + a.height < b.posY ||
      a.posY > b.posY + b.height
    );
  }

  function resolveCollision(a, b) {
    const bounce = 0.6;
    const dx = (a.posX + a.width / 2) - (b.posX + b.width / 2);
    const dy = (a.posY + a.height / 2) - (b.posY + b.height / 2);
    const overlapX = a.width / 2 + b.width / 2 - Math.abs(dx);
    const overlapY = a.height / 2 + b.height / 2 - Math.abs(dy);

    if (overlapX < overlapY) {
      const direction = dx > 0 ? 1 : -1;
      a.posX += (overlapX / 2) * direction;
      b.posX -= (overlapX / 2) * direction;

      const temp = a.velX;
      a.velX = b.velX * bounce;
      b.velX = temp * bounce;
    } else {
      const direction = dy > 0 ? 1 : -1;
      a.posY += (overlapY / 2) * direction;
      b.posY -= (overlapY / 2) * direction;

      const temp = a.velY;
      a.velY = b.velY * bounce;
      b.velY = temp * bounce;
    }
  }

  function animate() {
    for (const cube of cubes) {
      cube.update();
    }

    // Verificar colisões entre cubos
    for (let i = 0; i < cubes.length; i++) {
      for (let j = i + 1; j < cubes.length; j++) {
        const a = cubes[i];
        const b = cubes[j];

        if (isColliding(a, b)) {
          resolveCollision(a, b);
        }
      }
    }

    requestAnimationFrame(animate);
  }

  animate();