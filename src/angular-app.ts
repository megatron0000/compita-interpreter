import angular = require('angular')
import { lex } from './lab2/lexer'
import autosize = require('autosize')
import debounce = require('debounce')
import { PrinterVisitor } from './compita/visualization/printer';
import { ConvertToAST } from './compita/conversion';
import { Parse } from './compita/verbosetree/parser';
import { FillSymbolTable, UniqueMainFunction, DeclareBeforeUse, ResolveTypesInPlace, IfCalledThenIsFunction, CallStatementMustReturnVoid, NoVoidIdentifier, OperandsCompatibleWithOperators, PositiveVectorDimensions, IfDeclaredThenMustInitializeAndReference, AssignmentTypeCompatibility, IndexingDimensionsMustMatch, IfWhileDoForMustHaveLogicalExpressions, ForMustBeInitializedByScalar, ForInitializerMustMatchIncrement, MustIndexWithIntLikeExpressions, ExpressionDoesNotAdmitVoidCalls, NoClashWithProgramName, NoFunctionPointers, ArgumentCountsMustMatch, ArgumentTypesMustBeCompatible, ReturnStatementMustMatchFunctionType, RecursiveCallsAreNotSupported } from './compita/semantics/checkers';
import { assertNotNull } from './common';
import { Assemble } from './compita/intermediate/assembler';
import { Serialize } from './compita/intermediate/serializer';
import io from 'socket.io-client'

function setPrettyCode(text: string) {
  const event = new Event('prettyCodeChanged')
  //@ts-ignore
  event.prettyCode = text
  window.dispatchEvent(event)
}

const module = angular.module('CompilerApp', [])

module.controller('Lab2Controller', [
  '$scope',
  $scope => {
    $scope.sentence_input = ''
    $scope.question_number_input = 1

    $scope.on_sentence_change = function () {
      $scope.sentence_tokens = lex($scope.sentence_input)
    }
  }
])

