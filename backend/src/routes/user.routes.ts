import { Router } from 'express';
import passport from 'passport';
import JWTStrategy from '@middlewares/passport.config';
import {
  getAllUsers,
  getUser,
  deleteUser,
  updateUser,
  getMe,
  updateMe,
  deleteMe,
} from '@controllers/user.controller';
import {
  login,
  signup,
  forgotPassword,
  resetPassword,
  updateMyPassword,
  restrictTo,
  isTokenValid,
} from '@controllers/auth.controller';
import { resizeUserImage, uploadUserPhoto } from '@middlewares/uploadingImage';
import checkReqQuery from '@middlewares/checkSearch.middleware';
import notificationRouter from '@routes/notification.routes';
import { validate } from '@middlewares/validation.middleware';
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  getUserSchema,
  updateUserSchema,
  updateMeSchema,
  getAllUsersSchema,
} from '@utils/validation.schemas';

const router = Router();

router.use('/:userId/notifications', notificationRouter);
router.route('/signup').post(validate(signupSchema), signup);
router.route('/login').post(validate(loginSchema), login);
router.route('/forgotPassword').post(validate(forgotPasswordSchema), forgotPassword);
router.route('/resetPassword/:token').get(isTokenValid).patch(validate(resetPasswordSchema), resetPassword);

//Protect all routes after this middleware
router.use(
  passport.authenticate('jwt', { session: false, failWithError: true })
);

router.route('/').get(validate(getAllUsersSchema), checkReqQuery, getAllUsers);
router.route('/me').get(getMe, getUser);
router.route('/updateMyPassword').patch(validate(updatePasswordSchema), updateMyPassword);
router.route('/updateMe').patch(uploadUserPhoto, resizeUserImage, validate(updateMeSchema), updateMe);
router.route('/deleteMe').delete(deleteMe);

//All routes after this middleware are only for admin
router.use(restrictTo('admin'));

router.route('/:id').get(validate(getUserSchema), getUser).delete(validate(getUserSchema), deleteUser).patch(validate(updateUserSchema), updateUser);
export default router;
