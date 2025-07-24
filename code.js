// Calculate size after rotation
function sizeAfterRotation(size, degrees) {
    degrees = degrees % 180;
    if (degrees < 0) {
        degrees = 180 + degrees;
    }
    if (degrees >= 90) {
        size = [size[1], size[0]];
        degrees = degrees - 90;
    }
    if (degrees === 0) {
        return size;
    }
    const radians = degrees * Math.PI / 180;
    const width = (size[0] * Math.cos(radians)) + (size[1] * Math.sin(radians));
    const height = (size[0] * Math.sin(radians)) + (size[1] * Math.cos(radians));
    return [width, height];
}

// Calculate frame position for rotated objects
function calculateFramePosition(node) {
    return { x: node.x, y: node.y };
}

// Select specific Frames
function selectFrames(page, selections) {
    page.selection = [];
    figma.currentPage.selection = selections;
}

// Calculate maximum frame size from current selection
function calculateMaxFrameSize() {
    let maxFrameSize = 0;
    
    for (const node of figma.currentPage.selection) {
        let currentSize = 0;
        const rotatedSize = sizeAfterRotation([node.width, node.height], node.rotation);
        if (rotatedSize[0] > rotatedSize[1])
            currentSize = rotatedSize[0];
        else
            currentSize = rotatedSize[1];
        if (currentSize > maxFrameSize)
            maxFrameSize = currentSize;
    }
    
    return Math.ceil(maxFrameSize);
}

// Create frames for selected nodes
function createFramesForSelection(frameSize, useIndividualSizes = false) {
    var createdFrames = [];
    var nodeGroups = [];
    
    // First, wrap each node into its own group
    for (const selectedNode of figma.currentPage.selection) {
        if ("opacity" in selectedNode) {
            const nodeGroup = figma.group([selectedNode], figma.currentPage);
            nodeGroups.push(nodeGroup);
        }
    }
    
    // Now create frames for each group
    for (const nodeGroup of nodeGroups) {
        const newFrame = figma.createFrame();
        
        // Determine frame size based on setting
        var actualFrameSize;
        if (useIndividualSizes) {
            // Use individual group dimensions
            actualFrameSize = Math.max(nodeGroup.width, nodeGroup.height);
        } else {
            // Use the provided frame size
            actualFrameSize = frameSize;
        }
        
        newFrame.resize(actualFrameSize, actualFrameSize);
        newFrame.fills = [];
        
        // Get the node from the group
        const originalNode = nodeGroup.children[0];
        
        // Calculate the offset to keep the node in its absolute position
        var groupWidth = nodeGroup.width;
        var groupHeight = nodeGroup.height;
        
        // Calculate the offset needed to center the group in the frame
        var centerOffsetX = (actualFrameSize - groupWidth) / 2;
        var centerOffsetY = (actualFrameSize - groupHeight) / 2;
        
        // Use the group's position to calculate frame position, adjusted by center offset
        var framePosition = calculateFramePosition(nodeGroup);
        newFrame.x = framePosition.x - centerOffsetX;
        newFrame.y = framePosition.y - centerOffsetY;
        
        // Move the group into the frame
        newFrame.appendChild(nodeGroup);
        
        // Set the group position to center it in the frame
        nodeGroup.x = centerOffsetX;
        nodeGroup.y = centerOffsetY;
        
        // Ungroup the node to leave it directly in the frame
        figma.ungroup(nodeGroup);
        
        // Set frame name
        newFrame.name = originalNode.name;
        
        // Set constraints to scale both horizontally and vertically
        try {
            const constraints = {
                horizontal: "SCALE",
                vertical: "SCALE"
            };
            
            if (originalNode.type === "RECTANGLE" || originalNode.type === "ELLIPSE" || originalNode.type === "TEXT" || originalNode.type === "VECTOR" || originalNode.type === "STAR" || originalNode.type === "LINE" || originalNode.type === "POLYGON") {
                originalNode.constraints = constraints;
            }
        } catch (error) {
            console.log("Could not set constraints:", error);
        }
        
        createdFrames.push(newFrame);
    }
    
    return createdFrames;
}

// Command: Frame using layer size (individual sizes)
function frameUsingLayerSize() {
    if (figma.currentPage.selection.length === 0) {
        figma.notify("Please select at least one layer");
        return;
    }
    
    const createdFrames = createFramesForSelection(0, true); // true for individual sizes
    selectFrames(figma.currentPage, createdFrames);
    figma.notify(`Created ${createdFrames.length} frames using individual layer sizes`);
}

