/**
 * Motion kit: the tiny runtime every help motion scene runs on.
 *
 * A scene file calls `kit.scene(id, { init, render })` and may use only what
 * `createKit` returns. Copy this file into a project that has no kit yet, or
 * keep the project's own port (e.g. a TypeScript `kit.ts`) in step with it.
 * The scripts render with the project's kit when the config names one, and
 * fall back to this file otherwise.
 */

/** Position of `time` between `start` and `end`, clamped to 0..1. */
export const seg = (time, start, end) =>
  end === start
    ? time >= end
      ? 1
      : 0
    : Math.min(1, Math.max(0, (time - start) / (end - start)));
export const lerp = (from, to, progress) => from + (to - from) * progress;
/** Ease out (cubic). */
export const eo = (progress) => 1 - Math.pow(1 - progress, 3);
/** Ease in (cubic). */
export const ei = (progress) => progress * progress * progress;
/** Ease in-out (cubic). */
export const eio = (progress) =>
  progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

/** The stage every scene draws on; the player scales it to fit. */
export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

/** Pans and zooms an element that holds the whole 1920×1080 scene. */
export class Camera {
  constructor(el) {
    this.el = el;
    this.keys = [];
    el.style.transformOrigin = "0 0";
  }

  /** keys: [{ t, cx, cy, z, hold?, drift?: [dx, dy, dz] }] in stage coordinates. */
  set(keys) {
    this.keys = [...keys].sort((first, second) => first.t - second.t);
  }

  framing(key, time) {
    const [driftX, driftY, driftZoom] = key.drift ?? [0, 0, 0];
    const elapsed = Math.max(0, time - key.t);
    return {
      cx: key.cx + driftX * elapsed,
      cy: key.cy + driftY * elapsed,
      z: key.z + driftZoom * elapsed,
    };
  }

  /** Stays on a key for `hold` seconds, then eases in-out to the next. */
  at(t) {
    const keys = this.keys;
    if (!keys.length)
      return { cx: STAGE_WIDTH / 2, cy: STAGE_HEIGHT / 2, z: 1 };
    if (t <= keys[0].t) return this.framing(keys[0], keys[0].t);
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      const nextKey = keys[index + 1];
      if (!nextKey) return this.framing(key, t);
      const moveStart = Math.min(key.t + (key.hold ?? 0), nextKey.t);
      if (t < moveStart) return this.framing(key, t);
      if (t < nextKey.t) {
        const from = this.framing(key, moveStart);
        const to = this.framing(nextKey, nextKey.t);
        const eased = eio(seg(t, moveStart, nextKey.t));
        return {
          cx: lerp(from.cx, to.cx, eased),
          cy: lerp(from.cy, to.cy, eased),
          z: lerp(from.z, to.z, eased),
        };
      }
    }
    return this.framing(keys[keys.length - 1], t);
  }

  apply(t) {
    const { cx, cy, z } = this.at(t);
    this.el.style.transform = `translate(${STAGE_WIDTH / 2 - cx * z}px, ${
      STAGE_HEIGHT / 2 - cy * z
    }px) scale(${z})`;
  }
}

const ARROW =
  '<svg width="22" height="28" viewBox="0 0 22 28" style="position:absolute;left:-2px;top:-2px;overflow:visible"><path d="M2 2 L2 22.5 L7.4 17.6 L11.3 26 L15 24.4 L11.2 16.2 L18.4 16.2 Z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const RESIZE =
  '<svg width="30" height="16" viewBox="0 0 30 16" style="position:absolute;left:-15px;top:-8px;overflow:visible"><path d="M1.5 8 L7.5 2.5 L7.5 5.6 L22.5 5.6 L22.5 2.5 L28.5 8 L22.5 13.5 L22.5 10.4 L7.5 10.4 L7.5 13.5 Z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';

