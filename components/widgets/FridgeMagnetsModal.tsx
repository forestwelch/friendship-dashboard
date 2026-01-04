"use client";

import React, { useState, useCallback, useRef, useMemo } from "react";
import { Modal } from "@/components/Modal";
import { useUIStore } from "@/lib/store/ui-store";
import { useFridgeState, useUpdateFridgeState } from "@/lib/queries-fridge-hooks";
import {
  Magnet,
  DEFAULT_INVENTORY,
  getCanvasCounts,
  getAvailableBankCounts,
  getColorForValue,
  getRandomRotation,
  getCanvasDimensions,
} from "@/lib/queries-fridge";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { playSound } from "@/lib/sounds";
import { WidgetSize } from "@/lib/types";

interface FridgeMagnetsModalProps {
  friendId: string;
  size: WidgetSize;
}

interface DraggableMagnetProps {
  magnet: Magnet;
  index: number;
  isInBank?: boolean;
  count?: number;
}

function DraggableMagnet({ magnet, index, isInBank, count }: DraggableMagnetProps) {
  const [{ isDragging }, drag] = useDrag({
    type: "magnet",
    item: { index, magnet, isInBank },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      className={`fridge-magnet ${isInBank ? "fridge-magnet-bank" : ""}`}
      style={{
        left: isInBank ? undefined : `${magnet.x}px`,
        top: isInBank ? undefined : `${magnet.y}px`,
        color: magnet.color || "#FFFFFF",
        transform: magnet.rotation ? `rotate(${magnet.rotation}deg)` : undefined,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
        position: isInBank ? "relative" : "absolute",
      }}
    >
      {magnet.type === "icon" ? (
        <i className={magnet.value} style={{ fontSize: "inherit" }} />
      ) : (
        magnet.value
      )}
      {isInBank && count !== undefined && count > 1 && (
        <span className="fridge-bank-count">{count}</span>
      )}
    </div>
  );
}

function MagnetBank({
  magnets,
  inventory,
  onMagnetsChange,
}: {
  magnets: Magnet[];
  inventory: Record<string, number>;
  onMagnetsChange: (magnets: Magnet[]) => void;
}) {
  const bankRef = React.useRef<HTMLDivElement>(null);

  const canvasCounts = useMemo(() => getCanvasCounts(magnets), [magnets]);
  const availableBankCounts = useMemo(() => {
    return getAvailableBankCounts(inventory, canvasCounts);
  }, [inventory, canvasCounts]);

  const bankItems = useMemo(() => {
    const items: Array<{
      value: string;
      type: "letter" | "number" | "punctuation" | "icon";
      count: number;
    }> = [];

    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((letter) => {
      const count = availableBankCounts[letter] || 0;
      items.push({ value: letter, type: "letter", count });
    });

    "0123456789".split("").forEach((num) => {
      const count = availableBankCounts[num] || 0;
      items.push({ value: num, type: "number", count });
    });

    ["!", "?", "&"].forEach((punct) => {
      const count = availableBankCounts[punct] || 0;
      items.push({ value: punct, type: "punctuation", count });
    });

    const iconList = [
      "hn-tiktok",
      "hn-heart-solid",
      "hn-crown-solid",
      "hn-headphones-solid",
      "hn-gaming",
      "hn-lightbulb-solid",
      "hn-moon-solid",
      "hn-sun-solid",
      "hn-star-solid",
      "hn-paperclip-solid",
      "hn-lock-solid",
      "hn-lock-open-solid",
      "hn-trash-alt-solid",
    ];
    iconList.forEach((icon) => {
      const count = availableBankCounts[icon] || 0;
      items.push({ value: icon, type: "icon", count });
    });

    return items;
  }, [availableBankCounts]);

  const [{ isOver }, drop] = useDrop({
    accept: "magnet",
    drop: (item: { index: number; magnet: Magnet; isInBank?: boolean }, monitor) => {
      if (!bankRef.current) return;

      const offset = monitor.getClientOffset();
      if (!offset) return;

      const rect = bankRef.current.getBoundingClientRect();
      const x = offset.x - rect.left;
      const y = offset.y - rect.top;

      const cols = 13;
      const rows = 4;
      const padding = parseFloat(getComputedStyle(bankRef.current).padding) || 0;
      const availableWidth = rect.width - padding * 2;
      const actualSlotWidth = availableWidth / cols;

      const col = Math.min(Math.max(0, Math.floor((x - padding) / actualSlotWidth)), cols - 1);
      const scrollTop = bankRef.current.scrollTop || 0;
      const slotHeight = (rect.height - padding * 2) / rows;
      const row = Math.min(
        Math.max(0, Math.floor((y + scrollTop - padding) / slotHeight)),
        rows - 1
      );
      const slotIndex = row * cols + col;

      if (slotIndex < 0 || slotIndex >= bankItems.length) return;

      const targetItem = bankItems[slotIndex];
      if (!targetItem) return;

      if (item.isInBank) {
        return;
      } else {
        const draggedValue = item.magnet.value;
        const targetValue = targetItem.value;
        const canDrop = draggedValue === targetValue || targetItem.count === 0;

        if (canDrop) {
          if (item.index >= 0 && item.index < magnets.length) {
            const filteredMagnets = magnets.filter((_, idx) => idx !== item.index);
            onMagnetsChange(filteredMagnets);
            playSound("move");
            return;
          }
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const createBankMagnet = useCallback(
    (value: string, type: "letter" | "number" | "punctuation" | "icon"): Magnet => {
      return {
        type,
        value,
        x: 0,
        y: 0,
        color: getColorForValue(value),
        rotation: getRandomRotation(),
        inBank: false,
      };
    },
    []
  );

  const cols = 13;
  const rows = 4;

  return (
    <div
      ref={(node) => {
        bankRef.current = node;
        drop(node);
      }}
      className="fridge-bank"
      style={{
        cursor: isOver ? "grabbing" : "default",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridAutoRows: "minmax(40px, auto)",
        gridTemplateRows: `repeat(${rows}, minmax(40px, auto))`,
      }}
    >
      {bankItems.map((item, idx) => {
        const virtualMagnet = createBankMagnet(item.value, item.type);

        return (
          <BankSlot
            key={`${item.value}-${idx}`}
            item={item}
            virtualMagnet={virtualMagnet}
            magnets={magnets}
            onMagnetsChange={onMagnetsChange}
          />
        );
      })}
    </div>
  );
}

function BankSlot({
  item,
  virtualMagnet,
  magnets,
  onMagnetsChange,
}: {
  item: { value: string; type: "letter" | "number" | "punctuation" | "icon"; count: number };
  virtualMagnet: Magnet;
  magnets: Magnet[];
  onMagnetsChange: (magnets: Magnet[]) => void;
}) {
  const createdMagnetRef = useRef<{ magnet: Magnet; index: number } | null>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "magnet",
    item: () => {
      if (!createdMagnetRef.current) {
        const newMagnet: Magnet = {
          ...virtualMagnet,
          color: getColorForValue(item.value),
          rotation: getRandomRotation(),
          inBank: true,
        };

        const newMagnets = [...magnets, newMagnet];
        onMagnetsChange(newMagnets);

        createdMagnetRef.current = {
          magnet: newMagnet,
          index: newMagnets.length - 1,
        };
      }

      return {
        index: createdMagnetRef.current.index,
        magnet: createdMagnetRef.current.magnet,
        isInBank: true,
      };
    },
    canDrag: () => item.count > 0,
    end: () => {
      createdMagnetRef.current = null;
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div className="fridge-bank-slot" ref={drag as unknown as React.Ref<HTMLDivElement>}>
      {item.count > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            opacity: isDragging ? 0.5 : 1,
            cursor: item.count > 0 ? "move" : "default",
          }}
        >
          <div
            className="fridge-magnet fridge-magnet-bank"
            style={{
              color: getColorForValue(item.value),
              transform: virtualMagnet.rotation
                ? `rotate(${virtualMagnet.rotation}deg)`
                : undefined,
            }}
          >
            {item.type === "icon" ? (
              <i className={item.value} style={{ fontSize: "inherit" }} />
            ) : (
              item.value
            )}
          </div>
        </div>
      ) : (
        <div className="fridge-bank-slot-empty" />
      )}
    </div>
  );
}

function FridgeCanvas({
  magnets,
  onMagnetsChange,
  canvasWidth,
  canvasHeight,
}: {
  magnets: Magnet[];
  onMagnetsChange: (magnets: Magnet[]) => void;
  canvasWidth: number;
  canvasHeight: number;
}) {
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const magnetsRef = React.useRef<Magnet[]>(magnets);
  const [undoStack, setUndoStack] = useState<Magnet[][]>([]);

  React.useEffect(() => {
    magnetsRef.current = magnets;
  }, [magnets]);

  const canvasMagnets = useMemo(() => {
    return magnets
      .map((magnet, index) => ({ magnet, index }))
      .filter(({ magnet }) => magnet.inBank !== true);
  }, [magnets]);

  const handleMagnetMove = useCallback(
    (magnetIndex: number, x: number, y: number) => {
      const stateBeforeChange = [...magnetsRef.current];
      const newMagnets = [...magnetsRef.current];
      const magnetSize = 32;

      const constrainedX = Math.max(0, Math.min(x, canvasWidth - magnetSize));
      const constrainedY = Math.max(0, Math.min(y, canvasHeight - magnetSize));

      if (magnetIndex >= 0 && magnetIndex < newMagnets.length) {
        // Only update if position actually changed
        const currentMagnet = newMagnets[magnetIndex];
        if (currentMagnet.x !== constrainedX || currentMagnet.y !== constrainedY) {
          newMagnets[magnetIndex] = {
            ...currentMagnet,
            x: constrainedX,
            y: constrainedY,
            inBank: false,
          };
          setUndoStack((prev) => [...prev, stateBeforeChange]);
          onMagnetsChange(newMagnets);
          playSound("move");
        }
      }
    },
    [onMagnetsChange, canvasWidth, canvasHeight]
  );

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setUndoStack((prev) => prev.slice(0, -1));
      onMagnetsChange(previousState);
      playSound("click");
    }
  };

  const handleReset = () => {
    const stateBeforeChange = [...magnetsRef.current];
    const clearedMagnets = magnetsRef.current.filter((m) => m.inBank === true);
    setUndoStack((prev) => [...prev, stateBeforeChange]);
    onMagnetsChange(clearedMagnets);
    playSound("click");
  };

  const [{ isOver }, drop] = useDrop({
    accept: "magnet",
    drop: (item: { index: number; magnet: Magnet; isInBank?: boolean }, monitor) => {
      if (!canvasRef.current) return;

      const offset = monitor.getClientOffset();
      if (!offset) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const initialSourceClientOffset = monitor.getInitialSourceClientOffset();
      const magnetSize = 32;

      let x = offset.x - rect.left;
      let y = offset.y - rect.top;

      // More accurate positioning for touch devices
      if (initialSourceClientOffset) {
        const initialClientOffset = monitor.getInitialClientOffset();
        if (initialClientOffset) {
          const dragOffsetX = initialClientOffset.x - initialSourceClientOffset.x;
          const dragOffsetY = initialClientOffset.y - initialSourceClientOffset.y;
          x -= dragOffsetX;
          y -= dragOffsetY;
        }
      }

      // Snap to grid for better placement accuracy
      const gridSize = 8;
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;

      x = Math.max(0, Math.min(x, rect.width - magnetSize));
      y = Math.max(0, Math.min(y, rect.height - magnetSize));

      if (item.isInBank) {
        const currentMagnets = magnetsRef.current;
        const stateBeforeChange = [...currentMagnets];
        const newMagnets = [...currentMagnets];

        if (item.index >= 0 && item.index < newMagnets.length) {
          newMagnets[item.index] = {
            ...newMagnets[item.index],
            x,
            y,
            inBank: false,
          };

          setUndoStack((prev) => [...prev, stateBeforeChange]);
          onMagnetsChange(newMagnets);
          playSound("move");
        }
        return;
      }

      handleMagnetMove(item.index, x, y);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const aspectRatio = canvasWidth / canvasHeight;

  return (
    <div
      ref={(node) => {
        canvasRef.current = node;
        drop(node);
      }}
      className="fridge-canvas"
      style={{
        cursor: isOver ? "grabbing" : "default",
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        aspectRatio: `${aspectRatio}`,
      }}
    >
      {canvasMagnets.map(({ magnet, index }) => (
        <DraggableMagnet
          key={`canvas-${index}-${magnet.value}`}
          magnet={magnet}
          index={index}
          isInBank={false}
        />
      ))}
      {undoStack.length > 0 && (
        <button
          onClick={handleUndo}
          className="game-button"
          style={{
            position: "absolute",
            bottom: "var(--space-sm)",
            right: "var(--space-sm)",
          }}
        >
          Undo
        </button>
      )}
      {undoStack.length === 0 && canvasMagnets.length > 0 && (
        <button
          onClick={handleReset}
          className="game-button"
          style={{
            position: "absolute",
            bottom: "var(--space-sm)",
            right: "var(--space-sm)",
          }}
        >
          Reset
        </button>
      )}
    </div>
  );
}

export function FridgeMagnetsModal({ friendId, size }: FridgeMagnetsModalProps) {
  const { setOpenModal } = useUIStore();
  const modalId = `fridgemagnets-${friendId}-${size}`;

  const { data: fridgeState } = useFridgeState(friendId);
  const updateMutation = useUpdateFridgeState(friendId);
  const magnets = fridgeState?.magnets || [];
  const inventory = fridgeState?.inventory || DEFAULT_INVENTORY;

  const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions(size);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMagnetsChange = useCallback(
    (newMagnets: Magnet[]) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Increase debounce time to reduce save frequency
      saveTimeoutRef.current = setTimeout(() => {
        updateMutation.mutate(newMagnets);
      }, 500);
    },
    [updateMutation]
  );

  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Use TouchBackend for mobile, HTML5Backend for desktop
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const backend = isMobile ? TouchBackend : HTML5Backend;
  const backendOptions = isMobile
    ? {
        enableMouseEvents: true,
        enableTouchEvents: true,
        enableKeyboardEvents: false,
        delay: 0,
        delayTouchStart: 0,
        touchSlop: 0,
      }
    : undefined;

  return (
    <DndProvider backend={backend} options={backendOptions}>
      <Modal id={modalId} title="Fridge Magnets" onClose={() => setOpenModal(null)}>
        <div className="modal-content" style={{ overflow: "hidden" }}>
          <FridgeCanvas
            magnets={magnets}
            onMagnetsChange={handleMagnetsChange}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />
          <MagnetBank
            magnets={magnets}
            inventory={inventory}
            onMagnetsChange={handleMagnetsChange}
          />
        </div>
      </Modal>
    </DndProvider>
  );
}
