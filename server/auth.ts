import * as crypto from 'crypto';
import { getUserByEmail, createUser, getUserById, updateUser } from './db';

// Hash password using bcrypt-like approach
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
}

// Register new user
export async function registerUser(email: string, password: string, name?: string) {
  const existing = await getUserByEmail(email);
  if (existing) {
    throw new Error('User already exists');
  }

  const hashedPassword = await hashPassword(password);
  const openId = `email_${email}_${Date.now()}`;

  const result = await createUser({
    openId,
    email,
    password: hashedPassword,
    name: name || email.split('@')[0],
    loginMethod: 'email',
    role: 'user',
  });

  return result;
}

// Login user
export async function loginUser(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!user.password) {
    throw new Error('Invalid email or password');
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Update last signed in
  await updateUser(user.id, { lastSignedIn: new Date() });

  return user;
}

// Admin login
export async function loginAdmin(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user || user.role !== 'admin') {
    throw new Error('Invalid admin credentials');
  }

  if (!user.password) {
    throw new Error('Invalid admin credentials');
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    throw new Error('Invalid admin credentials');
  }

  // Update last signed in
  await updateUser(user.id, { lastSignedIn: new Date() });

  return user;
}

// Create default admin user
export async function createDefaultAdmin(email: string, password: string) {
  const existing = await getUserByEmail(email);
  if (existing) {
    return existing;
  }

  const hashedPassword = await hashPassword(password);
  const openId = `admin_${Date.now()}`;

  const result = await createUser({
    openId,
    email,
    password: hashedPassword,
    name: 'Admin',
    loginMethod: 'email',
    role: 'admin',
  });

  return result;
}

// Generate password reset token
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Verify reset token (in real app, store in database with expiry)
export function verifyResetToken(token: string): boolean {
  // This is simplified - in production, store tokens in DB with expiry
  return token.length === 64;
}

// Reset password
export async function resetPassword(email: string, newPassword: string) {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }

  const hashedPassword = await hashPassword(newPassword);
  await updateUser(user.id, { password: hashedPassword });

  return user;
}
