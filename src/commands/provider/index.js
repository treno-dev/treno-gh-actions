import { addPublish } from '@/commands/provider/publish.js'
import { addRelease } from '@/commands/provider/release.js'

/** Adds `provider`, the commands for the providers of Steward. */
export function addProvider(program) {
  const provider = program.command('provider').description('Work with a provider of Steward')

  addPublish(provider)
  addRelease(provider)
}
