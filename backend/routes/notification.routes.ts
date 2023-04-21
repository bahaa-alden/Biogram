import {
  createNotification,
  deleteNotification,
  getAllNotification,
  getNotification,
  updateNotification,
} from '@controllers/notification.controller';
import { Router } from 'express';
import passport from 'passport';

const router = Router({ mergeParams: true });

router.use(
  passport.authenticate('jwt', { session: false, failWithError: true })
);

router.route('/').get(getAllNotification).post(createNotification);
router
  .route('/:id')
  .get(getNotification)
  .delete(deleteNotification)
  .patch(updateNotification);

export default router;
