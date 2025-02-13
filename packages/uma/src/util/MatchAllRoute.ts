import { InteractionRoute, NotImplementedHttpError } from '@solid/community-server';

/**
 * An {@link InteractionRoute} that matches all paths.
 * Can be useful when combined with a {@link RelativePathInteractionRoute}
 * if you want to match all routes ending with the given path.
 *
 * Since there is no fixed path, `getPath` will throw an error.
 */
export class MatchAllRoute implements InteractionRoute {
  public getPath(parameters: Record<never, string> | undefined): string {
    throw new NotImplementedHttpError('Calling matchPath on a MatchAllRoute');
  }

  public matchPath(path: string): Record<never, string> | undefined {
    return {};
  }
}
