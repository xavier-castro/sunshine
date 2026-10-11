// Tests VimInput.js: the Vim-style key interpreter for the Pages editor.
// Usage (from the plugin directory): node tests/vim.test.cjs

const assert = require("node:assert/strict");
const { load, plain } = require("./load.cjs");

const VimInput = load("VimInput.js");
let passed = 0;
let failed = 0;
function check(name, fn) {
  try { fn(); passed++; }
  catch (e) { failed++; console.error("FAIL: " + name + "\n  " + e.message); }
}

// ---- normal mode commands ----------------------------------------------------------

check("h moves left", () => {
  VimInput.setMode("normal"); VimInput.clearCount();
  var act = VimInput.handleKey("Key_H", false, false, false);
  assert.equal(act.type, "navigate");
  assert.equal(act.direction, "left");
});

check("j moves down", () => {
  VimInput.setMode("normal"); VimInput.clearCount();
  var act = VimInput.handleKey("Key_J", false, false, false);
  assert.equal(act.type, "navigate");
  assert.equal(act.direction, "down");
});

check("k moves up", () => {
  VimInput.setMode("normal"); VimInput.clearCount();
  var act = VimInput.handleKey("Key_K", false, false, false);
  assert.equal(act.type, "navigate");
  assert.equal(act.direction, "up");
});

check("l moves right", () => {
  VimInput.setMode("normal"); VimInput.clearCount();
  var act = VimInput.handleKey("Key_L", false, false, false);
  assert.equal(act.type, "navigate");
  assert.equal(act.direction, "right");
});

check("w moves word forward", () => {
  VimInput.setMode("normal"); VimInput.clearCount();
  var act = VimInput.handleKey("Key_W", false, false, false);
  assert.equal(act.type, "navigate");
  assert.equal(act.direction, "wordForward");
});

check("b moves word backward", () => {
  VimInput.setMode("normal"); VimInput.clearCount();
  var act = VimInput.handleKey("Key_B", false, false, false);
  assert.equal(act.type, "navigate");
  assert.equal(act.direction, "wordBack");
});

check("0 goes to start of line", () => {
  VimInput.setMode("normal");
  var act = VimInput.handleKey("Key_0", false, false, false);
  assert.equal(act.type, "lineStart");
});

check("$ goes to end of line", () => {
  VimInput.setMode("normal");
  var act = VimInput.handleKey("Dollar", false, false, false);
  assert.equal(act.type, "lineEnd");
});

check("p pastes", () => {
  VimInput.setMode("normal");
  var act = VimInput.handleKey("Key_P", false, false, false);
  assert.equal(act.type, "paste");
});

check("v enters visual mode", () => {
  VimInput.setMode("normal");
  var act = VimInput.handleKey("Key_V", false, false, false);
  assert.equal(act.type, "visual");
});

check("u undoes", () => {
  VimInput.setMode("normal");
  var act = VimInput.handleKey("Key_U", false, false, false);
  assert.equal(act.type, "undo");
});

check("Escape undoes too", () => {
  VimInput.setMode("normal");
  var act = VimInput.handleKey("Escape", false, false, false);
  assert.equal(act.type, "undo");
});

check("Ctrl+R redoes", () => {
  VimInput.setMode("normal");
  var act = VimInput.handleKey("Key_R", true, false, false);
  assert.equal(act.type, "redo");
});

// ---- search ------------------------------------------------------------------------

check("/ enters search mode", () => {
  VimInput.setMode("normal");
  var act = VimInput.handleKey("Slash", false, false, false);
  assert.equal(act.type, "searchStart");
  assert.equal(VimInput.getMode(), "search");
});

check("Escape exits search mode", () => {
  VimInput.setMode("search");
  VimInput.handleKey("Escape", false, false, false);
  assert.equal(VimInput.getMode(), "normal");
});

check("Enter submits search", () => {
  VimInput.setMode("search");
  var act = VimInput.handleKey("Enter", false, false, false);
  assert.equal(act.type, "searchSubmit");
  assert.equal(VimInput.getMode(), "normal");
});

// ---- operators: two-key sequences (d → motion) -------------------------------------

