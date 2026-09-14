import subprocess

ROOT = r'C:\Users\bruce\Desktop\bruce\WTC-SG-site'


def g(args):
    r = subprocess.run(['git'] + args, cwd=ROOT, capture_output=True)
    return (r.stdout.decode('utf-8', 'replace') +
            r.stderr.decode('utf-8', 'replace'))


print(g(['add', '-A']))
print(g(['reset', 'HEAD', '--', 'wtc-one-club/_extract.py']))
print('=== STAGED ===')
staged = g(['-c', 'core.quotePath=false', 'diff', '--cached', '--name-status'])
print(staged)
print('=== COMMIT ===')
print(g(['commit', '-m',
         'wtc-one-club: sync remaining local journal edits; '
         'remove superseded and unused images']))
print('=== PUSH ===')
print(g(['push', 'origin', 'main']))
