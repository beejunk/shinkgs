// @flow
import { Howl, Howler } from "howler";
// $FlowFixMe: mp3 files not recognized
import playfulHit from "./playful_reveal_mute_hit_01.mp3";
// $FlowFixMe: mp3 files not recognized
import twoTone from "./two_tone_03b.mp3";
// $FlowFixMe: mp3 files not recognized
import stoneClick from "./stone_click.mp3";

Howler.autoUnlock = true;

export const SOUNDS = {
  CHALLENGE_PROPOSAL_RECEIVED: new Audio(playfulHit),
  DIRECT_MESSAGE_RECEIVED: new Audio(twoTone),
  STONE_PLACED: new Howl({
    src: stoneClick,
    sprite: {
      click: [1000, 500],
    },
    autoPlay: false,
  }),
};
