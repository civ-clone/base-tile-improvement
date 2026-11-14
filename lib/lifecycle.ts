import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import Built from '@civ-clone/core-tile-improvement/Rules/Built';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Pillaged from '@civ-clone/core-tile-improvement/Rules/Pillaged';
import Removed from '@civ-clone/core-tile-improvement/Rules/Removed';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';

// The pieces a rule set's `Built`, `Pillaged` and `Removed` rules are made of. Each takes `(tile, tileImprovement)`.

/** A criterion: the tile has no tile improvement of the same class as `tileImprovement` yet. */
export const notAlreadyBuilt =
  (tileImprovementRegistry: TileImprovementRegistry) =>
  (tile: Tile, tileImprovement: TileImprovement): boolean =>
    tileImprovementRegistry
      .getByTile(tile)
      .every(
        (existingTileImprovement: TileImprovement) =>
          tileImprovement.constructor !== existingTileImprovement.constructor
      );

/** A criterion: `tileImprovement` is one of the tile's. */
export const isOnTile =
  (tileImprovementRegistry: TileImprovementRegistry) =>
  (tile: Tile, tileImprovement: TileImprovement): boolean =>
    tileImprovementRegistry.getByTile(tile).includes(tileImprovement);

/** An effect: registers `tileImprovement`. */
export const register =
  (tileImprovementRegistry: TileImprovementRegistry) =>
  (tile: Tile, tileImprovement: TileImprovement): void =>
    tileImprovementRegistry.register(tileImprovement);

/** An effect: unregisters `tileImprovement`. */
export const unregister =
  (tileImprovementRegistry: TileImprovementRegistry) =>
  (tile: Tile, tileImprovement: TileImprovement): void =>
    tileImprovementRegistry.unregister(tileImprovement);

/** An effect: the tile's yields are worked out again, for every player. */
export const clearYieldCache = (tile: Tile): void => tile.clearYieldCache(null);

/** An effect: emits `event` with the tile and the tile improvement on `engine`. */
export const emit =
  (engine: Engine, event: string) =>
  (tile: Tile, tileImprovement: TileImprovement): void => {
    engine.emit(event, tile, tileImprovement);
  };

/** A criterion: `tileImprovement` is an `Improvement`. */
export const isImprovement =
  (Improvement: typeof TileImprovement) =>
  (tile: Tile, tileImprovement: TileImprovement): boolean =>
    tileImprovement instanceof Improvement;

/** A criterion: the tile has a tile improvement of class `Improvement`. */
export const hasImprovement =
  (
    tileImprovementRegistry: TileImprovementRegistry,
    Improvement: typeof TileImprovement
  ) =>
  (tile: Tile): boolean =>
    tileImprovementRegistry
      .getByTile(tile)
      .some(
        (tileImprovement: TileImprovement) =>
          tileImprovement instanceof Improvement
      );

/** An effect: unregisters the tile's tile improvements of class `Improvement`. */
export const removeImprovements =
  (
    tileImprovementRegistry: TileImprovementRegistry,
    Improvement: typeof TileImprovement
  ) =>
  (tile: Tile): void =>
    tileImprovementRegistry.unregister(
      ...tileImprovementRegistry
        .getByTile(tile)
        .filter(
          (tileImprovement: TileImprovement) =>
            tileImprovement instanceof Improvement
        )
    );

/** Building the first of a pair takes the second off the tile, as a mine does irrigation. */
export type Replaces = [typeof TileImprovement, typeof TileImprovement];

/**
 * The `Built` rules, in this order: register the tile improvement unless the tile has one of its class, clear the
 * tile's yields, emit `tile-improvement:built`, then one rule for each of `replaces`.
 */
export const builtRules = (
  replaces: Replaces[] = [],
  tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance,
  engine: Engine = engineInstance
): Built[] => [
  new Built(
    new Criterion(notAlreadyBuilt(tileImprovementRegistry)),
    new Effect(register(tileImprovementRegistry))
  ),
  new Built(new Effect(clearYieldCache)),
  new Built(new Effect(emit(engine, 'tile-improvement:built'))),
  ...replaces.map(
    ([Improvement, ToRemove]: Replaces): Built =>
      new Built(
        new Criterion(isImprovement(Improvement)),
        new Criterion(hasImprovement(tileImprovementRegistry, ToRemove)),
        new Effect(removeImprovements(tileImprovementRegistry, ToRemove))
      )
  ),
];

/** The `Pillaged` rules, in this order: unregister it if it's the tile's, clear the yields, emit `tile-improvement:pillaged`. */
export const pillagedRules = (
  tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance,
  engine: Engine = engineInstance
): Pillaged[] => [
  new Pillaged(
    new Criterion(isOnTile(tileImprovementRegistry)),
    new Effect(unregister(tileImprovementRegistry))
  ),
  new Pillaged(new Effect(clearYieldCache)),
  new Pillaged(new Effect(emit(engine, 'tile-improvement:pillaged'))),
];

/**
 * The `Removed` rules, ids `<prefix>/unregister`, `<prefix>/clear-yield-cache` and `<prefix>/emit`, in that order:
 * unregister it if it's the tile's, clear the yields, emit `tile-improvement:removed`.
 */
export const removedRules = (
  prefix: string,
  tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance,
  engine: Engine = engineInstance
): Removed[] => [
  new Removed(
    `${prefix}/unregister`,
    new Criterion(isOnTile(tileImprovementRegistry)),
    new Effect(unregister(tileImprovementRegistry))
  ),
  new Removed(`${prefix}/clear-yield-cache`, new Effect(clearYieldCache)),
  new Removed(
    `${prefix}/emit`,
    new Effect(emit(engine, 'tile-improvement:removed'))
  ),
];
