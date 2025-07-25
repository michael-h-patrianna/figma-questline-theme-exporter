# AI Image Generation Prompt: Quest Icon Sprite Maps

## Context
You are creating sprite maps for quest icons in a mobile game questline system. Each quest can be in 5 different states, and we need all states for each quest icon to be arranged in a sprite map format for efficient loading.

## Technical Requirements
- **Sprite Map Format**: Create a 5x1 horizontal layout (5 icons side by side)
- **Icon Size**: Each individual icon should be 64x64 pixels
- **Total Canvas**: 320x64 pixels (5 icons × 64px width)
- **File Format**: PNG with transparent background
- **Style**: Flat design, clean lines, high contrast for mobile visibility

## Quest States (Left to Right in Sprite Map)

### 1. LOCKED State (First Position)
- **Visual Style**: Desaturated/muted colors (30-40% saturation)
- **Key Element**: Prominent lock icon (padlock or lock symbol)
- **Background**: Semi-transparent overlay or darkened version of the base icon
- **Purpose**: Shows quest is not yet available to the player

### 2. ACTIVE State (Second Position)
- **Visual Style**: Full saturation, vibrant colors
- **Key Element**: The main quest icon in its normal, clickable state
- **Background**: Clean, no overlays
- **Purpose**: Shows quest is available and can be completed

### 3. UNCLAIMED State (Third Position)
- **Visual Style**: Full saturation with attention-grabbing elements
- **Key Element**: Same as active state, but with a prominent "CLAIM" button or badge
- **Button Style**: Rounded rectangle with white text on bright background (red, orange, or gold)
- **Purpose**: Shows quest is completed but reward hasn't been claimed yet

### 4. COMPLETED State (Fourth Position)
- **Visual Style**: Full saturation with completion indicator
- **Key Element**: Same as active state, but with a checkmark overlay
- **Checkmark Style**: Green checkmark (✓) in top-right corner or center
- **Purpose**: Shows quest is completed and reward has been claimed

### 5. DISABLED State (Fifth Position)
- **Visual Style**: Very desaturated (10-20% saturation), grayed out
- **Key Element**: Same as active state but heavily muted
- **Background**: Optional subtle "disabled" pattern or overlay
- **Purpose**: Shows quest is temporarily unavailable or disabled

## Quest Icon Themes to Create

### Birthday Theme ("Happy Birthday")
- **Base Icon**: Birthday cake, party hat, gift box, balloon, cupcake
- **Colors**: Bright, festive colors (pink, blue, yellow, purple)
- **Style**: Playful, celebratory

### Christmas Theme ("Merry Christmas")
- **Base Icon**: Christmas tree, snowman, gift, star, candy cane, reindeer
- **Colors**: Traditional Christmas colors (red, green, gold, white)
- **Style**: Festive, warm, traditional

### Halloween Theme ("Spooky Halloween")
- **Base Icon**: Pumpkin, ghost, bat, spider, witch hat, candy
- **Colors**: Orange, black, purple, green
- **Style**: Spooky but not scary, fun

### Summer Theme ("Summer Fun")
- **Base Icon**: Beach ball, ice cream, sunglasses, palm tree, surfboard
- **Colors**: Bright summer colors (blue, yellow, orange, pink)
- **Style**: Bright, energetic, fun

### Space Theme ("Space Adventure")
- **Base Icon**: Rocket, planet, star, astronaut, UFO, satellite
- **Colors**: Deep blues, purples, with bright accent colors
- **Style**: Futuristic, sci-fi

## Specific Instructions for AI

1. **Create 5 sprite maps** (one for each theme above)
2. **Each sprite map** should be 320x64 pixels with 5 icons arranged horizontally
3. **Left to right order**: LOCKED → ACTIVE → UNCLAIMED → COMPLETED → DISABLED
4. **Ensure consistency** - the base icon should be the same across all 5 states, only the overlays/effects change
5. **Make the CLAIM button** in the UNCLAIMED state clearly visible and readable
6. **Use the checkmark** in the COMPLETED state to clearly indicate completion
7. **Use the lock icon** in the LOCKED state to clearly indicate unavailability
8. **Keep the DISABLED state** very muted and clearly "off"
9. **Maintain visual hierarchy** - the ACTIVE state should be the most prominent
10. **Ensure mobile visibility** - icons should be clear even at small sizes

## Example Output Description
For a birthday cake icon:
- **LOCKED**: Grayed-out cake with prominent lock icon overlay
- **ACTIVE**: Bright, colorful birthday cake with candles
- **UNCLAIMED**: Same cake with bright "CLAIM" button in corner
- **COMPLETED**: Same cake with green checkmark overlay
- **DISABLED**: Very muted, gray version of the cake

## File Naming Convention
- `birthday-quest-icons.png`
- `christmas-quest-icons.png`
- `halloween-quest-icons.png`
- `summer-quest-icons.png`
- `space-quest-icons.png`

## Quality Requirements
- **High contrast** for mobile visibility
- **Clean edges** and smooth lines
- **Consistent style** across all states
- **Professional quality** suitable for commercial use
- **Scalable design** that works at different sizes 