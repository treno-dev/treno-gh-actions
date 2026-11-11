import * as core from '@actions/core'

import { zipDocs } from '@/lib/docs.js'
import { inputs } from '@/lib/inputs.js'
import { Treno } from '@/lib/treno.js'
import { versionFromTag } from '@/lib/tag.js'

async function publish() {
  const { 'provider-id': providerId, docs, treno: address, audience } = inputs()

  if (!providerId) {
    throw new Error('The provider-id input is required')
  }

  // Treno checks the tag against the token too.
  const { version } = versionFromTag()

  core.info(`Publishing version ${version} of provider ${providerId} to ${address}`)

  const zip = await zipDocs(docs)

  core.info(`Zipped ${zip.pages} pages from ${docs}: ${zip.size} bytes`)

  core.info(`Asking GitHub for an OIDC token for ${audience}`)

  const treno = new Treno(address, providerId, await core.getIDToken(audience))
  const announcement = { version, size: zip.size }

  core.info('Announcing the zip to Treno')

  const begun = await treno.begin(announcement)

  // Treno knows the commit of the job from its token. A version that it has published from this commit is
  // published again by a re-run, which is no error and sends nothing. Another commit is refused by Treno.
  if (begun.published) {
    const status = treno.status(begun.publication)

    core.info(`Version ${version} is published already from this commit, so there is nothing to send. Status: ${status}`)
    await core.summary.addRaw(`Version ${version} is published already from this commit. [Status](${status})`).write()

    return
  }

  core.info('Treno accepted the announcement and gave an upload URL. Uploading the zip')

  await treno.upload(begun.url, zip.content)

  core.info('Uploaded. Asking Treno to process the zip')

  // The worker processes the zip after this job is done: the status is where its outcome is read.
  const publication = await treno.finish(announcement)
  const status = treno.status(publication)

  core.info(`Treno queued publication ${publication.ulid} (${publication.state}). Status: ${status}`)
  await core.summary.addRaw(`Sent ${version} to Treno. [Status](${status})`).write()
}

/** Adds `publish` to `provider`. It reads the inputs of the action. */
export function addPublish(provider) {
  provider
    .command('publish')
    .description('Zip the docs of a provider and send them to Treno with the OIDC token of the job')
    .action(publish)
}
