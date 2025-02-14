import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type AuditLogDocument = AuditLog & Document;

/**
 * Schema for audit logging of API requests and responses
 * Tracks detailed information about HTTP requests, their outcomes, and associated metadata
 */
@Schema({ timestamps: true })
export class AuditLog {
  /** HTTP method of the request (GET, POST, etc.) */
  @Prop({ required: true })
  method: string;

  /** Full URL path of the request */
  @Prop({ required: true })
  url: string;

  /** URL parameters from the request */
  @Prop({ type: Object })
  params: Record<string, any>;

  /** Query string parameters from the request */
  @Prop({ type: Object })
  query: Record<string, any>;

  /** Request body data */
  @Prop({ type: Object })
  body: Record<string, any>;

  /** Client's user agent string */
  @Prop()
  userAgent: string;

  /** Client's IP address */
  @Prop({ required: true })
  ipAddress: string;

  /** ID of the authenticated user making the request */
  @Prop()
  userId: string;

  /** Response data sent back to the client */
  @Prop({ type: Object })
  response: Record<string, any>;

  /** Error details if the request failed */
  @Prop({ type: Object })
  error: Record<string, any>;

  /** Indicates if the request resulted in an error */
  @Prop({ default: false })
  isFailed: boolean;

  /** HTTP status code of the response */
  @Prop()
  statusCode: number;

  /** Time taken to process the request in milliseconds */
  @Prop()
  duration: number;

  /** Unique identifier for correlating related requests */
  @Prop()
  requestId: string;

  /** Request headers */
  @Prop({ type: Object })
  headers: Record<string, any>;

  /** Origin or referer of the request */
  @Prop()
  origin: string;

  /** Session identifier for tracking user sessions */
  @Prop({ required: false })
  sessionId?: string;

  /** Worker identifier for distributed systems */
  @Prop({ required: false })
  workerId?: string;

  /** Timestamp when the log was created */
  createdAt: Date;

  /** Timestamp when the log was last updated */
  updatedAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
