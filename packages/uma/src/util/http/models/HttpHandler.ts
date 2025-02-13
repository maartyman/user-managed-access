import { AsyncHandler } from '@solid/community-server';
import { HttpHandlerRequest } from './HttpHandlerRequest';
import { HttpHandlerResponse } from './HttpHandlerResponse';

export abstract class HttpHandler extends AsyncHandler<HttpHandlerRequest, HttpHandlerResponse> { }
