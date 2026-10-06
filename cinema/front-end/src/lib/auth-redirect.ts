import type { User } from '@/types/auth';

export const getHomePath = (user: Pick<User, 'role'>) =>
  user.role === 'ADMIN' ? '/admin' : '/';