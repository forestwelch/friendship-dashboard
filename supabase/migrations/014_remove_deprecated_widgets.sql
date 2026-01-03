-- Remove deprecated widgets: Calendar, Event Countdown, Links, Mood Tracker, Media Recommendations, Notes

-- Delete friend_widgets entries for deprecated widgets
DELETE FROM friend_widgets 
WHERE widget_id IN (
  SELECT id FROM widgets 
  WHERE type IN ('calendar', 'event_countdown', 'shared_links', 'mood', 'media_recommendations', 'notes')
);

-- Delete widget type entries
DELETE FROM widgets 
WHERE type IN ('calendar', 'event_countdown', 'shared_links', 'mood', 'media_recommendations', 'notes');
