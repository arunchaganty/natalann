#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Read a file from input and merge it in output.
"""

import pdb
import os
import csv
import sys
import json
import html
from collections import defaultdict

def read(istream):
    reader = csv.reader(istream, delimiter=',')
    header = next(reader)
    assert len(header) > 0, "Invalid header"
    #Row = namedtuple('Row', header)
    #return (Row(*row) for row in reader)
    return (dict(zip(header, row)) for row in reader)

MAX_WEIGHT = 0.8

def merge_(spans):
    max_count = len(spans)
    spans = sorted(sum(spans, []))
    if len(spans) == 0:
        return []

    ret = []
    start, end = spans.pop(0)
    count = 1
    #pdb.set_trace()
    while len(spans) > 0:
        start_, end_ = spans.pop(0)
        if end <= start_: # Finish before x does.
            ret.append([start, end, count * MAX_WEIGHT / max_count])
            count -= 1
            start, end = start_, end_
        else: # There is some overlap.
            # Break the current spans into [start, start_], [start_, min(end, end_)], [min(end, end_), max(end, end_)]
            ret.append([start, start_, count * MAX_WEIGHT / max_count])
            spans = sorted(spans + [[min(end, end_), max(end, end_)]])
            count += 1
            start, end = start_, min(end, end_)

    ret.append([start, end, count * MAX_WEIGHT / max_count])

    return ret

def test_merge_():
    spans = [
        [],
        [(1,10)],
        [(2,7), (9, 11)],
        ]
    gold = [
        (1, 2, 0.8*1/3),
        (2, 7, 0.8*2/3),
        (7, 9, 0.8*1/3),
        (9, 10, 0.8*2/3),
        (10, 11, 0.8*1/3),
        ]

    ret = merge_(spans)
    assert ret == gold

def merge(outputs):
    return [merge_(section) for section in zip(*outputs)]

def do_command(args):
    data = defaultdict(list)

    for row in read(args.input):
        doc_raw = html.unescape(row["Input.document"])
        selections_raw = html.unescape(row["Answer.selections"])
        selections = json.loads(selections_raw)

        data[doc_raw].append(selections)

    for i, (doc_raw, outputs) in enumerate(data.items()):
        doc = json.loads(doc_raw)
        doc["viewSelections"] = [["Merged annotations", merge(outputs)]] +\
                [["Annotation {}".format(j+1), [[start, end] for start, end in output]] for j, output in enumerate(outputs)]

        with open(os.path.join(args.output, "{}.json".format(i)), "w") as f:
            json.dump(doc, f)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='')
    parser.add_argument('-i', '--input', type=argparse.FileType('r'), default=sys.stdin, help="CSV file containing judgements.")
    parser.add_argument('-o', '--output', type=str, default="../data/pilot-out/", help="Where to write output files")
    parser.set_defaults(func=do_command)

    ARGS = parser.parse_args()
    if ARGS.func is None:
        parser.print_help()
        sys.exit(1)
    else:
        ARGS.func(ARGS)
