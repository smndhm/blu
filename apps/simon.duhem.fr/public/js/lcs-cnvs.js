/**
 * Decorative background: draws colored triangles following the pointer.
 * Only loaded on the home page, and skipped when the user prefers reduced motion.
 */

/** @typedef {{ x: number, y: number }} Vertex */
/** @typedef {{ vertices: Vertex[], color: string }} Polygon */

class LcsCnvs {
  #around = 50;
  #limit = 50;
  #colors = ['#25CE7B', '#DA38B5', '#FDC741', '#01B3E3', '#FF6B01'];
  /** @type {Vertex[]} */
  #vertices = [];
  /** @type {Polygon[]} */
  #polygons = [];
  /** @type {DOMRect | undefined} */
  #notHover;
  /** @type {Vertex | undefined} Last pointer position, where new vertices are added */
  #pointer;
  #frame = 0;
  #window;
  #canvas;
  #ctx;

  /** @param {Window} window */
  constructor(window) {
    const { document } = window;
    this.#window = window;

    this.#canvas = document.createElement('canvas');
    this.#canvas.className = 'lcs-cnvs';
    this.#canvas.setAttribute('aria-hidden', 'true');
    this.#ctx = this.#canvas.getContext('2d');
    this.#resize();
    document.body.append(this.#canvas);

    window.addEventListener('resize', () => {
      this.#resize();
      this.#draw();
    });

    // Keep links readable: no vertex is drawn over the hovered link
    document.querySelectorAll('a').forEach(el => {
      el.addEventListener('mouseover', () => {
        this.#notHover = el.getBoundingClientRect();
      });
      el.addEventListener('mouseleave', () => {
        this.#notHover = undefined;
      });
    });

    ['mousemove', 'touchmove'].forEach(eventType => {
      window.addEventListener(
        eventType,
        event => {
          const point = event.touches ? event.touches[0] : event;
          this.#pointer = { x: point.clientX || 0, y: point.clientY || 0 };
          this.#start();
        },
        { passive: true },
      );
    });

    // Pause when the mouse leaves the page or the tab is hidden; resume on the next move
    document.documentElement.addEventListener('mouseleave', () => this.#stop());
    document.addEventListener('visibilitychange', () => document.hidden && this.#stop());
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', ({ matches }) => {
      if (!matches) return;
      this.#stop();
      this.#canvas.remove();
    });
  }

  #resize() {
    this.#canvas.width = this.#window.innerWidth;
    this.#canvas.height = this.#window.innerHeight;
  }

  // One vertex and one redraw per animation frame, instead of a 10 ms interval that never stopped
  #start() {
    if (this.#frame) return;
    const tick = () => {
      this.#addVertex(this.#pointer);
      this.#draw();
      this.#frame = this.#window.requestAnimationFrame(tick);
    };
    this.#frame = this.#window.requestAnimationFrame(tick);
  }

  #stop() {
    this.#window.cancelAnimationFrame(this.#frame);
    this.#frame = 0;
  }

  #isHover = vertex =>
    this.#notHover !== undefined &&
    vertex.x > this.#notHover.x &&
    vertex.x < this.#notHover.x + this.#notHover.width &&
    vertex.y > this.#notHover.y &&
    vertex.y < this.#notHover.y + this.#notHover.height;

  // Uniform random point in the disc around the position (no rejection loop), outside the hovered link
  #getRandomVertex = (position, distance) => {
    for (let attempts = 0; attempts < 10; attempts++) {
      const angle = Math.random() * 2 * Math.PI;
      const radius = distance * Math.sqrt(Math.random());
      const vertex = { x: Math.round(position.x + radius * Math.cos(angle)), y: Math.round(position.y + radius * Math.sin(angle)) };
      if (!this.#isHover(vertex)) return vertex;
    }
  };

  // The two closest vertices, in a single pass with squared distances (no copy, no sort)
  #getTwoClosestVertices = vertex => {
    let first, second;
    let firstDistance = Infinity;
    let secondDistance = Infinity;
    for (const candidate of this.#vertices) {
      const distance = (candidate.x - vertex.x) ** 2 + (candidate.y - vertex.y) ** 2;
      if (distance < firstDistance) {
        [second, secondDistance] = [first, firstDistance];
        [first, firstDistance] = [candidate, distance];
      } else if (distance < secondDistance) {
        [second, secondDistance] = [candidate, distance];
      }
    }
    return [first, second];
  };

  #addVertex = position => {
    const vertex = this.#getRandomVertex(position, this.#around);
    if (!vertex) return;

    if (this.#vertices.length >= 2) {
      this.#polygons.push({
        vertices: [vertex, ...this.#getTwoClosestVertices(vertex)],
        color: this.#colors[Math.floor(Math.random() * this.#colors.length)],
      });
    }

    this.#vertices.push(vertex);
    if (this.#vertices.length > this.#limit) this.#vertices.shift();
    // A polygon lives as long as its newest vertex (the one it was created with): keep the last ones
    if (this.#polygons.length > this.#limit) this.#polygons.shift();
  };

  #draw() {
    const ctx = this.#ctx;
    ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);

    for (const { vertices, color } of this.#polygons) {
      ctx.beginPath();
      ctx.moveTo(vertices[0].x, vertices[0].y);
      ctx.lineTo(vertices[1].x, vertices[1].y);
      ctx.lineTo(vertices[2].x, vertices[2].y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.fill();
      ctx.stroke();
    }
  }
}

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) new LcsCnvs(window);
