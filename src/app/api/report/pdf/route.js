import { NextResponse } from 'next/server';

const HF_ACCESS_TOKEN = process.env.HF_ACCESS_TOKEN;
const HF_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://samarth-21-neuroscan-api.hf.space';

export async function POST(request) {
  try {
    if (!HF_ACCESS_TOKEN) {
      return NextResponse.json(
        { detail: 'Server misconfigured: Missing HF_ACCESS_TOKEN' },
        { status: 500 },
      );
    }

    const body = await request.json();

    const response = await fetch(`${HF_API_URL}/report/pdf`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('PDF generation error:', response.status, errText);
      return NextResponse.json(
        { detail: `PDF generation failed: ${response.statusText}` },
        { status: response.status },
      );
    }

    const pdfBuffer = await response.arrayBuffer();

    // Forward the filename from the backend if available
    const backendDisposition = response.headers.get('content-disposition') || '';
    const filenameMatch = backendDisposition.match(/filename="?([^";\n]+)"?/);
    const filename = filenameMatch ? filenameMatch[1] : 'neuroscan_report.pdf';

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('PDF proxy error:', err);
    return NextResponse.json(
      { detail: 'Internal server error', error: err.message },
      { status: 500 },
    );
  }
}
