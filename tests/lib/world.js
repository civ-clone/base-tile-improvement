"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rowWorld = exports.RowGenerator = void 0;
const Generator_1 = require("@civ-clone/core-world-generator/Generator");
const World_1 = require("@civ-clone/core-world/World");
/** A row of tiles, one of each terrain given, in order. */
class RowGenerator extends Generator_1.default {
    constructor(terrains) {
        super(1, terrains.length);
        this._terrains = terrains;
    }
    generate() {
        return Promise.resolve(this._terrains);
    }
}
exports.RowGenerator = RowGenerator;
const rowWorld = async (TerrainTypes, ruleRegistry) => {
    const world = new World_1.default(new RowGenerator(TerrainTypes.map((TerrainType) => new TerrainType(ruleRegistry))), ruleRegistry);
    await world.build();
    return world;
};
exports.rowWorld = rowWorld;
//# sourceMappingURL=world.js.map