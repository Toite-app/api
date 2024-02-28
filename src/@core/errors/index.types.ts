export type ErrorMessage<T = unknown> =
  | {
      title: string;
      description?: string;
      details?: T;
    }
  | string;

export interface ErrorInstance<T = unknown> {
  errorCode: string;
  message: ErrorMessage<T>;
}
