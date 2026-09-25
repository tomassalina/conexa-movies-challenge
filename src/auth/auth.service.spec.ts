import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { User } from '../users/entities/user.entity.js';
import { Role } from '../users/enums/role.enum.js';
import type { UsersService } from '../users/users.service.js';
import { AuthService, BCRYPT_COST } from './auth.service.js';

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

function buildService() {
  const usersService = {
    findByEmail: vi.fn(),
    create: vi.fn(),
  } as unknown as UsersService;

  const jwtService = {
    signAsync: vi.fn(),
  } as unknown as JwtService;

  const service = new AuthService(usersService, jwtService);

  return { service, usersService, jwtService };
}

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signup', () => {
    it('rejects when the email is already registered', async () => {
      const { service, usersService } = buildService();
      (usersService.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'existing-id',
        email: 'taken@example.com',
        passwordHash: 'irrelevant',
        role: Role.USER,
      } as User);

      await expect(
        service.signup({ email: 'taken@example.com', password: 'Str0ng!Pass' }),
      ).rejects.toThrow(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('hashes the password with the configured cost before storing it, never the plaintext', async () => {
      const { service, usersService, jwtService } = buildService();
      const plainPassword = 'Str0ng!Pass';
      (usersService.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (bcrypt.hash as ReturnType<typeof vi.fn>).mockResolvedValue('$2b$10$hashed-value');
      (usersService.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'new-id',
        email: 'new@example.com',
        passwordHash: '$2b$10$hashed-value',
        role: Role.USER,
      } as User);
      (jwtService.signAsync as ReturnType<typeof vi.fn>).mockResolvedValue('signed-token');

      await service.signup({ email: 'new@example.com', password: plainPassword });

      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, BCRYPT_COST);
      const [, storedPasswordHash] = (usersService.create as ReturnType<typeof vi.fn>).mock
        .calls[0] as [string, string];
      expect(storedPasswordHash).toBe('$2b$10$hashed-value');
      expect(storedPasswordHash).not.toBe(plainPassword);
    });

    it('always creates the user with Role.USER, ignoring any role field on the input', async () => {
      const { service, usersService, jwtService } = buildService();
      (usersService.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (bcrypt.hash as ReturnType<typeof vi.fn>).mockResolvedValue('$2b$10$hashed-value');
      (usersService.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'new-id',
        email: 'new@example.com',
        passwordHash: '$2b$10$hashed-value',
        role: Role.USER,
      } as User);
      (jwtService.signAsync as ReturnType<typeof vi.fn>).mockResolvedValue('signed-token');

      // Simulate a malicious/unexpected payload carrying a `role` field —
      // the Zod schema already drops it, but this asserts the service layer
      // never reads or forwards a role either (defense in depth).
      const maliciousInput = {
        email: 'new@example.com',
        password: 'Str0ng!Pass',
        role: Role.ADMIN,
      };

      await service.signup(maliciousInput as unknown as Parameters<typeof service.signup>[0]);

      expect(usersService.create).toHaveBeenCalledTimes(1);
      const createCallArgs = (usersService.create as ReturnType<typeof vi.fn>).mock.calls[0] as
        | [string, string]
        | undefined;
      expect(createCallArgs).toEqual(['new@example.com', '$2b$10$hashed-value']);
      // Exactly 2 positional args: AuthService never has a third `role` arg to forward.
      expect(createCallArgs).toHaveLength(2);

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'new-id',
        role: Role.USER,
      });
    });
  });

  describe('login', () => {
    it('rejects with UnauthorizedException when the email is not registered', async () => {
      const { service, usersService } = buildService();
      (usersService.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        service.login({ email: 'ghost@example.com', password: 'whatever' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('rejects with UnauthorizedException when the password does not match', async () => {
      const { service, usersService } = buildService();
      (usersService.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'user-id',
        email: 'user@example.com',
        passwordHash: '$2b$10$stored-hash',
        role: Role.USER,
      } as User);
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      await expect(
        service.login({ email: 'user@example.com', password: 'WrongPass1!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns a signed JWT whose payload carries sub and role on valid credentials', async () => {
      const { service, usersService, jwtService } = buildService();
      (usersService.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'user-id',
        email: 'user@example.com',
        passwordHash: '$2b$10$stored-hash',
        role: Role.ADMIN,
      } as User);
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      (jwtService.signAsync as ReturnType<typeof vi.fn>).mockResolvedValue('signed-token');

      const result = await service.login({
        email: 'user@example.com',
        password: 'CorrectPass1!',
      });

      expect(bcrypt.compare).toHaveBeenCalledWith('CorrectPass1!', '$2b$10$stored-hash');
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-id',
        role: Role.ADMIN,
      });
      expect(result).toEqual({ accessToken: 'signed-token' });
    });
  });
});
