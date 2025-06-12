import { Logger } from '../../util/logging/Logger';
import { getLoggerFor } from '../../util/logging/LoggerUtils';
import { Authorizer } from './Authorizer';
import { Permission } from '../../views/Permission';
import { Requirements, type ClaimVerifier } from '../../credentials/Requirements';
import { ClaimSet } from '../../credentials/ClaimSet';
import { lstatSync, readFileSync, watch } from 'fs';
import { WEBID } from '../../credentials/Claims';

/**
 * An Authorizer granting access according to Usage Control Policies.
 */
export class JSONBasedAuthorizer implements Authorizer {
  protected readonly logger: Logger = getLoggerFor(this);
  private rules: Record<string, Record<string, string[]>>;

  /**
   * Creates a JSONBasedAuthorizer
   *
   * @param rulesFile - A json file with rules.
   */
  constructor(
    private readonly rulesFile: string,
  ) {
    if (!lstatSync(this.rulesFile).isFile()) {
      throw Error(`${this.rulesFile} does not resolve to a file`)
    }
    this.rules = JSON.parse(readFileSync(this.rulesFile).toString());
    watch(this.rulesFile, (eventType, filename) => {
      this.rules = JSON.parse(readFileSync(this.rulesFile).toString());
    });
  }


  /** @inheritdoc */
  public async permissions(claims: ClaimSet, query?: Partial<Permission>[]): Promise<Permission[]> {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  public async credentials(permissions: Permission[], query?: Requirements): Promise<Requirements[]> {
    this.logger.info('Calculating credentials.', { permissions, query });

    // No permissions => empty requirements
    if (permissions.length === 0) return [{}];

    const requirements: Requirements[] = [];
    let openAccessToAll = true;
    for (const permission of permissions) {
      const verifiers: Record<string, ClaimVerifier> = {};
      const resource = permission.resource_id;
      if (!resource) {
        this.logger.warn('The PolicyBasedAuthorizer can only calculate credentials for explicit resources.');
        return [];
      }
      if (!this.rules[resource]) {
        this.logger.warn(`No rules found for resource <${resource}>.`);
        return [];
      }
      const scopes = permission.resource_scopes;
      if (!scopes) {
        this.logger.warn('The PolicyBasedAuthorizer can only calculate credentials for explicit actions.');
        return [];
      }

      for (const scope of scopes) {
        if (!this.rules[resource]["*"].includes(scope)) {
          openAccessToAll = false;
        }
      }

      verifiers[WEBID] = (webId: string) => {
        let permissionForAllActions = true;
        console.log(resource, webId, this.rules[resource])
        for (const scope of scopes) {
          if (!(this.rules[resource][webId].includes(scope))) {
            permissionForAllActions = false;
            break;
          }
        }
        return Promise.resolve(permissionForAllActions);
      }

      requirements.push(verifiers);
    }

    if (openAccessToAll) {
      return [{}];
    }

    if (query && !Object.keys(requirements).every(r => Object.keys(query).includes(r))) {
      return [];
    }

    return requirements;
  }
}
