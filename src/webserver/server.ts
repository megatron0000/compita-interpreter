import { listen as socketio } from 'socket.io'
import { spawn, ChildProcess } from 'child_process'
import { writeFileSync, unlinkSync, readdirSync, readFileSync } from 'fs'
import { assertNotNull } from '../common';
import { resolve, join } from 'path'
import express = require('express')

const app = express()

app.get('/sample-programs', (req, res) => {
  res.json(readdirSync(join(__dirname, '../../programas-amostra/for-webserver')))
})

app.get('/sample-programs/:progname', (req, res) => {
  res.json({
    text: readFileSync(
      join(__dirname, '../../programas-amostra/for-webserver', req.params.progname),
      'utf8'
    )
  })
})

app.use('/', express.static(resolve(__dirname, '../../')))

const server = app.listen(8080, () => console.log('listening on 8080...'))

const socket = socketio(server)

const children: ChildProcess[] = []

socket.on('connection', client => {
  console.log('connected')
  let child: ChildProcess
  let inputFilename = join('/tmp', client.id)
  let timeout
  const clean = () => {
    if (clean.already) {
      return
    }
    clean.already = true
    clearTimeout(timeout)
    unlinkSync(inputFilename)
    try {
      process.kill(-child.pid, 'SIGKILL')
    } catch (err) { }
    children.splice(children.indexOf(child), 1)
  }
  clean.already = false

  client.emit('ready')

  client.once('instructions', code => {
    console.log(code)
    writeFileSync(inputFilename, code, 'utf8')
    child = spawn(
      join(__dirname, '../compita/runtime/interpreter.o'),
      [inputFilename],
      { shell: true, detached: true }
    )
    children.push(child)
    timeout = setTimeout(clean, 60 * 1000)
    assertNotNull(child.stdout).on('data', data => client.emit('stdout', data.toString()))
    assertNotNull(child.stderr).on('data', data => client.emit('stderr', data.toString()))
    child.on('close', code => {
      client.emit('stdout', '\nprocess exited with code ' + code)
      client.emit('code run complete')
      clean()
    })
    child.on('error', err => {
      client.emit('stderr', err)
      clean()
    })
    assertNotNull(child.stdin).on('error', err => console.log(err))
  })

  client.on('stdin', data => {
    assertNotNull(child.stdin).write(data)
    client.emit('stdout', data.toString())
  })

  client.on('disconnect', clean)

  client.on('wrapup', () => {
    clean()
    client.disconnect(true)
  })
})

// https://stackoverflow.com/questions/15833047/how-to-kill-all-child-processes-on-exit
process.on('SIGINT', () => process.exit(0)) // catch ctrl-c
process.on('SIGTERM', () => process.exit(0)) // catch kill
process.on('exit', () => {
  children.forEach(x => process.kill(-x.pid, 'SIGTERM'))
})