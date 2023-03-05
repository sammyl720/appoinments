import { getAdminEmailList } from "../config/config";
import { OAuth2Client } from "google-auth-library";

export class AuthService {
  constructor(private client: OAuth2Client) {

  }
  async verify(token: string) {
    if (!token) return;
    const ticket = await this.client.verifyIdToken({
      idToken: token
    })

    const payload = ticket.getPayload();
    return payload;
  }

  async verifyAdmin(token: string) {
    const payload = await this.verify(token);
    if (!payload?.email) {
      return null;
    }

    return this.emailIsAdmin(payload.email) ? payload : null;
  }

  private emailIsAdmin(email: string) {
    return getAdminEmailList().includes(email);
  }
}