import {
  Condition,
  Requirement,
} from '@civ-clone/core-requirement/Requirement';
import {
  availableRules,
  availableRulesFor,
  deriveAvailableRules,
} from '../lib/available';
import { Land, Water } from '@civ-clone/core-terrain/Types';
import Advance from '@civ-clone/core-science/Advance';
import Available from '@civ-clone/core-tile-improvement/Rules/Available';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerResearchRegistry from '@civ-clone/core-science/PlayerResearchRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { expect } from 'chai';
import { rowWorld } from './lib/world';

class Flat extends Land {}
class Rough extends Land {}
class Sea extends Water {}
class Ditch extends TileImprovement {}
class Track extends TileImprovement {}
class Rails extends TileImprovement {}
class Engineering extends Advance {}
class Steam extends Advance {}

const entry = (
  id: string,
  subject: typeof TileImprovement,
  targets: any[],
  where: any[] | undefined,
  extra: { mode?: 'all' | 'any'; relation?: any } = {}
): Requirement =>
  new Requirement({
    id,
    subject,
    relation: extra.relation ?? 'requires',
    targets,
    range: 'tile',
    where,
    mode: extra.mode,
  });

const setUp = async (conditions = {}) => {
  const ruleRegistry = new RuleRegistry(),
    playerResearchRegistry = new PlayerResearchRegistry(),
    tileImprovementRegistry = new TileImprovementRegistry(),
    world = await rowWorld([Flat, Rough, Sea], ruleRegistry),
    player = new Player(ruleRegistry),
    research = new PlayerResearch(player);

  playerResearchRegistry.register(research);

  const can = (
    tile: Tile,
    Improvement: typeof TileImprovement,
    rules: Available[]
  ): boolean =>
    rules.some((rule: Available): boolean =>
      rule.validate(tile, Improvement, player)
    );

  return {
    can,
    conditions,
    playerResearchRegistry,
    research,
    ruleRegistry,
    tileImprovementRegistry,
    world,
  };
};

describe('available', (): void => {
  it('plays an entry as civ1-world did: the improvement, the terrain, not built yet, the improvements, the advances', async (): Promise<void> => {
    const {
        can,
        playerResearchRegistry,
        research,
        tileImprovementRegistry,
        world,
      } = await setUp(),
      rules = availableRules(
        [
          entry('test:Ditch', Ditch, [], [Flat]),
          entry('test:Track', Track, [Engineering], undefined),
          entry('test:Rails', Rails, [Steam, Track], [Flat, Rough]),
        ],
        playerResearchRegistry,
        tileImprovementRegistry
      ),
      flat = world.get(0, 0),
      rough = world.get(1, 0),
      sea = world.get(2, 0);

    expect(rules.map((rule) => rule.id())).to.deep.equal([
      'test:Ditch',
      'test:Track',
      'test:Rails',
    ]);
    // Three criteria, then one per improvement and one per advance, as civ1-world's rules had.
    expect(
      rules.map((rule) => (rule as any)._criteria.criteria().length)
    ).to.deep.equal([3, 4, 5]);

    expect(can(flat, Ditch, rules)).to.true;
    expect(can(rough, Ditch, rules)).to.false;
    expect(can(sea, Ditch, rules)).to.false;

    // No `where`: any terrain, once the advance is known.
    expect(can(sea, Track, rules)).to.false;
    research.addAdvance(Engineering);
    expect(can(sea, Track, rules)).to.true;

    tileImprovementRegistry.register(new Ditch(flat));
    expect(can(flat, Ditch, rules)).to.false;

    expect(can(flat, Rails, rules)).to.false;
    tileImprovementRegistry.register(new Track(flat));
    expect(can(flat, Rails, rules)).to.false;
    research.addAdvance(Steam);
    expect(can(flat, Rails, rules)).to.true;
    expect(can(rough, Rails, rules)).to.false;
  });

  it('makes nothing of a relation other than requires', (): void => {
    expect(
      availableRulesFor(
        entry('test:x', Ditch, [Engineering], [Flat], {
          relation: 'excludedBy',
        })
      )
    ).to.deep.equal([]);
  });

  it("refuses 'any' and targets it can't play, with civ1-world's messages", (): void => {
    expect(() =>
      availableRulesFor(
        entry('test:any', Ditch, [Engineering, Steam], [Flat], { mode: 'any' })
      )
    ).to.throw(
      TypeError,
      "'test:any': a way to build a tile improvement needs all of its targets, so its mode must be 'all'."
    );

    expect(() =>
      availableRulesFor(
        entry('test:condition', Ditch, [new Condition('test:wet')], [Flat])
      )
    ).to.throw(
      TypeError,
      "'test:condition': a tile improvement can need other tile improvements and advances, not test:wet."
    );
  });

  it('plays a Condition with a check, after the advances', async (): Promise<void> => {
    const calls: string[] = [],
      {
        can,
        playerResearchRegistry,
        research,
        tileImprovementRegistry,
        world,
      } = await setUp(),
      conditions = {
        'test:wet': (tile: Tile, Improvement: typeof TileImprovement) => {
          calls.push(Improvement.name);

          return tile.x() === 0;
        },
      },
      rules = availableRules(
        [
          entry(
            'test:Ditch',
            Ditch,
            [Engineering, new Condition('test:wet')],
            [Flat, Rough]
          ),
        ],
        playerResearchRegistry,
        tileImprovementRegistry,
        conditions
      );

    expect(can(world.get(0, 0), Ditch, rules)).to.false;
    expect(calls).to.deep.equal([]);

    research.addAdvance(Engineering);
    expect(can(world.get(0, 0), Ditch, rules)).to.true;
    expect(can(world.get(1, 0), Ditch, rules)).to.false;
    expect(calls).to.deep.equal(['Ditch', 'Ditch']);

    // A condition the rule set has no check for is still refused.
    expect(() =>
      availableRulesFor(
        entry('test:other', Ditch, [new Condition('test:dry')], [Flat]),
        playerResearchRegistry,
        tileImprovementRegistry,
        conditions
      )
    ).to.throw(TypeError, 'not test:dry.');
  });

  it('derives the same rules for a game', async (): Promise<void> => {
    const { playerResearchRegistry, tileImprovementRegistry } = await setUp(),
      rules = deriveAvailableRules(
        playerResearchRegistry,
        tileImprovementRegistry
      )(entry('test:Ditch', Ditch, [], [Flat]));

    expect(rules.length).to.equal(1);
    expect(rules[0]).to.instanceOf(Available);
    expect(rules[0].id()).to.equal('test:Ditch');
  });
});
