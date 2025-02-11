import { SetMetadata } from "@nestjs/common";

export const IS_AUDIT_LOG_ENABLED = "IS_AUDIT_LOG_ENABLED";
export const AUDIT_LOG_OPTIONS = "AUDIT_LOG_OPTIONS";

export interface AuditLogOptions {
  onlyErrors?: boolean;
}

export const EnableAuditLog = (options: AuditLogOptions = {}) => {
  return (target: any, key?: string | symbol, descriptor?: any) => {
    SetMetadata(IS_AUDIT_LOG_ENABLED, true)(target, key ?? "", descriptor);
    SetMetadata(AUDIT_LOG_OPTIONS, options)(target, key ?? "", descriptor);
  };
};
