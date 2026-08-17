import fs from 'fs/promises';
import path from 'path';

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  date: string;
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: OrderItem[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  addresses: Address[];
  orders: Order[];
}

export type SafeUser = Omit<User, 'passwordHash'>;

const DATA_FILE = path.join(process.cwd(), 'data', 'users.json');

async function readUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data) as User[];
  } catch (error) {
    // If file doesn't exist yet, return empty array
    return [];
  }
}

async function writeUsers(users: User[]): Promise<void> {
  const dir = path.dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

export function toSafeUser(user: User): SafeUser {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * UserRepository Pattern
 * Single source of truth for user data access.
 * Replace implementation inside these functions when migrating to a DB (e.g. Prisma / Supabase).
 */
export const UserRepository = {
  async findByEmail(email: string): Promise<User | null> {
    const users = await readUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    return user || null;
  },

  async findById(id: string): Promise<User | null> {
    const users = await readUsers();
    const user = users.find((u) => u.id === id);
    return user || null;
  },

  async create(data: { name: string; email: string; passwordHash: string }): Promise<SafeUser> {
    const users = await readUsers();
    const normalizedEmail = data.email.trim().toLowerCase();

    const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: data.name.trim(),
      email: normalizedEmail,
      passwordHash: data.passwordHash,
      createdAt: new Date().toISOString(),
      addresses: [],
      orders: [
        {
          id: 'ORD-8921',
          date: new Date().toISOString(),
          total: 1450,
          status: 'Processing',
          items: [
            {
              id: 'prod-1',
              title: 'Aura Velvet Armchair',
              price: 1450,
              quantity: 1,
              image: '/product image/sofa 1 front preview.png'
            }
          ]
        }
      ]
    };

    users.push(newUser);
    await writeUsers(users);

    return toSafeUser(newUser);
  }
};
