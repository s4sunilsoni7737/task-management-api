import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

const REQUEST_TIMEOUT_MS = 15_000;

/**
 * ✅ PATTERN: Registered once globally in main.ts. Kills any request that
 * hangs longer than 15 seconds, freeing the Node event loop from stuck
 * DB queries or downstream calls, and returns a clean 408 instead of
 * letting the client hang indefinitely.
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(REQUEST_TIMEOUT_MS),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException('Request timed out'));
        }
        return throwError(() => err);
      }),
    );
  }
}
