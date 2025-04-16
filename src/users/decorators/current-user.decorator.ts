import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { CURRENT_USER_KEY } from '../../utils/constants';
import { JWTPayload } from '../../utils/types';

// CurrentUser Parameter Decorator
export const CurrentUser = createParamDecorator(
  (data, context: ExecutionContext) => {
    const request: Request = context.switchToHttp().getRequest();

    const payload: JWTPayload = request[CURRENT_USER_KEY] as JWTPayload;

    return payload;
  },
);
