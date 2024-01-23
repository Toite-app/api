/**
 * Serialization options interface
 */
export interface ISerializationOptions {
  /**
   * Flag of non-exposed fields forbidden:
   * if it's true, non-exposed fields will be omitted in server response
   */
  forbidNonExposed: boolean;
}
