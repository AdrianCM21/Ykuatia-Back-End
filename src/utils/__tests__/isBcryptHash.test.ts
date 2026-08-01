import { isBcryptHash } from '../isBcryptHash';

describe('isBcryptHash', () => {
  it('acepta hash bcrypt válido', () => {
    expect(
      isBcryptHash('$2b$10$AGBitscwzqp29mZ0Ozwa1e2b1Bhm4EcjHUbZ/lg8.dyeGYXqKNFay')
    ).toBe(true);
  });

  it('rechaza texto plano', () => {
    expect(isBcryptHash('admin123')).toBe(false);
  });
});
