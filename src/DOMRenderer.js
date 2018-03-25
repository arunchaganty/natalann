import React from 'react';

// Renders an ElementTree into React.
class DOMRenderer {
  render(root, key) {
    if (root.nodeType === Node.TEXT_NODE) {
      return root.nodeValue;
    } else if (root.nodeType === Node.COMMENT_NODE) {
      return "";
    } else if (root.nodeType === Node.ELEMENT_NODE) {
      let props = {};
      for (let i = 0; i < root.attributes.length; i++) {
        let attr = root.attributes[i];
        props[attr.name] = attr.value.toString();
      }
      if (key !== undefined) {
        props["key"] = key;
      }

      let arr = [];
      for (let i = 0; i < root.childNodes.length; i++) {
        arr.push(this.render(root.childNodes[i], i));
      }

      return React.createElement(root.nodeName.toLowerCase(), props, arr);
    }
  }
}
export default DOMRenderer;
