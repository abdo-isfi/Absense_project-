import Schedule from '../models/Schedule.js';
import Teacher from '../models/Teacher.js';
import Group from '../models/Group.js';

/**
 * Check for scheduling conflicts
 * @param {Object} sessionData - Session to check
 * @param {String} scheduleId - Current schedule ID (to exclude from conflict check)
 * @returns {Object} Conflict information
 */
const checkConflicts = async (sessionData, scheduleId = null) => {
  const { teacher, day, timeSlot, room, group } = sessionData;
  const conflicts = [];

  // Build query to find schedules with same day and time slot
  const query = {
    isActive: true,
    'sessions': {
      $elemMatch: {
        day,
        timeSlot,
      }
    }
  };

  // Exclude current schedule from conflict check
  if (scheduleId) {
    query._id = { $ne: scheduleId };
  }

  const conflictingSchedules = await Schedule.find(query)
    .populate('teacher', 'firstName lastName')
    .populate('sessions.group', 'name');

  for (const schedule of conflictingSchedules) {
    const conflictingSessions = schedule.sessions.filter(
      s => s.day === day && s.timeSlot === timeSlot
    );

    for (const session of conflictingSessions) {
      // Check teacher conflict
      if (teacher && schedule.teacher._id.toString() === teacher.toString()) {
        conflicts.push({
          type: 'teacher',
          message: `${schedule.teacher.firstName} ${schedule.teacher.lastName} a déjà un cours à ce créneau`,
          session: {
            subject: session.subject,
            room: session.room,
            group: session.group.name,
          }
        });
      }

      // Check room conflict
      if (room && session.room === room) {
        conflicts.push({
          type: 'room',
          message: `La salle ${room} est déjà réservée à ce créneau`,
          session: {
            subject: session.subject,
            teacher: `${schedule.teacher.firstName} ${schedule.teacher.lastName}`,
            group: session.group.name,
          }
        });
      }

      // Check group conflict
      if (group && session.group._id.toString() === group.toString()) {
        conflicts.push({
          type: 'group',
          message: `Le groupe ${session.group.name} a déjà un cours à ce créneau`,
          session: {
            subject: session.subject,
            teacher: `${schedule.teacher.firstName} ${schedule.teacher.lastName}`,
            room: session.room,
          }
        });
      }
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
};

/**
 * Create a new schedule
 */
export const createSchedule = async (req, res) => {
  try {
    const { teacher, sessions, weekNumber, academicYear } = req.body;

    // Validate teacher exists
    const teacherExists = await Teacher.findById(teacher);
    if (!teacherExists) {
      return res.status(404).json({
        success: false,
        message: 'Formateur non trouvé',
      });
    }

    // Validate all groups exist
    const groupIds = sessions.map(s => s.group);
    const groups = await Group.find({ _id: { $in: groupIds } });
    if (groups.length !== groupIds.length) {
      return res.status(404).json({
        success: false,
        message: 'Un ou plusieurs groupes non trouvés',
      });
    }

    // Check for conflicts in all sessions
    const allConflicts = [];
    for (const session of sessions) {
      const conflictCheck = await checkConflicts({
        teacher,
        day: session.day,
        timeSlot: session.timeSlot,
        room: session.room,
        group: session.group,
      });

      if (conflictCheck.hasConflicts) {
        allConflicts.push(...conflictCheck.conflicts);
      }
    }

    if (allConflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Conflits détectés dans l\'emploi du temps',
        conflicts: allConflicts,
      });
    }

    // Create schedule
    const schedule = await Schedule.create({
      teacher,
      sessions,
      weekNumber: weekNumber || 1,
      academicYear,
    });

    const populatedSchedule = await Schedule.findById(schedule._id)
      .populate('teacher', 'firstName lastName email matricule')
      .populate('sessions.group', 'name filiere annee');

    res.status(201).json({
      success: true,
      message: 'Emploi du temps créé avec succès',
      data: populatedSchedule,
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'emploi du temps',
      error: error.message,
    });
  }
};

/**
 * Get all schedules with optional filters
 */
