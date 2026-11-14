import { Requirement } from '@civ-clone/core-requirement/Requirement';
import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import Available from '@civ-clone/core-tile-improvement/Rules/Available';
import { Deriver } from '@civ-clone/core-requirement/RequirementRegistry';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
/**
 * How a rule set decides one of its `Condition`s for a tile improvement on `tile` built by `player`: a river on the
 * square, water nearby, and so on. Keyed by the condition's id.
 */
export type ConditionCheck = (
  tile: Tile,
  AvailableTileImprovement: typeof TileImprovement,
  player: Player
) => boolean;
export type ConditionChecks = {
  [id: string]: ConditionCheck;
};
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
export declare const availableRulesFor: (
  entry: Requirement,
  playerResearchRegistry?: PlayerResearchRegistry,
  tileImprovementRegistry?: TileImprovementRegistry,
  conditions?: ConditionChecks
) => Available[];
/** A deriver for a game's `requirements`, making each entry's rule with `availableRulesFor`. */
export declare const deriveAvailableRules: (
  playerResearchRegistry: PlayerResearchRegistry,
  tileImprovementRegistry: TileImprovementRegistry,
  conditions?: ConditionChecks
) => Deriver;
/** The rules for every entry in `entries`, in order: for a rule registry without a game's `requirements` (tests). */
export declare const availableRules: (
  entries: Requirement[],
  playerResearchRegistry?: PlayerResearchRegistry,
  tileImprovementRegistry?: TileImprovementRegistry,
  conditions?: ConditionChecks
) => Available[];
