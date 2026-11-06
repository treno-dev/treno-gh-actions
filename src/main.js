import * as core from '@actions/core'
import { Command } from 'commander'

import { addProvider } from '@/commands/provider/index.js'

const program = new Command('steward-actions').description('The actions of Steward, which also run from a terminal')

addProvider(program)

program.parseAsync().catch((error) => core.setFailed(error))
