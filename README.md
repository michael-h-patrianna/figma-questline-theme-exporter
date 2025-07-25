# Questline Demo App

A React application that demonstrates how to use questline data exported from the Figma Questline Exporter plugin.

## Features

- **ZIP File Upload**: Drag and drop or select the ZIP file exported from the Figma plugin
- **Automatic Asset Extraction**: Extracts all images and JSON data from the ZIP
- **Interactive Quest States**: Click on quests to cycle through locked → closed → open states
- **Responsive Preview**: Test how the questline looks on different screen sizes
- **No Server Required**: All images are loaded directly from the ZIP file using blob URLs

## How to Use

1. **Export from Figma**: Use the Questline Exporter plugin to export your questline as a ZIP file
2. **Upload to Demo**: Drag and drop the ZIP file into this demo app
3. **Test Responsiveness**: Use the size controls to see how the questline adapts to different screen sizes
4. **Interact with Quests**: Click on quests to change their states and see the visual updates

## Screen Size Presets

- **Mobile**: 375×667 (iPhone)
- **Tablet**: 768×1024 (iPad)
- **Desktop**: 1024×768 (Desktop)

## Technical Details

### File Structure
```
questline-demo/
├── src/
│   ├── components/
│   │   ├── QuestlineViewer.tsx    # Main questline display component
│   │   └── QuestlineViewer.css    # Styling for questline viewer
│   ├── utils/
│   │   └── zipExtractor.ts        # ZIP file extraction logic
│   ├── types.ts                   # TypeScript interfaces
│   ├── App.tsx                    # Main app component
│   └── App.css                    # App styling
```

### Key Components

- **QuestlineViewer**: Renders the questline with proper positioning and scaling
- **zipExtractor**: Extracts and parses ZIP files from the Figma plugin
- **Quest State Management**: Handles locked/closed/open states for each quest

### Responsive Behavior

The app maintains the original aspect ratio of the questline while scaling to fit different container sizes. This ensures the questline looks correct on any screen size.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Integration with Your App

This demo shows the pattern for integrating questline data into your React application:

1. **Extract ZIP data** using the `extractQuestlineZip` function
2. **Position quests** using the x, y, w, h coordinates from the JSON
3. **Display images** using the extracted blob URLs
4. **Handle quest states** by managing the locked/closed/open state for each quest

The demo app serves as a reference implementation for how to use the exported questline data in your own applications.
