export * from './avatar.service';
import { AvatarService } from './avatar.service';
export * from './books.service';
import { BooksService } from './books.service';
export * from './booksslow.service';
import { BooksslowService } from './booksslow.service';
export const APIS = [AvatarService, BooksService, BooksslowService];
