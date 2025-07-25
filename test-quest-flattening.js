// Test script for quest flattening feature
// Run this in Figma console to verify quest structures

function testQuestStructure() {
  console.log('=== Testing Quest Structure ===');
  
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    console.log('❌ No selection. Please select a questline frame.');
    return;
  }
  
  const questline = selection[0];
  if (questline.type !== 'FRAME' || !questline.name.toLowerCase().includes('questline')) {
    console.log('❌ Please select a questline frame.');
    return;
  }
  
  console.log('✅ Found questline:', questline.name);
  console.log('Children count:', questline.children.length);
  
  let simpleQuests = 0;
  let complexQuests = 0;
  let totalQuests = 0;
  
  for (const child of questline.children) {
    if (child.type === 'GROUP' || child.type === 'INSTANCE') {
      totalQuests++;
      
      // Check for simple quest structure
      const hasImageLayer = child.children && child.children.some(c => 
        c.name === 'Image' && c.type === 'FRAME'
      );
      
      // Check for questKey text
      const hasQuestKey = child.children && child.children.some(c => 
        c.type === 'TEXT' && c.characters && c.characters.includes('questKey')
      );
      
      // Check for complex structure (multiple visual elements)
      const visualElements = child.children ? child.children.filter(c => 
        c.type !== 'TEXT' || !c.characters?.includes('questKey')
      ).length : 0;
      
      if (hasImageLayer && hasQuestKey) {
        simpleQuests++;
        console.log(`✅ Simple quest found: ${child.name} (has Image layer + questKey)`);
      } else if (visualElements > 1 && hasQuestKey) {
        complexQuests++;
        console.log(`✅ Complex quest found: ${child.name} (${visualElements} visual elements + questKey)`);
      } else {
        console.log(`⚠️  Quest structure unclear: ${child.name}`);
      }
    }
  }
  
  console.log('\n=== Summary ===');
  console.log(`Total quests found: ${totalQuests}`);
  console.log(`Simple quests: ${simpleQuests}`);
  console.log(`Complex quests: ${complexQuests}`);
  
  if (simpleQuests > 0) {
    console.log('✅ Backward compatibility should work');
  }
  
  if (complexQuests > 0) {
    console.log('✅ Flattening feature should work');
  }
  
  if (totalQuests === 0) {
    console.log('❌ No quests found. Check quest structure.');
  }
}

function testVisualElements() {
  console.log('=== Testing Visual Elements ===');
  
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    console.log('❌ No selection. Please select a quest instance.');
    return;
  }
  
  const quest = selection[0];
  if (quest.type !== 'GROUP' && quest.type !== 'INSTANCE') {
    console.log('❌ Please select a quest instance.');
    return;
  }
  
  console.log('✅ Analyzing quest:', quest.name);
  
  if (!quest.children) {
    console.log('❌ Quest has no children');
    return;
  }
  
  const elements = {
    visual: [],
    text: [],
    questKey: null
  };
  
  for (const child of quest.children) {
    if (child.type === 'TEXT') {
      if (child.characters && child.characters.includes('questKey')) {
        elements.questKey = child;
        console.log('🔍 Found questKey text:', child.characters);
      } else {
        elements.text.push(child);
        console.log('📝 Found text element:', child.characters);
      }
    } else if ('exportAsync' in child) {
      elements.visual.push(child);
      console.log('🎨 Found visual element:', child.name, child.type);
    } else {
      console.log('⚠️  Non-visual element:', child.name, child.type);
    }
  }
  
  console.log('\n=== Element Summary ===');
  console.log(`Visual elements: ${elements.visual.length}`);
  console.log(`Text elements: ${elements.text.length}`);
  console.log(`QuestKey found: ${elements.questKey ? 'Yes' : 'No'}`);
  
  if (elements.visual.length === 0) {
    console.log('❌ No visual elements found for export');
  } else if (elements.visual.length === 1 && elements.visual[0].name === 'Image') {
    console.log('✅ Simple quest structure (Image layer)');
  } else {
    console.log('✅ Complex quest structure (multiple visual elements)');
  }
  
  if (!elements.questKey) {
    console.log('⚠️  No questKey text found');
  }
}

// Run tests
console.log('🧪 Quest Flattening Test Suite');
console.log('Run testQuestStructure() to test questline structure');
console.log('Run testVisualElements() to test individual quest elements');

// Auto-run if questline is selected
if (figma.currentPage.selection.length > 0) {
  const selected = figma.currentPage.selection[0];
  if (selected.type === 'FRAME' && selected.name.toLowerCase().includes('questline')) {
    console.log('Auto-running questline test...');
    testQuestStructure();
  } else if (selected.type === 'GROUP' || selected.type === 'INSTANCE') {
    console.log('Auto-running visual elements test...');
    testVisualElements();
  }
} 