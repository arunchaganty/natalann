"""
Utilities to perturb data
"""
from collections import namedtuple

Token = namedtuple("Token", ["word", "ner"])

# input is annotation object.
def parse_text(ann):
    return [[Token(t.word, t.ner) for t in s.tokens] for s in ann.sentence]

def to_text(doc):
    return " ".join(t.word for s in doc for t in s)

def chunk_tokens(sentence):
    ret = []
    tag, stack = None, []
    for t in sentence:
        if t.ner != tag:
            if stack:
                ret.append((stack,tag))
            tag = t.ner
        stack.append(t)
    if stack:
        ret.append((stack, tag))
    return ret

# assumes that references are 5s.
def perturb_grammar(doc):
    """
    Scramble words in each sentence.
    """
    return [sorted(sentence, key=lambda t: hash(t.word + t.ner_tag)) for sentence in doc]

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
        for chunk, tag in chunk_tokens(sentence):
            if tag == 'PERSON':
                sentence_.append(Token('she', tag))
            elif tag == 'ORGANIZATION':
                sentence_.append(Token('organization', tag))
            elif tag == 'LOCATION':
                sentence_.append(Token('there', tag))
            else:
                sentence_.extend([Token(w, tag) for w in chunk])
        ret.append(sentence_)
    return sentence_

def perturb_focus(txt, txt_):
    """
    join sentences from two different summaries.
    """
    assert len(txt) > 1 and len(txt_) > 1
    ret, ret_ = [], []
    for i, (sentence, sentence_) in enumerate(zip(txt, txt_)):
        if i % 2 == 0:
            ret.append(sentence)
            ret_.append(sentence_)
        else:
            ret_.append(sentence)
            ret.append(sentence_)
    return ret, ret_

def perturb_coherence(txt):
    """
    shuffle sentences around.
    """
    return sorted(txt, key=lambda s: sum(hash(t) for t in s))

def fix_unks(txt):
    return txt.replace(" unk ", " ▃").replace(" UNK ", " ▃")
