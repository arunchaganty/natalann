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
from corenlp import CoreNLPClient

from briefly.data import load_jsonl, save_jsonl
from briefly.data import parse_text, to_text
from briefly.data import perturb_grammar, perturb_redundancy, perturb_clarity, perturb_focus, perturb_coherence



def do_make_controls(args):
    PERFECT = {
        "grammar": 5,
        "redundancy": 5,
        "clarity": 5,
        "focus": 5,
        "coherence": 5,
        }

    with CoreNLPClient(annotators="tokenize ssplit ner".split()) as client:
        prev_txts = []
        for line in args.input:
            obj = json.loads(line)
            if obj["system"] != "reference": continue

            ann = client.annotate(obj["text"])
            txt = parse_text(ann)

            obj["control"] = True
            perturbation = hash(obj["text"]) % 6
            if perturbation > 0:
                if perturbation == 1:
                    obj["text"] = to_text(perturb_grammar(txt))
                    obj["expected"] = {"grammar": 0}
                elif perturbation == 2:
                    if len(txt) < 2:
                        obj["expected"] = PERFECT
                    else:
                        obj["text"] = to_text(perturb_redundancy(txt))
                        obj["expected"] = {"grammar": 5, "redundancy": 1, "clarity": 5}
                elif perturbation == 3:
                    obj["text"] = to_text(perturb_clarity(txt))
                    obj["expected"] = {"clarity": 0}
                elif perturbation == 4:
                    if not prev_txts:
                        obj["expected"] = PERFECT
                    else:
                        obj["text"] = to_text(perturb_focus(txt, prev_txts))
                        obj["expected"] = {"grammar": 5, "redundancy": 5, "focus": 0, "coherence": 0}
                elif perturbation == 5:
                    obj["text"] = to_text(perturb_coherence(txt))
                    obj["expected"] = {"grammar": 5, "redundancy": 5, "focus": 5, "coherence": 3}
            else:
                obj["expected"] = PERFECT
            if len(prev_txts) > 2:
                prev_txts.pop(0)
            prev_txts.append(txt)

            args.output.write(json.dumps(obj))
            args.output.write("\n")


ESTIMATED_TIME=60
REWARD=0.25 # ~$15/hr.

def make_batch(batch):
    return {
        "contents": batch,
        "estimatedTime": ESTIMATED_TIME * len(batch),
        "reward": REWARD * len(batch),
        }

def do_make_task(args):
    assert args.with_ref

    data = defaultdict(dict)
    systems = set()
    for datum in tqdm(load_jsonl(args.input)):
        systems.add(datum["system"])
        data[datum["id"]][datum["system"]] = datum
    for datum in tqdm(load_jsonl(args.control)):
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
    parser.set_defaults(func=None)

    subparsers = parser.add_subparsers()
    command_parser = subparsers.add_parser('task', help='Generate output for the task.')
    command_parser.add_argument('-i', '--input', type=argparse.FileType('r'), default=sys.stdin, help="Unevaluated summaries as data")
    command_parser.add_argument('-c', '--control', type=argparse.FileType('r'), default=sys.stdin, help="Summaries to be used as control tests.")
    command_parser.add_argument('-o', '--output', type=argparse.FileType('w'), default=sys.stdout, help="Output data.")
    command_parser.add_argument('-wr', '--with-ref', action="store_true", default=False, help="Includes a reference.")
    command_parser.add_argument('-nb', '--n-batches', type=int, default=10, help="How many batches per system to use.")
    command_parser.add_argument('-nt', '--n-tasks', type=int, default=10, help="How many tasks per batch to use.")
    command_parser.add_argument('-nc', '--n-controls', type=int, default=2, help="How many controls per batch to use.")
    command_parser.set_defaults(func=do_make_task)

    command_parser = subparsers.add_parser('controls', help='Generate controsl for the task.')
    command_parser.add_argument('-i', '--input', type=argparse.FileType('r'), default=sys.stdin, help="Unevaluated summaries as data")
    command_parser.add_argument('-o', '--output', type=argparse.FileType('w'), default=sys.stdout, help="Output data.")
    command_parser.set_defaults(func=do_make_controls)

    ARGS = parser.parse_args()
    if ARGS.func is None:
        parser.print_help()
        sys.exit(1)
    else:
        ARGS.func(ARGS)
