import { IProvider } from './IProvider';
type TProvider = {
    [key: string]: IProvider;
};
export declare const Provider: TProvider;
export declare function registerProvider(name: string, provider: IProvider): void;
export {};
