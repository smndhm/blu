/**
 * Decorative background of the home page: a ribbon of colored triangles, slowly moving.
 * - Vertical along the right edge, rising, when it fits beside the text.
 * - Otherwise (narrow screens) horizontal along the top edge, moving to the left.
 * When the pointer comes close to the ribbon, new triangles grow around it.
 * When the orientation changes (resize), the vertices glide from one ribbon to the other.
 * With reduced motion, the ribbon is drawn once and stays still.
 */

/**
 * Coordinates in the ribbon frame: `a` along the ribbon (decreases as it moves), `u` across, from its axis.
 * @typedef {{ a: number, u: number, phase: number, fed?: boolean, from?: number[] }} Vertex
 *   `fed`: added by the pointer, `from`: screen position when the orientation changed
 */
/** @typedef {{ vertices: Vertex[], color: string }} Triangle */

class LcsCnvs {
  #colors = ['#25CE7B', '#DA38B5', '#FDC741', '#01B3E3', '#FF6B01'];
  #speed = 8; // px per second
  #neighbours = 30; // a new triangle of the ribbon uses the two closest of its last vertices
  #reach = 120; // the pointer feeds the ribbon when it is this close to one of its vertices
  #around = 40; // vertices added by the pointer are this close to it
  #delay = 120; // ms between two vertices added by the pointer
  #maxFed = 80; // max vertices added by the pointer at the same time, they leave with the ribbon
  #margin = 150; // vertices are created and removed out of the viewport
  #gap = 24; // min space between the text and the vertical ribbon
  #vertical = true;
  #morphDuration = 1200; // ms for the vertices to glide when the orientation changes
  #morphStart = 0;
  // The ribbon wanders around its axis, and its thickness varies, as a smoothed random walk
  #path = { offset: 0, drift: 0, thickness: 0, growth: 0 };
  /** @type {Vertex[]} All the vertices */
  #vertices = [];
  /** @type {Vertex[]} Last vertices of the ribbon, where it keeps growing */
  #tail = [];
  /** @type {Triangle[]} */
  #triangles = [];
  /** @type {{ x: number, y: number } | undefined} */
  #pointer;
  #lastPointerVertex = 0;
  #frame = 0;
  #time = 0;
  #clock = 0;
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

