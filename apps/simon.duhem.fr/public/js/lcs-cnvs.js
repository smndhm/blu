/**
 * Decorative background of the home page: a ribbon of colored triangles, drawn like the original animation:
 * each new vertex makes a triangle with its two closest vertices, and the oldest ones go away.
 * - An invisible pen goes slowly along the ribbon's path and keeps drawing it again: it starts over from the
 *   other end, out of the viewport, and the oldest vertices it removes are just ahead of it.
 * - When the pointer moves close to the ribbon, it takes the pen: new vertices are added around it, and the
 *   ribbon loses as many in its zone. When the pointer stops, the pen draws the ribbon again where it was, and
 *   each vertex it adds removes one of the pointer's.
 * The ribbon is vertical along the right edge when it fits beside the text, else horizontal along the top edge.
 * When the orientation changes (resize), the vertices glide from one ribbon to the other.
 * With reduced motion, the ribbon is drawn once and stays still.
 */

/**
 * Coordinates in the ribbon frame: `a` along the ribbon, `u` across, from its axis.
 * @typedef {{ a: number, u: number, phase: number, from?: number[], fed?: boolean }} Vertex
 *   `from`: screen position when the orientation changed, `fed`: added around the pointer
 */
/** @typedef {{ vertices: Vertex[], color: string, born: number, dying?: number, fed?: boolean }} Triangle */

class LcsCnvs {
  #colors = ['#25CE7B', '#DA38B5', '#FDC741', '#01B3E3', '#FF6B01'];
  #pace = 40; // px per second of the pen along the ribbon
  #catchUp = 4; // the pen goes this much faster while there are vertices added around the pointer
  #reach = 100; // the pointer takes the pen when it moves this close to a vertex
  #around = 40; // vertices added by the pointer are this close to it
  #delay = 50; // ms between two vertices added by the pointer
  #idle = 800; // ms without moving before the pointer gives the pen back
  #fade = 400; // ms for a triangle to appear or disappear
  #margin = 150; // the ribbon goes this far beyond the viewport
  #gap = 24; // min space between the text and the vertical ribbon
  #vertical = true;
  #morphDuration = 1200; // ms for the vertices to glide when the orientation changes
  #morphStart = 0;
  // The ribbon wanders around its axis, and its thickness varies, as a smoothed random walk
  #path = { offset: 0, drift: 0, thickness: 0, growth: 0 };
  /** @type {{ offset: number, thickness: number }[]} Path of the ribbon, every `step` from `-margin` */
  #profile = [];
  // The pen: where it is along the ribbon
  #pen = { a: 0, travelled: 0 };
  /** @type {Vertex[]} Oldest first */
  #vertices = [];
  /** @type {Triangle[]} Oldest first */
  #triangles = [];
  /** @type {{ x: number, y: number } | undefined} */
  #pointer;
  #pointerMove = 0;
  #lastPointerVertex = 0;
  #frame = 0;
  #time = 0;
  #clock = 0; // animation time in ms, paused with the animation
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
          this.#pointerMove = this.#clock;
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

