/**
 * Validates a single value against a field definition (see DATA-MODEL.md).
 * Returns { valid: boolean, message?: string }.
 */
export function validateFieldValue(fieldDef, value) {
  const isEmpty = value === null || value === undefined || value === "";

  if (fieldDef.required && isEmpty) {
    return { valid: false, message: `${fieldDef.label} is required.` };
  }

  if (isEmpty) {
    return { valid: true };
  }

  switch (fieldDef.type) {
    case "number": {
      if (Number.isNaN(Number(value))) {
        return { valid: false, message: `${fieldDef.label} must be a number.` };
      }
      break;
    }
    case "email": {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(String(value))) {
        return { valid: false, message: `${fieldDef.label} must be a valid email address.` };
      }
      break;
    }
    case "date": {
      if (Number.isNaN(new Date(value).getTime())) {
        return { valid: false, message: `${fieldDef.label} must be a valid date.` };
      }
      break;
    }
    case "dropdown": {
      const allowed = (fieldDef.options || []).map((o) => o.value);
      if (allowed.length && !allowed.includes(value)) {
        return { valid: false, message: `${fieldDef.label} has an invalid selection.` };
      }
      break;
    }
    default:
      break;
  }

  return { valid: true };
}

/**
 * Validates a full record against a list of active field definitions.
 * Returns { valid: boolean, errors: { [fieldKey]: string } }.
 */
export function validateRecord(fieldDefs, record) {
  const errors = {};
  for (const fieldDef of fieldDefs) {
    const result = validateFieldValue(fieldDef, record[fieldDef.fieldKey]);
    if (!result.valid) {
      errors[fieldDef.fieldKey] = result.message;
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function isValidFieldKey(key) {
  return /^[a-z][a-zA-Z0-9]*$/.test(key || "");
}
