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
figma.ui.postMessage(Math.round(newSize));
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
                const fills = clone(frame.fills);
                fills[0].visible = false;
                frame.fills = fills;
                // Find out if layer is rotated
                var rotatedSize = sizeAfterRotation([node.width, node.height], node.rotation);
                var cap = capOfRotation([node.width, node.height], node.rotation);
                var rotatedW = Math.round(rotatedSize[0]);
                var rotatedH = Math.round(rotatedSize[1]);
                if (rotatedW != node.width && rotatedH != node.height) {
                    frame.x = node.x - rotatedW / 2;
                    frame.y = node.y - rotatedH / 2;
                    // console.log(cap[0]+cap[1]+cap[2]+cap[3]);
                    node.x = (size - rotatedW) / 2;
                    node.y = (size - rotatedH) / 2;
                    if (node.rotation >= 90) {
                        node.x = ((size - rotatedW) / 2) + cap[2];
                        node.y = (size - rotatedH) / 2 + cap[0] + cap[3];
                    }
                    else if (node.rotation < 0) {
                        node.x = (size - rotatedW) / 2 + cap[1];
                        node.y = (size - rotatedH) / 2;
                    }
                    else if (node.rotation <= -90) {
                        node.x = (size - rotatedW) / 2 + cap[1] + cap[2];
                        node.y = (size - rotatedH) / 2 + cap[3];
                    }
                }
                else {
                    frame.x = node.x;
                    frame.y = node.y;
                    node.x = (size - node.width) / 2;
                    node.y = (size - node.height) / 2;
                }
                frame.appendChild(node);
                frame.name = node.name;
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
