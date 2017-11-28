#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prepare data for batches.
"""

import sys
import json
import random
from collections import namedtuple, defaultdict

from tqdm import tqdm
from briefly.data import load_jsonl, save_jsonl

ESTIMATED_TIME=60
REWARD=0.25 # ~$15/hr.

def make_batch(batch):
    return {
        "contents": batch,
        "estimatedTime": ESTIMATED_TIME * len(batch),
        "reward": REWARD * len(batch),
        }

def do_command(args):
    assert args.with_ref

    data = defaultdict(dict)
    systems = set()
    for datum in tqdm(load_jsonl(args.input)):
        systems.add(datum["system"])
        data[datum["id"]][datum["system"]] = datum
    for datum in tqdm(load_jsonl(args.input_tests)):
        data[datum["id"]]["control"] = datum

    # pick instances
    n_ids = args.n_batches * (args.n_tasks - args.n_controls)
    n_systems = len(systems) - (1 if args.with_ref else 0)
    keys = sorted(data.keys())
    random.shuffle(keys)

    ids = keys[:n_ids]

    # Create tasks
    tasks = []
    control_tasks = []
    for id_ in ids:
        for system in data[id_]:
            if args.with_ref and system == "reference":
                continue
            task = data[id_][system]
            if args.with_ref:
                task["reference"] = data[id_]["reference"]["text"]

            if system != "control":
                tasks.append(task)
            else:
                control_tasks.append(task)

    random.shuffle(tasks)
    random.shuffle(control_tasks)

    # batch up tasks.
    batches = []
    for _ in range(args.n_batches * n_systems):
        batch = []
        for _ in range(args.n_tasks - args.n_controls):
            batch.append(tasks.pop())
        for _ in range(args.n_controls):
            batch.append(control_tasks.pop())
        random.shuffle(batch)
        batches.append(batch)

    assert not tasks

    for batch in batches:
        save_jsonl(args.output, make_batch(batch))

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='')
    parser.add_argument('-s', '--seed', type=int, default=42, help="random seed")
    parser.add_argument('-i', '--input', type=argparse.FileType('r'), default=sys.stdin, help="Unevaluated summaries as data")
    parser.add_argument('-t', '--input-tests', type=argparse.FileType('r'), default=sys.stdin, help="Summaries to be used as control tests.")
    parser.add_argument('-o', '--output', type=argparse.FileType('w'), default=sys.stdout, help="Output data.")
    parser.add_argument('-wr', '--with-ref', action="store_true", default=False, help="Includes a reference.")
    parser.add_argument('-nb', '--n-batches', type=int, default=10, help="How many batches per system to use.")
    parser.add_argument('-nt', '--n-tasks', type=int, default=10, help="How many tasks per batch to use.")
    parser.add_argument('-nc', '--n-controls', type=int, default=2, help="How many controls per batch to use.")
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
