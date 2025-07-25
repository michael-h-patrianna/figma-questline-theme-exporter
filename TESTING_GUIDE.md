# Testing Guide: Quest Flattening Feature

## Test Scenarios

### 1. Backward Compatibility Test (Base Scenario)
**Goal**: Verify that simple quest components still work as before

**Setup**:
```
Quest Instance (Group)
├── Image (Frame/Rectangle with image fill)
└── questKey: "daily-login" (Text node)
```

**Expected Behavior**:
- ✅ Plugin finds the "Image" layer
- ✅ Plugin exports just the image
- ✅ questKey text is excluded from export
- ✅ Export works exactly as before

**Test Steps**:
1. Create a quest instance with just an "Image" layer and questKey text
2. Run the plugin scan
3. Verify scan completes successfully
4. Export assets
5. Check that only the image is exported (no text)

### 2. Complex Design Test (New Feature)
**Goal**: Verify that complex quest designs work with flattening

**Setup**:
```
Quest Instance (Group)
├── Background Shape (with gradient)
├── Quest Icon (with mask)
├── Progress Ring (vector)
├── Text Label: "Daily Login"
├── Glow Effect
└── questKey: "daily-login" (Text node)
```

**Expected Behavior**:
- ✅ Plugin finds multiple visual elements
- ✅ Plugin excludes questKey text
- ✅ Plugin creates temporary visual frame
- ✅ Plugin exports flattened image
- ✅ Plugin cleans up temporary frame
- ✅ Export contains all visual elements except questKey

**Test Steps**:
1. Create a complex quest design with multiple elements
2. Add questKey text node
3. Run the plugin scan
4. Check console logs for "Found visual elements" and "Created visual frame"
5. Export assets
6. Verify the exported image contains all design elements but not the questKey text

### 3. Mixed Scenario Test
**Goal**: Verify that questline with both simple and complex quests works

**Setup**:
```
Questline Frame
├── Quest 1 (Simple): Group with Image + questKey
├── Quest 2 (Complex): Group with multiple elements + questKey
├── Quest 3 (Simple): Group with Image + questKey
└── Background
```

**Expected Behavior**:
- ✅ Plugin handles both simple and complex quests
- ✅ All quests export successfully
- ✅ No temporary frames remain in document

## Console Debugging

### Look for These Log Messages

**For Simple Quests**:
```
SCAN DEBUG: Found simple Image node for quest daily-login
SCAN DEBUG: imageNode has exportAsync, attempting export
```

**For Complex Quests**:
```
SCAN DEBUG: Found visual elements for quest daily-login: [Background Shape, Quest Icon, Progress Ring, Text Label]
SCAN DEBUG: No simple Image node found, creating visual frame for quest daily-login
SCAN DEBUG: Created visual frame for quest daily-login with 4 elements
SCAN DEBUG: Cleaned up visual frame for quest daily-login
```

**For Errors**:
```
SCAN DEBUG: No exportable image found for quest daily-login
SCAN DEBUG: Failed to create visual frame for quest daily-login
```

## Manual Testing Steps

### Step 1: Test Backward Compatibility
1. **Create Simple Quest**:
   - Create a Group named "Quest Instance"
   - Add a Frame named "Image" with an image fill
   - Add a Text node with questKey content
   - Add to a questline frame

2. **Test Export**:
   - Select the questline frame
   - Run plugin scan
   - Verify scan shows quest found
   - Export assets
   - Check exported image (should be just the image, no text)

### Step 2: Test Complex Design
1. **Create Complex Quest**:
   - Create a Group named "Quest Instance"
   - Add multiple visual elements (shapes, vectors, text labels)
   - Add a Text node with questKey content
   - Add to a questline frame

2. **Test Export**:
   - Select the questline frame
   - Run plugin scan
   - Check console for visual frame creation logs
   - Export assets
   - Check exported image (should contain all design elements, no questKey text)

### Step 3: Test Mixed Scenario
1. **Create Mixed Questline**:
   - Create questline frame
   - Add 2 simple quests (Group + Image + questKey)
   - Add 1 complex quest (Group + multiple elements + questKey)
   - Add background

2. **Test Export**:
   - Select the questline frame
   - Run plugin scan
   - Verify all quests are found
   - Export assets
   - Check all exported images

## Verification Checklist

### Backward Compatibility ✅
- [ ] Simple quests with "Image" layer work
- [ ] questKey text is excluded from exports
- [ ] No temporary frames remain in document
- [ ] Export performance is similar to before

### New Flattening Feature ✅
- [ ] Complex quests export successfully
- [ ] questKey text is excluded from exports
- [ ] All visual elements are included in export
- [ ] Temporary frames are cleaned up
- [ ] Console shows appropriate debug messages

### Error Handling ✅
- [ ] Quests with no visual elements show error
- [ ] Plugin continues processing other quests
- [ ] Clear error messages for designers

### Performance ✅
- [ ] Export completes in reasonable time
- [ ] No memory leaks (temporary frames cleaned up)
- [ ] File sizes are reasonable

## Debug Commands

### Check Quest Structure
```javascript
// In Figma console
figma.currentPage.selection.forEach(node => {
  console.log('Node:', node.name, node.type);
  if (node.children) {
    node.children.forEach(child => {
      console.log('  Child:', child.name, child.type);
    });
  }
});
```

### Check Visual Elements
```javascript
// In plugin console, look for:
// "Found visual elements for quest [questKey]: [element names]"
// "Created visual frame for quest [questKey] with [X] elements"
// "Cleaned up visual frame for quest [questKey]"
```

## Common Issues & Solutions

### Issue: "No exportable image found"
**Cause**: Quest has no visual elements or all elements are excluded
**Solution**: Add visual elements to the quest instance

### Issue: Export fails for complex quest
**Cause**: Elements can't be cloned or exported
**Solution**: Check that elements support `exportAsync` and `clone`

### Issue: Temporary frame not cleaned up
**Cause**: Error during cleanup
**Solution**: Check console for cleanup error messages

### Issue: questKey text appears in export
**Cause**: Text node not properly excluded
**Solution**: Verify questKey text is separate from visual elements

---

This testing approach ensures both the new flattening feature and backward compatibility work correctly! 