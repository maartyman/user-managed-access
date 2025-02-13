import { HttpHandler } from '../util/http/models/HttpHandler';
import { HttpHandlerRequest } from '../util/http/models/HttpHandlerRequest';
import { HttpHandlerResponse } from '../util/http/models/HttpHandlerResponse';
import { getLoggerFor, JwkGenerator } from '@solid/community-server';

/**
 * An HttpHandler used for returning the configuration
 * of the UMA Authorization Service.
 */
export class JwksRequestHandler extends HttpHandler {
  protected readonly logger = getLoggerFor(this);

  /**
   * Yields a new request handler for JWKS
   * @param {JwksKeyHolder} keyholder - the keyholder to be used for serving JWKS
   */
  public constructor(
    private readonly generator: JwkGenerator
  ) {
    super();
  }

  /**
     * Returns the JSON Web KeySet for specified keyholder
     * @param {HttpHandlerRequest} request
     * @return {HttpHandlerResponse} - the JWKS response
     */
  async handle(request: HttpHandlerRequest): Promise<HttpHandlerResponse> {
    this.logger.info(`Received JWKS request at '${request.url}'`);

    const key = await this.generator.getPublicKey();

    return {
      status: 200,
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ keys: [ key ] }),
    };
  }
}
