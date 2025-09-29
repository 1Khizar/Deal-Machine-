import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { token, page = 1, pageSize = 100 } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing site token' }, { status: 400 });
    }

    const payload = {
      token,
      sort_by: "date_created_desc",
      limit: pageSize,
      begin: (page - 1) * pageSize,
      search: "",
      search_type: "address",
      filters: null,
      old_filters: null,
      list_id: "all_leads",
      list_history_id: null,
      get_updated_data: false,
      property_flags: "",
      property_flags_and_or: "or",
    };

    const res = await fetch("https://api.dealmachine.com/v2/leads/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `DealMachine API error ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (err) {
    console.error('Proxy fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
