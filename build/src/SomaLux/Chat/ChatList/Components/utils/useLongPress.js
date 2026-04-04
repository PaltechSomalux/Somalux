import { useEffect, useRef } from 'react';

export const useLongPress = (callback, ms = 500, options = {}) => {
  const { context, selector = null } = options; // new: selector
  const timerRef = useRef(null);
  const isLongPress = useRef(false);

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const shouldHandle = (event) => {
    if (!selector) return true; // no selector => allow
    // event.target might be a React synthetic event; fall back to nativeEvent.target if present
    const target = event?.target || (event?.nativeEvent && event.nativeEvent.target);
    if (!target || !target.closest) return false;
    return !!target.closest(selector);
  };

  const start = (event) => {
    if (!shouldHandle(event)) return; // ignore starts outside selector
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      if (typeof callback === 'function') {
        callback(event, { context });
      }
    }, ms);
  };

  const handleMouseDown = (event) => {
    // persist only when available (older React versions)
    if (event && typeof event.persist === 'function') event.persist();
    start(event);
  };

  const handleMouseUp = () => {
    clear();
  };

  const handleTouchStart = (event) => {
    if (event && typeof event.persist === 'function') event.persist();
    start(event);
  };

  const handleTouchEnd = () => {
    clear();
  };

  const handleClick = (event) => {
    if (!shouldHandle(event)) return; // ignore clicks outside selector
    if (isLongPress.current) {
      // the click following a longpress — ignore default click work
      event.preventDefault();
      return;
    }
    clear();
    if (typeof callback === 'function') {
      callback(event, { context });
    }
  };

  useEffect(() => {
    return () => clear(); // cleanup timer on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseLeave: clear,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onClick: handleClick,
  };
};
