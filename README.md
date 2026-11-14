# @civ-clone/base-tile-improvement

Building blocks for a rule set's tile improvements. The rule set keeps its own rules, ids, numbers and tables; this
package holds the mechanism, so each rule set doesn't carry its own copy.

- `lib/available`: the `Available` rules for a rule set's `Requirement` entries (`availableRulesFor`,
  `deriveAvailableRules`, `availableRules`). An entry says which terrains (`where`), tile improvements and advances a
  tile improvement needs. A rule set may also name `Condition`s (a river on the square, water nearby) and pass a check
  for each; an entry with no conditions plays exactly as civ1-world's deriver did.
- `lib/lifecycle`: what building, pillaging and removing a tile improvement does (`builtRules`, `pillagedRules`,
  `removedRules`, and the criteria and effects they're made of): register or unregister it, work the tile's yields out
  again, tell the client, and take off what a new improvement replaces.
- `lib/yieldModifiers`: effects for tile `YieldModifier` rules: a multiple of a yield (a railroad's half again), halving
  rounded up (pollution), and a government's step (base-government-tile-penalty, base-government-trade-bonus), with the
  player's government looked up the way civ1-world did.

A library: no `main`, nothing registers on import. Lifted from civ1-world for civ2-world (civ-clone/web-renderer#1008).
