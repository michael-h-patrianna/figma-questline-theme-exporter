// Test script for sibling elements in Visuals frame
// Tests the case where Image frame and other elements are siblings

function testSiblingElements() {
  console.log('=== Testing Sibling Elements in Visuals Frame ===');
  
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
  
  console.log('📊 Analyzing quest:', quest.name);
  
  // Find Visuals frame
  const visualsFrame = quest.children?.find(c => c.name === 'Visuals');
  if (!visualsFrame) {
    console.log('❌ No Visuals frame found');
    return;
  }
  
  console.log('✅ Found Visuals frame');
  
  const children = visualsFrame.children || [];
  console.log('📋 Visuals children:', children.map(c => c.name));
  
  // Check for Image frame
  const imageChild = children.find(c => c.name === 'Image');
  const hasMultipleElements = children.length > 1;
  const hasImageAndOthers = imageChild && hasMultipleElements;
  
  console.log('\n📊 Structure Analysis:');
  console.log('  Has Image frame:', !!imageChild);
  console.log('  Has multiple elements:', hasMultipleElements);
  console.log('  Has Image + siblings:', hasImageAndOthers);
  console.log('  Total children:', children.length);
  
  if (imageChild && !hasMultipleElements) {
    console.log('\n✅ Simple quest structure detected');
    console.log('  Plugin will export just the Image frame');
    console.log('  Export target: Image frame');
    console.log('  Bounds: x=' + imageChild.x + ', y=' + imageChild.y + ', w=' + imageChild.width + ', h=' + imageChild.height);
  } else if (hasMultipleElements) {
    console.log('\n✅ Complex quest structure detected');
    console.log('  Plugin will export the entire Visuals frame');
    console.log('  Export target: Visuals frame');
    console.log('  Bounds: x=' + visualsFrame.x + ', y=' + visualsFrame.y + ', w=' + visualsFrame.width + ', h=' + visualsFrame.height);
    console.log('  Elements to be included:', children.map(c => c.name));
    
    if (hasImageAndOthers) {
      console.log('  ✅ This includes Image frame + sibling elements');
    }
  } else {
    console.log('\n❌ Invalid quest structure');
  }
  
  // Test plugin logic simulation
  console.log('\n🔍 Plugin Logic Simulation:');
  
  if (hasMultipleElements) {
    console.log('  Plugin will treat this as COMPLEX quest');
    console.log('  Plugin will export the entire Visuals frame');
    console.log('  This means Image + Rectangle will both be included');
    console.log('  The exported image will show the Rectangle on top of the Image');
  } else if (imageChild) {
    console.log('  Plugin will treat this as SIMPLE quest');
    console.log('  Plugin will export just the Image frame');
    console.log('  This means only the Image content will be exported');
  }
}

function testSpecificStructure() {
  console.log('=== Testing Specific Structure ===');
  
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    console.log('❌ No selection. Please select a quest instance.');
    return;
  }
  
  const quest = selection[0];
  const visualsFrame = quest.children?.find(c => c.name === 'Visuals');
  
  if (!visualsFrame || !visualsFrame.children) {
    console.log('❌ No Visuals frame or children found');
    return;
  }
  
  const children = visualsFrame.children;
  const imageChild = children.find(c => c.name === 'Image');
  const otherElements = children.filter(c => c.name !== 'Image');
  
  console.log('📋 Detailed Analysis:');
  console.log('  Image frame found:', !!imageChild);
  console.log('  Other elements found:', otherElements.length);
  console.log('  Other elements:', otherElements.map(c => c.name));
  
  if (imageChild && otherElements.length > 0) {
    console.log('\n✅ This is the structure you described:');
    console.log('  - Image frame exists');
    console.log('  - Rectangle (or other elements) exist as siblings');
    console.log('  - Plugin should export both Image + Rectangle');
    console.log('  - Rectangle should be visible on top of Image');
  } else if (imageChild && otherElements.length === 0) {
    console.log('\n✅ Simple structure:');
    console.log('  - Only Image frame exists');
    console.log('  - Plugin will export just the Image');
  } else {
    console.log('\n❌ Unexpected structure');
  }
}

// Auto-run tests
console.log('🧪 Sibling Elements Test Suite');
console.log('Run testSiblingElements() to test general sibling detection');
console.log('Run testSpecificStructure() to test specific Image + Rectangle case');

if (figma.currentPage.selection.length > 0) {
  const selected = figma.currentPage.selection[0];
  if (selected.type === 'GROUP' || selected.type === 'INSTANCE') {
    console.log('Auto-running sibling elements test...');
    testSiblingElements();
    console.log('\n---');
    testSpecificStructure();
  }
} 