  // Number of vertices of the ribbon: one every `step` along it
  get #size() {
    return Math.ceil((this.#length + 2 * this.#margin) / this.#shape.step);
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

    // Vertical when the ribbon (its usual width) stays beside the text, else horizontal
    const text = this.#text?.getBoundingClientRect();
    const usualHalfWidth = Math.min(130, this.#width * 0.1) * 0.5 + 60;
    const vertical = !text || this.#axisFor(true) - usualHalfWidth > text.right + this.#gap;
    if (!this.#vertices.length) {
      this.#vertical = vertical;
      this.#draft();
    } else if (vertical !== this.#vertical) {
      // Where the vertices are drawn now (in the new viewport, still in the previous orientation)
      const before = new Map(this.#vertices.map(vertex => [vertex, this.#point(vertex)]));
      this.#vertical = vertical;
      this.#morph(before, previous);
    }

    // Fainter when the horizontal ribbon can be over the text (short viewports), so it stays readable
    const overlaps = !this.#vertical && text && this.#axis + this.#shape.amplitude + this.#shape.thickness[1] > text.top;
    this.#canvas.style.opacity = overlaps ? '0.35' : '0.6';
  }

  // A new path, and the whole ribbon drawn at once by the pen, from one end to the other
  #draft() {
    this.#path = { offset: 0, drift: 0, thickness: this.#shape.thickness[1] * 0.6, growth: 0 };
    this.#profile = [];
    this.#pen = { a: -this.#margin, travelled: 0 };
    this.#advance(this.#size * this.#shape.step, -Infinity);
  }

  // Same ribbon in the new orientation, as if it turned around the top right corner: the end of the
  // vertical ribbon at the top becomes the right end of the horizontal one, and the other way around.
  // It is stretched along the viewport, thinner or thicker across. Each vertex glides from where it was drawn.
  #morph(before, previous) {
    const margin = this.#margin;
    const scaleAlong = (this.#length + 2 * margin) / (previous.length + 2 * margin);
    const scaleAcross = this.#shape.thickness[1] / previous.shape.thickness[1];
    const animate = !this.#reducedMotion.matches;
    const turn = a => {
      // Distance from the corner along the ribbon
      const distance = (this.#vertical ? previous.length + margin - a : a + margin) * scaleAlong;
      return this.#vertical ? distance - margin : this.#length + margin - distance;
    };
    for (const vertex of this.#vertices) {
      vertex.a = turn(vertex.a);
      vertex.u *= scaleAcross;
      vertex.from = animate ? before.get(vertex) : undefined;
    }
    // The pen goes on along a new path, in the new orientation
    this.#pen = { a: turn(this.#pen.a), travelled: 0 };
    this.#path = { offset: 0, drift: 0, thickness: this.#shape.thickness[1] * 0.6, growth: 0 };
    this.#profile = [];
    this.#morphStart = this.#clock;
  }

  // Screen position of a vertex; each vertex also floats a few pixels around its position
  #point(vertex) {
    const { a, u, phase, from } = vertex;
    const time = this.#clock / 1000;
    const along = a + Math.cos(time * 0.3 + phase) * 4;
    const across = this.#axis + u + Math.sin(time * 0.4 + phase) * 4;
    const point = this.#vertical ? [across, along] : [along, across];
    if (!from) return point;

    // Gliding after an orientation change (ease in out), turning around the top right corner
    const progress = Math.min(1, (this.#clock - this.#morphStart) / this.#morphDuration);
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

  // Path of the ribbon at `a`, extended as needed
  #at(a) {
    const index = Math.max(0, Math.round((a + this.#margin) / this.#shape.step));
    while (this.#profile.length <= index) {
      this.#walk();
      this.#profile.push({ offset: this.#path.offset, thickness: this.#path.thickness });
    }
    return this.#profile[index];
  }

  // Adds a vertex and its triangle with the two closest vertices; the oldest go away to keep the size,
  // the pointer's first when the pen draws the ribbon
  #add(vertex, born = this.#clock) {
    if (this.#vertices.length >= 2) {
      const distance = other => (other.a - vertex.a) ** 2 + (other.u - vertex.u) ** 2;
      const [first, second] = [...this.#vertices].sort((a, b) => distance(a) - distance(b));
      this.#triangles.push({ vertices: [vertex, first, second], color: this.#colors[Math.floor(Math.random() * this.#colors.length)], born, fed: vertex.fed });
    }
    this.#vertices.push(vertex);
    while (this.#vertices.length > this.#size) {
      const index = vertex.fed
        ? 0
        : Math.max(
            0,
            this.#vertices.findIndex(other => other.fed),
          );
      this.#vertices.splice(index, 1);
    }
    const living = this.#triangles.filter(triangle => !triangle.dying);
    const excess = living.length - this.#size;
    if (excess <= 0) return;
    const fed = vertex.fed ? [] : living.filter(triangle => triangle.fed);
    for (const triangle of [...fed, ...living.filter(triangle => !triangle.fed)].slice(0, excess)) triangle.dying = this.#clock;
  }

  // Moves the pen along the ribbon, adding a vertex around it every `step`; past the end, it starts over
  #advance(distance, born) {
    const pen = this.#pen;
    const { step } = this.#shape;
    const end = this.#length + this.#margin;
    pen.travelled += distance;
    while (pen.travelled >= step) {
      pen.travelled -= step;
      pen.a += step;
      if (pen.a > end) pen.a -= end + this.#margin;
      const { offset, thickness } = this.#at(pen.a);
      this.#add({ a: pen.a + (Math.random() - 0.5) * thickness, u: offset + (Math.random() - 0.5) * 2 * thickness, phase: Math.random() * Math.PI * 2 }, born);
    }
  }

  // Where the pointer is, in the ribbon frame, when it has the pen: while it moves close to a vertex
  get #pointerHasPen() {
    if (!this.#pointer || this.#clock - this.#pointerMove > this.#idle) return false;
    const { x, y } = this.#pointer;
    const pointer = this.#vertical ? { a: y, u: x - this.#axis } : { a: x, u: y - this.#axis };
    return this.#vertices.some(vertex => Math.hypot(vertex.a - pointer.a, vertex.u - pointer.u) < this.#reach) ? pointer : false;
  }

  // Draws: around the pointer when it has the pen, else along the ribbon
  #write(elapsed) {
    const pointer = this.#pointerHasPen;
    if (pointer) {
      if (this.#clock - this.#lastPointerVertex < this.#delay) return;
      // Uniform random point in a disc around the pointer
      const angle = Math.random() * Math.PI * 2;
      const radius = this.#around * Math.sqrt(Math.random());
      this.#add({ a: pointer.a + radius * Math.cos(angle), u: pointer.u + radius * Math.sin(angle), phase: Math.random() * Math.PI * 2, fed: true });
      this.#lastPointerVertex = this.#clock;
      return;
    }
    // Faster while what the pointer drew is still there
    const catchUp = this.#vertices.some(vertex => vertex.fed) ? this.#catchUp : 1;
    this.#advance((elapsed / 1000) * this.#pace * catchUp);
  }

  // Drops the triangles once faded away
  #clean() {
    if (!this.#triangles.some(triangle => triangle.dying && this.#clock - triangle.dying > this.#fade)) return;
    this.#triangles = this.#triangles.filter(triangle => !triangle.dying || this.#clock - triangle.dying <= this.#fade);
  }

  // Opacity of a triangle, while appearing or disappearing
  #alpha({ born, dying }) {
    const appear = Math.min(1, (this.#clock - born) / this.#fade);
    return dying ? Math.min(appear, Math.max(0, 1 - (this.#clock - dying) / this.#fade)) : appear;
  }

  #start() {
    if (this.#frame || this.#reducedMotion.matches || this.#window.document.hidden) return;
    this.#time = 0;
    const tick = time => {
      const elapsed = this.#time ? Math.min(time - this.#time, 100) : 0;
      this.#time = time;
      this.#clock += elapsed;
      this.#write(elapsed);
      this.#clean();
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
    for (const triangle of this.#triangles) {
      ctx.globalAlpha = this.#alpha(triangle);
      ctx.beginPath();
      triangle.vertices.forEach((vertex, index) => ctx[index ? 'lineTo' : 'moveTo'](...this.#point(vertex)));
      ctx.closePath();
      ctx.fillStyle = triangle.color;
      ctx.strokeStyle = triangle.color;
      ctx.fill();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

new LcsCnvs(window);
