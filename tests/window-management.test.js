const test = require("node:test")
const assert = require("node:assert/strict")
const W = require("../core/WindowManagement.js")
const RootSearch = require("../core/RootSearch.js")

// Two monitors, as the Phase 6 acceptance check asks: a 2560×1440 one with a
// 40 px bar on top, and a 4K one at scale 2 to its right, turned sideways.
const monitors = [
  { id: 0, x: 0, y: 0, width: 2560, height: 1440, scale: 1, transform: 0, reserved: [0, 40, 0, 0], focused: true },
  { id: 1, x: 2560, y: 0, width: 3840, height: 2160, scale: 2, transform: 1, reserved: [0, 0, 0, 30], focused: false }
]
const area = { x: 0, y: 40, w: 2560, h: 1400 }

function tiled(over) {
  return Object.assign({ address: "0xabc", at: [100, 140], size: [800, 600], floating: false, fullscreen: 0, monitor: 0 }, over)
}

function rectOf(name, win) {
  const p = W.plan(name, win || tiled(), monitors, null, {})
  assert.equal(p.error, undefined, name)
  return [p.rect.x, p.rect.y, p.rect.w, p.rect.h]
}

test("the work area leaves out reserved space, scale and rotation", () => {
  assert.deepEqual(W.workArea(monitors[0], 0), area)
  assert.deepEqual(W.workArea(monitors[1], 0), { x: 2560, y: 0, w: 1080, h: 1890 })
  assert.deepEqual(W.workArea(monitors[0], 10), { x: 10, y: 50, w: 2540, h: 1380 })
})

test("golden geometry on a 2560×1400 work area at y 40", () => {
  const golden = {
    maximize: [0, 40, 2560, 1400],
    maximizeAlmost: [128, 110, 2304, 1260],
    maximizeWidth: [0, 140, 2560, 600],
    maximizeHeight: [100, 40, 800, 1400],
    reasonableSize: [768, 320, 1024, 840],
    center: [880, 440, 800, 600],
    centerHalf: [640, 40, 1280, 1400],
    leftHalf: [0, 40, 1280, 1400],
    rightHalf: [1280, 40, 1280, 1400],
    topHalf: [0, 40, 2560, 700],
    bottomHalf: [0, 740, 2560, 700],
    firstThird: [0, 40, 853, 1400],
    centerThird: [853, 40, 854, 1400],
    lastThird: [1707, 40, 853, 1400],
    firstTwoThird: [0, 40, 1707, 1400],
    centerTwoThird: [427, 40, 1706, 1400],
    lastTwoThird: [853, 40, 1707, 1400],
    topThird: [0, 40, 2560, 467],
    middleThird: [0, 507, 2560, 466],
    bottomThird: [0, 973, 2560, 467],
    topTwoThird: [0, 40, 2560, 933],
    bottomTwoThird: [0, 507, 2560, 933],
    topCenterTwoThird: [427, 40, 1706, 700],
    bottomCenterTwoThird: [427, 740, 1706, 700],
    firstFourth: [0, 40, 640, 1400],
    secondFourth: [640, 40, 640, 1400],
    thirdFourth: [1280, 40, 640, 1400],
    lastFourth: [1920, 40, 640, 1400],
    firstThreeFourth: [0, 40, 1920, 1400],
    centerThreeFourth: [320, 40, 1920, 1400],
    lastThreeFourth: [640, 40, 1920, 1400],
    topFirstFourth: [0, 40, 2560, 350],
    topSecondFourth: [0, 390, 2560, 350],
    topThirdFourth: [0, 740, 2560, 350],
    topLastFourth: [0, 1090, 2560, 350],
    topThreeFourth: [0, 40, 2560, 1050],
    bottomThreeFourth: [0, 390, 2560, 1050],
    topLeftQuarter: [0, 40, 1280, 700],
    topRightQuarter: [1280, 40, 1280, 700],
    bottomLeftQuarter: [0, 740, 1280, 700],
    bottomRightQuarter: [1280, 740, 1280, 700],
    topLeftSixth: [0, 40, 853, 700],
    topCenterSixth: [853, 40, 854, 700],
    topRightSixth: [1707, 40, 853, 700],
    bottomLeftSixth: [0, 740, 853, 700],
    bottomCenterSixth: [853, 740, 854, 700],
    bottomRightSixth: [1707, 740, 853, 700],
    moveLeft: [0, 440, 800, 600],
    moveRight: [1760, 440, 800, 600],
    moveTop: [880, 40, 800, 600],
    moveBottom: [880, 840, 800, 600]
  }
  const placing = W.COMMANDS.filter((c) => c.name !== "restore").map((c) => c.name)
  assert.deepEqual(Object.keys(golden).sort(), placing.sort())
  for (const name of placing) assert.deepEqual(rectOf(name), golden[name], name)
})