module.controller('Lab3Controller', [
  '$scope',
  $scope => {
    $scope.symbols = []
    $scope.semanticalErrors = []
    $scope.assembly = null
    $scope.finished = true
    $scope.samplePrograms = []
    //@ts-ignore
    window.getSemanticErrors = () => {
      return $scope.semanticalErrors
    }

    const sourceCodeEl = document.getElementById('lab3-source-code') as HTMLTextAreaElement
    if (!sourceCodeEl) {
      throw new Error()
    }
    autosize(sourceCodeEl)
    const remoteStdinEl = document.getElementById('remote-stdin') as HTMLTextAreaElement
    autosize(remoteStdinEl)

    const astEl = assertNotNull(document.getElementById('ast'))

    fetchSampleProgramNames().then(progs => {
      $scope.samplePrograms = progs
      $scope.$apply()
    })

    $scope.onSourceChange = debounce(() => {
      try {

        let [ast, backmap] = ConvertToAST(
          Parse(
            sourceCodeEl.value as string
          ),
          true
        )

        let prettyCode = ''
        new PrinterVisitor(
          msg => prettyCode += msg + '\n',
          backmap
        ).visitProgram(ast)

        console.log(prettyCode)
        setPrettyCode(prettyCode);

        [ast, backmap] = ConvertToAST(Parse(prettyCode as string), true)

        const str = JSON.stringify(ast, undefined, 4);

        astEl.innerHTML = syntaxHighlight(str);

        const [symbolTable, errors] = new FillSymbolTable().execute(ast)

        new ResolveTypesInPlace().execute(ast, symbolTable)

        $scope.symbols = symbolTable.dump()
        $scope.semanticalErrors = errors
          .concat(new UniqueMainFunction().execute(ast, symbolTable))
          .concat(new DeclareBeforeUse().execute(ast, symbolTable))
          .concat(new IfCalledThenIsFunction().execute(ast, symbolTable))
          .concat(new CallStatementMustReturnVoid().execute(ast, symbolTable))
          .concat(new NoVoidIdentifier().execute(ast, symbolTable))
          .concat(new OperandsCompatibleWithOperators().execute(ast, symbolTable))
          .concat(new PositiveVectorDimensions().execute(ast, symbolTable))
          .concat(new IfDeclaredThenMustInitializeAndReference().execute(ast, symbolTable))
          .concat(new AssignmentTypeCompatibility().execute(ast, symbolTable))
          .concat(new IndexingDimensionsMustMatch().execute(ast, symbolTable))
          .concat(new IfWhileDoForMustHaveLogicalExpressions().execute(ast, symbolTable))
          .concat(new ForMustBeInitializedByScalar().execute(ast, symbolTable))
          .concat(new ForInitializerMustMatchIncrement().execute(ast, symbolTable))
          .concat(new MustIndexWithIntLikeExpressions().execute(ast, symbolTable))
          .concat(new ExpressionDoesNotAdmitVoidCalls().execute(ast, symbolTable))
          .concat(new NoClashWithProgramName().execute(ast, symbolTable))
          .concat(new NoFunctionPointers().execute(ast, symbolTable))
          .concat(new ArgumentCountsMustMatch().execute(ast, symbolTable))
          .concat(new ArgumentTypesMustBeCompatible().execute(ast, symbolTable))
          .concat(new ReturnStatementMustMatchFunctionType().execute(ast, symbolTable))
          //.concat(new RecursiveCallsAreNotSupported().execute(ast, symbolTable))
          .map(error => ({
            ...error,
            ...error.localize(backmap)
          }))

        if ($scope.semanticalErrors.length === 0) {
          $scope.assembly = Serialize(Assemble(ast)).split('\n')
            .filter(x => x)
            .map((x, i) => ({ text: x, address: i }))
        } else {
          $scope.assembly = null
        }

        $scope.$apply()

      } catch (err) {
        console.log(err)
        setPrettyCode(err.toString())
        $scope.assembly = null
        $scope.symbols = []
        $scope.semanticalErrors = []
        astEl.innerHTML = ''
      }

    }, 500)

    let socket
    $scope.runCode = () => {
      if (!$scope.finished) {
        socket && socket.emit('wrapup')
        return
      }
      if (!$scope.assembly) {
        return
      }
      if (socket) {
        socket.close()
      }
      socket = io(
        (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/'
      )
      socket.on('ready', () => {
        console.log('ready')
        socket.emit('instructions', $scope.assembly.map(x => x.text).join('\n') + '\n')
        $scope.finished = false
        $scope.output = ''
        $scope.$apply()
        socket.on('stderr', stderr => {
          console.log(stderr)
          $scope.output += stderr
          $scope.$apply()
        })

        socket.on('stdout', stdout => {
          console.log(stdout)
          $scope.output += stdout
          $scope.$apply()
        })

        socket.on('error', () => {
          socket.close()
          $scope.finished = true
          console.log('error')
        })

        socket.on('close', () => {
          socket.close()
          $scope.finished = true
          console.log('close')
        })

        socket.on('disconnect', () => {
          socket.close()
          $scope.output += '\ndisconnected'
          $scope.finished = true
          $scope.$apply()
          console.log('disconnect')
        })

        socket.on('code run complete', () => {
          socket.close()
          $scope.finished = true
          $scope.$apply()
          console.log('finished running code')
        })
      })

    }

    $scope.onStdinChange = () => setTimeout(() => autosize.update(remoteStdinEl), 100)
    $scope.sendStdin = () => {
      if ($scope.finished) {
        return
      }
      socket && socket.emit('stdin', remoteStdinEl.value)
      remoteStdinEl.value = ''
      $scope.$apply()
    }

    $scope.downloadSample = progname => {
      const req = new XMLHttpRequest()
      req.open('GET', '/sample-programs/' + progname)
      req.onload = () => {
        if (req.status !== 200) return

        const { text: programCode } = JSON.parse(req.responseText)
        sourceCodeEl.value = programCode
        autosize.update(sourceCodeEl)
        $scope.onSourceChange()
      }
      req.send()
    }
  }
])

export { module }


// https://stackoverflow.com/questions/4810841/how-can-i-pretty-print-json-using-javascript
function syntaxHighlight(json) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    var cls = 'number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'key';
      } else {
        cls = 'string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'boolean';
    } else if (/null/.test(match)) {
      cls = 'null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}

function fetchSampleProgramNames() {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest()
    req.open('GET', '/sample-programs')
    req.onload = () => {
      if (req.status !== 200) return reject()

      return resolve(JSON.parse(req.responseText))
    }
    req.send()
  })
}