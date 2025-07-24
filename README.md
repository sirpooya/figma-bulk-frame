<img src="plugin-preview.gif" alt="Frame-It Plugin Preview" width="600"/>

# Frame-It
A Plugin for Figma to easily wrap a new frame around layers you've selected.

<a href="https://www.figma.com/community/plugin/847762563509209322/Frame-It">Install Plugin</a>

This plugin provides multiple ways to frame your layers with intelligent sizing and constraint management.

## Features

### 🎯 **Four Command Options**
- **Frame using layer size**: Creates frames using each layer's individual size (no UI needed)
- **Frame using custom size**: Creates frames using the maximum size from all selected layers (no UI needed)
- **Frame with custom settings**: Opens UI for advanced control over frame sizes and options
- **Set constraints to scale**: Recursively sets scale constraints for all selected layers and their children

### 🔧 **Core Functionality**
- **Dynamic Selection Monitoring**: Automatically recalculates frame size when selection changes
- **Rotated Object Support**: Handles rotated layers with proper bounding box calculations
- **Individual Frame Sizing**: Option to keep original layer size or use custom square dimensions
- **Smart Centering**: Automatically centers objects within frames while maintaining absolute positions
- **Universal Constraint Support**: Applies responsive scaling constraints to all layer types that support constraints
- **Recursive Processing**: Handles nested groups, frames, and complex layer structures
- **Real-time Size Suggestions**: Suggests optimal frame size based on current selection
- **Clean Group Management**: Temporarily groups objects for precise positioning, then ungroups for clean structure

### 🚀 **Quick Commands**
Run these commands directly from the plugin menu for instant results:
- **No UI needed** for quick framing operations
- **Immediate execution** with helpful notifications
- **Works with any selection** - individual layers, groups, frames, or mixed content
- **Recursive constraint updates** for complex nested structures

### 🎨 **Advanced UI**
- **Custom size input** with automatic suggestions
- **Individual vs. uniform sizing** toggle
- **Real-time size updates** as selection changes
- **Theme-aware interface** that adapts to Figma's design system