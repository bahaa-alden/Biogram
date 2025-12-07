import { Router } from 'express';
import passport from 'passport';
import {
  CreateMessage,
  getMessage,
  getAllMessages,
  updateMessage,
  deleteMessage,
  setSenderAndChat,
} from '@controllers/message.controller';
import { validate } from '@middlewares/validation.middleware';
import {
  createMessageSchema,
  getMessageSchema,
  updateMessageSchema,
  deleteMessageSchema,
  getAllMessagesSchema,
} from '@utils/validation.schemas';

const router = Router({ mergeParams: true });

router.use(
  passport.authenticate('jwt', { session: false, failWithError: true })
);
router.route('/').get(validate(getAllMessagesSchema), getAllMessages).post(validate(createMessageSchema), setSenderAndChat, CreateMessage);
router.route('/:id').get(validate(getMessageSchema), getMessage).patch(validate(updateMessageSchema), updateMessage).delete(validate(deleteMessageSchema), deleteMessage);

export default router;
