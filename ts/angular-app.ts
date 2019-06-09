import angular = require('angular')
import { lex } from './lab2/lexer'
import autosize = require('autosize')
import debounce = require('debounce')
import { PrinterVisitor } from './lab3456/visualization/printer';
import { ConvertToAST } from './lab3456/conversion';
import { Parse } from './lab3456/verbosetree/parser';
import { FillSymbolTable, UniqueMainFunction, DeclareBeforeUse, ResolveTypesInPlace, IfCalledThenIsFunction, CallStatementMustReturnVoid, NoVoidIdentifier, OperandsCompatibleWithOperators, PositiveVectorDimensions, IfDeclaredThenMustInitializeAndReference, AssignmentTypeCompatibility, IndexingDimensionsMustMatch, IfWhileDoForMustHaveLogicalExpressions, ForMustBeInitializedByScalar, ForInitializerMustMatchIncrement, MustIndexWithIntLikeExpressions, ExpressionDoesNotAdmitVoidCalls, NoClashWithProgramName, NoFunctionPointers, ArgumentCountsMustMatch, ArgumentTypesMustBeCompatible, ReturnStatementMustMatchFunctionType, RecursiveCallsAreNotSupported } from './lab3456/semantics/checkers';

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
          Parse(
            sourceCodeEl.value as string
          ),
          true
        )

        new PrinterVisitor(
          msg => prettyCodeEl.value += msg + '\n',
          backmap
        ).visitProgram(ast)

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
          .concat(new RecursiveCallsAreNotSupported().execute(ast, symbolTable))

        console.log($scope.semanticalErrors)

        $scope.$apply()

      } catch (err) {
        console.log(err)
        prettyCodeEl.value = err
        $scope.symbols = []
        $scope.semanticalErrors = []
      }
      autosize.update(prettyCodeEl)
    }, 500)

  }
])

export { module }
