/**
 * Decorative background of the home page: a ribbon of colored triangles along the right edge,
 * rising very slowly. With reduced motion, the ribbon is drawn once and stays still.
 */

/** @typedef {{ u: number, y: number }} Vertex `u`: horizontal offset from the ribbon axis, `y`: position in the page */
/** @typedef {{ vertices: Vertex[], color: string }} Triangle */

class LcsCnvs {
  #colors = ['#25CE7B', '#DA38B5', '#FDC741', '#01B3E3', '#FF6B01'];
  #speed = 8; // px per second
  #step = 13; // average vertical distance between two new vertices
  #spread = 85; // max horizontal distance from the axis
  #neighbours = 30; // a new triangle uses the two closest of the last vertices
  /** @type {Vertex[]} */
  #vertices = [];
  /** @type {Triangle[]} */
  #triangles = [];
  #frame = 0;
  #time = 0;
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
    this.#fill(-this.#spread);
    this.#draw();
    this.#start();

    window.addEventListener('resize', () => {
      this.#resize();
      this.#fill(this.#vertices.at(-1)?.y ?? -this.#spread);
      this.#draw();
    });
    // Pause when the tab is hidden or the user asks for reduced motion
    document.addEventListener('visibilitychange', () => (document.hidden ? this.#stop() : this.#start()));
    this.#reducedMotion.addEventListener('change', () => (this.#reducedMotion.matches ? this.#stop() : this.#start()));
  }

  #resize() {
    const ratio = this.#window.devicePixelRatio || 1;
    this.#width = this.#window.innerWidth;
    this.#height = this.#window.innerHeight;
    this.#canvas.width = this.#width * ratio;
    this.#canvas.height = this.#height * ratio;
    this.#ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  // Ribbon axis: close to the right edge, slightly curved
  #x({ u, y }) {
    const center = this.#width - Math.min(150, this.#width * 0.12);
    return center - Math.sin((y / this.#height) * Math.PI) * Math.min(40, this.#width * 0.04) + u;
  }

  // Adds vertices (and their triangle) from `y` down to below the viewport
  #fill(y) {
    for (let next = y + this.#step; next < this.#height + this.#spread * 2; next += this.#step) {
      const vertex = { u: (Math.random() - 0.5) * 2 * this.#spread, y: next + (Math.random() - 0.5) * this.#spread };
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
      const elapsed = this.#time ? (time - this.#time) / 1000 : 0;
      this.#time = time;
      this.#move(Math.min(elapsed, 0.1) * this.#speed);
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
    const top = -this.#spread * 2;
    this.#triangles = this.#triangles.filter(({ vertices }) => vertices.some(vertex => vertex.y > top));
    this.#vertices = this.#vertices.filter(vertex => vertex.y > top || this.#triangles.some(({ vertices }) => vertices.includes(vertex)));
    this.#fill(this.#vertices.at(-1)?.y ?? top);
  }

  #draw() {
    const ctx = this.#ctx;
    ctx.clearRect(0, 0, this.#width, this.#height);
    for (const { vertices, color } of this.#triangles) {
      ctx.beginPath();
      vertices.forEach((vertex, index) => ctx[index ? 'lineTo' : 'moveTo'](this.#x(vertex), vertex.y));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.fill();
      ctx.stroke();
    }
  }
}

new LcsCnvs(window);
