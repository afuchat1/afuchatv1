import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const YOU_API_KEY = Deno.env.get('YOU_API_KEY');
    if (!YOU_API_KEY) {
      console.error('YOU_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Search service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching You.com for:', query);

    // Call You.com search API
    const response = await fetch('https://api.ydc-index.io/search', {
      method: 'GET',
      headers: {
        'X-API-Key': YOU_API_KEY,
        'Content-Type': 'application/json',
      },
      // Add query as URL parameter
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('You.com search error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Search failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Extract and format results
    const results = data.hits?.map((hit: any) => ({
      title: hit.title || '',
      snippet: hit.description || hit.snippets?.[0] || '',
      url: hit.url || '',
      thumbnailUrl: hit.thumbnail_url || null,
    })) || [];

    console.log(`Found ${results.length} search results`);

    return new Response(
      JSON.stringify({ results }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Search function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});