
import { NextResponse } from 'next/server';

// Get environment variables
const HF_ACCESS_TOKEN = process.env.HF_ACCESS_TOKEN;
const HF_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://samarth-21-neuroscan-api.hf.space';

export async function POST(request) {
  try {
    // 1. Validation
    if (!HF_ACCESS_TOKEN) {
      return NextResponse.json(
        { detail: 'Server misconfigured: Missing HF_ACCESS_TOKEN' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { detail: 'No file provided' },
        { status: 400 }
      );
    }

    // 2. Prepare the request to Hugging Face
    // We need to forward the FormData exactly as received
    const hfFormData = new FormData();
    hfFormData.append('file', file);

    // 3. Send to Hugging Face with Authorization header
    const response = await fetch(`${HF_API_URL}/predict`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_ACCESS_TOKEN}`,
        // Note: Do NOT set Content-Type header when sending FormData; 
        // fetch will automatically set it with the correct boundary
      },
      body: hfFormData,
    });

    // 4. Handle errors from Hugging Face
    if (!response.ok) {
      const errorText = await response.text();
      console.error('HF API Error:', response.status, errorText);
      return NextResponse.json(
        { detail: `Hugging Face API Error: ${response.statusText}`, raw: errorText },
        { status: response.status }
      );
    }

    // 5. Return successful JSON
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { detail: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}
