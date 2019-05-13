import angular = require('angular')
import { lex } from './lab2/lexer'
import autosize = require('autosize')
import debounce = require('debounce')
import { PrinterVisitor } from './lab3456/printer';
import { ConvertToAST } from './lab3456/conversion';
import { Parse } from './lab3456/verbosetree/parser';
import { TreeShake } from './lab3456/verbosetree/algorithms';

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
    const sourceCodeEl = document.getElementById('lab3-source-code') as HTMLTextAreaElement
    if (!sourceCodeEl) {
      throw new Error()
    }
    autosize(sourceCodeEl)

    const prettyCodeEl = document.getElementById('lab3-pretty-code') as HTMLTextAreaElement
    if (!prettyCodeEl) {
      throw new Error()
    }
    autosize(prettyCodeEl)

    $scope.onSourceChange = debounce(() => {
      prettyCodeEl.value = ''
      try {

        const [ast, backmap] = ConvertToAST(
          TreeShake(
            Parse(
              sourceCodeEl.value as string
            )
          ),
          true
        )

        new PrinterVisitor(
          msg => prettyCodeEl.value += msg + '\n',
          backmap
        ).visitProgram(ast)
        
      } catch (err) {
        prettyCodeEl.value = err
      }
      autosize.update(prettyCodeEl)
    }, 500)

  }
])

export { module }
