#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
"""

import os
import sys
import csv
import json
import html

def do_command(args):
    assert os.path.exists(args.input)

    writer = csv.writer(args.output)
    writer.writerow(["document"])

    for i, fname in enumerate(os.listdir(args.input)):
        if not fname.endswith('.json'): continue
        with open(os.path.join(args.input, fname)) as f:
            doc = json.load(f)
            for j, (prompt, time_range) in enumerate(doc["prompts"]):
                doc["id"] = "doc-{}-{}".format(i,j)
                doc["prompt"] = prompt
                doc["recommendedMinWordCount"] = time_range[0]
                doc["recommendedMaxWordCount"] = time_range[1]
                writer.writerow([html.escape(json.dumps(doc))])

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='')
    parser.add_argument('-i', '--input', type=str, default='../data/pilot', help="Directory with JSON files")
    parser.add_argument('-o', '--output', type=argparse.FileType('w'), default=sys.stdout, help="A CSV to use with MTurk")
    parser.set_defaults(func=do_command)

    #subparsers = parser.add_subparsers()
    #command_parser = subparsers.add_parser('command', help='' )
    #command_parser.set_defaults(func=do_command)

    ARGS = parser.parse_args()
    if ARGS.func is None:
        parser.print_help()
        sys.exit(1)
    else:
        ARGS.func(ARGS)
