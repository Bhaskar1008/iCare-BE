import { Router } from 'express';
import { AccessControlController } from './access-control.controller';

const router = Router();
const accessControlController = new AccessControlController();

// Get access control configuration by project and channel
router.get(
  '/project/:projectId/channel/:channelId',
  accessControlController.getAccessControlsByProjectAndChannel.bind(
    accessControlController,
  ),
);

// Create or update access control configuration
router.post(
  '/project/:projectId/channel/:channelId/createOrUpdate',
  accessControlController.createOrUpdateAccessControl.bind(
    accessControlController,
  ),
);

export default router;
