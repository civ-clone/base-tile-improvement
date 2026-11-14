"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.availableRules = exports.deriveAvailableRules = exports.availableRulesFor = void 0;
const Requirement_1 = require("@civ-clone/core-requirement/Requirement");
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const Advance_1 = require("@civ-clone/core-science/Advance");
const Available_1 = require("@civ-clone/core-tile-improvement/Rules/Available");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const TileImprovement_1 = require("@civ-clone/core-tile-improvement/TileImprovement");
/**
 * The rule `entry` is played by: its tile improvement can go on a tile of one of the terrains it lists (`where`, any
 * terrain when it lists none), that doesn't have one already, with each tile improvement it `requires` on the tile,
 * each advance it `requires` discovered by the player building it, and each `Condition` it `requires` holding, as
 * `conditions` decides it. The entry's range is the tile, and an advance is the working player's.
 *
 * A tile improvement can be built by any one of its rules (`Available`'s consumers take any that passes), so each entry
 * is one way to build it, needing all of its targets. The criteria come in that order: the improvement, the terrain,
 * not already built, the improvements, the advances, then the conditions.
 *
 * An entry this can't play (`any` of its targets, a target that is neither a tile improvement, an advance nor a
 * `Condition` with a check in `conditions`) is refused rather than played wrongly. With no `conditions`, an entry plays
 * exactly as civ1-world's own deriver always did.
 */
const availableRulesFor = (entry, playerResearchRegistry = PlayerResearchRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, conditions = {}) => {
    if (entry.relation !== 'requires') {
        return [];
    }
    const Improvement = entry.subject, terrains = entry.where, isImprovement = (target) => Object.prototype.isPrototypeOf.call(TileImprovement_1.default, target), isAdvance = (target) => Object.prototype.isPrototypeOf.call(Advance_1.default, target), isCheckedCondition = (target) => target instanceof Requirement_1.Condition &&
        Object.prototype.hasOwnProperty.call(conditions, target.id);
    if (entry.mode !== 'all') {
        throw new TypeError(`'${entry.id}': a way to build a tile improvement needs all of its targets, so its mode must be 'all'.`);
    }
    const unplayable = entry.targets.filter((target) => !isImprovement(target) &&
        !isAdvance(target) &&
        !isCheckedCondition(target));
    if (unplayable.length > 0) {
        throw new TypeError(`'${entry.id}': a tile improvement can need other tile improvements and advances, not ${unplayable
            .map((target) => { var _a; return (_a = target.id) !== null && _a !== void 0 ? _a : target.name; })
            .join(', ')}.`);
    }
    const improvements = entry.targets.filter(isImprovement), advances = entry.targets.filter(isAdvance), checks = entry.targets.filter(isCheckedCondition).map((condition) => conditions[condition.id]);
    return [
        new Available_1.default(entry.id, new Criterion_1.default((tile, AvailableTileImprovement) => AvailableTileImprovement === Improvement), new Criterion_1.default((tile) => terrains === null ||
            terrains.some((TerrainType) => tile.terrain() instanceof TerrainType)), new Criterion_1.default((tile, AvailableTileImprovement) => !tileImprovementRegistry
            .getByTile(tile)
            .some((improvement) => improvement instanceof AvailableTileImprovement)), ...improvements.map((RequiredImprovement) => new Criterion_1.default((tile) => tileImprovementRegistry
            .getByTile(tile)
            .some((tileImprovement) => tileImprovement instanceof RequiredImprovement))), ...advances.map((RequiredAdvance) => new Criterion_1.default((tile, AvailableTileImprovement, player) => playerResearchRegistry
            .getByPlayer(player)
            .completed(RequiredAdvance))), ...checks.map((check) => new Criterion_1.default((tile, AvailableTileImprovement, player) => check(tile, AvailableTileImprovement, player)))),
    ];
};
exports.availableRulesFor = availableRulesFor;
/** A deriver for a game's `requirements`, making each entry's rule with `availableRulesFor`. */
const deriveAvailableRules = (playerResearchRegistry, tileImprovementRegistry, conditions = {}) => (entry) => (0, exports.availableRulesFor)(entry, playerResearchRegistry, tileImprovementRegistry, conditions);
exports.deriveAvailableRules = deriveAvailableRules;
/** The rules for every entry in `entries`, in order: for a rule registry without a game's `requirements` (tests). */
const availableRules = (entries, playerResearchRegistry = PlayerResearchRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, conditions = {}) => entries.flatMap((entry) => (0, exports.availableRulesFor)(entry, playerResearchRegistry, tileImprovementRegistry, conditions));
exports.availableRules = availableRules;
//# sourceMappingURL=available.js.map