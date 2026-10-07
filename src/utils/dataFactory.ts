import { faker } from '@faker-js/faker';
import type { TestUser } from '../types';

export const DataFactory = {
  uniqueEmail(): string {
    return `qa_${Date.now()}_${faker.string.alphanumeric(5).toLowerCase()}@example.com`;
  },

  strongPassword(): string {
    return `Pass@${faker.string.numeric(6)}aB`;
  },

  fullName(): string {
    return faker.person.fullName();
  },

  phone(): string {
    return `9${faker.string.numeric(9)}`;
  },

  randomUser(): TestUser {
    return {
      name: DataFactory.fullName(),
      email: DataFactory.uniqueEmail(),
      password: DataFactory.strongPassword(),
    };
  },
};