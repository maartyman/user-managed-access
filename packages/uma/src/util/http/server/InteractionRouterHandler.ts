import {
  InteractionRoute,
  InternalServerError,
  MethodNotAllowedHttpError,
  NotFoundHttpError,
  OperationHttpHandler,
  OperationHttpHandlerInput,
  RepresentationMetadata,
  ResponseDescription,
  toNamedTerm
} from '@solid/community-server';

export interface InteractionRouterHandlerArgs {
  /**
   * The handler to call if all checks pass.
   */
  handler: OperationHttpHandler;
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
  /**
   * A map that maps route parameters to predicates that should be used to store the values in the metadata.
   */
  parameterMap?: Record<string, string>;
}

/**
 *  Only allows requests that fulfill certain conditions.
 *  The HTTP method and URL get verified, if there is a match, the source handler gets called.
 */
export class InteractionRouterHandler extends OperationHttpHandler {
  protected readonly handler: OperationHttpHandler;
  protected readonly allowedMethods?: string[];
  protected readonly allowedRoutes: InteractionRoute[];
  protected readonly parameterMap: Record<string, string>;

  protected readonly cache = new WeakMap<OperationHttpHandlerInput, OperationHttpHandlerInput>;

  public constructor(args: InteractionRouterHandlerArgs) {
    super();
    this.handler = args.handler;
    this.allowedMethods = args.allowedMethods;
    // Create a custom route that allows everything if there was no input
    this.allowedRoutes = args.allowedRoutes ?? [{
      getPath: () => '',
      matchPath: () => ({})
    }];
    this.parameterMap = args.parameterMap ?? {};
  }

  public async canHandle(input: OperationHttpHandlerInput): Promise<void> {
    if (this.allowedMethods && !this.allowedMethods.includes(input.operation.method)) {
      throw new MethodNotAllowedHttpError([input.operation.method]);
    }

    let match: Record<string, string> | undefined;
    for (const route of this.allowedRoutes) {
      match = route.matchPath(input.operation.target.path);
      if (match) {
        break;
      }
    }
    if (!match) {
      throw new NotFoundHttpError();
    }

    let newMetadata = input.operation.body.metadata;
    if (Object.keys(match).length > 0) {
      newMetadata = new RepresentationMetadata(newMetadata);
      for (const [key, value] of Object.entries(match)) {
        const predicate = this.parameterMap[key];
        if (!predicate) {
          throw new InternalServerError(`Route parameter ${key} does not have a matching entry in the parameterMap`);
        }
        newMetadata.set(toNamedTerm(predicate), value);
      }
    }

    const newInput: OperationHttpHandlerInput = {
      ...input,
      operation: {
        ...input.operation,
        body: {
          ...input.operation.body,
          metadata: newMetadata,
        }
      }
    };
    await this.handler.canHandle(newInput);

    this.cache.set(input, newInput);
  }

  public async handle(request: OperationHttpHandlerInput): Promise<ResponseDescription> {
    const newInput = this.cache.get(request);
    if (!newInput) {
      throw new InternalServerError('Calling handle before a successful canHandle Call');
    }
    return this.handler.handle(newInput);
  }
}
