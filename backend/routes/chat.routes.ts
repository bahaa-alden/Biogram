import { Router } from 'express';
import passport from 'passport';
import messageRouter from '@routes/message.routes';
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

const router = Router();

router.use('/:chatId/messages', messageRouter);

router.use(
  passport.authenticate('jwt', { session: false, failWithError: true })
);

router.route('/').get(getAllChats).post(accessChat);
router.post('/group', createGroupChat);
router.patch('/groupRename', renameGroup);
router.patch('/groupAdd', addToGroup);
router.patch('/groupRemove', removeFromGroup);
router.route('/:id').get(getChat).patch(updateChat).delete(deleteChat);

export default router;
