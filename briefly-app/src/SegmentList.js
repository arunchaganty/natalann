/**
 * Defines a segment data structure.
 */
import update from 'immutability-helper';

// Each segment is simply a tuple of (start position), (end position)
class SegmentList {
}

SegmentList.isValidSegment = function(sel) {
  return sel[0] < sel[1];
}

SegmentList.merge = function(a, b) {
  let ret = [];
  let ai = 0;
  let bi = 0;
  while (ai < a.length && bi < b.length) {
    if (a[ai] < b[bi]) {
      ret.push(a[ai++]);
    } else {
      ret.push(b[bi++]);
    }
  }
  while (ai < a.length) {
    ret.push(a[ai++]);
  }
  while (bi < b.length) {
    ret.push(b[bi++]);
  }

  return ret;
};

SegmentList.insert = function(lst, sel) {
  console.assert(SegmentList.isValidSegment(sel));

  if (lst.length === 0) {
    return [sel];
  }

  // We now are dealing with non-empty lists.
  // Iterate through the list to find the segment we're at.
  for (let i = 0; i < lst.length; i++) {
    const sel_ = lst[i];
    if (sel[1] < sel_[0]) { // Aha, this is right before sel_.
      return update(lst, {$splice: [[i, 0, sel]]});
    } else if (sel[0] < sel_[1]) { // Hrm... this intersects with sel_, we need to split it up.
      let newSel = [Math.min(sel[0], sel_[0]), Math.max(sel[1], sel_[1])]
      return update(lst, {$splice: [[i, 1, newSel]]});
    }
  }
  return update(lst, {$push: [sel]});
};

SegmentList.remove = function(lst, sel) {
  console.assert(SegmentList.isValidSegment(sel));

  if (lst.length === 0) {
    return [];
  }

  // We now are dealing with non-empty lists.
  // Iterate through the list to find the segment we're at.
  for (let i = 0; i < lst.length;) {
    const sel_ = lst[i];
    if (sel[0] > sel_[1]) { i++; continue;} // this segment is before our removal segment
    else if (sel[1] <= sel_[0]) break; // ok, the removal segment is outside our range, we can stop.

    // At this point there is definitely some overlap.

    // If removal is before this, just forward the segment.
    let splice = [i, 1];
    if (sel[0] > sel_[0]) {
      splice.push([sel_[0], sel[0]]);
      i++;
    }
    if (sel[1] < sel_[1]) {
      splice.push([sel[1], sel_[1]]);
      i++;
    } 
    lst = update(lst, {$splice: [splice]});
    
    if (sel_[1] < sel[1]) {
      sel = [sel[1], sel_[1]];
    } else {
      break;
    }
  }
  return lst;
};

export default SegmentList;
