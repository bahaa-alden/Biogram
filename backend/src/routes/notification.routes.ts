import {
  createNotification,
  deleteNotification,
  getAllNotification,
  getNotification,
  updateCAndMNotifications,
  updateNotification,
} from '@controllers/notification.controller';
import { Router } from 'express';
import passport from 'passport';
import { validate } from '@middlewares/validation.middleware';
import {
  getNotificationsSchema,
  markNotificationReadSchema,
} from '@utils/validation.schemas';
import { z } from 'zod';
import { mongoIdSchema } from '@utils/validation.schemas';

const router = Router({ mergeParams: true });

router.use(
  passport.authenticate('jwt', { session: false, failWithError: true })
);

router.route('/').get(validate(getNotificationsSchema), getAllNotification).post(createNotification);
router.patch('/read', validate(markNotificationReadSchema), updateCAndMNotifications);
router
  .route('/:id')
  .get(validate({ params: z.object({ id: mongoIdSchema, userId: mongoIdSchema }) }), getNotification)
  .delete(validate({ params: z.object({ id: mongoIdSchema, userId: mongoIdSchema }) }), deleteNotification)
  .patch(validate({ params: z.object({ id: mongoIdSchema, userId: mongoIdSchema }) }), updateNotification);

export default router;
