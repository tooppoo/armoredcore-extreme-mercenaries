import { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { Authenticator } from "remix-auth";
import type { DiscordProfile } from "remix-auth-discord";
import { DiscordStrategy } from "remix-auth-discord";
import { getSessionStorage } from "~/lib/auth/session.server";

export interface DiscordUser {
  id: DiscordProfile["id"];
  displayName: DiscordProfile["displayName"];
  discriminator: DiscordProfile["__json"]["discriminator"];
}

let auth: Authenticator<DiscordUser> | null = null

export function getAuthentication({ context }: Pick<LoaderFunctionArgs, 'context'>) {
  if (!auth) {
    auth = new Authenticator<DiscordUser>(getSessionStorage({ context }))

    const discordStrategy = new DiscordStrategy(
      {
        clientID: context.cloudflare.env.DISCORD_AUTH_CLIENT_ID,
        clientSecret: context.cloudflare.env.DISCORD_AUTH_CLIENT_SECRET,
        callbackURL: context.cloudflare.env.DISCORD_AUTH_CLIENT_CALLBACK,
        // Provide all the scopes you want as an array
        scope: ["identify"],
      },
      async ({
        profile,
      }): Promise<DiscordUser> => {
        /**
         * Construct the user profile to your liking by adding data you fetched etc.
         * and only returning the data that you actually need for your application.
         */
        return {
          id: profile.id,
          displayName: profile.displayName,
          discriminator: profile.__json.discriminator,
        };
      },
    );

    auth.use(discordStrategy);
  }

  return auth
}

