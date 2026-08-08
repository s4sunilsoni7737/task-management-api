import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as not requiring authentication. Not currently used
 * globally (guards are applied per-route in this project rather than
 * app-wide), but kept available for routes that opt into a global guard
 * in the future.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
