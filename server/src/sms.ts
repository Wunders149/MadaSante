/**
 * SMS provider abstraction (probably Orange/MVola-style aggregator later).
 * The default provider logs to the console, so the integration point exists and
 * messages travel through one place; swap it for an HTTP provider in config.
 */
export interface SmsProvider {
  send(to: string, message: string): Promise<void>
}

export class ConsoleSmsProvider implements SmsProvider {
  async send(to: string, message: string): Promise<void> {
    console.log(`[sms] to=${to}: ${message}`)
  }
}

let smsProvider: SmsProvider = new ConsoleSmsProvider()

export function setSmsProvider(provider: SmsProvider): void {
  smsProvider = provider
}

export function sendSms(to: string, message: string): Promise<void> {
  return smsProvider.send(to, message)
}
