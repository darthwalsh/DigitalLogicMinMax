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

function A(i) {
  return String.fromCharCode(i + 'A'.charCodeAt(0))
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
    return A(this.i);
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
  const rows = Array(w).fill().map((_, i) => g.eval(
    Array(DIM).fill().map((_, j) => Boolean(i & (2**j))).reverse()
  ));
  return rows.map(Number).join('');
}

function find() {
  const toSearch = Array(DIM).fill().map((_, i) => new Input(i));
  const inputs = toSearch.slice();

  toSearch.splice(DIM, 0, ...toSearch.map(g => new Nand(g, g)));
  
  /** @type {Map<string, Gate>} */
  const map = new Map();
  while (toSearch.length) {
    const [next] = toSearch.splice(0, 1);
    const t = table(next);
    if (map.has(t)) continue;
    map.set(t, next);

    for (const x of map.values()) {
      toSearch.push(new Nand(x, next))
    }

    toSearch.sort((a, b) => a.nands - b.nands);
  }

  return [inputs, map];
}

function draw() {
  const table = $("table");
  table.innerHTML = '';
  const top = create(table, "tr");
  for (let i = 0; i < DIM; ++i) {
    const th = create(top, "th");
    th.innerText = A(i);
  }
  const topLeft = create(top, 'td');
  const less = create(topLeft, 'button');
  less.innerText = '-';
  less.onclick = () => {
    if(DIM) --DIM;
    draw();
  };
  const more = create(topLeft, 'button');
  more.innerText = '+';
  more.onclick = () => {
    ++DIM;
    draw();
  };

  for (let r = 0; r < 2**DIM; ++r) {
    const tr = create(table, "tr");
    for (let i = DIM - 1; i >= 0; --i) {
      const td = create(tr, "td");
      td.innerText = +Boolean(r & (2**i));
    }
    const th = create(tr, "th");
    const b = create(th, "button");
    b.innerText = "0";
    b.onclick = () => {
      b.innerText = 1 - b.innerText;
      code(...findResults);
    }
  }

  const findResults = find();
  code(...findResults);
}

/** 
 * @param {Input[]} inputs 
 * @param {Map<string, Gate>} findMap 
 */
function code(inputs, findMap) {
  const lookup = [...$("table").querySelectorAll('BUTTON')].slice(2).map(e => e.innerText).join('');
  const gate = findMap.get(lookup);

  /** @type {Map<Gate, string>} */
  const names = new Map(inputs.map(g => [g, g.toString()]));
  giveNames(names, gate);

  const rows = [gate.toString()];
  rows.push('');
  rows.push('DEF GATE');

  for (const [g, net] of names.entries()) {
    if (g instanceof Input) {
      rows.push(`  PORT IN ${net}`);
    }
    else if (g === gate) {
      rows.push(`  PORT OUT ${net}`);
    } else {
      rows.push(`  NET ${net}`);
    }
  }

  let i = 0;
  for (const [g, net] of names.entries()) {
    if (g instanceof Input) continue;
    rows.push(`  INST NAND${i++} NAND ${names.get(g.x)} ${names.get(g.y)} ${net}`);
  }

  rows.push('ENDDEF');
  $('output').innerText = rows.join('\n');
}

/**
 * @param {Map<Gate, string>} names 
 * @param {Gate} gate 
 */
function giveNames(names, gate) {
  if (names.has(gate)) return;
  giveNames(names, gate.x);
  giveNames(names, gate.y);
  names.set(gate, A(names.size));
}

draw();

