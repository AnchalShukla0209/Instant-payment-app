import { AbstractControl, ValidationErrors } from '@angular/forms';

export function dobValidator(control: AbstractControl): ValidationErrors | null {

  if (!control.value) return null;

  const value = control.value;

  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d\d$/;

  if (!regex.test(value)) {
    return { invalidFormat: true };
  }

  const [day, month, year] = value.split('/').map(Number);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  ) {
    return { invalidDate: true };
  }
  const today = new Date();
  let age = today.getFullYear() - year;

  if (
    today.getMonth() < month - 1 ||
    (today.getMonth() === month - 1 && today.getDate() < day)
  ) {
    age--;
  }

  if (age < 18) {
    return { underAge: true };
  }

  if (age > 120) {
    return { invalidAge: true };
  }

  return null;
}
