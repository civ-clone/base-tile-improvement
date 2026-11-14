import Generator from '@civ-clone/core-world-generator/Generator';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Terrain from '@civ-clone/core-terrain/Terrain';
import World from '@civ-clone/core-world/World';

/** A row of tiles, one of each terrain given, in order. */
export class RowGenerator extends Generator {
  private readonly _terrains: Terrain[];

  constructor(terrains: Terrain[]) {
    super(1, terrains.length);

    this._terrains = terrains;
  }

  generate(): Promise<Terrain[]> {
    return Promise.resolve(this._terrains);
  }
}

export const rowWorld = async (
  TerrainTypes: (typeof Terrain)[],
  ruleRegistry: RuleRegistry
): Promise<World> => {
  const world = new World(
    new RowGenerator(
      TerrainTypes.map(
        (TerrainType: typeof Terrain): Terrain => new TerrainType(ruleRegistry)
      )
    ),
    ruleRegistry
  );

  await world.build();

  return world;
};
