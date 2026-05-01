import {
  registerDecorator,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  type ValidationOptions,
} from 'class-validator';

/**
 * Validates Indonesian phone numbers.
 * Accepted formats: 08xxxxxxxx, +628xxxxxxxx, 628xxxxxxxx
 * Total digits (excluding prefix): 9-13 digits → full number: 10-15 chars
 */
const INDONESIAN_PHONE_REGEX = /^(\+62|62|0)8[0-9]{8,12}$/;

@ValidatorConstraint({ name: 'isIndonesianPhone', async: false })
export class IsIndonesianPhoneConstraint implements ValidatorConstraintInterface {
  validate(phone: unknown): boolean {
    if (typeof phone !== 'string') {
      return false;
    }

    const cleaned = phone.replace(/\s+/g, '');

    return INDONESIAN_PHONE_REGEX.test(cleaned);
  }

  defaultMessage(): string {
    return 'Nomor telepon harus berupa nomor telepon Indonesia yang valid (format: 08xx, +628xx, atau 628xx)';
  }
}

export function IsIndonesianPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsIndonesianPhoneConstraint,
    });
  };
}
