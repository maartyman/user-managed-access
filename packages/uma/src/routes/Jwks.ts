import {
  APPLICATION_JSON,
  CONTENT_TYPE,
  getLoggerFor,
  guardedStreamFrom,
  JwkGenerator,
  OkResponseDescription,
  OperationHttpHandler,
  OperationHttpHandlerInput,
  RepresentationMetadata,
  ResponseDescription
} from '@solid/community-server';

/**
 * An HttpHandler used for returning the configuration
 * of the UMA Authorization Service.
 */
export class JwksRequestHandler extends OperationHttpHandler {
  protected readonly logger = getLoggerFor(this);

  /**
   * Yields a new request handler for JWKS
   * @param {JwkGenerator} generator - the generator to be used for serving JWKS
   */
  public constructor(
    private readonly generator: JwkGenerator
  ) {
    super();
  }

  /**
     * Returns the JSON Web KeySet for specified keyholder
     */
  async handle(request: OperationHttpHandlerInput): Promise<ResponseDescription> {
    this.logger.info(`Received JWKS request at '${request.operation.target.path}'`);

    const key = await this.generator.getPublicKey();

    return new OkResponseDescription(
      new RepresentationMetadata({[CONTENT_TYPE]: APPLICATION_JSON}),
      guardedStreamFrom(JSON.stringify({ keys: [ key ] }))
    );
  }
}
