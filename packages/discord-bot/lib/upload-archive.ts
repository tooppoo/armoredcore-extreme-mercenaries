import { Message, OmitPartialGroupDMChannel } from 'discord.js';
import { frontApi } from './front';

export async function uploadArchive(
  message: OmitPartialGroupDMChannel<Message<boolean>>
) {
  const body = {
    url: message.content,
    discord_user: {
      id: message.author.id,
      name: message.author.displayName,
    }
  }

  return fetch(frontApi('/api/archives'), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.FRONT_AUTH_UPLOAD_ARCHIVE}`,
    },
  }).catch(error => {
    throw { reason: JSON.stringify(error) }
  }).then((res) => {
    if (400 < res.status) {
      throw { reason: res.statusText }
    }

    return res
  })
}
