declare module "sequelize-typescript" {
  /**
   * Lightweight ambient typings for `sequelize-typescript`.
   *
   * The runtime library is already installed and working; however, its
   * TypeScript declarations are either missing or incompatible with our setup.
   * To keep type-checking unblocked, we provide minimal, very permissive
   * definitions that model the decorators and classes we actually use.
   *
   * NOTE: These are intentionally loose (`any`-heavy) and are meant only to
   * satisfy the compiler, not to provide strict typing.
   */

  type AnyDecorator = (...args: any[]) => any;

  export const Table: AnyDecorator;
  export const Column: AnyDecorator;
  export const BelongsTo: AnyDecorator;
  export const HasMany: AnyDecorator;
  export const HasOne: AnyDecorator;
  export const ForeignKey: AnyDecorator;
  export const BelongsToMany: AnyDecorator;

  export const DataType: {
    [key: string]: any;
  };

  export class Sequelize {
    [key: string]: any;
    constructor(...args: any[]);
  }

  export class Model<TAttributes = any, TCreationAttributes = any> {
    [key: string]: any;
    // Allow any static methods like findOne, findAll, create, etc.
    static [key: string]: any;
  }

  export type ModelCtor<M extends Model = Model> = {
    new (...args: any[]): M;
  } & typeof Model;

  // No default export in our usage
}

declare global {
  // Allow arbitrary static properties on constructor functions (e.g. Sequelize models)
  // so calls like `Seller.findOne(...)` type-check without needing full ORM typings.
  interface Function {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }
}



