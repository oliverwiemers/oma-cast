import QtQuick
import Quickshell
import Quickshell.Io
import "../core/WindowManagement.js" as WindowManagement

// Runs a Window Management command on the focused window (SPEC §8.5). The
// maths is in core/WindowManagement.js; this reads Hyprland's state, sends
// the dispatches and remembers each window's bounds for Restore and cycling.
Item {
  id: service

  property real screenGap: 0
  property real windowGap: 0
  // address → the `entry` of that window's last plan. In memory only [O].
  property var entries: ({})
  property var order: []
  property string pending: ""

  signal failed(string message)

  function run(name) {
    if (!WindowManagement.command(name)) return false
    service.pending = name
    query.running = false
    query.running = true
    return true
  }

  function remember(address, entry) {
    var at = service.order.indexOf(address)
    if (at >= 0) service.order.splice(at, 1)
    if (entry) {
      service.entries[address] = entry
      service.order.push(address)
      // Closed windows never report back, so cap the memory instead.
      while (service.order.length > 200) delete service.entries[service.order.shift()]
    } else {
      delete service.entries[address]
    }
  }

  function apply(text) {
    var name = service.pending
    service.pending = ""
    if (!name) return
    var state = null
    try { state = JSON.parse(text) } catch (e) {}
    if (!state || !state.window) { service.failed("Couldn't read the focused window"); return }
    var address = String(state.window.address || "")
    var plan = WindowManagement.plan(name, state.window, state.monitors, service.entries[address] || null,
      { screenGap: service.screenGap, windowGap: service.windowGap })
    if (plan.error) { service.failed(plan.error); return }
    service.remember(plan.address, plan.entry)
    // Only numbers and a window address reach argv. The Lua-config
    // dispatcher is tried first, the classic form is the fallback.
    var argv = ["bash", "-c",
      'while (( $# >= 3 )); do'
      + ' hyprctl dispatch "$1" >/dev/null 2>&1 || hyprctl dispatch "$2" "$3" >/dev/null 2>&1;'
      + ' shift 3;'
      + ' done', "omacast-window"]
    for (var i = 0; i < plan.dispatches.length; i++)
      argv.push(plan.dispatches[i].lua, plan.dispatches[i].classic[0], plan.dispatches[i].classic[1])
    Quickshell.execDetached(argv)
  }

  // No wait for the launcher to close: Hyprland keeps reporting the window
  // under the "omacast" layer as active while it is open, and the layer stays
  // in `hyprctl layers` after it hides, so it can't be waited on anyway.
  Process {
    id: query
    command: ["bash", "-c",
      'w=$(hyprctl activewindow -j 2>/dev/null); m=$(hyprctl monitors -j 2>/dev/null);'
      + ' printf \'{"window":%s,"monitors":%s}\' "${w:-null}" "${m:-null}"']
    stdout: StdioCollector {
      onStreamFinished: service.apply(text)
    }
  }
}
