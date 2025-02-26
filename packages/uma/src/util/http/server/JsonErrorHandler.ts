import {
  APPLICATION_JSON,
  CONTENT_TYPE,
  ErrorHandler,
  ErrorHandlerArgs,
  getLoggerFor,
  guardedStreamFrom,
  RepresentationMetadata,
  ResponseDescription
} from '@solid/community-server';

/**
 * {@link ErrorHandler} that returns a JSON representation of the error.
 */
export class JsonErrorHandler extends ErrorHandler {
  protected readonly logger = getLoggerFor(this);

  public constructor(protected readonly showStackTrace = false) {
    super();
  }

  public async handle({ request, error }: ErrorHandlerArgs): Promise<ResponseDescription> {
    this.logger.error(`Returned error for ${request.method} '${request.url}': ${error.name} ${error.message}`);

    return new ResponseDescription(
      error.statusCode,
      new RepresentationMetadata({[CONTENT_TYPE]: APPLICATION_JSON}),
      guardedStreamFrom(JSON.stringify({
        status: error.statusCode,
        error: error.name,
        message: error.message,
        ...(this.showStackTrace && error.stack ? { stack: error.stack } : {})
      })));
  }
}
