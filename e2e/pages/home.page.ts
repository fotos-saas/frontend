import { Page, Locator } from '@playwright/test';

/**
 * Home Page Object Model
 *
 * Bejelentkezett felhasználók kezdőlapja (home.component)
 * Projekt adatok, kapcsolattartók, fotózási időpont, navigáció
 */
export class HomePage {
  readonly page: Page;

  // ========== Fő tartalom ==========
  readonly mainContent: Locator;

  // ========== Hero szekció (iskola, osztály) ==========
  readonly schoolName: Locator;
  readonly className: Locator;

  // ========== Share gombók ==========
  readonly shareButton: Locator;
  readonly copyLinkButton: Locator;

  // ========== Kapcsolattartó szekció ==========
  readonly contactSection: Locator;
  readonly contactName: Locator;
  readonly contactPhone: Locator;
  readonly contactEmail: Locator;
  readonly editContactButton: Locator;

  // ========== Fotózás időpont szekció ==========
  readonly scheduleCard: Locator;
  readonly photoDateValue: Locator;
  readonly scheduleActionButton: Locator;

  // ========== Hiányzó képek alert ==========
  readonly missingPersonsAlert: Locator;
  readonly missingPersonsLink: Locator;

  // ========== Navigációs kártyák ==========
  readonly samplesNavCard: Locator;
  readonly templateChooserCard: Locator;
  readonly missingPersonsCard: Locator;
  readonly orderDataCard: Locator;

  // ========== Dialógusok ==========
  readonly scheduleReminderDialog: Locator;
  readonly finalizationReminderDialog: Locator;
  readonly contactEditDialog: Locator;

  constructor(page: Page) {
    this.page = page;

    // Hero szekció
    this.schoolName = page.locator('.hero__school');
    this.className = page.locator('.hero__class');

    // Share gombók
    this.shareButton = page.locator('.hero__share-btn--primary');
    this.copyLinkButton = page.locator('.hero__share-btn--secondary');

    // Főtartalom
    this.mainContent = page.locator('#main-content');

    // Kapcsolattartó szekció
    this.contactSection = page.locator('.contacts');
    this.contactName = page.locator('.contact__name');
    this.contactPhone = page.locator('.contact__link').filter({ hasText: /^\d+/ }).first();
    this.contactEmail = page.locator('a[href^="mailto:"]');
    this.editContactButton = page.locator('.contact__edit');

    // Fotózás időpont szekció
    this.scheduleCard = page.locator('.schedule__card');
    this.photoDateValue = page.locator('.schedule__value');
    this.scheduleActionButton = page.locator('.schedule__action');

    // Hiányzó képek
    this.missingPersonsAlert = page.locator('.missing-alert');
    this.missingPersonsLink = page.locator('.missing-alert__card');

    // Navigációs kártyák
    this.samplesNavCard = page.locator('a[routerLink="/samples"]');
    this.templateChooserCard = page.locator('a[routerLink="/template-chooser"]');
    this.missingPersonsCard = page.locator('a[routerLink="/missing-persons"]');
    this.orderDataCard = page.locator('a[routerLink="/order-data"]');

    // Dialógusok
    this.scheduleReminderDialog = page.locator('app-schedule-reminder-dialog');
    this.finalizationReminderDialog = page.locator('app-finalization-reminder-dialog');
    this.contactEditDialog = page.locator('app-contact-edit-dialog');
  }

  /**
   * Navigálás a home oldalra
   *
   * @param {string} [path=''] - Opcionális path (alapértelmezés: '/')
   */
  async goto(path: string = ''): Promise<void> {
    await this.page.goto(`/${path}`);
    // Megvárjuk, hogy az async project$ Observable betöltődjön
    await this.mainContent.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Iskola nevének lekérése
   */
  async getSchoolName(): Promise<string> {
    return await this.schoolName.textContent() || '';
  }

  /**
   * Osztály információ lekérése
   */
  async getClassName(): Promise<string> {
    return await this.className.textContent() || '';
  }

  /**
   * Megosztás gomb kattintása
   *
   * Nur native share API esetén működik (mobil eszközök)
   */
  async clickShareButton(): Promise<void> {
    await this.shareButton.click();
  }

  /**
   * Link másolása gomb kattintása
   */
  async clickCopyLinkButton(): Promise<void> {
    await this.copyLinkButton.click();
  }

  /**
   * Kapcsolattartó név lekérése
   */
  async getContactName(): Promise<string> {
    return await this.contactName.textContent() || '';
  }

  /**
   * Kapcsolattartó szerkesztés dialógus megnyitása
   */
  async openContactEditDialog(): Promise<void> {
    await this.editContactButton.click();
  }

  /**
   * Fotózási dátum lekérése
   *
   * @returns {Promise<string>} Dátum vagy "Nincs beállítva"
   */
  async getPhotoDate(): Promise<string> {
    return await this.photoDateValue.textContent() || '';
  }

  /**
   * Fotózási időpont dialógus megnyitása
   */
  async openScheduleDialog(): Promise<void> {
    await this.scheduleActionButton.click();
  }

  /**
   * Fotózási dátum szekció üres-e (nincs beállított dátum)
   */
  async isScheduleEmpty(): Promise<boolean> {
    const emptyClass = await this.scheduleCard.evaluate((el) =>
      el.classList.contains('schedule__card--empty')
    );
    return emptyClass;
  }

  /**
   * Hiányzó képek alert látható-e
   */
  async isMissingPersonsAlertVisible(): Promise<boolean> {
    try {
      await this.missingPersonsAlert.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Minta Választó kártya látható-e
   */
  async isTemplateChooserVisible(): Promise<boolean> {
    try {
      await this.templateChooserCard.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Minták navigációs kártya látható-e
   * Csak akkor látható, ha van leadott megrendelés (samplesCount > 0)
   */
  async isSamplesNavCardVisible(): Promise<boolean> {
    try {
      await this.samplesNavCard.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Minták navigációs kártya kattintása
   */
  async clickSamplesCard(): Promise<void> {
    await this.samplesNavCard.click();
  }

  /**
   * Minta Választó kártya kattintása
   */
  async clickTemplateChooserCard(): Promise<void> {
    await this.templateChooserCard.click();
  }

  /**
   * Hiányzó képek kártyájának kattintása
   */
  async clickMissingPersonsCard(): Promise<void> {
    await this.missingPersonsCard.click();
  }

  /**
   * Megrendelési adatok kártyájának kattintása
   */
  async clickOrderDataCard(): Promise<void> {
    await this.orderDataCard.click();
  }

  /**
   * Hiányzó képek alertjén keresztül hiányzó személyek oldalra navigálás
   */
  async navigateToMissingPersonsViaAlert(): Promise<void> {
    await this.missingPersonsLink.click();
  }

  /**
   * Megvárjuk, hogy az oldal teljesen betöltödjön
   *
   * @param {number} [timeout=5000] - Maximális várakozási idő milliszekundumban
   */
  async waitForPageLoad(timeout: number = 5000): Promise<void> {
    await this.mainContent.waitFor({ state: 'visible', timeout });
    // Várunk egy kis időt, hogy az animációk befejeződjenek
    await this.page.waitForTimeout(300);
  }

  /**
   * Ellenőrizzük, hogy a home oldal már betöltött-e
   *
   * @returns {Promise<boolean>} true ha az oldal betöltött
   */
  async isLoaded(): Promise<boolean> {
    try {
      await this.mainContent.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }
}
