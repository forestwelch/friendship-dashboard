"use client";

import React, { useState, useRef, useEffect } from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize } from "@/lib/types";

interface NotesProps {
  size: WidgetSize;
  initialNotes?: string[];
}

export function Notes({ size, initialNotes = [] }: NotesProps) {
  const [notes, setNotes] = useState<string[]>(initialNotes);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingIndex]);
  
  const addNote = () => {
    const newNote = `Note ${notes.length + 1}`;
    setNotes([...notes, newNote]);
    setEditingIndex(notes.length);
    setEditValue(newNote);
  };
  
  const saveNote = () => {
    if (editingIndex === null) return;
    
    const updatedNotes = [...notes];
    updatedNotes[editingIndex] = editValue || `Note ${editingIndex + 1}`;
    setNotes(updatedNotes);
    setEditingIndex(null);
    setEditValue("");
  };
  
  const deleteNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };
  
  if (size === "1x1") {
    return (
      <Widget size={size}>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-md)",
            gap: "var(--space-sm)",
          }}
        >
          <i
            className="hn hn-sticky-note-solid"
            style={{ fontSize: "32px", opacity: 0.8 }}
          />
          <div style={{ fontSize: "10px", textAlign: "center" }}>
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </div>
        </div>
      </Widget>
    );
  }
  
  if (size === "2x2") {
    return (
      <Widget size={size}>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "var(--space-md)",
            gap: "var(--space-sm)",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              marginBottom: "4px",
            }}
          >
            Notes
          </div>
          
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-sm)",
            }}
          >
            {notes.length === 0 ? (
              <div
                style={{
                  fontSize: "10px",
                  opacity: 0.6,
                  textAlign: "center",
                  padding: "8px",
                }}
              >
                No notes yet
              </div>
            ) : (
              notes.map((note, index) => (
                <div
                  key={index}
                  style={{
                    fontSize: "11px",
                    padding: "var(--space-sm)",
                    background: "var(--secondary)",
                    border: "2px solid var(--accent)",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all var(--transition-fast)",
                  }}
                  onClick={() => {
                    setEditingIndex(index);
                    setEditValue(note);
                  }}
                >
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                    }}
                  >
                    {note}
                  </span>
                  <button
                    className="widget-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(index);
                    }}
                    style={{
                      padding: "2px 4px",
                      fontSize: "8px",
                      marginLeft: "4px",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
          
          {editingIndex === null ? (
            <button
              className="widget-button"
              onClick={addNote}
              style={{ fontSize: "10px", padding: "4px" }}
            >
              + Add Note
            </button>
          ) : (
            <div style={{ display: "flex", gap: "4px" }}>
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    saveNote();
                  } else if (e.key === "Escape") {
                    setEditingIndex(null);
                    setEditValue("");
                  }
                }}
                onBlur={saveNote}
                style={{
                  flex: 1,
                  fontSize: "10px",
                  padding: "4px",
                  background: "var(--bg)",
                  color: "var(--text)",
                  border: "2px solid var(--accent)",
                  fontFamily: "inherit",
                }}
              />
            </div>
          )}
        </div>
      </Widget>
    );
  }
  
  // 3x3 version - Full notes editor
  return (
    <Widget size={size}>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "4px",
          gap: "4px",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: "bold",
            marginBottom: "4px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Notes</span>
          <span style={{ fontSize: "10px", opacity: 0.7 }}>
            {notes.length}
          </span>
        </div>
        
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-sm)",
          }}
        >
          {notes.length === 0 ? (
            <div
              style={{
                fontSize: "12px",
                opacity: 0.6,
                textAlign: "center",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <i
                className="hn hn-sticky-note-solid"
                style={{ fontSize: "32px", opacity: 0.5 }}
              />
              <div>No notes yet. Click "Add Note" to get started!</div>
            </div>
          ) : (
            notes.map((note, index) => (
              <div
                key={index}
                style={{
                  fontSize: "11px",
                  padding: "var(--space-md)",
                  background: "var(--secondary)",
                  border: "2px solid var(--accent)",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  minHeight: "44px",
                  transition: "all var(--transition-fast)",
                }}
                onClick={() => {
                  setEditingIndex(index);
                  setEditValue(note);
                }}
              >
                <div
                  style={{
                    flex: 1,
                    wordBreak: "break-word",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {editingIndex === index ? (
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setEditingIndex(null);
                          setEditValue("");
                        }
                      }}
                      onBlur={saveNote}
                      style={{
                        width: "100%",
                        fontSize: "11px",
                        padding: "4px",
                        background: "var(--bg)",
                        color: "var(--text)",
                        border: "2px solid var(--primary)",
                        fontFamily: "inherit",
                        resize: "none",
                        minHeight: "60px",
                      }}
                      autoFocus
                    />
                  ) : (
                    note
                  )}
                </div>
                {editingIndex !== index && (
                  <button
                    className="widget-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(index);
                    }}
                    style={{
                      padding: "2px 6px",
                      fontSize: "10px",
                      marginLeft: "4px",
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        
        {editingIndex === null && (
          <button
            className="widget-button"
            onClick={addNote}
            style={{ fontSize: "12px", padding: "6px" }}
          >
            + Add Note
          </button>
        )}
      </div>
    </Widget>
  );
}


