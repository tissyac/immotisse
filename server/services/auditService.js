const Audit = require('../models/Audit');

const logAction = async (action, entity, entityId, userId, details = {}) => {
  try {
    await Audit.create({
      action,
      entity,
      entityId,
      userId,
      changes: details.changes,
      oldValues: details.oldValues,
      newValues: details.newValues,
      status: details.status,
      notes: details.notes
    });
  } catch (error) {
    console.error('Erreur lors de l\'audit log:', error);
  }
};

const getAuditHistory = async (filters = {}, paging = { page: 1, limit: 50 }) => {
  try {
    const skip = ((paging.page || 1) - 1) * (paging.limit || 50);
    const query = Audit.find(filters)
      .populate('userId', 'companyName email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(paging.limit || 50);

    const logs = await query;
    const total = await Audit.countDocuments(filters);

    return {
      logs,
      pagination: {
        total,
        page: paging.page || 1,
        limit: paging.limit || 50,
        pages: Math.ceil(total / (paging.limit || 50))
      }
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    return { logs: [], pagination: { total: 0 } };
  }
};

module.exports = { logAction, getAuditHistory };
