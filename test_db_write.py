import time
import argparse
import json

from pymongo.errors import BulkWriteError

from annotation_tools.annotation_tools import get_db
from annotation_tools.utils import COLOR_LIST
import uuid
import numpy as np
from multiprocessing import Pool


N = 4000
PROCS = 40


def process(proc_id):
    db = get_db()
    objects = list()
    for i in range(N):
        if np.random.random() < 0.7:
            obj = {'id': str(uuid.uuid4()), 'data': np.random.random([50]).tolist()}
            objects.append(obj)
            db.test.insert_one(obj)
        elif len(objects) > 5:
            index = np.random.randint(len(objects))
            obj = objects[index]
            db.test.delete_one({'id': obj['id']})
            del objects[index]

    return objects


def main():
    db = get_db()
    db.drop_collection('test')
    p = Pool(PROCS)
    t1 = time.time()
    outputs = p.map(process, range(PROCS))
    t2 = time.time()

    db_objects = db.test.find()
    print(N, t2 - t1)
    print(sum([len(o) for o in outputs]), db_objects.count())
    ids = {obj['id'] for o in outputs for obj in o}
    db_ids = set()
    for obj in db_objects:
        db_ids.add(obj['id'])
    print(ids == db_ids)


if __name__ == '__main__':
    main()
