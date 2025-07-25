// Verification script for exported quest assets
// Run this after plugin export to verify results

function verifyExportedAssets() {
  console.log('=== Verifying Exported Assets ===');
  
  // This would typically check the actual exported files
  // For now, we'll provide a checklist for manual verification
  
  console.log('📋 Manual Verification Checklist:');
  console.log('');
  console.log('1. Check exported PNG files:');
  console.log('   - Open each quest image file');
  console.log('   - Verify no questKey text appears in images');
  console.log('   - Verify all visual elements are present');
  console.log('');
  console.log('2. Check exported JSON data:');
  console.log('   - Open questline-data.json');
  console.log('   - Verify questKey values are in JSON (not images)');
  console.log('   - Verify positioning data is correct');
  console.log('');
  console.log('3. Check file structure:');
  console.log('   - Verify ZIP contains images + JSON');
  console.log('   - Verify no temporary files remain');
  console.log('');
}

function analyzeQuestStructure() {
  console.log('=== Analyzing Current Quest Structure ===');
  
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    console.log('❌ No selection. Please select a quest or questline.');
    return;
  }
  
  const node = selection[0];
  
  if (node.type === 'FRAME' && node.name.toLowerCase().includes('questline')) {
    analyzeQuestline(node);
  } else if (node.type === 'GROUP' || node.type === 'INSTANCE') {
    analyzeQuest(node);
  } else {
    console.log('❌ Please select a quest or questline.');
  }
}

function analyzeQuestline(questline) {
  console.log('📊 Questline Analysis:', questline.name);
  console.log('Children:', questline.children.length);
  
  const quests = questline.children.filter(child => 
    child.type === 'GROUP' || child.type === 'INSTANCE'
  );
  
  console.log('Quests found:', quests.length);
  
  quests.forEach((quest, index) => {
    console.log(`\nQuest ${index + 1}: ${quest.name}`);
    
    if (!quest.children) {
      console.log('  ❌ No children');
      return;
    }
    
    const elements = {
      visual: quest.children.filter(c => 'exportAsync' in c),
      text: quest.children.filter(c => c.type === 'TEXT'),
      questKey: quest.children.filter(c => 
        c.type === 'TEXT' && c.characters && c.characters.includes('questKey')
      )
    };
    
    console.log(`  Visual elements: ${elements.visual.length}`);
    console.log(`  Text elements: ${elements.text.length}`);
    console.log(`  QuestKey elements: ${elements.questKey.length}`);
    
    if (elements.questKey.length > 0) {
      console.log(`  QuestKey value: "${elements.questKey[0].characters}"`);
    }
    
    // Predict export behavior
    if (elements.visual.length === 1 && elements.visual[0].name === 'Image') {
      console.log('  ✅ Will use simple image export');
    } else if (elements.visual.length > 1) {
      console.log('  ✅ Will use flattening export');
    } else {
      console.log('  ❌ No exportable elements found');
    }
  });
}

function analyzeQuest(quest) {
  console.log('📊 Quest Analysis:', quest.name);
  
  if (!quest.children) {
    console.log('❌ No children');
    return;
  }
  
  const elements = {
    visual: quest.children.filter(c => 'exportAsync' in c),
    text: quest.children.filter(c => c.type === 'TEXT'),
    questKey: quest.children.filter(c => 
      c.type === 'TEXT' && c.characters && c.characters.includes('questKey')
    )
  };
  
  console.log('Visual elements:', elements.visual.map(e => `${e.name} (${e.type})`));
  console.log('Text elements:', elements.text.map(e => `"${e.characters}"`));
  console.log('QuestKey elements:', elements.questKey.map(e => `"${e.characters}"`));
  
  // Predict what will be exported
  console.log('\n📤 Export Prediction:');
  
  if (elements.questKey.length > 0) {
    console.log('✅ QuestKey will be excluded from image');
  } else {
    console.log('⚠️  No QuestKey found');
  }
  
  if (elements.visual.length === 1 && elements.visual[0].name === 'Image') {
    console.log('✅ Simple export: Just the Image layer');
  } else if (elements.visual.length > 1) {
    console.log('✅ Flattened export: All visual elements');
    console.log('   Elements to be included:', elements.visual.map(e => e.name));
  } else {
    console.log('❌ No exportable elements found');
  }
}

// Auto-run analysis
if (figma.currentPage.selection.length > 0) {
  console.log('🔍 Auto-analyzing selected element...');
  analyzeQuestStructure();
} else {
  console.log('📋 Verification Tools:');
  console.log('- Run analyzeQuestStructure() to analyze current selection');
  console.log('- Run verifyExportedAssets() for manual verification checklist');
} 