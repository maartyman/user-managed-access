import type * as rdf from 'rdf-js'
import { type N3Package } from './n3util'
import { unpackageOne as genericUnpackOne, unpackageAll as genericUnpackAll } from '../pack/unpackage'

/**
 * This function removes the top level packages
 * (the packages in the default graph)
 */
export function unpackageOne (content: N3Package): rdf.Quad[] | N3Package {
  return genericUnpackOne(content)
}

/**
 * This function removes all package metadata
 */
export function unpackageAll (content: N3Package): rdf.Quad[] {
  return genericUnpackAll(content)
}
