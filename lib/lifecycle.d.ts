import { Engine } from '@civ-clone/core-engine/Engine';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import Built from '@civ-clone/core-tile-improvement/Rules/Built';
import Pillaged from '@civ-clone/core-tile-improvement/Rules/Pillaged';
import Removed from '@civ-clone/core-tile-improvement/Rules/Removed';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
/** A criterion: the tile has no tile improvement of the same class as `tileImprovement` yet. */
export declare const notAlreadyBuilt: (
  tileImprovementRegistry: TileImprovementRegistry
) => (tile: Tile, tileImprovement: TileImprovement) => boolean;
/** A criterion: `tileImprovement` is one of the tile's. */
export declare const isOnTile: (
  tileImprovementRegistry: TileImprovementRegistry
) => (tile: Tile, tileImprovement: TileImprovement) => boolean;
/** An effect: registers `tileImprovement`. */
export declare const register: (
  tileImprovementRegistry: TileImprovementRegistry
) => (tile: Tile, tileImprovement: TileImprovement) => void;
/** An effect: unregisters `tileImprovement`. */
export declare const unregister: (
  tileImprovementRegistry: TileImprovementRegistry
) => (tile: Tile, tileImprovement: TileImprovement) => void;
/** An effect: the tile's yields are worked out again, for every player. */
export declare const clearYieldCache: (tile: Tile) => void;
/** An effect: emits `event` with the tile and the tile improvement on `engine`. */
export declare const emit: (
  engine: Engine,
  event: string
) => (tile: Tile, tileImprovement: TileImprovement) => void;
/** A criterion: `tileImprovement` is an `Improvement`. */
export declare const isImprovement: (
  Improvement: typeof TileImprovement
) => (tile: Tile, tileImprovement: TileImprovement) => boolean;
/** A criterion: the tile has a tile improvement of class `Improvement`. */
export declare const hasImprovement: (
  tileImprovementRegistry: TileImprovementRegistry,
  Improvement: typeof TileImprovement
) => (tile: Tile) => boolean;
/** An effect: unregisters the tile's tile improvements of class `Improvement`. */
export declare const removeImprovements: (
  tileImprovementRegistry: TileImprovementRegistry,
  Improvement: typeof TileImprovement
) => (tile: Tile) => void;
/** Building the first of a pair takes the second off the tile, as a mine does irrigation. */
export type Replaces = [typeof TileImprovement, typeof TileImprovement];
/**
 * The `Built` rules, in this order: register the tile improvement unless the tile has one of its class, clear the
 * tile's yields, emit `tile-improvement:built`, then one rule for each of `replaces`.
 */
export declare const builtRules: (
  replaces?: Replaces[],
  tileImprovementRegistry?: TileImprovementRegistry,
  engine?: Engine
) => Built[];
/** The `Pillaged` rules, in this order: unregister it if it's the tile's, clear the yields, emit `tile-improvement:pillaged`. */
export declare const pillagedRules: (
  tileImprovementRegistry?: TileImprovementRegistry,
  engine?: Engine
) => Pillaged[];
/**
 * The `Removed` rules, ids `<prefix>/unregister`, `<prefix>/clear-yield-cache` and `<prefix>/emit`, in that order:
 * unregister it if it's the tile's, clear the yields, emit `tile-improvement:removed`.
 */
export declare const removedRules: (
  prefix: string,
  tileImprovementRegistry?: TileImprovementRegistry,
  engine?: Engine
) => Removed[];
