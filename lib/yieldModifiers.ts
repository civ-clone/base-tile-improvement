import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import Player from '@civ-clone/core-player/Player';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import Tile from '@civ-clone/core-world/Tile';
import Yield from '@civ-clone/core-yield/Yield';

// The pieces of a rule set's tile `YieldModifier` rules, each taking `(tile, player, yields)`. A modifier adds its
//  change as a separate yield naming what made it (the provider), so a city can find what the tile yielded before it.

/** Any yield type, including those whose constructor takes more than a value and a provider. */
export type YieldType = abstract new (...args: any[]) => Yield;

const make = (YieldType: YieldType, value: number, provider: string): Yield =>
  new (YieldType as unknown as typeof Yield)(value, provider);

/** What `yields` add up to of `YieldType`. */
export const totalOf = (yields: Yield[], YieldType: YieldType): number =>
  yields
    .filter((tileYield) => tileYield instanceof YieldType)
    .reduce((total, tileYield) => total + tileYield.value(), 0);

/** A criterion: the tile yields some `YieldType` (any amount, even 0). */
export const hasYield =
  (YieldType: YieldType) =>
  (tile: Tile, player: Player | null, yields: Yield[]): boolean =>
    yields.some((tileYield) => tileYield instanceof YieldType);

/**
 * An effect: adds `multiplier` times the tile's `YieldType`, rounded down, from `provider` (a railroad's half again).
 * It adds the yield even when that comes to 0.
 */
export const addMultiple =
  (YieldType: YieldType, multiplier: number, provider: string) =>
  (tile: Tile, player: Player | null, yields: Yield[]): void => {
    yields.push(
      make(
        YieldType,
        Math.floor(totalOf(yields, YieldType) * multiplier),
        provider
      )
    );
  };

/** An effect: halves the tile's `YieldType`, rounded up (pollution), adding the difference from `provider` if any. */
export const halveRoundingUp =
  (YieldType: YieldType, provider: string) =>
  (tile: Tile, player: Player | null, yields: Yield[]): void => {
    const currentTotal = totalOf(yields, YieldType),
      halved = Math.ceil(currentTotal / 2);

    if (halved === currentTotal) {
      return;
    }

    yields.push(make(YieldType, halved - currentTotal, provider));
  };

/**
 * The government of `player`: `null` for no player (a tile asked about for nobody), or for a player with no government
 * yet, such as one being set up.
 */
export const playerGovernment = (
  player: Player | null,
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance
): PlayerGovernment | null => {
  if (player === null) {
    return null;
  }

  try {
    return playerGovernmentRegistry.getByPlayer(player);
  } catch (e) {
    if (
      e instanceof TypeError &&
      e.message.match(/Wrong number of PlayerGovernments/)
    ) {
      return null;
    }

    throw e;
  }
};

/** What a government step makes of one of a tile's yields (base-government-tile-penalty, -trade-bonus). */
export type GovernmentStep = (
  YieldType: typeof Yield,
  value: number,
  government: PlayerGovernment | null
) => number;

/**
 * An effect: `step` adjusts the tile's `YieldType` under the player's government, and the difference, if any, is added
 * from `provider`.
 */
export const governmentStep =
  (
    YieldType: typeof Yield,
    provider: string,
    step: GovernmentStep,
    playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance
  ) =>
  (tile: Tile, player: Player | null, yields: Yield[]): void => {
    const currentTotal = totalOf(yields, YieldType),
      adjusted = step(
        YieldType,
        currentTotal,
        playerGovernment(player, playerGovernmentRegistry)
      );

    if (adjusted === currentTotal) {
      return;
    }

    yields.push(new YieldType(adjusted - currentTotal, provider));
  };
