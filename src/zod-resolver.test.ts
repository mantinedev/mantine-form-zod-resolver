import { z } from 'zod';
import { act, renderHook } from '@testing-library/react';
import { useForm } from '@mantine/form';
import { zodResolver } from '@mantine/form';

const schema = z.object({
  name: z.string().min(2, { message: 'Name should have at least 2 letters' }),
  email: z.string().email({ message: 'Invalid email' }),
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
      validate: zodResolver(schema),
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
      validate: zodResolver(nestedSchema),
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
