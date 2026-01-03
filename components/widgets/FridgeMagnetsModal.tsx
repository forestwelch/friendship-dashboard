"use client";

import React, { useState, useCallback, useRef } from "react";
import { Modal } from "@/components/Modal";
import { useUIStore } from "@/lib/store/ui-store";
import { useFridgeState, useUpdateFridgeState } from "@/lib/queries-fridge-hooks";
import { Magnet } from "@/lib/queries-fridge";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { playSound } from "@/lib/sounds";

interface FridgeMagnetsModalProps {
  friendId: string;
}

interface DraggableMagnetProps {
  magnet: Magnet;
  index: number;
}

function DraggableMagnet({ magnet, index }: DraggableMagnetProps) {
  const [{ isDragging }, drag] = useDrag({
    type: "magnet",
    item: { index, magnet },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      className="fridge-magnet"
      style={{
        left: `${magnet.x}px`,
        top: `${magnet.y}px`,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
      }}
    >
      {magnet.type === "icon" ? (
        <i className="hn hn-font-solid" style={{ fontSize: "inherit" }} />
      ) : (
        magnet.value
      )}
    </div>
  );
}

function FridgeCanvas({
  magnets,
  onMagnetsChange,
}: {
  magnets: Magnet[];
  onMagnetsChange: (magnets: Magnet[]) => void;
}) {
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const [undoStack, setUndoStack] = useState<Magnet[][]>([]);

  const handleMagnetMove = useCallback(
    (index: number, x: number, y: number) => {
      const newMagnets = [...magnets];
      newMagnets[index] = { ...newMagnets[index], x, y };
      setUndoStack((prev) => [...prev, magnets]);
      onMagnetsChange(newMagnets);
      playSound("move");
    },
    [magnets, onMagnetsChange]
  );

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setUndoStack((prev) => prev.slice(0, -1));
      onMagnetsChange(previousState);
      playSound("click");
    }
  };

  const [{ isOver }, drop] = useDrop({
    accept: "magnet",
    drop: (item: { index: number; magnet: Magnet }, monitor) => {
      if (!canvasRef.current) return;

      const offset = monitor.getClientOffset();
      if (!offset) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = offset.x - rect.left;
      const y = offset.y - rect.top;

      handleMagnetMove(item.index, x, y);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={(node) => {
        canvasRef.current = node;
        drop(node);
      }}
      className="fridge-canvas"
      style={{
        cursor: isOver ? "grabbing" : "default",
      }}
    >
      {magnets.map((magnet, idx) => (
        <DraggableMagnet key={idx} magnet={magnet} index={idx} />
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
    </div>
  );
}

export function FridgeMagnetsModal({ friendId }: FridgeMagnetsModalProps) {
  const { setOpenModal } = useUIStore();
  const modalId = `fridgemagnets-${friendId}`;

  const { data: fridgeState } = useFridgeState(friendId);
  const updateMutation = useUpdateFridgeState(friendId);
  const magnets = fridgeState?.magnets || [];

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMagnetsChange = useCallback(
    (newMagnets: Magnet[]) => {
      // Debounce saves
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
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

  return (
    <DndProvider backend={HTML5Backend}>
      <Modal id={modalId} title="Fridge Magnets" onClose={() => setOpenModal(null)}>
        <div className="modal-content">
          <div className="form-title-small">
            Drag magnets to arrange them. Both Forest and friend can move any magnet.
            {updateMutation.isPending && " Saving..."}
          </div>
          <FridgeCanvas magnets={magnets} onMagnetsChange={handleMagnetsChange} />
        </div>
      </Modal>
    </DndProvider>
  );
}
