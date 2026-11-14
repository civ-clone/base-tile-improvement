import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import Player from '@civ-clone/core-player/Player';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import Tile from '@civ-clone/core-world/Tile';
import Yield from '@civ-clone/core-yield/Yield';
/** Any yield type, including those whose constructor takes more than a value and a provider. */
export type YieldType = abstract new (...args: any[]) => Yield;
/** What `yields` add up to of `YieldType`. */
export declare const totalOf: (yields: Yield[], YieldType: YieldType) => number;
/** A criterion: the tile yields some `YieldType` (any amount, even 0). */
export declare const hasYield: (
  YieldType: YieldType
) => (tile: Tile, player: Player | null, yields: Yield[]) => boolean;
/**
 * An effect: adds `multiplier` times the tile's `YieldType`, rounded down, from `provider` (a railroad's half again).
 * It adds the yield even when that comes to 0.
 */
export declare const addMultiple: (
  YieldType: YieldType,
  multiplier: number,
  provider: string
) => (tile: Tile, player: Player | null, yields: Yield[]) => void;
/** An effect: halves the tile's `YieldType`, rounded up (pollution), adding the difference from `provider` if any. */
export declare const halveRoundingUp: (
  YieldType: YieldType,
  provider: string
) => (tile: Tile, player: Player | null, yields: Yield[]) => void;
/**
 * The government of `player`: `null` for no player (a tile asked about for nobody), or for a player with no government
 * yet, such as one being set up.
 */
export declare const playerGovernment: (
  player: Player | null,
  playerGovernmentRegistry?: PlayerGovernmentRegistry
) => PlayerGovernment | null;
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
export declare const governmentStep: (
  YieldType: typeof Yield,
  provider: string,
  step: GovernmentStep,
  playerGovernmentRegistry?: PlayerGovernmentRegistry
) => (tile: Tile, player: Player | null, yields: Yield[]) => void;
