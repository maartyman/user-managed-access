import {
  APPLICATION_JSON,
  BadRequestHttpError,
  CONTENT_TYPE,
  createErrorMessage,
  getLoggerFor,
  guardedStreamFrom,
  KeyValueStorage,
  MethodNotAllowedHttpError,
  OperationHttpHandler,
  OperationHttpHandlerInput,
  readableToString,
  RepresentationMetadata,
  ResponseDescription,
  UnauthorizedHttpError,
  UnsupportedMediaTypeHttpError
} from '@solid/community-server';
import {v4} from 'uuid';
import { CUSTOM_UMA } from '../util/Vocabularies';
import { ResourceDescription } from '../views/ResourceDescription';
import { reType } from '../util/ReType';
import { extractRequestSigner, verifyRequest } from '../util/HttpMessageSignatures';

type ErrorConstructor = { new(msg: string): Error };

/**
 * A ResourceRegistrationRequestHandler is tasked with implementing
 * section 3.2 from the User-Managed Access (UMA) Federated Auth 2.0.
 *
 * It provides an endpoint to a Resource Server for registering its resources.
 */
export class ResourceRegistrationRequestHandler extends OperationHttpHandler {
  protected readonly logger = getLoggerFor(this);

  constructor(
    private readonly resourceStore: KeyValueStorage<string, ResourceDescription>,
  ) {
    super();
  }

  /**
  * Handle incoming requests for resource registration
  */
  async handle(input: OperationHttpHandlerInput): Promise<ResponseDescription> {
    const signer = await extractRequestSigner(input.request);

    // TODO: check if signer is actually the correct one

    if (!await verifyRequest(input.request, input.operation, signer)) {
      throw new UnauthorizedHttpError(`Failed to verify signature of <${signer}>`);
    }

    switch (input.operation.method) {
      case 'POST': return this.handlePost(input);
      case 'DELETE': return this.handleDelete(input);
      default: throw new MethodNotAllowedHttpError();
    }
  }

  private async handlePost(input: OperationHttpHandlerInput): Promise<ResponseDescription> {
    if (input.request.headers['content-type'] !== 'application/json') {
      throw new UnsupportedMediaTypeHttpError('Only Media Type "application/json" is supported for this route.');
    }

    const body = JSON.parse(await readableToString(input.operation.body.data));

    try {
      reType(body, ResourceDescription);
    } catch (e) {
      this.logger.warn(`Syntax error: ${createErrorMessage(e)}, ${body}`);
      this.error(BadRequestHttpError, `Request has bad syntax${e instanceof Error ? ': ' + e.message : ''}`)
    }

    const resource = v4();
    await this.resourceStore.set(resource, body);

    this.logger.info(`Registered resource ${resource}.`);

    return new ResponseDescription(
      201,
      new RepresentationMetadata({ [CONTENT_TYPE]: APPLICATION_JSON }),
      guardedStreamFrom(JSON.stringify({
        _id: resource,
        user_access_policy_uri: 'TODO: implement policy UI',
      }))
    );
  }

  private async handleDelete(input: OperationHttpHandlerInput): Promise<ResponseDescription> {
    const id = input.operation.body.metadata.get(CUSTOM_UMA.terms.id)?.value;
    if (!id) throw new Error('URI for DELETE operation should include an id.');

    if (!await this.resourceStore.has(id)) {
      throw new Error('Registration to be deleted does not exist (id unknown).');
    }

    this.logger.info(`Deleted resource ${id}.`);

    return new ResponseDescription(204);
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
