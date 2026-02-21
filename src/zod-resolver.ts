import { safeParse, safeParseAsync, type $ZodType } from 'zod/v4/core';
import type { FormErrors } from '@mantine/form';

export interface ZodResolverOptions {
  errorPriority?: 'first' | 'last';
  mode?: 'auto' | 'sync' | 'async';
}

type ValidationResult = FormErrors | Promise<FormErrors>;
type ZodIssue = { path: PropertyKey[]; message: string };

function getValidationErrors(issues: ZodIssue[], options?: ZodResolverOptions): FormErrors {
  const resolvedIssues = options?.errorPriority === 'first' ? [...issues].reverse() : issues;
  const results: FormErrors = {};

  resolvedIssues.forEach((issue) => {
    const fieldPath = issue.path.map(String).join('.');
    results[fieldPath] = issue.message;
  });

  return results;
}

function isAsyncParseError(error: unknown): error is Error {
  return error instanceof Error && error.message.includes('parseAsync');
}

function resolveWithZodV4(
  schema: $ZodType,
  values: Record<string, unknown>,
  options?: ZodResolverOptions
) {
  const parsed = safeParse(schema, values);

  if (parsed.success) {
    return {};
  }

  return getValidationErrors(parsed.error.issues, options);
}

function resolveWithZodV4Async(
  schema: $ZodType,
  values: Record<string, unknown>,
  options?: ZodResolverOptions
) {
  return safeParseAsync(schema, values).then((parsed) => {
    if (parsed.success) {
      return {};
    }

    return getValidationErrors(parsed.error.issues, options);
  });
}

export function zodResolver(
  schema: $ZodType,
  options: ZodResolverOptions & { mode: 'sync' }
): (values: Record<string, unknown>) => FormErrors;

export function zodResolver(
  schema: $ZodType,
  options: ZodResolverOptions & { mode: 'async' }
): (values: Record<string, unknown>) => Promise<FormErrors>;

export function zodResolver(
  schema: $ZodType,
  options?: ZodResolverOptions
): (values: Record<string, unknown>) => ValidationResult;

export function zodResolver(schema: $ZodType, options?: ZodResolverOptions) {
  return (values: Record<string, unknown>): ValidationResult => {
    if (options?.mode === 'async') {
      return resolveWithZodV4Async(schema, values, options);
    }

    try {
      return resolveWithZodV4(schema, values, options);
    } catch (error) {
      if (!isAsyncParseError(error)) {
        throw error;
      }

      if (options?.mode === 'sync') {
        throw error;
      }

      return resolveWithZodV4Async(schema, values, options);
    }
  };
}
