#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Render a graph of edit scores versus sentences.
"""

import sys
import json
from collections import defaultdict 

import numpy as np
import matplotlib.pyplot as plt
from matplotlib import rc
from matplotlib import patches as mpatches

MARKERS = {
    "reference": "*",
    "pointer": "^",
    "seq2seq": "s",
    }

COLORS = {
    "reference": "r",
    "pointer": "g",
    "seq2seq": "b",
    "char": "b",
    "token": "r",
    }

def parse_data(data):
    ret = defaultdict(list)
    for x in data:
        ret[x["prompt"],x["system"]].append([x["char_norm"], x["token_norm"]])
    return {k: np.array(v) for k, v in ret.items()}

def draw_plot(ax, data, offset, edge_color, fill_color, marker):
    pos = np.arange(len(data)) + offset
    bp = ax.boxplot(data, positions=pos, widths=0.2, patch_artist=True, manage_xticks=False, showfliers=False)
    for element in ['boxes', 'whiskers', 'medians', 'caps']:
        plt.setp(bp[element], color=edge_color, alpha=0.6)
    #for element in ['fliers',]:
    #    plt.setp(bp[element], color=edge_color, alpha=0.6, marker=marker)
    for patch in bp['boxes']:
        patch.set(facecolor=fill_color)

def do_command(args):
    raw_data = json.load(args.input)

    prompts = sorted({x["prompt"] for x in raw_data})
    data = parse_data(raw_data)

    fig = plt.figure()
    for i, score in enumerate(["char", "token"]):
        if i == 0:
            ax = fig.add_subplot(1,2,i+1)
        else:
            ax = fig.add_subplot(1,2,i+1, sharey=ax)

        for j, system in enumerate(["reference", "pointer", "seq2seq"]):
            data_ = [data[prompt, system].T[i] if (prompt, system) in data else [] for prompt in prompts]
            draw_plot(ax, data_, -0.3 + 0.3*j, COLORS[system], COLORS[system], MARKERS[system])
        #fig.legend()
        ax.set_title(score)
        ax.set_xticks(np.arange(len(prompts)))

    fig.legend(handles=[mpatches.Patch(color=COLORS[system], label=system) for system in ["reference", "pointer", "seq2seq"]], labels=["reference", "pointer", "seq2seq"])
    fig.tight_layout()
    fig.savefig(args.output)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser( description='' )
    parser.add_argument('-i', '--input', type=argparse.FileType('r'), default='alignment_data.json', help="File to plot.")
    parser.add_argument('-o', '--output', type=str, default='edit_score_norm.png', help="Name of file to output to")
    parser.set_defaults(func=do_command)

    #subparsers = parser.add_subparsers()
    #command_parser = subparsers.add_parser('command', help='' )
    #command_parser.set_defaults(func=do_command)

    ARGS = parser.parse_args()
    ARGS.func(ARGS)
