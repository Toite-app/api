import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { AuditLog, AuditLogDocument } from "./schemas/audit-log.schema";

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(auditLogData: Partial<AuditLog>): Promise<AuditLogDocument> {
    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(auditLogData).filter(([, value]) => value !== undefined),
    );

    const auditLog = new this.auditLogModel(cleanData);
    return auditLog.save();
  }
}
