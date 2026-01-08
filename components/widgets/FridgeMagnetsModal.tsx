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
  onMove?: (index: number, x: number, y: number) => void;
  onEdit?: (index: number, value: string) => void;
  onRemove?: (index: number) => void;
  canvasWidth?: number;
  canvasHeight?: number;
}

function DraggableMagnet({
  magnet,
  index,
  isInBank,
  count,
  onMove,
  onEdit,
  onRemove,
  canvasWidth,
  canvasHeight,
}: DraggableMagnetProps) {
  const magnetRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dragStateRef = useRef<{
    isDragging: boolean;
    offsetX: number;
    offsetY: number;
    finalX: number;
    finalY: number;
  } | null>(null);

  const magnetSize = 32;
  const justFinishedDraggingRef = useRef(false);

  // Sync position when magnet prop changes (after drag completes)
  // Skip sync immediately after drag to prevent flash
  React.useEffect(() => {
    if (magnetRef.current && !isInBank && !isDragging && !isEditing) {
      if (justFinishedDraggingRef.current) {
        // Don't sync immediately after drag - keep the visual position
        justFinishedDraggingRef.current = false;
        return;
      }
      magnetRef.current.style.left = `${magnet.x}px`;
      magnetRef.current.style.top = `${magnet.y}px`;
    }
  }, [magnet.x, magnet.y, isInBank, isDragging, isEditing]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isInBank || isEditing) return;
      e.preventDefault();
      e.stopPropagation();

      if (!magnetRef.current) return;

      const rect = magnetRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      dragStateRef.current = {
        isDragging: true,
        offsetX,
        offsetY,
        finalX: magnet.x,
        finalY: magnet.y,
      };
      setIsDragging(true);

      const handleMouseMove = (e: MouseEvent) => {
        if (!magnetRef.current || !dragStateRef.current) return;

        // Check if hovering over return button
        const returnButton = document.querySelector(".fridge-return-button") as HTMLElement;
        if (returnButton) {
          const buttonRect = returnButton.getBoundingClientRect();
          const isOverButton =
            e.clientX >= buttonRect.left &&
            e.clientX <= buttonRect.right &&
            e.clientY >= buttonRect.top &&
            e.clientY <= buttonRect.bottom;
          returnButton.classList.toggle("fridge-return-button-active", isOverButton);
        }

        const canvas = magnetRef.current.closest(".fridge-canvas") as HTMLElement;
        if (!canvas) return;

        const canvasRect = canvas.getBoundingClientRect();
        let x = e.clientX - canvasRect.left - dragStateRef.current.offsetX;
        let y = e.clientY - canvasRect.top - dragStateRef.current.offsetY;

        // Constrain to canvas bounds
        if (canvasWidth && canvasHeight) {
          x = Math.max(0, Math.min(x, canvasWidth - magnetSize));
          y = Math.max(0, Math.min(y, canvasHeight - magnetSize));
        }

        dragStateRef.current.finalX = x;
        dragStateRef.current.finalY = y;
        magnetRef.current.style.left = `${x}px`;
        magnetRef.current.style.top = `${y}px`;
      };

      const handleMouseUp = (e: MouseEvent) => {
        if (!dragStateRef.current) return;

        // Clean up return button active state
        const returnButton = document.querySelector(".fridge-return-button") as HTMLElement;
        if (returnButton) {
          returnButton.classList.remove("fridge-return-button-active");
        }

        // Check if dropped on return button
        if (
          returnButton &&
          e.clientX >= returnButton.getBoundingClientRect().left &&
          e.clientX <= returnButton.getBoundingClientRect().right &&
          e.clientY >= returnButton.getBoundingClientRect().top &&
          e.clientY <= returnButton.getBoundingClientRect().bottom
        ) {
          dragStateRef.current = null;
          setIsDragging(false);
          justFinishedDraggingRef.current = true;
          if (onRemove) {
            onRemove(index);
            playSound("move");
          }
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
          return;
        }

        const finalPos = {
          x: dragStateRef.current.finalX,
          y: dragStateRef.current.finalY,
        };

        dragStateRef.current = null;
        setIsDragging(false);
        justFinishedDraggingRef.current = true;

        if (onMove && canvasWidth && canvasHeight) {
          onMove(index, finalPos.x, finalPos.y);
        }

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [isInBank, isEditing, index, onMove, onRemove, canvasWidth, canvasHeight, magnet.x, magnet.y]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isInBank || isEditing) return;
      e.preventDefault();
      e.stopPropagation();

      if (!magnetRef.current) return;

      const touch = e.touches[0];
      const rect = magnetRef.current.getBoundingClientRect();
      const offsetX = touch.clientX - rect.left;
      const offsetY = touch.clientY - rect.top;

      dragStateRef.current = {
        isDragging: true,
        offsetX,
        offsetY,
        finalX: magnet.x,
        finalY: magnet.y,
      };
      setIsDragging(true);

      const handleTouchMove = (e: TouchEvent) => {
        if (!magnetRef.current || !dragStateRef.current) return;

        const touch = e.touches[0];

        // Check if hovering over return button
        const returnButton = document.querySelector(".fridge-return-button") as HTMLElement;
        if (returnButton && touch) {
          const buttonRect = returnButton.getBoundingClientRect();
          const isOverButton =
            touch.clientX >= buttonRect.left &&
            touch.clientX <= buttonRect.right &&
            touch.clientY >= buttonRect.top &&
            touch.clientY <= buttonRect.bottom;
          returnButton.classList.toggle("fridge-return-button-active", isOverButton);
        }

        const canvas = magnetRef.current.closest(".fridge-canvas") as HTMLElement;
        if (!canvas) return;

        const canvasRect = canvas.getBoundingClientRect();
        let x = touch.clientX - canvasRect.left - dragStateRef.current.offsetX;
        let y = touch.clientY - canvasRect.top - dragStateRef.current.offsetY;

        // Constrain to canvas bounds
        if (canvasWidth && canvasHeight) {
          x = Math.max(0, Math.min(x, canvasWidth - magnetSize));
          y = Math.max(0, Math.min(y, canvasHeight - magnetSize));
        }

        dragStateRef.current.finalX = x;
        dragStateRef.current.finalY = y;
        magnetRef.current.style.left = `${x}px`;
        magnetRef.current.style.top = `${y}px`;
      };

      const handleTouchEnd = (e: TouchEvent) => {
        if (!dragStateRef.current) return;

        const touch = e.changedTouches[0];
        if (!touch) return;

        // Clean up return button active state
        const returnButton = document.querySelector(".fridge-return-button") as HTMLElement;
        if (returnButton) {
          returnButton.classList.remove("fridge-return-button-active");
        }

        // Check if dropped on return button
        if (
          returnButton &&
          touch.clientX >= returnButton.getBoundingClientRect().left &&
          touch.clientX <= returnButton.getBoundingClientRect().right &&
          touch.clientY >= returnButton.getBoundingClientRect().top &&
          touch.clientY <= returnButton.getBoundingClientRect().bottom
        ) {
          dragStateRef.current = null;
          setIsDragging(false);
          justFinishedDraggingRef.current = true;
          if (onRemove) {
            onRemove(index);
            playSound("move");
          }
          document.removeEventListener("touchmove", handleTouchMove);
          document.removeEventListener("touchend", handleTouchEnd);
          return;
        }

        const finalPos = {
          x: dragStateRef.current.finalX,
          y: dragStateRef.current.finalY,
        };

        dragStateRef.current = null;
        setIsDragging(false);
        justFinishedDraggingRef.current = true;

        if (onMove && canvasWidth && canvasHeight) {
          onMove(index, finalPos.x, finalPos.y);
        }

        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };

      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);
    },
    [isInBank, isEditing, index, onMove, onRemove, canvasWidth, canvasHeight, magnet.x, magnet.y]
  );

  const clickStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleMouseDownForClick = useCallback(
    (e: React.MouseEvent) => {
      if (isInBank || isEditing) return;
      clickStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        time: Date.now(),
      };
    },
    [isInBank, isEditing]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isInBank || isDragging || isEditing) return;

      // Check if this was a drag (mouse moved significantly)
      if (clickStartRef.current) {
        const dx = Math.abs(e.clientX - clickStartRef.current.x);
        const dy = Math.abs(e.clientY - clickStartRef.current.y);
        const dt = Date.now() - clickStartRef.current.time;

        // If moved more than 5px or took longer than 300ms, it was a drag
        if (dx > 5 || dy > 5 || dt > 300) {
          clickStartRef.current = null;
          return;
        }
        clickStartRef.current = null;
      }

      // Don't edit icons
      if (magnet.type === "icon") return;

      e.preventDefault();
      e.stopPropagation();

      if (!inputRef.current || !labelRef.current) return;

      const label = labelRef.current;
      const input = inputRef.current;

      // Position input exactly over label
      const labelRect = label.getBoundingClientRect();
      const magnetRect = magnetRef.current?.getBoundingClientRect();
      if (!magnetRect) return;

      input.style.width = `${label.offsetWidth}px`;
      input.style.height = `${label.offsetHeight}px`;
      input.style.top = `${labelRect.top - magnetRect.top}px`;
      input.style.left = `${labelRect.left - magnetRect.left}px`;
      input.value = magnet.value;
      input.style.display = "block";
      input.focus();
      input.select();
      setIsEditing(true);
    },
    [isInBank, isDragging, isEditing, magnet]
  );

  const handleInputBlur = useCallback(() => {
    if (!inputRef.current || !labelRef.current || !onEdit) return;

    const newValue = inputRef.current.value.trim();
    if (newValue && newValue !== magnet.value) {
      onEdit(index, newValue);
    }

    inputRef.current.style.display = "none";
    setIsEditing(false);
  }, [index, magnet.value, onEdit]);

  const handleInputKeyUp = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleInputBlur();
      }
    },
    [handleInputBlur]
  );

  const handleInputDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const displayValue =
    magnet.type === "icon" ? (
      <i className={magnet.value} style={{ fontSize: "inherit" }} />
    ) : (
      magnet.value
    );

  return (
    <div
      ref={magnetRef}
      className={`fridge-magnet ${isInBank ? "fridge-magnet-bank" : ""}`}
      style={{
        left: isInBank ? undefined : `${magnet.x}px`,
        top: isInBank ? undefined : `${magnet.y}px`,
        color: magnet.color || "#FFFFFF",
        transform: magnet.rotation ? `rotate(${magnet.rotation}deg)` : undefined,
        opacity: isDragging ? 0.7 : 1,
        zIndex: isDragging ? 1000 : isEditing ? 1001 : 1,
        position: isInBank ? "relative" : "absolute",
        cursor: isInBank ? "default" : "move",
        transition: isDragging ? "none" : "opacity 0.1s",
      }}
      onMouseDown={(e) => {
        handleMouseDownForClick(e);
        handleMouseDown(e);
      }}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
    >
      <span ref={labelRef} className="fridge-magnet-label">
        {displayValue}
      </span>
      <input
        ref={inputRef}
        className="fridge-magnet-edit"
        type="text"
        style={{ display: "none" }}
        onBlur={handleInputBlur}
        onKeyUp={handleInputKeyUp}
        onDoubleClick={handleInputDoubleClick}
      />
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
  canvasWidth,
  canvasHeight,
}: {
  magnets: Magnet[];
  inventory: Record<string, number>;
  onMagnetsChange: (magnets: Magnet[]) => void;
  canvasWidth: number;
  canvasHeight: number;
}) {
  const bankRef = React.useRef<HTMLDivElement>(null);
  const magnetsRef = React.useRef<Magnet[]>(magnets);

  React.useEffect(() => {
    magnetsRef.current = magnets;
  }, [magnets]);

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

    ["!", "?", "&", "."].forEach((punct) => {
      const count = availableBankCounts[punct] || 0;
      items.push({ value: punct, type: "punctuation", count });
    });

    const iconList = [
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

  const handleBankDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, item: (typeof bankItems)[0]) => {
      if (item.count === 0) return;

      // Get the click position relative to the bank slot
      const target = e.currentTarget as HTMLElement;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      // Find the actual magnet element to get its precise position
      const magnetElement = target.querySelector(".fridge-magnet") as HTMLElement;
      const magnetSize = 32;
      let offsetX = magnetSize / 2; // Default fallback
      let offsetY = magnetSize / 2;

      if (magnetElement) {
        const magnetRect = magnetElement.getBoundingClientRect();
        // Calculate offset from click point to top-left corner (same as canvas drag)
        offsetX = clientX - magnetRect.left;
        offsetY = clientY - magnetRect.top;
      }

      const newMagnet: Magnet = {
        ...createBankMagnet(item.value, item.type),
        inBank: true,
      };

      const newMagnets = [...magnetsRef.current, newMagnet];
      const magnetIndex = newMagnets.length - 1;
      magnetsRef.current = newMagnets;
      onMagnetsChange(newMagnets);

      // Create a temporary drag element positioned at cursor with offset
      const dragElement = document.createElement("div");
      dragElement.className = "fridge-magnet fridge-magnet-dragging";
      dragElement.style.position = "fixed";
      dragElement.style.left = `${clientX - offsetX}px`;
      dragElement.style.top = `${clientY - offsetY}px`;
      dragElement.style.pointerEvents = "none";
      dragElement.style.zIndex = "10000";
      dragElement.style.color = newMagnet.color || "#FFFFFF";
      dragElement.style.transform = newMagnet.rotation ? `rotate(${newMagnet.rotation}deg)` : "";
      dragElement.textContent = item.type === "icon" ? "" : item.value;
      if (item.type === "icon") {
        const icon = document.createElement("i");
        icon.className = item.value;
        dragElement.appendChild(icon);
      }
      document.body.appendChild(dragElement);

      const handleMove = (e: MouseEvent | TouchEvent) => {
        const x = "touches" in e ? e.touches[0].clientX : e.clientX;
        const y = "touches" in e ? e.touches[0].clientY : e.clientY;
        dragElement.style.left = `${x - offsetX}px`;
        dragElement.style.top = `${y - offsetY}px`;
      };

      const handleEnd = (e: MouseEvent | TouchEvent) => {
        const canvas = document.querySelector(".fridge-canvas") as HTMLElement;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const x =
            "touches" in e
              ? (e as TouchEvent).changedTouches[0]?.clientX || 0
              : (e as MouseEvent).clientX;
          const y =
            "touches" in e
              ? (e as TouchEvent).changedTouches[0]?.clientY || 0
              : (e as MouseEvent).clientY;

          if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            // Calculate drop position using the same offset
            let dropX = x - rect.left - offsetX;
            let dropY = y - rect.top - offsetY;

            // Constrain to canvas bounds
            dropX = Math.max(0, Math.min(dropX, canvasWidth - magnetSize));
            dropY = Math.max(0, Math.min(dropY, canvasHeight - magnetSize));

            const updatedMagnets = [...magnetsRef.current];

            if (magnetIndex >= 0 && magnetIndex < updatedMagnets.length) {
              updatedMagnets[magnetIndex] = {
                ...updatedMagnets[magnetIndex],
                x: dropX,
                y: dropY,
                inBank: false,
              };

              magnetsRef.current = updatedMagnets;
              onMagnetsChange(updatedMagnets);
              playSound("move");
            }
          } else {
            // Dropped outside canvas, remove the magnet
            const filteredMagnets = magnetsRef.current.filter((_, idx) => idx !== magnetIndex);
            magnetsRef.current = filteredMagnets;
            onMagnetsChange(filteredMagnets);
          }
        }

        document.body.removeChild(dragElement);
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleEnd);
        document.removeEventListener("touchmove", handleMove);
        document.removeEventListener("touchend", handleEnd);
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleEnd);
      document.addEventListener("touchmove", handleMove, { passive: false });
      document.addEventListener("touchend", handleEnd);
    },
    [onMagnetsChange, createBankMagnet, canvasWidth, canvasHeight]
  );

  const cols = 13;
  const rows = 4;

  return (
    <div
      ref={bankRef}
      className="fridge-bank"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridAutoRows: "minmax(32px, auto)",
        gridTemplateRows: `repeat(${rows}, minmax(32px, auto))`,
      }}
    >
      {bankItems.map((item, idx) => {
        const virtualMagnet = createBankMagnet(item.value, item.type);

        return (
          <div
            key={`${item.value}-${idx}`}
            className="fridge-bank-slot"
            style={{
              cursor: item.count > 0 ? "grab" : "default",
            }}
            onMouseDown={(e) => item.count > 0 && handleBankDragStart(e, item)}
            onTouchStart={(e) => item.count > 0 && handleBankDragStart(e, item)}
          >
            {item.count > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "100%",
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
      })}
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
      const newMagnets = [...magnetsRef.current];
      const magnetSize = 32;

      const constrainedX = Math.max(0, Math.min(x, canvasWidth - magnetSize));
      const constrainedY = Math.max(0, Math.min(y, canvasHeight - magnetSize));

      if (magnetIndex >= 0 && magnetIndex < newMagnets.length) {
        const currentMagnet = newMagnets[magnetIndex];
        if (currentMagnet.x !== constrainedX || currentMagnet.y !== constrainedY) {
          newMagnets[magnetIndex] = {
            ...currentMagnet,
            x: constrainedX,
            y: constrainedY,
            inBank: false,
          };
          onMagnetsChange(newMagnets);
          playSound("move");
        }
      }
    },
    [onMagnetsChange, canvasWidth, canvasHeight]
  );

  const handleMagnetEdit = useCallback(
    (magnetIndex: number, value: string) => {
      const newMagnets = [...magnetsRef.current];

      if (magnetIndex >= 0 && magnetIndex < newMagnets.length) {
        newMagnets[magnetIndex] = {
          ...newMagnets[magnetIndex],
          value,
        };
        onMagnetsChange(newMagnets);
        playSound("click");
      }
    },
    [onMagnetsChange]
  );

  const handleMagnetRemove = useCallback(
    (magnetIndex: number) => {
      const newMagnets = magnetsRef.current.filter((_, idx) => idx !== magnetIndex);
      onMagnetsChange(newMagnets);
    },
    [onMagnetsChange]
  );

  const handleReset = () => {
    const clearedMagnets = magnetsRef.current.filter((m) => m.inBank === true);
    onMagnetsChange(clearedMagnets);
    playSound("click");
  };

  const aspectRatio = canvasWidth / canvasHeight;

  return (
    <div
      ref={canvasRef}
      className="fridge-canvas"
      style={{
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
          onMove={handleMagnetMove}
          onEdit={handleMagnetEdit}
          onRemove={handleMagnetRemove}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />
      ))}
      {canvasMagnets.length > 0 && (
        <>
          <button
            className="fridge-return-button game-button"
            style={{
              position: "absolute",
              bottom: "var(--space-sm)",
              right: "calc(var(--space-sm) + 80px)",
            }}
          >
            Return
          </button>
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
        </>
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

  const handleMagnetsChange = useCallback(
    (newMagnets: Magnet[]) => {
      // Immediate update - no debouncing for snappier feel
      updateMutation.mutate(newMagnets);
    },
    [updateMutation]
  );

  return (
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
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />
      </div>
    </Modal>
  );
}
