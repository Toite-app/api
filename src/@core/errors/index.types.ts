export interface ErrorOptions {
  property?: string;
}

export interface ErrorInstance {
  errorCode: string;
  message?: string;
  options?: ErrorOptions;
}
