/**
 * Decorative background of the home page: a ribbon of colored triangles that slowly sways.
 * - Vertical along the right edge when it fits beside the text.
 * - Otherwise (narrow screens) horizontal along the bottom edge.
 * The pointer grows new triangles when it comes close to the ribbon, or to triangles it already grew:
 * playing with it draws branches beyond the ribbon, which fade away after a while.
 * When the orientation changes (resize), the ribbon turns around the bottom right corner.
 * With reduced motion, the ribbon is drawn once and stays still.
 */

/**
 * Coordinates in the ribbon frame: `a` along the ribbon, `u` across, from its axis.
 * @typedef {{ a: number, u: number, phase: number, born?: number, from?: number[] }} Vertex
 *   `born`: time it was added by the pointer, `from`: screen position when the orientation changed
 */
/** @typedef {{ vertices: Vertex[], color: string }} Triangle */

class LcsCnvs {
  #colors = ['#25CE7B', '#DA38B5', '#FDC741', '#01B3E3', '#FF6B01'];
  #neighbours = 30; // a new triangle of the ribbon uses the two closest of its last vertices
  #margin = 150; // the ribbon goes this far beyond the viewport
  #gap = 24; // min space between the text and the vertical ribbon
  // Sway: a slow wave travels along the ribbon, and each vertex floats around its position
  #wave = { amplitude: 14, length: 700, period: 14 }; // px, px, s
  #float = 6; // px
  // Pointer
  #reach = 90; // the pointer grows triangles when it is this close to a vertex
  #around = 35; // new vertices are this close to the pointer
  #delay = 100; // ms between two new vertices
  #life = 20000; // ms before a vertex added by the pointer fades away
  #fadeIn = 300; // ms
  #fadeOut = 2000; // ms, at the end of the life
  #maxFed = 150; // max vertices added by the pointer at the same time
  #morphDuration = 1200; // ms for the vertices to glide when the orientation changes
  #morphStart = 0;
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
  #lastPointerVertex = 0;
  #frame = 0;
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
        },
        { passive: true },
      ),
    );
    document.documentElement.addEventListener('mouseleave', () => (this.#pointer = undefined));
    window.addEventListener('touchend', () => (this.#pointer = undefined));
    // Pause when the tab is hidden or the user asks for reduced motion
    document.addEventListener('visibilitychange', () => (document.hidden ? this.#stop() : this.#start()));
    this.#reducedMotion.addEventListener('change', () => (this.#reducedMotion.matches ? this.#stop() : this.#start()));
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
      // Where the vertices are drawn now (in the new viewport, still in the previous orientation)
      const before = new Map(this.#vertices.map(vertex => [vertex, this.#point(vertex)]));
      this.#vertical = vertical;
      this.#morph(before, previous);
    }
    this.#fill();

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

  // Adds a vertex, and a triangle with its two closest `candidates`
  #add(vertex, candidates) {
    if (candidates.length >= 2) {
      const distance = other => (other.a - vertex.a) ** 2 + (other.u - vertex.u) ** 2;
      const [first, second] = [...candidates].sort((a, b) => distance(a) - distance(b));
      this.#triangles.push({ vertices: [vertex, first, second], color: this.#colors[Math.floor(Math.random() * this.#colors.length)] });
    }
    this.#vertices.push(vertex);
  }

  // Grows the ribbon until it covers the viewport
  #fill() {
    const { step } = this.#shape;
    for (let a = (this.#tail.at(-1)?.a ?? -this.#margin) + step; a < this.#length + this.#margin; a += step) {
      this.#walk();
      const { offset, thickness } = this.#path;
      const vertex = { a: a + (Math.random() - 0.5) * thickness, u: offset + (Math.random() - 0.5) * 2 * thickness, phase: Math.random() * Math.PI * 2 };
      this.#add(vertex, this.#tail);
      this.#tail = [...this.#tail, vertex].slice(-this.#neighbours);
    }
  }

  // Same ribbon in the new orientation, as if it turned around the bottom right corner: the bottom end of the
  // vertical ribbon becomes the right end of the horizontal one, and the other way around.
  // It is stretched along the viewport, thinner or thicker across. Each vertex glides from where it was drawn.
  #morph(before, previous) {
    const margin = this.#margin;
    const scaleAlong = (this.#length + 2 * margin) / (previous.length + 2 * margin);
    const scaleAcross = this.#shape.thickness[1] / previous.shape.thickness[1];
    const animate = !this.#reducedMotion.matches;
    for (const vertex of this.#vertices) {
      // Distance from the corner along the ribbon: both ribbons end there with their largest `a`
      vertex.a = this.#length + margin - (previous.length + margin - vertex.a) * scaleAlong;
      vertex.u *= scaleAcross;
      vertex.from = animate ? before.get(vertex) : undefined;
    }
    this.#tail = this.#vertices
      .filter(vertex => !vertex.born)
      .sort((a, b) => a.a - b.a)
      .slice(-this.#neighbours);
    this.#path.offset *= scaleAcross;
    this.#path.thickness *= scaleAcross;
    this.#morphStart = this.#now;
  }

  // Screen position of a vertex, with the sway
  #point(vertex) {
    const { a, u, phase, from } = vertex;
    const time = this.#now / 1000;
    const { amplitude, length, period } = this.#wave;
    const wave = amplitude * Math.sin((2 * Math.PI * a) / length - (2 * Math.PI * time) / period);
    const along = a + Math.cos(time * 0.3 + phase) * this.#float;
    const across = this.#axis + u + wave + Math.sin(time * 0.4 + phase) * this.#float;
    const point = this.#vertical ? [across, along] : [along, across];
    if (!from) return point;

    // Gliding after an orientation change (ease in out), turning around the bottom right corner
    const progress = Math.min(1, (this.#now - this.#morphStart) / this.#morphDuration);
    if (progress === 1) {
      delete vertex.from;
      return point;
    }
    const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
    const polar = ([x, y]) => [Math.hypot(x - this.#width, y - this.#height), Math.atan2(y - this.#height, x - this.#width)];
    const [startRadius, startAngle] = polar(from);
    const [endRadius, endAngle] = polar(point);
    const radius = startRadius + (endRadius - startRadius) * eased;
    // Shortest way around
    const turn = ((endAngle - startAngle + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
    const angle = startAngle + turn * eased;
    return [this.#width + radius * Math.cos(angle), this.#height + radius * Math.sin(angle)];
  }

  // Opacity of a vertex added by the pointer: fades in, then out at the end of its life
  #alpha({ born }) {
    if (!born) return 1;
    const age = this.#now - born;
    return Math.max(0, Math.min(1, age / this.#fadeIn, (this.#life - age) / this.#fadeOut));
  }

  // Adds a vertex around the pointer when it is close to a vertex (of the ribbon or added by the pointer)
  #feed() {
    if (!this.#pointer || this.#now - this.#lastPointerVertex < this.#delay) return;
    const { x, y } = this.#pointer;
    const pointer = this.#vertical ? { a: y, u: x - this.#axis } : { a: x, u: y - this.#axis };
    const distance = other => Math.hypot(other.a - pointer.a, other.u - pointer.u);
    // Not to vertices fading away
    const alive = vertex => !vertex.born || this.#now - vertex.born < this.#life - this.#fadeOut;
    if (!this.#vertices.some(vertex => alive(vertex) && distance(vertex) < this.#reach)) return;
    if (this.#vertices.filter(vertex => vertex.born).length >= this.#maxFed) return;

    // Uniform random point in a disc around the pointer
    const angle = Math.random() * Math.PI * 2;
    const radius = this.#around * Math.sqrt(Math.random());
    const vertex = { a: pointer.a + radius * Math.cos(angle), u: pointer.u + radius * Math.sin(angle), phase: Math.random() * Math.PI * 2, born: this.#now };
    this.#add(vertex, this.#vertices);
    this.#lastPointerVertex = this.#now;
  }

  // Drops the vertices added by the pointer at the end of their life, and their triangles
  #prune() {
    const expired = vertex => vertex.born && this.#now - vertex.born > this.#life;
    if (!this.#vertices.some(expired)) return;
    this.#triangles = this.#triangles.filter(({ vertices }) => !vertices.some(expired));
    this.#vertices = this.#vertices.filter(vertex => !expired(vertex));
  }

  #start() {
    if (this.#frame || this.#reducedMotion.matches || this.#window.document.hidden) return;
    const tick = time => {
      this.#now = time;
      this.#prune();
      this.#feed();
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
      ctx.globalAlpha = Math.min(...vertices.map(vertex => this.#alpha(vertex)));
      ctx.beginPath();
      vertices.forEach((vertex, index) => ctx[index ? 'lineTo' : 'moveTo'](...this.#point(vertex)));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.fill();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

new LcsCnvs(window);
