// Window Management (SPEC §8.5, ref 04 §1): Raycast's command names and titles
// [O], with geometry worked out from the names [I]. Pure maths: the caller
// passes Hyprland's `activewindow -j` and `monitors -j` and gets back the
// dispatches to send, so node tests cover every command.

var SUBTITLE = "Window Management"
var GLYPH = ""                       // nf-fa-window_maximize

// The sizes a half cycles through when its command repeats on the same
// window (pref cycleMode = sizes, "Cycle ½, ⅔, and ⅓") [O].
var CYCLE = [1 / 2, 2 / 3, 1 / 3]

// [name, title, shape, keywords]. A shape is a [x, y, width, height] fraction
// of the work area, or the name of a rule in target().
var TABLE = [
  ["maximize", "Maximize", [0, 0, 1, 1], ["full", "fill"]],
  ["maximizeAlmost", "Almost Maximize", "almost", []],
  ["maximizeWidth", "Maximize Width", "width", []],
  ["maximizeHeight", "Maximize Height", "height", []],
  ["reasonableSize", "Reasonable Size", "reasonable", []],
  ["center", "Center", "center", ["middle"]],
  ["centerHalf", "Center Half", [1 / 4, 0, 1 / 2, 1], []],
  ["restore", "Restore", "restore", ["undo", "tile"]],

  ["leftHalf", "Left Half", "half-left", []],
  ["rightHalf", "Right Half", "half-right", []],
  ["topHalf", "Top Half", "half-top", []],
  ["bottomHalf", "Bottom Half", "half-bottom", []],

  ["firstThird", "First Third", [0, 0, 1 / 3, 1], ["left"]],
  ["centerThird", "Center Third", [1 / 3, 0, 1 / 3, 1], []],
  ["lastThird", "Last Third", [2 / 3, 0, 1 / 3, 1], ["right"]],
  ["firstTwoThird", "First Two Thirds", [0, 0, 2 / 3, 1], ["left"]],
  ["centerTwoThird", "Center Two Thirds", [1 / 6, 0, 2 / 3, 1], []],
  ["lastTwoThird", "Last Two Thirds", [1 / 3, 0, 2 / 3, 1], ["right"]],
  ["topThird", "Top Third", [0, 0, 1, 1 / 3], []],
  ["middleThird", "Middle Third", [0, 1 / 3, 1, 1 / 3], []],
  ["bottomThird", "Bottom Third", [0, 2 / 3, 1, 1 / 3], []],
  ["topTwoThird", "Top Two Thirds", [0, 0, 1, 2 / 3], []],
  ["bottomTwoThird", "Bottom Two Thirds", [0, 1 / 3, 1, 2 / 3], []],
  ["topCenterTwoThird", "Top Center Two Thirds", [1 / 6, 0, 2 / 3, 1 / 2], []],
  ["bottomCenterTwoThird", "Bottom Center Two Thirds", [1 / 6, 1 / 2, 2 / 3, 1 / 2], []],

  ["firstFourth", "First Fourth", [0, 0, 1 / 4, 1], ["left"]],
  ["secondFourth", "Second Fourth", [1 / 4, 0, 1 / 4, 1], []],
  ["thirdFourth", "Third Fourth", [1 / 2, 0, 1 / 4, 1], []],
  ["lastFourth", "Last Fourth", [3 / 4, 0, 1 / 4, 1], ["right"]],
  ["firstThreeFourth", "First Three Fourths", [0, 0, 3 / 4, 1], ["left"]],
  ["centerThreeFourth", "Center Three Fourths", [1 / 8, 0, 3 / 4, 1], []],
  ["lastThreeFourth", "Last Three Fourths", [1 / 4, 0, 3 / 4, 1], ["right"]],
  // The "Top … Fourth" commands are rows, as Top/Middle/Bottom Third are [I].
  ["topFirstFourth", "Top First Fourth", [0, 0, 1, 1 / 4], []],
  ["topSecondFourth", "Top Second Fourth", [0, 1 / 4, 1, 1 / 4], []],
  ["topThirdFourth", "Top Third Fourth", [0, 1 / 2, 1, 1 / 4], []],
  ["topLastFourth", "Top Last Fourth", [0, 3 / 4, 1, 1 / 4], []],
  ["topThreeFourth", "Top Three Fourths", [0, 0, 1, 3 / 4], []],
  ["bottomThreeFourth", "Bottom Three Fourths", [0, 1 / 4, 1, 3 / 4], []],

  ["topLeftQuarter", "Top Left Quarter", [0, 0, 1 / 2, 1 / 2], []],
  ["topRightQuarter", "Top Right Quarter", [1 / 2, 0, 1 / 2, 1 / 2], []],
  ["bottomLeftQuarter", "Bottom Left Quarter", [0, 1 / 2, 1 / 2, 1 / 2], []],
  ["bottomRightQuarter", "Bottom Right Quarter", [1 / 2, 1 / 2, 1 / 2, 1 / 2], []],

  ["topLeftSixth", "Top Left Sixth", [0, 0, 1 / 3, 1 / 2], []],
  ["topCenterSixth", "Top Center Sixth", [1 / 3, 0, 1 / 3, 1 / 2], []],
  ["topRightSixth", "Top Right Sixth", [2 / 3, 0, 1 / 3, 1 / 2], []],
  ["bottomLeftSixth", "Bottom Left Sixth", [0, 1 / 2, 1 / 3, 1 / 2], []],
  ["bottomCenterSixth", "Bottom Center Sixth", [1 / 3, 1 / 2, 1 / 3, 1 / 2], []],
  ["bottomRightSixth", "Bottom Right Sixth", [2 / 3, 1 / 2, 1 / 3, 1 / 2], []],

  ["moveLeft", "Move Left", "move-left", []],
  ["moveRight", "Move Right", "move-right", []],
  ["moveTop", "Move Top", "move-top", ["up"]],
  ["moveBottom", "Move Bottom", "move-bottom", ["down"]]
]

