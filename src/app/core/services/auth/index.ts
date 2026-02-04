/**
 * Auth Services - Moduláris autentikáció kezelés
 *
 * Az eredeti AuthService refaktorálva lett kisebb, fókuszált service-ekre:
 *
 * - TabloAuthService: 6-jegyű kód, share token, preview token bejelentkezés
 * - PasswordAuthService: Email/jelszó login, regisztráció, jelszó kezelés, 2FA
 * - SessionService: Session validálás, visszaállítás, kijelentkezés
 *
 * A fő AuthService facade-ként működik, delegálva a specializált service-eknek.
 */

export { TabloAuthService } from './tablo-auth.service';
export { PasswordAuthService, type MarketerLoginResponse } from './password-auth.service';
export { SessionService, type SessionInitResult } from './session.service';
