import {
  APPLICATION_JSON,
  BadRequestHttpError,
  CONTENT_TYPE,
  createErrorMessage,
  getLoggerFor,
  guardedStreamFrom,
  KeyValueStorage,
  OperationHttpHandler,
  OperationHttpHandlerInput,
  readableToString,
  RepresentationMetadata,
  ResponseDescription,
  UnauthorizedHttpError,
  UnsupportedMediaTypeHttpError
} from '@solid/community-server';
import { array, reType } from '../util/ReType';
import { Permission } from '../views/Permission';
import { Ticket } from '../ticketing/Ticket';
import { TicketingStrategy } from '../ticketing/strategy/TicketingStrategy';
import { v4 } from 'uuid';
import { verifyRequest } from '../util/HttpMessageSignatures';

type ErrorConstructor = { new(msg: string): Error };

/**
 * A TicketRequestHandler is tasked with implementing
 * section 3.2 from the User-Managed Access (UMA) Profile of OAuth 2.0.
 *
 * It provides an endpoint to a Resource Server for requesting UMA tickets.
 */
export class TicketRequestHandler extends OperationHttpHandler {
  protected readonly logger = getLoggerFor(this);

  /**
   * A TicketRequestHandler is tasked with implementing
   * section 3.2 from the User-Managed Access (UMA) Profile of OAuth 2.0.
   */
  constructor(
    private readonly ticketingStrategy: TicketingStrategy,
    private readonly ticketStore: KeyValueStorage<string, Ticket>,
  ) {
    super();
  }

  /**
  * Handle incoming requests for permission registration
  */
  async handle(input: OperationHttpHandlerInput): Promise<ResponseDescription> {
    this.logger.info(`Received permission registration request.`);
    if (!await verifyRequest(input.request, input.operation)) throw new UnauthorizedHttpError();

    if (input.request.headers['content-type'] !== 'application/json') {
      throw new UnsupportedMediaTypeHttpError(
          'Only Media Type "application/json" is supported for this route.');
    }

    const body = JSON.parse(await readableToString(input.operation.body.data));

    if (!Array.isArray(body)) {
      this.error(BadRequestHttpError, 'Request body must be a JSON array.');
    }

    try {
      reType(body, array(Permission));
    } catch (e) {
      this.logger.debug(`Syntax error: ${createErrorMessage(e)}, ${body}`);
      e instanceof Error
        ? this.error(BadRequestHttpError, 'Request has bad syntax: ' + e.message)
        : this.error(BadRequestHttpError, 'Request has bad syntax');
    }

    const ticket = await this.ticketingStrategy.initializeTicket(body);
    const resolved = await this.ticketingStrategy.resolveTicket(ticket);

    if (resolved.success) return new ResponseDescription(200);

    const id = v4();
    await this.ticketStore.set(id, ticket);

    return new ResponseDescription(
      201,
      new RepresentationMetadata({[CONTENT_TYPE]: APPLICATION_JSON}),
      guardedStreamFrom(JSON.stringify({ ticket: id }))
    );
  }

  /**
   * Logs and throws an error
   *
   * @param {ErrorConstructor} constructor - the error constructor
   * @param {string} message - the error message
   */
  private error(constructor: ErrorConstructor, message: string): never {
    this.logger.warn(message);
    throw new constructor(message);
  }
}
