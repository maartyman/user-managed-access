import {
  InteractionRoute,
  InternalServerError,
  MethodNotAllowedHttpError,
  NotFoundHttpError
} from '@solid/community-server';
import { HttpHandler } from '../models/HttpHandler';
import { HttpHandlerRequest } from '../models/HttpHandlerRequest';
import { HttpHandlerResponse } from '../models/HttpHandlerResponse';

export interface InteractionRouterHandlerArgs {
  /**
   * The handler to call if all checks pass.
   */
  handler: HttpHandler;
  /**
   * The allowed method(s). `*` can be used to indicate all methods are allowed.
   * Default is `[ '*' ]`.
   */
  allowedMethods?: string[];
  /**
   * Routes used to match the target URL.
   * Default is a route that matches everything.
   */
  allowedRoutes?: InteractionRoute[];
}

/**
 *  Only allows requests that fulfill certain conditions.
 *  The HTTP method and URL get verified, if there is a match, the source handler gets called.
 */
export class InteractionRouterHandler extends HttpHandler {
  protected readonly handler: HttpHandler;
  protected readonly allowedMethods?: string[];
  protected readonly allowedRoutes: InteractionRoute[];

  protected readonly cache = new WeakMap<HttpHandlerRequest, HttpHandlerRequest>;

  public constructor(args: InteractionRouterHandlerArgs) {
    super();
    this.handler = args.handler;
    this.allowedMethods = args.allowedMethods;
    // Create a custom route that allows everything if there was no input
    this.allowedRoutes = args.allowedRoutes ?? [{
      getPath: () => '',
      matchPath: () => ({})
    }];
  }

  public async canHandle(request: HttpHandlerRequest): Promise<void> {
    if (this.allowedMethods && !this.allowedMethods.includes(request.method)) {
      throw new MethodNotAllowedHttpError([request.method]);
    }

    let match: Record<string, string> | undefined;
    for (const route of this.allowedRoutes) {
      match = route.matchPath(request.url.toString());
      if (match) {
        break;
      }
    }
    if (!match) {
      throw new NotFoundHttpError();
    }


    const newInput: HttpHandlerRequest = {
      ...request,
      parameters: {
        ...request.parameters,
        ...match,
      }
    }
    await this.handler.canHandle(newInput);

    this.cache.set(request, newInput);
  }

  public async handle(request: HttpHandlerRequest): Promise<HttpHandlerResponse> {
    const newInput = this.cache.get(request);
    if (!newInput) {
      throw new InternalServerError('Calling handle before a successful canHandle Call');
    }
    return this.handler.handle(newInput);
  }
}
