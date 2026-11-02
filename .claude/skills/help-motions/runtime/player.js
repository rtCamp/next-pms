/**
 * Framework-free motion player. Plays one motion (scenes.json + base.css +
 * scene code) as live DOM inside a container, scaled to its width.
 *
 * It loops while visible, pauses when the tab is hidden or the player is off
 * screen, and for people who prefer reduced motion it starts paused on the
 * finished task (the last frame). A React or Vue component can wrap it:
 * mount in an effect, call `destroy()` on cleanup.
 *
 *   import { createKit, STAGE_WIDTH, STAGE_HEIGHT } from "./kit.js";
 *   import { mountMotion } from "./player.js";
 *   const player = mountMotion(el, { createKit, scenes, css, code });
 *
 * `scenes` is the parsed scenes.json, `css` the text of base.css and `code`
 * an object { [sceneId]: sceneSourceText } (load them with your bundler's raw
 * import, e.g. Vite `?raw`, or fetch them). The CSS is scoped to this player
 * (see scopeCss), so a base.css written against `#stage` works as is.
 */
/**
 * Scopes a motion's base.css to one player: `#stage` (the stage root in the
 * authoring tool and the skill's scripts) becomes the scope itself, and every
 * other selector is prefixed with it, so two motions on a page never clash.
 */
export function scopeCss(css, scope) {
  const out = [];
  let depth = 0,
    start = 0,
    sel = null;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === "{") {
      if (depth === 0) {
        sel = css.slice(start, i).trim();
        start = i + 1;
      }
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0) {
        const body = css.slice(start, i);
        if (sel.startsWith("@"))
          out.push(
            `${sel}{${/^@(media|supports)/.test(sel) ? scopeCss(body, scope) : body}}`,
          );
        else
          out.push(
            sel
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
              .map((x) =>
                x.includes("#stage")
                  ? x.replace(/#stage\b/g, scope)
                  : `${scope} ${x}`,
              )
              .join(",") + `{${body}}`,
          );
        start = i + 1;
      }
    }
  }
  return out.join("\n");
}

export function mountMotion(
  container,
  { createKit, scenes, css, code, onError, id },
) {
  const W = scenes.width ?? 1920;
  const H = scenes.height ?? 1080;
  const list = scenes.scenes ?? [];
  const total = list.reduce((s, sc) => s + (sc.dur ?? 0), 0) || 1;

  const motionId = id ?? list[0]?.id ?? "motion";
  const scope = `[data-motion="${motionId}"]`;
  const style = document.createElement("style");
  style.textContent = scopeCss(css ?? "", scope);
  document.head.append(style);

  container.style.position = container.style.position || "relative";
  container.style.overflow = "hidden";
  container.style.aspectRatio = `${W} / ${H}`;
  const stage = document.createElement("div");
  stage.dataset.motion = motionId;
  stage.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;overflow:hidden;background:${scenes.background ?? "#F4F4F5"};font-family:${scenes.fonts?.sans?.family ?? "system-ui"},system-ui,sans-serif`;
  container.append(stage);

  const fit = () => {
    stage.style.transform = `scale(${container.clientWidth / W})`;
  };
  const ro = new ResizeObserver(fit);
  ro.observe(container);
  fit();

  // One sub-stage per scene, so each scene's init builds its own DOM once.
  const defs = [];
  try {
    for (const sc of list) {
      const holder = document.createElement("div");
      holder.style.cssText = `position:absolute;inset:0;display:none`;
      stage.append(holder);
      const kit = createKit(holder);
      new Function("kit", code[sc.id])(kit);
      const def = kit.scenes.get(sc.id);
      if (!def) throw new Error(`scene ${sc.id} did not register`);
      def.init?.call(def, kit);
      defs.push({ def, holder, dur: sc.dur ?? 0 });
    }
  } catch (e) {
    onError?.(e);
    throw e;
  }

  const draw = (T) => {
    let start = 0;
    for (const s of defs) {
      const on = T >= start && T < start + s.dur;
      s.holder.style.display = on ? "block" : "none";
      if (on) s.def.render.call(s.def, T - start);
      start += s.dur;
    }
    if (T >= total && defs.length) {
      const s = defs[defs.length - 1];
      s.holder.style.display = "block";
      s.def.render.call(s.def, s.dur);
    }
  };

  const reduced = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  let playing = !reduced;
  let visible = true;
  let elapsed = reduced ? total : 0;
  let last = performance.now();
  let raf = 0;

  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(container);

  const tick = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (playing && visible && !document.hidden)
      elapsed = (elapsed + dt) % total;
    try {
      draw(elapsed);
    } catch (e) {
      cancelAnimationFrame(raf);
      onError?.(e);
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return {
    play() {
      playing = true;
    },
    pause() {
      playing = false;
    },
    seek(t) {
      elapsed = Math.max(0, Math.min(total, t));
      draw(elapsed);
    },
    get time() {
      return elapsed;
    },
    get duration() {
      return total;
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      stage.remove();
      style.remove();
    },
  };
}
