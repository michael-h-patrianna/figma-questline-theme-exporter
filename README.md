# Figma Questline Theme Exporter

A Figma plugin that allows designers to create and export questline themes with complex visual designs. The plugin scans Figma documents for quest components, validates their structure, and exports them as ready-to-use assets for web and mobile applications.

## Features

- **Smart Quest Detection**: Automatically finds quest components in your Figma document
- **4-State Quest System**: Supports locked, active, unclaimed, and completed states
- **Complex Design Support**: Allows designers to create elaborate quest designs with masks, effects, and vector elements that get flattened into single images during export
- **Flexible Component Structure**: Works with nested component structures (Properties group with questKey, Visuals frame with Image)
- **Duplicate Validation**: Detects and reports duplicate questKey values during scanning
- **Background Export**: Exports questline background images
- **ZIP Export**: Creates organized ZIP files with all assets and positioning data
- **Live Preview**: Real-time preview of quest states in the plugin UI

## How to Use

### 1. Set Up Your Quest Components

Create quest components in Figma with this structure:
```
Quest Component
├── Properties (group)
│   └── questKey (text node)
└── Visuals (frame)
    ├── Image (frame with image fill)
    └── [Additional elements for complex designs]
```

### 2. Create Quest Instances

- Copy and paste your quest component to create instances
- Position them in your questline layout
- Each instance should have a unique `questKey` value

### 3. Export Your Questline

1. **Scan**: Click "Scan Document" to find all quest instances
2. **Preview**: Use the preview mode to see how quests look in different states
3. **Export**: Click "Export Assets" to generate a ZIP file with all images and data

## Quest States

The plugin supports 4 quest states:

- **Locked**: Quest is not yet available (desaturated with lock icon)
- **Active**: Quest is available and can be completed (full color)
- **Unclaimed**: Quest is completed but reward hasn't been claimed (with "CLAIM" button)
- **Completed**: Quest is completed and reward has been claimed (with checkmark)

## Complex Design Support

Designers can create elaborate quest designs by adding elements to the Visuals frame:

- **Masks and Effects**: Add layer effects, masks, or filters
- **Vector Elements**: Include shapes, paths, or other vector graphics
- **Multiple Elements**: Combine images, shapes, and text elements

During export, the entire Visuals frame is flattened into a single image, excluding the questKey text node.

## Export Output

The plugin generates a ZIP file containing:

```
questline-{id}/
├── questline-bg.png          # Background image
├── quest-{key}-locked.png    # Locked state image
├── quest-{key}-active.png    # Active state image
├── quest-{key}-unclaimed.png # Unclaimed state image
├── quest-{key}-completed.png # Completed state image
└── positions.json            # Quest positioning and metadata
```

## Technical Details

### File Structure
```
figmaquests/
├── src/
│   ├── main/
│   │   ├── scan.ts           # Document scanning logic
│   │   ├── export.ts         # Asset export functionality
│   │   ├── types.ts          # TypeScript interfaces
│   │   └── errors.ts         # Error message definitions
│   ├── ui/
│   │   ├── components/       # UI components
│   │   ├── state/           # State management
│   │   └── index.tsx        # Main UI
│   └── shared/
│       └── constants.ts      # Shared constants
├── manifest.json             # Figma plugin manifest
└── webpack.config.js         # Build configuration
```

### Key Features

- **Component Detection**: Finds quest components using Figma's component API
- **Image Export**: Exports quest states as PNG images with proper sizing
- **Validation**: Checks for duplicate questKeys and missing required states
- **State Management**: Handles Figma component state switching for export
- **Error Handling**: Provides clear error messages for common issues

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Error Messages

The plugin provides clear error messages for common issues:

- **Duplicate Quest Keys**: When multiple quests have the same questKey
- **Missing Active State**: When a quest doesn't have the required 'active' state
- **Invalid Component Structure**: When quest components don't follow the expected structure

## Integration

The exported ZIP files can be used with:

- **Web Applications**: React, Vue, Angular, or vanilla JavaScript
- **Mobile Apps**: React Native, Flutter, or native mobile development
- **Game Engines**: Unity, Unreal Engine, or other game development platforms

The `positions.json` file contains all the positioning data needed to recreate the questline layout in any application.

## Contributing

This plugin is designed for internal company use. For questions or issues, please contact the development team.

## License

Internal company use only.
