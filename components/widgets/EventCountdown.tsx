"use client";

import { useMemo, useEffect, useState } from "react";
import { playSound } from "@/lib/sounds";
import { useUIStore } from "@/lib/store/ui-store";
import { ThemeColors } from "@/lib/types";
import { EventCountdownModal } from "./EventCountdownModal";
import styles from "./EventCountdown.module.css";

interface Event {
  id: string;
  name: string;
  date: string;
  emoji: string;
  description?: string;
  created_at: string;
}

interface EventCountdownData {
  events?: Event[];
}

interface EventCountdownProps {
  size: 1 | 2 | 3;
  friendId: string;
  widgetId: string;
  themeColors: ThemeColors;
  config?: EventCountdownData;
}

export function EventCountdown({
  size,
  friendId,
  widgetId,
  themeColors,
  config,
}: EventCountdownProps) {
  const { setOpenModal } = useUIStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sort events by date (upcoming first)
  const sortedEvents = useMemo(() => {
    const gameEvents = config?.events || [];
    return [...gameEvents]
      .filter((event) => new Date(event.date) >= currentTime)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [config?.events, currentTime]);

  const nextEvent = sortedEvents[0];

  const handleClick = () => {
    setOpenModal(`event-${widgetId}`);
    playSound("open");
  };

  // Calculate days until event
  const daysUntil = (dateString: string): number => {
    const eventDate = new Date(dateString);
    eventDate.setHours(0, 0, 0, 0);
    const today = new Date(currentTime);
    today.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // 1x1 Tile: Days until next event
  if (size === 1) {
    if (!nextEvent) {
      return (
        <div className={styles.tile1x1} onClick={handleClick}>
          <div className={styles.noEvents}>No events</div>
        </div>
      );
    }

    const days = daysUntil(nextEvent.date);
    return (
      <>
        <div className={styles.tile1x1} onClick={handleClick}>
          <div className={styles.days}>{days}</div>
          <div className={styles.daysLabel}>days</div>
        </div>
        <EventCountdownModal
          friendId={friendId}
          widgetId={widgetId}
          themeColors={themeColors}
          config={config}
        />
      </>
    );
  }

  // 2x2 Tile: Next event details
  if (size === 2) {
    if (!nextEvent) {
      return (
        <div className={styles.tile2x2} onClick={handleClick}>
          <div className={styles.noEvents}>No upcoming events</div>
        </div>
      );
    }

    const days = daysUntil(nextEvent.date);
    return (
      <>
        <div className={styles.tile2x2} onClick={handleClick}>
          <div className={styles.eventHeader}>
            <span className={styles.emoji}>{nextEvent.emoji}</span>
            <span className={styles.eventName}>{nextEvent.name.toUpperCase()}</span>
          </div>
          <div className={styles.days}>{days} days</div>
          <div className={styles.date}>{formatDate(nextEvent.date)}</div>
        </div>
        <EventCountdownModal
          friendId={friendId}
          widgetId={widgetId}
          themeColors={themeColors}
          config={config}
        />
      </>
    );
  }

  // 3x3 Tile: List of upcoming events
  if (size === 3) {
    return (
      <>
        <div className={styles.tile3x3} onClick={handleClick}>
          <div className={styles.title}>UPCOMING EVENTS</div>
          <div className={styles.eventsList}>
            {sortedEvents.length > 0 ? (
              sortedEvents.slice(0, 3).map((event) => {
                const days = daysUntil(event.date);
                return (
                  <div key={event.id} className={styles.eventItem}>
                    <div className={styles.eventRow}>
                      <span className={styles.emoji}>{event.emoji}</span>
                      <span className={styles.eventName}>{event.name.toUpperCase()}</span>
                    </div>
                    <div className={styles.eventRow}>
                      <span className={styles.days}>{days} days</span>
                      <span className={styles.date}>{formatDate(event.date)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={styles.noEvents}>No upcoming events</div>
            )}
          </div>
        </div>
        <EventCountdownModal
          friendId={friendId}
          widgetId={widgetId}
          themeColors={themeColors}
          config={config}
        />
      </>
    );
  }

  return null;
}
