import express from 'express';

import { forgotPassword, login, signup, resetPassword, updatePassword } from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';

const authRouter = express.Router();

authRouter.post('/signup', signup);
authRouter.post('/login', login);
authRouter.post('/forgot-password', forgotPassword);
authRouter.patch('/reset-password/:resetToken', resetPassword);
authRouter.patch('/update-password', protect, updatePassword);

export default authRouter;