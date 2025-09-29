import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const getUserFromToken = async (token) => {
  try {
    const decoded = verifyToken(token);
    if (!decoded) return null;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isApproved: true,
        isAdmin: true,
        createdAt: true,
      },
    });
    
    return user;
  } catch (error) {
    return null;
  }
};

export const requireAuth = async (request) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'No token provided', status: 401 };
  }
  
  const token = authHeader.substring(7);
  const user = await getUserFromToken(token);
  
  if (!user) {
    return { error: 'Invalid token', status: 401 };
  }
  
  return { user };
};

export const requireAdmin = async (request) => {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult;
  
  if (!authResult.user.isAdmin) {
    return { error: 'Admin access required', status: 403 };
  }
  
  return authResult;
};

export { prisma };

