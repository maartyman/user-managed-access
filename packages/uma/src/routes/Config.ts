import { ASYMMETRIC_CRYPTOGRAPHIC_ALGORITHM }
  from '@solid/access-token-verifier/dist/constant/ASYMMETRIC_CRYPTOGRAPHIC_ALGORITHM';
import {
  APPLICATION_JSON,
  CONTENT_TYPE,
  getLoggerFor,
  guardedStreamFrom,
  OkResponseDescription,
  OperationHttpHandler,
  OperationHttpHandlerInput,
  RepresentationMetadata,
  ResponseDescription
} from '@solid/community-server';

// eslint-disable no-unused-vars
export enum ResponseType {
  Token = 'token',
  Code = 'code',
  IDToken = 'id_token'
};
// eslint-enable

export type OAuthConfiguration = {
    issuer: string,
    jwks_uri?: string,
    token_endpoint?: string,
    grant_types_supported?: string[],
    dpop_signing_alg_values_supported?: string[],
    response_types_supported?: ResponseType[]
    scopes_supported?: string[]
}

export type UmaConfiguration = OAuthConfiguration & {
  uma_profiles_supported: string[],
  resource_registration_endpoint: string,
  permission_endpoint: string,
  introspection_endpoint: string
}

/**
 * An HttpHandler used for returning the configuration
 * of the UMA Authorization Service.
 */
export class ConfigRequestHandler extends OperationHttpHandler {
  protected readonly logger = getLoggerFor(this);

  /**
  * An HttpHandler used for returning the configuration
  * of the UMA Authorization Service.
    * @param {string} baseUrl - Base URL of the AS
    */
  constructor(protected readonly baseUrl: string) {
    super();
  }

  /**
   * Returns the endpoint's UMA configuration
   **/
  public async handle(input: OperationHttpHandlerInput): Promise<ResponseDescription> {
    this.logger.info(`Received discovery request at '${input.operation.target.path}'`);

    return new OkResponseDescription(
      new RepresentationMetadata({[CONTENT_TYPE]: APPLICATION_JSON}),
      guardedStreamFrom(JSON.stringify(this.getConfig()))
    )
  }

  /**
   * Returns UMA Configuration for the AS
   * @return {UmaConfiguration} - AS Configuration
   */
  public getConfig(): UmaConfiguration {
    return {
      jwks_uri: `${this.baseUrl}/keys`,
      token_endpoint: `${this.baseUrl}/token`,
      grant_types_supported: ['urn:ietf:params:oauth:grant-type:uma-ticket'],
      issuer: `${this.baseUrl}`,
      permission_endpoint: `${this.baseUrl}/ticket`,
      introspection_endpoint: `${this.baseUrl}/introspect`,
      resource_registration_endpoint: `${this.baseUrl}/resources`,
      uma_profiles_supported: ['http://openid.net/specs/openid-connect-core-1_0.html#IDToken'],
      dpop_signing_alg_values_supported: [...ASYMMETRIC_CRYPTOGRAPHIC_ALGORITHM],
      response_types_supported: [ResponseType.Token],
    };
  }
}
