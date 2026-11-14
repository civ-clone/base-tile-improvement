import {
  Condition,
  Requirement,
  Target,
} from '@civ-clone/core-requirement/Requirement';
import {
  PlayerResearchRegistry,
  instance as playerResearchRegistryInstance,
} from '@civ-clone/core-science/PlayerResearchRegistry';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import Advance from '@civ-clone/core-science/Advance';
import Available from '@civ-clone/core-tile-improvement/Rules/Available';
import Criterion from '@civ-clone/core-rule/Criterion';
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

export type ConditionChecks = { [id: string]: ConditionCheck };

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
export const availableRulesFor = (
  entry: Requirement,
  playerResearchRegistry: PlayerResearchRegistry = playerResearchRegistryInstance,
  tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance,
  conditions: ConditionChecks = {}
): Available[] => {
  if (entry.relation !== 'requires') {
    return [];
  }

  const Improvement = entry.subject as typeof TileImprovement,
    terrains = entry.where,
    isImprovement = (target: Target): boolean =>
      Object.prototype.isPrototypeOf.call(TileImprovement, target),
    isAdvance = (target: Target): boolean =>
      Object.prototype.isPrototypeOf.call(Advance, target),
    isCheckedCondition = (target: Target): boolean =>
      target instanceof Condition &&
      Object.prototype.hasOwnProperty.call(conditions, target.id);

  if (entry.mode !== 'all') {
    throw new TypeError(
      `'${entry.id}': a way to build a tile improvement needs all of its targets, so its mode must be 'all'.`
    );
  }

  const unplayable = entry.targets.filter(
    (target: Target): boolean =>
      !isImprovement(target) &&
      !isAdvance(target) &&
      !isCheckedCondition(target)
  );

  if (unplayable.length > 0) {
    throw new TypeError(
      `'${
        entry.id
      }': a tile improvement can need other tile improvements and advances, not ${unplayable
        .map((target: any): string => target.id ?? target.name)
        .join(', ')}.`
    );
  }

  const improvements = entry.targets.filter(
      isImprovement
    ) as (typeof TileImprovement)[],
    advances = entry.targets.filter(isAdvance) as (typeof Advance)[],
    checks = (entry.targets.filter(isCheckedCondition) as Condition[]).map(
      (condition: Condition): ConditionCheck => conditions[condition.id]
    );

  return [
    new Available(
      entry.id,
      new Criterion(
        (
          tile: Tile,
          AvailableTileImprovement: typeof TileImprovement
        ): boolean => AvailableTileImprovement === Improvement
      ),
      new Criterion(
        (tile: Tile): boolean =>
          terrains === null ||
          terrains.some((TerrainType) => tile.terrain() instanceof TerrainType)
      ),
      new Criterion(
        (
          tile: Tile,
          AvailableTileImprovement: typeof TileImprovement
        ): boolean =>
          !tileImprovementRegistry
            .getByTile(tile)
            .some(
              (improvement: TileImprovement): boolean =>
                improvement instanceof AvailableTileImprovement
            )
      ),
      ...improvements.map(
        (RequiredImprovement: typeof TileImprovement): Criterion =>
          new Criterion((tile: Tile): boolean =>
            tileImprovementRegistry
              .getByTile(tile)
              .some(
                (tileImprovement) =>
                  tileImprovement instanceof RequiredImprovement
              )
          )
      ),
      ...advances.map(
        (RequiredAdvance: typeof Advance): Criterion =>
          new Criterion(
            (
              tile: Tile,
              AvailableTileImprovement: typeof TileImprovement,
              player: Player
            ): boolean =>
              playerResearchRegistry
                .getByPlayer(player)
                .completed(RequiredAdvance)
          )
      ),
      ...checks.map(
        (check: ConditionCheck): Criterion =>
          new Criterion(
            (
              tile: Tile,
              AvailableTileImprovement: typeof TileImprovement,
              player: Player
            ): boolean => check(tile, AvailableTileImprovement, player)
          )
      )
    ),
  ];
};

/** A deriver for a game's `requirements`, making each entry's rule with `availableRulesFor`. */
export const deriveAvailableRules =
  (
    playerResearchRegistry: PlayerResearchRegistry,
    tileImprovementRegistry: TileImprovementRegistry,
    conditions: ConditionChecks = {}
  ): Deriver =>
  (entry: Requirement): Available[] =>
    availableRulesFor(
      entry,
      playerResearchRegistry,
      tileImprovementRegistry,
      conditions
    );

/** The rules for every entry in `entries`, in order: for a rule registry without a game's `requirements` (tests). */
export const availableRules = (
  entries: Requirement[],
  playerResearchRegistry: PlayerResearchRegistry = playerResearchRegistryInstance,
  tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance,
  conditions: ConditionChecks = {}
): Available[] =>
  entries.flatMap((entry: Requirement): Available[] =>
    availableRulesFor(
      entry,
      playerResearchRegistry,
      tileImprovementRegistry,
      conditions
    )
  );
