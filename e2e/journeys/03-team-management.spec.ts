import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/api.helper';
import { MailpitHelper } from '../helpers/mailpit.helper';
import { AuthHelper } from '../helpers/auth.helper';

/**
 * Journey 3: Csapattag kezelés
 *
 * Teszteli a csapattag meghívást, email küldést (Mailpit),
 * invite link elfogadást és csapattag belépést.
 */

let api: ApiHelper;
let mailpit: MailpitHelper;

const state: {
  partnerToken?: string;
  partnerId?: number;
  inviteCode?: string;
  inviteRegisterUrl?: string;
  teamMemberEmail?: string;
} = {};

test.beforeAll(async () => {
  api = new ApiHelper();
  mailpit = new MailpitHelper();
  await api.init();
  await mailpit.init();

  // Partner ID lekérés
  const loginResult = await api.login('partner@e2e.test', 'Partner1234!');
  const userData = loginResult.user as Record<string, unknown>;
  state.partnerId = userData.partner_id as number;
  state.partnerToken = loginResult.token;
});

test.afterAll(async () => {
  await api.dispose();
  await mailpit.dispose();
});

// ════════════════════════════════════════════════════════════
// FÁZIS 1: Csapattag oldal
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 1: Csapat oldal', () => {
  test('Csapattag oldal betöltődik', async ({ page }) => {
    const auth = new AuthHelper(page, api);
    await auth.loginViaUi('partner@e2e.test', 'Partner1234!');

    await page.goto('/partner/team');
    await page.waitForLoadState('networkidle');

    // Az oldal betöltődik (üres lista vagy tartalom)
    await expect(page.locator('body')).not.toContainText('404');
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 2: Meghívó küldése UI-n keresztül
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 2: Meghívó küldése', () => {
  test('Meghívás dialógus megnyílik', async ({ page }) => {
    const auth = new AuthHelper(page, api);
    await auth.loginViaUi('partner@e2e.test', 'Partner1234!');

    await page.goto('/partner/team');
    await page.waitForLoadState('networkidle');

    // "Meghívás" gomb jobb felül
    const inviteButton = page.getByRole('button', { name: /^meghívás$/i });
    await expect(inviteButton).toBeVisible({ timeout: 10_000 });
    await inviteButton.click();

    // Dialógus megjelenik
    await expect(page.getByText(/új csapattag meghívása/i)).toBeVisible({ timeout: 5_000 });
  });

  test('Meghívó küldhető email címmel', async ({ page }) => {
    const auth = new AuthHelper(page, api);
    await auth.loginViaUi('partner@e2e.test', 'Partner1234!');

    await page.goto('/partner/team');
    await page.waitForLoadState('networkidle');

    // Mailpit inbox törlése a teszt előtt
    await mailpit.clearInbox();

    // "Meghívás" gomb
    await page.getByRole('button', { name: /^meghívás$/i }).click();
    await expect(page.getByText(/új csapattag meghívása/i)).toBeVisible({ timeout: 5_000 });

    // Email kitöltése — dialog-ban a textbox "Email cím" label-lel
    state.teamMemberEmail = `designer-${Date.now()}@e2e.test`;
    const emailInput = page.getByRole('textbox', { name: /email cím/i });
    await emailInput.fill(state.teamMemberEmail);

    // Grafikus role alapból kiválasztva (checked a snapshot-ban)
    // Ha mégsem, kattintsunk rá
    const designerRadio = page.getByRole('radio', { name: /grafikus/i });
    if (!(await designerRadio.isChecked())) {
      await designerRadio.click();
    }

    // Küldés — a dialóguson belüli "Meghívó küldése" gomb (exact match)
    const dialog = page.getByRole('dialog');
    const submitButton = dialog.getByRole('button', { name: 'Meghívó küldése', exact: true });
    await expect(submitButton).toBeEnabled({ timeout: 5_000 });

    // API kérés monitorozás — sikeres meghívó küldés
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/partner/invitations') && res.request().method() === 'POST',
    );
    await submitButton.click();
    const response = await responsePromise;
    expect(response.status()).toBeLessThan(300);

    // Dialógus bezárul
    await expect(dialog).toBeHidden({ timeout: 5_000 });
  });

  test('Meghívó email megérkezett a Mailpit-be', async () => {
    test.skip(!state.teamMemberEmail, 'Nincs team member email — előző teszt nem futott');

    const email = await mailpit.waitForEmail({
      to: state.teamMemberEmail,
      timeout: 15_000,
    });

    expect(email.Subject).toBeTruthy();
    expect(email.HTML).toContain('INVITE-');

    // Invite kód kinyerése az emailből
    const codeMatch = email.HTML.match(/INVITE-[A-Z0-9]{6}/);
    if (codeMatch) {
      state.inviteCode = codeMatch[0];
    }

    // Regisztrációs link kinyerése
    const registerLink = mailpit.extractLink(email.HTML, /\/auth\/invite/);
    if (registerLink) {
      state.inviteRegisterUrl = registerLink;
    }

    expect(state.inviteCode || state.inviteRegisterUrl).toBeTruthy();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 3: Invite elfogadás (új user regisztráció)
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 3: Meghívó elfogadás', () => {
  test('Invite link megnyitható', async ({ page }) => {
    test.skip(!state.inviteCode && !state.inviteRegisterUrl, 'Nincs invite kód — előző teszt nem futott');

    // Invite oldalra navigálás
    const url = state.inviteRegisterUrl || `/auth/invite?code=${state.inviteCode}`;
    await page.goto(url);
    await page.waitForLoadState('networkidle');

    // Az invite oldal betölt (nem 404)
    await expect(page.locator('body')).not.toContainText('404');
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 4: Seeder-rel létrehozott csapattag belépés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 4: Csapattag belépés', () => {
  test('Seeder-rel létrehozott csapattag be tud lépni', async ({ page }) => {
    // Egyedi email (retry-safe, nem ütközik)
    const designerEmail = `designer-${Date.now()}@e2e.test`;

    // Csapattag létrehozás seeder-rel
    const teamMember = await api.seedTeamMember({
      partnerId: state.partnerId!,
      name: 'E2E Designer',
      email: designerEmail,
      password: 'Designer1234!',
      role: 'designer',
    });

    expect(teamMember.user_id).toBeGreaterThan(0);

    // Belépés — designer role a navigateByRole()-ban partner dashboardra megy
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /email/i }).click();
    await page.locator('ps-input[formcontrolname="email"] input').fill(designerEmail);
    await page.locator('ps-input[formcontrolname="password"] input').fill('Designer1234!');
    await page.getByRole('button', { name: /bejelentkezés/i }).click();

    // Designer → /partner/dashboard VAGY /designer/dashboard
    await expect(page).toHaveURL(/\/(partner|designer)/, { timeout: 15_000 });
  });
});
