/**
 * Safely calls closest() on an event target, handling cases where the target
 * might not be a DOM element or might not have the closest method.
 * 
 * @param {Event} event - The event object
 * @param {string} selector - The CSS selector to search for
 * @returns {Element|null} - The closest matching element or null
 */
export const safeClosest = (event, selector) => {
  // Check if event and event.target exist
  if (!event || !event.target) {
    return null;
  }

  // Check if event.target has the closest method (is a DOM element)
  if (typeof event.target.closest !== 'function') {
    return null;
  }

  try {
    return event.target.closest(selector);
  } catch (error) {
    return null;
  }
};

/**
 * Checks if an event target is a valid DOM element with the closest method
 * 
 * @param {Event} event - The event object
 * @returns {boolean} - True if the event target is a valid DOM element
 */
export const isValidDOMTarget = (event) => {
  return event && 
         event.target && 
         typeof event.target.closest === 'function';
};
