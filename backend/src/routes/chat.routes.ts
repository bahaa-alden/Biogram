import { Router } from 'express';
import passport from 'passport';
import messageRouter from '@routes/message.routes';
import notificationRouter from '@routes/notification.routes';
import {
  accessChat,
  getAllChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  getChat,
  updateChat,
  deleteChat,
} from '@controllers/chat.controller';
import { validate } from '@middlewares/validation.middleware';
import {
  accessChatSchema,
  createGroupChatSchema,
  renameGroupSchema,
  addToGroupSchema,
  removeFromGroupSchema,
  getChatSchema,
  updateChatSchema,
  getAllChatsSchema,
} from '@utils/validation.schemas';

const router = Router();

router.use('/:chatId/messages', messageRouter);
router.use('/:chatId/notifications', notificationRouter);

router.use(
  passport.authenticate('jwt', { session: false, failWithError: true })
);

router.route('/').get(validate(getAllChatsSchema), getAllChats).post(validate(accessChatSchema), accessChat);
router.post('/group', validate(createGroupChatSchema), createGroupChat);
router.patch('/groupRename', validate(renameGroupSchema), renameGroup);
router.patch('/groupAdd', validate(addToGroupSchema), addToGroup);
router.patch('/groupRemove', validate(removeFromGroupSchema), removeFromGroup);
router.route('/:id').get(validate(getChatSchema), getChat).patch(validate(updateChatSchema), updateChat).delete(validate(getChatSchema), deleteChat);

export default router;
