/**
 * Transforms (JSON) DOM to include selections.
 */
class DOMTransformer {
  transform_(elem, currentPath, currentTransformationIdx, transforms) {
    let elem_ = elem.cloneNode();

    for (var childIdx = 0; childIdx < elem.childNodes.length; childIdx++) {
      let child = elem.childNodes[childIdx];
      if (child.nodeType === Node.ELEMENT_NODE) {
        currentPath.push(childIdx);
        let ret = this.transform_(child, currentPath, currentTransformationIdx, transforms);
        currentTransformationIdx = ret[0];
        elem_.appendChild(ret[1]);
        currentPath.pop();
      } else if (child.nodeType === Node.COMMENT_NODE) {
        elem_.appendChild(child.cloneNode());
      } else if (child.nodeType === Node.TEXT_NODE) {
        elem_.appendChild(child.cloneNode());
      }
    }
    return [currentTransformationIdx, elem_];
  }

  /**
   * @dom is element to transform
   * @transforms is a sorted list of non-overlapping ranges with a span to surround said range with: [range, surround]
   */
  transform(dom, transforms) {
    // If there are no transforms, well, return yourself.
    if (transforms.length === 0) {
      return dom;
    }
    // If there are transforms, 
    let ret = this.transform_(dom, [], 0, transforms);
    console.assert(ret[0] === transforms.length); // Make sure that we processed the entire list.
    return ret[1];
  }
}

export default DOMTransformer;
