import { AccessToken } from '../tokens/AccessToken';
import { JwtTokenFactory } from '../tokens/JwtTokenFactory';
import { SerializedToken } from '../tokens/TokenFactory';
import {
  APPLICATION_JSON,
  BadRequestHttpError,
  CONTENT_TYPE,
  getLoggerFor,
  guardedStreamFrom,
  KeyValueStorage,
  OkResponseDescription,
  OperationHttpHandler,
  OperationHttpHandlerInput,
  readableToString,
  RepresentationMetadata,
  ResponseDescription,
  UnauthorizedHttpError,
  UnsupportedMediaTypeHttpError
} from '@solid/community-server';
import { verifyRequest } from '../util/HttpMessageSignatures';

/**
 * An HTTP handler that provides introspection into opaque access tokens.
 */
export class IntrospectionHandler extends OperationHttpHandler {
  protected readonly logger = getLoggerFor(this);

  /**
   * Creates an introspection handler for tokens in the given token store.
   *
   * @param tokenStore - The store containing the tokens.
   * @param jwtTokenFactory - The factory with which to produce JWT representations of the tokens.
   */
  constructor(
    private readonly tokenStore: KeyValueStorage<string, AccessToken>,
    private readonly jwtTokenFactory: JwtTokenFactory,
  ) {
    super();
  }

  /**
  * Handle incoming requests for token introspection
  */
  public async handle(input: OperationHttpHandlerInput): Promise<ResponseDescription> {
    if (!await verifyRequest(input.request, input.operation)) throw new UnauthorizedHttpError();

    if (input.request.headers['content-type'] !== 'application/x-www-form-urlencoded') {
      throw new UnsupportedMediaTypeHttpError(
          'Only Media Type "application/x-www-form-urlencoded" is supported for this route.');
    }

    if (input.request.headers['accept'] !== 'application/json') {
      throw new UnsupportedMediaTypeHttpError(
          'Only "application/json" can be served by this route.');
    }

    if (input.operation.body.isEmpty) {
      throw new BadRequestHttpError('Missing request body.');
    }

    try {
      const opaqueToken = new URLSearchParams(await readableToString(input.operation.body.data)).get('token');
      if (!opaqueToken) throw new Error ();

      const jwt = await this.opaqueToJwt(opaqueToken);
      return new OkResponseDescription(
        new RepresentationMetadata({[CONTENT_TYPE]: APPLICATION_JSON}),
        guardedStreamFrom(JSON.stringify(jwt)),
      );
    } catch (e) {
      throw new BadRequestHttpError('Invalid request body.');
    }

  }

  private async opaqueToJwt(opaque: string): Promise<SerializedToken> {
    const token = await this.tokenStore.get(opaque);
    if (!token) throw new Error('Token not found.');

    return this.jwtTokenFactory.serialize({ ...token, active: true } as AccessToken);
  }

}
