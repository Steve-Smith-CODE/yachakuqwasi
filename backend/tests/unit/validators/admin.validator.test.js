import { setRoleSchema } from '../../../src/validators/admin.validator.js';

describe('admin.validator - setRoleSchema', () => {
  it('acepta un rol valido', () => {
    const result = setRoleSchema.safeParse({ rol: 'landlord' });
    expect(result.success).toBe(true);
  });

  it('rechaza un rol invalido con el mensaje del errorMap', () => {
    const result = setRoleSchema.safeParse({ rol: 'super-admin' });

    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("rol debe ser 'student', 'landlord' o 'admin'");
  });
});
