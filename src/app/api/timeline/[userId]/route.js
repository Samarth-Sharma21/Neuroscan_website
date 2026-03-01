import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request, { params }) {
  try {
    const { userId } = await params;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { detail: 'Server misconfigured: Missing Supabase credentials' },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('neuroscan_reports')
      .select(
        'id, prediction_id, predicted_class, confidence, severity_level, severity_label, risk_score, risk_level, created_at',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Timeline fetch error:', error);
      return NextResponse.json(
        { detail: 'Failed to fetch timeline data' },
        { status: 500 },
      );
    }

    const timeline = (data || []).map((r) => ({
      id: r.id,
      prediction_id: r.prediction_id,
      date: r.created_at,
      predicted_class: r.predicted_class,
      confidence: r.confidence,
      severity_level: r.severity_level,
      severity_label: r.severity_label,
      risk_score: r.risk_score,
      risk_level: r.risk_level,
    }));

    return NextResponse.json({ timeline });
  } catch (err) {
    console.error('Timeline error:', err);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 },
    );
  }
}
