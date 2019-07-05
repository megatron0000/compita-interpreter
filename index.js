const proc = require('child_process')

proc.execSync('npm run compile', { stdio: 'inherit' })

proc.execSync('npm run webserver', { stdio: 'inherit' })
