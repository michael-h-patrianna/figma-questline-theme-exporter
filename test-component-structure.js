// Test script for the new quest component structure
// Quest Component
// ├── Properties (group)
// │   └── questKey (Text node)
// └── Visuals (frame)
//     └── Image (frame with image fill) + optional additional elements

function testComponentStructure() {
  console.log('=== Testing Quest Component Structure ===');
  
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    console.log('❌ No selection. Please select a quest instance or questline.');
    return;
  }
  
  const node = selection[0];
  
  if (node.type === 'FRAME' && node.name.toLowerCase().includes('questline')) {
    testQuestline(node);
  } else if (node.type === 'GROUP' || node.type === 'INSTANCE') {
    testQuestInstance(node);
  } else {
    console.log('❌ Please select a quest instance or questline frame.');
  }
}

function testQuestline(questline) {
  console.log('📊 Questline Analysis:', questline.name);
  console.log('Children:', questline.children.length);
  
  const quests = questline.children.filter(child => 
    child.type === 'GROUP' || child.type === 'INSTANCE'
  );
  
  console.log('Quests found:', quests.length);
  
  quests.forEach((quest, index) => {
    console.log(`\nQuest ${index + 1}: ${quest.name}`);
    testQuestInstance(quest, true);
  });
}

function testQuestInstance(quest, isNested = false) {
  const prefix = isNested ? '  ' : '';
  console.log(`${prefix}📊 Quest Instance Analysis:`, quest.name);
  
  if (!quest.children) {
    console.log(`${prefix}❌ No children`);
    return;
  }
  
  // Check for Properties group
  const propertiesGroup = quest.children.find(c => c.name === 'Properties');
  if (propertiesGroup) {
    console.log(`${prefix}✅ Found Properties group`);
    
    // Check for questKey text in Properties
    if (propertiesGroup.children) {
      const questKeyNode = propertiesGroup.children.find(c => 
        c.type === 'TEXT' && c.name.toLowerCase().includes('questkey')
      );
      if (questKeyNode) {
        console.log(`${prefix}✅ Found questKey: "${questKeyNode.characters}"`);
      } else {
        console.log(`${prefix}❌ No questKey text found in Properties`);
      }
    }
  } else {
    console.log(`${prefix}❌ No Properties group found`);
  }
  
  // Check for Visuals frame
  const visualsFrame = quest.children.find(c => c.name === 'Visuals');
  if (visualsFrame) {
    console.log(`${prefix}✅ Found Visuals frame`);
    
    if (visualsFrame.children) {
      console.log(`${prefix}  Visuals children:`, visualsFrame.children.map(c => c.name));
      
      // Check for Image frame
      const imageFrame = visualsFrame.children.find(c => c.name === 'Image');
      if (imageFrame) {
        console.log(`${prefix}✅ Found Image frame in Visuals`);
      } else {
        console.log(`${prefix}❌ No Image frame found in Visuals`);
      }
      
      // Check for additional elements
      const additionalElements = visualsFrame.children.filter(c => c.name !== 'Image');
      if (additionalElements.length > 0) {
        console.log(`${prefix}✅ Found additional elements:`, additionalElements.map(c => c.name));
        console.log(`${prefix}  This will be treated as a complex quest (flattened export)`);
      } else {
        console.log(`${prefix}✅ Simple quest structure (just Image frame)`);
      }
    }
  } else {
    console.log(`${prefix}❌ No Visuals frame found`);
  }
  
  // Predict plugin behavior
  console.log(`${prefix}\n📤 Plugin Behavior Prediction:`);
  
  if (propertiesGroup && visualsFrame) {
    const questKeyNode = propertiesGroup.children?.find(c => 
      c.type === 'TEXT' && c.name.toLowerCase().includes('questkey')
    );
    const imageFrame = visualsFrame.children?.find(c => c.name === 'Image');
    const additionalElements = visualsFrame.children?.filter(c => c.name !== 'Image') || [];
    
    if (questKeyNode && imageFrame && additionalElements.length === 0) {
      console.log(`${prefix}✅ Simple quest: Plugin will export just the Image frame`);
    } else if (questKeyNode && additionalElements.length > 0) {
      console.log(`${prefix}✅ Complex quest: Plugin will flatten the entire Visuals frame`);
    } else {
      console.log(`${prefix}❌ Invalid structure: Plugin may fail to process this quest`);
    }
  } else {
    console.log(`${prefix}❌ Missing required structure: Properties group and Visuals frame`);
  }
}

function analyzeExportStructure() {
  console.log('=== Analyzing Export Structure ===');
  
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
  
  // Simulate plugin logic
  console.log('🔍 Simulating plugin scan logic...');
  
  // Find questKey
  const propertiesGroup = quest.children?.find(c => c.name === 'Properties');
  const questKeyNode = propertiesGroup?.children?.find(c => 
    c.type === 'TEXT' && c.name.toLowerCase().includes('questkey')
  );
  
  if (questKeyNode) {
    console.log('✅ QuestKey found:', questKeyNode.characters);
  } else {
    console.log('❌ QuestKey not found');
    return;
  }
  
  // Find Visuals frame
  const visualsFrame = quest.children?.find(c => c.name === 'Visuals');
  if (!visualsFrame) {
    console.log('❌ Visuals frame not found');
    return;
  }
  
  const children = visualsFrame.children || [];
  const imageChild = children.find(c => c.name === 'Image');
  const hasMultipleElements = children.length > 1;
  
  console.log('📊 Visuals frame analysis:');
  console.log('  Children count:', children.length);
  console.log('  Has Image frame:', !!imageChild);
  console.log('  Has multiple elements:', hasMultipleElements);
  
  if (imageChild && !hasMultipleElements) {
    console.log('✅ Simple quest structure detected');
    console.log('  Export target: Image frame');
    console.log('  Bounds: x=' + imageChild.x + ', y=' + imageChild.y + ', w=' + imageChild.width + ', h=' + imageChild.height);
  } else if (hasMultipleElements) {
    console.log('✅ Complex quest structure detected');
    console.log('  Export target: Entire Visuals frame');
    console.log('  Bounds: x=' + visualsFrame.x + ', y=' + visualsFrame.y + ', w=' + visualsFrame.width + ', h=' + visualsFrame.height);
    console.log('  Elements to be included:', children.map(c => c.name));
  } else {
    console.log('❌ Invalid quest structure');
  }
}

// Auto-run tests
console.log('🧪 Quest Component Structure Test Suite');
console.log('Run testComponentStructure() to test quest/questline structure');
console.log('Run analyzeExportStructure() to simulate plugin export logic');

if (figma.currentPage.selection.length > 0) {
  const selected = figma.currentPage.selection[0];
  if (selected.type === 'FRAME' && selected.name.toLowerCase().includes('questline')) {
    console.log('Auto-running questline test...');
    testQuestline(selected);
  } else if (selected.type === 'GROUP' || selected.type === 'INSTANCE') {
    console.log('Auto-running quest instance test...');
    testQuestInstance(selected);
  }
} 