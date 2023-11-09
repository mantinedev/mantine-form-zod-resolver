import type { Schema } from 'zod';
import type { FormErrors } from '@mantine/form';

export function zodResolver(schema: Schema) {
  return (values: Record<string, unknown>): FormErrors => {
    const parsed = schema.safeParse(values);

    if (parsed.success) {
      return {};
    }

    const results: FormErrors = {};

    if ('error' in parsed) {
      parsed.error.errors.forEach((error) => {
        results[error.path.join('.')] = error.message;
      });
    }

    return results;
  };
}
