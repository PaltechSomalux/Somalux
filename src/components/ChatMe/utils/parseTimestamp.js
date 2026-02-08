export const parseTimestamp = (ts) => {
  if (!ts) {
    console.warn('parseTimestamp: No timestamp provided, using epoch as fallback', { ts });
    return new Date(0); // Fallback to epoch (stable, not current time)
  }

  // Firestore Timestamp object
  if (typeof ts === 'object' && (ts._seconds !== undefined || ts.seconds !== undefined)) {
    const seconds = ts._seconds ?? ts.seconds;
    const nanos = ts._nanoseconds ?? ts.nanoseconds ?? 0;
    const date = new Date(seconds * 1000 + nanos / 1e6);
    if (isNaN(date.getTime())) {
      console.warn('parseTimestamp: Invalid Firestore timestamp, using epoch', { ts });
      return new Date(0); // Stable fallback
    }
    return date;
  }

  // Already a Date
  if (ts instanceof Date) {
    if (isNaN(ts.getTime())) {
      console.warn('parseTimestamp: Invalid Date object, using epoch', { ts });
      return new Date(0); // Stable fallback
    }
    return ts;
  }

  // Milliseconds (number)
  if (typeof ts === 'number') {
    const date = new Date(ts);
    if (isNaN(date.getTime())) {
      console.warn('parseTimestamp: Invalid number timestamp, using epoch', { ts });
      return new Date(0); // Stable fallback
    }
    return date;
  }

  // ISO string
  if (typeof ts === 'string') {
    const parsed = new Date(ts);
    if (!isNaN(parsed.getTime())) return parsed;
    console.warn('parseTimestamp: Failed to parse string timestamp, using epoch', { ts });
    return new Date(0); // Stable fallback
  }

  console.warn('parseTimestamp: Invalid timestamp format, using epoch', { ts });
  return new Date(0); // Stable fallback instead of current time
};