test("neighbouring regions meet without a gap or an overlap", () => {
  for (const group of [["firstThird", "centerThird", "lastThird"], ["topThird", "middleThird", "bottomThird"],
    ["topLeftSixth", "topCenterSixth", "topRightSixth"]]) {
    const horizontal = group[0] !== "topThird"
    let edge = horizontal ? area.x : area.y
    for (const name of group) {
      const r = rectOf(name)
      assert.equal(horizontal ? r[0] : r[1], edge, name)
      edge += horizontal ? r[2] : r[3]
    }
    assert.equal(edge, horizontal ? area.x + area.w : area.y + area.h)
  }
})

test("a window on the second monitor is placed on that monitor", () => {
  assert.deepEqual(rectOf("leftHalf", tiled({ monitor: 1, at: [2600, 100] })), [2560, 0, 540, 1890])
  assert.deepEqual(rectOf("bottomRightQuarter", tiled({ monitor: 1 })), [3100, 945, 540, 945])
})

test("gaps: the screen gap goes all round, the window gap between neighbours", () => {
  const opts = { screenGap: 10, windowGap: 8 }
  const left = W.plan("leftHalf", tiled(), monitors, null, opts).rect
  const right = W.plan("rightHalf", tiled(), monitors, null, opts).rect
  assert.deepEqual(left, { x: 10, y: 50, w: 1266, h: 1380 })
  assert.deepEqual(right, { x: 1284, y: 50, w: 1266, h: 1380 })
  assert.equal(right.x - (left.x + left.w), 8)
})

test("a tiled window is floated, then sized, then moved, in both spellings", () => {
  // Its size once floating is unknown, so it is sized and moved twice.
  const p = W.plan("leftHalf", tiled(), monitors, null, {})
  assert.deepEqual(p.dispatches.map((d) => d.lua), [
    'hl.dsp.window.float({ action = "on", window = "address:0xabc" })',
    'hl.dsp.window.resize({ x = 1280, y = 1400, window = "address:0xabc" })',
    'hl.dsp.window.move({ x = 0, y = 40, window = "address:0xabc" })',
    'hl.dsp.window.resize({ x = 1280, y = 1400, window = "address:0xabc" })',
    'hl.dsp.window.move({ x = 0, y = 40, window = "address:0xabc" })'
  ])
  assert.deepEqual(p.dispatches.map((d) => d.classic), [
    ["setfloating", "address:0xabc"],
    ["resizewindowpixel", "exact 1280 1400,address:0xabc"],
    ["movewindowpixel", "exact 0 40,address:0xabc"],
    ["resizewindowpixel", "exact 1280 1400,address:0xabc"],
    ["movewindowpixel", "exact 0 40,address:0xabc"]
  ])
  const floating = W.plan("leftHalf", tiled({ floating: true }), monitors, null, {})
  assert.equal(floating.dispatches.length, 2)
  // An odd change in size makes Hyprland round up: the second pass corrects it.
  const odd = W.plan("leftHalf", tiled({ floating: true, size: [800, 601] }), monitors, null, {})
  assert.deepEqual(odd.dispatches.map((d) => d.classic[0]),
    ["resizewindowpixel", "movewindowpixel", "resizewindowpixel", "movewindowpixel"])
})

test("a fullscreen or maximized window leaves that state by name and is floated", () => {
  const full = W.plan("leftHalf", tiled({ fullscreen: 2 }), monitors, null, {})
  assert.equal(full.dispatches[0].lua, 'hl.dsp.window.fullscreen({ mode = "fullscreen", action = "unset", window = "address:0xabc" })')
  const maximized = W.plan("leftHalf", tiled({ fullscreen: 1 }), monitors, null, {})
  assert.equal(maximized.dispatches[0].lua, 'hl.dsp.window.fullscreen({ mode = "maximized", action = "unset", window = "address:0xabc" })')
  // Leaving fullscreen can change the float state, so it is set either way.
  const fullFloating = W.plan("leftHalf", tiled({ fullscreen: 2, floating: true }), monitors, null, {})
  assert.deepEqual(fullFloating.dispatches.map((d) => d.classic[0]),
    ["fullscreenstate", "setfloating", "resizewindowpixel", "movewindowpixel", "resizewindowpixel", "movewindowpixel"])
})

function follow(name, previous) {
  const r = previous.rect
  return W.plan(name, tiled({ floating: true, at: [r.x, r.y], size: [r.w, r.h] }), monitors, previous.entry, {})
}

test("repeating a half cycles ½ → ⅔ → ⅓ and back", () => {
  let p = W.plan("leftHalf", tiled(), monitors, null, {})
  const widths = [p.rect.w]
  for (let i = 0; i < 3; i++) { p = follow("leftHalf", p); widths.push(p.rect.w) }
  assert.deepEqual(widths, [1280, 1707, 853, 1280])

  let right = W.plan("rightHalf", tiled(), monitors, null, {})
  right = follow("rightHalf", right)
  assert.deepEqual([right.rect.x, right.rect.w], [853, 1707])

  // Another command, or a window moved by hand, starts over at a half.
  const other = follow("leftHalf", W.plan("rightHalf", tiled(), monitors, null, {}))
  assert.equal(other.rect.w, 1280)
  const first = W.plan("leftHalf", tiled(), monitors, null, {})
  const moved = W.plan("leftHalf", tiled({ floating: true, at: [300, 300], size: [1280, 1400] }), monitors, first.entry, {})
  assert.equal(moved.rect.w, 1280)
})

