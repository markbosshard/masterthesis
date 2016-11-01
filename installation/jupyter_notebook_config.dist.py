#--- nbextensions configuration ---
from jupyter_core.paths import jupyter_config_dir, jupyter_data_dir
import os
import sys

sys.path.append(os.path.join(jupyter_data_dir(), 'extensions'))

c = get_config()
c.NotebookApp.extra_template_paths = [os.path.join(jupyter_data_dir(),'templates') ]


#--- nbextensions configuration ---
from jupyter_core.paths import jupyter_config_dir, jupyter_data_dir
#from IPython.utils.path import get_ipython_dir
import os
import sys

sys.path.append(os.path.join(jupyter_data_dir(), 'extensions'))
c = get_config()
#c.NotebookApp.extra_template_paths = [os.path.join(jupyter_data_dir(),'templates') ]
#ipythondir = get_ipython_dir()

ma_extensions = os.path.join(jupyter_data_dir(),'nbextensions/ma')

sys.path.append( ma_extensions )

c.NotebookApp.server_extensions = ['server_extensions']
c.NotebookApp.extra_template_paths = [os.path.join(ma_extensions,'client/html/templates') ]
c.InteractiveShellApp.exec_lines = [ 'import notebook_importing' ]

c.NotebookApp.certfile = '/home/jupyter/certs/fullchain.pem'
c.NotebookApp.keyfile = '/home/jupyter/certs/privkey.pem'
c.NotebookApp.ip = 'www.hostname.com'

# Whether to open in a browser after starting. The specific browser used is
# platform dependent and determined by the python standard library `webbrowser`
# module, unless it is overridden using the --browser (NotebookApp.browser)
# configuration option.
c.NotebookApp.open_browser = False

# The string should be of the form type:salt:hashed-password.
c.NotebookApp.password = 'sha1:8abcdef0123e:bffabcdefabcdefabcdef1231231231231231123'

# The port the notebook server will listen on.
c.NotebookApp.port = 8989 # To prevent being a target of automatic scanners

