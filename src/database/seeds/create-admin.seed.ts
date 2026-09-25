import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import type { Repository } from 'typeorm';
import { AppModule } from '../../app.module.js';
import { BCRYPT_COST } from '../../auth/auth.service.js';
import { passwordSchema } from '../../auth/dto/password.schema.js';
import { User } from '../../users/entities/user.entity.js';
import { Role } from '../../users/enums/role.enum.js';
import { UsersService } from '../../users/users.service.js';

/**
 * Idempotent seed for the very first admin account.
 *
 * There is no HTTP path to create one: signup always forces `Role.USER`
 * (see `AuthService.signup`), and promoting a user to `Role.ADMIN` via
 * `PATCH /users/:id/role` already requires `Permission.USERS_MANAGE_ROLE`,
 * which only `Role.ADMIN` holds. Without this script the app could never
 * bootstrap its first admin.
 *
 * Safe to run on every deploy: it no-ops (exit code 0) if `ADMIN_EMAIL`
 * already exists.
 */
async function bootstrap(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error(
      'Missing ADMIN_EMAIL and/or ADMIN_PASSWORD environment variables. Aborting seed.',
    );
    process.exitCode = 1;
    return;
  }

  // Enforce the exact same password policy signup uses — an env var must
  // not be a backdoor around the app's own password rules.
  const passwordResult = passwordSchema.safeParse(adminPassword);
  if (!passwordResult.success) {
    console.error('ADMIN_PASSWORD does not satisfy the password policy:');
    for (const issue of passwordResult.error.issues) {
      console.error(`  - ${issue.message}`);
    }
    process.exitCode = 1;
    return;
  }

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const usersService = app.get(UsersService);
    const existing = await usersService.findByEmail(adminEmail);
    if (existing) {
      console.log(`Admin user "${adminEmail}" already exists. Skipping seed.`);
      return;
    }

    // UsersService.create() always hardcodes Role.USER by design (the same
    // guarantee signup relies on), so the admin row is created directly
    // through the repository instead of weakening that method's contract.
    const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    const passwordHash = await bcrypt.hash(passwordResult.data, BCRYPT_COST);
    const admin = userRepository.create({
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN,
    });
    await userRepository.save(admin);

    console.log(`Admin user "${adminEmail}" created.`);
  } catch (error) {
    console.error('Failed to seed admin user:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

await bootstrap();
