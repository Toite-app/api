import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";

import { schema } from "../db";

export type Guest = typeof schema.guests.$inferInsert;

// Simplified guest info for passing to order generation
export interface GuestInfo {
  id: string;
  name: string;
  phone: string;
}

export interface MockGuestsOptions {
  count: number;
}

// EU country phone number formats
interface PhoneConfig {
  country: string;
  code: string;
  digitLength: number; // number of digits after country code
}

const EU_PHONE_CONFIGS: PhoneConfig[] = [
  { country: "Estonia", code: "+372", digitLength: 8 },
  { country: "Latvia", code: "+371", digitLength: 8 },
  { country: "Lithuania", code: "+370", digitLength: 8 },
  { country: "Finland", code: "+358", digitLength: 9 },
  { country: "Sweden", code: "+46", digitLength: 9 },
  { country: "Denmark", code: "+45", digitLength: 8 },
  { country: "Norway", code: "+47", digitLength: 8 },
  { country: "Germany", code: "+49", digitLength: 10 },
  { country: "France", code: "+33", digitLength: 9 },
  { country: "Spain", code: "+34", digitLength: 9 },
  { country: "Italy", code: "+39", digitLength: 10 },
  { country: "Poland", code: "+48", digitLength: 9 },
  { country: "Netherlands", code: "+31", digitLength: 9 },
  { country: "Belgium", code: "+32", digitLength: 9 },
  { country: "Austria", code: "+43", digitLength: 10 },
  { country: "Czech Republic", code: "+420", digitLength: 9 },
  { country: "Portugal", code: "+351", digitLength: 9 },
  { country: "Greece", code: "+30", digitLength: 10 },
  { country: "Hungary", code: "+36", digitLength: 9 },
  { country: "Romania", code: "+40", digitLength: 9 },
];

function generatePhoneNumber(config: PhoneConfig): string {
  const digits = faker.string.numeric(config.digitLength);
  return `${config.code}${digits}`;
}

export function mockGuests(opts: MockGuestsOptions): Guest[] {
  const { count } = opts;

  // Track used values to ensure uniqueness
  const usedPhones = new Set<string>();
  const usedEmails = new Set<string>();

  return Array.from({ length: count }, () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;

    // Generate unique phone number from random EU country
    let phone: string;
    do {
      const phoneConfig = faker.helpers.arrayElement(EU_PHONE_CONFIGS);
      phone = generatePhoneNumber(phoneConfig);
    } while (usedPhones.has(phone));
    usedPhones.add(phone);

    // ~70% have email, ensure uniqueness
    let email: string | null = null;
    const hasEmail = faker.number.float({ min: 0, max: 1 }) < 0.7;
    if (hasEmail) {
      let candidateEmail: string;
      let attempts = 0;
      do {
        // Add random suffix after a few attempts to ensure uniqueness
        const suffix = attempts > 0 ? faker.string.numeric(4) : "";
        candidateEmail = faker.internet
          .email({ firstName, lastName: `${lastName}${suffix}` })
          .toLowerCase();
        attempts++;
      } while (usedEmails.has(candidateEmail) && attempts < 10);

      if (!usedEmails.has(candidateEmail)) {
        usedEmails.add(candidateEmail);
        email = candidateEmail;
      }
    }

    return {
      id: uuidv4(),
      name,
      phone,
      email,
      bonusBalance: 0,
      lastVisitAt: faker.date.recent({ days: 30 }),
    };
  });
}

// Helper to convert Guest[] to GuestInfo[] for order generation
export function toGuestInfoArray(guests: Guest[]): GuestInfo[] {
  return guests
    .filter((guest) => guest.id && guest.name)
    .map((guest) => ({
      id: guest.id!,
      name: guest.name!,
      phone: guest.phone,
    }));
}
