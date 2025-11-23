"use client";

import React, { useState } from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize } from "@/lib/types";

interface CalendarProps {
  size: WidgetSize;
  events?: Array<{
    id: string;
    title: string;
    date: string;
    time?: string;
  }>;
  onProposeHangout?: (date: string, time: string) => void;
}

export function Calendar({
  size,
  events = [],
  onProposeHangout,
}: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const today = new Date();
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  const getEventsForDate = (date: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return events.filter(e => e.date.startsWith(dateStr));
  };
  
  const isToday = (date: number) => {
    return (
      date === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };
  
  if (size === "1x1") {
    // Mini calendar - just show today's date and next event
    const todayEvents = getEventsForDate(today.getDate());
    const nextEvent = events.find(e => new Date(e.date) >= today);
    
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
          <div style={{ fontSize: "20px", fontWeight: "bold" }}>
            {today.getDate()}
          </div>
          <div style={{ fontSize: "10px", opacity: 0.8 }}>
            {today.toLocaleDateString('en-US', { month: 'short' })}
          </div>
          {nextEvent && (
            <div
              style={{
                fontSize: "8px",
                textAlign: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }}
            >
              {nextEvent.title}
            </div>
          )}
        </div>
      </Widget>
    );
  }
  
  if (size === "2x2") {
    // Small calendar grid
    const days = ["S", "M", "T", "W", "T", "F", "S"];
    const calendarDays: Array<number | null> = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(null);
    }
    
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push(i);
    }
    
    return (
      <Widget size={size}>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "4px",
            gap: "2px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: "4px",
            }}
          >
            {selectedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </div>
          
          {/* Day headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "2px",
              fontSize: "8px",
              marginBottom: "2px",
            }}
          >
            {days.map((day, i) => (
              <div key={i} style={{ textAlign: "center", opacity: 0.7 }}>
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "2px",
              flex: 1,
            }}
          >
            {calendarDays.map((day, i) => {
              if (day === null) {
                return <div key={i} />;
              }
              
              const dayEvents = getEventsForDate(day);
              const isTodayDate = isToday(day);
              
              return (
                <div
                  key={i}
                  style={{
                    aspectRatio: "1",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "8px",
                    background: isTodayDate ? "var(--primary)" : "transparent",
                    color: isTodayDate ? "var(--bg)" : "var(--text)",
                    border: dayEvents.length > 0 ? "1px solid var(--accent)" : "none",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
                >
                  <div>{day}</div>
                  {dayEvents.length > 0 && (
                    <div
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        background: "var(--accent)",
                        marginTop: "1px",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Widget>
    );
  }
  
  // 3x3 version - Full calendar with event list
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const calendarDays: Array<number | null> = [];
  
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }
  
  const selectedEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    return (
      eventDate.getMonth() === currentMonth &&
      eventDate.getFullYear() === currentYear
    );
  });
  
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
        {/* Month header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "14px",
            fontWeight: "bold",
            marginBottom: "4px",
          }}
        >
          <button
            className="widget-button"
            onClick={() =>
              setSelectedDate(new Date(currentYear, currentMonth - 1, 1))
            }
            style={{ padding: "2px 6px", fontSize: "10px" }}
          >
            ←
          </button>
          <div>
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <button
            className="widget-button"
            onClick={() =>
              setSelectedDate(new Date(currentYear, currentMonth + 1, 1))
            }
            style={{ padding: "2px 6px", fontSize: "10px" }}
          >
            →
          </button>
        </div>
        
        {/* Day headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "2px",
            fontSize: "10px",
            marginBottom: "2px",
          }}
        >
          {days.map((day) => (
            <div key={day} style={{ textAlign: "center", opacity: 0.7 }}>
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "2px",
            flex: "1",
            minHeight: 0,
          }}
        >
          {calendarDays.map((day, i) => {
            if (day === null) {
              return <div key={i} />;
            }
            
            const dayEvents = getEventsForDate(day);
            const isTodayDate = isToday(day);
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isFuture = new Date(dateStr) >= new Date(today.toDateString());
            
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  fontSize: "10px",
                  background: isTodayDate ? "var(--primary)" : "transparent",
                  color: isTodayDate ? "var(--bg)" : "var(--text)",
                  border: dayEvents.length > 0 ? "1px solid var(--accent)" : "none",
                  padding: "2px",
                  cursor: isFuture && onProposeHangout ? "pointer" : "default",
                  overflow: "hidden",
                }}
                onClick={() => {
                  if (isFuture && onProposeHangout && dayEvents.length === 0) {
                    const time = prompt("What time? (e.g., 3:00 PM)");
                    if (time) {
                      onProposeHangout(dateStr, time);
                    }
                  } else {
                    setSelectedDate(new Date(currentYear, currentMonth, day));
                  }
                }}
                title={
                  isFuture && dayEvents.length === 0 && onProposeHangout
                    ? "Click to propose hangout"
                    : undefined
                }
              >
                <div style={{ fontWeight: isTodayDate ? "bold" : "normal" }}>
                  {day}
                </div>
                {dayEvents.length > 0 && (
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--accent)",
                      marginTop: "2px",
                    }}
                  />
                )}
                {isFuture && dayEvents.length === 0 && onProposeHangout && (
                  <div
                    style={{
                      fontSize: "6px",
                      opacity: 0.5,
                      marginTop: "1px",
                    }}
                  >
                    +
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Event list */}
        {selectedEvents.length > 0 && (
          <div
            style={{
              fontSize: "10px",
              maxHeight: "60px",
              overflowY: "auto",
              borderTop: "2px solid var(--accent)",
              paddingTop: "4px",
            }}
          >
            {selectedEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                style={{
                  marginBottom: "2px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {event.title}
              </div>
            ))}
          </div>
        )}
      </div>
    </Widget>
  );
}

