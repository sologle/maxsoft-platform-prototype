import { drawHalo, TAU, type DrawScene } from "./scene-types";

const NODE_SPACING = 145;
const MAX_VISIBLE_NODES = 180;
const PULSE_SPEED = 340;
const PULSE_REACH = 620;
const PULSE_INTERVAL = 1.35;
const MAX_PULSES = 3;

export const createSignal = (width: number, height: number): DrawScene => {
  const spacing = Math.max(NODE_SPACING, Math.sqrt(width * height / MAX_VISIBLE_NODES));
  const columns = Math.ceil(width / spacing) + 1;
  const rows = Math.ceil(height / spacing) + 1;
  const nodes = Array.from({ length: columns * rows }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return { x: column * spacing + (row % 2) * 38 - 15, y: row * spacing + Math.sin(column * 1.7) * 23 + 35 };
  });
  const edges = nodes.flatMap((node, index) => {
    const neighbors: number[] = [];
    if (index % columns < columns - 1) neighbors.push(index + 1);
    if (index + columns < nodes.length) neighbors.push(index + columns);
    if (index % 3 === 0 && index % columns < columns - 1 && index + columns + 1 < nodes.length) neighbors.push(index + columns + 1);
    return neighbors.map((to) => ({ from: index, to, length: Math.hypot(nodes[to].x - node.x, nodes[to].y - node.y) }));
  });
  const routes = (source: number) => {
    const distances = nodes.map(() => Infinity);
    const visited = new Set<number>();
    distances[source] = 0;
    while (visited.size < nodes.length) {
      let closest = -1;
      let shortest = Infinity;
      for (let index = 0; index < nodes.length; index++) {
        if (!visited.has(index) && distances[index] < shortest) {
          shortest = distances[index];
          closest = index;
        }
      }
      if (closest < 0 || shortest > PULSE_REACH) break;
      visited.add(closest);
      for (const edge of edges) {
        const next = edge.from === closest ? edge.to : edge.to === closest ? edge.from : -1;
        if (next >= 0) distances[next] = Math.min(distances[next], shortest + edge.length);
      }
    }
    return distances;
  };
  let pulses: { started: number; distances: number[] }[] = [];
  let source = -1;
  let lastPulse = -PULSE_INTERVAL;

  return ({ context, pointer, time, dark, motion }) => {
    const ink = dark ? "101,192,239" : "21,113,170";
    const active = motion && pointer.active;
    let nearest = -1;
    let distance = Infinity;
    if (active) {
      for (let index = 0; index < nodes.length; index++) {
        const candidate = Math.hypot(nodes[index].x - pointer.x, nodes[index].y - pointer.y);
        if (candidate < distance) { nearest = index; distance = candidate; }
      }
      if ((source !== nearest && time - lastPulse > 0.18) || time - lastPulse > PULSE_INTERVAL) {
        source = nearest;
        lastPulse = time;
        pulses.push({ started: time, distances: routes(source) });
        if (pulses.length > MAX_PULSES) pulses.shift();
      }
      drawHalo(context, pointer.x, pointer.y, 175, ink, dark ? 0.14 : 0.08);
    }
    if (!motion) { pulses = []; source = -1; lastPulse = -PULSE_INTERVAL; }
    pulses = pulses.filter((pulse) => (time - pulse.started) * PULSE_SPEED < PULSE_REACH);
    context.lineWidth = 0.8;
    context.strokeStyle = `rgba(${ink},${dark ? 0.18 : 0.14})`;
    context.beginPath();
    for (const edge of edges) {
      context.moveTo(nodes[edge.from].x, nodes[edge.from].y);
      context.lineTo(nodes[edge.to].x, nodes[edge.to].y);
    }
    context.stroke();
    for (const pulse of pulses) {
      const travelled = (time - pulse.started) * PULSE_SPEED;
      const opacity = (1 - travelled / PULSE_REACH) * 0.9;
      for (const edge of edges) {
        const first = pulse.distances[edge.from] <= pulse.distances[edge.to] ? edge.from : edge.to;
        const last = first === edge.from ? edge.to : edge.from;
        const progress = (travelled - pulse.distances[first]) / edge.length;
        if (progress < 0 || progress > 1) continue;
        const start = nodes[first];
        const end = nodes[last];
        const x = start.x + (end.x - start.x) * progress;
        const y = start.y + (end.y - start.y) * progress;
        context.strokeStyle = `rgba(${ink},${opacity * 0.8})`;
        context.lineWidth = 2;
        context.beginPath();
        const tail = Math.max(0, progress - 0.26);
        context.moveTo(start.x + (end.x - start.x) * tail, start.y + (end.y - start.y) * tail);
        context.lineTo(x, y);
        context.stroke();
        context.fillStyle = `rgba(${ink},${opacity})`;
        context.beginPath();
        context.arc(x, y, 2.4, 0, TAU);
        context.fill();
      }
    }
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index];
      const energy = pulses.reduce((max, pulse) => {
        const age = time - pulse.started - pulse.distances[index] / PULSE_SPEED;
        return age >= 0 && age < 0.55 ? Math.max(max, 1 - age / 0.55) : max;
      }, 0);
      context.fillStyle = `rgba(${ink},${(dark ? 0.32 : 0.24) + energy * 0.65})`;
      context.beginPath();
      context.arc(node.x, node.y, 2.1 + energy * 1.8, 0, TAU);
      context.fill();
      if (energy > 0) {
        context.strokeStyle = `rgba(${ink},${energy * 0.4})`;
        context.lineWidth = 1;
        context.beginPath();
        context.arc(node.x, node.y, 6 + (1 - energy) * 14, 0, TAU);
        context.stroke();
      }
    }
    if (active && nearest >= 0) {
      context.strokeStyle = `rgba(${ink},.36)`;
      context.lineWidth = 1;
      context.setLineDash([2, 5]);
      context.beginPath();
      context.moveTo(pointer.x, pointer.y);
      context.lineTo(nodes[nearest].x, nodes[nearest].y);
      context.stroke();
      context.setLineDash([]);
    }
  };
};
