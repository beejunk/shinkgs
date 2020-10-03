// @flow
import React, { useEffect, useState, useRef } from "react";
import Board from "./Board";
import type {
  GameChannel,
  GameNode,
  GameTree,
  Point,
  BoardPointMark,
  PlayerColor,
} from "../../model/types";
import { SOUNDS } from "../../sound";

type Props = {
  game: GameChannel,
  playing?: boolean,
  onClickPoint?: (
    game: GameChannel,
    loc: Point,
    color?: ?PlayerColor,
    mark?: ?BoardPointMark
  ) => any,
};

type BoardStyles = {
  boardWidth: ?number,
  marginTop: number,
};

function getLastNode(tree: GameTree): GameNode {
  let nodeIds = Object.keys(tree.nodes);
  let lastNodeId = Number(nodeIds[nodeIds.length - 1]);

  return tree.nodes[lastNodeId];
}

export default function BoardContainer(props: Props) {
  let { game, onClickPoint } = props;
  let { tree } = game;
  let lastNode = tree && getLastNode(tree);
  let board;
  let markup;

  let [boardStyles, setBoardStyles] = useState<BoardStyles>({
    boardWidth: null,
    marginTop: 0,
  });
  let { boardWidth, marginTop } = boardStyles;

  let containerRef = useRef(null);
  let prevLastNodeRef = useRef(lastNode);

  function setBoardWidth() {
    if (containerRef.current) {
      // Note: this is tightly coupled to the CSS layout
      let containerEl = containerRef.current;
      let containerWidth = containerEl.offsetWidth;
      let containerHeight = containerEl.offsetHeight;
      let nextBoardWidth = Math.min(containerWidth, containerHeight);
      let nextMarginTop = -35;

      if (containerWidth <= 736 || containerWidth - nextBoardWidth < 180) {
        nextBoardWidth = Math.min(containerWidth, containerHeight - 35);
        nextMarginTop = 0;
      }

      setBoardStyles({ boardWidth: nextBoardWidth, marginTop: nextMarginTop });
    }
  }

  function onClickPointHandler(
    loc: Point,
    color?: ?PlayerColor,
    mark?: ?BoardPointMark
  ) {
    if (onClickPoint) {
      onClickPoint(props.game, loc, color, mark);
    }
  }

  useEffect(() => {
    // Adjust board dimensions when the window resizes.
    setBoardWidth();
    window.addEventListener("resize", setBoardWidth);

    return () => {
      window.removeEventListener("resize", setBoardWidth);
    };
  }, []);

  useEffect(() => {
    // Stone placement sound effect.
    if (lastNode) {
      if (!prevLastNodeRef.current) {
        prevLastNodeRef.current = lastNode;
      } else if (lastNode !== prevLastNodeRef.current) {
        // Only play the sound if the current last-node is different from the
        // previous last node. This guarantees the sound is not played on the
        // first board render.
        for (let i = 0; i < lastNode.props.length; i += 1) {
          let prop = lastNode.props[i];

          if (prop.name === "MOVE") {
            SOUNDS.STONE_PLACED.play("click");
            break;
          }
        }

        prevLastNodeRef.current = lastNode;
      }
    }
  }, [lastNode]);

  if (!boardWidth) {
    return <div className="GameScreen-board-container" ref={containerRef} />;
  }

  if (tree) {
    let computedState = tree.computedState[tree.currentNode];
    if (computedState) {
      board = computedState.board;
      markup = computedState.markup;
    }
  }

  return (
    <div className="GameScreen-board-container" ref={containerRef}>
      <div
        className="GameScreen-board"
        style={{ width: boardWidth, height: boardWidth, marginTop }}>
        <div className="GameScreen-board-inner">
          {board && markup ? (
            <Board
              board={board}
              markup={markup}
              width={boardWidth}
              onClickPoint={onClickPoint ? onClickPointHandler : undefined}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