export const getAllSchedules = async (req, res) => {
  try {
    const { teacher, academicYear, weekNumber, isActive } = req.query;
    const filter = {};

    if (teacher) filter.teacher = teacher;
    if (academicYear) filter.academicYear = academicYear;
    if (weekNumber) filter.weekNumber = parseInt(weekNumber);
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const schedules = await Schedule.find(filter)
      .populate('teacher', 'firstName lastName email matricule')
      .populate('sessions.group', 'name filiere annee')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des emplois du temps',
      error: error.message,
    });
  }
};

/**
 * Get schedule by teacher ID
 */
export const getScheduleByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { academicYear, weekNumber } = req.query;

    const filter = {
      teacher: teacherId,
      isActive: true,
    };

    if (academicYear) filter.academicYear = academicYear;
    if (weekNumber) filter.weekNumber = parseInt(weekNumber);

    const schedule = await Schedule.findOne(filter)
      .populate('teacher', 'firstName lastName email matricule')
      .populate('sessions.group', 'name filiere annee');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Aucun emploi du temps trouvé pour ce formateur',
      });
    }

    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('Error fetching teacher schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'emploi du temps',
      error: error.message,
    });
  }
};

/**
 * Get schedule by ID
 */
export const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findById(id)
      .populate('teacher', 'firstName lastName email matricule')
      .populate('sessions.group', 'name filiere annee');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Emploi du temps non trouvé',
      });
    }

    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'emploi du temps',
      error: error.message,
    });
  }
};

/**
 * Update schedule
 */
export const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessions, weekNumber, academicYear, isActive } = req.body;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Emploi du temps non trouvé',
      });
    }

    // If updating sessions, check for conflicts
    if (sessions) {
      const allConflicts = [];
      for (const session of sessions) {
        const conflictCheck = await checkConflicts({
          teacher: schedule.teacher,
          day: session.day,
          timeSlot: session.timeSlot,
          room: session.room,
          group: session.group,
        }, id);

        if (conflictCheck.hasConflicts) {
          allConflicts.push(...conflictCheck.conflicts);
        }
      }

      if (allConflicts.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Conflits détectés dans l\'emploi du temps',
          conflicts: allConflicts,
        });
      }

      schedule.sessions = sessions;
    }

    if (weekNumber !== undefined) schedule.weekNumber = weekNumber;
    if (academicYear) schedule.academicYear = academicYear;
    if (isActive !== undefined) schedule.isActive = isActive;

    await schedule.save();

    const updatedSchedule = await Schedule.findById(id)
      .populate('teacher', 'firstName lastName email matricule')
      .populate('sessions.group', 'name filiere annee');

    res.status(200).json({
      success: true,
      message: 'Emploi du temps mis à jour avec succès',
      data: updatedSchedule,
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'emploi du temps',
      error: error.message,
    });
  }
};

/**
 * Delete schedule
 */
export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findByIdAndDelete(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Emploi du temps non trouvé',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Emploi du temps supprimé avec succès',
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'emploi du temps',
      error: error.message,
    });
  }
};

/**
 * Check for conflicts (standalone endpoint)
 */
export const checkScheduleConflicts = async (req, res) => {
  try {
    const { teacher, day, timeSlot, room, group, scheduleId } = req.body;

    const result = await checkConflicts(
      { teacher, day, timeSlot, room, group },
      scheduleId
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des conflits',
      error: error.message,
    });
  }
};

/**
 * Get schedule statistics
 */
export const getScheduleStats = async (req, res) => {
  try {
    const { academicYear } = req.query;
    const filter = { isActive: true };
    
    if (academicYear) filter.academicYear = academicYear;

    const totalSchedules = await Schedule.countDocuments(filter);
    const schedules = await Schedule.find(filter);

    const totalSessions = schedules.reduce((sum, s) => sum + s.sessions.length, 0);
    const totalHours = schedules.reduce((sum, s) => sum + (s.sessions.length * 2.5), 0);

    res.status(200).json({
      success: true,
      data: {
        totalSchedules,
        totalSessions,
        totalHours,
        averageSessionsPerSchedule: totalSchedules > 0 ? (totalSessions / totalSchedules).toFixed(1) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching schedule stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message,
    });
  }
};
