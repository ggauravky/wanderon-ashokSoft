import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { getJwtSecret } from '../config/environment.js';

const generateToken = (idOrUser) => {
  const userId = typeof idOrUser === 'object' && idOrUser !== null
    ? idOrUser._id || idOrUser.id
    : idOrUser;
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error('A real MongoDB User ID is required to create a session.');

  return jwt.sign({ userId: String(userId) }, getJwtSecret(), {
    expiresIn: '30d'
  });
};

export default generateToken;