// "First Two Thirds" → "window-first-two-thirds", the name after "omacast:"
// in hl.dsp.global().
function shortcutName(title) {
  return "window-" + String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-")
}

var COMMANDS = TABLE.map(function(row) {
  return { name: row[0], title: row[1], shape: row[2], keywords: row[3], shortcut: shortcutName(row[1]) }
})

function command(name) {
  for (var i = 0; i < COMMANDS.length; i++) if (COMMANDS[i].name === name) return COMMANDS[i]
  return null
}

// A RootSearch.BUILTINS-shaped definition. The commands show only while
// searching, so 52 of them don't bury the empty root [D].
function builtin(cmd) {
  return {
    id: "builtin:window-management." + cmd.name,
    title: cmd.title,
    subtitle: SUBTITLE,
    glyph: GLYPH,
    keywords: ["window"].concat(cmd.keywords),
    run: { window: cmd.name },
    rootSearch: { when: "searching" }
  }
}

// A monitor's usable rectangle in layout coordinates: its logical size (mode
// size over scale, turned for a rotated output) minus what bars reserve
// (`reserved` is left, top, right, bottom), minus the screen gap.
function workArea(monitor, screenGap) {
  var scale = monitor.scale > 0 ? monitor.scale : 1
  var w = monitor.width / scale
  var h = monitor.height / scale
  if (monitor.transform % 2 === 1) { var t = w; w = h; h = t }
  var r = monitor.reserved || [0, 0, 0, 0]
  var gap = screenGap || 0
  return {
    x: Math.round(monitor.x + r[0] + gap),
    y: Math.round(monitor.y + r[1] + gap),
    w: Math.round(w - r[0] - r[2] - 2 * gap),
    h: Math.round(h - r[1] - r[3] - 2 * gap)
  }
}

