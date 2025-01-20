import * as fs from "fs/promises";
import * as path from "path";

import { faker } from "@faker-js/faker";
import { DatabaseHelper, schema } from "test/helpers/database";

interface City {
  name: string;
  coordinatesRange: {
    latitude: [number, number];
    longitude: [number, number];
  };
  timezone: string;
}

const cities: City[] = [
  {
    name: "Tallinn",
    coordinatesRange: {
      latitude: [59.38, 59.5],
      longitude: [24.65, 24.85],
    },
    timezone: "Europe/Tallinn",
  },
  {
    name: "Pärnu",
    coordinatesRange: {
      latitude: [58.33, 58.42],
      longitude: [24.45, 24.6],
    },
    timezone: "Europe/Tallinn",
  },
  {
    name: "Kuressaare",
    coordinatesRange: {
      latitude: [58.21, 58.28],
      longitude: [22.42, 22.52],
    },
    timezone: "Europe/Tallinn",
  },
];

interface CachedAddress {
  city: string;
  address: string;
  latitude: string;
  longitude: string;
}

interface AddressCache {
  addresses: CachedAddress[];
}

const CACHE_FILE_PATH = path.join(
  process.cwd(),
  "test",
  "helpers",
  "seed",
  "cache.json",
);

// Track used addresses and new addresses in memory during the seeding session
const usedAddresses = new Set<string>();
let newAddresses: CachedAddress[] = [];

async function loadOrCreateCache(): Promise<AddressCache> {
  try {
    const cacheContent = await fs.readFile(CACHE_FILE_PATH, "utf-8");
    return JSON.parse(cacheContent);
  } catch {
    return { addresses: [] };
  }
}

async function saveCache(cache: AddressCache): Promise<void> {
  await fs.writeFile(CACHE_FILE_PATH, JSON.stringify(cache, null, 2));
}

async function getGoogleAddress(
  latitude: number,
  longitude: number,
): Promise<string> {
  const apiKey = process.env?.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return faker.location.streetAddress({
      useFullAddress: true,
    });
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`,
    );
    const data = await response.json();

    if (data.results?.[0]?.formatted_address) {
      return data.results[0].formatted_address;
    }

    return faker.location.streetAddress({ useFullAddress: true });
  } catch (error) {
    console.warn(
      "Failed to fetch Google address, using faker fallback:",
      error,
    );
    return faker.location.streetAddress({ useFullAddress: true });
  }
}

async function getOrCreateAddress(city: City): Promise<CachedAddress> {
  const cache = await loadOrCreateCache();

  // Try to find unused cached address for this city
  const availableAddress = cache.addresses.find(
    (addr) => addr.city === city.name && !usedAddresses.has(addr.address),
  );

  if (availableAddress) {
    usedAddresses.add(availableAddress.address);
    return availableAddress;
  }

  // Generate new coordinates and get address from Google
  const latitude = faker.location.latitude({
    min: city.coordinatesRange.latitude[0],
    max: city.coordinatesRange.latitude[1],
  });

  const longitude = faker.location.longitude({
    min: city.coordinatesRange.longitude[0],
    max: city.coordinatesRange.longitude[1],
  });

  const address = await getGoogleAddress(latitude, longitude);

  const newCachedAddress: CachedAddress = {
    city: city.name,
    address,
    latitude: latitude.toString(),
    longitude: longitude.toString(),
  };

  // Store new address in memory instead of saving immediately
  newAddresses.push(newCachedAddress);
  usedAddresses.add(address);

  return newCachedAddress;
}

const mockRestaurants = async (
  count: number,
): Promise<(typeof schema.restaurants.$inferInsert)[]> => {
  const restaurants = await Promise.all(
    Array.from({ length: count }, async () => {
      const name = faker.company.name();
      const estoniaLegalEntityCode = `EE${faker.string.numeric(8)}`;
      const legalEntity = `${faker.company.name()}, ${estoniaLegalEntityCode}`;
      const city = faker.helpers.arrayElement(cities);

      const addressData = await getOrCreateAddress(city);

      console.log("Seeding restaurant:", name, addressData.address);

      return {
        name,
        legalEntity,
        address: addressData.address,
        latitude: addressData.latitude,
        longitude: addressData.longitude,
        timezone: city.timezone,
        isEnabled: true,
        isClosedForever: false,
      } as typeof schema.restaurants.$inferInsert;
    }),
  );

  return restaurants;
};

export default async function seedRestaurants(count: number) {
  console.log("Seeding restaurants...");
  const restaurants = await mockRestaurants(count);
  await DatabaseHelper.pg.insert(schema.restaurants).values(restaurants);

  // After successful insert, update the cache file with new addresses
  if (newAddresses.length > 0) {
    const cache = await loadOrCreateCache();
    cache.addresses.push(...newAddresses);
    await saveCache(cache);
    // Reset new addresses array for next run
    newAddresses = [];
  }
}
