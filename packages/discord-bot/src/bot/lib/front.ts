import { makeCatchesSerializable } from '../../lib/error';
import { log } from '../../lib/log';
import { type SendMessage } from './message';

export function frontApi(path: string): string {
  return process.env.FRONT_URL + path
}

export type FrontErrorResponseBody = Readonly<{
  code: string
  message: string
  detail: unknown
}>

export type FrontRequestHandlerArgs = Readonly<{
  command: () => Promise<Response>
  messages: {
    success: string
    errorResponse: (errorCode: string) => string
    invalidResponse: string
    commandFailure: string
  }
}>
export type FrontRequestHandler = (args: FrontRequestHandlerArgs) => Promise<void>
export const frontRequestHandler = (sendMessage: SendMessage): FrontRequestHandler => async ({
  command,
  messages,
}: FrontRequestHandlerArgs): Promise<void> => {
  return command().then(
    async (res) => {
      log('debug', { message: `status = ${res.status}` })

      if (400 <= res.status) {
        await res.json().then((body: FrontErrorResponseBody) => {
          const message = messages.errorResponse(body.code)

          log('error', { message, body, status: res.status })

          sendMessage({ message })
        }).catch((error) => {
          log('error', {
            message: 'InvalidResponse',
            detail: JSON.stringify(makeCatchesSerializable(error)),
          })

          sendMessage({ message: messages.invalidResponse })
        })
        return
      }

      sendMessage({ message: messages.success })
    },
    (error: unknown) => {
      log('error', {
        message: 'FailedToFetch',
        detail: JSON.stringify(makeCatchesSerializable(error)),
      })

      sendMessage({ message: messages.commandFailure })
    }
  )
} 
