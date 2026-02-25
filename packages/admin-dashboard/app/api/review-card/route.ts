// Chaos Creatures Admin Dashboard — Review Card API
// PATCH-style review: approve, reject, or reset a generation job's review status.
// Stores review_status + approved in output_data JSONB.

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_id, action } = body as {
      job_id?: string;
      action?: 'approve' | 'reject' | 'reset';
    };

    if (!job_id || !action) {
      return NextResponse.json(
        { error: 'job_id and action (approve|reject|reset) are required' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject' && action !== 'reset') {
      return NextResponse.json(
        { error: 'Action must be "approve", "reject", or "reset"' },
        { status: 400 }
      );
    }

    // Fetch the current job
    const { data: job, error: fetchError } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (fetchError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const outputData = (job.output_data || {}) as Record<string, unknown>;

    let updatedOutputData: Record<string, unknown>;
    let auditAction: string;

    if (action === 'approve') {
      updatedOutputData = {
        ...outputData,
        review_status: 'APPROVED',
        approved: true,
      };
      auditAction = 'card_approved';
    } else if (action === 'reject') {
      updatedOutputData = {
        ...outputData,
        review_status: 'REJECTED',
        approved: false,
      };
      auditAction = 'card_rejected';
    } else {
      // reset — remove approved field, set review_status to PENDING_REVIEW
      const { approved: _removed, ...rest } = outputData;
      void _removed;
      updatedOutputData = {
        ...rest,
        review_status: 'PENDING_REVIEW',
      };
      // Explicitly delete the approved key if it sneaks through spread
      delete updatedOutputData.approved;
      auditAction = 'card_review_reset';
    }

    // Update the generation_job row
    const { error: updateError } = await supabase
      .from('generation_jobs')
      .update({ output_data: updatedOutputData })
      .eq('id', job_id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Audit log (best-effort, don't fail the request)
    await supabase.from('admin_audit_log').insert({
      admin_user: 'admin',
      action: auditAction,
      target_type: 'generation_job',
      target_id: job_id,
      details: {
        card_name: outputData.name,
        new_status: updatedOutputData.review_status,
      },
    }).then(() => {}, () => {});

    return NextResponse.json({
      status: updatedOutputData.review_status,
      output_data: updatedOutputData,
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
