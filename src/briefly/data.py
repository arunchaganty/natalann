"""
Utilities to perturb data
"""
import re
import csv
import json
import pdb
from collections import namedtuple

Token = namedtuple("Token", ["word", "ner", "after"])

def load_jsonl(f):
    for line in f:
        yield json.loads(line)

def save_jsonl(f, obj):
    f.write(json.dumps(obj))
    f.write("\n")

def read_csv(f, *args, **kwargs):
    reader = csv.reader(f, *args, **kwargs)
    header = next(reader)
    assert len(header) > 0

    Row = namedtuple("Row", header)
    return (Row(*row) for row in reader)

# input is annotation object.
def parse_text(ann):
    return [[Token(t.word, t.ner, t.after) for t in s.token] for s in ann.sentence]

def to_text(doc):
    ret = ""
    for s in doc:
        for t in s:
            ret += t.word + t.after
    return ret

def chunk_tokens(sentence):
    ret = []
    tag, stack = None, []
    for t in sentence:
        if t.ner != tag:
            if stack:
                ret.append((stack,tag))
                stack = []
            tag = t.ner
        stack.append(t.word)
    if stack:
        ret.append((stack, tag))
    return ret

# assumes that references are 5s.
def perturb_grammar(doc):
    """
    Scramble words in each sentence.
    """
    return [sorted(sentence, key=lambda t: hash(t.word + t.ner)) for sentence in doc]

def perturb_redundancy(doc):
    """
    repeat the first sentence many times.
    """
    assert len(doc) > 1
    return [doc[0], doc[1], doc[1]]

def perturb_clarity(ann):
    """
    replace every named entity with generic pronoun.
    """
    ret = []
    for sentence in ann:
        sentence_ = []
        for i, (chunk, tag) in enumerate(chunk_tokens(sentence)):
            if tag == 'PERSON':
                chunk_ = ['she']
            elif tag == 'ORGANIZATION':
                chunk_ = ['the', 'organization']
            elif tag == 'LOCATION':
                chunk_ = ['the', 'place']
            else:
                chunk_ = chunk
            if i == 0:
                chunk_[0] = chunk_[0].title()
            sentence_.extend([Token(w, tag) for w in chunk_])
        ret.append(sentence_)
    return ret

def test_perturb_clarity():
    words = "Peter Alliss says anti-discrimination laws have caused membership fall at Yelp .".split()
    ner   = "PERSON PERSON O O O O O O O O ORGANIZATION O".split()
    ann = [[Token(w, n) for w, n in zip(words,ner)]]
    txt_ = to_text(perturb_clarity(ann))
    assert txt_ == "She says anti-discrimination laws have caused membership fall at the organization ."

def perturb_focus(txt, txts_):
    """
    join sentences from two different summaries.
    """
    return [txt[0],] + [txt_[0] for txt_ in txts_]

def test_perturb_focus():
    txt = ["a1","a2"]
    txts_ = [["b1","b2", "b3"],
             ["c1",]]

    ret = perturb_focus(txt, txts_)
    assert ret == ["a1", "b1", "c1",]

def perturb_coherence(txt):
    """
    shuffle sentences around.
    """
    return sorted(txt, key=lambda s: sum(hash(t) for t in s))

def fix_unks(txt):
    return re.sub(r"\bunk\b", " ▃ ", txt, flags=re.IGNORECASE)


