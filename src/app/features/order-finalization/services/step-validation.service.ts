import { Injectable } from '@angular/core';
import {
  ContactData,
  BasicInfoData,
  DesignData,
  RosterData,
  STEPPER_STEPS
} from '../models/order-finalization.models';

/**
 * Step Validation Service
 * Stepper lépések validációs logikája
 * Single Responsibility: csak validáció
 */
@Injectable()
export class StepValidationService {

  /**
   * Email validáció regex
   */
  private readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Step 1 - Kapcsolattartó validáció
   */
  validateStep1(data: ContactData): boolean {
    return !!(
      data.name.trim() &&
      data.email.trim() &&
      this.isValidEmail(data.email) &&
      data.phone.trim()
    );
  }

  /**
   * Step 2 - Alap adatok validáció
   */
  validateStep2(data: BasicInfoData): boolean {
    return !!(
      data.schoolName.trim() &&
      data.city.trim() &&
      data.className.trim() &&
      data.classYear.trim()
    );
  }

  /**
   * Step 3 - Elképzelés validáció
   * (fontFamily és fontColor kötelező)
   */
  validateStep3(data: DesignData): boolean {
    return !!(data.fontFamily.trim() && data.fontColor);
  }

  /**
   * Step 4 - Névsor validáció
   */
  validateStep4(data: RosterData): boolean {
    return !!(
      data.studentRoster.trim() &&
      data.teacherRoster.trim() &&
      data.acceptTerms
    );
  }

  /**
   * Adott lépés validációja (index alapján)
   */
  validateStep(
    stepIndex: number,
    contactData: ContactData,
    basicInfoData: BasicInfoData,
    designData: DesignData,
    rosterData: RosterData
  ): boolean {
    switch (stepIndex) {
      case 0: return this.validateStep1(contactData);
      case 1: return this.validateStep2(basicInfoData);
      case 2: return this.validateStep3(designData);
      case 3: return this.validateStep4(rosterData);
      default: return false;
    }
  }

  /**
   * Összes lépés valid-e
   */
  validateAllSteps(
    contactData: ContactData,
    basicInfoData: BasicInfoData,
    designData: DesignData,
    rosterData: RosterData
  ): boolean {
    return (
      this.validateStep1(contactData) &&
      this.validateStep2(basicInfoData) &&
      this.validateStep3(designData) &&
      this.validateStep4(rosterData)
    );
  }

  /**
   * Lépés elérhető-e (előző lépések validok)
   */
  isStepAccessible(
    stepIndex: number,
    contactData: ContactData,
    basicInfoData: BasicInfoData,
    designData: DesignData
  ): boolean {
    if (stepIndex === 0) return true;
    if (stepIndex === 1) return this.validateStep1(contactData);
    if (stepIndex === 2) {
      return this.validateStep1(contactData) && this.validateStep2(basicInfoData);
    }
    if (stepIndex === 3) {
      return (
        this.validateStep1(contactData) &&
        this.validateStep2(basicInfoData) &&
        this.validateStep3(designData)
      );
    }
    return false;
  }

  /**
   * Lépés kész-e (összes előző lépés valid)
   */
  isStepCompleted(
    stepIndex: number,
    contactData: ContactData,
    basicInfoData: BasicInfoData,
    designData: DesignData,
    rosterData: RosterData
  ): boolean {
    if (stepIndex === 0) return this.validateStep1(contactData);
    if (stepIndex === 1) {
      return this.validateStep1(contactData) && this.validateStep2(basicInfoData);
    }
    if (stepIndex === 2) {
      return (
        this.validateStep1(contactData) &&
        this.validateStep2(basicInfoData) &&
        this.validateStep3(designData)
      );
    }
    if (stepIndex === 3) {
      return this.validateAllSteps(contactData, basicInfoData, designData, rosterData);
    }
    return false;
  }

  /**
   * Előre ugrás validációja
   * @returns { valid: boolean, missingStepIndex?: number, missingStepName?: string }
   */
  validateStepJump(
    targetStepIndex: number,
    currentStepIndex: number,
    contactData: ContactData,
    basicInfoData: BasicInfoData,
    designData: DesignData,
    rosterData: RosterData
  ): { valid: boolean; missingStepIndex?: number; missingStepName?: string } {
    // Korábbi vagy aktuális lépésre mindig lehet ugrani
    if (targetStepIndex <= currentStepIndex) {
      return { valid: true };
    }

    // Előre ugráshoz minden korábbi lépésnek validnak kell lennie
    for (let i = 0; i < targetStepIndex; i++) {
      const valid = this.validateStep(i, contactData, basicInfoData, designData, rosterData);
      if (!valid) {
        return {
          valid: false,
          missingStepIndex: i,
          missingStepName: STEPPER_STEPS[i]
        };
      }
    }

    return { valid: true };
  }

  /**
   * Email validáció
   */
  private isValidEmail(email: string): boolean {
    return this.emailRegex.test(email);
  }
}
