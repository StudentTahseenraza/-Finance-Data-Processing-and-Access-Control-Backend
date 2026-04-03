const recordService = require('../services/recordService');
const { recordSchema } = require('../utils/validators');

class RecordController {
  async createRecord(req, res, next) {
    try {
      const { error, value } = recordSchema.create.validate(req.body);
      if (error) {
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        });
      }

      const record = await recordService.createRecord(
        req.userId,
        value,
        req.ip,
        req.get('user-agent')
      );

      res.status(201).json({
        status: 'success',
        data: { record },
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecords(req, res, next) {
    try {
      const { error, value } = recordSchema.filters.validate(req.query);
      if (error) {
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        });
      }

      const isAdmin = req.userRole === 'admin';
      const result = await recordService.getRecords(
        req.userId,
        value,
        isAdmin
      );

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecord(req, res, next) {
    try {
      const { id } = req.params;
      const isAdmin = req.userRole === 'admin';
      
      const record = await recordService.getRecordById(
        req.userId,
        id,
        isAdmin
      );

      res.status(200).json({
        status: 'success',
        data: { record },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRecord(req, res, next) {
    try {
      const { id } = req.params;
      const { error, value } = recordSchema.update.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        });
      }

      const isAdmin = req.userRole === 'admin';
      const record = await recordService.updateRecord(
        req.userId,
        id,
        value,
        req.ip,
        req.get('user-agent'),
        isAdmin
      );

      res.status(200).json({
        status: 'success',
        data: { record },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteRecord(req, res, next) {
    try {
      const { id } = req.params;
      const isAdmin = req.userRole === 'admin';
      
      const result = await recordService.deleteRecord(
        req.userId,
        id,
        req.ip,
        req.get('user-agent'),
        isAdmin
      );

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecordStats(req, res, next) {
    try {
      const isAdmin = req.userRole === 'admin';
      const stats = await recordService.getRecordStats(req.userId, isAdmin);

      res.status(200).json({
        status: 'success',
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RecordController();