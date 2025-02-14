import { OutgoingHttpHeaders } from 'node:http';
import {
  BasicRepresentation,
  createErrorMessage,
  getLoggerFor,
  HttpHandler as NodeHttpStreamsHandler,
  HttpHandlerInput,
  OperationHttpHandler,
  OperationHttpHandlerInput,
  pipeSafely,
  ResponseDescription,
  TargetExtractor
} from '@solid/community-server';


/**
 * A { NodeHttpStreamsHandler } reading the request stream into a { HttpHandlerRequest },
 * passing it through a { HttpHandler } and writing the resulting { HttpHandlerResponse } to the response stream.
 */
export class NodeHttpRequestResponseHandler extends NodeHttpStreamsHandler {
  public logger = getLoggerFor(this);

  /**
   * Creates a { NodeHttpRequestResponseHandler } passing requests through the given handler.
   */
  constructor(
    private httpHandler: OperationHttpHandler,
    protected readonly targetExtractor: TargetExtractor,
  ) {
    super();
  }

  /**
   * Reads the requestStream of its HttpHandlerInput pair into a HttpHandlerRequest,
   * creates a HttpHandlerContext from it, passes it through the { HttpHandler },
   * and writes the result to the responseStream.
   *
   * @param { HttpHandlerInput } nodeHttpStreams - the incoming set of Node.js HTTP read and write streams
   * @returns an { Promise<void> } for completion detection
   */
  async handle(nodeHttpStreams: HttpHandlerInput): Promise<void> {
    const { request: requestStream, response: responseStream } = nodeHttpStreams;

    if (!requestStream.method) {
      // No request method was received, this path is technically impossible to reach
      this.logger.warn('No method received');
      throw new Error('method of the request cannot be null or undefined.');
    }

    const input: OperationHttpHandlerInput = {
      request: requestStream,
      response: responseStream,
      operation: {
        method: requestStream.method,
        target: await this.targetExtractor.handleSafe({ request: requestStream }),
        preferences: {},
        body: requestStream.headers['content-type'] ?
          new BasicRepresentation(requestStream, requestStream.headers['content-type']) :
          new BasicRepresentation(),
      }
    }

    this.logger.info(`Received ${input.operation.method} request targeting ${input.operation.target.path}`);

    let response = await this.httpHandler.handle(input).catch<ResponseDescription>((error) => {
      const status = error?.statusCode ?? error.status;
      const message = error?.message ?? error.body;

      this.logger.warn(`Unhandled error: ${createErrorMessage(error)}`);

      return new ResponseDescription(
        500,
        undefined,
        message ?? 'Internal Server Error',
      );
    });

    const contentTypeHeader = response.metadata?.contentType;

    this.logger.debug('Sending response');

    // TODO: this needs to be more extensively based on metadata
    const headers: OutgoingHttpHeaders = {
      ... response.metadata?.contentType && { 'content-type': response.metadata?.contentType },
    };

    responseStream.writeHead(response.statusCode, headers);
    if (response.data) {
      const pipe = pipeSafely(response.data, responseStream);
      pipe.on('error', (error): void => {
        this.logger.error(`Aborting streaming response because of server error; headers already sent.`);
        this.logger.error(`Response error: ${error.message}`);
      });
    } else {
      responseStream.end();
    }
  }
}
