"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removedRules = exports.pillagedRules = exports.builtRules = exports.removeImprovements = exports.hasImprovement = exports.isImprovement = exports.emit = exports.clearYieldCache = exports.unregister = exports.register = exports.isOnTile = exports.notAlreadyBuilt = void 0;
const Engine_1 = require("@civ-clone/core-engine/Engine");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const Built_1 = require("@civ-clone/core-tile-improvement/Rules/Built");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Pillaged_1 = require("@civ-clone/core-tile-improvement/Rules/Pillaged");
const Removed_1 = require("@civ-clone/core-tile-improvement/Rules/Removed");
// The pieces a rule set's `Built`, `Pillaged` and `Removed` rules are made of. Each takes `(tile, tileImprovement)`.
/** A criterion: the tile has no tile improvement of the same class as `tileImprovement` yet. */
const notAlreadyBuilt = (tileImprovementRegistry) => (tile, tileImprovement) => tileImprovementRegistry
    .getByTile(tile)
    .every((existingTileImprovement) => tileImprovement.constructor !== existingTileImprovement.constructor);
exports.notAlreadyBuilt = notAlreadyBuilt;
/** A criterion: `tileImprovement` is one of the tile's. */
const isOnTile = (tileImprovementRegistry) => (tile, tileImprovement) => tileImprovementRegistry.getByTile(tile).includes(tileImprovement);
exports.isOnTile = isOnTile;
/** An effect: registers `tileImprovement`. */
const register = (tileImprovementRegistry) => (tile, tileImprovement) => tileImprovementRegistry.register(tileImprovement);
exports.register = register;
/** An effect: unregisters `tileImprovement`. */
const unregister = (tileImprovementRegistry) => (tile, tileImprovement) => tileImprovementRegistry.unregister(tileImprovement);
exports.unregister = unregister;
/** An effect: the tile's yields are worked out again, for every player. */
const clearYieldCache = (tile) => tile.clearYieldCache(null);
exports.clearYieldCache = clearYieldCache;
/** An effect: emits `event` with the tile and the tile improvement on `engine`. */
const emit = (engine, event) => (tile, tileImprovement) => {
    engine.emit(event, tile, tileImprovement);
};
exports.emit = emit;
/** A criterion: `tileImprovement` is an `Improvement`. */
const isImprovement = (Improvement) => (tile, tileImprovement) => tileImprovement instanceof Improvement;
exports.isImprovement = isImprovement;
/** A criterion: the tile has a tile improvement of class `Improvement`. */
const hasImprovement = (tileImprovementRegistry, Improvement) => (tile) => tileImprovementRegistry
    .getByTile(tile)
    .some((tileImprovement) => tileImprovement instanceof Improvement);
exports.hasImprovement = hasImprovement;
/** An effect: unregisters the tile's tile improvements of class `Improvement`. */
const removeImprovements = (tileImprovementRegistry, Improvement) => (tile) => tileImprovementRegistry.unregister(...tileImprovementRegistry
    .getByTile(tile)
    .filter((tileImprovement) => tileImprovement instanceof Improvement));
exports.removeImprovements = removeImprovements;
/**
 * The `Built` rules, in this order: register the tile improvement unless the tile has one of its class, clear the
 * tile's yields, emit `tile-improvement:built`, then one rule for each of `replaces`.
 */
const builtRules = (replaces = [], tileImprovementRegistry = TileImprovementRegistry_1.instance, engine = Engine_1.instance) => [
    new Built_1.default(new Criterion_1.default((0, exports.notAlreadyBuilt)(tileImprovementRegistry)), new Effect_1.default((0, exports.register)(tileImprovementRegistry))),
    new Built_1.default(new Effect_1.default(exports.clearYieldCache)),
    new Built_1.default(new Effect_1.default((0, exports.emit)(engine, 'tile-improvement:built'))),
    ...replaces.map(([Improvement, ToRemove]) => new Built_1.default(new Criterion_1.default((0, exports.isImprovement)(Improvement)), new Criterion_1.default((0, exports.hasImprovement)(tileImprovementRegistry, ToRemove)), new Effect_1.default((0, exports.removeImprovements)(tileImprovementRegistry, ToRemove)))),
];
exports.builtRules = builtRules;
/** The `Pillaged` rules, in this order: unregister it if it's the tile's, clear the yields, emit `tile-improvement:pillaged`. */
const pillagedRules = (tileImprovementRegistry = TileImprovementRegistry_1.instance, engine = Engine_1.instance) => [
    new Pillaged_1.default(new Criterion_1.default((0, exports.isOnTile)(tileImprovementRegistry)), new Effect_1.default((0, exports.unregister)(tileImprovementRegistry))),
    new Pillaged_1.default(new Effect_1.default(exports.clearYieldCache)),
    new Pillaged_1.default(new Effect_1.default((0, exports.emit)(engine, 'tile-improvement:pillaged'))),
];
exports.pillagedRules = pillagedRules;
/**
 * The `Removed` rules, ids `<prefix>/unregister`, `<prefix>/clear-yield-cache` and `<prefix>/emit`, in that order:
 * unregister it if it's the tile's, clear the yields, emit `tile-improvement:removed`.
 */
const removedRules = (prefix, tileImprovementRegistry = TileImprovementRegistry_1.instance, engine = Engine_1.instance) => [
    new Removed_1.default(`${prefix}/unregister`, new Criterion_1.default((0, exports.isOnTile)(tileImprovementRegistry)), new Effect_1.default((0, exports.unregister)(tileImprovementRegistry))),
    new Removed_1.default(`${prefix}/clear-yield-cache`, new Effect_1.default(exports.clearYieldCache)),
    new Removed_1.default(`${prefix}/emit`, new Effect_1.default((0, exports.emit)(engine, 'tile-improvement:removed'))),
];
exports.removedRules = removedRules;
//# sourceMappingURL=lifecycle.js.map