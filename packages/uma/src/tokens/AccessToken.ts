import { Permission } from '../views/Permission';
import { Type, array, optional as $, string, intersection, optional } from "../util/ReType";
import { ODRLContract } from '../views/Contract';

export const AccessToken = {
  permissions: array(Permission),
  contract: optional(ODRLContract)
}

export type AccessToken = Type<typeof AccessToken>;

