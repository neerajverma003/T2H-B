import jwt from 'jsonwebtoken';

export const generateToken = (userID, role = null) => {
  const payload = { id: userID };
  if (role) {
    payload.role = role; // Include role only if provided
  }

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
};

export const formatCountryName = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const generateToeknAdmin = (userID, role) => {
  return jwt.sign({ id: userID, role: role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};


export const generateSlug = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-')        // replace spaces with -
    .replace(/-+/g, '-');        // collapse dashes
};
