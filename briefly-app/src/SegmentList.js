/**
 * Defines a segment data structure.
 */
import update from 'immutability-helper';


function length(seg) {
  return seg[1] - seg[0];
}

function compare(seg, seg_) {
  if (seg[0] < seg_[0]) return -1;
  else if (seg[0] > seg_[0]) return 1;
  else if (seg[1] < seg_[1]) return -1;
  else if (seg[1] > seg_[1]) return 1;
  else return 0;
}

function overlaps(seg, seg_) {
  return !(seg[1] < seg_[0] || seg[0] > seg_[1]);
}

function intersection(seg, seg_) {
  if (overlaps(seg,seg_))
    return [Math.max(seg[0], seg_[0]), Math.min(seg[1], seg_[1])];
  else
    return [];
}

// Each segment is simply a tuple of (start position), (end position)
class SegmentList {
  static isValidSegment = function(sel) {
    return sel[0] < sel[1];
  }

  static isValid = function(lst) {
    for(let ix = 0; ix < lst.length; ix++) {
      // Ensure well formed and non-empty.
      if (lst[ix][0] >= lst[ix][1]) return false;
      // Ensure it is well ordered.
      if (ix > 0 && lst[ix][0] < lst[ix-1][1]) return false;
    }
    return true;
  }

  static merge = function(a, b) {
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


    console.assert(SegmentList.isValid(ret));
    return ret;
  };

  static insert = function(lst, sel) {
    console.assert(SegmentList.isValidSegment(sel));

    if (lst.length === 0) {
      return [sel];
    }

    // We now are dealing with non-empty lists.
    // Iterate through the list to find the segment we're at.
    let ret; let i;
    for (i = 0; i < lst.length; i++) {
      const sel_ = lst[i];
      if (sel[1] < sel_[0]) { // Aha, this is right before sel_.
        ret = update(lst, {$splice: [[i, 0, sel]]});
        break;
      } else if (sel[0] < sel_[1]) { // Hrm... this intersects with sel_, we need to merge with it and move on.
        sel = [Math.min(sel[0], sel_[0]), Math.max(sel[1], sel_[1])]
        // Remove the old element.
        lst = update(lst, {$splice: [[i--, 1]]});
      } // else sel[0] >= sel_[1] -- so we'll just move on to the next element in lst.
    }
    if (i === lst.length)
      ret = update(lst, {$push: [sel]});

    console.assert(SegmentList.isValid(ret));
    return ret;
  };

  static remove = function(lst, sel) {
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

    console.assert(SegmentList.isValid(lst));
    return lst;
  };

  static equals = function(lst, lst_) {
    if (lst.length !== lst_.length) return false;
    for (let i=0; i < lst.length; i++) {
      let x = lst[i], y = lst_[i];
      if (x[0] !== y[0] || x[1] !== y[1]) return false;
    }
    return true;
  }

  static contains = function(bigger, smaller) {
    for(let small of smaller) {
      // smaller has to be contained in some bigger
      if (!bigger.some(big => big[0] <= small[0] && big[1] >= small[1])) return false;
    }
    return true;
  }

  static jaccard = function(lst, lst_) {
    const END = [Infinity, Infinity];

    // measure intersection / union
    let union = 0, intersection = 0;

    let ix = 0, ix_ = 0;
    let seg = (ix < lst.length) ? lst[ix++].slice() : END;
    let seg_ = (ix_ < lst_.length) ? lst_[ix_++].slice() : END;

    let iter = 0;
    while (!(seg === END && seg_ === END) && iter++ < 10) {
      // next 
      if (seg[0] === seg_[0]) {
        let pivot = Math.min(seg[1], seg_[1]);
        intersection += pivot - seg[0];
        union += pivot - seg[0];
        seg[0] = seg_[0] = pivot;
      } else {
        let pivot = seg_[0] < seg[0] ? Math.min(seg[0], seg[1], seg_[1]) : Math.min(seg_[0], seg[1], seg_[1]);
        union += pivot - Math.min(seg[0], seg_[0]);
        seg[0] = Math.max(seg[0], pivot);
        seg_[0] = Math.max(seg_[0], pivot);
      }

      // length is NaN for END.
      if (length(seg) === 0) {
        seg = (ix < lst.length) ? lst[ix++].slice() : END;
      }
      if (length(seg_) === 0) {
        seg_ = (ix_ < lst_.length) ? lst_[ix_++].slice() : END;
      }
    }

    let ret = union > 0 ? intersection/union : 1;
    return ret;
  }

  static selectText(text, segments) {
    let ret = "";
    for (let i = 0; i < segments.length; i++) {
      let [start, end] = segments[i];
      ret += text.substring(start, end);
      if (i < segments.length - 1)
        ret += "; ";
    }

    return ret;
  }
}



export default SegmentList;
