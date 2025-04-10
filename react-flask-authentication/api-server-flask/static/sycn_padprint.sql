INSERT INTO padprint_summary (padprint_color, pattern)
SELECT DISTINCT padprint_color, pattern
FROM padprint
WHERE (padprint_color, pattern) NOT IN (
    SELECT padprint_color, pattern FROM padprint_summary
);