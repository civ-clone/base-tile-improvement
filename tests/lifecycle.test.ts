import { builtRules, pillagedRules, removedRules } from '../lib/lifecycle';
import Built from '@civ-clone/core-tile-improvement/Rules/Built';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Engine from '@civ-clone/core-engine/Engine';
import { Land } from '@civ-clone/core-terrain/Types';
import Pillaged from '@civ-clone/core-tile-improvement/Rules/Pillaged';
import Removed from '@civ-clone/core-tile-improvement/Rules/Removed';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import TileYield from '@civ-clone/core-world/Rules/Yield';
import Yield from '@civ-clone/core-yield/Yield';
import { expect } from 'chai';
import { rowWorld } from './lib/world';

class Flat extends Land {}
class Ditch extends TileImprovement {}
class Shaft extends TileImprovement {}
class Track extends TileImprovement {}
class Food extends Yield {}

const setUp = async () => {
  const ruleRegistry = new RuleRegistry(),
    tileImprovementRegistry = new TileImprovementRegistry(),
    engine = new Engine(),
    events: [string, Tile, TileImprovement][] = [],
    world = await rowWorld([Flat], ruleRegistry),
    tile = world.get(0, 0),
    food = (): number =>
      tile.yields().reduce((total, tileYield) => total + tileYield.value(), 0);

  // A ditch gives 1 food, so the yield cache shows whether it was cleared.
  ruleRegistry.register(
    new TileYield(
      new Criterion((tile: Tile): boolean =>
        tileImprovementRegistry
          .getByTile(tile)
          .some((improvement) => improvement instanceof Ditch)
      ),
      new Effect((): Yield => new Food(1, Ditch.name))
    )
  );

  ['built', 'pillaged', 'removed'].forEach((event) =>
    engine.on(`tile-improvement:${event}`, (tile: Tile, improvement) =>
      events.push([event, tile, improvement])
    )
  );

  return { engine, events, food, ruleRegistry, tile, tileImprovementRegistry };
};

describe('lifecycle', (): void => {
  it('builtRules: registers once, refreshes the yields, emits, then each replacement, in that order', async (): Promise<void> => {
    const {
        engine,
        events,
        food,
        ruleRegistry,
        tile,
        tileImprovementRegistry,
      } = await setUp(),
      rules = builtRules(
        [
          [Shaft, Ditch],
          [Ditch, Shaft],
        ],
        tileImprovementRegistry,
        engine
      );

    // civ1-world's shape: three rules with no ids, then one per replacement.
    expect(rules.length).to.equal(5);
    expect(rules.every((rule) => rule instanceof Built)).to.true;
    expect(rules.map((rule) => rule.id())).to.deep.equal([
      null,
      null,
      null,
      null,
      null,
    ]);

    ruleRegistry.register(...rules);

    expect(food()).to.equal(0);

    const ditch = new Ditch(tile, ruleRegistry);

    expect(tileImprovementRegistry.getByTile(tile)).to.deep.equal([ditch]);
    expect(food()).to.equal(1);
    expect(events).to.deep.equal([['built', tile, ditch]]);

    // A second of the same class isn't registered, but is still announced, as in civ1-world.
    new Ditch(tile, ruleRegistry);
    expect(tileImprovementRegistry.getByTile(tile)).to.deep.equal([ditch]);
    expect(events.length).to.equal(2);

    const track = new Track(tile, ruleRegistry);

    expect(tileImprovementRegistry.getByTile(tile)).to.deep.equal([
      ditch,
      track,
    ]);

    // A shaft replaces the ditch.
    const shaft = new Shaft(tile, ruleRegistry);

    expect(tileImprovementRegistry.getByTile(tile)).to.deep.equal([
      track,
      shaft,
    ]);
  });

  it('pillagedRules: unregisters it if it is the tile’s, refreshes the yields and emits', async (): Promise<void> => {
    const {
        engine,
        events,
        food,
        ruleRegistry,
        tile,
        tileImprovementRegistry,
      } = await setUp(),
      rules = pillagedRules(tileImprovementRegistry, engine);

    expect(rules.length).to.equal(3);
    expect(rules.every((rule) => rule instanceof Pillaged)).to.true;

    ruleRegistry.register(...builtRules([], tileImprovementRegistry, engine));
    ruleRegistry.register(...rules);

    const ditch = new Ditch(tile, ruleRegistry);

    expect(food()).to.equal(1);

    ruleRegistry.process(Pillaged, tile, ditch);

    expect(tileImprovementRegistry.getByTile(tile)).to.deep.equal([]);
    expect(food()).to.equal(0);
    expect(events.map(([event]) => event)).to.deep.equal(['built', 'pillaged']);
  });

  it('removedRules: three rules with civ1-world’s id suffixes, under the given prefix', async (): Promise<void> => {
    const {
        engine,
        events,
        food,
        ruleRegistry,
        tile,
        tileImprovementRegistry,
      } = await setUp(),
      rules = removedRules(
        'civ1-world:tile-improvement/removed',
        tileImprovementRegistry,
        engine
      );

    expect(rules.every((rule) => rule instanceof Removed)).to.true;
    expect(rules.map((rule) => rule.id())).to.deep.equal([
      'civ1-world:tile-improvement/removed/unregister',
      'civ1-world:tile-improvement/removed/clear-yield-cache',
      'civ1-world:tile-improvement/removed/emit',
    ]);

    ruleRegistry.register(...builtRules([], tileImprovementRegistry, engine));
    ruleRegistry.register(...rules);

    const ditch = new Ditch(tile, ruleRegistry);

    expect(food()).to.equal(1);

    ruleRegistry.process(Removed, tile, ditch);

    expect(tileImprovementRegistry.getByTile(tile)).to.deep.equal([]);
    expect(food()).to.equal(0);
    expect(events[1]).to.deep.equal(['removed', tile, ditch]);
  });
});
