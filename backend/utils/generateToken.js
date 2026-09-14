import jwt from 'jsonwebtoken';

const generateToken = (idOrUser, roleArg, emailArg) => {
  const payload = {};
  if (typeof idOrUser === 'object' && idOrUser !== null) {
    payload.id = idOrUser._id || idOrUser.id;
    if (idOrUser.role) payload.role = idOrUser.role;
    if (idOrUser.email) payload.email = idOrUser.email;
  } else {
    payload.id = idOrUser;
    if (roleArg) payload.role = roleArg;
    if (emailArg) payload.email = emailArg;
  }

  return jwt.sign(payload, process.env.JWT_SECRET || 'wanderluxe_secure_jwt_secret_key_2026', {
    expiresIn: '30d'
  });
};

export default generateToken;
