import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth-guard';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.N8N_BASE_URL;
    const webhookPath = process.env.N8N_WEBHOOK_PATH;

    if (!baseUrl || !webhookPath) {
      return NextResponse.json(
        { error: 'N8N_BASE_URL or N8N_WEBHOOK_PATH not configured' },
        { status: 500 }
      );
    }

    const webhookUrl = `${baseUrl}${webhookPath}`;

    // Create a new FormData to send to n8n
    const n8nFormData = new FormData();
    n8nFormData.append('file', file);

    // Send to n8n webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: n8nFormData,
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.statusText}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      executionId: result.executionId,
      fileName: file.name,
    });
  } catch (error) {
    console.error('Error submitting to n8n:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit to n8n' },
      { status: 500 }
    );
  }
}



























