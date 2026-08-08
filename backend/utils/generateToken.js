import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'wanderluxe_secure_jwt_secret_key_2026', {
    expiresIn: '30d'
  });
};

export default generateToken;
