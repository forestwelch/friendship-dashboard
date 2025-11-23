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
            style={{ fontSize: "var(--font-size-2xl)", opacity: 0.8 }}
          />
          <div style={{ fontSize: "var(--font-size-xs)", textAlign: "center" }}>
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
              fontSize: "var(--font-size-sm)",
              fontWeight: "bold",
              marginBottom: "var(--space-xs)",
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
                  fontSize: "var(--font-size-xs)",
                  opacity: 0.6,
                  textAlign: "center",
                  padding: "var(--space-sm)",
                }}
              >
                No notes yet
              </div>
            ) : (
              notes.map((note, index) => (
                <div
                  key={index}
                  style={{
                    fontSize: "var(--font-size-xs)",
                    padding: "var(--space-sm)",
                    background: "var(--secondary)",
                    border: "var(--border-width-md) solid var(--accent)",
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
                      padding: "var(--space-xs) var(--space-xs)",
                      fontSize: "var(--font-size-xs)",
                      marginLeft: "var(--space-xs)",
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
              style={{ fontSize: "var(--font-size-xs)", padding: "var(--space-xs)" }}
            >
              + Add Note
            </button>
          ) : (
            <div style={{ display: "flex", gap: "var(--space-xs)" }}>
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
                  fontSize: "var(--font-size-xs)",
                  padding: "var(--space-xs)",
                  background: "var(--bg)",
                  color: "var(--text)",
                  border: "var(--border-width-md) solid var(--accent)",
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
          padding: "var(--space-xs)",
          gap: "var(--space-xs)",
        }}
      >
        <div
          style={{
            fontSize: "var(--font-size-sm)",
            fontWeight: "bold",
            marginBottom: "var(--space-xs)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Notes</span>
          <span style={{ fontSize: "var(--font-size-xs)", opacity: 0.7 }}>
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
                fontSize: "var(--font-size-sm)",
                opacity: 0.6,
                textAlign: "center",
                padding: "var(--space-xl)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "var(--space-sm)",
              }}
            >
              <i
                className="hn hn-sticky-note-solid"
                style={{ fontSize: "var(--font-size-2xl)", opacity: 0.5 }}
              />
              <div>No notes yet. Click "Add Note" to get started!</div>
            </div>
          ) : (
            notes.map((note, index) => (
              <div
                key={index}
                style={{
                  fontSize: "var(--font-size-xs)",
                  padding: "var(--space-md)",
                  background: "var(--secondary)",
                  border: "var(--border-width-md) solid var(--accent)",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  minHeight: "2.75rem",
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
                        fontSize: "var(--font-size-xs)",
                        padding: "var(--space-xs)",
                        background: "var(--bg)",
                        color: "var(--text)",
                        border: "var(--border-width-md) solid var(--primary)",
                        fontFamily: "inherit",
                        resize: "none",
                        minHeight: "3.75rem",
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
                      padding: "var(--space-xs) var(--space-sm)",
                      fontSize: "var(--font-size-xs)",
                      marginLeft: "var(--space-xs)",
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
            style={{ fontSize: "var(--font-size-sm)", padding: "var(--space-sm)" }}
          >
            + Add Note
          </button>
        )}
      </div>
    </Widget>
  );
}