test("Restore returns to the bounds from before the first command", () => {
  let p = W.plan("leftHalf", tiled(), monitors, null, {})
  p = follow("topRightQuarter", p)
  assert.deepEqual(p.entry.restore, { x: 100, y: 140, w: 800, h: 600, floating: false })

  // It was tiled: Restore only tiles it again.
  const back = follow("restore", p)
  assert.deepEqual(back.dispatches.map((d) => d.classic[0]), ["settiled"])
  assert.equal(back.entry, null)

  // It was floating: Restore puts the old bounds back.
  let f = W.plan("maximize", tiled({ floating: true }), monitors, null, {})
  f = follow("restore", f)
  assert.deepEqual(f.dispatches.map((d) => d.classic), [
    ["resizewindowpixel", "exact 800 600,address:0xabc"],
    ["movewindowpixel", "exact 100 140,address:0xabc"]
  ])

  // It was fullscreen: Restore makes it fullscreen again, not a window that size.
  let full = W.plan("leftHalf", tiled({ fullscreen: 2, floating: true, at: [0, 0], size: [2560, 1440] }), monitors, null, {})
  assert.equal(full.entry.restore.fullscreen, 2)
  full = follow("restore", full)
  assert.deepEqual(full.dispatches.map((d) => d.lua), [
    'hl.dsp.window.fullscreen({ mode = "fullscreen", action = "set", window = "address:0xabc" })'
  ])
  assert.deepEqual(full.dispatches[0].classic, ["fullscreenstate", "2 2"])
  // Already fullscreen again by hand: nothing to do.
  const same = W.plan("leftHalf", tiled({ fullscreen: 2 }), monitors, null, {})
  assert.equal(W.plan("restore", tiled({ fullscreen: 2 }), monitors, same.entry, {}).dispatches.length, 0)

  // Moved by hand since: those bounds become the ones to restore.
  const first = W.plan("leftHalf", tiled({ floating: true }), monitors, null, {})
  const again = W.plan("rightHalf", tiled({ floating: true, at: [50, 60], size: [700, 500] }), monitors, first.entry, {})
  assert.deepEqual(again.entry.restore, { x: 50, y: 60, w: 700, h: 500, floating: true })
})

test("errors: no window, nothing to restore, unknown command, odd addresses", () => {
  assert.equal(W.plan("leftHalf", {}, monitors, null, {}).error, "No focused window")
  assert.equal(W.plan("leftHalf", null, monitors, null, {}).error, "No focused window")
  assert.equal(W.plan("leftHalf", tiled({ address: '0xabc" })) os.execute("x' }), monitors, null, {}).error, "No focused window")
  assert.equal(W.plan("restore", tiled(), monitors, null, {}).error, "Nothing to restore")
  assert.equal(W.plan("nope", tiled(), monitors, null, {}).error, "Unknown window command nope")
  assert.equal(W.plan("leftHalf", tiled(), [], null, {}).error, "No monitor for the focused window")
})

test("every command is a searchable built-in with its own shortcut name", () => {
  assert.equal(W.COMMANDS.length, 52)
  const ids = new Set(), shortcuts = new Set()
  for (const c of W.COMMANDS) {
    const candidate = RootSearch.builtinCandidate(W.builtin(c))
    ids.add(candidate.id)
    shortcuts.add(c.shortcut)
    assert.match(c.shortcut, /^window-[a-z]+(-[a-z]+)*$/)
    assert.equal(candidate.subtitle, "Window Management")
    assert.equal(candidate.rootSearch.when, "searching")
    assert.equal(candidate.run.window, c.name)
  }
  assert.equal(ids.size, 52)
  assert.equal(shortcuts.size, 52)
  assert.equal(W.command("maximizeAlmost").shortcut, "window-almost-maximize")
  assert.equal(W.command("firstTwoThird").shortcut, "window-first-two-thirds")
  assert.ok(ids.has("builtin:window-management.leftHalf"))
})

test("a title bar drawn above the window stays inside the target", () => {
  const p = W.plan("leftHalf", tiled(), monitors, null, { titlebar: 30 })
  assert.deepEqual(p.rect, { x: 0, y: 70, w: 1280, h: 1370 })
  const centre = W.plan("center", tiled({ floating: true }), monitors, null, { titlebar: 30 }).rect
  assert.equal(centre.h, 600)
  assert.equal(centre.y - 30 - area.y, area.y + area.h - (centre.y + centre.h))
})
