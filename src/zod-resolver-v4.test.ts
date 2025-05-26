import { z } from 'zod/v4';
import { act, renderHook } from '@testing-library/react';
import { useForm } from '@mantine/form';
import { ZodResolverOptions, zod4Resolver } from './zod-resolver';

const schema = z.object({
  name: z.string().min(2, { message: 'Name should have at least 2 letters' }),
  email: z.email({ message: 'Invalid email' }),
  age: z.number().min(18, { message: 'You must be at least 18 to create an account' }),
});

it('validates basic fields with given zod schema', () => {
  const hook = renderHook(() =>
    useForm({
      initialValues: {
        name: '',
        email: '',
        age: 16,
      },
      validate: zod4Resolver(schema),
    })
  );

  expect(hook.result.current.errors).toStrictEqual({});
  act(() => hook.result.current.validate());

  expect(hook.result.current.errors).toStrictEqual({
    name: 'Name should have at least 2 letters',
    email: 'Invalid email',
    age: 'You must be at least 18 to create an account',
  });

  act(() => hook.result.current.setValues({ name: 'John', email: 'john@email.com', age: 16 }));
  act(() => hook.result.current.validate());

  expect(hook.result.current.errors).toStrictEqual({
    age: 'You must be at least 18 to create an account',
  });
});

const nestedSchema = z.object({
  nested: z.object({
    field: z.string().min(2, { message: 'Field should have at least 2 letters' }),
  }),
});

it('validates nested fields with given zod schema', () => {
  const hook = renderHook(() =>
    useForm({
      initialValues: {
        nested: {
          field: '',
        },
      },
      validate: zod4Resolver(nestedSchema),
    })
  );

  expect(hook.result.current.errors).toStrictEqual({});
  act(() => hook.result.current.validate());

  expect(hook.result.current.errors).toStrictEqual({
    'nested.field': 'Field should have at least 2 letters',
  });

  act(() => hook.result.current.setValues({ nested: { field: 'John' } }));
  act(() => hook.result.current.validate());

  expect(hook.result.current.errors).toStrictEqual({});
});

const listSchema = z.object({
  list: z.array(
    z.object({
      name: z.string().min(2, { message: 'Name should have at least 2 letters' }),
    })
  ),
});

it('validates list fields with given zod schema', () => {
  const hook = renderHook(() =>
    useForm({
      initialValues: {
        list: [{ name: '' }],
      },
      validate: zod4Resolver(listSchema),
    })
  );

  expect(hook.result.current.errors).toStrictEqual({});
  act(() => hook.result.current.validate());

  expect(hook.result.current.errors).toStrictEqual({
    'list.0.name': 'Name should have at least 2 letters',
  });

  act(() => hook.result.current.setValues({ list: [{ name: 'John' }] }));
  act(() => hook.result.current.validate());

  expect(hook.result.current.errors).toStrictEqual({});
});

const mandatoryHashMessage = 'There must be a # in the hashtag';
const notEmptyMessage = 'Hashtag should not be empty';

const multipleMessagesForAFieldSchema = z.object({
  hashtag: z
    .string()
    .refine((value) => value.length > 0, {
      message: notEmptyMessage,
    })
    .refine((value) => value.includes('#'), {
      message: mandatoryHashMessage,
    }),
});

it.each([
  [
    {
      errorPriority: 'first',
    },
    notEmptyMessage,
  ],
  [
    {
      errorPriority: 'last',
    },
    mandatoryHashMessage,
  ],
  [undefined, mandatoryHashMessage],
])(
  `provides the proper error for a schema with multiple messages for a field with resolver option %p`,
  (options, expectedErrorMessage) => {
    const hook = renderHook(() =>
      useForm({
        initialValues: {
          hashtag: '',
        },
        validate: zod4Resolver(multipleMessagesForAFieldSchema, options as ZodResolverOptions),
      })
    );

    expect(hook.result.current.errors).toStrictEqual({});
    act(() => hook.result.current.validate());

    expect(hook.result.current.errors).toStrictEqual({
      hashtag: expectedErrorMessage,
    });
  }
);
