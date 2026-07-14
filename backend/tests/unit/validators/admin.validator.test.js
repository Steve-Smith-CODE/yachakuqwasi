import { setRoleSchema, addVerifiedDomainSchema } from '../../../src/validators/admin.validator.js';

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

describe('admin.validator - addVerifiedDomainSchema', () => {
  it('acepta un dominio y nombre de institucion validos', () => {
    const result = addVerifiedDomainSchema.safeParse({ domain: 'unsch.edu.pe', institutionName: 'UNSCH' });
    expect(result.success).toBe(true);
  });

  it('normaliza el dominio a minusculas', () => {
    const result = addVerifiedDomainSchema.safeParse({ domain: 'UNSCH.EDU.PE', institutionName: 'UNSCH' });
    expect(result.success).toBe(true);
    expect(result.data.domain).toBe('unsch.edu.pe');
  });

  it('rechaza un dominio con formato invalido', () => {
    const result = addVerifiedDomainSchema.safeParse({ domain: 'no es un dominio', institutionName: 'UNSCH' });
    expect(result.success).toBe(false);
  });

  it('rechaza si falta el nombre de la institucion', () => {
    const result = addVerifiedDomainSchema.safeParse({ domain: 'unsch.edu.pe', institutionName: '' });
    expect(result.success).toBe(false);
  });
});
