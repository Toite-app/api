import * as crypto from "crypto";

import { Injectable, Logger } from "@nestjs/common";
import * as argon2 from "argon2";

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);

  private readonly algorithm = "aes-256-gcm";
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 12; // 96 bits recommended for GCM
  private readonly authTagLength = 16; // 128 bits
  private readonly saltLength = 32; // 128 bits for key derivation

  private readonly currentParams: argon2.Options = {
    version: 1,
    memoryCost: 65536, // 64MB in KiB
    timeCost: 10,
    parallelism: 4,
  };

  // Remove key storage from constructor since we'll derive it per operation
  constructor() {}

  private async deriveKey(
    salt: Buffer,
    params: argon2.Options,
  ): Promise<Buffer> {
    // Use Argon2id which provides the best balance of security against both
    // side-channel and GPU-based attacks
    const derivedKey = await argon2.hash(process.env.ENCRYPTION_SECRET ?? "", {
      salt,
      type: argon2.argon2id,
      memoryCost: params.memoryCost,
      timeCost: params.timeCost,
      parallelism: params.parallelism,
      hashLength: this.keyLength,
      raw: true, // Get raw buffer instead of encoded hash
    });

    return Buffer.from(derivedKey);
  }

  private encodeParams(params: argon2.Options): Buffer {
    const buffer = Buffer.alloc(13); // 4 + 4 + 4 + 1 bytes
    buffer.writeUInt8(params.version ?? this.currentParams.version ?? 1, 0);
    buffer.writeUInt32LE(
      params.memoryCost ?? this.currentParams.memoryCost ?? 65536,
      1,
    );
    buffer.writeUInt32LE(
      params.timeCost ?? this.currentParams.timeCost ?? 10,
      5,
    );
    buffer.writeUInt32LE(
      params.parallelism ?? this.currentParams.parallelism ?? 4,
      9,
    );
    return buffer;
  }

  private decodeParams(buffer: Buffer): argon2.Options {
    return {
      version: buffer.readUInt8(0),
      memoryCost: buffer.readUInt32LE(1),
      timeCost: buffer.readUInt32LE(5),
      parallelism: buffer.readUInt32LE(9),
    };
  }

  async encrypt(text: string): Promise<string> {
    // Generate a random salt for key derivation
    const salt = crypto.randomBytes(this.saltLength);
    const params = this.currentParams;
    const key = await this.deriveKey(salt, params);

    // Generate a random initialization vector
    const iv = crypto.randomBytes(this.ivLength);

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    // Encrypt the text
    const encrypted = Buffer.concat([
      cipher.update(text, "utf8"),
      cipher.final(),
    ]);

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Combine params, salt, IV, encrypted text, and auth tag
    const paramsBuffer = this.encodeParams(params);
    const result = Buffer.concat([paramsBuffer, salt, iv, encrypted, authTag]);

    // Return as base64 string
    return result.toString("base64");
  }

  async decrypt(encryptedText: string): Promise<string> {
    try {
      // Convert base64 string to buffer
      const buffer = Buffer.from(encryptedText, "base64");

      // Extract parameters, salt, IV, encrypted text, and auth tag
      const paramsBuffer = buffer.subarray(0, 13);
      const params = this.decodeParams(paramsBuffer);

      const salt = buffer.subarray(13, 13 + this.saltLength);
      const iv = buffer.subarray(
        13 + this.saltLength,
        13 + this.saltLength + this.ivLength,
      );
      const authTag = buffer.subarray(buffer.length - this.authTagLength);
      const encrypted = buffer.subarray(
        13 + this.saltLength + this.ivLength,
        buffer.length - this.authTagLength,
      );

      // Derive the key using the extracted salt and original parameters
      const key = await this.deriveKey(salt, params);

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt the text
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString("utf8");
    } catch (error) {
      this.logger.error("Decryption failed:", error);
      throw new Error("Decryption failed. Data may be corrupted or tampered.");
    }
  }
}
