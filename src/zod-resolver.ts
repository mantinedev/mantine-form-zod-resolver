import type { ZodType } from 'zod/v4';
import type { Schema } from 'zod';
import type { FormErrors } from '@mantine/form';

export interface ZodResolverOptions {
  errorPriority?: 'first' | 'last';
}

export function zodResolver(schema: Schema, options?: ZodResolverOptions) {
  return (values: Record<string, unknown>): FormErrors => {
    const parsed = schema.safeParse(values);

    if (parsed.success) {
      return {};
    }

    const results: FormErrors = {};

    if ('error' in parsed) {
      if (options?.errorPriority === 'first') {
        parsed.error.errors.reverse();
      }
      parsed.error.errors.forEach((error) => {
        results[error.path.join('.')] = error.message;
      });
    }

    return results;
  };
}

export function zod4Resolver(schema: ZodType, options?: ZodResolverOptions) {
  return (values: Record<string, unknown>): FormErrors => {
    const parsed = schema.safeParse(values);

    if (parsed.success) {
      return {};
    }

    const results: FormErrors = {};

    if ('error' in parsed) {
      if (options?.errorPriority === 'first') {
        parsed.error.issues.reverse();
      }
      parsed.error.issues.forEach((error) => {
        results[error.path.join('.')] = error.message;
      });
    }

    return results;
  };
}
