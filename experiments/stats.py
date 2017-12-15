import pdb
from collections import defaultdict, Counter
import scipy.stats as scstats
import numpy as np

def invert_dict(data):
    ret = defaultdict(dict)
    for m, dct in data.items():
        for n, v in dct.items():
            ret[n][m] = v
    return ret

def nominal_metric(a, b):
    return a != b
def interval_metric(a, b):
    return (a-b)**2
def ratio_metric(a, b):
    return ((a-b)/(a+b))**2
def ordinal_metric(N_v, a, b):
    a, b = min(a,b), max(a,b)
    return (sum(N_v[a:b+1]) - (N_v[a] + N_v[b])/2)**2

def krippendorff_alpha(data, metric="ordinal", V=5):
    """
    Computes Krippendorff's alpha for a coding matrix V.
    V implicitly represents a M x N matrix where M is the number of
        coders and N is the number of instances.
    In reality, to represent missing values, it is a dictionary of M
    dictionaries, with each dictionary having some of N keys.
    @V is the number of elements.
    """
    data_ = invert_dict(data)

    O = np.zeros((V, V))
    E = np.zeros((V, V))
    for _, dct in data_.items():
        if len(dct) <= 1: continue
        o = np.zeros((V,V))
        for m, v in dct.items():
            for m_, v_ in dct.items():
                if m != m_:
                    o[v, v_] += 1
        M_n = len(dct)
        O += o/(M_n - 1)
    N_v = O.sum(0)
    E = (np.outer(N_v, N_v) - N_v * np.eye(V))/(sum(N_v)-1)

    if metric == "nominal":
        metric = nominal_metric
    elif metric == "interval":
        metric = lambda a, b: interval_metric(a/V, b/V)
    elif metric == "ratio":
        metric = ratio_metric
    elif metric == "ordinal":
        metric = lambda v, v_: ordinal_metric(N_v, v, v_)
    else:
        raise ValueError("Invalid metric " + metric)

    delta = np.array([[metric(v, v_) for v in range(V)] for v_ in range(V)])
    D_o = (O * delta).sum()
    D_e = (E * delta).sum()

    return 1 - D_o/D_e

def test_krippendorff_alpha():
    # Example from http://en.wikipedia.org/wiki/Krippendorff's_Alpha
    data = {
        'A': {6:2, 7:3, 8:0, 9:1, 10:0, 11:0, 12:2, 13:2, 15:2,},
        'B': {1:0, 3:1, 4:0, 5:2, 6:2, 7:3, 8:2,},
        'C': {3:1, 4:0, 5:2, 6:3, 7:3, 9:1, 10:0, 11:0, 12:2, 13:2, 15:3,},
        }
    assert np.allclose(krippendorff_alpha(data, "nominal", 4), 0.691, 5e-3)
    assert np.allclose(krippendorff_alpha(data, "interval", 4), 0.811, 5e-3)
    assert np.allclose(krippendorff_alpha(data, "ordinal", 4), 0.807, 5e-3)

def outliers_modified_z_score(ys, threshold = 3.5):
    median_y = np.median(ys)
    median_absolute_deviation_y = np.median([np.abs(y - median_y) for y in ys])
    modified_z_scores = [0.6745 * (y - median_y) / median_absolute_deviation_y
                         for y in ys]
    return np.where(np.abs(modified_z_scores) > threshold)

def outliers_modified_z_score_one_sided(ys, threshold = 3.5):
    median_y = np.median(ys)
    median_absolute_deviation_y = np.median([np.abs(y - median_y) for y in ys])
    modified_z_scores = [0.6745 * (y - median_y) / median_absolute_deviation_y
                         for y in ys]
    return np.where(np.abs(modified_z_scores) > threshold)

class Averager(dict):
    def __init__(self, *args, **kwargs):
        super().__init__(self, *args, **kwargs)
        self.counts = Counter()

    def __setitem__(self, key, value):
        self.counts[key] = 1
        super().__setitem__(self, key, value)

    def update(self, key, value):
        self.counts[key] += 1
        self[key] += (value - self[key])/self.counts[key]

