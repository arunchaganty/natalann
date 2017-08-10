from fabric.api import local, run, env

def host_type():
    run('uname -s')

def deploy():
    """
    Copy files from briefly-app/build/ > static
    """
    run('cd every-letter.com && rm -rf briefly')
    local('scp -r briefly-app/build {}:every-letter.com/briefly'.format(env.host))
