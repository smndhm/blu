/**
 * Decorative background of the home page: a ribbon of colored triangles along the right edge,
 * rising very slowly. With reduced motion, the ribbon is drawn once and stays still.
 */

/** @typedef {{ u: number, y: number, phase: number }} Vertex `u`: horizontal offset from the base axis, `y`: position in the viewport */
/** @typedef {{ vertices: Vertex[], color: string }} Triangle */

class LcsCnvs {
  #colors = ['#25CE7B', '#DA38B5', '#FDC741', '#01B3E3', '#FF6B01'];
  #speed = 8; // px per second
  #step = 13; // average vertical distance between two new vertices
  #neighbours = 30; // a new triangle uses the two closest of the last vertices
  // The ribbon wanders around the base axis, and its thickness varies, as a smoothed random walk
  #path = { offset: 0, drift: 0, thickness: 60, growth: 0 };
  /** @type {Vertex[]} */
  #vertices = [];
  /** @type {Triangle[]} */
  #triangles = [];
  #frame = 0;
  #time = 0;
  #clock = 0;
  #width = 0;
  #height = 0;
  #window;
  #canvas;
  #ctx;
  #reducedMotion;

  /** @param {Window} window */
  constructor(window) {
    const { document } = window;
    this.#window = window;
    this.#reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    this.#canvas = document.createElement('canvas');
    this.#canvas.className = 'lcs-cnvs';
    this.#canvas.setAttribute('aria-hidden', 'true');
    this.#ctx = this.#canvas.getContext('2d');
    document.body.append(this.#canvas);

    this.#resize();
    this.#fill(-this.#margin);
    this.#draw();
    this.#start();

    window.addEventListener('resize', () => {
      this.#resize();
      this.#fill(this.#vertices.at(-1)?.y ?? -this.#margin);
      this.#draw();
    });
    // Pause when the tab is hidden or the user asks for reduced motion
    document.addEventListener('visibilitychange', () => (document.hidden ? this.#stop() : this.#start()));
    this.#reducedMotion.addEventListener('change', () => (this.#reducedMotion.matches ? this.#stop() : this.#start()));
  }

  // Vertices are created and removed out of the viewport
  get #margin() {
    return 150;
  }

  // How far the ribbon can wander from its base axis
  get #amplitude() {
    return Math.min(130, this.#width * 0.1);
  }

  #resize() {
    const ratio = this.#window.devicePixelRatio || 1;
    this.#width = this.#window.innerWidth;
    this.#height = this.#window.innerHeight;
    this.#canvas.width = this.#width * ratio;
    this.#canvas.height = this.#height * ratio;
    this.#ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  // Next point of the path: velocities change a little at each step, pulled back toward the base axis
  #walk() {
    const path = this.#path;
    const amplitude = this.#amplitude;
    path.drift = path.drift * 0.92 + (Math.random() - 0.5) * 6 - (path.offset / amplitude) * 1.5;
    path.offset = Math.max(-amplitude, Math.min(amplitude * 0.6, path.offset + path.drift));
    path.growth = path.growth * 0.9 + (Math.random() - 0.5) * 6;
    path.thickness = Math.max(20, Math.min(95, path.thickness + path.growth));
  }

  // Adds vertices (and their triangle) from `y` down to below the viewport
  #fill(y) {
    for (let next = y + this.#step; next < this.#height + this.#margin; next += this.#step) {
      this.#walk();
      const { offset, thickness } = this.#path;
      const vertex = {
        u: offset + (Math.random() - 0.5) * 2 * thickness,
        y: next + (Math.random() - 0.5) * thickness,
        phase: Math.random() * Math.PI * 2,
      };
      const recent = this.#vertices.slice(-this.#neighbours);
      if (recent.length >= 2) {
        const distance = other => (other.u - vertex.u) ** 2 + (other.y - vertex.y) ** 2;
        const [first, second] = recent.sort((a, b) => distance(a) - distance(b));
        this.#triangles.push({ vertices: [vertex, first, second], color: this.#colors[Math.floor(Math.random() * this.#colors.length)] });
      }
      this.#vertices.push(vertex);
    }
  }

  #start() {
    if (this.#frame || this.#reducedMotion.matches || this.#window.document.hidden) return;
    this.#time = 0;
    const tick = time => {
      const elapsed = this.#time ? Math.min((time - this.#time) / 1000, 0.1) : 0;
      this.#time = time;
      this.#clock += elapsed;
      this.#move(elapsed * this.#speed);
      this.#draw();
      this.#frame = this.#window.requestAnimationFrame(tick);
    };
    this.#frame = this.#window.requestAnimationFrame(tick);
  }

  #stop() {
    this.#window.cancelAnimationFrame(this.#frame);
    this.#frame = 0;
  }

  // Moves everything up, drops what left the viewport, adds new vertices at the bottom
  #move(distance) {
    for (const vertex of this.#vertices) vertex.y -= distance;
    const top = -this.#margin;
    this.#triangles = this.#triangles.filter(({ vertices }) => vertices.some(vertex => vertex.y > top));
    this.#vertices = this.#vertices.filter(vertex => vertex.y > top || this.#triangles.some(({ vertices }) => vertices.includes(vertex)));
    this.#fill(this.#vertices.at(-1)?.y ?? top);
  }

  // Each vertex also floats a few pixels around its position
  #point({ u, y, phase }) {
    const axis = this.#width - Math.min(170, this.#width * 0.13);
    return [axis + u + Math.sin(this.#clock * 0.4 + phase) * 4, y + Math.cos(this.#clock * 0.3 + phase) * 4];
  }

  #draw() {
    const ctx = this.#ctx;
    ctx.clearRect(0, 0, this.#width, this.#height);
    for (const { vertices, color } of this.#triangles) {
      ctx.beginPath();
      vertices.forEach((vertex, index) => ctx[index ? 'lineTo' : 'moveTo'](...this.#point(vertex)));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.fill();
      ctx.stroke();
    }
  }
}

new LcsCnvs(window);