// Edges are rounded, not sizes, so neighbours (two halves, three thirds) meet
// exactly. An edge inside the work area gives up half the window gap.
function fractionRect(area, f, windowGap) {
  var half = (windowGap || 0) / 2
  function edge(origin, length, fraction) {
    var inner = fraction > 0.0001 && fraction < 0.9999
    return { at: origin + fraction * length, inner: inner }
  }
  var l = edge(area.x, area.w, f[0]), r = edge(area.x, area.w, f[0] + f[2])
  var t = edge(area.y, area.h, f[1]), b = edge(area.y, area.h, f[1] + f[3])
  var x0 = Math.round(l.at + (l.inner ? half : 0)), x1 = Math.round(r.at - (r.inner ? half : 0))
  var y0 = Math.round(t.at + (t.inner ? half : 0)), y1 = Math.round(b.at - (b.inner ? half : 0))
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

function centered(area, w, h) {
  w = Math.min(Math.round(w), area.w)
  h = Math.min(Math.round(h), area.h)
  return { x: area.x + Math.round((area.w - w) / 2), y: area.y + Math.round((area.h - h) / 2), w: w, h: h }
}

// Where a command puts a window. `win` is its current { x, y, w, h }; `step`
// indexes CYCLE for the halves.
function target(cmd, area, win, step, windowGap) {
  var shape = cmd.shape
  if (typeof shape !== "string") return fractionRect(area, shape, windowGap)
  var size = CYCLE[(step || 0) % CYCLE.length]
  var w = Math.min(win.w, area.w), h = Math.min(win.h, area.h)
  var midX = area.x + Math.round((area.w - w) / 2), midY = area.y + Math.round((area.h - h) / 2)
  switch (shape) {
    case "half-left": return fractionRect(area, [0, 0, size, 1], windowGap)
    case "half-right": return fractionRect(area, [1 - size, 0, size, 1], windowGap)
    case "half-top": return fractionRect(area, [0, 0, 1, size], windowGap)
    case "half-bottom": return fractionRect(area, [0, 1 - size, 1, size], windowGap)
    case "almost": return centered(area, area.w * 0.9, area.h * 0.9)                    // 90 % [I]
    case "reasonable": return centered(area, Math.min(area.w * 0.6, 1024), Math.min(area.h * 0.6, 900))
    case "center": return centered(area, win.w, win.h)
    case "width": return { x: area.x, y: win.y, w: area.w, h: win.h }
    case "height": return { x: win.x, y: area.y, w: win.w, h: area.h }
    // Move keeps the size and centres the other axis (pref Center Window, on) [O].
    case "move-left": return { x: area.x, y: midY, w: w, h: h }
    case "move-right": return { x: area.x + area.w - w, y: midY, w: w, h: h }
    case "move-top": return { x: midX, y: area.y, w: w, h: h }
    case "move-bottom": return { x: midX, y: area.y + area.h - h, w: w, h: h }
  }
  return null
}

function sameRect(a, b) {
  return !!a && !!b && Math.abs(a.x - b.x) <= 2 && Math.abs(a.y - b.y) <= 2
    && Math.abs(a.w - b.w) <= 2 && Math.abs(a.h - b.h) <= 2
}

// One Hyprland dispatch in both spellings: the Lua-config dispatcher
// (Hyprland 0.56+) and the classic "name args" form to fall back on.
function dispatches(address, steps) {
  var win = 'window = "address:' + address + '"'
  return steps.map(function(s) {
    switch (s.op) {
      // The mode is named: "unset" alone leaves a maximized window maximized.
      case "unfullscreen":
        return { lua: 'hl.dsp.window.fullscreen({ mode = "' + fullscreenMode(s.mode) + '", action = "unset", ' + win + " })", classic: ["fullscreenstate", "0 0"] }
      case "fullscreen":
        return {
          lua: 'hl.dsp.window.fullscreen({ mode = "' + fullscreenMode(s.mode) + '", action = "set", ' + win + " })",
          classic: ["fullscreenstate", s.mode === 1 ? "1 1" : "2 2"]
        }
      case "float":
        // Set, never toggled: what `floating` was is stale once fullscreen
        // ends, where a floating workspace floats the window by itself.
        return {
          lua: 'hl.dsp.window.float({ action = "' + (s.on ? "on" : "off") + '", ' + win + " })",
          classic: [s.on ? "setfloating" : "settiled", "address:" + address]
        }
      case "resize":
        return {
          lua: "hl.dsp.window.resize({ x = " + s.w + ", y = " + s.h + ", " + win + " })",
          classic: ["resizewindowpixel", "exact " + s.w + " " + s.h + ",address:" + address]
        }
      case "move":
        return {
          lua: "hl.dsp.window.move({ x = " + s.x + ", y = " + s.y + ", " + win + " })",
          classic: ["movewindowpixel", "exact " + s.x + " " + s.y + ",address:" + address]
        }
    }
  })
}

// Hyprland's `fullscreen` field: 1 is maximized, 2 is fullscreen.
function fullscreenMode(mode) {
  return mode === 1 ? "maximized" : "fullscreen"
}

// Resize, then move. Hyprland resizes about the window's centre and rounds
// the size up when that puts the corner on a half pixel, which an odd change
// in size does. A second resize from the placed corner lands exactly. `from`
// is the window's current size, or null when leaving fullscreen or tiling
// makes it unknown.
function placeSteps(steps, rect, from) {
  var passes = from && (rect.w - from.w) % 2 === 0 && (rect.h - from.h) % 2 === 0 ? 1 : 2
  for (var i = 0; i < passes; i++) {
    steps.push({ op: "resize", w: rect.w, h: rect.h })
    steps.push({ op: "move", x: rect.x, y: rect.y })
  }
}

function pair(value) {
  return Array.isArray(value) && value.length === 2 && isFinite(value[0]) && isFinite(value[1])
}

// Plans one command against the focused window.
//   win:      `hyprctl activewindow -j`
//   monitors: `hyprctl monitors -j`
//   entry:    what the last plan for this window returned as `entry`, or null
//   options:  { screenGap, windowGap }
// Returns { error } or { address, rect, dispatches, entry }. `entry` is the
// window's new memory: the bounds Restore returns to, and the last command
// for cycling. A tiled window is floated first, since Hyprland only places
// floating windows, and Restore tiles it again [D].
function plan(name, win, monitors, entry, options) {
  var cmd = command(name)
  if (!cmd) return { error: "Unknown window command " + name }
  var address = String(win && win.address || "")
  if (!/^0x[0-9a-fA-F]+$/.test(address) || !pair(win.at) || !pair(win.size)) return { error: "No focused window" }
  var opts = options || {}
  var current = { x: win.at[0], y: win.at[1], w: win.size[0], h: win.size[1] }
  var floating = !!win.floating
  var mode = Number(win.fullscreen) || 0
  var fullscreen = mode > 0
  var known = floating && !fullscreen ? current : null
  var steps = []

  if (cmd.shape === "restore") {
    if (!entry || !entry.restore) return { error: "Nothing to restore" }
    var back = entry.restore
    var stays = !!back.fullscreen && back.fullscreen === mode
    if (fullscreen && !stays) steps.push({ op: "unfullscreen", mode: mode })
    if (!stays && (fullscreen || floating !== back.floating)) steps.push({ op: "float", on: back.floating })
    if (back.fullscreen) {
      if (!stays) steps.push({ op: "fullscreen", mode: back.fullscreen })
    } else if (back.floating) {
      placeSteps(steps, back, known)
    }
    return { address: address, rect: back, dispatches: dispatches(address, steps), entry: null }
  }

  var list = Array.isArray(monitors) ? monitors : []
  var monitor = null
  for (var i = 0; i < list.length; i++) if (list[i].id === win.monitor) monitor = list[i]
  for (var j = 0; !monitor && j < list.length; j++) if (list[j].focused) monitor = list[j]
  if (!monitor) return { error: "No monitor for the focused window" }
  var area = workArea(monitor, opts.screenGap)
  if (area.w <= 0 || area.h <= 0) return { error: "No room on the monitor" }

  // Untouched since our last placement: the same command again cycles, and
  // the bounds to restore stay the ones from before we first moved it.
  var untouched = !!entry && floating && !fullscreen && sameRect(current, entry.applied)
  var step = untouched && entry.command === name ? entry.step + 1 : 0
  var rect = target(cmd, area, current, step, opts.windowGap)
  if (!rect || rect.w <= 0 || rect.h <= 0) return { error: "No room on the monitor" }

  if (fullscreen) steps.push({ op: "unfullscreen", mode: mode })
  if (fullscreen || !floating) steps.push({ op: "float", on: true })
  placeSteps(steps, rect, known)

  // A fullscreen window's bounds are the screen's, so Restore returns it to
  // fullscreen instead of to a floating window that size.
  var before = { x: current.x, y: current.y, w: current.w, h: current.h, floating: floating }
  if (fullscreen) before.fullscreen = mode

  return {
    address: address,
    rect: rect,
    dispatches: dispatches(address, steps),
    entry: {
      restore: untouched ? entry.restore : before,
      applied: rect,
      command: name,
      step: step
    }
  }
}

if (typeof module !== "undefined") {
  module.exports = {
    SUBTITLE: SUBTITLE,
    CYCLE: CYCLE,
    COMMANDS: COMMANDS,
    command: command,
    shortcutName: shortcutName,
    builtin: builtin,
    workArea: workArea,
    fractionRect: fractionRect,
    target: target,
    sameRect: sameRect,
    plan: plan
  }
}
