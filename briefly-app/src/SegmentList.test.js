import SegmentList from './SegmentList';

it('returns isValid', () => {
  expect(SegmentList.isValidSegment([1, 2]), true);
  expect(SegmentList.isValidSegment([3, 2]), false);
  expect(SegmentList.isValidSegment([2, 2]), false);
});

it('returns insertedList', () => {
  const lst = [[1,10], [14, 17]];
  expect(SegmentList.insert(lst, [3, 7]), lst);
  expect(SegmentList.insert(lst, [11, 12]), [[1,10], [11,12], [14,17]]);
  expect(SegmentList.insert(lst, [7, 12]), [[1,12], [14,17]]);
  expect(SegmentList.insert(lst, [20, 22]),  [[1,10], [14,17], [20, 22]]);
});

it('returns removedList', () => {
  const lst = [[1,10], [14, 17]];
  expect(SegmentList.remove([], [3,7]), []);
  expect(SegmentList.remove(lst, [1,10]), [[14, 17]]);
  expect(SegmentList.remove(lst, [1,7]), [[7,10], [14, 17]]);
  expect(SegmentList.remove(lst, [3,7]), [[1,3], [7,10], [14, 17]]);
  expect(SegmentList.remove(lst, [1,12]), [[14, 17]]);
  expect(SegmentList.remove(lst, [7,16]), [[1,7], [16,17]]);
});

it('returns jaccard', () => {
  const lst = [[1,10], [14, 17]];
  const lst_ = [[2,7], [9, 12]];
  expect(SegmentList.jaccard([], []), 1);
  expect(SegmentList.jaccard([], lst), 0);
  expect(SegmentList.jaccard(lst, []), 0);
  expect(SegmentList.jaccard(lst, lst), 1);
  expect(SegmentList.jaccard(lst, lst_), (5+1)/(9 + 3 + 2));
});
