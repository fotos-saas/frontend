import { Injectable } from '@angular/core';
import {
  ContactData,
  BasicInfoData,
  DesignData,
  RosterData
} from '../models/order-finalization.models';

/**
 * Validációs hibaüzenetek
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validációs eredmény
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Order Validation Service
 * Centralizált validációs logika az order-finalization komponenshez
 *
 * @description
 * - Step-enkénti validáció
 * - Email és telefon formátum ellenőrzés
 * - Max length validáció
 * - Magyar nyelvű hibaüzenetek
 */
@Injectable({
  providedIn: 'root'
})
export class OrderValidationService {
  /**
   * Email validáció (RFC 5322 egyszerűsített)
   * @param email - Email cím
   * @returns true ha valid
   */
  isValidEmail(email: string): boolean {
    if (!email || email.length > 254) return false;
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  /**
   * Telefon validáció (magyar formátum)
   * Elfogadott formátumok:
   * - +36 XX XXX XXXX
   * - 06 XX XXX XXXX
   * - 0036 XX XXX XXXX
   * - 36 XX XXX XXXX
   * - Szóközökkel, kötőjelekkel, zárójelekkel
   *
   * @param phone - Telefonszám
   * @returns true ha valid
   */
  isValidPhone(phone: string): boolean {
    if (!phone || phone.length > 25) return false;
    // Szóközök, kötőjelek, zárójelek eltávolítása
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    // Magyar telefon: +36..., 0036..., 36..., vagy 06... (9 számjegy a prefix után)
    // Példa: +36301234567, 0036301234567, 36301234567, vagy 06301234567
    const phoneRegex = /^(\+?36|0036|06)\d{9}$/;
    return phoneRegex.test(cleanPhone);
  }

  /**
   * Nem üres szöveg ellenőrzés
   * @param value - Szöveg érték
   * @returns true ha nem üres (trim után)
   */
  isNotEmpty(value: string | null | undefined): boolean {
    return !!(value && value.trim().length > 0);
  }

  /**
   * Max hossz ellenőrzés
   * @param value - Szöveg érték
   * @param maxLength - Maximum hossz
   * @returns true ha a hossz megfelelő
   */
  isWithinMaxLength(value: string | null | undefined, maxLength: number): boolean {
    if (!value) return true;
    return value.length <= maxLength;
  }

  /**
   * Step 1 (Kapcsolattartó) validáció
   * @param data - ContactData
   * @returns ValidationResult
   */
  validateContactData(data: ContactData): ValidationResult {
    const errors: ValidationError[] = [];

    if (!this.isNotEmpty(data.name)) {
      errors.push({ field: 'name', message: 'A név megadása kötelező' });
    } else if (!this.isWithinMaxLength(data.name, 100)) {
      errors.push({ field: 'name', message: 'A név maximum 100 karakter lehet' });
    }

    if (!this.isNotEmpty(data.email)) {
      errors.push({ field: 'email', message: 'Az email cím megadása kötelező' });
    } else if (!this.isValidEmail(data.email)) {
      errors.push({ field: 'email', message: 'Kérlek, adj meg egy érvényes email címet' });
    }

    if (!this.isNotEmpty(data.phone)) {
      errors.push({ field: 'phone', message: 'A telefonszám megadása kötelező' });
    } else if (!this.isValidPhone(data.phone)) {
      errors.push({ field: 'phone', message: 'Kérlek, adj meg egy érvényes magyar telefonszámot (pl. +36 30 123 4567)' });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Step 1 egyszerű valid check (computed signal-hoz)
   * @param data - ContactData
   * @returns true ha minden mező valid
   */
  isContactDataValid(data: ContactData): boolean {
    return this.validateContactData(data).valid;
  }

  /**
   * Step 2 (Alap adatok) validáció
   * @param data - BasicInfoData
   * @returns ValidationResult
   */
  validateBasicInfo(data: BasicInfoData): ValidationResult {
    const errors: ValidationError[] = [];

    if (!this.isNotEmpty(data.schoolName)) {
      errors.push({ field: 'schoolName', message: 'Az iskola nevének megadása kötelező' });
    } else if (!this.isWithinMaxLength(data.schoolName, 200)) {
      errors.push({ field: 'schoolName', message: 'Az iskola neve maximum 200 karakter lehet' });
    }

    if (!this.isNotEmpty(data.city)) {
      errors.push({ field: 'city', message: 'A város megadása kötelező' });
    } else if (!this.isWithinMaxLength(data.city, 100)) {
      errors.push({ field: 'city', message: 'A város neve maximum 100 karakter lehet' });
    }

    if (!this.isNotEmpty(data.className)) {
      errors.push({ field: 'className', message: 'Az osztály nevének megadása kötelező' });
    } else if (!this.isWithinMaxLength(data.className, 50)) {
      errors.push({ field: 'className', message: 'Az osztály neve maximum 50 karakter lehet' });
    }

    if (!this.isNotEmpty(data.classYear)) {
      errors.push({ field: 'classYear', message: 'Az évfolyam megadása kötelező' });
    } else if (!this.isWithinMaxLength(data.classYear, 20)) {
      errors.push({ field: 'classYear', message: 'Az évfolyam maximum 20 karakter lehet' });
    }

    // Quote opcionális, de max 500 karakter
    if (data.quote && !this.isWithinMaxLength(data.quote, 500)) {
      errors.push({ field: 'quote', message: 'Az idézet maximum 500 karakter lehet' });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Step 2 egyszerű valid check
   * @param data - BasicInfoData
   * @returns true ha minden kötelező mező valid
   */
  isBasicInfoValid(data: BasicInfoData): boolean {
    return this.validateBasicInfo(data).valid;
  }

  /**
   * Step 3 (Elképzelés) validáció
   * Betűtípus és betűszín opcionális - ha üres, grafikusra bízza / fekete lesz
   * @param data - DesignData
   * @returns ValidationResult
   */
  validateDesignData(data: DesignData): ValidationResult {
    const errors: ValidationError[] = [];

    // Betűtípus opcionális, de ha van, max 100 karakter
    if (data.fontFamily && !this.isWithinMaxLength(data.fontFamily, 100)) {
      errors.push({ field: 'fontFamily', message: 'A betűtípus neve maximum 100 karakter lehet' });
    }

    // Betűszín opcionális, de ha van, valid hex kód kell
    if (data.fontColor && !this.isValidHexColor(data.fontColor)) {
      errors.push({ field: 'fontColor', message: 'Érvénytelen színkód' });
    }

    // Description opcionális, de max 5000 karakter (rich text)
    if (data.description && !this.isWithinMaxLength(data.description, 5000)) {
      errors.push({ field: 'description', message: 'A leírás maximum 5000 karakter lehet' });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Step 3 egyszerű valid check
   * @param data - DesignData
   * @returns true ha minden kötelező mező valid
   */
  isDesignDataValid(data: DesignData): boolean {
    return this.validateDesignData(data).valid;
  }

  /**
   * Step 4 (Névsor) validáció
   * @param data - RosterData
   * @returns ValidationResult
   */
  validateRosterData(data: RosterData): ValidationResult {
    const errors: ValidationError[] = [];

    if (!this.isNotEmpty(data.studentRoster)) {
      errors.push({ field: 'studentRoster', message: 'A diákok névsorának megadása kötelező' });
    } else if (!this.isWithinMaxLength(data.studentRoster, 10000)) {
      errors.push({ field: 'studentRoster', message: 'A diákok névsora maximum 10000 karakter lehet' });
    }

    if (!this.isNotEmpty(data.teacherRoster)) {
      errors.push({ field: 'teacherRoster', message: 'A tanárok névsorának megadása kötelező' });
    } else if (!this.isWithinMaxLength(data.teacherRoster, 5000)) {
      errors.push({ field: 'teacherRoster', message: 'A tanárok névsora maximum 5000 karakter lehet' });
    }

    if (!data.acceptTerms) {
      errors.push({ field: 'acceptTerms', message: 'Az ÁSZF elfogadása kötelező' });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Step 4 egyszerű valid check
   * @param data - RosterData
   * @returns true ha minden kötelező mező valid
   */
  isRosterDataValid(data: RosterData): boolean {
    return this.validateRosterData(data).valid;
  }

  /**
   * Hex színkód validáció
   * @param color - Színkód (pl. #FF0000 vagy #F00)
   * @returns true ha valid hex színkód
   */
  private isValidHexColor(color: string): boolean {
    if (!color) return false;
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  }

  /**
   * Adott mező hibaüzenetének lekérése
   * @param errors - ValidationError tömb
   * @param field - Mező neve
   * @returns Hibaüzenet vagy null
   */
  getFieldError(errors: ValidationError[], field: string): string | null {
    const error = errors.find(e => e.field === field);
    return error ? error.message : null;
  }
}
