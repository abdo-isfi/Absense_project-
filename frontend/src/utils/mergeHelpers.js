/**
 * Helper functions for Smart Merge Suggestion feature
 */

const TIME_SLOTS = ['08:30-11:00', '11:00-13:30', '13:30-16:00', '16:00-18:30'];

/**
 * Get the next consecutive time slot
 * @param {string} currentTimeSlot - Current time slot (e.g., "08:30-11:00")
 * @returns {string|null} - Next time slot or null if no next slot
 */
export const getNextTimeSlot = (currentTimeSlot) => {
  const currentIndex = TIME_SLOTS.indexOf(currentTimeSlot);
  if (currentIndex === -1 || currentIndex === TIME_SLOTS.length - 1) {
    return null;
  }
  return TIME_SLOTS[currentIndex + 1];
};

/**
 * Get the index of a time slot
 * @param {string} timeSlot - Time slot string
 * @returns {number} - Index of the time slot
 */
export const getTimeSlotIndex = (timeSlot) => {
  return TIME_SLOTS.indexOf(timeSlot);
};

/**
 * Check if two time slots are consecutive
 * @param {string} slot1 - First time slot
 * @param {string} slot2 - Second time slot
 * @returns {boolean} - True if consecutive
 */
export const areConsecutiveSlots = (slot1, slot2) => {
  const nextSlot = getNextTimeSlot(slot1);
  return nextSlot === slot2;
};

/**
 * Extract start and end times from a time slot
 * @param {string} timeSlot - Time slot (e.g., "08:30-11:00")
 * @returns {{start: string, end: string}} - Start and end times
 */
export const parseTimeSlot = (timeSlot) => {
  const [start, end] = timeSlot.split('-');
  return { start, end };
};

/**
 * Create a merged time slot string
 * @param {string} firstSlot - First time slot
 * @param {string} lastSlot - Last time slot
 * @returns {string} - Merged time slot (e.g., "08:30-13:30")
 */
export const createMergedTimeSlot = (firstSlot, lastSlot) => {
  const { start } = parseTimeSlot(firstSlot);
  const { end } = parseTimeSlot(lastSlot);
  return `${start}-${end}`;
};

/**
 * Check if a session can be extended to the next time slot
 * @param {object} currentBlock - Current active session block
 * @param {string} nextDay - Day of the next cell
 * @param {string} nextTimeSlot - Time slot of the next cell
 * @param {array} sessions - All existing sessions
 * @param {string} teacherId - Current teacher ID
 * @returns {{canExtend: boolean, reason: string}} - Result with reason
 */
export const canExtend = (currentBlock, nextDay, nextTimeSlot, sessions, teacherId) => {
  // Check if there's an active block
  if (!currentBlock) {
    return { canExtend: false, reason: 'No active session block' };
  }

  // Check if same day
  if (currentBlock.day !== nextDay) {
    return { canExtend: false, reason: 'Different day' };
  }

  // Check if next slot is consecutive
  const expectedNextSlot = getNextTimeSlot(currentBlock.timeSlot);
  if (expectedNextSlot !== nextTimeSlot) {
    return { canExtend: false, reason: 'Not consecutive time slot' };
  }

  // Check if next slot is empty
  const existingSession = sessions.find(
    s => s.day === nextDay && s.timeSlot === nextTimeSlot
  );
  if (existingSession) {
    return { canExtend: false, reason: 'Next slot is already occupied' };
  }

  // Check if the group has a conflict at this time
  const groupConflict = sessions.find(
    s => s.day === nextDay && 
         s.timeSlot === nextTimeSlot && 
         s.group?._id === currentBlock.group?._id
  );
  if (groupConflict) {
    return { canExtend: false, reason: 'Group already has a session at this time' };
  }

  // Check if the room is occupied
  const roomConflict = sessions.find(
    s => s.day === nextDay && 
         s.timeSlot === nextTimeSlot && 
         s.room === currentBlock.room
  );
  if (roomConflict) {
    return { canExtend: false, reason: 'Room is already occupied' };
  }

  return { canExtend: true, reason: '' };
};

/**
 * Create a merged session from current block and next slot
 * @param {object} currentBlock - Current session block
 * @param {string} nextTimeSlot - Next time slot to merge
 * @returns {object} - Merged session data
 */
export const createMergedSession = (currentBlock, nextTimeSlot) => {
  const mergedTimeSlot = createMergedTimeSlot(currentBlock.timeSlot, nextTimeSlot);
  
  return {
    ...currentBlock,
    timeSlot: mergedTimeSlot,
    isMerged: true,
    originalSlots: currentBlock.originalSlots 
      ? [...currentBlock.originalSlots, nextTimeSlot]
      : [currentBlock.timeSlot, nextTimeSlot],
  };
};

/**
 * Check if a session is merged (spans multiple time slots)
 * @param {object} session - Session to check
 * @returns {boolean} - True if merged
 */
export const isMergedSession = (session) => {
  return session?.isMerged === true || session?.originalSlots?.length > 1;
};

/**
 * Get all time slots covered by a session (including merged ones)
 * @param {object} session - Session to analyze
 * @returns {array} - Array of time slot strings
 */
export const getCoveredTimeSlots = (session) => {
  if (session?.originalSlots) {
    return session.originalSlots;
  }
  return [session.timeSlot];
};
