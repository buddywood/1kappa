import { Model, ModelCtor } from 'sequelize-typescript';

/**
 * Base model class with common functionality
 * Handles JSONB fields and timestamps
 */
export abstract class BaseModel<T extends {} = any, T2 extends {} = any> extends Model<T, T2> {
  /**
   * Helper to parse JSONB fields that might come as strings
   */
  protected parseJsonbField(value: any): any {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    }
    return value || {};
  }

  /**
   * Helper to stringify JSONB fields
   */
  protected stringifyJsonbField(value: any): string {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value || {});
  }
}

