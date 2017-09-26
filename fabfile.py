from fabric.api import local, run, env

def host_type():
    run('uname -s')

def deploy():
    """
    Copy files from briefly-app/build/ > static
    """
    local('cd briefly-app && npm run build-turk')
    run('cd every-letter.com && rm -rf briefly')
    local('scp -r briefly-app/build-turk {}:every-letter.com/briefly'.format(env.host))
