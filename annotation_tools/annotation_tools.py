"""
Flask web server.
"""
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import datetime
import json
import os
import random

import flask_login
from flask_login import LoginManager, UserMixin, login_required, login_user, logout_user
from flask import Flask, render_template, jsonify
from flask import Response, redirect, url_for, request, session, abort
from flask_pymongo import PyMongo
from bson import json_util

from annotation_tools import default_config as cfg

app = Flask(__name__)
#app.config.from_object('annotation_tools.default_config')
app.config['MONGO_URI'] = 'mongodb://'+cfg.MONGO_HOST+':'+str(cfg.MONGO_PORT)+'/'+cfg.MONGO_DBNAME

if 'VAT_CONFIG' in os.environ:
  app.config.from_envvar('VAT_CONFIG')
mongo = PyMongo(app)

def get_db():
  """ Return a handle to the database
  """
  with app.app_context():
    db = mongo.db
    return db

# config
app.config.update(
    SECRET_KEY = 'secret_xxx'
)

# flask-login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"


# silly user model
class User(UserMixin):
  def __init__(self, id):
    self.id = id
    self.name = 'admin'
    self.password = 'admin'
    self.is_admin = True
    if 'user' in mongo.db.collection_names():
      db_user = mongo.db.user.find_one({'username': id})
      self.name = db_user['username']
      self.password = db_user['password']
      self.is_admin = db_user['is_admin']

  def __repr__(self):
    return "%d/%s/%s" % (self.id, self.name, self.password)


# somewhere to login
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == 'POST':
        if 'user' not in mongo.db.collection_names():
            user = User('admin')
            login_user(user)
            return redirect(request.args.get("next"))

        username = request.form['username']
        password = request.form['password']
        db_user = mongo.db.user.find_one({'username': username})
        if db_user is not None and password == db_user['password']:
            id = db_user['username']
            user = User(id)
            login_user(user)
            return redirect(request.args.get("next"))
        else:
            return abort(401)
    else:
        return Response('''
        <form action="" method="post">
            <p><input type=text name=username>
            <p><input type=password name=password>
            <p><input type=submit value=Login>
        </form>
        ''')


# callback to reload the user object
@login_manager.user_loader
def load_user(userid):
  return User(userid)



# somewhere to logout
@app.route("/logout")
@login_required
def logout():
    logout_user()
    return Response('<p>Logged out</p>')


# handle login failed
@app.errorhandler(401)
def page_not_found(e):
    return Response('<p>Login failed</p>')

############### Dataset Utilities ###############

@app.route('/')
@login_required
def home():
  return render_template('layout.html')


def render_categories_names(categories):
  if len(categories) > 3:
    categories = categories[:3]
    return ', '.join([c['name'] for c in categories]) + ' ...'

  return ', '.join([c['name'] for c in categories])


@app.route('/edit_image/<image_id>')
@login_required
def edit_image(image_id):
  """ Edit a single image.
  """

  image = mongo.db.image.find_one_or_404({'id' : image_id})
  annotations = list(mongo.db.annotation.find({'image_id' : image_id}))
  categories = list(mongo.db.category.find())

  if 'cat_filter' in request.args:
    cat_filter = request.args['cat_filter'].split(',')
    categories = [c for c in categories if c['id'] in cat_filter]
    annotations = [a for a in annotations if a['category_id'] in cat_filter]

  image = json_util.dumps(image)
  annotations = json_util.dumps(annotations)
  categories = json_util.dumps(categories)

  if request.is_xhr:
    # Return just the data
    return jsonify({
      'image' : json.loads(image),
      'annotations' : json.loads(annotations),
      'categories' : json.loads(categories)
    })
  else:
    # Render a webpage to edit the annotations for this image
    return render_template('edit_image.html', image=image, annotations=annotations, categories=categories,
                           categories_names=render_categories_names(categories))


@app.route('/operations/')
@login_required
def operations():
  if flask_login.current_user.is_admin:
    return render_template('operations.html')
  else:
    return abort(401)


@app.route('/api/operations/')
def api_operations():
  return jsonify([])


