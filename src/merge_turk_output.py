#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Read a file from input and merge it in output.
"""

import pdb
import heapq
import logging
import os
import csv
import sys
import json
import html
from collections import defaultdict

logger = logging.getLogger(__name__)

def read(istream):
    reader = csv.reader(istream, delimiter=',')
    header = next(reader)
    assert len(header) > 0, "Invalid header"
    #Row = namedtuple('Row', header)
    #return (Row(*row) for row in reader)
    return (dict(zip(header, row)) for row in reader)

MAX_WEIGHT = 0.8
CURRENT_VERSION = 2

def int_(x):
    try:
        return int(x)
    except:
        return None

def port(version, row):
    """
    Port older version of task output
    """
    if version == 1:
        selections = json.loads(html.unescape(row["Answer.selections"]))
        selections = [[[begin, end, 0.5] for begin, end in section] for section in selections]
        row["Answer.selections"] = html.escape(json.dumps(selections))
    elif version == 2:
        pass
    else:
        raise ValueError("Unknown version: {}".format(version))

    return row

def merge_(spans):
    max_count = len(spans)
    intervals = []

    for spans_ in spans:
        for start, end, _ in spans_:
            if start >= end:
                logger.warning("Ignoring invalid input: %d %d", start, end)
                continue

            heapq.heappush(intervals, (start, 1))
            heapq.heappush(intervals, (end, -1))
    if len(intervals) == 0:
        return []

    ret = []
    pos, delta = heapq.heappop(intervals)
    assert delta == 1
    count = delta

    while len(intervals) > 0:
        pos_, delta_ = heapq.heappop(intervals)
        if pos < pos_:
            ret.append([pos, pos_, count * MAX_WEIGHT / max_count])
            # otherwise they are equal
        count += delta_
        assert count >= 0
        pos = pos_
    assert count == 0

    return ret

def test_merge_():
    spans = [
        [],
        [(1, 10, 0.5)],
        [(2,7, 0.5), (9, 11, 0.5)],
        ]
    gold = [
        [1, 2, 0.8*1/3],
        [2, 7, 0.8*2/3],
        [7, 9, 0.8*1/3],
        [9, 10, 0.8*2/3],
        [10, 11, 0.8*1/3],
        ]

    ret = merge_(spans)
    assert ret == gold

def merge(outputs):
    return [merge_(section) for section in zip(*outputs)]

def do_merge_attention(args):
    docs = {}
    data = defaultdict(list)

    for row in read(args.input):
        row = port(args.version, row)

        doc_raw = html.unescape(row["Input.document"])
        doc = json.loads(doc_raw)

        doc_id = doc["id"]

        selections_raw = html.unescape(row["Answer.selections"])
        selections = json.loads(selections_raw)

        if doc_id in docs:
            assert docs[doc_id] == doc
        else:
            docs[doc_id] = doc
        data[doc_id].append(selections)

    for i, doc_id in enumerate(sorted(data)):
        doc = docs[doc_id]
        outputs = data[doc_id]
        doc["viewSelections"] = [["Merged annotations", merge(outputs)]] +\
                [["Annotation {}".format(j+1), output] for j, output in enumerate(outputs)]

        if not os.path.exists(args.output):
            os.mkdir(args.output)
        with open(os.path.join(args.output, "{}.json".format(i)), "w") as f:
            json.dump(doc, f)

def avg(lst):
    ret, i = 0., 0.
    for elem in lst:
        if elem is not None:
            ret += (elem - ret)/(i+1)
            i += 1
    return ret

def do_merge_editing(args):
    docs = {}
    data = defaultdict(list)

    for row in read(args.input):
        doc_raw = html.unescape(row["Input.document"])
        doc = json.loads(doc_raw)

        doc_id = doc["id"]

        response = {
            "text": row["Answer.text"],
            "actualTime": int(row["Answer.actualTime"]),
            "feedback-clarity": int_(row["Answer.feedback-clarity"]),
            "feedback-fun": int_(row["Answer.feedback-fun"]),
            "feedback-pay": int_(row["Answer.feedback-pay"]),
            "feedback-comments": row["Answer.feedback-comments"],
            }

        if doc_id in docs:
            assert docs[doc_id] == doc
        else:
            docs[doc_id] = doc
        data[doc_id].append(response)

    for i, doc_id in enumerate(sorted(data)):
        doc = docs[doc_id]
        responses = data[doc_id]

        paragraphs = [doc["text"],] + [r["text"] for r in responses]
        selections = [[] for _ in paragraphs] + [[]]
        comments = list({r["feedback-comments"] for r in responses})

        ret = {
            "id": doc_id,
            "display": {
                "title": "",
                "paragraphs": paragraphs,
                "selections": selections,
                },
            "comments": comments,
            "time": avg([r["actualTime"] for r in responses]),
            }
        if not os.path.exists(args.output):
            os.mkdir(args.output)
        with open(os.path.join(args.output, "{}.json".format(i)), "w") as f:
            json.dump(ret, f)

    clarity = [r["feedback-clarity"] for r in responses]
    fun = [r["feedback-fun"] for r in responses]
    pricing = [r["feedback-pay"] for r in responses]
    print("avg. clarity: {:.2f}".format(avg(clarity)))
    print("avg. fun: {:.2f}".format(avg(fun)))
    print("avg. pay: {:.2f}".format(avg(pricing)))


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='')
    parser.set_defaults(func=None)

    subparsers = parser.add_subparsers()
    command_parser = subparsers.add_parser('attention', help='Prepare a attention task after turking' )
    command_parser.add_argument('-i', '--input', type=argparse.FileType('r'), default=sys.stdin, help="CSV file containing judgements.")
    command_parser.add_argument('-o', '--output', type=str, default="../data/pilot-out/", help="Where to write output files")
    command_parser.add_argument('-v', '--version', type=int, default=2, help="Version of file")
    command_parser.set_defaults(func=do_merge_attention)

    command_parser = subparsers.add_parser('editing', help='Prepare a editing task after turking' )
    command_parser.add_argument('-i', '--input', type=argparse.FileType('r'), default=sys.stdin, help="CSV file containing judgements.")
    command_parser.add_argument('-o', '--output', type=str, default="../data/edit-pilot-out/", help="Where to write output files")
    command_parser.add_argument('-v', '--version', type=int, default=1, help="Version of file")
    command_parser.set_defaults(func=do_merge_editing)

    logging.basicConfig(level=logging.DEBUG)

    ARGS = parser.parse_args()
    if ARGS.func is None:
        parser.print_help()
        sys.exit(1)
    else:
        ARGS.func(ARGS)
