import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get expired stories
    const { data: expiredStories, error: fetchError } = await supabaseClient
      .from('stories')
      .select('id, media_url')
      .lt('expires_at', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired stories:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredStories?.length || 0} expired stories to clean up`);

    if (expiredStories && expiredStories.length > 0) {
      // Delete media files from storage
      for (const story of expiredStories) {
        try {
          // Extract file path from URL
          const url = new URL(story.media_url);
          const pathParts = url.pathname.split('/');
          const fileName = pathParts.slice(pathParts.indexOf('stories') + 1).join('/');

          const { error: storageError } = await supabaseClient.storage
            .from('stories')
            .remove([fileName]);

          if (storageError) {
            console.error(`Error deleting file ${fileName}:`, storageError);
          }
        } catch (error) {
          console.error('Error processing story media:', error);
        }
      }

      // Delete story records
      const { error: deleteError } = await supabaseClient
        .from('stories')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (deleteError) {
        console.error('Error deleting expired stories:', deleteError);
        throw deleteError;
      }

      console.log(`Successfully cleaned up ${expiredStories.length} expired stories`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        cleaned: expiredStories?.length || 0,
        message: 'Expired stories cleaned up successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in cleanup-expired-stories function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
