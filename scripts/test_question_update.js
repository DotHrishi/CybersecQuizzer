const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fzyozyaajamaesxycjzm.supabase.co';
const supabaseKey = 'sb_publishable_J1q-4f8yXMOyCXQZjCToow_18U-qV2J';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  console.log('Testing Supabase Question Update...');
  const { data: questions } = await supabase.from('questions').select('*').limit(1);
  
  if (!questions || questions.length === 0) {
    console.log('No questions found to test update.');
    return;
  }

  const target = questions[0];
  console.log('Updating question ID:', target.id);

  const { data, error } = await supabase
    .from('questions')
    .update({ category: target.category || 'General Security' })
    .eq('id', target.id)
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase update error:', error);
  } else {
    console.log('✅ Supabase question updated successfully! Data:', data.questionText);
  }
}

testUpdate();
