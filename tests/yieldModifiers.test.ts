import {
  addMultiple,
  governmentStep,
  halveRoundingUp,
  hasYield,
  playerGovernment,
  totalOf,
} from '../lib/yieldModifiers';
import Player from '@civ-clone/core-player/Player';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import PlayerGovernmentRegistry from '@civ-clone/core-government/PlayerGovernmentRegistry';
import Tile from '@civ-clone/core-world/Tile';
import Yield from '@civ-clone/core-yield/Yield';
import { expect } from 'chai';

class Food extends Yield {}
class Trade extends Yield {}

const tile = {} as Tile;

describe('yieldModifiers', (): void => {
  it('totals one type and tells whether there is any', (): void => {
    const yields = [new Food(2), new Trade(1), new Food(1)];

    expect(totalOf(yields, Food)).to.equal(3);
    expect(hasYield(Trade)(tile, null, yields)).to.true;
    expect(hasYield(Trade)(tile, null, [new Food(0)])).to.false;
    expect(hasYield(Food)(tile, null, [new Food(0)])).to.true;
  });

  it('addMultiple adds the multiple rounded down, even when it is 0', (): void => {
    const yields = [new Food(3)];

    addMultiple(Food, 0.5, 'Railroad')(tile, null, yields);
    expect(yields.length).to.equal(2);
    expect(yields[1].value()).to.equal(1);
    expect(yields[1].values()[0][1]).to.equal('Railroad');

    const one = [new Food(1)];

    addMultiple(Food, 0.5, 'Railroad')(tile, null, one);
    expect(one.length).to.equal(2);
    expect(one[1].value()).to.equal(0);
  });

  it('halveRoundingUp halves rounding up, adding nothing when nothing changes', (): void => {
    const three = [new Food(3)],
      zero = [new Food(0)];

    halveRoundingUp(Food, 'Pollution')(tile, null, three);
    expect(totalOf(three, Food)).to.equal(2);
    expect(three[1].values()[0][1]).to.equal('Pollution');

    halveRoundingUp(Food, 'Pollution')(tile, null, zero);
    expect(zero.length).to.equal(1);
  });

  it('playerGovernment is null for no player, or a player with no government yet', (): void => {
    const registry = new PlayerGovernmentRegistry(),
      player = new Player();

    expect(playerGovernment(null, registry)).to.null;
    expect(playerGovernment(player, registry)).to.null;

    const government = new PlayerGovernment(player);

    registry.register(government);
    expect(playerGovernment(player, registry)).to.equal(government);
  });

  it('governmentStep adds what the step changes, from the provider', (): void => {
    const registry = new PlayerGovernmentRegistry(),
      player = new Player(),
      government = new PlayerGovernment(player),
      seen: (PlayerGovernment | null)[] = [],
      minusOneOverTwo = governmentStep(
        Food,
        'test:penalty',
        (YieldType, value, playerGovernment) => {
          seen.push(playerGovernment);

          return value > 2 ? value - 1 : value;
        },
        registry
      );

    registry.register(government);

    const three = [new Food(3)],
      two = [new Food(2)];

    minusOneOverTwo(tile, player, three);
    minusOneOverTwo(tile, null, two);

    expect(three.map((tileYield) => tileYield.value())).to.deep.equal([3, -1]);
    expect(three[1].values()[0][1]).to.equal('test:penalty');
    expect(two.length).to.equal(1);
    expect(seen).to.deep.equal([government, null]);
  });
});
