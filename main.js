"use strict";

function $(id) {
  return document.getElementById(id);
}
/**
 * @param {HTMLElement} parent
 * @param {string} name
 * @param {Object.<string, string>} attributes
 */
function create(parent, name, attributes = {}) {
  const node = document.createElement(name);
  parent.appendChild(node);
  for (const prop in attributes) {
    node.setAttribute(prop, attributes[prop]);
  }
  return node;
}

let DIM = 2;

/**
 * @typedef {Object} Gate
 * @property {number} nands
 * @property {(b: boolean[]) => boolean} eval
 */

 /** @extends {Gate} */
class Input {
  /** @param {number} i */
  constructor(i) {
    this.i = i;
  }

  nands = 0;

  /** @param {boolean[]} ins */
  eval(ins) {
    return ins[this.i];
  }

  toString() {
    return String.fromCharCode(this.i + 'A'.charCodeAt(0));
  }
}

 /** @extends {Gate} */
class Nand {
  /** 
   * @param {Gate} x 
   * @param {Gate} y */
  constructor(x, y) {
    this.x = x;
    this.y = y;

    this.nands = 1 + x.nands + y.nands;
  }

  /** @param {boolean[]} ins */
  eval(ins) {
    return !(this.x.eval(ins) && this.y.eval(ins));
  }

  toString() {
    return `(${this.x} # ${this.y})`;
  }
}

/** @param {Gate} g */
function table(g) {
  const w = 2 ** DIM;
  const table = Array(w).fill().map((_, i) => g.eval(Array(w).fill().map((_, j) => Boolean(i & (2**j)))));
  return table.map(Number).join('');
}

function find() {
  const toSearch = Array(DIM).fill().map((_, i) => new Input(i));
  toSearch.splice(DIM, 0, ...toSearch.map(g => new Nand(g, g)));
  
  /** @type {Map<string, Gate>} */
  const map = new Map();
  while (toSearch.length) {
    const [next] = toSearch.splice(0, 1);
    const t = table(next);
    if (map.has(t)) {
//       console.log("skipping " + next + " with " + t);
      continue;
    }
    console.log("using " + next + " with " + t);
    map.set(t, next);

    for (const x of map.values()) {
      toSearch.push(new Nand(x, next))
    }

    toSearch.sort((a, b) => a.nands - b.nands);
  }

  return map;
}

function draw() {
  const table = $("table");
  table.innerHTML = '';
  const top = create(table, "tr");
  for (let i = 0; i < DIM; ++i) {
    const th = create(top, "th");
    th.innerText = String.fromCharCode(i + 'A'.charCodeAt(0));
  }
  const topLeft = create(top, 'td');
  const less = create(topLeft, 'button');
  less.innerText = '-';
  const more = create(topLeft, 'button');
  more.innerText = '+';

  for (let r = 0; r < 2**DIM; ++r) {
    const tr = create(table, "tr");
    for (let i = 0; i < DIM; ++i) {
      const td = create(tr, "td");
      td.innerText = +Boolean(r & (2**i));
    }
    const th = create(tr, "th");
    const button = create(th, "button");
    button.innerText = "0";
  }
}

draw();
find();

// TODO wire up less more
// TODO draw puts the buttons backwards
// TODO pick find from the number of cells