// Command: Frame using custom size (max size)
function frameUsingCustomSize() {
    if (figma.currentPage.selection.length === 0) {
        figma.notify("Please select at least one layer");
        return;
    }
    
    const maxSize = calculateMaxFrameSize();
    const createdFrames = createFramesForSelection(maxSize, false); // false for custom size
    selectFrames(figma.currentPage, createdFrames);
    figma.notify(`Created ${createdFrames.length} frames using max size: ${maxSize}px`);
}

// Command: Set constraints to scale for selected layers
function setConstraintsToScale() {
    if (figma.currentPage.selection.length === 0) {
        figma.notify("Please select at least one layer");
        return;
    }
    
    const constraints = {
        horizontal: "SCALE",
        vertical: "SCALE"
    };
    
    let updatedCount = 0;
    
    // Recursive function to update constraints for a node and all its children
    function updateNodeConstraints(node) {
        try {
            // Update constraints for any node that supports constraints
            if ("constraints" in node) {
                node.constraints = constraints;
                updatedCount++;
            }
            
            // Recursively check children if the node has any
            if ("children" in node && node.children) {
                for (const child of node.children) {
                    updateNodeConstraints(child);
                }
            }
        } catch (error) {
            console.log("Could not set constraints for node:", error);
        }
    }
    
    // Process all selected nodes
    for (const node of figma.currentPage.selection) {
        updateNodeConstraints(node);
    }
    
    if (updatedCount > 0) {
        figma.notify(`Set scale constraints for ${updatedCount} layers`);
    } else {
        figma.notify("No compatible layers found for constraint changes");
    }
}

// Check if we're running as a command or with UI
if (figma.command === "frame-using-layer-size") {
    frameUsingLayerSize();
    figma.closePlugin();
} else if (figma.command === "frame-using-custom-size") {
    frameUsingCustomSize();
    figma.closePlugin();
} else if (figma.command === "set-constraints-scale") {
    setConstraintsToScale();
    figma.closePlugin();
} else if (figma.command === "frame-with-ui") {
    // Show UI for custom settings
    figma.showUI(__html__, { 
        width: 280,
        height: 160,
        themeColors: true 
    });

    // Update UI with new max frame size and selection count
    function updateUISize() {
        const maxSize = calculateMaxFrameSize();
        const selectionCount = figma.currentPage.selection.length;
        figma.ui.postMessage({ type: 'update-size', size: maxSize });
        figma.ui.postMessage({ type: 'update-selection-count', count: selectionCount });
    }

    // Initialize with current selection
    updateUISize();

    // Monitor selection changes
    figma.on('selectionchange', () => {
        updateUISize();
    });

    // Calls to "parent.postMessage" from within the HTML page will trigger this
    // callback. The callback will be passed the "pluginMessage" property of the
    // posted message.
    figma.ui.onmessage = msg => {
        // One way of distinguishing between different types of messages sent from
        // your HTML page is to use an object with a "type" property like this.
        if (msg.type === 'create-frame') {
            const createdFrames = createFramesForSelection(msg.count, msg.frameIndividually);
            selectFrames(figma.currentPage, createdFrames);
        }
        // Make sure to close the plugin when you're done. Otherwise the plugin will
        // keep running, which shows the cancel button at the bottom of the screen.
        figma.closePlugin();
    };
} else {
    // Default UI mode - show the interface
    figma.showUI(__html__, { 
        width: 280, 
        height: 160,
        themeColors: true 
    });

    // Update UI with new max frame size and selection count
    function updateUISize() {
        const maxSize = calculateMaxFrameSize();
        const selectionCount = figma.currentPage.selection.length;
        figma.ui.postMessage({ type: 'update-size', size: maxSize });
        figma.ui.postMessage({ type: 'update-selection-count', count: selectionCount });
    }

    // Initialize with current selection
    updateUISize();

    // Monitor selection changes
    figma.on('selectionchange', () => {
        updateUISize();
    });

    // Calls to "parent.postMessage" from within the HTML page will trigger this
    // callback. The callback will be passed the "pluginMessage" property of the
    // posted message.
    figma.ui.onmessage = msg => {
        // One way of distinguishing between different types of messages sent from
        // your HTML page is to use an object with a "type" property like this.
        if (msg.type === 'create-frame') {
            const createdFrames = createFramesForSelection(msg.count, msg.frameIndividually);
            selectFrames(figma.currentPage, createdFrames);
        }
        // Make sure to close the plugin when you're done. Otherwise the plugin will
        // keep running, which shows the cancel button at the bottom of the screen.
        figma.closePlugin();
    };
}
