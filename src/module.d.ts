declare interface NodeModule {
    hot?: {
        accept(path?: string, fn: () => void, callback?: () => void): void;
    };
}

declare module 'buffer' {
    declare class Buffer extends Uint8Array {
        constructor(buffer: ArrayBuffer): this;
        [key: number]: number;
    }
}
