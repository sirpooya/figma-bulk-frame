var newSize = 0;
// Globarl Function: Calculate size even after rotation
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
function capOfRotation(size, degrees) {
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
    const cap = [];
    cap[0] = (size[0] * Math.sin(radians));
    cap[1] = (size[0] * Math.cos(radians));
    cap[2] = (size[1] * Math.sin(radians));
    cap[3] = (size[1] * Math.cos(radians));
    return cap;
}
// Function: Calculate offset for rotated object positioning
function calculateRotationOffset(node) {
    if (node.rotation === 0) {
        return { x: 0, y: 0 };
    }
    
    // Convert rotation to radians
    var radians = node.rotation * Math.PI / 180;
    var cos = Math.cos(radians);
    var sin = Math.sin(radians);
    
    // Calculate how much the top-left corner (vertex 'a') shifts when rotated
    // For positive rotation: the top-left corner moves down and right
    // For negative rotation: the top-left corner moves up and left
    var offsetX = (node.width * (1 - cos) + node.height * sin) / 2;
    var offsetY = (node.width * sin + node.height * (1 - cos)) / 2;
    
    return { x: offsetX, y: offsetY };
}

// Function: Calculate frame position for rotated objects
function calculateFramePosition(node) {
    // Always position frame at the original node position
    // The frame should be positioned where the node originally was
    return { x: node.x, y: node.y };
}

// Close Function: writing for Read-only properties
function clone(val) {
    return JSON.parse(JSON.stringify(val));
}
// Deselect all Nodes
function deselectAll(page) {
    page.selection = [];
}
// Deselect specific Nodes
function deselectNode(node, frame) {
    // Don't forget to check that something is selected!
    // if (node.children.length > 0) {
    // page.selection = [node.children[0]]
    // }
    var selection = figma.currentPage.selection.slice();
    for (var i = selection.length - 1; i >= 0; --i) {
        if (selection[i].id == node.id) {
            selection.splice(i, 1);
        }
    }
    // return selection;
}
// Select specific Frames
function selectFrames(page, selections) {
    // console.log(selections);
    page.selection = [];
    figma.currentPage.selection = selections;
}
for (const node of figma.currentPage.selection) {
    var curSize = 0;
    var rotatedSize = sizeAfterRotation([node.width, node.height], node.rotation);
    // console.log(Math.round(rotatedSize[0])+" & "+Math.round(rotatedSize[1]));
    if (rotatedSize[0] > rotatedSize[1])
        curSize = rotatedSize[0];
    else
        curSize = rotatedSize[1];
    if (curSize > newSize)
        newSize = curSize;
    // console.log(newSize);
}

figma.showUI(__html__, { 
    width: 280, 
    height: 148,
    themeColors: true 
  });
figma.ui.postMessage(Math.ceil(newSize));
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
        var selections = [];
        var groups = [];
        
        // First, wrap each node into its own group
        for (const node of figma.currentPage.selection) {
            if ("opacity" in node) {
                const group = figma.group([node], figma.currentPage);
                groups.push(group);
            }
        }
        
        // Now create frames for each group
        for (const group of groups) {
            const frame = figma.createFrame();
            var size = msg.count;
            frame.resize(size, size);
            frame.fills = [];
            
            // Use the group's position to calculate frame position
            var framePosition = calculateFramePosition(group);
            frame.x = framePosition.x;
            frame.y = framePosition.y;
            
            // Get the node from the group
            const node = group.children[0];
            
            // 2. Calculate the offset to keep the node in its absolute position
            // Get group's current position and dimensions
            var groupX = group.x;
            var groupY = group.y;
            var groupWidth = group.width;
            var groupHeight = group.height;
            
            // Calculate the offset needed to center the group in the frame
            var offsetX = (size - groupWidth) / 2;
            var offsetY = (size - groupHeight) / 2;
            
            // 3. Move the group into the frame
            frame.appendChild(group);
            
            // 4. Set the group position to center it in the frame
            group.x = offsetX;
            group.y = offsetY;
            
            figma.notify("x offset: " + offsetX.toFixed(2) + ", y offset: " + offsetY.toFixed(2));
            
            // 5. Ungroup the node to leave it directly in the frame
            figma.ungroup(group);
            
            // 5. Position is now set correctly as relative coordinates
            frame.name = node.name;
            
            // Set constraints to scale both horizontally and vertically
            try {
                // Create a new constraints object
                const constraints = {
                    horizontal: "SCALE",
                    vertical: "SCALE"
                };
                
                // Apply constraints using the proper method
                if (node.type === "RECTANGLE" || node.type === "ELLIPSE" || node.type === "TEXT" || node.type === "VECTOR" || node.type === "STAR" || node.type === "LINE" || node.type === "POLYGON") {
                    // For these node types, we can set constraints
                    node.constraints = constraints;
                }
            } catch (error) {
                console.log("Could not set constraints:", error);
            }
            
            selections.push(frame);
        }
        

        
        selectFrames(figma.currentPage, selections);
    }
    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    figma.closePlugin();
};