def pearson_rho(data):
    """
    Given matrix of (task, worker_responses),
        computes pairs of (worker_response - avg) for every task
        and averages over all workers.
    """
    data_ = invert_dict(data)
    # get task means.
    pearson_data = defaultdict(list)
    for _, worker_responses in data_.items():
        # compute pairs,
        if len(worker_responses) < 2: continue
        avg = np.mean(list(worker_responses.values()))
        for worker, response in worker_responses.items():
            pearson_data[worker].append([response, avg])
    micro_data = np.array(sum(pearson_data.values(), []))
    micro, _ = scstats.pearsonr(micro_data.T[0], micro_data.T[1])
    macros = []
    for _, vs in pearson_data.items():
        if len(vs) < 3: continue
        vs = np.array(vs)
        rho, _ = scstats.pearsonr(vs.T[0], vs.T[1])
        if not np.isnan(rho): # uh, not sure how to handle this...
            macros.append(rho)
    return micro, np.mean(macros)

def test_pearson_rho():
    # Example from http://en.wikipedia.org/wiki/Krippendorff's_Alpha
    data = {
        'A': {6:2, 7:3, 8:0, 9:1, 10:0, 11:0, 12:2, 13:2, 15:2,},
        'B': {1:0, 3:1, 4:0, 5:2, 6:2, 7:3, 8:2,},
        'C': {3:1, 4:0, 5:2, 6:3, 7:3, 9:1, 10:0, 11:0, 12:2, 13:2, 15:3,},
        }
    micro, macro = pearson_rho(data)
    assert np.allclose(micro, 0.947, 5e-3)
    assert np.allclose(macro, 0.948, 5e-3)

def simple_agreement(data):
    """
    Computes simple agreement by taking pairs of data and simply computing probabilty that they agree.
    """
    data_ = invert_dict(data)
    ret, i = 0., 0
    for _, worker_responses in data_.items():
        # compute pairs,
        if len(worker_responses) < 2: continue
        responses = sorted(worker_responses.values())
        # get pairs
        for j, r in enumerate(responses):
            for k, r_ in enumerate(responses[j+1:]):
                # compute probability
                ret += (int(r == r_) - ret)/(i+1)
                i += 1
    return ret

def test_simple_agreement():
    # Example from http://en.wikipedia.org/wiki/Krippendorff's_Alpha
    data = {
        'A': {6:2, 7:3, 8:0, 9:1, 10:0, 11:0, 12:2, 13:2, 15:2,},
        'B': {1:0, 3:1, 4:0, 5:2, 6:2, 7:3, 8:2,},
        'C': {3:1, 4:0, 5:2, 6:3, 7:3, 9:1, 10:0, 11:0, 12:2, 13:2, 15:3,},
        }
    agreement = simple_agreement(data)
    assert np.allclose(agreement, 0.75, 5e-3)

def scaled_agreement(data):
    """
    Computes simple agreement by taking pairs of data and simply computing probabilty that they agree. using quadratic loss.
    """
    data_ = invert_dict(data)
    ret, i = 0., 0
    for _, worker_responses in data_.items():
        # compute pairs,
        if len(worker_responses) < 2: continue
        responses = sorted(worker_responses.values())
        # get pairs
        for j, r in enumerate(responses):
            for k, r_ in enumerate(responses[j+1:]):
                # compute probability
                v = 1 - abs(r - r_)/2
                ret += (v - ret)/(i+1)
                i += 1
    return ret

def test_scaled_agreement():
    # Example from http://en.wikipedia.org/wiki/Krippendorff's_Alpha
    data = {
        'A': {6:2, 7:3, 8:0, 9:1, 10:0, 11:0, 12:2, 13:2, 15:2,},
        'B': {1:0, 3:1, 4:0, 5:2, 6:2, 7:3, 8:2,},
        'C': {3:1, 4:0, 5:2, 6:3, 7:3, 9:1, 10:0, 11:0, 12:2, 13:2, 15:3,},
        }
    agreement = scaled_agreement(data)
    assert np.allclose(agreement, 0.75, 5e-3)
