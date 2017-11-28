#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generates fake data.
"""
import sys
import json

from briefly.data import parse_text, to_text
from briefly.data import perturb_grammar, perturb_redundancy, perturb_clarity, perturb_focus, perturb_coherence
from corenlp import CoreNLPClient

PERFECT = {
    "grammar": 5,
    "redundancy": 5,
    "clarity": 5,
    "focus": 5,
    "coherence": 5,
    }

def do_command(args):
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

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='')
    parser.add_argument('-i', '--input', type=argparse.FileType('r'), default=sys.stdin, help="A jsonl file with input.")
    parser.add_argument('-o', '--output', type=argparse.FileType('w'), default=sys.stdout, help="A jsonl file with output.")
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
