import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const apiKey = process.env.N8N_API_KEY;
    const baseUrl = process.env.N8N_BASE_URL;

    if (!apiKey || !baseUrl) {
      return NextResponse.json(
        { error: 'N8N_API_KEY or N8N_BASE_URL not configured' },
        { status: 500 }
      );
    }

    const executionUrl = `${baseUrl}/api/v1/executions/${id}`;

    const response = await fetch(executionUrl, {
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Execution not found' },
          { status: 404 }
        );
      }
      throw new Error(`Failed to fetch execution: ${response.statusText}`);
    }

    const execution = await response.json();

    // Map n8n status to our status
    let status: 'running' | 'success' | 'error' | 'waiting' | 'unknown' = 'unknown';
    
    if (execution.status === 'success') {
      status = 'success';
    } else if (execution.status === 'error') {
      status = 'error';
    } else if (execution.status === 'running') {
      status = 'running';
    } else if (execution.status === 'waiting') {
      status = 'waiting';
    }

    return NextResponse.json({
      executionId: execution.id,
      status: status,
      finishedAt: execution.finishedAt,
      startedAt: execution.startedAt,
      mode: execution.mode,
    });
  } catch (error) {
    console.error('Error fetching execution status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch execution status' },
      { status: 500 }
    );
  }
}



























