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
  #canvas;
  #ctx;

  /** @param {Window} window */
  constructor(window) {
    const { document } = window;

    this.#canvas = document.createElement('canvas');
    this.#canvas.className = 'lcs-cnvs';
    this.#canvas.setAttribute('aria-hidden', 'true');
    this.#canvas.width = window.innerWidth;
    this.#canvas.height = window.innerHeight;
    this.#ctx = this.#canvas.getContext('2d');
    document.body.append(this.#canvas);

    window.addEventListener('resize', () => {
      this.#canvas.width = window.innerWidth;
      this.#canvas.height = window.innerHeight;
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

    let interval;
    ['mousemove', 'touchmove'].forEach(eventType => {
      window.addEventListener(
        eventType,
        event => {
          clearInterval(interval);
          const point = event.touches ? event.touches[0] : event;
          const vertex = { x: point.clientX || 0, y: point.clientY || 0 };
          this.#addVertex(vertex);
          interval = setInterval(() => this.#addVertex(vertex), 10);
        },
        { passive: true },
      );
    });
  }

  #getRandomNumberBetween = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

  #getVerticesDistance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  #isHover = vertex =>
    this.#notHover !== undefined &&
    vertex.x > this.#notHover.x &&
    vertex.x < this.#notHover.x + this.#notHover.width &&
    vertex.y > this.#notHover.y &&
    vertex.y < this.#notHover.y + this.#notHover.height;

  #getRandomVertex = (position, distance) => {
    let vertex;
    let attempts = 0;
    do {
      vertex = {
        x: this.#getRandomNumberBetween(position.x - distance, position.x + distance),
        y: this.#getRandomNumberBetween(position.y - distance, position.y + distance),
      };
      attempts++;
    } while ((this.#getVerticesDistance(position, vertex) > distance || this.#isHover(vertex)) && attempts < 100);
    return attempts < 100 ? vertex : undefined;
  };

  #getClosestVertices = (vertices, vertex, count) => vertices.sort((a, b) => this.#getVerticesDistance(a, vertex) - this.#getVerticesDistance(b, vertex)).slice(0, count);

  #addVertex = position => {
    const vertex = this.#getRandomVertex(position, this.#around);
    if (!vertex) return;

    if (this.#vertices.length >= 2) {
      this.#polygons.push({
        vertices: [vertex, ...this.#getClosestVertices([...this.#vertices], vertex, 2)],
        color: this.#colors[Math.floor(Math.random() * this.#colors.length)],
      });
    }

    this.#vertices.push(vertex);
    this.#vertices = this.#vertices.slice(-this.#limit);

    this.#polygons = this.#polygons.filter(polygon => polygon.vertices.some(pVertex => this.#vertices.some(vVertex => pVertex.x === vVertex.x && pVertex.y === vVertex.y)));

    this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);

    for (const { vertices, color } of this.#polygons) {
      this.#ctx.beginPath();
      this.#ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let i = 1; i < vertices.length; i++) {
        this.#ctx.lineTo(vertices[i].x, vertices[i].y);
      }
      this.#ctx.closePath();
      this.#ctx.fillStyle = color;
      this.#ctx.strokeStyle = color;
      this.#ctx.fill();
      this.#ctx.stroke();
    }
  };
}

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) new LcsCnvs(window);
