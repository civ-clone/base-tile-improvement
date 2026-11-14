import Generator from '@civ-clone/core-world-generator/Generator';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Terrain from '@civ-clone/core-terrain/Terrain';
import World from '@civ-clone/core-world/World';
/** A row of tiles, one of each terrain given, in order. */
export declare class RowGenerator extends Generator {
  private readonly _terrains;
  constructor(terrains: Terrain[]);
  generate(): Promise<Terrain[]>;
}
export declare const rowWorld: (
  TerrainTypes: (typeof Terrain)[],
  ruleRegistry: RuleRegistry
) => Promise<World>;
