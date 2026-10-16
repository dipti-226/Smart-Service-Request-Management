import {AbstractControl,ValidationErrors,ValidatorFn} from '@angular/forms';

import { FIELD_MESSAGES } from './validation-rules';

export type FieldName = keyof typeof FIELD_MESSAGES;

// Required text: a value of only spaces counts as empty (same as the API)
export const requiredText: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {

  const value = control.value;

  return typeof value === 'string' && value.trim().length > 0
    ? null
    : { required: true };
};

// Form level check: password and confirm password must be the same
export const passwordsMatch: ValidatorFn = (
  group: AbstractControl
): ValidationErrors | null => {

  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  return password === confirmPassword ? null : { passwordMismatch: true };
};

// The message of the first error the control has ('' when it is valid)
export function getFieldError(
  control: AbstractControl | null,
  field: FieldName
): string {

  if (!control || !control.errors) {
    return '';
  }

  const messages: Record<string, string> = FIELD_MESSAGES[field];

  for (const key of Object.keys(messages)) {
    if (control.hasError(key)) {
      return messages[key];
    }
  }

  return '';
}