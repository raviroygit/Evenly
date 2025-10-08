import { randomUUID } from 'crypto';

/**
 * Utility function to generate UUIDs consistently across the application
 */
export class UUIDUtils {
  /**
   * Generate a new UUID
   */
  static generate(): string {
    return randomUUID();
  }

  /**
   * Validate if a string is a valid UUID
   */
  static isValid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Generate a UUID for database insertion
   * This ensures we always have a valid UUID even if the database default fails
   */
  static generateForDB(): string {
    return this.generate();
  }
}

export default UUIDUtils;