/** A mouse pointer that follows keyed positions, with presses and ripples. */
export class Cursor {
  constructor() {
    /** [{ t, at: [x, y] }] in stage coordinates (or the camera element's, when appended to it). */
    this.keys = [];
    /** Times of single clicks. */
    this.clicks = [];
    /** [start, end] spans where the button is held down (drags). */
    this.holds = [];
    /** [start, end] spans where the pointer shows the left-right resize shape. */
    this.ewSpans = [];
    this.el = document.createElement("div");
    this.el.style.cssText =
      "position:absolute;left:0;top:0;width:0;height:0;transform-origin:0 0;pointer-events:none;z-index:50;filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.3))";
    this.ripple = document.createElement("div");
    this.ripple.style.cssText =
      "position:absolute;left:-14px;top:-14px;width:28px;height:28px;border-radius:50%;border:2px solid var(--accent,#3B82F6);box-sizing:border-box;opacity:0";
    this.body = document.createElement("div");
    this.body.style.cssText =
      "position:absolute;left:0;top:0;transform-origin:0 0";
    this.arrow = document.createElement("div");
    this.arrow.innerHTML = ARROW;
    this.resize = document.createElement("div");
    this.resize.innerHTML = RESIZE;
    this.body.append(this.arrow, this.resize);
    this.el.append(this.ripple, this.body);
  }

  position(time) {
    const keys = this.keys;
    if (!keys.length) return [0, 0];
    if (time <= keys[0].t) return keys[0].at;
    for (let index = 0; index < keys.length - 1; index++) {
      const fromKey = keys[index];
      const toKey = keys[index + 1];
      if (time < toKey.t) {
        const eased = eio(seg(time, fromKey.t, toKey.t));
        return [
          lerp(fromKey.at[0], toKey.at[0], eased),
          lerp(fromKey.at[1], toKey.at[1], eased),
        ];
      }
    }
    return keys[keys.length - 1].at;
  }

  render(t) {
    const [x, y] = this.position(t);
    this.el.style.transform = `translate(${x}px, ${y}px)`;

    // How far the button is pressed: quick dip for clicks, steady for holds.
    let press = 0;
    for (const click of this.clicks) {
      press = Math.max(
        press,
        seg(t, click - 0.06, click) * (1 - seg(t, click, click + 0.14)),
      );
    }
    for (const [holdStart, holdEnd] of this.holds) {
      press = Math.max(
        press,
        seg(t, holdStart - 0.06, holdStart) *
          (1 - seg(t, holdEnd, holdEnd + 0.1)),
      );
    }
    this.body.style.transform = `scale(${1 - 0.14 * press})`;

    // A small, quick ripple from the most recent click.
    let lastClick = -Infinity;
    for (const click of this.clicks) {
      if (click <= t && click > lastClick) lastClick = click;
    }
    const rippleProgress = seg(t, lastClick, lastClick + 0.32);
    if (rippleProgress > 0 && rippleProgress < 1) {
      this.ripple.style.opacity = String(0.6 * (1 - rippleProgress));
      this.ripple.style.transform = `scale(${lerp(0.35, 1, eo(rippleProgress))})`;
    } else {
      this.ripple.style.opacity = "0";
    }

    const isResizing = this.ewSpans.some(
      ([spanStart, spanEnd]) => t >= spanStart && t < spanEnd,
    );
    this.arrow.style.display = isResizing ? "none" : "block";
    this.resize.style.display = isResizing ? "block" : "none";
  }
}

/** Types `text` from `start`, `charsPerSecond` characters per second. */
export class Typist {
  constructor(text, start, charsPerSecond) {
    this.text = text;
    this.start = start;
    this.charsPerSecond = charsPerSecond;
    this.end = start + text.length / charsPerSecond;
  }
  at(t) {
    const charCount = Math.floor((t - this.start) * this.charsPerSecond);
    return this.text.slice(
      0,
      Math.max(0, Math.min(this.text.length, charCount)),
    );
  }
}

/** The `kit` object a scene file receives. */
export function createKit(stage) {
  const scenes = new Map();
  return {
    seg,
    lerp,
    eo,
    ei,
    eio,
    stage,
    Camera,
    scenes,
    /** Turns an HTML string into nodes ready to append. Returns a DocumentFragment, not an element. */
    h(html) {
      const template = document.createElement("template");
      template.innerHTML = html.trim();
      return template.content;
    },
    cursor: () => new Cursor(),
    typist: (text, start, charsPerSecond) =>
      new Typist(text, start, charsPerSecond),
    scene(id, def) {
      scenes.set(id, def);
    },
  };
}
