/**
 * Decorative background of the home page: a ribbon of colored triangles that slowly sways.
 * - Vertical along the right edge when it fits beside the text.
 * - Otherwise (narrow screens) horizontal along the bottom edge.
 * The pointer catches the vertices it comes close to and drags them out of the ribbon: the more it
 * catches, the further it can go. When the pointer stops, the vertices go back to their place.
 * With reduced motion, the ribbon is drawn once and stays still.
 */

/**
 * `a` and `u`: home of the vertex, in the ribbon frame (`a` along the ribbon, `u` across, from its axis).
 * `x`, `y`, `vx`, `vy`: where it is drawn and its speed, it moves toward its home, or the pointer when caught.
 * `offset`: when caught, its position relative to the pointer.
 * @typedef {{ a: number, u: number, phase: number, x: number, y: number, vx: number, vy: number, offset?: number[] }} Vertex
 */
/** @typedef {{ vertices: Vertex[], color: string }} Triangle */

class LcsCnvs {
  #colors = ['#25CE7B', '#DA38B5', '#FDC741', '#01B3E3', '#FF6B01'];
  #neighbours = 30; // a new triangle uses the two closest of the last vertices
  #margin = 150; // the ribbon goes this far beyond the viewport
  #gap = 24; // min space between the text and the vertical ribbon
  // Sway: a slow wave travels along the ribbon, and each vertex floats around its place
  #wave = { amplitude: 14, length: 700, period: 14 }; // px, px, s
  #float = 6; // px
  // Pointer
  #reach = 50; // the pointer catches the vertices this close to it
  #idle = 1200; // ms without moving before the pointer lets the vertices go
  #gather = 0.97; // caught vertices get a little closer to the pointer at each frame
  #cluster = 30; // until this distance
  // Springs (per frame at 60 fps): caught vertices follow the pointer quickly, free ones go home slowly
  #stiffness = { caught: 0.12, free: 0.025 };
  #damping = 0.82;
  #vertical = true;
  // The ribbon wanders around its axis, and its thickness varies, as a smoothed random walk
  #path = { offset: 0, drift: 0, thickness: 0, growth: 0 };
  /** @type {Vertex[]} */
  #vertices = [];
  /** @type {Vertex[]} Last vertices of the ribbon, where it grows when the viewport gets longer */
  #tail = [];
  /** @type {Triangle[]} */
  #triangles = [];
  /** @type {{ x: number, y: number } | undefined} */
  #pointer;
  #pointerMove = 0;
  #frame = 0;
  #time = 0;
  #now = 0;
  #width = 0;
  #height = 0;
  #window;
  #canvas;
  #ctx;
  #text;
  #reducedMotion;

