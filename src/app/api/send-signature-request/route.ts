import { NextRequest, NextResponse } from 'next/server'
import * as DropboxSign from '@dropbox/sign'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.DROPBOX_SIGN_API_KEY
    const clientId = process.env.DROPBOX_SIGN_CLIENT_ID

    if (!apiKey || !clientId) {
      // If Dropbox Sign isn't configured, return a fallback
      // The canvas signature in CandidateIntake serves as the consent mechanism
      return NextResponse.json({
        fallback: true,
        message: 'Electronic signature captured via canvas',
      })
    }

    const body = await req.json()
    const { firstName, lastName, email, packageName } = body

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const signatureRequestApi = new DropboxSign.SignatureRequestApi()
    signatureRequestApi.username = apiKey

    const signer: DropboxSign.SubSignatureRequestSigner = {
      emailAddress: email,
      name: `${firstName} ${lastName}`,
      order: 0,
    }

    const signingOptions: DropboxSign.SubSigningOptions = {
      draw: true,
      type: true,
      upload: false,
      phone: false,
      defaultType: DropboxSign.SubSigningOptions.DefaultTypeEnum.Draw,
    }

    const data: DropboxSign.SignatureRequestCreateEmbeddedRequest = {
      clientId,
      subject: `PCG Screening Authorization — ${packageName || 'Background Check'}`,
      message: `Please sign to authorize your background screening with PCG Screening Services.`,
      signers: [signer],
      signingOptions,
      testMode: process.env.NODE_ENV !== 'production',
    }

    const result = await signatureRequestApi.signatureRequestCreateEmbedded(data)
    const signatureRequest = result.body.signatureRequest

    if (!signatureRequest?.signatures?.[0]?.signatureId) {
      return NextResponse.json({ error: 'Failed to create signature request' }, { status: 500 })
    }

    const signatureId = signatureRequest.signatures[0].signatureId
    const signatureRequestId = signatureRequest.signatureRequestId

    // Get embedded sign URL
    const embeddedApi = new DropboxSign.EmbeddedApi()
    embeddedApi.username = apiKey

    const embeddedResult = await embeddedApi.embeddedSignUrl(signatureId)
    const signUrl = embeddedResult.body.embedded?.signUrl

    return NextResponse.json({
      signUrl,
      signatureId,
      signatureRequestId,
    })
  } catch (error) {
    console.error('Signature request error:', error)
    return NextResponse.json({ error: 'Failed to create signature request' }, { status: 500 })
  }
}
