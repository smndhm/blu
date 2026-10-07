/**
 * Decorative background of the home page: a ribbon of colored triangles that keeps renewing itself.
 * - Vertical along the right edge when it fits beside the text.
 * - Otherwise (narrow screens) horizontal along the top edge.
 * Its oldest triangles keep fading away while new ones appear at the same place: the number stays the same.
 * The pointer grows triangles around it when it comes close to a vertex, taken from the ribbon: playing with
 * it draws triangles out of the ribbon. When the pointer stops, they fade away and the ribbon grows back.
 * When the orientation changes (resize), the vertices glide from one ribbon to the other.
 * With reduced motion, the ribbon is drawn once and stays still.
 */

/**
 * Coordinates in the ribbon frame: `a` along the ribbon, `u` across, from its axis.
 * @typedef {{ a: number, u: number, phase: number, from?: number[] }} Vertex
 *   `from`: screen position when the orientation changed
 */
/** @typedef {{ vertices: Vertex[], color: string, born: number, dying?: number, fed?: boolean }} Triangle `fed`: grown by the pointer */

class LcsCnvs {
  #colors = ['#25CE7B', '#DA38B5', '#FDC741', '#01B3E3', '#FF6B01'];
  #neighbours = 30; // when the ribbon is built, a new triangle uses the two closest of the last vertices
  #renewal = 40000; // ms to renew as many triangles as the ribbon has
  #fade = 500; // ms for a triangle to appear or disappear
  #reach = 100; // the pointer grows triangles when it is this close to a vertex
  #around = 40; // vertices added by the pointer are this close to it
  #delay = 100; // ms between two triangles added by the pointer
  #idle = 1000; // ms without new triangle from the pointer before the ribbon grows back
  #regrowth = 120; // ms between two triangles going back to the ribbon
  #margin = 150; // the ribbon goes this far beyond the viewport
  #gap = 24; // min space between the text and the vertical ribbon
  #vertical = true;
  #morphDuration = 1200; // ms for the vertices to glide when the orientation changes
  #morphStart = 0;
  // The ribbon wanders around its axis, and its thickness varies, as a smoothed random walk
  #path = { offset: 0, drift: 0, thickness: 0, growth: 0 };
  /** @type {Vertex[]} All the vertices */
  #vertices = [];
  /** @type {Vertex[]} Last vertices of the ribbon, where it grows when the viewport gets longer */
  #tail = [];
  /** @type {{ offset: number, thickness: number }[]} Path of the ribbon, every `step` from `-margin` */
  #profile = [];
  /** @type {Triangle[]} Oldest first */
  #triangles = [];
  #size = 0; // number of triangles
  #renewed = 0; // time of the last renewed triangle
  /** @type {Vertex[][]} Vertices of the triangles the pointer took from the ribbon, to grow them back */
  #holes = [];
  #pointerMove = 0; // time of the last pointer move
  #maxTaken = 0.5; // share of the ribbon the pointer can take
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
          this.#pointerMove = this.#window.performance.now();
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
    this.#tail = [...this.#vertices].sort((a, b) => a.a - b.a).slice(-this.#neighbours);
    // New triangles follow a new path, in the new orientation
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

