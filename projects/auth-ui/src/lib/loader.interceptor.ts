import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { finalize } from "rxjs";
import { LoadingService } from "./loading.service";

export const LoaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loader = inject(LoadingService);

  // Permite “saltarlo” agregando el header X-Background: 1
  const skip = req.headers.has('X-Background');
  if (!skip) loader.show();

  return next(req).pipe(finalize(() => { if (!skip) loader.hide(); }));
};