  // Position of the axis across the viewport: close to the right edge, or to the top edge
  #axisFor(vertical) {
    return vertical ? this.#width - Math.min(170, this.#width * 0.13) : Math.min(100, this.#height * 0.12);
  }

  get #axis() {
    return this.#axisFor(this.#vertical);
  }

  // Length of the viewport along the ribbon
  get #length() {
    return this.#vertical ? this.#height : this.#width;
  }

  #resize() {
    const previous = { length: this.#length, shape: this.#shape };

    const ratio = this.#window.devicePixelRatio || 1;
    // Without the scrollbar gutter (`scrollbar-gutter: stable`), like the fixed canvas
    const { clientWidth, clientHeight } = this.#window.document.documentElement;
    this.#width = clientWidth;
    this.#height = clientHeight;
    this.#canvas.width = this.#width * ratio;
    this.#canvas.height = this.#height * ratio;
    this.#ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    // Vertical when the ribbon (its usual width) stays beside the text, else horizontal: start again
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

    // Fainter when the horizontal ribbon can be over the text (short viewports), so it stays readable
    const overlaps = !this.#vertical && text && this.#axis + this.#shape.amplitude + this.#shape.thickness[1] > text.top;
    this.#canvas.style.opacity = overlaps ? '0.35' : '0.6';
  }

  // Same ribbon in the new orientation, as if it turned around the top right corner: the end of the
  // vertical ribbon at the top becomes the right end of the horizontal one, and the other way around.
  // It is stretched along the viewport, thinner or thicker across. Each vertex glides from where it was drawn.
  #morph(before, previous) {
    const margin = this.#margin;
    const scaleAlong = (this.#length + 2 * margin) / (previous.length + 2 * margin);
    const scaleAcross = this.#shape.thickness[1] / previous.shape.thickness[1];
    const animate = !this.#reducedMotion.matches;
    for (const vertex of this.#vertices) {
      // Distance from the corner along the ribbon
      const distance = (this.#vertical ? previous.length + margin - vertex.a : vertex.a + margin) * scaleAlong;
      vertex.a = this.#vertical ? distance - margin : this.#length + margin - distance;
      vertex.u *= scaleAcross;
      vertex.from = animate ? before.get(vertex) : undefined;
    }
    // The ribbon keeps growing at its far end (largest `a`)
    this.#tail = this.#vertices
      .filter(vertex => !vertex.fed)
      .sort((a, b) => a.a - b.a)
      .slice(-this.#neighbours);
    this.#path.offset *= scaleAcross;
    this.#path.thickness *= scaleAcross;
    this.#morphStart = this.#window.performance.now();
  }

  // Screen position of a vertex; each vertex also floats a few pixels around its position
  #point(vertex) {
    const { a, u, phase, from } = vertex;
    const along = a + Math.cos(this.#clock * 0.3 + phase) * 4;
    const across = this.#axis + u + Math.sin(this.#clock * 0.4 + phase) * 4;
    const point = this.#vertical ? [across, along] : [along, across];
    if (!from) return point;

    // Gliding after an orientation change (ease in out), turning around the top right corner
    const progress = Math.min(1, (this.#window.performance.now() - this.#morphStart) / this.#morphDuration);
    if (progress === 1) {
      delete vertex.from;
      return point;
    }
    const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
    const polar = ([x, y]) => [Math.hypot(x - this.#width, y), Math.atan2(y, x - this.#width)];
    const [startRadius, startAngle] = polar(from);
    const [endRadius, endAngle] = polar(point);
    const radius = startRadius + (endRadius - startRadius) * eased;
    // Shortest way around
    const turn = ((endAngle - startAngle + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
    const angle = startAngle + turn * eased;
    return [this.#width + radius * Math.cos(angle), radius * Math.sin(angle)];
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

  // Grows the ribbon at its end, until out of the viewport
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

  // Adds a vertex around the pointer when it is close to the ribbon
  #feed(time) {
    if (!this.#pointer || time - this.#lastPointerVertex < this.#delay) return;
    const { x, y } = this.#pointer;
    const pointer = this.#vertical ? { a: y, u: x - this.#axis } : { a: x, u: y - this.#axis };
    const distance = other => Math.hypot(other.a - pointer.a, other.u - pointer.u);
    // Close to the ribbon itself (not to what the pointer added: no endless trail over the text)
    if (!this.#vertices.some(vertex => !vertex.fed && distance(vertex) < this.#reach)) return;
    if (this.#vertices.filter(vertex => vertex.fed).length >= this.#maxFed) return;

    // Uniform random point in a disc around the pointer
    const angle = Math.random() * Math.PI * 2;
    const radius = this.#around * Math.sqrt(Math.random());
    const vertex = { a: pointer.a + radius * Math.cos(angle), u: pointer.u + radius * Math.sin(angle), phase: Math.random() * Math.PI * 2, fed: true };
    this.#add(vertex, this.#vertices);
    this.#lastPointerVertex = time;
  }

  #start() {
    if (this.#frame || this.#reducedMotion.matches || this.#window.document.hidden) return;
    this.#time = 0;
    const tick = time => {
      const elapsed = this.#time ? Math.min((time - this.#time) / 1000, 0.1) : 0;
      this.#time = time;
      this.#clock += elapsed;
      this.#move(elapsed * this.#speed);
      this.#feed(time);
      this.#draw();
      this.#frame = this.#window.requestAnimationFrame(tick);
    };
    this.#frame = this.#window.requestAnimationFrame(tick);
  }

  #stop() {
    this.#window.cancelAnimationFrame(this.#frame);
    this.#frame = 0;
  }

  // Moves everything along the ribbon, drops what left the viewport, grows the ribbon at its end
  #move(distance) {
    for (const vertex of this.#vertices) vertex.a -= distance;
    const start = -this.#margin;
    this.#triangles = this.#triangles.filter(({ vertices }) => vertices.some(vertex => vertex.a > start));
    const used = new Set(this.#triangles.flatMap(({ vertices }) => vertices));
    this.#vertices = this.#vertices.filter(vertex => vertex.a > start || used.has(vertex));
    this.#fill();
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