// In Vim: d followed by d deletes the current block.
check("dd deletes block (two-key: d then d)", () => {
  VimInput.setMode("normal"); VimInput.clearCount();
  assert.ok(VimInput.handleKey("Key_D", false, false, false) === null, "d returns null (enters operator mode)");
  var act = VimInput.handleKey("Key_D", false, false, false);
  assert.equal(act.type, "deleteBlock");
  assert.equal(act.count, 1);
});

// c followed by c clears the current block
check("cc clears block (two-key: c then c)", () => {
  VimInput.setMode("normal"); VimInput.clearCount();
  assert.ok(VimInput.handleKey("Key_C", false, false, false) === null, "c returns null (enters operator mode)");
  var act = VimInput.handleKey("Key_C", false, false, false);
  assert.equal(act.type, "clearBlock");
});

// y followed by y duplicates the current block
check("yy duplicates block (two-key: y then y)", () => {
  VimInput.setMode("normal"); VimInput.clearCount();
  assert.ok(VimInput.handleKey("Key_Y", false, false, false) === null, "y returns null (enters operator mode)");
  var act = VimInput.handleKey("Key_Y", false, false, false);
  assert.equal(act.type, "duplicateBlock");
});

// ---- counts ------------------------------------------------------------------------

check("2j moves down two", () => {
  VimInput.setMode("normal"); VimInput.clearCount();
  VimInput.handleKey("Digit2", false, false, false);
  var act = VimInput.handleKey("Key_J", false, false, false);
  assert.equal(act.type, "navigate");
  assert.equal(act.direction, "down");
  assert.equal(act.count, 2);
});

check("d2d deletes two blocks", () => {
  VimInput.setMode("normal"); VimInput.clearCount();
  VimInput.handleKey("Digit2", false, false, false);
  assert.ok(VimInput.handleKey("Key_D", false, false, false) === null);
  var act = VimInput.handleKey("Key_D", false, false, false);
  assert.equal(act.type, "deleteBlock");
  assert.equal(act.count, 2);
});

check("2yy duplicates two blocks", () => {
  VimInput.setMode("normal"); VimInput.clearCount();
  VimInput.handleKey("Digit2", false, false, false);
  assert.ok(VimInput.handleKey("Key_Y", false, false, false) === null);
  var act = VimInput.handleKey("Key_Y", false, false, false);
  assert.equal(act.type, "duplicateBlock");
  assert.equal(act.count, 2);
});

check("3dd deletes three blocks", () => {
  VimInput.setMode("normal"); VimInput.clearCount();
  VimInput.handleKey("Digit3", false, false, false);
  assert.ok(VimInput.handleKey("Key_D", false, false, false) === null);
  var act = VimInput.handleKey("Key_D", false, false, false);
  assert.equal(act.type, "deleteBlock");
  assert.equal(act.count, 3);
});

// ---- mode transitions ------------------------------------------------------------

check("Escape resets to normal from operator", () => {
  VimInput.setMode("normal");
  VimInput.handleKey("Key_D", false, false, false); // enter operator
  assert.equal(VimInput.getMode(), "operator");
  VimInput.handleKey("Escape", false, false, false); // cancel
  assert.equal(VimInput.getMode(), "normal");
});

check("operator can be overridden (d then c = delete, c = clear? no: d then c = deleteBlock)", () => {
  VimInput.setMode("normal"); VimInput.clearCount();
  VimInput.handleKey("Key_D", false, false, false); // set delete operator
  var act = VimInput.handleKey("Key_C", false, false, false);
  // d + c = delete current block (c is not a special motion for delete)
  assert.equal(act.type, "deleteBlock");
});

// ---- ignored keys ------------------------------------------------------------------

check("Ctrl+N is ignored (window shortcut)", () => {
  VimInput.setMode("normal");
  var act = VimInput.handleKey("Key_N", true, false, false);
  assert.ok(act === null, "Ctrl keys should be ignored");
});

check("Shift+Tab is ignored", () => {
  VimInput.setMode("normal");
  var act = VimInput.handleKey("Tab", false, true, false);
  assert.ok(act === null, "Shift keys should be ignored");
});

// ---- summary -----------------------------------------------------------------------

console.log("\nVimInput: " + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