  // A random vertex of the ribbon around `a`
  #vertexAt(a) {
    const { offset, thickness } = this.#at(a);
    return { a: a + (Math.random() - 0.5) * thickness, u: offset + (Math.random() - 0.5) * 2 * thickness, phase: Math.random() * Math.PI * 2 };
  }

  // Adds a vertex, and a triangle with its two closest `candidates`
  #add(vertex, candidates, fed = false) {
    if (candidates.length >= 2) {
      const distance = other => (other.a - vertex.a) ** 2 + (other.u - vertex.u) ** 2;
      const [first, second] = [...candidates].sort((a, b) => distance(a) - distance(b));
      this.#triangles.push({ vertices: [vertex, first, second], color: this.#colors[Math.floor(Math.random() * this.#colors.length)], born: this.#clock, fed });
    }
    this.#vertices.push(vertex);
  }

  // Builds the ribbon from its end, until it covers the viewport
  #fill() {
    const { step } = this.#shape;
    const count = this.#triangles.length;
    for (let a = (this.#tail.at(-1)?.a ?? -this.#margin) + step; a < this.#length + this.#margin; a += step) {
      const vertex = this.#vertexAt(a);
      this.#add(vertex, this.#tail);
      this.#tail = [...this.#tail, vertex].slice(-this.#neighbours);
    }
    const added = this.#triangles.splice(count);
    // Already there (no fade in), in a random order of age: they will not all go away from the same end
    for (const triangle of added) triangle.born = -Infinity;
    for (let index = added.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [added[index], added[other]] = [added[other], added[index]];
    }
    this.#triangles.splice(0, 0, ...added);
    this.#size += added.length;
  }

  // Triangles not fading away, oldest first
  #alive(fed) {
    return this.#triangles.filter(triangle => !triangle.dying && !triangle.fed === !fed);
  }

  // A new triangle of the ribbon in place of a triangle that went away (its `vertices`): two of its vertices
  // and a new one close to the third, drawn a little toward the ribbon's path so that it stays in its zone
  #grow(vertices) {
    const kept = vertices.filter(vertex => this.#vertices.includes(vertex));
    if (kept.length < 3) return;
    const index = Math.floor(Math.random() * 3);
    const base = kept[index];
    const { step } = this.#shape;
    const path = this.#vertexAt(base.a);
    const vertex = {
      a: base.a + (Math.random() - 0.5) * step * 2,
      u: base.u + (Math.random() - 0.5) * step * 2 + (path.u - base.u) * 0.3,
      phase: Math.random() * Math.PI * 2,
    };
    this.#add(
      vertex,
      kept.filter((_, other) => other !== index),
    );
  }

  // Renews the ribbon: when the pointer is idle, the triangles it grew go away and the ribbon grows back
  // where they were taken; otherwise, now and then, the oldest triangle is replaced by a new one at its place
  #renew() {
    const fed = this.#alive(true);
    if (fed.length && this.#clock - this.#lastPointerVertex > this.#idle) {
      if (this.#clock - this.#renewed < this.#regrowth) return;
      fed[0].dying = this.#clock;
      if (this.#holes.length) this.#grow(this.#holes.shift());
    } else {
      if (this.#clock - this.#renewed < this.#renewal / Math.max(1, this.#size)) return;
      const [oldest] = this.#alive(false);
      if (!oldest) return;
      oldest.dying = this.#clock;
      this.#grow(oldest.vertices);
    }
    this.#renewed = this.#clock;
  }

  // Drops the triangles once faded away, and their vertices
  #clean() {
    const faded = this.#triangles.filter(triangle => triangle.dying && this.#clock - triangle.dying > this.#fade);
    if (!faded.length) return;
    this.#triangles = this.#triangles.filter(triangle => !faded.includes(triangle));
    // Vertices of the holes are kept, the ribbon grows back from them
    const used = new Set([...this.#triangles, { vertices: this.#holes.flat() }].flatMap(({ vertices }) => vertices));
    this.#vertices = this.#vertices.filter(vertex => used.has(vertex));
  }

  // A new triangle around the pointer when it is close to a vertex (of the ribbon or grown by the pointer),
  // taken from the ribbon: its oldest triangle fades away
  #feed() {
    // Only while the pointer moves, and as long as the ribbon keeps enough of its triangles
    if (!this.#pointer || this.#window.performance.now() - this.#pointerMove > this.#delay) return;
    if (this.#clock - this.#lastPointerVertex < this.#delay || this.#holes.length >= this.#size * this.#maxTaken) return;
    const { x, y } = this.#pointer;
    const pointer = this.#vertical ? { a: y, u: x - this.#axis } : { a: x, u: y - this.#axis };
    const candidates = [...new Set(this.#triangles.filter(triangle => !triangle.dying).flatMap(({ vertices }) => vertices))];
    if (!candidates.some(vertex => Math.hypot(vertex.a - pointer.a, vertex.u - pointer.u) < this.#reach)) return;
    const [taken] = this.#alive(false);
    if (!taken) return;

    // Uniform random point in a disc around the pointer
    const angle = Math.random() * Math.PI * 2;
    const radius = this.#around * Math.sqrt(Math.random());
    this.#add({ a: pointer.a + radius * Math.cos(angle), u: pointer.u + radius * Math.sin(angle), phase: Math.random() * Math.PI * 2 }, candidates, true);
    taken.dying = this.#clock;
    this.#holes.push(taken.vertices);
    this.#lastPointerVertex = this.#clock;
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
      // Animation time in ms, paused while the animation is
      this.#clock += this.#time ? Math.min(time - this.#time, 100) : 0;
      this.#time = time;
      this.#feed();
      this.#renew();
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
      const { vertices, color } = triangle;
      ctx.globalAlpha = this.#alpha(triangle);
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
