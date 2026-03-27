import { NextRequest, NextResponse } from 'next/server';
import * as DropboxSign from '@dropbox/sign';

export const dynamic = 'force-dynamic';

const CONSENT_TEXT = `DISCLOSURE & AUTHORIZATION

In connection with my application for employment or continued employment, I understand that a consumer report and/or investigative consumer report may be requested by the prospective employer or current employer listed above. These reports may include, but are not limited to: criminal history records, court records, driving records, education verification, employment verification, professional references, credit reports, and drug testing results.

I hereby authorize PCG Screening Services and its designated agents to conduct such investigations and to request any and all information deemed necessary. I understand that I have the right to request a complete and accurate disclosure of the nature and scope of the investigation and that I may request a summary of my rights under the Fair Credit Reporting Act (FCRA).

I acknowledge that a telephonic facsimile (fax) or photographic copy of this authorization shall be as valid as the original. This authorization is valid for the duration of my employment or application process.`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.DROPBOX_SIGN_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Dropbox Sign not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { firstName, lastName, email, packageName } = body;

    const signatureRequestApi = new DropboxSign.SignatureRequestApi();
    signatureRequestApi.username = apiKey;

    const signer: DropboxSign.SubSignatureRequestSigner = {
      emailAddress: email,
      name: `${firstName} ${lastName}`,
      order: 0,
    };

    const signingOptions: DropboxSign.SubSigningOptions = {
      draw: true,
      type: true,
      upload: false,
      phone: false,
      defaultType: DropboxSign.SubSigningOptions.DefaultTypeEnum.Type,
    };

    // Create the signature request with embedded signing
    const data: DropboxSign.SignatureRequestCreateEmbeddedRequest = {
      clientId: process.env.DROPBOX_SIGN_CLIENT_ID || '',
      subject: `PCG Screening Authorization — ${packageName}`,
      message: `Please sign to authorize your ${packageName} background screening with PCG Screening Services.`,
      signers: [signer],
      signingOptions,
      testMode: process.env.NODE_ENV !== 'production',
    };

    const result = await signatureRequestApi.signatureRequestCreateEmbedded(data);
    const signatureRequest = result.body.signatureRequest;

    if (!signatureRequest?.signatures?.[0]?.signatureId) {
      return NextResponse.json({ error: 'Failed to create signature request' }, { status: 500 });
    }

    const signatureId = signatureRequest.signatures[0].signatureId;
    const signatureRequestId = signatureRequest.signatureRequestId;

    // Get the embedded sign URL
    const embeddedApi = new DropboxSign.EmbeddedApi();
    embeddedApi.username = apiKey;

    const embeddedResult = await embeddedApi.embeddedSignUrl(signatureId);
    const signUrl = embeddedResult.body.embedded?.signUrl;

    return NextResponse.json({
      signUrl,
      signatureId,
      signatureRequestId,
    });
  } catch (error) {
    console.error('Dropbox Sign error:', error);
    return NextResponse.json({ error: 'Failed to create signature request' }, { status: 500 });
  }
}
