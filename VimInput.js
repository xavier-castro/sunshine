// VimInput.js - Vim-style key interpreter for the Pages editor.
//
// Translates Vim key sequences into editor actions. The editor checks
// this module when vimMode is on (Settings → vimMode), and routes
// key presses through it instead of the normal handlers.
//
// State machine: normal mode (default), operator-pending (d/c/y before motion),
// search mode (/). Counts (1-9 digits) prefix operators and motions.

var COUNT = 0
var MODE = "normal"
var OPERATOR = null
var motionKey = ""

function setMode(m) { MODE = m }
function getMode() { return MODE }
function getCount() { return COUNT }
function clearCount() { COUNT = 0 }
function clearState() { MODE = "normal"; COUNT = 0; OPERATOR = null }

// ---- public API --------------------------------------------------------------------

function handleKey(key, ctrl, shift, alt) {
  // Ctrl+R → redo
  if (ctrl && key === "Key_R") { MODE = "normal"; COUNT = 0; OPERATOR = null; motionKey = ""; return { type: "redo" } }

  // Escape → cancel operator, go normal
  if (key === "Escape") { MODE = "normal"; COUNT = 0; OPERATOR = null; motionKey = ""; return { type: "undo" } }

  // u → undo
  if (!ctrl && !shift && key === "Key_U") { MODE = "normal"; COUNT = 0; OPERATOR = null; motionKey = ""; return { type: "undo" } }

  // Search mode
  if (key === "Slash" && !ctrl && !shift) { MODE = "search"; COUNT = 0; OPERATOR = null; motionKey = ""; return { type: "searchStart" } }
  if (MODE === "search") {
    if (key === "Enter") { MODE = "normal"; COUNT = 0; OPERATOR = null; motionKey = ""; return { type: "searchSubmit" } }
    if (key === "Escape") { MODE = "normal"; COUNT = 0; OPERATOR = null; motionKey = ""; return null }
    return { type: "searchInput", char: key.length === 1 ? key : "" }
  }

  // Digits: accumulate count
  if (key.length === 1 && key >= "1" && key <= "9") {
    COUNT = COUNT * 10 + parseInt(key)
    return null
  }

  // ---- operator-pending mode (checked before operators so motions are resolved) ---
  if (MODE === "operator") return resolveMotion(key)

  // Operators (d, c, y): only in normal mode
  if (key === "Key_D") { OPERATOR = "delete"; MODE = "operator"; motionKey = ""; return null }
  if (key === "Key_C") { OPERATOR = "clear"; MODE = "operator"; motionKey = ""; return null }
  if (key === "Key_Y") { OPERATOR = "yank"; MODE = "operator"; motionKey = ""; return null }

  // ---- normal mode commands (non-operator) -----------------------------------------
  if (key === "Key_P") return { type: "paste" }
  if (key === "Key_V") return { type: "visual" }
  if (key === "Key_J") return { type: "navigate", direction: "down", count: COUNT }
  if (key === "Key_K") return { type: "navigate", direction: "up", count: COUNT }
  if (key === "Key_H") return { type: "navigate", direction: "left", count: COUNT }
  if (key === "Key_L") return { type: "navigate", direction: "right", count: COUNT }
  if (key === "Key_W") return { type: "navigate", direction: "wordForward", count: COUNT }
  if (key === "Key_B") return { type: "navigate", direction: "wordBack", count: COUNT }
  if (key === "Key_0" || key === "Home") return { type: "lineStart" }
  if (key === "Dollar") return { type: "lineEnd" }
  if (key === "Key_G") return { type: "navigate", direction: "top", count: COUNT }
  if (key === "End") return { type: "navigate", direction: "bottom", count: COUNT }
  if (key === "Greater") return { type: "indent", count: COUNT }
  if (key === "Less") return { type: "outdent", count: COUNT }

  return null
}

// Resolve an operator + motion into an action.
function resolveMotion(motion) {
  var op = OPERATOR
  var count = COUNT || 1
  var action

  if (op === "delete") {
    if (motion === "Key_D") action = { type: "deleteBlock", count: count }
    else if (motion === "Key_C") action = { type: "clearBlock", count: count }
    else if (motion === "Key_Y") action = { type: "duplicateBlock", count: count }
    else action = { type: "deleteBlock", count: count }
  } else if (op === "clear") {
    if (motion === "Key_D") action = { type: "clearBlock", count: count }
    else if (motion === "Key_C") action = { type: "clearBlock", count: count }
    else if (motion === "Key_Y") action = { type: "duplicateBlock", count: count }
    else action = { type: "clearBlock", count: count }
  } else if (op === "yank") {
    if (motion === "Key_D") action = { type: "deleteBlock", count: count }
    else if (motion === "Key_C") action = { type: "clearBlock", count: count }
    else if (motion === "Key_Y") action = { type: "duplicateBlock", count: count }
    else action = { type: "duplicateBlock", count: count }
  } else {
    action = { type: "deleteBlock", count: count }
  }

  // Reset state after resolving
  MODE = "normal"
  COUNT = 0
  OPERATOR = null
  motionKey = ""

  return action
}
