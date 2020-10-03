// @flow
import React, { useState, useEffect, useRef } from "react";
import { SOUNDS } from "../../sound";
import type { ClockState, GameRules } from "../../model";

function formatTime(time: ?number) {
  if (typeof time !== "number") {
    return "--";
  }
  if (time < 0) {
    time = 0;
  }
  let mins = Math.floor(time / 60);
  let secs = Math.ceil(time - mins * 60);
  if (secs === 60) {
    mins += 1;
    secs = 0;
  }
  return "" + mins + ":" + (secs < 10 ? "0" : "") + secs;
}

// Hacky compensation for network/rendering lag
const TIME_SKEW = 300;

type TimeCountdownProps = {
  nodeId: ?number,
  clock: ClockState,
  byoYomiTime: ?number,
  byoYomiPeriods: ?number,
  byoYomiStones: ?number,
};

type GameClockState = {
  seconds: ?number,
  periods: ?number,
  stones: ?number,
};

function TimeCountdown(props: TimeCountdownProps) {
  let { byoYomiTime, byoYomiPeriods, byoYomiStones, clock, nodeId } = props;

  let [clockState, setClockState] = useState<GameClockState>({
    seconds: clock.time || 0,
    periods: clock.periodsLeft,
    stones: clock.stonesLeft,
  });

  let startTime = useRef(new Date().getTime() - TIME_SKEW);
  let intervalId = useRef(null);
  let previousSeconds = useRef(null);

  useEffect(() => {
    startTime.current = new Date().getTime() - TIME_SKEW;

    setClockState({
      seconds: clock.time || 0,
      periods: clock.periodsLeft,
      stones: clock.stonesLeft,
    });
  }, [nodeId, clock.time, clock.periodsLeft, clock.stonesLeft]);

  useEffect(() => {
    intervalId.current = setInterval(() => {
      let secondsElapsed = (Date.now() - startTime.current) / 1000;
      let mainTime = (clock.time || 0) - secondsElapsed;
      let periods = clock.periodsLeft;
      let stones = clock.stonesLeft;
      let seconds;
      if (mainTime > 0) {
        seconds = mainTime;
      } else if (mainTime < 0 && byoYomiTime) {
        if (typeof periods === "number" && byoYomiPeriods) {
          let periodsLeft = periods ? periods - 1 : byoYomiPeriods;
          // Byo yomi overtime
          periods = Math.max(
            0,
            periodsLeft - Math.floor(-mainTime / byoYomiTime)
          );
          seconds = periods
            ? byoYomiTime + mainTime + byoYomiTime * (periodsLeft - periods)
            : 0;
        } else if (stones === 0 && byoYomiStones) {
          // Canadian overtime
          stones = byoYomiStones;
          seconds = byoYomiTime + mainTime;
        } else {
          seconds = 0;
        }
      } else {
        seconds = 0;
      }

      setClockState({ seconds, periods, stones });
    }, 100);

    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [
    byoYomiPeriods,
    byoYomiStones,
    byoYomiTime,
    clock.periodsLeft,
    clock.stonesLeft,
    clock.time,
  ]);

  useEffect(() => {
    if (
      clock.running &&
      !clock.paused &&
      typeof clockState.seconds === "number"
    ) {
      let sd =
        clockState.periods === 1 ||
        (!clockState.periods && clockState.stones) ||
        (!clockState.periods && !clockState.stones && clockState.seconds);
      let currentSeconds = Math.ceil(clockState.seconds);

      if (previousSeconds.current !== currentSeconds) {
        if (
          sd &&
          previousSeconds.current &&
          previousSeconds.current > currentSeconds
        ) {
          if (currentSeconds <= 10 && currentSeconds > 3) {
            SOUNDS.EFFECTS.play("beep");
          }

          if (currentSeconds <= 3) {
            SOUNDS.EFFECTS.play("beepbeep");
          }
        }

        previousSeconds.current = currentSeconds;
      }
    }
  }, [
    clock.running,
    clock.paused,
    clock.time,
    clockState.periods,
    clockState.seconds,
    clockState.stones,
  ]);

  let seconds;
  let periods;
  let stones;

  if (clock.running && !clock.paused && typeof clock.time === "number") {
    seconds = clockState.seconds;
    periods = clockState.periods;
    stones = clockState.stones;
  } else {
    seconds = clock.time;
    periods = clock.periodsLeft;
    stones = clock.stonesLeft;
  }

  let timeQualifier;
  let sd;

  if (periods !== undefined) {
    timeQualifier = periods === 1 ? "SD" : periods ? ` (${periods})` : "";
    sd = periods === 1;
  } else if (stones) {
    timeQualifier = " / " + stones;
    sd = true;
  } else if (seconds && stones === undefined) {
    timeQualifier = " SD";
    sd = true;
  }

  let className =
    "TimeCountdown" +
    (sd && typeof seconds === "number" && seconds < 3
      ? " TimeCountdown-urgent"
      : "");

  return (
    <div className={className}>
      {formatTime(seconds)} {timeQualifier}
    </div>
  );
}

type Props = {
  nodeId: ?number,
  active: boolean,
  clock: ClockState,
  timeLeft: number,
  gameRules?: ?GameRules,
};

export default function GameClock(props: Props) {
  let { nodeId, active, clock, timeLeft, gameRules } = props;
  let className =
    "GameClock " +
    ((active ? "GameClock-active" : "GameClock-inactive") +
      (active && clock.running && !clock.paused ? " GameClock-running" : "") +
      (clock.paused ? " GameClock-paused" : ""));

  let byoYomiTime;
  let byoYomiPeriods;
  let byoYomiStones;

  if (gameRules) {
    byoYomiTime = gameRules.byoYomiTime;
    byoYomiPeriods = gameRules.byoYomiPeriods;
    byoYomiStones = gameRules.byoYomiStones;
  }

  return (
    <div className={className}>
      <div className="GameClock-time">
        {active ? (
          <TimeCountdown
            nodeId={nodeId}
            clock={clock}
            byoYomiTime={byoYomiTime}
            byoYomiPeriods={byoYomiPeriods}
            byoYomiStones={byoYomiStones}
          />
        ) : (
          <div className="GameClock-time-frozen">{formatTime(timeLeft)}</div>
        )}
      </div>
    </div>
  );
}
