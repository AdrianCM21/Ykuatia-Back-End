const BCRYPT_HASH_REGEX = /^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/;

export const isBcryptHash = (value: string): boolean => BCRYPT_HASH_REGEX.test(value);
