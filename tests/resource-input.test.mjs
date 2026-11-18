import test from "node:test";
import assert from "node:assert/strict";
import { currentHpInput, currentResourceInput } from "../src/rules/resource-input.mjs";

test("current HP and SP accept exact values or signed changes within resource limits", () => {
  for (const resource of ["HP", "SP"]) {
    const parse = value => currentResourceInput(value, 8, 4, resource);
    assert.equal(parse(" +2 "), 6);
    assert.equal(parse("−3"), 1);
    assert.equal(parse("7"), 7);
    assert.equal(parse("+99"), 8);
    assert.equal(parse("-99"), 0);
    assert.throws(() => parse("9"), new RegExp(`Current ${resource}`));
    assert.throws(() => parse("1.5"), new RegExp(`whole ${resource}`));
    assert.throws(() => parse(""), /cannot be empty/);
  }
  assert.equal(currentHpInput("-2", 8, 4), 2);
});
