# Notebook Server Extension which provides the REST services
# for {project} resources
# Extends the Tornado websocket server

import IPython
import time
from IPython.utils.path import get_ipython_dir
from IPython.html.utils import url_path_join as ujoin
from IPython.html.base.handlers import IPythonHandler, json_errors
import tornado
from tornado import web
import json
import io
import re
import IPython.nbformat.v4 as nbfv4
import IPython.nbformat as nbf
import logging
import random
import string
import shutil
import os
import html2text
from server.db import ipy_mongodb_distproject as db
import pprint

logger = logging.getLogger()

from notebook.services.config import ConfigManager

cm = ConfigManager()
nb = cm.get('notebook')


# JSON encoder for responses of pymongo operations
class Encoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        else:
            return obj


# Service endpoints:
#
#    /merge/{prid}/{bundle}:
#        POST:
#            description: Notebook with the assigned bundle has another merge.


class MergeHandler(IPythonHandler):
    @web.authenticated
    # Check request origin
    def check_origin(self, origin):
        parsed_origin = urllib.parse.urlparse(origin)
        return parsed_origin.netloc.endswith(nb['ma_server_url'] + ":" + nb['ma_server_port'])

    # GET request
    def get(self, pid, bid):
        last_merge_date = ''
        all_mergeable = True
        project = db.getProjectById(pid)
        for index, bundle in enumerate(project['bundles']):
            if not 'lastmerge' in bundle:
                all_mergeable = False
            if bundle['gid'] == bid:
                if 'lastmerge' in bundle:
                    last_merge_date = bundle['lastmerge']

        response = {'last_merge_date': last_merge_date, 'all_mergeable': all_mergeable}
        self.write(json.dumps(response))
        self.set_status(200)

    # POST requests
    def post(self, pid, bid):
        last_merge_date = time.strftime("%c")
        project = db.getProjectById(pid)
        for index, bundle in enumerate(project['bundles']):
            if bundle['gid'] == bid:
                project['bundles'][index]['lastmerge'] = last_merge_date
                db.updateProject(project)
                self.set_status(200)
                return
        self.set_status(404)

    # DELETE requests
    def delete(self, pid, bid):
        project = db.getProjectById(pid)
        for index, bundle in enumerate(project['bundles']):
            if bundle['gid'] == bid:
                if 'lastmerge' in bundle:
                  del project['bundles'][index]['lastmerge']
                  db.updateProject(project)
                self.set_status(200)
                return
        self.set_status(404)
