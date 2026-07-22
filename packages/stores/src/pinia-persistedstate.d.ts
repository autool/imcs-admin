import 'pinia';

declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    persist?:
      | Array<{
          key?: string;
          pick?: string[];
          storage?: Storage;
        }>
      | boolean
      | {
          key?: string;
          pick?: string[];
          storage?: Storage;
        };
  }
}
