import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { DatabaseService } from "../database/database.service";
import { LoginDto } from "./dto/login.dto";

export type AuthUser = { id: string; email: string; fullName: string; role: string };

@Injectable()
export class AuthService {
  constructor(private readonly database: DatabaseService, private readonly jwt: JwtService) {}

  async login(input: LoginDto) {
    const result = await this.database.query<{ id: string; email: string; full_name: string; role: string }>(
      `SELECT id, email, full_name, role FROM app.users
        WHERE email = $1 AND is_active = TRUE AND password_hash = crypt($2, password_hash)`,
      [input.email.toLowerCase(), input.password],
    );
    const row = result.rows[0];
    if (!row) throw new UnauthorizedException("Invalid email or password.");

    const user = this.mapUser(row);
    return { accessToken: await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role }), user };
  }

  async getUserById(id: string): Promise<AuthUser> {
    const result = await this.database.query<{ id: string; email: string; full_name: string; role: string }>(
      "SELECT id, email, full_name, role FROM app.users WHERE id = $1 AND is_active = TRUE",
      [id],
    );
    const row = result.rows[0];
    if (!row) throw new UnauthorizedException("User session is no longer valid.");
    return this.mapUser(row);
  }

  private mapUser(row: { id: string; email: string; full_name: string; role: string }): AuthUser {
    return { id: row.id, email: row.email, fullName: row.full_name, role: row.role };
  }
}
