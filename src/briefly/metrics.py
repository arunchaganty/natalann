"""
Computing metrics.
"""
import re
from typing import List, Tuple, Dict

import numpy as np

Alignment = List[Tuple[int]]

def transform_drop(x:str) -> str:
    """
    Transforms x to drop spaces and punctuation.
    """
    return re.sub(r"[ ;,.?'\";:`]", "", x)

def character_edit_distance(x:str, y:str) -> float:
    """
    Computes the character edit distance between strings x and y.
    Assumes cost of insert/delete/substitue are all 1.
    """
    M, N = len(x), len(y)


    cost = np.zeros((M,N))

    for i in range(M):
        cost[i,0] = i
    for j in range(N):
        cost[0,j] = j

    for i in range(1,M):
        for j in range(1,N):
            cost[i,j] = min(cost[i-1, j-1] + (0 if x[i] == y[j] else 1), cost[i,j-1]+1, cost[i-1,j]+1)
    return cost[-1,-1]

def test_character_edit_distance():
    assert character_edit_distance("test", "test") == 0
    assert character_edit_distance("test", "tent") == 1
    assert character_edit_distance("spoon", "poodle") == 4

def token_edit_distance(x:List[str], y:List[str], align:Alignment) -> float:
    stats = alignment_stats(x, y, align)
    return stats["inserts"] + stats["deletes"] + stats["deduplication"] + stats["reorders"] + stats["rephrasings"]

def parse_alignment(x:str, y:str, align:str) -> [List[str], List[str], Alignment]:
    return x.split(), y.split(), [tuple(map(int, a.split("-"))) for a in align.split()]

def alignment_stats(x:List[str], y:List[str], align:Alignment) -> Dict:
    """
    Report stats on the alignments:
    how many copies?
    how many duplicates?
    how many drops?
    how many reorders?
    """
    ret = {
        "inserts": 0.,
        "copies": 0.,
        "deletes": 0.,
        "deduplication": 0.,
        "reorders": 0.,
        "rephrasings": 0.,
        }

    seen = set()
    i_ = j_ = -1
    for i, j in align:
        if x[i] == y[j]:
            ret["copies"] += 1
        else:
            ret["rephrasings"] += 1
        ret["deletes"] += (i - i_ -1)
        if j in seen:
            ret["deduplication"] += 1
        else:
            ret["reorders"] += 1 if j_ > j else 0

        seen.add(j)
        i_, j_ = i, j
    ret["deletes"] += len(x) - i_ - 1
    ret["inserts"] += len(y) - len(seen)

    return ret
