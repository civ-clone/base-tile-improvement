"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.governmentStep = exports.playerGovernment = exports.halveRoundingUp = exports.addMultiple = exports.hasYield = exports.totalOf = void 0;
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const make = (YieldType, value, provider) => new YieldType(value, provider);
/** What `yields` add up to of `YieldType`. */
const totalOf = (yields, YieldType) => yields
    .filter((tileYield) => tileYield instanceof YieldType)
    .reduce((total, tileYield) => total + tileYield.value(), 0);
exports.totalOf = totalOf;
/** A criterion: the tile yields some `YieldType` (any amount, even 0). */
const hasYield = (YieldType) => (tile, player, yields) => yields.some((tileYield) => tileYield instanceof YieldType);
exports.hasYield = hasYield;
/**
 * An effect: adds `multiplier` times the tile's `YieldType`, rounded down, from `provider` (a railroad's half again).
 * It adds the yield even when that comes to 0.
 */
const addMultiple = (YieldType, multiplier, provider) => (tile, player, yields) => {
    yields.push(make(YieldType, Math.floor((0, exports.totalOf)(yields, YieldType) * multiplier), provider));
};
exports.addMultiple = addMultiple;
/** An effect: halves the tile's `YieldType`, rounded up (pollution), adding the difference from `provider` if any. */
const halveRoundingUp = (YieldType, provider) => (tile, player, yields) => {
    const currentTotal = (0, exports.totalOf)(yields, YieldType), halved = Math.ceil(currentTotal / 2);
    if (halved === currentTotal) {
        return;
    }
    yields.push(make(YieldType, halved - currentTotal, provider));
};
exports.halveRoundingUp = halveRoundingUp;
/**
 * The government of `player`: `null` for no player (a tile asked about for nobody), or for a player with no government
 * yet, such as one being set up.
 */
const playerGovernment = (player, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance) => {
    if (player === null) {
        return null;
    }
    try {
        return playerGovernmentRegistry.getByPlayer(player);
    }
    catch (e) {
        if (e instanceof TypeError &&
            e.message.match(/Wrong number of PlayerGovernments/)) {
            return null;
        }
        throw e;
    }
};
exports.playerGovernment = playerGovernment;
/**
 * An effect: `step` adjusts the tile's `YieldType` under the player's government, and the difference, if any, is added
 * from `provider`.
 */
const governmentStep = (YieldType, provider, step, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance) => (tile, player, yields) => {
    const currentTotal = (0, exports.totalOf)(yields, YieldType), adjusted = step(YieldType, currentTotal, (0, exports.playerGovernment)(player, playerGovernmentRegistry));
    if (adjusted === currentTotal) {
        return;
    }
    yields.push(new YieldType(adjusted - currentTotal, provider));
};
exports.governmentStep = governmentStep;
//# sourceMappingURL=yieldModifiers.js.map