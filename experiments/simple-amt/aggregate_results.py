#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Aggregates the results for a HIT and orders them according to output. Each line will be a list of the outputs.
"""

import argparse, json

import simpleamt
import sys
import os

if __name__ == '__main__':
    parser = argparse.ArgumentParser(parents=[simpleamt.get_parent_parser()])
    parser.add_argument('-i', '--responses_file', type=argparse.FileType('r'), default=sys.stdin, help="Path to file with raw turk results")
    parser.add_argument('-o', '--output_file', type=argparse.FileType('w'), default=sys.stdout, help="Path to save aggregated turk results")
    args = parser.parse_args()

    # Creates a map from hit ids to responses.
    hit_ids = [line.strip() for line in open(args.hit_ids_file)]
    output = [[] for _ in hit_ids]

    for line in args.responses_file:
        obj = json.loads(line)
        hit_id = obj["hit_id"]
        idx = hit_ids.index(hit_id)
        output[idx].append(obj)

    for lst in output:
        args.output_file.write(json.dumps(lst))
        args.output_file.write("\n")
