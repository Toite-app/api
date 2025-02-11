import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ required: true })
  method: string;

  @Prop({ required: true })
  url: string;

  @Prop({ type: Object })
  params: Record<string, any>;

  @Prop({ type: Object })
  query: Record<string, any>;

  @Prop({ type: Object })
  body: Record<string, any>;

  @Prop()
  userAgent: string;

  @Prop({ required: true })
  ipAddress: string;

  @Prop()
  userId: string;

  @Prop({ type: Object })
  response: Record<string, any>;

  @Prop({ type: Object })
  error: Record<string, any>;

  @Prop({ default: false })
  isFailed: boolean;

  @Prop()
  statusCode: number;

  @Prop()
  duration: number; // Request duration in milliseconds

  @Prop()
  requestId: string; // Unique identifier for the request

  @Prop({ type: Object })
  headers: Record<string, any>;

  @Prop()
  origin: string; // Request origin/referer

  @Prop({ required: false })
  sessionId?: string;

  @Prop({ required: false })
  workerId?: string;

  // Automatically managed by timestamps option
  createdAt: Date;
  updatedAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
