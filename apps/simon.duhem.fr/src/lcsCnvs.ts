interface vertex {
  x: number;
  y: number;
}

interface polygon {
  vertices: vertex[];
  color: string;
}

class LcsCnvs {
  #around = 50;
  #vertices: { limit: number; list: vertex[]; themes: { colors: string[] }[] } = {
    limit: 50,
    list: [],
    themes: [
      { colors: ['#25CE7B', '#DA38B5', '#FDC741', '#01B3E3', '#FF6B01'] },
      {
        colors: ['#f72585', '#b5179e', '#7209b7', '#560bad', '#480ca8', '#3a0ca3', '#3f37c9', '#4361ee', '#4895ef', '#4cc9f0'],
      },
    ],
  };
  #polygons: polygon[] = [];
  #window: Window;
  #canvas: HTMLCanvasElement;
  #document: Document;
  #ctx: CanvasRenderingContext2D;
  #notHover: DOMRect | undefined;

  constructor(window: Window) {
    this.#window = window;

    this.#window.onresize = () => {
      this.#canvas.width = this.#window.innerWidth;
      this.#canvas.height = this.#window.innerHeight;
    };

    let interval: ReturnType<typeof setInterval>;

    ['mousemove', 'touchmove'].forEach(eventType => {
      this.#window.addEventListener(
        eventType,
        event => {
          clearInterval(interval);
          const vertex = {
            x: (event as MouseEvent).pageX || ((event as TouchEvent).touches && (event as TouchEvent).touches[0].pageX) || 0,
            y: (event as MouseEvent).pageY || ((event as TouchEvent).touches && (event as TouchEvent).touches[0].pageY) || 0,
          };
          this.addVertex(vertex);
          interval = setInterval(() => {
            this.addVertex(vertex);
          }, 10);
        },
        false,
      );
    });

    this.#document = this.#window.document;

    this.#document.querySelectorAll('nav a').forEach(el => {
      el.addEventListener('mouseover', ({ target }) => {
        this.#notHover = (target as HTMLElement).getBoundingClientRect();
      });
      el.addEventListener('mouseleave', () => {
        this.#notHover = undefined;
      });
    });

    this.#canvas = this.#document.createElement('canvas');
    this.#canvas.width = this.#window.innerWidth;
    this.#canvas.height = this.#window.innerHeight;
    this.#canvas.id = 'lcs-cnvs';

    this.#ctx = this.#canvas.getContext('2d') as CanvasRenderingContext2D;

    this.#document.addEventListener('DOMContentLoaded', () => {
      this.#document.body.append(this.#canvas);
    });
  }

  /**
   *
   * @param {*} min
   * @param {*} max
   */
  getRandomNumberBetween = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  /**
   *
   * @param {*} vertexA
   * @param {*} vertexB
   */
  getVerticesDistance = (vertexA: vertex, vertexB: vertex): number => {
    return Math.sqrt(Math.pow(vertexA.x - vertexB.x, 2) + Math.pow(vertexA.y - vertexB.y, 2));
  };

  isHover = (vertex: vertex): boolean => {
    return (
      this.#notHover !== undefined &&
      vertex.x > this.#notHover.x &&
      vertex.x < this.#notHover.x + this.#notHover.width &&
      vertex.y > this.#notHover.y &&
      vertex.y < this.#notHover.y + this.#notHover.height
    );
  };

  /**
   *
   * @param {*} area
   */
  getRandomVertex = (position: vertex, distance: number): vertex => {
    let vertex: vertex;
    do {
      vertex = {
        x: this.getRandomNumberBetween(position.x - distance, position.x + distance),
        y: this.getRandomNumberBetween(position.y - distance, position.y + distance),
      };
    } while (this.getVerticesDistance(position, vertex) > distance || this.isHover(vertex));
    return vertex;
  };

  /**
   *
   * @param {*} vertices
   * @param {*} vertex
   * @param {*} count
   */
  getClosestVertices = (vertices: vertex[], vertex: vertex, count: number): vertex[] => {
    return vertices
      .sort((a: vertex, b: vertex) => {
        return this.getVerticesDistance(a, vertex) - this.getVerticesDistance(b, vertex);
      })
      .slice(0, count);
  };

  /**
   *
   * @param {*} array
   */
  getRandomArrayValue = (array: unknown[]) => {
    return array[Math.floor(Math.random() * array.length)];
  };

  /**
   *
   * @param {*} position
   */
  addVertex = (position: vertex) => {
    const vertex = this.getRandomVertex(
      {
        x: position.x,
        y: position.y,
      },
      this.#around,
    );

    if (this.#vertices.list.length >= 2) {
      const closestVertices = this.getClosestVertices([...this.#vertices.list], vertex, 2);
      this.#polygons.push({
        vertices: [vertex].concat(closestVertices),
        color: this.getRandomArrayValue(this.#vertices.themes[0].colors) as string,
      });
    }

    this.#vertices.list.push(vertex);
    this.#vertices.list = this.#vertices.list.slice(-this.#vertices.limit);

    this.#polygons = this.#polygons.filter((polygon: polygon) =>
      polygon.vertices.some((pVertex: vertex) => this.#vertices.list.some((vVertex: vertex) => pVertex.x === vVertex.x && pVertex.y === vVertex.y)),
    );

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

export default LcsCnvs;
