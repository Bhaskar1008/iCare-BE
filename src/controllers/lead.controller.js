import { Lead } from '../models/lead.model.js';
import { logger } from '../utils/logger.js';

export const leadController = {
  async getLeads(req, res) {
    try {
      const { status, allocatedTo } = req.query;
      const query = {};
      
      if (status) query.status = status;
      if (allocatedTo) query.allocatedTo = allocatedTo;

      const leads = await Lead.find(query)
        .populate('allocatedBy', 'name')
        .populate('allocatedTo', 'name')
        .sort({ createdAt: -1 });

      const stats = {
        all: await Lead.countDocuments(),
        forToday: await Lead.countDocuments({ status: 'FOR_TODAY' }),
        open: await Lead.countDocuments({ status: 'OPEN' }),
        discarded: await Lead.countDocuments({ status: 'DISCARDED' }),
        converted: await Lead.countDocuments({ status: 'CONVERTED' }),
        failed: await Lead.countDocuments({ status: 'FAILED' }),
      };

      res.json({ leads, stats });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch leads');
      res.status(500).json({ message: 'Failed to fetch leads' });
    }
  },

  async createLead(req, res) {
    try {
      const lead = new Lead({
        ...req.body,
        allocatedBy: req.user.id,
      });
      await lead.save();
      
      logger.info({ leadId: lead._id }, 'Lead created successfully');
      res.status(201).json(lead);
    } catch (error) {
      logger.error({ error }, 'Failed to create lead');
      res.status(500).json({ message: 'Failed to create lead' });
    }
  },

  async updateLead(req, res) {
    try {
      const { id } = req.params;
      const lead = await Lead.findByIdAndUpdate(
        id,
        { ...req.body },
        { new: true, runValidators: true }
      );

      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      logger.info({ leadId: id }, 'Lead updated successfully');
      res.json(lead);
    } catch (error) {
      logger.error({ error }, 'Failed to update lead');
      res.status(500).json({ message: 'Failed to update lead' });
    }
  },

  async deleteLead(req, res) {
    try {
      const { id } = req.params;
      const lead = await Lead.findByIdAndDelete(id);

      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      logger.info({ leadId: id }, 'Lead deleted successfully');
      res.json({ message: 'Lead deleted successfully' });
    } catch (error) {
      logger.error({ error }, 'Failed to delete lead');
      res.status(500).json({ message: 'Failed to delete lead' });
    }
  },
};