  /** @param {Window} window */
  constructor(window) {
    const { document } = window;
    this.#window = window;
    this.#reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.#text = document.querySelector('.intro');

    this.#canvas = document.createElement('canvas');
    this.#canvas.className = 'lcs-cnvs';
    this.#canvas.setAttribute('aria-hidden', 'true');
    this.#ctx = this.#canvas.getContext('2d');
    document.body.append(this.#canvas);

    this.#resize();
    this.#draw();
    this.#start();

    window.addEventListener('resize', () => {
      this.#resize();
      this.#draw();
    });
    ['mousemove', 'touchmove', 'touchstart'].forEach(type =>
      window.addEventListener(
        type,
        event => {
          const point = event.touches ? event.touches[0] : event;
          this.#pointer = { x: point.clientX, y: point.clientY };
          this.#pointerMove = this.#window.performance.now();
        },
        { passive: true },
      ),
    );
    const release = () => (this.#pointer = undefined);
    document.documentElement.addEventListener('mouseleave', release);
    window.addEventListener('touchend', release);
    // Pause when the tab is hidden or the user asks for reduced motion
    document.addEventListener('visibilitychange', () => (document.hidden ? this.#stop() : this.#start()));
    this.#reducedMotion.addEventListener('change', () => {
      if (!this.#reducedMotion.matches) return this.#start();
      this.#stop();
      this.#settle();
      this.#draw();
    });
  }

  // Shape of the ribbon in each orientation
  get #shape() {
    return this.#vertical
      ? { amplitude: Math.min(130, this.#width * 0.1), thickness: [20, 95], step: 13 }
      : { amplitude: Math.min(60, this.#width * 0.1), thickness: [10, 45], step: 10 };
  }

  // Position of the axis across the viewport: close to the right edge, or to the bottom edge
  #axisFor(vertical) {
    return vertical ? this.#width - Math.min(170, this.#width * 0.13) : this.#height - Math.min(100, this.#height * 0.12);
  }

  get #axis() {
    return this.#axisFor(this.#vertical);
  }

  // Length of the viewport along the ribbon
  get #length() {
    return this.#vertical ? this.#height : this.#width;
  }

  #resize() {
    this.#now = this.#window.performance.now();
    const previous = { length: this.#length, shape: this.#shape };

    const ratio = this.#window.devicePixelRatio || 1;
    // Without the scrollbar gutter (`scrollbar-gutter: stable`), like the fixed canvas
    const { clientWidth, clientHeight } = this.#window.document.documentElement;
    this.#width = clientWidth;
    this.#height = clientHeight;
    this.#canvas.width = this.#width * ratio;
    this.#canvas.height = this.#height * ratio;
    this.#ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    // Vertical when the ribbon (its usual width) stays beside the text, else horizontal
    const text = this.#text?.getBoundingClientRect();
    const usualHalfWidth = Math.min(130, this.#width * 0.1) * 0.5 + 60;
    const vertical = !text || this.#axisFor(true) - usualHalfWidth > text.right + this.#gap;
    if (!this.#vertices.length) {
      this.#vertical = vertical;
      this.#path = { offset: 0, drift: 0, thickness: this.#shape.thickness[1] * 0.6, growth: 0 };
    } else if (vertical !== this.#vertical) {
      this.#vertical = vertical;
      this.#turn(previous);
    }
    this.#fill();
    // Without animation, the vertices are at home right away (they glide there otherwise)
    if (this.#reducedMotion.matches) this.#settle();

    // Fainter when the horizontal ribbon can be under the text (short viewports), so it stays readable
    const overlaps = !this.#vertical && text && this.#axis - this.#shape.amplitude - this.#shape.thickness[1] < text.bottom;
    this.#canvas.style.opacity = overlaps ? '0.35' : '0.6';
  }

  // Next point of the path: velocities change a little at each step, pulled back toward the axis
  #walk() {
    const path = this.#path;
    const { amplitude, thickness } = this.#shape;
    path.drift = path.drift * 0.92 + (Math.random() - 0.5) * 6 - (path.offset / amplitude) * 1.5;
    path.offset = Math.max(-amplitude, Math.min(amplitude * 0.6, path.offset + path.drift));
    path.growth = path.growth * 0.9 + (Math.random() - 0.5) * thickness[1] * 0.06;
    path.thickness = Math.max(thickness[0], Math.min(thickness[1], path.thickness + path.growth));
  }

  // Grows the ribbon until it covers the viewport: each new vertex makes a triangle with its two closest
  #fill() {
    const { step } = this.#shape;
    for (let a = (this.#tail.at(-1)?.a ?? -this.#margin) + step; a < this.#length + this.#margin; a += step) {
      this.#walk();
      const { offset, thickness } = this.#path;
      const vertex = { a: a + (Math.random() - 0.5) * thickness, u: offset + (Math.random() - 0.5) * 2 * thickness, phase: Math.random() * Math.PI * 2, vx: 0, vy: 0 };
      [vertex.x, vertex.y] = this.#home(vertex);
      if (this.#tail.length >= 2) {
        const distance = other => (other.a - vertex.a) ** 2 + (other.u - vertex.u) ** 2;
        const [first, second] = [...this.#tail].sort((a, b) => distance(a) - distance(b));
        this.#triangles.push({ vertices: [vertex, first, second], color: this.#colors[Math.floor(Math.random() * this.#colors.length)] });
      }
      this.#vertices.push(vertex);
      this.#tail = [...this.#tail, vertex].slice(-this.#neighbours);
    }
  }

  // Same ribbon in the new orientation, as if it turned around the bottom right corner: the bottom end of
  // the vertical ribbon becomes the right end of the horizontal one. Stretched along the viewport, thinner or
  // thicker across. The vertices keep their position on screen and glide to their new home.
  #turn(previous) {
    const margin = this.#margin;
    const scaleAlong = (this.#length + 2 * margin) / (previous.length + 2 * margin);
    const scaleAcross = this.#shape.thickness[1] / previous.shape.thickness[1];
    for (const vertex of this.#vertices) {
      vertex.a = this.#length + margin - (previous.length + margin - vertex.a) * scaleAlong;
      vertex.u *= scaleAcross;
    }
    this.#tail = [...this.#vertices].sort((a, b) => a.a - b.a).slice(-this.#neighbours);
    this.#path.offset *= scaleAcross;
    this.#path.thickness *= scaleAcross;
  }

  // Home of a vertex on screen, with the sway
  #home({ a, u, phase }) {
    const time = this.#now / 1000;
    const { amplitude, length, period } = this.#wave;
    const wave = amplitude * Math.sin((2 * Math.PI * a) / length - (2 * Math.PI * time) / period);
    const along = a + Math.cos(time * 0.3 + phase) * this.#float;
    const across = this.#axis + u + wave + Math.sin(time * 0.4 + phase) * this.#float;
    return this.#vertical ? [across, along] : [along, across];
  }

  // Every vertex at home, still
  #settle() {
    for (const vertex of this.#vertices) {
      [vertex.x, vertex.y] = this.#home(vertex);
      vertex.vx = vertex.vy = 0;
      delete vertex.offset;
    }
  }

  // Catches the vertices close to the pointer, lets them all go when it stops or leaves
  #catch() {
    const pointer = this.#pointer;
    if (!pointer || this.#now - this.#pointerMove > this.#idle) {
      for (const vertex of this.#vertices) delete vertex.offset;
      return;
    }
    for (const vertex of this.#vertices) {
      const offset = [vertex.x - pointer.x, vertex.y - pointer.y];
      // Caught vertices gather around the pointer, without collapsing on it
      if (vertex.offset) {
        if (Math.hypot(...vertex.offset) > this.#cluster) vertex.offset = vertex.offset.map(value => value * this.#gather);
      } else if (Math.hypot(...offset) < this.#reach) vertex.offset = offset;
    }
  }

  // Springs toward the target: the pointer (with its offset) for caught vertices, home for the others
  #step(frames) {
    for (const vertex of this.#vertices) {
      const [x, y] = vertex.offset ? [this.#pointer.x + vertex.offset[0], this.#pointer.y + vertex.offset[1]] : this.#home(vertex);
      const stiffness = vertex.offset ? this.#stiffness.caught : this.#stiffness.free;
      const damping = this.#damping ** frames;
      vertex.vx = (vertex.vx + (x - vertex.x) * stiffness * frames) * damping;
      vertex.vy = (vertex.vy + (y - vertex.y) * stiffness * frames) * damping;
      vertex.x += vertex.vx * frames;
      vertex.y += vertex.vy * frames;
    }
  }

  #start() {
    if (this.#frame || this.#reducedMotion.matches || this.#window.document.hidden) return;
    this.#time = 0;
    const tick = time => {
      // Elapsed time in frames at 60 fps, limited after a pause
      const frames = this.#time ? Math.min((time - this.#time) / (1000 / 60), 3) : 1;
      this.#time = this.#now = time;
      this.#catch();
      this.#step(frames);
      this.#draw();
      this.#frame = this.#window.requestAnimationFrame(tick);
    };
    this.#frame = this.#window.requestAnimationFrame(tick);
  }

  #stop() {
    this.#window.cancelAnimationFrame(this.#frame);
    this.#frame = 0;
  }

  #draw() {
    const ctx = this.#ctx;
    ctx.clearRect(0, 0, this.#width, this.#height);
    for (const { vertices, color } of this.#triangles) {
      ctx.beginPath();
      vertices.forEach(({ x, y }, index) => ctx[index ? 'lineTo' : 'moveTo'](x, y));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.fill();
      ctx.stroke();
    }
  }
}

new LcsCnvs(window);
