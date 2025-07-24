var maxFrameSize = 0;

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
for (const node of figma.currentPage.selection) {
    var currentSize = 0;
    var rotatedSize = sizeAfterRotation([node.width, node.height], node.rotation);
    if (rotatedSize[0] > rotatedSize[1])
        currentSize = rotatedSize[0];
    else
        currentSize = rotatedSize[1];
    if (currentSize > maxFrameSize)
        maxFrameSize = currentSize;
}

figma.showUI(__html__, { 
    width: 280, 
    height: 148,
    themeColors: true 
  });
figma.ui.postMessage(Math.ceil(maxFrameSize));
// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {
    // One way of distinguishing between different types of messages sent from
    // your HTML page is to use an object with a "type" property like this.
    if (msg.type === 'create-frame') {
        // const nodes: SceneNode[] = [];
        // for (let i = 0; i < msg.count; i++) {
        // const rect = figma.createRectangle();
        // rect.x = i * 150;
        // rect.fills = [{type: 'SOLID', color: {r: 1, g: 0.5, b: 0}}];
        // figma.currentPage.appendChild(rect);
        // nodes.push(rect);
        // }
        // figma.currentPage.selection = nodes;
        // figma.viewport.scrollAndZoomIntoView(nodes);
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
            var frameSize = msg.count;
            newFrame.resize(frameSize, frameSize);
            newFrame.fills = [];
            
            // Get the node from the group
            const originalNode = nodeGroup.children[0];
            
            // Calculate the offset to keep the node in its absolute position
            var groupWidth = nodeGroup.width;
            var groupHeight = nodeGroup.height;
            
            // Calculate the offset needed to center the group in the frame
            var centerOffsetX = (frameSize - groupWidth) / 2;
            var centerOffsetY = (frameSize - groupHeight) / 2;
            
            // Use the group's position to calculate frame position, adjusted by center offset
            var framePosition = calculateFramePosition(nodeGroup);
            newFrame.x = framePosition.x - centerOffsetX;
            newFrame.y = framePosition.y - centerOffsetY;
            
            // Move the group into the frame
            newFrame.appendChild(nodeGroup);
            
            // Set the group position to center it in the frame
            nodeGroup.x = centerOffsetX;
            nodeGroup.y = centerOffsetY;
            
            figma.notify("x offset: " + centerOffsetX.toFixed(2) + ", y offset: " + centerOffsetY.toFixed(2));
            
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
        

        
        selectFrames(figma.currentPage, createdFrames);
    }
    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    figma.closePlugin();
};
