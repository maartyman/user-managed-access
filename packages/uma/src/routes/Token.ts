import {
  APPLICATION_JSON,
  BadRequestHttpError,
  CONTENT_TYPE,
  ForbiddenHttpError,
  getLoggerFor,
  guardedStreamFrom,
  OkResponseDescription,
  OperationHttpHandler,
  OperationHttpHandlerInput,
  readableToString,
  RepresentationMetadata,
  ResponseDescription,
  UnsupportedMediaTypeHttpError
} from '@solid/community-server';
import { Negotiator } from '../dialog/Negotiator';
import { DialogInput } from '../dialog/Input';
import { reType } from '../util/ReType';
import { NeedInfoError } from '../errors/NeedInfoError';

/**
 * The TokenRequestHandler implements the interface of the UMA Token Endpoint.
 */
export class TokenRequestHandler extends OperationHttpHandler {
  protected readonly logger = getLoggerFor(this);

  constructor(
    protected negotiator: Negotiator,
  ) {
    super();
  }

  /**
   * Handles an incoming token request.
   */
  async handle(input: OperationHttpHandlerInput): Promise<ResponseDescription> {
    this.logger.info(`Received token request.`);

    // This deviates from UMA, which reads application/x-www-form-urlencoded
    if (input.request.headers['content-type'] !== 'application/json') {
      throw new UnsupportedMediaTypeHttpError();
    }

    const params = JSON.parse(await readableToString(input.operation.body.data));

    // if (params['grant_type'] !== 'urn:ietf:params:oauth:grant-type:uma-ticket') {
    //   throw new BadRequestHttpError(
    //     `Expected 'grant_type' to be set to 'urn:ietf:params:oauth:grant-type:uma-ticket'
    //   `);
    // }

    try {
      reType(params, DialogInput);
    } catch (e) {
      throw new BadRequestHttpError(`Invalid token request body: ${e instanceof Error ? e.message : ''}`);
    }

    try {
      const tokenResponse = await this.negotiator.negotiate(params);

      return new OkResponseDescription(
        new RepresentationMetadata({[CONTENT_TYPE]: APPLICATION_JSON}),
        guardedStreamFrom(JSON.stringify(tokenResponse)),
      );
    } catch (e) {
      if (ForbiddenHttpError.isInstance(e)) {
        return new ResponseDescription(
          403,
          new RepresentationMetadata({ [CONTENT_TYPE]: APPLICATION_JSON }),
          guardedStreamFrom(JSON.stringify({
            ticket: (e as NeedInfoError).ticket,
            ...(e as NeedInfoError).additionalParams
          }))
        );
      }
      throw e; // TODO: distinguish other errors
    }
  }
}
