#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prepare data for batches.
"""

import sys
import json
import math
import random
from collections import namedtuple, defaultdict

from tqdm import tqdm
from corenlp import CoreNLPClient

from briefly.data import load_jsonl, save_jsonl, read_csv
from briefly.data import parse_text, to_text
from briefly.data import perturb_grammar, perturb_redundancy, perturb_clarity, perturb_focus, perturb_coherence

def do_make_controls(args):
    #PERFECT = {
    #    "grammar": 4,
    #    "redundancy": 4,
    #    "clarity": 4,
    #    "focus": 4,
    #    "coherence": 4,
    #    }

    with CoreNLPClient(annotators="tokenize ssplit".split(), properties={"tokenize.whitespace": True}) as client:
        prev_txts = []
        for line in args.input:
            obj = json.loads(line)
            if obj["system"] != "reference": continue

            ann = client.annotate(obj["text"])
            txt = parse_text(ann)

            obj["control"] = True
            perturbation = hash(obj["text"]) % 3
            #if perturbation > 0:
            if perturbation == 0:
                obj["text"] = to_text(perturb_grammar(txt))
                obj["expected"] = {"grammar": 0}
            elif perturbation == 1:
                if len(txt) < 2:
                    continue
                    #obj["expected"] = PERFECT
                else:
                    obj["text"] = to_text(perturb_redundancy(txt))
                    obj["expected"] = {"grammar": 4, "redundancy": 1, "clarity": 4}
            #elif perturbation == 3:
            #    obj["text"] = to_text(perturb_clarity(txt))
            #    obj["expected"] = {"clarity": 0}
            elif perturbation == 2:
                if not prev_txts:
                    continue
                    #obj["expected"] = PERFECT
                else:
                    obj["text"] = to_text(perturb_focus(txt, prev_txts))
                    obj["expected"] = {"grammar": 4, "redundancy": 4, "focus": 0, "coherence": 0}
            #elif perturbation == 5:
            #    obj["text"] = to_text(perturb_coherence(txt))
            #    obj["expected"] = {"grammar": 5, "redundancy": 5, "focus": 5, "coherence": 3}
            #else:
            #    obj["expected"] = PERFECT
            if len(prev_txts) > 2:
                prev_txts.pop(0)
            prev_txts.append(txt)

            args.output.write(json.dumps(obj))
            args.output.write("\n")



ESTIMATED_TIME=45
REWARD=0.15 # ~$15/hr.

def make_batch(batch):
    return {
        "contents": batch,
        "estimatedTime": ESTIMATED_TIME * len(batch),
        "reward": REWARD * len(batch),
        }

def do_split_sentences(args):
    with CoreNLPClient(annotators="tokenize ssplit".split()) as client:
        for datum in tqdm(load_jsonl(args.input)):
            ann = client.annotate(datum["text"])
            txt = parse_text(ann)
            for i, sentence in enumerate(txt):
                datum_ = dict(datum)
                datum_['id'] = "{}.{}".format(datum['id'], i)
                datum_['text'] = to_text([sentence]).strip()
                save_jsonl(args.output, datum_)

def do_make_task(args):
    by_id = defaultdict(dict)
    by_system = defaultdict(list)
    systems = set()
    for datum in tqdm(load_jsonl(args.input)):
        systems.add(datum["system"])
        by_id[datum["id"]][datum["system"]] = datum
        by_system[datum["system"]].append(datum)
    n_systems = len(systems) - (1 if args.with_ref else 0)

    # pick instances
    tasks = []
    if args.balanced:
        n_ids = args.n_batches * (args.n_tasks - args.n_controls)

        keys = sorted(k for k, v in by_id.items() if all(s in v.keys() for s in systems))
        random.shuffle(keys)
        ids = keys[:n_ids]

        # Create tasks
        for id_ in ids:
            for system in by_id[id_]:
                if args.with_ref and system == "reference":
                    continue
                task = by_id[id_][system]
                task["reference"] = by_id[id_]["reference"]["text"]
                tasks.append(task)
    else:
        for vs in by_system.values():
            random.shuffle(vs)
            tasks.extend(vs[:args.n_batches * (args.n_tasks - args.n_controls)])
    assert len(tasks) == n_systems * args.n_batches * (args.n_tasks - args.n_controls)

    if args.control:
        control_tasks = [datum for datum in tqdm(load_jsonl(args.control))]
    else:
        control_tasks = []
    assert args.n_controls == 0 or len(control_tasks) > args.n_batches 

    # batch up tasks.
    random.shuffle(tasks)
    random.shuffle(control_tasks)
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

def do_acceptability(args):
    for i, row in enumerate(read_csv(args.input, delimiter="\t")):
        if row.MOP != "MOP4": continue

        mean_rating = float(row.mean_rating)
        system = "bin-{}".format(math.floor(mean_rating))
        save_jsonl(args.output, {
            "id": i,
            "system": system,
            "text": row.text,
            "ratings": [int(r) for r in row.rating_list.split(",")],
            "mean_rating": mean_rating,
            })

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='')
    parser.add_argument('-s', '--seed', type=int, default=42, help="random seed")
    parser.set_defaults(func=None)

    subparsers = parser.add_subparsers()
    command_parser = subparsers.add_parser('task', help='Generate output for the task.')
    command_parser.add_argument('-i', '--input', type=argparse.FileType('r'), default=sys.stdin, help="Unevaluated summaries as data")
    command_parser.add_argument('-c', '--control', type=argparse.FileType('r'), default=None, help="Summaries to be used as control tests.")
    command_parser.add_argument('-o', '--output', type=argparse.FileType('w'), default=sys.stdout, help="Output data.")
    command_parser.add_argument('-wr', '--with-ref', action="store_true", default=False, help="Includes a reference.")
    command_parser.add_argument('-nb', '--n-batches', type=int, default=10, help="How many batches per system to use.")
    command_parser.add_argument('-nt', '--n-tasks', type=int, default=10, help="How many tasks per batch to use.")
    command_parser.add_argument('-nc', '--n-controls', type=int, default=2, help="How many controls per batch to use.")
    command_parser.add_argument('-b', '--balanced', action="store_true", default=False, help="Balance the tasks to be used")
    command_parser.set_defaults(func=do_make_task)

    command_parser = subparsers.add_parser('controls', help='Generate controsl for the task.')
    command_parser.add_argument('-i', '--input', type=argparse.FileType('r'), default=sys.stdin, help="Unevaluated summaries as data")
    command_parser.add_argument('-o', '--output', type=argparse.FileType('w'), default=sys.stdout, help="Output data.")
    command_parser.set_defaults(func=do_make_controls)

    command_parser = subparsers.add_parser('split-sentences', help='Split sentences for each instance.')
    command_parser.add_argument('-i', '--input', type=argparse.FileType('r'), default=sys.stdin, help="Unevaluated summaries as data")
    command_parser.add_argument('-o', '--output', type=argparse.FileType('w'), default=sys.stdout, help="Output data.")
    command_parser.set_defaults(func=do_split_sentences)

    command_parser = subparsers.add_parser('acceptability', help='Construct tasks for acceptability')
    command_parser.add_argument('-i', '--input', type=argparse.FileType('r'), default=sys.stdin, help="Unevaluated summaries as data")
    command_parser.add_argument('-o', '--output', type=argparse.FileType('w'), default=sys.stdout, help="Output data.")
    command_parser.set_defaults(func=do_acceptability)

    ARGS = parser.parse_args()
    if ARGS.func is None:
        parser.print_help()
        sys.exit(1)
    else:
        ARGS.func(ARGS)