@app.route('/edit_task/')
@login_required
def edit_task():
  """ Edit a group of images.
  """

  if 'image_ids' in request.args:

    image_ids = request.args['image_ids'].split(',')

  else:

    start=0
    if 'start' in request.args:
      start = int(request.args['start'])
    end=None
    if 'end' in request.args:
      end = int(request.args['end'])

    # Find annotations and their accompanying images for this category
    if 'category_id' in request.args:
      category_id = request.args['category_id']
      annos = mongo.db.annotation.find({ "category_id" : category_id}, projection={'image_id' : True, '_id' : False})#.sort([('image_id', 1)])
      image_ids = list(set([anno['image_id'] for anno in annos]))
      image_ids.sort()

    # Else just grab all of the images.
    else:
      images = mongo.db.image.find(projection={'id' : True, '_id' : False}).sort([('id', 1)])
      image_ids = [image['id'] for image in images]

    if end is None:
      image_ids = image_ids[start:]
    else:
      image_ids = image_ids[start:end]

    if 'randomize' in request.args:
      if request.args['randomize'] >= 1:
        random.shuffle(image_ids)

  categories = list(mongo.db.category.find(projection={'_id' : False}))
  if 'cat_filter' in request.args:
    cat_filter = request.args['cat_filter'].split(',')
    categories = [c for c in categories if c['id'] in cat_filter]

  return render_template('edit_task.html',
    task_id=1,
    image_ids=image_ids,
    categories=categories,
    categories_names=render_categories_names(categories)
  )

@app.route('/annotations/save', methods=['POST'])
@login_required
def save_annotations():
  """ Save the annotations. This will overwrite annotations.
  """
  annotations = json_util.loads(json.dumps(request.json['annotations']))
  image = json_util.loads(json.dumps(request.json['image']))

  deleted_annotations_count = 0
  added_annotations_count = 0
  modified_annotations_count = 0

  for annotation in annotations:
    # Is this an existing annotation?
    if '_id' in annotation:
      if 'deleted' in annotation and annotation['deleted']:
        mongo.db.annotation.delete_one({'_id' : annotation['_id']})
        deleted_annotations_count += 1
      else:
        replace_result = mongo.db.annotation.replace_one({'_id' : annotation['_id']}, annotation)
        modified_annotations_count += replace_result.modified_count
    else:
      if 'deleted' in annotation and annotation['deleted']:
        pass # this annotation was created and then deleted.
      else:
        # This is a new annotation
        # The client should have created an id for this new annotation
        # Upsert the new annotation so that we create it if its new, or replace it if (e.g) the
        # user hit the save button twice, so the _id field was never seen by the client.
        assert 'id' in annotation
        replace_result = mongo.db.annotation.replace_one({'id' : annotation['id']}, annotation, upsert=True)
        added_annotations_count += 1

        # if 'id' not in annotation:
        #   insert_res = mongo.db.annotation.insert_one(annotation, bypass_document_validation=True)
        #   anno_id =  insert_res.inserted_id
        #   mongo.db.annotation.update_one({'_id' : anno_id}, {'$set' : {'id' : str(anno_id)}})
        # else:
        #   insert_res = mongo.db.insert_one(annotation)

  operation_record = dict()
  operation_record['user'] = flask_login.current_user.name
  operation_record['image_id'] = image['id']
  operation_record['time'] = datetime.datetime.now()
  operation_record['bbox_deleted'] = deleted_annotations_count
  operation_record['bbox_added'] = added_annotations_count
  operation_record['bbox_modified'] = modified_annotations_count
  mongo.db.operation.insert_one(operation_record)

  return ""

#################################################

################## BBox Tasks ###################

@app.route('/bbox_task/<task_id>')
@login_required
def bbox_task(task_id):
  """ Get the list of images for a bounding box task and return them along
  with the instructions for the task to the user.
  """

  bbox_task = mongo.db.bbox_task.find_one_or_404({'id' : task_id})
  task_id = str(bbox_task['id'])
  tasks = []
  for image_id in bbox_task['image_ids']:
    image = mongo.db.image.find_one_or_404({'id' : image_id}, projection={'_id' : False})
    tasks.append({
      'image' : image,
      'annotations' : []
    })

  category_id = bbox_task['category_id']
  categories = [mongo.db.category.find_one_or_404({'id' : category_id}, projection={'_id' : False})]
  #categories = json.loads(json_util.dumps(categories))

  task_instructions_id = bbox_task['instructions_id']
  task_instructions = mongo.db.bbox_task_instructions.find_one_or_404({'id' : task_instructions_id}, projection={'_id' : False})

  return render_template('bbox_task.html',
    task_id=task_id,
    task_data=tasks,
    categories=categories,
    mturk=True,
    task_instructions=task_instructions,
    categories_names=render_categories_names(categories)
  )

@app.route('/bbox_task/save', methods=['POST'])
@login_required
def bbox_task_save():
  """ Save the results of a bounding box task.
  """

  task_result = json_util.loads(json.dumps(request.json))

  task_result['date'] = str(datetime.datetime.now())

  insert_res = mongo.db.bbox_task_result.insert_one(task_result, bypass_document_validation=True)

  return ""

#################################################
