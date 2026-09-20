import { IStorageRepository } from './IStorageRepository';
import { LocalStorageRepository } from './LocalStorageRepository';

// Singleton instance of the active storage repository
export const storageService: IStorageRepository = new LocalStorageRepository();

export * from './IStorageRepository';
export * from './LocalStorageRepository';
