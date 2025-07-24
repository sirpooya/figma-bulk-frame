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
        for (const node of figma.currentPage.selection) {
            if ("opacity" in node) {
                const frame = figma.createFrame();
                var size = msg.count;
                frame.resize(size, size);
                frame.fills = [];
                // Calculate the rotated dimensions of the node
                var rotatedSize = sizeAfterRotation([node.width, node.height], node.rotation);
                var rotatedW = Math.round(rotatedSize[0]);
                var rotatedH = Math.round(rotatedSize[1]);
                
                // Position frame at the center of the original node
                frame.x = node.x + (node.width / 2) - (size / 2);
                frame.y = node.y + (node.height / 2) - (size / 2);
                
                // Add node to frame first, then adjust position
                frame.appendChild(node);
                
                // Use the normalized dimensions for centering
                var rotatedSize = sizeAfterRotation([node.width, node.height], node.rotation);
                var normalizedWidth = rotatedSize[0];
                var normalizedHeight = rotatedSize[1];
                
                // Simple and reliable centering for all rotation angles
                node.x = (size - normalizedWidth) / 2;
                node.y = (size - normalizedHeight) / 2;
                
                // Ensure values are not negative
                if (node.x < 0) node.x = 0;
                if (node.y < 0) node.y = 0;
                
                // Then use Figma's layout constraints to center it
                try {
                    // Set constraints to center the node
                    if (node.constraints) {
                        node.constraints.horizontal = "CENTER";
                        node.constraints.vertical = "CENTER";
                    }
                } catch (error) {
                    console.log("Could not set center constraints:", error);
                }
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
                // deselectAll(figma.currentPage);
                selections.push(frame);
            }
        }
        

        
        selectFrames(figma.currentPage, selections);
    }
    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    figma.closePlugin();
};
